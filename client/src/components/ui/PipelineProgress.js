import React from "react";

export default function PipelineProgress({ stage, progress, total = 0 }) {
  const percentages = {
    qualified: Math.min(Math.round((progress.qualified / total) * 100), 100),
    proposed: Math.min(Math.round((progress.proposed / total) * 100), 100),
    negotiating: Math.min(Math.round((progress.negotiating / total) * 100), 100),
    closed_won: Math.min(Math.round((progress.closed_won / total) * 100), 100),
    closed_lost: Math.min(Math.round((progress.closed_lost / total) * 100), 100),
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-surface-container-lowest p-card-pheight">
      <div className="absolute inset-0">
        <div 
          className={`absolute bottom-0 left-0 w-full h-0.5 rounded-lg transition-all ${percentages.qualified > 0 ? 'bg-primary' : 'bg-gray-200'} opacity-50`}
          style={{ width: `${percentages.qualified}%` }}
        ></div>
        <div 
          className={`absolute bottom-0 left-0 w-full h-0.5 rounded-lg transition-all ${percentages.proposed > 0 ? 'bg-emerald-500' : 'bg-gray-200'} opacity-50`}
          style={{ width: `${percentages.proposed}%` }}
        ></div>
        <div 
          className={`absolute bottom-0 left-0 w-full h-0.5 rounded-lg transition-all ${percentages.negotiating > 0 ? 'bg-amber-500' : 'bg-gray-200'} opacity-50`}
          style={{ width: `${percentages.negotiating}%` }}
        ></div>
        <div 
          className={`absolute bottom-0 left-0 w-full h-0.5 rounded-lg transition-all ${percentages.closed_won > 0 ? 'bg-green-500' : 'bg-gray-200'} opacity-50`}
          style={{ width: `${percentages.closed_won}%` }}
        ></div>
        <div 
          className={`absolute bottom-0 left-0 w-full h-0.5 rounded-lg transition-all ${percentages.closed_lost > 0 ? 'bg-red-500' : 'bg-gray-200'} opacity-50`}
          style={{ width: `${percentages.closed_lost}%` }}
        ></div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">
            {stage}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {progress.count || 0} of {total || 0} deals
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-colors ${percentages.qualified > 0 ? 'bg-primary' : 'bg-gray-200'}`}
            style={{ width: `${percentages.qualified}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-xs text-on-surface-variant mt-1">
          <span>Qualified: {percentages.qualified}%</span>
          <span>Closed Won: {percentages.closed_won}%</span>
        </div>
      </div>
    </div>
  );
}