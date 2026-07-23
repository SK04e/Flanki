import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, User, GraduationCap, Building2, Beer, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function AuthScreen() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '', // Nowe pole do potwierdzenia hasła
    university: '',
    faculty: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isResettingPassword) {
        // RESETOWANIE HASŁA
        const res = await api.post('/auth/reset-password-request', { email: formData.email });
        setSuccessMessage(res.data.message || 'Jeśli e-mail istnieje w bazie, wysłano link.');
        setIsResettingPassword(false);
      } else if (isLogin) {
        // LOGOWANIE
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          setError(result.error);
        }
      } else {
        // REJESTRACJA
        if (formData.password !== formData.confirmPassword) {
          setError('Hasła nie są identyczne!');
          setLoading(false);
          return;
        }

        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          university: formData.university || null,
          // Wysyłamy wydział tylko jeśli wybrano PRZ
          faculty: formData.university === 'PRZ' ? formData.faculty : null
        };
        
        const res = await api.post('/auth/register', payload);
        setSuccessMessage(res.data.message || 'Zarejestrowano pomyślnie! Sprawdź skrzynkę e-mail.');
        setIsLogin(true); 
        setFormData({ name: '', email: '', password: '', confirmPassword: '', university: '', faculty: '' });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Wystąpił błąd połączenia z serwerem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* TŁO - BLUR EFEKT */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-yellow-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[250px] h-[250px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* LOGO */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.3)] mb-4"
          >
            <Beer className="w-8 h-8 text-slate-950 fill-slate-950/20" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-wider text-white">
            FLANKI<span className="text-yellow-400">HUB</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            Uczelniana Liga
          </p>
        </div>

        {/* KARTA FORMULARZA */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
          
          {/* PRZEŁĄCZNIK LOGOWANIE / REJESTRACJA (Ukryty podczas resetowania hasła) */}
          {!isResettingPassword && (
            <div className="flex bg-slate-950/50 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); setSuccessMessage(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <LogIn className="w-4 h-4" /> Zaloguj
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); setSuccessMessage(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <UserPlus className="w-4 h-4" /> Dołącz
              </button>
            </div>
          )}

          {isResettingPassword && (
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-white mb-2">Zresetuj hasło</h2>
              <p className="text-sm text-slate-400">Podaj adres e-mail przypisany do konta, a wyślemy Ci link do zmiany hasła.</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
            {successMessage && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p>{successMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* POLA REJESTRACJI */}
            {!isLogin && !isResettingPassword && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Twój Nick (widoczny w grze)"
                    required={!isLogin}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GraduationCap className="w-4 h-4 text-slate-500" />
                  </div>
                  <select 
                    name="university" 
                    value={formData.university}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors appearance-none"
                  >
                    <option value="" className="bg-slate-800 text-slate-400">Wybierz uczelnię...</option>
                    <option value="PRZ" className="bg-slate-800 text-white">Politechnika Rzeszowska (PRz)</option>
                    <option value="URZ" className="bg-slate-800 text-white">Uniwersytet Rzeszowski (URz)</option>
                    <option value="Other" className="bg-slate-800 text-white">Inna uczelnia / Brak</option>
                  </select>
                </div>

                {/* WYDZIAŁ - tylko dla PRZ */}
                {formData.university === 'PRZ' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Building2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <select 
                      name="faculty" 
                      value={formData.faculty}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors appearance-none"
                    >
                      <option value="" className="bg-slate-800 text-slate-400">Wybierz wydział...</option>
                      <option value="WEII" className="bg-slate-800 text-white">Wydział Elektrotechniki i Informatyki (WEiI)</option>
                      <option value="WC" className="bg-slate-800 text-white">Wydział Chemiczny (WC)</option>
                      <option value="WZ" className="bg-slate-800 text-white">Wydział Zarządzania (WZ)</option>
                      <option value="WMiFS" className="bg-slate-800 text-white">Wydział Matematyki i Fizyki Stosowanej (WMiFS)</option>
                      <option value="WBMiL" className="bg-slate-800 text-white">Wydział Budowy Maszyn i Lotnictwa (WBMiL)</option>
                      <option value="WBIŚiA" className="bg-slate-800 text-white">Wydział Budownictwa, Inż. Środ. i Architektury (WBIŚiA)</option>
                      <option value="WMT" className="bg-slate-800 text-white">Wydział Mechaniczno-Technologiczny (WMT)</option>
                    </select>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* EMAIL */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Adres e-mail"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
              />
            </div>

            {/* HASŁO */}
            {!isResettingPassword && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isLogin ? "Hasło" : "Hasło (min. 6 znaków)"}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                />
              </div>
            )}

            {/* POTWIERDŹ HASŁO (tylko przy rejestracji) */}
            {!isLogin && !isResettingPassword && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Powtórz hasło"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                />
              </motion.div>
            )}

            {/* LINK DO RESETU HASŁA (pod hasłem w logowaniu) */}
            {isLogin && !isResettingPassword && (
              <div className="flex justify-end mt-1">
                <button 
                  type="button" 
                  onClick={() => setIsResettingPassword(true)} 
                  className="text-xs font-bold text-slate-400 hover:text-yellow-400 transition-colors"
                >
                  Zapomniałeś hasła?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Przetwarzanie...' : (isResettingPassword ? 'Wyślij link resetujący' : isLogin ? 'Wejdź do gry' : 'Załóż konto')}
            </button>
            
          </form>

          {/* DODATKOWE LINKI NA DOLE (Logowanie w rejestracji itd.) */}
          <div className="mt-6 text-center text-sm text-slate-400">
            {isResettingPassword ? (
              <button 
                type="button" 
                onClick={() => { setIsResettingPassword(false); setError(''); setSuccessMessage(''); }} 
                className="hover:text-yellow-400 font-bold transition-colors"
              >
                Wróć do logowania
              </button>
            ) : isLogin ? (
              <p>Nie masz konta? <button type="button" onClick={() => { setIsLogin(false); setError(''); }} className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors ml-1">Zarejestruj się</button></p>
            ) : (
              <p>Masz już konto? <button type="button" onClick={() => { setIsLogin(true); setError(''); }} className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors ml-1">Zaloguj się</button></p>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}