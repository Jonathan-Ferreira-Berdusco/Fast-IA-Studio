import React, { useState } from 'react';
import { Tecnico } from '../types';
import { TECNICOS_MOCK } from '../data/mockData';
import { Wrench, Shield, ArrowRight, Lock, Mail, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';

interface Props {
  onLoginSuccess: (tecnico: Tecnico) => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@fastgondolas.com.br');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [lembreme, setLembreme] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess(TECNICOS_MOCK[0]);
  };

  const handleQuickLogin = () => {
    onLoginSuccess(TECNICOS_MOCK[0]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden text-foreground font-sans select-none">
      {/* Brand Background Ambience - Corporate Blue Tones */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-xl relative z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground mx-auto shadow-lg shadow-primary/25 mb-3 ring-4 ring-primary/15">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight font-['Space_Grotesk'] flex items-center justify-center gap-1.5">
            <span className="text-primary font-black">FAST</span> <span className="text-destructive font-black">GÔNDOLAS</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            FAST Gôndolas & Check-outs • Sistema Integrado de Gestão Técnica
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: admin@fastgondolas.com.br"
                className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-10 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={lembreme}
                onChange={(e) => setLembreme(e.target.checked)}
                className="w-4 h-4 rounded bg-secondary border-border accent-primary"
              />
              <span>Lembrar de mim</span>
            </label>
            <span className="text-primary hover:underline cursor-pointer text-[11px] font-medium">
              Esqueceu a senha?
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Entrar no Sistema</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="mt-6 pt-4 border-t border-border space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">
            Acesso Rápido de Demonstração
          </p>
          <button
            type="button"
            onClick={handleQuickLogin}
            className="w-full py-2 px-3 bg-secondary hover:bg-primary/10 text-foreground hover:text-primary border border-border hover:border-primary/30 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Acessar com Credenciais Demo</span>
          </button>
        </div>

        {/* Security Footer */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-primary" /> FAST Gôndolas & Check-outs v2.4
          </p>
        </div>
      </div>
    </div>
  );
};


