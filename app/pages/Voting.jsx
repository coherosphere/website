
import React, { useState, useEffect } from "react";
import { Proposal, Vote, User } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import { Vote as VoteIcon, AlertTriangle, Clock, CheckCircle, X, Calendar, TrendingUp, Filter, FileText, GitMerge, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import ResonanceVisualizer from "@/components/voting/ResonanceVisualizer";
import VoteStats from "@/components/voting/VoteStats";

export default function Voting() {
  const [proposals, setProposals] = useState([]);
  const [votes, setVotes] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [userVotes, setUserVotes] = useState({});
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProposals: 0,
    votingProposals: 0,
    totalVotes: 0,
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);

      try {
        const user = await User.me();
        if (isMounted) setCurrentUser(user);

        const proposalData = await Proposal.list();
        await new Promise(resolve => setTimeout(resolve, 200));
        const voteData = await Vote.list();

        if (isMounted) {
          const votesByProposal = voteData.reduce((acc, vote) => {
            const proposalId = vote.proposal_id || vote.project_id;
            if (proposalId) { // Ensure proposalId is valid
                if (!acc[proposalId]) acc[proposalId] = [];
                acc[proposalId].push(vote);
            }
            return acc;
          }, {});

          const sortedProposals = proposalData; // No initial sort needed, will be done in filteredProposals
          
          setProposals(sortedProposals);
          setVotes(votesByProposal);
          
          setStats({
            totalProposals: proposalData.length,
            votingProposals: proposalData.filter(p => p.status === 'voting').length,
            totalVotes: voteData.length,
          });
          
          console.log(`Loaded ${sortedProposals.length} governance proposals.`);
        }
      } catch (err) {
        console.error("Error loading voting data:", err);
        if (isMounted) setError("Failed to load voting data. Please try refreshing the page.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => { isMounted = false; };
  }, []);

  const handleVote = async (proposalId, voteType) => {
    const voterId = currentUser?.id || `user_${Math.random().toString(36).substr(2, 9)}`;
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newVote = await Vote.create({
        proposal_id: proposalId,
        voter_id: voterId,
        vote_type: voteType,
        weight: 1.0,
      });
      setVotes(prev => ({ ...prev, [proposalId]: [...(prev[proposalId] || []), newVote] }));
      setUserVotes(prev => ({ ...prev, [proposalId]: true }));
    } catch (error) {
      console.error("Error casting vote:", error);
      setError("Failed to cast vote. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const categoryColors = {
    governance: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    treasury: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    policy: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    technical: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    community: 'bg-green-500/20 text-green-400 border-green-500/30',
    default: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const statusConfig = {
    draft: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: FileText, label: 'Draft' },
    voting: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: VoteIcon, label: 'Voting' },
    passed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle, label: 'Passed' },
    rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: X, label: 'Rejected' },
    implemented: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: GitMerge, label: 'Implemented' },
    default: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Archive, label: 'Archived' },
  };

  const filteredProposals = () => {
    let filtered = proposals;
    if (selectedFilter !== 'all') {
      filtered = proposals.filter(p => p.status === selectedFilter);
    }
    
    const statusPriority = {
      voting: 1,
      draft: 2,
      proposed: 2, // Assuming 'proposed' might be another draft-like status
      passed: 3,
      rejected: 3,
      implemented: 3,
    };

    return filtered.sort((a, b) => {
      const priorityA = statusPriority[a.status] || 4;
      const priorityB = statusPriority[b.status] || 4;

      if (priorityA !== priorityB) {
        return priorityA - priorityB; // Lower priority number comes first
      }

      // If same priority, sort by specific criteria
      if (a.status === 'voting') {
        // For voting proposals, sort by deadline descending (more time left = higher)
        const deadlineA = a.voting_deadline ? new Date(a.voting_deadline).getTime() : 0;
        const deadlineB = b.voting_deadline ? new Date(b.voting_deadline).getTime() : 0;
        // If deadlines are equal, fall back to created date
        if (deadlineA !== deadlineB) {
          return deadlineB - deadlineA; // Descending order for deadline
        }
      } 
      
      // For all other statuses, sort by creation date descending (newest first)
      const createdA = new Date(a.created_date).getTime();
      const createdB = new Date(b.created_date).getTime();
      return createdB - createdA;
    });
  };
  
  const getTimeRemaining = (proposal) => {
    if (proposal.status !== 'voting' || !proposal.voting_deadline) return null;
    const now = new Date();
    const deadline = new Date(proposal.voting_deadline);
    const diffTime = deadline - now;
    if (diffTime <= 0) return "Voting ended";
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} left`;
  };

  return (
    <div className="p-3 lg:p-8">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <div className="text-orange-400 font-medium">{error}</div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <VoteIcon className="w-12 h-12 text-orange-500 flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>
              Governance
            </h1>
            <div className="w-16 h-1 bg-orange-500 mt-2 rounded-full"></div>
          </div>
        </div>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Participate in decisions and shape the future of coherosphere.
        </p>
      </div>

      {/* NEW: Top Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            <VoteIcon className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.totalProposals}</div>
            <div className="text-slate-400 text-sm">Total Proposals</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.votingProposals}</div>
            <div className="text-slate-400 text-sm">Voting Now</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.totalVotes}</div>
            <div className="text-slate-400 text-sm">Total Votes Cast</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Filter Proposals</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Proposals', count: proposals.length },
              { key: 'draft', label: 'Draft', count: proposals.filter(p=>p.status==='draft').length },
              { key: 'voting', label: 'Voting', count: proposals.filter(p=>p.status==='voting').length },
              { key: 'passed', label: 'Passed', count: proposals.filter(p=>p.status==='passed').length },
              { key: 'rejected', label: 'Rejected', count: proposals.filter(p=>p.status==='rejected').length },
              { key: 'implemented', label: 'Implemented', count: proposals.filter(p=>p.status==='implemented').length },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFilter(filter.key)}
                className={`filter-chip h-auto justify-between min-w-fit whitespace-nowrap ${selectedFilter === filter.key ? 'active' : ''}`}
              >
                <span className="flex-shrink-0">{filter.label}</span>
                <Badge 
                  variant="secondary" 
                  className={`ml-[3px] transition-colors duration-200 flex-shrink-0 ${
                    selectedFilter === filter.key
                    ? 'bg-black/20 text-white' 
                    : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {filter.count || 0}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Voting Proposals */}
      <div className="space-y-8 lg:space-y-12">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <motion.div
              className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        ) : filteredProposals().length > 0 ? (
          filteredProposals().map((proposal, index) => {
            const isClosedForInteraction = ['passed', 'rejected', 'implemented'].includes(proposal.status);
            const canVote = proposal.status === 'voting' && proposal.voting_deadline && new Date() < new Date(proposal.voting_deadline);
            const timeRemaining = getTimeRemaining(proposal);
            const currentStatusConfig = statusConfig[proposal.status] || statusConfig.default;
            
            return (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className={`transition-all duration-300 ${
                  isClosedForInteraction 
                    ? 'bg-slate-800/20 border-slate-800 opacity-60 cursor-not-allowed'
                    : 'bg-slate-800/50 backdrop-blur-sm border border-slate-700'
                }`}>
                  <CardHeader>
                    <CardTitle className={`text-2xl font-bold mb-2 ${
                      isClosedForInteraction ? 'text-slate-500' : 'text-white'
                    }`}>
                      {proposal.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={`border text-xs ${categoryColors[proposal.category?.toLowerCase()] || categoryColors.default} ${
                          isClosedForInteraction ? 'opacity-50' : ''
                        }`}
                      >
                        {proposal.category}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`border text-xs ${currentStatusConfig.color} ${
                          isClosedForInteraction ? 'opacity-50' : ''
                        }`}
                      >
                        {currentStatusConfig.label}
                      </Badge>
                      {proposal.created_date && (
                        <div className={`text-xs flex items-center gap-1 ${
                          isClosedForInteraction ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          Created {new Date(proposal.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                        </div>
                      )}
                      {timeRemaining && (
                        <div className={`text-xs flex items-center gap-1 ${canVote ? 'text-orange-400' : 'text-slate-500'}`}>
                          <Clock className="w-3 h-3" />
                          {timeRemaining}
                        </div>
                      )}
                    </div>
                    <p className={`${isClosedForInteraction ? 'text-slate-600' : 'text-slate-400'}`}>
                      {proposal.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid lg:grid-cols-2 gap-8 items-start">
                      <div className={isClosedForInteraction ? 'opacity-50' : ''}>
                        <ResonanceVisualizer votes={votes[proposal.id]} />
                      </div>
                      <VoteStats 
                        proposal={proposal} 
                        votes={votes[proposal.id]}
                        projectId={proposal.id}
                        onVote={handleVote}
                        userHasVoted={userVotes[proposal.id]}
                        isDisabled={!canVote}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        ) : (
          <div className="text-center py-20">
            <VoteIcon className="mx-auto w-16 h-16 text-slate-600 mb-4" />
            <h2 className="text-2xl font-bold text-white">
              No Proposals Available
            </h2>
            <p className="text-slate-400 mt-2">
              {selectedFilter === 'all' ? 'Check back soon for new governance proposals.' :
               `No proposals found with status "${selectedFilter}".`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
