import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, MoreVertical } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Rozpoznajemy urządzenie
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(userAgent);
    const isApple = /iphone|ipad|ipod/.test(userAgent);
    
    // Sprawdzamy czy apka już jest zainstalowana (standalone)
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    // Jeśli apka już jest zainstalowana lub to komputer -> nic nie pokazujemy
    if (!isMobile || isStandalone) return;

    if (isApple) setIsIOS(true);

    // Na telefonie ZAWSZE pokazujemy banner po 3 sekundach
    const timer = setTimeout(() => setShowPrompt(true), 3000);

    // Przechwytujemy automatyczny instalator Chrome/Android (jeśli przeglądarka na to pozwoli)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: 100, opacity: 0 }} 
        className="fixed bottom-20 left-4 right-4 z-50 pointer-events-auto"
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 p-4 rounded-2xl shadow-2xl flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400/10 rounded-xl border border-yellow-400/30 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Zainstaluj Flanki Hub</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Szybsze działanie i pełny ekran!</p>
              </div>
            </div>
            <button onClick={() => setShowPrompt(false)} className="text-slate-500 hover:text-white bg-slate-800/50 p-1.5 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* INSTRUKCJA DLA IOS (APPLE) */}
          {isIOS ? (
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
              <ol className="space-y-2">
                <li className="flex items-center gap-2">
                  1. Kliknij Udostępnij <Share className="w-4 h-4 text-cyan-400 inline" /> na dolnym pasku.
                </li>
                <li className="flex items-center gap-2">
                  2. Wybierz <strong>Do ekranu początkowego</strong> <PlusSquare className="w-4 h-4 text-slate-400 inline" />
                </li>
              </ol>
            </div>
          ) 
          
          /* PRZYCISK DLA ANDROIDA (Gdy instalator Chrome zadziałał) */
          : deferredPrompt ? (
            <button 
              onClick={handleInstallClick}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)] text-sm"
            >
              Zainstaluj teraz
            </button>
          ) 
          
          /* AWARYJNA INSTRUKCJA DLA ANDROIDA (Gdy instalator Chrome zablokował przycisk) */
          : (
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
              <ol className="space-y-2">
                <li className="flex items-center gap-2">
                  1. Kliknij menu <MoreVertical className="w-4 h-4 text-cyan-400 inline" /> w prawym górnym rogu.
                </li>
                <li>
                  2. Wybierz opcję <strong>Zainstaluj aplikację</strong> lub <strong>Dodaj do ekranu głównego</strong>.
                </li>
              </ol>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}