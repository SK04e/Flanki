import React from 'react';
import { Trophy, Compass, User } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-lg border-t border-slate-800/80 px-4 py-2">
      <div className="max-w-md mx-auto flex justify-around items-center">
        
        {/* LEWO: RANKING */}
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center py-1.5 px-4 rounded-xl transition-all ${activeTab === 'leaderboard' ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Trophy className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Ranking</span>
        </button>

        {/* ŚRODEK: WYSZUKIWARKA GIER / DASHBOARD */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1.5 px-4 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Compass className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Gry</span>
        </button>

        {/* PRAWO: PROFIL */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center py-1.5 px-4 rounded-xl transition-all ${activeTab === 'profile' ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <User className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Profil</span>
        </button>

      </div>
    </nav>
  );
}