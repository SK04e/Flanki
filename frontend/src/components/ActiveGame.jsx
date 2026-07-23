import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Trophy, Flag, X, Shield } from 'lucide-react';

export default function ActiveGame({ game, isHost, refreshLobby }) {
  const [elapsed, setElapsed] = useState(0);
  const [finishModal, setFinishModal] = useState(false);

  // Stoper liczony na podstawie daty startu z serwera (odporny na odświeżanie!)
  useEffect(() => {
    if (!game.start_time) return;
    const startTime = new Date(game.start_time).getTime();
    
    const interval = setInterval(() => {
      const diffInSeconds = Math.floor((Date.now() - startTime) / 1000);
      setElapsed(diffInSeconds > 0 ? diffInSeconds : 0);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [game.start_time]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Zakonczenie gry przez Hosta
  const handleFinish = async (teamValue) => {
    try {
      // Zgodnie z plikiem models.py: Team A = '1', Team B = '2'
      await api.post(`/games/${game.game_id}/finish`, { winning_team: teamValue });
      refreshLobby(); // Wywołuje pobranie statusu, status zmieni się na FINISHED, co wyrzuci graczy do menu
    } catch (err) {
      alert(err.response?.data?.error || "Błąd podczas kończenia gry");
    }
  };

  const teamA = game.players.filter(p => p.team === 'A' || p.team === '1');
  const teamB = game.players.filter(p => p.team === 'B' || p.team === '2');

  const PlayerItem = ({ name }) => (
    <div className="text-xs font-bold text-slate-300 bg-slate-950/50 py-1.5 px-3 rounded-lg border border-slate-800/50 truncate">
      {name}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 pb-24">
      
      {/* Wielki Stoper */}
      <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 backdrop-blur-md shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        
        <div className="flex items-center justify-center gap-2 text-emerald-400 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <p className="text-[10px] font-black uppercase tracking-widest">Mecz w toku</p>
        </div>

        <div className="flex justify-center items-center gap-4 text-white font-black tracking-widest text-7xl drop-shadow-lg font-mono">
          <Timer className="w-8 h-8 text-slate-500 absolute left-4 top-4 opacity-30" />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Składy Zespołów (Bojowy widok VS) */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start">
        {/* TEAM BLUE */}
        <div className="bg-slate-900/60 border-t-4 border-t-blue-500 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center gap-1.5 mb-3 justify-center text-blue-400">
            <Shield className="w-4 h-4" />
            <h3 className="font-black text-xs tracking-wider">TEAM A</h3>
          </div>
          <div className="space-y-1.5">
            {teamA.map(p => <PlayerItem key={p.player_id} name={p.name} />)}
          </div>
        </div>

        <div className="flex flex-col justify-center items-center h-full pt-6">
          <span className="font-black text-slate-700 text-lg italic">VS</span>
        </div>

        {/* TEAM RED */}
        <div className="bg-slate-900/60 border-t-4 border-t-red-500 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center gap-1.5 mb-3 justify-center text-red-400">
            <Shield className="w-4 h-4" />
            <h3 className="font-black text-xs tracking-wider">TEAM B</h3>
          </div>
          <div className="space-y-1.5">
            {teamB.map(p => <PlayerItem key={p.player_id} name={p.name} />)}
          </div>
        </div>
      </div>

      {/* Panel Hosta - Przycisk Zakończenia */}
      {isHost ? (
        <button 
          onClick={() => setFinishModal(true)}
          className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
        >
          <Flag className="w-5 h-5 text-yellow-400" /> ZAKOŃCZ MECZ I ROZDAJ PUNKTY
        </button>
      ) : (
        <div className="text-center mt-6 text-xs text-slate-500 font-bold uppercase tracking-wider">
          Tylko host może zakończyć spotkanie
        </div>
      )}

      {/* MODAL: Kto wygrał? (Tylko dla Hosta) */}
      <AnimatePresence>
        {finishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center">
              <button onClick={() => setFinishModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-black text-white mb-1">Koniec meczu!</h2>
              <p className="text-xs text-slate-400 mb-6">Wybierz drużynę, która wygrała. Punkty zostaną rozdane automatycznie.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleFinish('1')} className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-black py-4 rounded-2xl transition-colors">
                  WYGRAŁ TEAM A
                </button>
                <button onClick={() => handleFinish('2')} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-black py-4 rounded-2xl transition-colors">
                  WYGRAŁ TEAM B
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}