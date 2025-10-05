import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, CheckSquare, GitCommit } from 'lucide-react';
import VoteControls from './VoteControls';

export default function VoteStats({ proposal, votes = [], projectId, onVote, userHasVoted, isDisabled = false }) {
  const totalVotes = votes.length;
  const supportVotes = votes.filter(v => v.vote_type === 'support').length;
  const opposeVotes = votes.filter(v => v.vote_type === 'oppose').length;
  
  const supportPercentage = totalVotes > 0 ? (supportVotes / totalVotes) * 100 : 0;
  const opposePercentage = totalVotes > 0 ? (opposeVotes / totalVotes) * 100 : 0;
  
  // Mock data for demo
  const quorum = 50;
  const quorumReached = totalVotes >= quorum;
  const timeLeft = '3 days, 12 hours';

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      {/* Percentage Results */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className={`font-bold text-lg ${
            isDisabled ? 'text-slate-500' : 'text-orange-400'
          }`}>
            {supportPercentage.toFixed(1)}% Support
          </span>
          <span className={`font-bold text-lg ${
            isDisabled ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {opposePercentage.toFixed(1)}% Oppose
          </span>
        </div>
        <div className={`flex w-full h-3 rounded-full overflow-hidden ${
          isDisabled ? 'bg-slate-800' : 'bg-slate-700'
        }`}>
          <div
            className={`shadow-lg ${
              isDisabled 
                ? 'bg-slate-600' 
                : 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/30'
            }`}
            style={{ width: `${supportPercentage}%` }}
          />
          <div
            className="bg-slate-500"
            style={{ width: `${opposePercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        <div className={`p-4 rounded-xl ${
          isDisabled ? 'bg-slate-800/30' : 'bg-slate-800/50'
        }`}>
          <Clock className={`mx-auto w-6 h-6 mb-2 ${
            isDisabled ? 'text-slate-600' : 'text-slate-400'
          }`} />
          <div className={`font-bold ${
            isDisabled ? 'text-slate-500' : 'text-white'
          }`}>
            {isDisabled ? 'Ended' : timeLeft}
          </div>
          <div className="text-sm text-slate-500">
            {isDisabled ? 'Voting' : 'Time Left'}
          </div>
        </div>
        <div className={`p-4 rounded-xl ${
          isDisabled ? 'bg-slate-800/30' : 'bg-slate-800/50'
        }`}>
          <Users className={`mx-auto w-6 h-6 mb-2 ${
            isDisabled ? 'text-slate-600' : 'text-slate-400'
          }`} />
          <div className={`font-bold ${
            isDisabled ? 'text-slate-500' : 'text-white'
          }`}>
            {totalVotes}
          </div>
          <div className="text-sm text-slate-500">Participants</div>
        </div>
        <div className={`p-4 rounded-xl ${
          isDisabled ? 'bg-slate-800/30' : 'bg-slate-800/50'
        } ${quorumReached && !isDisabled ? 'border-2 border-green-500/50' : ''}`}>
          <CheckSquare className={`mx-auto w-6 h-6 mb-2 ${
            isDisabled ? 'text-slate-600' : 'text-slate-400'
          }`} />
          <div className={`font-bold ${
            isDisabled ? 'text-slate-500' : 
            quorumReached ? 'text-green-400' : 'text-white'
          }`}>
            {totalVotes} / {quorum}
          </div>
          <div className="text-sm text-slate-500">Quorum</div>
        </div>
        <div className={`p-4 rounded-xl ${
          isDisabled ? 'bg-slate-800/30' : 'bg-slate-800/50'
        }`}>
          <GitCommit className={`mx-auto w-6 h-6 mb-2 ${
            isDisabled ? 'text-slate-600' : 'text-slate-400'
          }`} />
          <div className={`font-bold cursor-pointer ${
            isDisabled 
              ? 'text-slate-500' 
              : 'text-white hover:text-orange-400'
          }`}>
            View on-chain
          </div>
          <div className="text-sm text-slate-500">Ledger</div>
        </div>
      </div>

      {/* Vote Controls - now integrated here for desktop */}
      <div className="pt-4">
        <VoteControls
          projectId={projectId}
          onVote={onVote}
          userHasVoted={userHasVoted}
          isDisabled={isDisabled}
        />
      </div>
    </motion.div>
  );
}