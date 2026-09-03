import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { validateSystemUser, setLocalAuthUser } from '../services/systemUsers';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Check if user is a pre-configured system/admin user
      const systemUser = validateSystemUser(email, password);
      if (systemUser) {
        console.log('✅ Authenticated as System User:', systemUser.email);
        setLocalAuthUser(systemUser);
        
        // Background attempt to sync with Supabase session without blocking
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        }).catch(() => {});

        onLoginSuccess();
        return;
      }

      // 2. Try standard sign-in with Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (!signInError && signInData.session) {
        console.log('✅ Logged in successfully via Supabase:', signInData.user?.email);
        onLoginSuccess();
        return;
      }

      // 3. Intercept "Invalid login credentials" or user not found to auto-signup behind scenes
      if (signInError && (
        signInError.message.toLowerCase().includes('invalid login credentials') ||
        signInError.message.toLowerCase().includes('user not found') ||
        signInError.status === 400
      )) {
        console.log('🚀 User not found on signIn, executing auto-signUp behind scenes...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password
        });

        if (signUpError) {
          throw signUpError;
        }

        // If signup returned session or user created
        if (signUpData.session || signUpData.user) {
          console.log('✅ Auto-signup & login successful for:', signUpData.user?.email);
          
          if (!signUpData.session) {
            const { error: secondSignInErr } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password
            });
            if (secondSignInErr) throw secondSignInErr;
          }
          
          onLoginSuccess();
          return;
        }
      }

      if (signInError) {
        throw signInError;
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      setErrorMessage(err.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 selection:bg-brand-neon selection:text-black relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-neon/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Main Glassmorphic Login Card */}
      <div className="w-full max-w-md bg-brand-card/90 backdrop-blur-xl border border-brand-border/80 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Top Header with Brand Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-brand-sidebar border border-brand-border rounded-xl shadow-inner">
            <Logo />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Acesso ao Gerenciador</h1>
        </div>

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-start gap-3 text-red-400 text-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              E-mail corporativo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                className="w-full pl-10 pr-4 py-2.5 bg-brand-sidebar/80 border border-brand-border focus:border-brand-neon/60 focus:ring-1 focus:ring-brand-neon/60 rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              Senha de acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-brand-sidebar/80 border border-brand-border focus:border-brand-neon/60 focus:ring-1 focus:ring-brand-neon/60 rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-brand-neon hover:bg-brand-neonHover active:scale-[0.99] text-black font-extrabold text-xs rounded-xl shadow-lg shadow-brand-neon/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Entrar no Gerenciador</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

