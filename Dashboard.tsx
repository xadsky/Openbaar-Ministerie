import React, { useEffect, useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Clock, Users, Database, FileText, ChevronRight } from 'lucide-react';
import { SessionRecord } from './types/dashboard';

export default function Dashboard() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then(data => {
        setSessions(data.sessions || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const { totalSessions, totalDuration, avgDuration, activityData } = useMemo(() => {
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgDuration = totalSessions ? totalDuration / totalSessions : 0;

    // Group by day for the chart
    const dailyMap: Record<string, number> = {};
    sessions.forEach(s => {
      if (s.timestamp) {
        try {
          const date = format(parseISO(s.timestamp), 'MMM dd');
          dailyMap[date] = (dailyMap[date] || 0) + 1;
        } catch(e) {}
      }
    });
    
    const activityData = Object.entries(dailyMap).map(([name, sessions]) => ({ name, sessions }));

    return { totalSessions, totalDuration, avgDuration, activityData };
  }, [sessions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Activity className="animate-spin text-om-accent h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-8">
        <div className="bg-red-500/10 border border-red-500 p-6 rounded-xl max-w-md text-center">
          <Database className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-om-accent selection:text-white pb-24">
      {/* Header */}
      <header className="px-6 py-6 border-b border-slate-800 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl tracking-wide uppercase">Campaign Overview</h1>
            <p className="text-sm text-om-accent tracking-widest uppercase">Admin Dashboard</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Status</p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-sm font-semibold text-green-400">Live</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex items-start gap-4">
            <div className="p-3 bg-om-accent/10 rounded-xl text-om-accent">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Interactions</p>
              <p className="text-3xl font-bold mt-1">{totalSessions}</p>
            </div>
          </div>
          
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex items-start gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Avg. Session Duration</p>
              <p className="text-3xl font-bold mt-1">{Math.round(avgDuration)}s</p>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex items-start gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Audio Processed</p>
              <p className="text-3xl font-bold mt-1">{Math.round(totalDuration / 60)}m</p>
            </div>
          </div>
        </div>

        {/* Charts & Transcripts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Activity className="h-5 w-5 text-slate-400" />
                Interaction Volume (Last 7 Days)
              </h3>
              <div className="h-[300px] w-full">
                {activityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#38BDF8' }}
                      />
                      <Bar dataKey="sessions" fill="#00AEEF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    No activity data available yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transcripts Log */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/30 rounded-2xl border border-slate-800 h-full flex flex-col">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-400" />
                  Recent Sessions
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
                {sessions.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">No sessions recorded.</p>
                ) : (
                  sessions.map((session) => (
                    <div key={session.sessionId} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 hover:border-om-accent/50 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs text-om-accent font-mono mb-1">{session.sessionId}</p>
                          <p className="text-xs text-slate-400">
                            {session.timestamp ? format(parseISO(session.timestamp), 'MMM dd, HH:mm') : 'Unknown'} • {session.duration}s
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-om-accent transition-colors" />
                      </div>
                      <div className="mt-3 space-y-2">
                        {session.transcripts && session.transcripts.length > 0 ? (
                          session.transcripts.slice(0, 2).map((t, i) => (
                            <div key={i} className="text-sm bg-slate-800/80 p-2 rounded text-slate-300 line-clamp-2">
                              <span className="text-om-highlight font-semibold text-xs mr-2">{t.role}:</span>
                              {t.text}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">No transcripts captured.</p>
                        )}
                        {session.transcripts && session.transcripts.length > 2 && (
                          <p className="text-xs text-slate-500 text-center pt-1">+ {session.transcripts.length - 2} more messages</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
