import React, { useState, useEffect } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import { Visualizer } from './components/Visualizer';
import { LocationCard } from './components/LocationCard';
import { LOCATIONS, ConnectionState } from './types';

function ClientApp() {
  const { status, volume, connect, disconnect } = useGeminiLive();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === ConnectionState.CONNECTED) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleToggle = () => {
    if (status === ConnectionState.CONNECTED || status === ConnectionState.CONNECTING) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-om-primary to-black text-white selection:bg-om-accent selection:text-white pb-12">
      {/* Header / Branding */}
      <header className="px-6 py-6 border-b border-slate-800 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
             {/* Logo Placeholder - Using Text/Icon combination based on slides */}
             <div className="bg-white/10 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8 text-om-accent">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
             </div>
             <div>
                <h1 className="font-bold text-xl tracking-wide uppercase">Openbaar Ministerie</h1>
                <p className="text-xs text-om-accent tracking-widest uppercase">Kerngroep Aruba</p>
             </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs text-slate-400">Project</p>
            <p className="text-sm font-semibold text-om-highlight">VUURWAPENBEZIT</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-12">
        {/* Hero / Main Interaction Area */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Safe. Anonymous. <br/> Secure.
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-12 text-lg leading-relaxed">
            Together we can make Aruba safer. Speak with our anonymous assistant to learn how to surrender weapons without prosecution.
            <span className="block mt-2 text-om-accent text-sm font-medium opacity-80">
              Papiamento • Nederlands • English • Español
            </span>
          </p>

          {/* Interaction Box */}
          <div className="relative max-w-sm mx-auto">
            {/* Glow effect behind button */}
            <div className={`absolute -inset-1 bg-om-accent rounded-full blur opacity-20 transition-opacity duration-500 ${status === ConnectionState.CONNECTED ? 'opacity-40 animate-pulse' : ''}`}></div>
            
            <button 
              onClick={handleToggle}
              disabled={status === ConnectionState.CONNECTING}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 mx-auto shadow-2xl border-4 ${
                status === ConnectionState.CONNECTED 
                  ? 'bg-red-500/10 border-red-500/50 hover:bg-red-500/20' 
                  : status === ConnectionState.CONNECTING
                  ? 'bg-om-accent/10 border-om-accent/30 cursor-wait'
                  : 'bg-om-accent/10 border-om-accent hover:bg-om-accent/20 hover:scale-105'
              }`}
            >
              {status === ConnectionState.CONNECTED && (
                <>
                  <span className="absolute inset-0 rounded-full animate-ripple border border-red-500/50 bg-red-500/20 -z-10 pointer-events-none"></span>
                  <span className="absolute inset-0 rounded-full animate-ripple border border-red-500/30 bg-red-500/10 -z-10 pointer-events-none" style={{ animationDelay: '1.25s' }}></span>
                </>
              )}
              {status === ConnectionState.CONNECTING ? (
                 <svg className="animate-spin h-8 w-8 text-om-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : status === ConnectionState.CONNECTED ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10 text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10 text-om-accent pl-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
              )}
            </button>
            
            <p className="mt-6 text-sm font-medium uppercase tracking-widest text-slate-400">
              {status === ConnectionState.DISCONNECTED && "Tap to Speak"}
              {status === ConnectionState.CONNECTING && "Connecting..."}
              {status === ConnectionState.CONNECTED && "Listening..."}
            </p>
            {status === ConnectionState.CONNECTED && (
              <p className="mt-2 text-xl font-mono text-om-highlight animate-pulse-slow">
                {formatDuration(duration)}
              </p>
            )}
          </div>

          <div className="mt-8 min-h-[120px]">
            <Visualizer status={status} volume={volume} />
          </div>
        </div>

        {/* Drop Off Locations Section */}
        <div className="border-t border-slate-800 pt-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white">Inleverlocaties</h3>
              <p className="text-slate-400 text-sm">Designated Drop-off Points</p>
            </div>
            <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/20">
              No ID Required
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LOCATIONS.map(loc => (
              <LocationCard key={loc.id} location={loc} />
            ))}
          </div>
        </div>

        {/* Info/Disclaimer */}
        <div className="mt-16 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
          <h4 className="text-om-highlight font-semibold mb-2">Anonymous Guarantee</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            This digital assistant is designed to provide information strictly for the purpose of the 
            "Terugdringen Vuurwapenbezit" campaign. Your identity remains anonymous. No conversations are recorded by the OM.
          </p>
        </div>
      </main>

      <footer className="mt-20 py-8 text-center text-slate-600 text-xs">
        <p>&copy; {new Date().getFullYear()} Openbaar Ministerie Aruba. All rights reserved.</p>
        <p className="mt-2"><a href="/dashboard" className="text-slate-700 hover:text-slate-400 transition-colors">Admin Dashboard</a></p>
      </footer>
    </div>
  );
}

export default ClientApp;
