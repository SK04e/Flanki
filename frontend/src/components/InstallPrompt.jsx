import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Sprawdzamy czy to iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPhone = /iphone|ipad|ipod/.test(userAgent);
    
    // Sprawdzamy czy apka już jest zainstalowana (standalone)
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    // Jeśli to iOS i apka nie jest zainstalowana -> pokazujemy instrukcję
    if (isIPhone && !isStandalone) {
      setIsIOS(true);
      
      // Pokazujemy z opóźnieniem (np. po 3 sekundach od wejścia)
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Dla Androida / Chrome wyłapujemy natywne zdarzenie przeglądarki
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Blokujemy chamski domyślny popup
      setDeferredPrompt(e); // Zapisujemy zdarzenie na później
      
      // Pokazujemy nasz piękny popup po 3 sekundach
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Wywołujemy natywny instalator
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

          {isIOS ? (
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
              <p className="mb-2">Na iPhone musisz to zrobić ręcznie:</p>
              <ol className="space-y-2">
                <li className="flex items-center gap-2">
                  1. Kliknij ikonę Udostępnij <Share className="w-4 h-4 text-cyan-400 inline" /> na dolnym pasku.
                </li>
                <li className="flex items-center gap-2">
                  2. Wybierz <strong>Do ekranu początkowego</strong> <PlusSquare className="w-4 h-4 text-slate-400 inline" />
                </li>
              </ol>
            </div>
          ) : (
            <button 
              onClick={handleInstallClick}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)] text-sm"
            >
              Zainstaluj teraz
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}