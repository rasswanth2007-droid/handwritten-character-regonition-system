import React from 'react';
import { Sparkles, Cpu } from 'lucide-react';

const EnsembleBadge = ({ result }) => {
  if (!result) return null;

  const isGemini = result.correction_source === 'gemini';

  return (
    <div className="flex items-center justify-center mt-3">
      <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
        isGemini
          ? 'bg-accent/10 border border-accent/20 text-accent'
          : 'bg-surface border border-surface-border text-muted'
      }`}>
        {isGemini ? (
          <>
            <Sparkles className="h-3 w-3" />
            <span>AI Enhanced</span>
          </>
        ) : (
          <>
            <Cpu className="h-3 w-3" />
            <span>PyTorch CNN</span>
          </>
        )}
      </div>
    </div>
  );
};

export default EnsembleBadge;
