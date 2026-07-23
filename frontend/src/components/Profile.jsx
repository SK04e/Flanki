import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Trophy, Target, History, X, MapPin, Calendar, Crown, EyeOff, Eye, Settings, Clock } from 'lucide-react';

const UNIVERSITIES_LIST = {
  PRz: ['WEII', 'WC', 'WZ', 'WMiFS', 'WBMiL', 'WBIŚiA', 'WMT'],
  URz: ['Ogólny'],
  Other: ['Inny']
};

export default function Profile() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hideCanceled, setHideCanceled] = useState(true);

  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);

  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editUni, setEditUni] = useState(user?.university || 'PRz');
  const [editFac, setEditFac] = useState(user?.faculty || 'WEII');

  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/players/${user.player_id}/history`);
        const matches = res.data['Historia gry'] || [];
        setHistory(matches);

        const finished = matches.filter(m => m['Status gry']?.toLowerCase() === 'finished');
        const won = finished.filter(m => m['Twoja drużyna'] === m['zwyciezcy']).length;
        
        setGamesPlayed(finished.length);
        setGamesWon(won);
      } catch (err) {
        console.error("Błąd pobierania historii", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchHistory();
  }, [user]);

  const openMatchDetails = async (gameId) => {
    setSelectedMatchId(gameId);
    setLoadingDetails(true);
    setMatchDetails(null);
    try {
      const res = await api.post(`/games/details/${gameId}`);
      setMatchDetails(res.data);
    } catch (err) {
      console.error("Błąd pobierania szczegółów", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/players/${user.player_id}`, {
        name: editName,
        university: editUni,
        faculty: editFac
      });
      alert("Zaktualizowano profil! Zaloguj się ponownie, aby zobaczyć zmiany.");
      setEditModal(false);
    } catch (err) {
      alert(err.response?.data?.error || "Nie udało się zaktualizować profilu");
    }
  };

  if (!user) return null;

  const winRate = gamesPlayed > 0 
    ? Math.round((gamesWon / gamesPlayed) * 100) 
    : 0;

  const filteredHistory = history.filter(match => {
    if (hideCanceled && match['Status gry']?.toLowerCase() === 'canceled') {
      return false;
    }
    return true;
  });

  const userSubtitle = [user.university, user.faculty]
    .filter(item => item && item.trim() !== '' && item.trim() !== '.')
    .join(' • ');

  const MatchPlayerCard = ({ p, isWinner }) => (
    <div className={`p-2 rounded-xl mb-1 flex items-center gap-2 border bg-slate-950/50 ${isWinner ? 'border-emerald-500/30' : 'border-slate-800/50'}`}>
      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-400 shrink-0">
        {p.name.charAt(0).toUpperCase()}
      </div>
      <span className="text-xs font-bold text-slate-200 truncate">{p.name}</span>
      {isWinner && <Crown className="w-3 h-3 text-emerald-400 ml-auto" />}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24">
      
      {/* Wizytówka gracza */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl flex items-center justify-between relative overflow-hidden backdrop-blur-md shadow-xl">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-[0_0_20px_rgba(250,204,21,0.3)] shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          
          <div>
            <h2 className="text-xl font-black text-white tracking-wide">{user.name}</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {userSubtitle || 'Brak przypisanej uczelni'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => setEditModal(true)}
          className="p-3 bg-slate-950 border border-slate-800 hover:border-yellow-400/50 text-slate-300 hover:text-yellow-400 rounded-2xl transition-all shadow-md"
          title="Ustawienia profilu"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Grid ze statystykami */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl text-center">
          <Target className="w-5 h-5 text-cyan-400 mx-auto mb-2 opacity-80" />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Rozegrane</p>
          <p className="text-xl font-black text-white">{gamesPlayed}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl text-center">
          <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-2 opacity-80" />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Wygrane</p>
          <p className="text-xl font-black text-yellow-400">{gamesWon}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl text-center">
          <User className="w-5 h-5 text-red-400 mx-auto mb-2 opacity-80" />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Win Rate</p>
          <p className="text-xl font-black text-white">{winRate}%</p>
        </div>
      </div>

      {/* Historia Meczów w Stylu Faceita */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4" /> Historia Meczów
          </h3>
          
          <button 
            onClick={() => setHideCanceled(!hideCanceled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              !hideCanceled 
                ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {hideCanceled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {hideCanceled ? 'Pokaż Canceled' : 'Ukryj Canceled'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-6 text-xs text-slate-500 animate-pulse">Ładowanie historii...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
            <p className="text-xs text-slate-400">Brak meczów do wyświetlenia.</p>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider bg-slate-950/60">
                    <th className="py-2.5 px-3 font-bold">ID</th>
                    <th className="py-2.5 px-3 font-bold">Data</th>
                    <th className="py-2.5 px-3 font-bold">Drużyna</th>
                    <th className="py-2.5 px-3 font-bold">Wynik</th>
                    <th className="py-2.5 px-3 font-bold">Status</th>
                    <th className="py-2.5 px-3 text-right font-bold">Akcja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredHistory.slice().reverse().map((match, idx) => {
                    const isWin = match['Twoja drużyna'] === match['zwyciezcy'];
                    const isFinished = match['Status gry']?.toLowerCase() === 'finished';
                    const isCanceled = match['Status gry']?.toLowerCase() === 'canceled';

                    const teamName = match['Twoja drużyna'] === '1' || match['Twoja drużyna'] === 'A' ? 'TEAM A' 
                                   : match['Twoja drużyna'] === '2' || match['Twoja drużyna'] === 'B' ? 'TEAM B' 
                                   : 'BRAK';

                    let rowHighlight = "hover:bg-slate-800/50";
                    if (isFinished) {
                      rowHighlight = isWin 
                        ? "bg-emerald-950/20 hover:bg-emerald-900/30 border-l-4 border-l-emerald-500" 
                        : "bg-red-950/20 hover:bg-red-900/30 border-l-4 border-l-red-500";
                    }

                    const dateParts = (match['date'] || '').split(' ');
                    const matchDate = dateParts[0] || match['date'];
                    const matchTime = dateParts[1] || '';

                    return (
                      <tr 
                        key={idx} 
                        onClick={() => openMatchDetails(match['ID gry'])}
                        className={`transition-colors cursor-pointer group ${rowHighlight}`}
                      >
                        <td className="py-3 px-3 font-black text-yellow-400">
                          #{match['ID gry']}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            {/* Data na biało */}
                            <span className="text-slate-100 font-semibold">{matchDate}</span>
                            {/* Godzina na szaro */}
                            {matchTime && <span className="text-[10px] text-slate-500 font-medium">{matchTime}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-black tracking-wide text-slate-200">
                          {teamName}
                        </td>
                        <td className="py-3 px-3">
                          {isFinished ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase shadow-sm ${
                              isWin ? 'bg-emerald-500 text-slate-950' 
                                    : 'bg-red-500 text-white'
                            }`}>
                              {isWin ? 'WIN' : 'LOSS'}
                            </span>
                          ) : isCanceled ? (
                            <span className="text-slate-500 font-bold text-[9px] bg-slate-800/80 px-1.5 py-0.5 rounded">CANCELED</span>
                          ) : (
                            <span className="text-slate-400 font-bold text-[10px]">W TOKU</span>
                          )}
                        </td>
                        <td className="py-3 px-3 uppercase text-[9px] font-black tracking-wider text-slate-400">
                          {match['Status gry']}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {/* Wyczyszczona strzałka */}
                          <button className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors text-[11px] ml-auto">
                            Szczegóły
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Ustawienia / Edycja Profilu */}
      <AnimatePresence>
        {editModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
              <button onClick={() => setEditModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-lg font-black text-white mb-4">Edytuj Profil</h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nazwa / Nick</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Uczelnia</label>
                  <select
                    value={editUni}
                    onChange={(e) => {
                      setEditUni(e.target.value);
                      setEditFac(UNIVERSITIES_LIST[e.target.value]?.[0] || 'Ogólny');
                    }}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                  >
                    <option value="PRz">Politechnika (PRz)</option>
                    <option value="URz">Uniwersytet (URz)</option>
                    <option value="Other">Inna</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wydział</label>
                  <select
                    value={editFac}
                    onChange={(e) => setEditFac(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                  >
                    {UNIVERSITIES_LIST[editUni]?.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)] mt-2">
                  Zapisz zmiany
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Match Room */}
      <AnimatePresence>
        {selectedMatchId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
              
              <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-lg font-black text-white tracking-wider flex items-center gap-2">
                  MATCH ROOM <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">#{selectedMatchId}</span>
                </h2>
                <button onClick={() => setSelectedMatchId(null)} className="text-slate-400 hover:text-white bg-slate-900 p-1.5 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto">
                {loadingDetails ? (
                  <div className="py-20 text-center animate-pulse text-yellow-400 font-bold text-sm tracking-widest uppercase">
                    Pobieranie danych serwera...
                  </div>
                ) : matchDetails ? (
                  <div className="space-y-6">
                    
                    <div className="flex justify-around items-center bg-slate-950/50 rounded-xl p-3 border border-slate-800/80">
                      <div className="text-center">
                        <MapPin className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{matchDetails.location}</span>
                      </div>
                      <div className="text-center">
                        <Calendar className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {matchDetails.end_time 
                            ? `${new Date(matchDetails.end_time).toLocaleDateString()} ${new Date(matchDetails.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="text-center">
                        <Trophy className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{matchDetails.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                      
                      {/* TEAM A */}
                      {(() => {
                        const isAWinner = matchDetails.winning_team === 'A' || matchDetails.winning_team === '1';
                        return (
                          <div className={`rounded-2xl p-3 border-t-4 border-x border-b ${
                            isAWinner 
                              ? 'border-t-emerald-400 bg-emerald-500/10 border-slate-800 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                              : 'border-t-slate-600 bg-slate-950/40 border-slate-800/80'
                          }`}>
                            <div className="text-center mb-3">
                              <h3 className="font-black text-sm text-white tracking-wider">TEAM A</h3>
                            </div>
                            <div className="space-y-1">
                              {matchDetails.players.filter(p => p.team === 'A' || p.team === '1').map(p => (
                                <MatchPlayerCard key={p.player_id} p={p} isWinner={isAWinner} />
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="font-black text-slate-700 flex flex-col items-center justify-center h-full pt-8">
                        VS
                      </div>

                      {/* TEAM B */}
                      {(() => {
                        const isBWinner = matchDetails.winning_team === 'B' || matchDetails.winning_team === '2';
                        return (
                          <div className={`rounded-2xl p-3 border-t-4 border-x border-b ${
                            isBWinner 
                              ? 'border-t-emerald-400 bg-emerald-500/10 border-slate-800 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                              : 'border-t-slate-600 bg-slate-950/40 border-slate-800/80'
                          }`}>
                            <div className="text-center mb-3">
                              <h3 className="font-black text-sm text-white tracking-wider">TEAM B</h3>
                            </div>
                            <div className="space-y-1">
                              {matchDetails.players.filter(p => p.team === 'B' || p.team === '2').map(p => (
                                <MatchPlayerCard key={p.player_id} p={p} isWinner={isBWinner} />
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                    </div>

                  </div>
                ) : (
                  <div className="text-center py-10 text-red-400 text-sm">Nie udało się załadować danych meczu.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}