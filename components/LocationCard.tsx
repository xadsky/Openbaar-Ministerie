import React from 'react';
import { DropOffLocation } from '../types';

interface LocationCardProps {
  location: DropOffLocation;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location }) => {
  return (
    <div className="bg-om-primary/50 border border-slate-700 backdrop-blur-sm p-4 rounded-lg hover:border-om-accent/50 transition-colors group">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-om-highlight font-semibold text-lg">{location.district}</h3>
          <p className="text-slate-300 text-sm mt-1">{location.name}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-om-accent/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-om-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
