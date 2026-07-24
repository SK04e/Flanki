import React, { useState, useEffect } from 'react';
import api from './api';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import Lobby from './components/Lobby';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import { LogOut, BookOpen, X, Sparkles, Info, MessageSquare, HelpCircle, FileText, ChevronRight, ChevronLeft, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';

const FAQ_DATA = [
  { q: "Jak dołączyć do meczu?", a: "Wpisz 4-cyfrowy PIN, który poda Ci host, albo po prostu poproś go o wysłanie linku do gry." },
  { q: "Kto sędziuje mecze?", a: "Wszystko opiera się na fair play. Host ma ostateczne słowo, a ewentualne spory rozwiązujecie karnymi rzutami." },
  { q: "Dlaczego mój Win Rate spada?", a: "Ranking to stosunek wygranych meczów do wszystkich rozegranych. Przegrane automatycznie obniżają ten procent." }
];

function MainApp() {
  const { token, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(localStorage.getItem('activeGameId') || null);

  // Stany Klasycznej Szuflady iOS (Bottom Sheet)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState('menu');
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    if (token) {
      const hasSeenWelcome = localStorage.getItem('flanki_welcome_seen');
      if (!hasSeenWelcome) setShowWelcome(true);
    }
  }, [token]);

  const handleCloseWelcome = () => {
    localStorage.setItem('flanki_welcome_seen', 'true');
    setShowWelcome(false);
  };

  useEffect(() => {
    if (selectedGameId) localStorage.setItem('activeGameId', selectedGameId);
    else localStorage.removeItem('activeGameId');
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
          if (err.response?.status !== 400) toast.error(err.response?.data?.error || "Nie udało się dołączyć do gry z linku.");
          window.history.replaceState(null, "", window.location.pathname);
        }
      };
      autoJoin();
    }
  }, [token]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    toast.success("Wiadomość wysłana! Odezwiemy się wkrótce.");
    setDrawerView('menu');
  };

  if (!token) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950">
      
      <Toaster 
        position="top-center"
        toastOptions={{
          style: { background: '#0f172a', color: '#f8fafc', border: '1px solid #1e293b', fontSize: '14px', fontWeight: 'bold' },
          success: { iconTheme: { primary: '#facc15', secondary: '#0f172a' } },
        }}
      />

      {/* HEADER GŁÓWNY */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center relative">
          
          <div className="flex items-center gap-2 w-1/3">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)] shrink-0" />
            <h1 className="text-base font-black tracking-wider text-white leading-none hidden sm:block">
              FLANKI<span className="text-yellow-400">HUB</span>
            </h1>
            <h1 className="text-base font-black tracking-wider text-white leading-none sm:hidden">
              F<span className="text-yellow-400">H</span>
            </h1>
          </div>

          <div className="w-1/3 flex justify-center">
            <button 
              onClick={() => { setDrawerView('menu'); setIsDrawerOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 text-slate-300 hover:text-white rounded-full transition-all shadow-lg active:scale-95"
            >
              <Info className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Info</span>
            </button>
          </div>

          <div className="w-1/3 flex justify-end items-center gap-3">
            {user?.nick && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                {/* Powiększone imię gracza (text-sm) */}
                <span className="text-sm font-bold text-emerald-400 tracking-wider truncate max-w-[90px]">{user.nick}</span>
              </div>
            )}
            <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors bg-slate-900/50 p-1.5 rounded-lg border border-transparent hover:border-red-500/20">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* GŁÓWNY OBSZAR WIDOKU */}
      <main className="max-w-md mx-auto p-4">
        {activeTab === 'dashboard' && !selectedGameId && <Dashboard onSelectGame={setSelectedGameId} />}
        {activeTab === 'dashboard' && selectedGameId && <Lobby gameId={selectedGameId} onLeave={() => setSelectedGameId(null)} />}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'profile' && <Profile />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MODAL: POWITANIE DLA NOWEGO UŻYTKOWNIKA */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-12 h-12 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl mx-auto flex items-center justify-center mb-4 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]"><Sparkles className="w-6 h-6" /></div>
              <h2 className="text-xl font-black text-white mb-2">Witaj we Flanki Hub! 🍻</h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">Cieszymy się, że dołączyłeś. Stwórz własne lobby, zapros znajomych za pomocą kodu PIN lub linku, walcz o punkty w globalnym rankingu uczelnianym i udowodnij, że nie ma na Was mocnych!</p>
              <button onClick={handleCloseWelcome} className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)]">Rozumiem, do boju!</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* iOS STYLE BOTTOM SHEET: SZUFLADA INFO */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Tło (Zamyka po kliknięciu poza szufladą) */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm"
            />
            
            {/* Wyśrodkowana rama (Flexbox) dociśnięta do samego dołu */}
            <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border-t border-x border-slate-700/50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] pointer-events-auto overflow-hidden pb-safe"
              >
                
                {/* Uchwyt do zamykania */}
                <div className="w-full flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-slate-700/80 rounded-full" />
                </div>

                <div className="px-5 pb-3 border-b border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {drawerView !== 'menu' && (
                      <button onClick={() => setDrawerView('menu')} className="p-1.5 bg-slate-800/60 hover:bg-slate-700 rounded-lg text-slate-300 mr-1 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                    <h2 className="text-base font-black text-white tracking-wider">
                      {drawerView === 'menu' && 'Centrum Informacji'}
                      {drawerView === 'rules' && 'Zasady Gry'}
                      {drawerView === 'faq' && 'Baza Wiedzy (FAQ)'}
                      {drawerView === 'contact' && 'Kontakt i Wsparcie'}
                      {drawerView === 'legal' && 'Regulamin'}
                    </h2>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-950/50 border border-slate-800 p-1.5 rounded-full"><X className="w-4 h-4" /></button>
                </div>

                <div className="p-5 overflow-y-auto custom-scrollbar pb-10">
                  
                  {/* WIDOK: PRZEJRZYSTE MENU (LISTA) */}
                  {drawerView === 'menu' && (
                    <div className="space-y-2">
                      <button onClick={() => setDrawerView('rules')} className="w-full flex items-center p-4 bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800/60 hover:border-cyan-500/30 rounded-2xl transition-all group text-left">
                        <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                          <BookOpen className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">Zasady gry</h3>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Jak grać i wygrywać</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400" />
                      </button>

                      <button onClick={() => setDrawerView('faq')} className="w-full flex items-center p-4 bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800/60 hover:border-emerald-400/30 rounded-2xl transition-all group text-left">
                        <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                          <HelpCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">Baza Wiedzy</h3>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Najczęstsze pytania (FAQ)</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400" />
                      </button>

                      <button onClick={() => setDrawerView('contact')} className="w-full flex items-center p-4 bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800/60 hover:border-yellow-400/30 rounded-2xl transition-all group text-left">
                        <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                          <MessageSquare className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">Wsparcie i Kontakt</h3>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Twórcy i Zgłoszenia</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-yellow-400" />
                      </button>

                      <button onClick={() => setDrawerView('legal')} className="w-full flex items-center p-4 bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800/60 hover:border-purple-400/30 rounded-2xl transition-all group text-left">
                        <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                          <FileText className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">Regulamin</h3>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Zasady i Prywatność</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400" />
                      </button>
                    </div>
                  )}

                  {/* WIDOK: ZASADY */}
                  {drawerView === 'rules' && (
                    <div className="space-y-5 text-sm text-slate-300 leading-relaxed pb-2">
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
                        <p>Przed startem następuje tzw. <strong>komis</strong>, czyli jednoczesne otworzenie piw przez wszystkich graczy. Wolno wtedy jedynie spić "uciekającą piankę".</p>
                      </div>
                      <div>
                        <h3 className="font-black text-cyan-400 mb-1">⚔️ Przebieg rozgrywki</h3>
                        <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-1">
                          <li>Rzuca się <strong>po kolei</strong> (naprzemiennie drużynami).</li>
                          <li>Gdy trafisz i zbijesz środkową puszkę, Twoja drużyna natychmiast zaczyna pić.</li>
                          <li><strong>Złota zasada:</strong> Środkowa puszka musi STAĆ, gdy gracz wracający z nią przekracza linię. Wtedy rzucający przerywają picie.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* WIDOK: KONTAKT I TWÓRCY */}
                  {drawerView === 'contact' && (
                    <div className="space-y-5">
                      
                      {/* Karty Twórców */}
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <a 
                          href="https://github.com/SK04e" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="bg-[#24292e]/40 border border-[#24292e]/60 hover:bg-[#24292e]/60 rounded-2xl p-4 flex flex-col items-center justify-center transition-colors group"
                        >
                          <Github className="w-7 h-7 text-white mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GitHub</span>
                          <span className="text-sm font-black text-white mt-0.5">SK04e</span>
                        </a>
                        
                        <button 
                          onClick={() => { 
                            navigator.clipboard.writeText('sk2137'); 
                            toast.success('Skopiowano Discord ID!'); 
                          }} 
                          className="bg-[#5865F2]/10 border border-[#5865F2]/30 hover:bg-[#5865F2]/20 rounded-2xl p-4 flex flex-col items-center justify-center transition-colors group"
                        >
                          <MessageSquare className="w-7 h-7 text-[#5865F2] mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] text-[#5865F2] font-bold uppercase tracking-wider">Discord</span>
                          <span className="text-sm font-black text-white mt-0.5">sk2137</span>
                        </button>
                      </div>

                      <div className="h-px w-full bg-slate-800/60" />

                      {/* Formularz Kontaktowy */}
                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <p className="text-xs text-slate-400 font-medium">Znalazłeś błąd lub masz propozycję? Zostaw wiadomość prosto do nas.</p>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Temat</label>
                          <select required className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-yellow-400/50">
                            <option value="">Wybierz...</option>
                            <option value="bug">Zgłoszenie błędu</option>
                            <option value="feature">Propozycja ulepszenia</option>
                            <option value="account">Inne / Usunięcie konta</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Wiadomość</label>
                          <textarea required rows="4" placeholder="Opisz sprawę..." className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-yellow-400/50 resize-none"></textarea>
                        </div>
                        <button type="submit" className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black py-3 rounded-xl transition-colors mt-2 shadow-[0_0_15px_rgba(250,204,21,0.2)]">Wyślij zgłoszenie</button>
                      </form>
                    </div>
                  )}

                  {/* WIDOK: FAQ */}
                  {drawerView === 'faq' && (
                    <div className="space-y-2.5 pb-2">
                      {FAQ_DATA.map((item, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden transition-colors hover:border-slate-700">
                          <button onClick={() => setActiveFaq(activeFaq === idx ? null : idx)} className="w-full flex items-center justify-between p-4 text-left">
                            <span className="text-xs font-bold text-slate-200 pr-4">{item.q}</span>
                            <ChevronRight className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${activeFaq === idx ? 'rotate-90 text-emerald-400' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {activeFaq === idx && (
                              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <p className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/50 pt-3">{item.a}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* WIDOK: REGULAMIN */}
                  {drawerView === 'legal' && (
                    <div className="space-y-4 text-xs text-slate-300 leading-relaxed pb-4">
                      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                        <h3 className="font-bold text-purple-400 mb-1">1. Informacje ogólne</h3>
                        <p className="text-slate-400">Flanki Hub to aplikacja rozrywkowa do zarządzania rozgrywkami. Nie ponosimy odpowiedzialności za przebieg samej gry w świecie rzeczywistym.</p>
                      </div>
                      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                        <h3 className="font-bold text-purple-400 mb-1">2. Bezpieczeństwo</h3>
                        <p className="text-slate-400">Prosimy o rozważne podejście do gier imprezowych. Zawsze graj z umiarem i dbaj o bezpieczeństwo swoje i znajomych.</p>
                      </div>
                      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                        <h3 className="font-bold text-purple-400 mb-1">3. Dane osobowe</h3>
                        <p className="text-slate-400">Zbieramy tylko nick, e-mail (szyfrowany) i wybraną uczelnię. Dane nie są udostępniane podmiotom trzecim. Aby usunąć konto, napisz do nas przez zakładkę Kontakt.</p>
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            </div>
          </>
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