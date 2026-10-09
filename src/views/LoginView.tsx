import React, { useState, useEffect } from 'react';
import { Tecnico } from '../types';
import { ChamadoService } from '../services/chamadoService';
import {
  Wrench,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Server,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface Props {
  onLoginSuccess: (tecnico: Tecnico) => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lembreme, setLembreme] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    ChamadoService.checkApiHealth().then((online) => {
      setApiOnline(online);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const user = await ChamadoService.loginWithCredentials(email.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      const msg =
        err?.detail ||
        err?.message ||
        'Falha na autenticação. Verifique suas credenciais e tente novamente.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden text-foreground font-sans select-none">
      {/* Brand Background Ambience - Corporate Blue Tones */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-xl relative z-10 backdrop-blur-xl">
        {/* Backend Status Badge */}
        <div className="flex justify-center mb-4">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
              apiOnline === true
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : apiOnline === false
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            <Server className="w-3 h-3" />
            <span>
              {apiOnline === true
                ? 'Servidor API Conectado'
                : apiOnline === false
                ? 'Servidor API Não Detectado'
                : 'Verificando Conexão...'}
            </span>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground mx-auto shadow-lg shadow-primary/25 mb-3 ring-4 ring-primary/15">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight font-['Space_Grotesk'] flex items-center justify-center gap-1.5">
            <span className="text-primary font-black">FAST</span>{' '}
            <span className="text-destructive font-black">GÔNDOLAS</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            FAST Gôndolas & Check-outs • Sistema de Gestão de Ordens de Serviço
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Não foi possível autenticar</p>
              <p className="text-[11px] mt-0.5 opacity-90">{errorMessage}</p>
            </div>
          </div>
        )}

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
                placeholder="seu.email@empresa.com.br"
                autoComplete="email"
                className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-10 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
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
                className="w-4 h-4 rounded bg-secondary border-border accent-primary cursor-pointer"
              />
              <span>Manter conectado</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-primary" /> FAST Gôndolas & Check-outs • Acesso Seguro
          </p>
        </div>
      </div>
    </div>
  );
};
