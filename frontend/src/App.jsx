import React, { useState, useEffect } from 'react';
import api from './api';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import Lobby from './components/Lobby';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import { LogOut, BookOpen, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function MainApp() {
  const { token, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRules, setShowRules] = useState(false);
  
  // Stan dla powitalnego popupa (sprawdzamy localStorage)
  const [showWelcome, setShowWelcome] = useState(false);

  const [selectedGameId, setSelectedGameId] = useState(localStorage.getItem('activeGameId') || null);

  useEffect(() => {
    if (token) {
      // Sprawdzamy czy użytkownik widział już powitanie w tej przeglądarce
      const hasSeenWelcome = localStorage.getItem('flanki_welcome_seen');
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    }
  }, [token]);

  const handleCloseWelcome = () => {
    localStorage.setItem('flanki_welcome_seen', 'true');
    setShowWelcome(false);
  };

  useEffect(() => {
    if (selectedGameId) {
      localStorage.setItem('activeGameId', selectedGameId);
    } else {
      localStorage.removeItem('activeGameId');
    }
  }, [selectedGameId]);

  useEffect(() => {
    if (!token) return;

    const params = new URLSearchParams(window.location.search);
    const joinGameId = params.get('gameId');
    const joinCode = params.get('code');

    if (joinGameId && joinCode) {
      const autoJoin = async () => {
        try {
          await api.post(`/games/join/${joinGameId}`, { code: joinCode });
          window.history.replaceState(null, "", window.location.pathname);
          setSelectedGameId(joinGameId);
          setActiveTab('dashboard');
        } catch (err) {
          if (err.response?.status !== 400) {
            alert(err.response?.data?.error || "Nie udało się dołączyć do gry z linku (zły kod lub pełne lobby).");
          }
          window.history.replaceState(null, "", window.location.pathname);
        }
      };
      autoJoin();
    }
  }, [token]);

  if (!token) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950">
      
      {/* HEADER GŁÓWNY */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center relative">
          
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)] shrink-0" />
            <h1 className="text-base font-black tracking-wider text-white leading-none">
              FLANKI<span className="text-yellow-400">HUB</span>
            </h1>
          </div>

          {user?.name && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400 tracking-wider">{user.name}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowRules(true)} 
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-300 hover:text-yellow-400 rounded-xl hover:bg-slate-900 transition-colors border border-transparent hover:border-yellow-400/30"
              title="Zasady gry"
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Zasady</span>
            </button>

            <button 
              onClick={logout} 
              className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-900 transition-colors"
              title="Wyloguj się"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* GŁÓWNY OBSZAR WIDOKU */}
      <main className="max-w-md mx-auto p-4">
        {activeTab === 'dashboard' && !selectedGameId && (
          <Dashboard onSelectGame={setSelectedGameId} />
        )}
        
        {activeTab === 'dashboard' && selectedGameId && (
          <Lobby gameId={selectedGameId} onLeave={() => setSelectedGameId(null)} />
        )}

        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'profile' && <Profile />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MODAL: POWITANIE DLA NOWEGO UŻYTKOWNIKA (Wyświetla się tylko raz) */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="w-12 h-12 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl mx-auto flex items-center justify-center mb-4 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                <Sparkles className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-black text-white mb-2">Witaj we Flanki Hub! 🍻</h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Cieszymy się, że dołączyłeś. Stwórz własne lobby, zapros znajomych za pomocą kodu PIN lub linku, walcz o punkty w globalnym rankingu uczelnianym i udowodnij, że nie ma na Was mocnych!
              </p>

              <button 
                onClick={handleCloseWelcome}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)]"
              >
                Rozumiem, do boju!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: OFICJALNE ZASADY GRY */}
      <AnimatePresence>
        {showRules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <div className="p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                <h2 className="text-base font-black text-white tracking-wider flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-yellow-400" /> Oficjalne Zasady Gry we Flanki
                </h2>
                <button onClick={() => setShowRules(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto space-y-5 text-sm text-slate-300 leading-relaxed">
                <div>
                  <h3 className="font-black text-cyan-400 mb-1">🎯 Cel gry</h3>
                  <p>Wygrywa drużyna, w której <strong>wszyscy gracze jako pierwsi skończą swoje piwo</strong>!</p>
                </div>

                <div>
                  <h3 className="font-black text-cyan-400 mb-1">👥 Drużyny i Sprzęt</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 ml-1">
                    <li>Minimum <strong>2 graczy</strong> na drużynę. Nie wolno zmieniać graczy w trakcie trwania rozgrywki!</li>
                    <li>Gra się <strong>gumową kaczką</strong> 🦆 (ewentualnie dobrze ściśniętą, pustą puszką).</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-black text-cyan-400 mb-1">🏁 Rozpoczęcie (Komis)</h3>
                  <p>Przed startem następuje tzw. <strong>komis</strong>, czyli jednoczesne otworzenie piw przez wszystkich graczy. Wolno wtedy jedynie spić "uciekającą piankę" – nic więcej!</p>
                </div>

                <div>
                  <h3 className="font-black text-cyan-400 mb-1">⚔️ Przebieg rozgrywki</h3>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-1">
                    <li>Rzuca się <strong>po kolei</strong> (naprzemiennie drużynami).</li>
                    <li>Gdy trafisz i zbijesz środkową puszkę, Twoja drużyna natychmiast zaczyna pić.</li>
                    <li>Zadaniem drużyny broniącej jest jak najszybsze odstawienie środkowej puszki do pionu oraz powrót za swoją linię startową.</li>
                    <li><strong>Złota zasada:</strong> Środkowa puszka musi STAĆ, w momencie gdy gracz wracający przekracza linię z powrotem. Wtedy drużyna rzucająca przerywa picie.</li>
                    <li>Biegać po puszkę na środek i wykonywać rzuty karne może <strong>dowolna osoba</strong> z drużyny broniącej.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-black text-red-400 mb-1">🚫 Przewinienia i Kary</h3>
                  <p>Zabrania się kategorycznie <strong>zamieniania się piwem</strong> z kimkolwiek! Każdy pije swoje. Kary to <strong>rzuty karne</strong>.</p>
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950">
                <button 
                  onClick={() => setShowRules(false)} 
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-3 rounded-xl transition-colors shadow-lg shadow-yellow-400/10"
                >
                  Zrozumiałem, gramy!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider><MainApp /></AuthProvider>
  );
}