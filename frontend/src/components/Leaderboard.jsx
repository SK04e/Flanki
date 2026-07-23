import React, { useEffect, useState } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, X, Target, User } from 'lucide-react';

const UNIVERSITIES = {
  ALL: ['ALL'],
  PRz: ['ALL', 'WEII', 'WC', 'WZ', 'WMiFS', 'WBMiL', 'WBIŚiA', 'WMT'],
  URz: ['ALL'],
  Other: ['ALL']
};

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUni, setFilterUni] = useState('ALL');
  const [filterFac, setFilterFac] = useState('ALL');

  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filterUni !== 'ALL') params.university = filterUni;
        if (filterFac !== 'ALL') params.faculty = filterFac;

        const res = await api.get('/players', { params });
        setPlayers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [filterUni, filterFac]);

  const handleUniChange = (e) => {
    setFilterUni(e.target.value);
    setFilterFac('ALL');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-24">
      
      {/* NAGŁÓWEK I FILTRY */}
      <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-wider">TOP GRACZE</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ranking najlepszych graczy</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-800/50 pt-4">
          <div>
            <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Uczelnia</label>
            <select
              value={filterUni}
              onChange={handleUniChange}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400/50"
            >
              <option value="ALL">Wszystkie</option>
              <option value="PRz">Politechnika (PRz)</option>
              <option value="URz">Uniwersytet (URz)</option>
              <option value="Other">Inne</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Wydział</label>
            <select
              value={filterFac}
              onChange={(e) => setFilterFac(e.target.value)}
              disabled={filterUni === 'ALL'}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400/50 disabled:opacity-50"
            >
              {UNIVERSITIES[filterUni]?.map(f => (
                <option key={f} value={f}>{f === 'ALL' ? 'Wszystkie' : f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* LISTA RANKINGOWA */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-[76px] bg-white/[0.02] rounded-2xl border border-white/5 animate-pulse flex items-center justify-between px-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800/60" />
                  <div className="space-y-2">
                    <div className="w-24 h-3 bg-slate-800/60 rounded" />
                    <div className="w-16 h-2 bg-slate-800/40 rounded" />
                  </div>
                </div>
                <div className="w-20 h-8 bg-slate-800/60 rounded-lg" />
              </div>
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
            Brak graczy spełniających kryteria.
          </div>
        ) : (
          players.map((player, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            const winRate = player.games_played > 0 
              ? Math.round((player.games_won / player.games_played) * 100) 
              : 0;

            const winRateColor = winRate > 50 ? 'text-emerald-400' : 'text-red-400';

            let rankContent = <span className="font-black text-xs text-slate-400">#{index + 1}</span>;
            if (isFirst) rankContent = <Trophy className="w-4 h-4 text-yellow-400" />;
            else if (isSecond) rankContent = <Medal className="w-4 h-4 text-slate-300" />;
            else if (isThird) rankContent = <Award className="w-4 h-4 text-amber-500" />;

            const playerSub = [player.university, player.faculty]
              .filter(item => item && item.trim() !== '' && item.trim() !== '.' && item !== 'ALL')
              .join(' • ');

            return (
              <motion.div
                key={player.player_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => setSelectedPlayer(player)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group backdrop-blur-sm ${
                  isFirst 
                    ? 'bg-gradient-to-r from-yellow-500/10 via-slate-900/80 to-slate-900/80 border-yellow-500/40 shadow-[0_0_20px_rgba(250,204,21,0.1)]' 
                    : isSecond 
                    ? 'bg-slate-900/70 border-slate-700/60 shadow-md' 
                    : isThird 
                    ? 'bg-slate-900/70 border-amber-600/30 shadow-md' 
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0">
                    {rankContent}
                  </div>
                  <div>
                    <h3 className={`font-black text-sm tracking-wide group-hover:text-yellow-400 transition-colors ${isFirst ? 'text-yellow-400' : 'text-white'}`}>
                      {player.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                      {playerSub || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <span className={`text-sm font-black ${winRateColor}`}>{winRate}%</span>
                    <span className="text-[9px] text-slate-500 block font-bold">winrate</span>
                  </div>
                  <div className="pl-3 border-l border-slate-800/80 text-right min-w-[55px]">
                    <span className="text-sm font-black text-white">{player.games_won}</span>
                    <span className="text-slate-600 font-bold">/{player.games_played || 0}</span>
                    <span className="text-[9px] text-slate-500 block font-bold">wygrane</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* MODAL: KARTA GRACZA */}
      <AnimatePresence>
        {selectedPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center">
              <button onClick={() => setSelectedPlayer(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl mx-auto flex items-center justify-center text-slate-950 font-black text-3xl shadow-[0_0_20px_rgba(250,204,21,0.3)] mb-4">
                {selectedPlayer.name.charAt(0).toUpperCase()}
              </div>

              <h2 className="text-xl font-black text-white">{selectedPlayer.name}</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5 mb-6">
                {[selectedPlayer.university, selectedPlayer.faculty].filter(i => i && i !== '.' && i !== 'ALL').join(' • ') || 'N/A'}
              </p>

              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-6">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Mecze</p>
                  <p className="text-base font-black text-white mt-0.5">{selectedPlayer.games_played || 0}</p>
                </div>
                <div className="border-x border-slate-800">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Wygrane</p>
                  <p className="text-base font-black text-yellow-400 mt-0.5">{selectedPlayer.games_won || 0}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Win Rate</p>
                  <p className={`text-base font-black mt-0.5 ${
                    (selectedPlayer.games_played > 0 ? Math.round((selectedPlayer.games_won / selectedPlayer.games_played) * 100) : 0) > 50 
                      ? 'text-emerald-400' 
                      : 'text-red-400'
                  }`}>
                    {selectedPlayer.games_played > 0 ? Math.round((selectedPlayer.games_won / selectedPlayer.games_played) * 100) : 0}%
                  </p>
                </div>
              </div>

              <button onClick={() => setSelectedPlayer(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors">
                Zamknij kartę
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}