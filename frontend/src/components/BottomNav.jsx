import React from 'react';
import { LayoutDashboard, Trophy, User } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Gry', icon: LayoutDashboard },
    { id: 'leaderboard', label: 'Ranking', icon: Trophy },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center py-1 px-3 transition-all"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-yellow-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              />
              <span
                className={`text-[10px] font-bold mt-1 transition-colors ${
                  isActive ? 'text-yellow-400' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}