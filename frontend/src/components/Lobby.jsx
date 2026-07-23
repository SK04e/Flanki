import React, { useEffect, useState } from 'react';
import api from '../api';
import ActiveGame from './ActiveGame';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Users, Play, Shuffle, LogOut, Trash2, XCircle, Settings2, Copy, Link as LinkIcon, Check, MapPin, Clock, Coins, Sparkles, X, Lock, Unlock } from 'lucide-react';

export default function Lobby({ gameId, onLeave }) {
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Ustawienia hosta: Rzut monetą przy starcie
  const [coinFlipSetting, setCoinFlipSetting] = useState(true);
  const [coinModal, setCoinModal] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinWinner, setCoinWinner] = useState(null);
  const [rotation, setRotation] = useState(0);

  const fetchLobby = async () => {
    try {
      const res = await api.post(`/games/details/${gameId}`);
      const gameData = res.data;

      // ZABEZPIECZENIE: Sprawdzamy czy zalogowany użytkownik faktycznie jest w tym lobby
      const isInGame = gameData.players?.some(p => Number(p.player_id) === Number(user?.player_id));
      if (!isInGame) {
        onLeave(); // Jeśli nas nie ma, automatycznie opuszczamy widok i czyścimy pamięć
        return;
      }

      setGame(gameData);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        onLeave(); 
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLobby();
    const interval = setInterval(fetchLobby, 3000);
    return () => clearInterval(interval);
  }, [gameId, user]);

  // Akcje API
  const joinTeam = async (team) => {
    try { await api.post(`/games/${gameId}/join_team/${team}`); fetchLobby(); }
    catch (err) { alert(err.response?.data?.error || "Błąd zmiany drużyny"); }
  };

  const toggleMode = async () => {
    try { await api.post(`/games/${gameId}/toggle_mode`); fetchLobby(); }
    catch (err) { alert(err.response?.data?.error || "Błąd"); }
  };

  const toggleLock = async () => {
    try { await api.post(`/games/${gameId}/toggle_lock`); fetchLobby(); }
    catch (err) { alert(err.response?.data?.error || "Błąd zmiany blokady"); }
  };

  const shuffleTeams = async () => {
    try { await api.post(`/games/${gameId}/shuffle`); fetchLobby(); }
    catch (err) { alert(err.response?.data?.error || "Błąd losowania"); }
  };

  const executeStartGame = async () => {
    try { 
      await api.post(`/games/${gameId}/start`); 
      setCoinModal(false);
      fetchLobby(); 
    }
    catch (err) { alert(err.response?.data?.error || "Nie można zacząć gry"); }
  };

  const handleStartClick = () => {
    if (!game.players || game.players.length < 4) {
      alert("Do rozpoczęcia gry potrzeba co najmniej 4 graczy!");
      return;
    }

    if (coinFlipSetting) {
      setCoinWinner(null);
      setCoinModal(true);
      triggerAutoFlip();
    } else {
      executeStartGame();
    }
  };

  const triggerAutoFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);

    const winner = Math.random() < 0.5 ? 'TEAM A (Niebiescy)' : 'TEAM B (Czerwoni)';
    setRotation(prev => prev + 1800);

    setTimeout(() => {
      setCoinWinner(winner);
      setIsFlipping(false);
    }, 2000);
  };

  const leaveLobby = async () => {
    try { await api.post(`/games/${gameId}/leave`); onLeave(); } 
    catch (err) { alert(err.response?.data?.error || "Błąd opuszczania"); }
  };

  const destroyLobby = async () => {
    if(!window.confirm("Na pewno chcesz zniszczyć to lobby i wyrzucić wszystkich?")) return;
    try { await api.delete(`/games/${gameId}`); onLeave(); } 
    catch (err) { alert(err.response?.data?.error || "Błąd niszczenia"); }
  };

  const kickPlayer = async (playerId) => {
    try { await api.delete(`/games/${gameId}/kick/${playerId}`); fetchLobby(); }
    catch (err) { alert(err.response?.data?.error || "Błąd wyrzucania"); }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(game.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?gameId=${game.game_id}&code=${game.code}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  useEffect(() => {
    if (game?.status === 'FINISHED' || game?.status === 'finished') {
      alert(`Mecz zakończony! Zwycięzcy: Team ${game.winning_team === '1' || game.winning_team === 'A' ? 'A (Niebiescy)' : 'B (Czerwoni)'}`);
      onLeave();
    }
    if (game?.status === 'CANCELED' || game?.status === 'canceled') {
      alert("Lobby zostało usunięte przez hosta.");
      onLeave();
    }
  }, [game?.status, game?.winning_team, onLeave]);

  if (loading && !game) return <div className="text-center mt-20 text-yellow-400 animate-pulse font-bold">Ładowanie lobby...</div>;
  if (!game) return null;

  const isHost = Number(user?.player_id) === Number(game.host_id);

  if (game.status === 'PENDING' || game.status === 'pending') {
    return <ActiveGame game={game} isHost={isHost} refreshLobby={fetchLobby} />;
  }

  const teamA = game.players.filter(p => p.team === 'A' || p.team === '1');
  const teamB = game.players.filter(p => p.team === 'B' || p.team === '2');
  const unassigned = game.players.filter(p => !p.team);

  const createdTime = game.start_time ? new Date(game.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Właśnie teraz';

  const PlayerCard = ({ p }) => (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center justify-between bg-slate-950/50 border border-slate-800/80 p-2.5 rounded-xl mb-2 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {Number(p.player_id) === Number(game.host_id) ? (
          <Crown className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400">
            {p.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-semibold text-slate-200">
          {p.name} {Number(p.player_id) === Number(user?.player_id) && <span className="text-xs text-slate-500">(Ty)</span>}
        </span>
      </div>
      {isHost && Number(p.player_id) !== Number(user?.player_id) && (
        <button onClick={() => kickPlayer(p.player_id)} className="text-slate-600 hover:text-red-500 transition-colors">
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-24">
      
      {/* NAGŁÓWEK LOBBY */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-4 border-b border-slate-800/50 pb-3">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {game.location}</span>
          
          <div className="flex items-center gap-1">
            {game.is_locked ? <Lock className="w-3.5 h-3.5 text-red-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
            <span className={game.is_locked ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
              {game.is_locked ? 'Zablokowane' : 'Otwarte'}
            </span>
          </div>

          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {createdTime}</span>
        </div>

        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">KOD DOŁĄCZENIA</p>
        <h1 className="text-6xl font-black tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-amber-600 drop-shadow-md mb-6">
          {game.code}
        </h1>

        <div className="flex justify-center gap-3">
          <button onClick={handleCopyCode} className="flex-1 max-w-[140px] flex items-center justify-center gap-2 py-2 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all">
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-yellow-400" />}
            {copiedCode ? "Skopiowano" : "Kopiuj PIN"}
          </button>
          <button onClick={handleCopyLink} className="flex-1 max-w-[140px] flex items-center justify-center gap-2 py-2 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all">
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4 text-cyan-400" />}
            {copiedLink ? "Skopiowano" : "Kopiuj Link"}
          </button>
        </div>
      </div>

      {/* KONTROLKI HOSTA */}
      {isHost && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={toggleMode} className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-900/80 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-[11px] font-semibold text-slate-300 transition-all">
              <Settings2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{game.game_mode === 'MANUAL' ? 'Ręczny' : 'Losowy'}</span>
            </button>

            <button onClick={toggleLock} className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-900/80 border border-slate-700 hover:border-yellow-400/50 rounded-xl text-[11px] font-semibold text-slate-300 transition-all">
              {game.is_locked ? <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              <span className="truncate">{game.is_locked ? 'Zablokowane' : 'Otwarte'}</span>
            </button>

            <button onClick={shuffleTeams} disabled={game.game_mode === 'MANUAL'} className={`flex items-center justify-center gap-1.5 py-2.5 border rounded-xl text-[11px] font-semibold transition-all ${game.game_mode === 'MANUAL' ? 'bg-slate-900/40 border-slate-800 text-slate-600' : 'bg-slate-900/80 border-slate-700 hover:border-purple-500/50 text-slate-300'}`}>
              <Shuffle className={`w-3.5 h-3.5 shrink-0 ${game.game_mode === 'MANUAL' ? 'text-slate-600' : 'text-purple-400'}`} />
              <span className="truncate">Losuj</span>
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-700 p-3 rounded-xl text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-2"><Coins className="w-4 h-4 text-yellow-400" /> Losuj kto zaczyna (Moneta):</span>
            <button 
              onClick={() => setCoinFlipSetting(!coinFlipSetting)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${coinFlipSetting ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
            >
              {coinFlipSetting ? 'WŁĄCZONE' : 'WYŁĄCZONE'}
            </button>
          </div>
        </div>
      )}

      {/* DRUŻYNY */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/40 border-t-2 border-t-blue-500/50 border-x border-b border-slate-800 rounded-2xl p-3 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-black text-sm text-blue-400 tracking-wider">BLUE TEAM</h3>
            <span className="text-xs font-bold text-slate-500">{teamA.length}</span>
          </div>
          <div className="min-h-[120px]"><AnimatePresence>{teamA.map(p => <PlayerCard key={p.player_id} p={p} />)}</AnimatePresence></div>
          {game.game_mode === 'MANUAL' && <button onClick={() => joinTeam('A')} className="w-full mt-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold rounded-xl border border-blue-500/20">DOŁĄCZ</button>}
        </div>

        <div className="bg-slate-900/40 border-t-2 border-t-red-500/50 border-x border-b border-slate-800 rounded-2xl p-3 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-black text-sm text-red-400 tracking-wider">RED TEAM</h3>
            <span className="text-xs font-bold text-slate-500">{teamB.length}</span>
          </div>
          <div className="min-h-[120px]"><AnimatePresence>{teamB.map(p => <PlayerCard key={p.player_id} p={p} />)}</AnimatePresence></div>
          {game.game_mode === 'MANUAL' && <button onClick={() => joinTeam('B')} className="w-full mt-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/20">DOŁĄCZ</button>}
        </div>
      </div>

      {unassigned.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> W poczekalni ({unassigned.length})</h3>
          <AnimatePresence>{unassigned.map(p => <PlayerCard key={p.player_id} p={p} />)}</AnimatePresence>
        </div>
      )}

      {/* PRZYCISKI AKCJI */}
      <div className="pt-4">
        {isHost ? (
          <div className="flex gap-2">
            <button onClick={destroyLobby} className="px-4 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-xl transition-colors flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={handleStartClick} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2">
              <Play className="w-5 h-5 fill-slate-950" /> ROZPOCZNIJ MECZ
            </button>
          </div>
        ) : (
          <button onClick={leaveLobby} className="w-full bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" /> Opuść Lobby
          </button>
        )}
      </div>

      {/* MODAL: RZUT MONETĄ */}
      <AnimatePresence>
        {coinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center">
              
              <h2 className="text-lg font-black text-white mb-2 flex items-center justify-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" /> Losowanie rozpoczęcia
              </h2>
              <p className="text-xs text-slate-400 mb-8">Moneta decyduje, kto zaczyna...</p>

              <div className="py-6 flex justify-center items-center perspective-[1000px]">
                <motion.div
                  animate={{ rotateY: rotation }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="w-28 h-28 rounded-full relative shadow-[0_0_35px_rgba(250,204,21,0.4)] border-4 border-yellow-400 bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-slate-950"
                >
                  <Sparkles className="absolute top-2 w-4 h-4 text-slate-950 opacity-70" />
                  <Coins className="w-12 h-12 text-slate-950 drop-shadow-md" />
                </motion.div>
              </div>

              {isFlipping ? (
                <div className="mb-6">
                  <p className="text-xs text-yellow-400 font-bold uppercase animate-pulse">Rzut w toku...</p>
                </div>
              ) : coinWinner ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 space-y-1">
                  <p className="text-xs text-slate-400 font-bold uppercase">Zaczyna drużyna:</p>
                  <p className="text-xl font-black text-yellow-400">{coinWinner}</p>
                </motion.div>
              ) : null}

              {!isFlipping && coinWinner && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={executeStartGame}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-slate-950" /> START MECZU
                </motion.button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}