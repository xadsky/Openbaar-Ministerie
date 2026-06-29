import React from 'react';
import { ConnectionState } from '../types';

interface VisualizerProps {
  status: ConnectionState;
  volume: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({ status, volume }) => {
  if (status === ConnectionState.DISCONNECTED) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-slate-700 animate-pulse" />
      </div>
    );
  }

  // Generate 5 bars for the waveform
  return (
    <div className="h-32 flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((i) => {
        // Calculate dynamic height based on volume and index
        // Center bars are taller
        const baseHeight = i === 3 ? 60 : (i === 2 || i === 4) ? 40 : 25;
        const dynamicHeight = Math.max(10, baseHeight + (volume * 100));
        
        return (
          <div
            key={i}
            className={`w-3 sm:w-4 bg-om-accent rounded-full transition-all duration-75 ease-in-out shadow-[0_0_15px_rgba(0,174,239,0.5)]`}
            style={{
              height: status === ConnectionState.CONNECTED ? `${dynamicHeight}%` : '10%',
              opacity: status === ConnectionState.CONNECTED ? 0.8 + (volume * 0.2) : 0.3
            }}
          />
        );
      })}
    </div>
  );
};
