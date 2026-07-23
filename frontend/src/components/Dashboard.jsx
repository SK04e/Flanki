import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, MapPin, Lock, Unlock, Users, Play, RefreshCw, KeyRound, X, LocateFixed, Beer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const TOP_CITIES = [
  "Rzeszów", "Warszawa", "Kraków", "Wrocław", "Poznań", 
  "Gdańsk", "Łódź", "Szczecin", "Bydgoszcz", "Lublin", 
  "Białystok", "Katowice", "Gdynia", "Częstochowa", "Radom",
  "Toruń", "Sosnowiec", "Kielce", "Gliwice", "Zabrze",
  "Olsztyn", "Bielsko-Biała", "Bytom", "Zielona Góra", "Rybnik"
];

export default function Dashboard({ onSelectGame }) {
  const [stats, setStats] = useState({ total_players: 0, total_games_played: 0, games_today: 0 });
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createModal, setCreateModal] = useState(false);
  const [newLocation, setNewLocation] = useState('Rzeszów');
  const [isExact, setIsExact] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const [joinModal, setJoinModal] = useState(false);
  const [joinGame, setJoinGame] = useState(null);
  const [joinCode, setJoinCode] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, gamesRes] = await Promise.all([
        api.get('/stats').catch(() => ({ data: { total_players: 0, total_games_played: 0, games_today: 0 } })),
        api.get('/games').catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setGames(Array.isArray(gamesRes.data) ? gamesRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGetLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      toast.error("Twoja przeglądarka nie wspiera geolokalizacji.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.municipality || "";
          const road = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || "";

          let formattedLocation = "Lokalizacja GPS";
          if (city && road && city !== road) {
            formattedLocation = `${city}, ${road}`;
          } else if (city) {
            formattedLocation = city;
          } else if (road) {
            formattedLocation = road;
          }

          setNewLocation(formattedLocation);
          setIsExact(true);
          toast.success("Pobrano dokładną lokalizację GPS!");
        } catch (e) {
          setNewLocation("Polska (GPS)");
          setIsExact(true);
        }
        setIsLocating(false);
      },
      () => {
        toast.error("Nie udało się pobrać lokalizacji.");
        setIsLocating(false);
      }
    );
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/games', {
        location: newLocation,
        game_mode: 'MANUAL',
        is_locked: false,
        is_location_exact: isExact
      });
      setIsExact(false);
      setCreateModal(false);
      setNewLocation('Rzeszów');
      toast.success("Lobby zostało utworzone!");
      fetchData();
      if (res.data?.game_id) onSelectGame(res.data.game_id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Błąd tworzenia lobby');
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return toast.error('Podaj kod PIN!');
    try {
      await api.post(`/games/join/${joinGame.game_id}`, { code: joinCode });
      setJoinModal(false);
      setJoinCode('');
      toast.success("Dołączono do gry!");
      onSelectGame(joinGame.game_id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Nie udało się dołączyć');
    }
  };

  const openJoinModal = (game) => {
    setJoinGame(game);
    setJoinCode('');
    setJoinModal(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24">
      
      {/* STATYSTYKI */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gracze</p>
          <p className="text-base font-black text-white mt-0.5">{stats.total_players}</p>
        </div>
        <div className="text-center border-x border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rozegrane</p>
          <p className="text-base font-black text-yellow-400 mt-0.5">{stats.total_games_played}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dzisiaj</p>
          <p className="text-base font-black text-cyan-400 mt-0.5">{stats.games_today}</p>
        </div>
      </div>

      {/* PRZYCISK TWORZENIA */}
      <button
        onClick={() => setCreateModal(true)}
        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black py-4 rounded-2xl shadow-[0_0_15px_rgba(250,204,21,0.2)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" /> STWÓRZ NOWE LOBBY
      </button>

      {/* LISTA GIER */}
      <div>
        <div className="flex justify-between items-center mb-3 px-1">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Dostępne Lobby</h3>
          <button onClick={fetchData} className="text-xs text-slate-400 hover:text-yellow-400 flex items-center gap-1 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Odśwież
          </button>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 animate-pulse flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-800/60 rounded-md" />
                  <div className="h-3 w-20 bg-slate-800/40 rounded-md" />
                </div>
                <div className="w-8 h-8 bg-slate-800/60 rounded-full" />
              </div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white/[0.02] rounded-2xl border border-dashed border-white/10 flex flex-col items-center">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-3 text-slate-400 border border-white/10">
              <Beer className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-300 mb-1">Brak aktywnych gier</h4>
            <p className="text-xs text-slate-500 max-w-[220px]">Nie ma teraz żadnego otwartego lobby. Bądź pierwszy i załóż własną grę!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {games.map((game) => (
              <motion.div
                key={game.game_id}
                whileTap={{ scale: 0.98 }}
                onClick={() => openJoinModal(game)}
                className="bg-slate-900/80 hover:bg-slate-800/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer transition-all shadow-md hover:border-slate-700"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{game.host_name}'s Game</span>
                    {game.is_locked ? <Lock className="w-3.5 h-3.5 text-red-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" /> {game.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">{game.players_count || 0}/30</p>
                    <p className="text-[9px] text-slate-500 uppercase font-medium">Graczy</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: TWORZENIE LOBBY */}
      <AnimatePresence>
        {createModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
              <button onClick={() => setCreateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-black text-white mb-4">Ustawienia Lobby</h2>
              
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lokalizacja</label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors"
                    >
                      {isLocating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
                      Pobierz z GPS
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {TOP_CITIES.map((city) => {
                      const isSelected = newLocation === city && !isExact;
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            setNewLocation(city);
                            setIsExact(false);
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.15)]'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {city}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-2">
                    <MapPin className={`w-4 h-4 shrink-0 ${isExact ? 'text-emerald-400' : 'text-yellow-400'}`} />
                    <span className="text-xs font-bold text-white truncate">{newLocation}</span>
                  </div>

                  {isExact && (
                    <p className="text-[10px] text-emerald-400 mt-1.5 font-bold flex items-center gap-1">
                      ✓ Dokładna lokalizacja GPS pobrana
                    </p>
                  )}
                </div>

                <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)] mt-2">
                  Gotowe, stwórz lobby!
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DOŁĄCZANIE PIN */}
      <AnimatePresence>
        {joinModal && joinGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
              <button onClick={() => setJoinModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-yellow-400" />
                </div>
                <h2 className="text-lg font-black text-white">Dołącz do gry</h2>
                <p className="text-xs text-slate-400 mt-1">Host: {joinGame.host_name}</p>
              </div>
              <form onSubmit={handleJoinSubmit} className="space-y-4 text-center">
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="PIN"
                  className="w-32 mx-auto bg-slate-950 border-2 border-slate-800 rounded-2xl px-4 py-3 text-2xl text-center text-white tracking-[0.2em] font-black focus:outline-none focus:border-yellow-400/50 transition-colors"
                />
                <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  Wejdź do Lobby
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}