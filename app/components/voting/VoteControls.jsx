import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Circle } from 'lucide-react';

export default function VoteControls({ projectId, onVote, userHasVoted, isDisabled = false }) {
  const [voted, setVoted] = useState(userHasVoted);
  
  const handleVote = (voteType) => {
    if (isDisabled) return;
    onVote(projectId, voteType);
    setVoted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mt-6"
    >
      <Button
        onClick={() => handleVote('support')}
        disabled={voted || isDisabled}
        className={`w-full sm:w-auto text-base font-semibold py-4 px-8 lg:py-3 lg:px-6 text-white border-0 ${
          isDisabled 
            ? 'bg-slate-700 cursor-not-allowed opacity-50' 
            : voted 
              ? 'bg-slate-600 opacity-50' 
              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
        }`}
      >
        <ThumbsUp className="w-4 h-4 mr-2" />
        Support
      </Button>
      <Button
        onClick={() => handleVote('abstain')}
        disabled={voted || isDisabled}
        className={`w-full sm:w-auto text-base font-semibold py-4 px-8 lg:py-3 lg:px-6 text-white border-0 ${
          isDisabled 
            ? 'bg-slate-800 cursor-not-allowed opacity-50' 
            : voted 
              ? 'bg-slate-700 opacity-50' 
              : 'bg-slate-700 hover:bg-slate-800'
        }`}
      >
        <Circle className="w-3 h-3 mr-2" />
        Abstain
      </Button>
      <Button
        onClick={() => handleVote('oppose')}
        disabled={voted || isDisabled}
        className={`w-full sm:w-auto text-base font-semibold py-4 px-8 lg:py-3 lg:px-6 text-white border-0 ${
          isDisabled 
            ? 'bg-slate-700 cursor-not-allowed opacity-50' 
            : voted 
              ? 'bg-slate-600 opacity-50' 
              : 'bg-slate-500 hover:bg-slate-600'
        }`}
      >
        <ThumbsDown className="w-4 h-4 mr-2" />
        Oppose
      </Button>
      
      {isDisabled && (
        <div className="text-sm text-slate-500 text-center sm:text-left mt-2 sm:mt-0 sm:ml-4">
          Voting has ended for this proposal
        </div>
      )}
    </motion.div>
  );
}