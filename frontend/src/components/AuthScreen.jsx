import React, { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

const UNIVERSITIES = {
  PRz: ['WEII', 'WC', 'WZ', 'WMiFS', 'WBMiL', 'WBIŚiA', 'WMT'],
  URz: ['Ogólny'],
  Other: ['Inny']
};

export default function AuthScreen() {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  
  const queryParams = new URLSearchParams(window.location.search);
  const resetTokenFromUrl = queryParams.get('reset_token');
  const [newPassword, setNewPassword] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('PRz');
  const [faculty, setFaculty] = useState('WEII');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (resetTokenFromUrl) {
        if (newPassword.length < 6) {
          alert("Hasło musi mieć minimum 6 znaków!");
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/reset-password', { token: resetTokenFromUrl, password: newPassword });
        alert(res.data.message || "Hasło zaktualizowane!");
        window.location.href = '/';
      } else if (forgotPasswordMode) {
        const res = await api.post('/auth/reset-password-request', { email });
        setMessage(res.data.message || "Wysłano link resetujący na e-mail.");
      } else if (isRegister) {
        if (password !== confirmPassword) {
          alert("Podane hasła nie są identyczne! Sprawdź poprawność.");
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/register', { name, email, password, university, faculty });
        setMessage(res.data.message || "Zarejestrowano pomyślnie! Sprawdź pocztę.");
      } else {
        const result = await login(email, password);
        if (!result.success) {
          alert(result.error);
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-yellow-400 selection:text-slate-950">
      
      <div className="absolute w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative z-10">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black tracking-wider text-white">
            FLANKI<span className="text-yellow-400">HUB</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {resetTokenFromUrl ? 'Ustaw nowe hasło' : forgotPasswordMode ? 'Odzyskiwanie hasła' : isRegister ? 'Utwórz konto gracza' : 'E-sportowa platforma do flanki'}
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 text-center font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {resetTokenFromUrl ? (
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Nowe hasło (min. 6 znaków)</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                />
              </div>
            </div>
          ) : forgotPasswordMode ? (
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Twój adres e-mail</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                />
              </div>
            </div>
          ) : (
            <>
              {isRegister && (
                <>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Nazwa / Nick</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Twój Nick"
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Uczelnia</label>
                      <select
                        value={university}
                        onChange={(e) => {
                          setUniversity(e.target.value);
                          setFaculty(UNIVERSITIES[e.target.value]?.[0] || 'Ogólny');
                        }}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                      >
                        <option value="PRz">PRz</option>
                        <option value="URz">URz</option>
                        <option value="Other">Inna</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Wydział</label>
                      <select
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                      >
                        {UNIVERSITIES[university]?.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">E-mail</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Hasło</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                  />
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Potwierdź hasło</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)] mt-2 disabled:opacity-50"
          >
            {loading ? 'Przetwarzanie...' : resetTokenFromUrl ? 'Zmień hasło' : forgotPasswordMode ? 'Wyślij link resetujący' : isRegister ? 'Zarejestruj się' : 'Zaloguj się'}
          </button>
        </form>

        {/* "Zapomniałeś hasła?" wyśrodkowane pod przyciskiem logowania, trochę niżej */}
        {!isRegister && !resetTokenFromUrl && !forgotPasswordMode && (
          <div className="mt-3.5 text-center">
            <button
              type="button"
              onClick={() => setForgotPasswordMode(true)}
              className="text-xs text-slate-400 hover:text-yellow-400 font-bold transition-colors"
            >
              Zapomniałeś hasła?
            </button>
          </div>
        )}

        <div className="mt-4 text-center">
          {resetTokenFromUrl || forgotPasswordMode ? (
            <button
              onClick={() => { setForgotPasswordMode(false); window.history.replaceState(null, "", window.location.pathname); }}
              className="text-xs text-slate-400 hover:text-white font-bold flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Powrót do logowania
            </button>
          ) : (
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-slate-400 hover:text-yellow-400 font-bold transition-colors"
            >
              {isRegister ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
}