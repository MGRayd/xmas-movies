import React from 'react';
import { Round, RoundType } from '../types/quiz';

interface RoundSelectorProps {
  rounds: Round[];
  completedRounds: string[];
  onSelectRound: (roundIndex: number) => void;
  currentRoundIndex: number | null;
  roundScores?: {[roundId: string]: number};
  quizFinished?: boolean;
  onSubmitFinalScore?: () => void;
}

const RoundSelector: React.FC<RoundSelectorProps> = ({
  rounds,
  completedRounds,
  onSelectRound,
  currentRoundIndex,
  roundScores = {},
  quizFinished = false,
  onSubmitFinalScore
}) => {
  // Helper function to get appropriate icon for round type
  const getRoundTypeIcon = (type: RoundType) => {
    switch (type) {
      case RoundType.PICTURE:
        return <i className="fas fa-image text-info"></i>;
      case RoundType.MUSIC:
        return <i className="fas fa-music text-success"></i>;
      case RoundType.TRIVIA:
        return <i className="fas fa-lightbulb text-warning"></i>;
      case RoundType.CHRISTMAS:
        return <i className="fas fa-holly-berry text-error"></i>;
      default:
        return <i className="fas fa-question-circle text-primary"></i>;
    }
  };

  return (
    <div className="bg-xmas-card rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-christmas text-xmas-gold">{quizFinished ? 'Review Your Rounds' : 'Choose a Round'}</h2>
        {quizFinished && onSubmitFinalScore && (
          <div>
            <button 
              className="btn btn-primary"
              onClick={onSubmitFinalScore}
            >
              <i className="fas fa-trophy mr-2"></i> Submit Final Score
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rounds.map((round, index) => {
          const isCompleted = completedRounds.includes(round.id);
          const isActive = currentRoundIndex === index;
          
          return (
            <button
              key={round.id}
              className={`p-5 rounded-lg border transition-all ${
                isActive 
                  ? 'bg-xmas-gold bg-opacity-20 border-xmas-gold' 
                  : isCompleted
                    ? 'bg-success bg-opacity-10 border-success border-opacity-30'
                    : 'bg-xmas-card hover:bg-xmas-gold hover:bg-opacity-10 border-xmas-gold border-opacity-30'
              }`}
              onClick={() => onSelectRound(index)}
            >
              <div className="flex items-center gap-4">
                <div className="text-xl">
                  {getRoundTypeIcon(round.type)}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-christmas text-lg">{round.title}</h3>
                  <p className="text-sm text-xmas-text text-opacity-80 line-clamp-3 h-14">{round.description}</p>
                </div>
                {isCompleted && (
                  <div className="text-success flex flex-col items-end">
                    <i className="fas fa-check-circle"></i>
                    {roundScores && roundScores[round.id] !== undefined && (
                      <span className="text-xs mt-1 font-bold">{roundScores[round.id]} pts</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {quizFinished && (
        <div className="mt-6 p-4 bg-success bg-opacity-10 border border-success border-opacity-30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xl text-success">
                <i className="fas fa-check-circle"></i>
              </div>
              <div>
                <h3 className="font-christmas text-lg">All Rounds Completed!</h3>
                <p className="text-sm">Click on any round to review your answers or submit your final score.</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm">Total Score</div>
              <div className="text-2xl font-bold text-success">
                {Object.values(roundScores).reduce((sum, score) => sum + score, 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoundSelector;
