import React, { useState, useEffect } from 'react';
import { Tecnico } from '../types';
import { ChamadoService } from '../services/chamadoService';
import { TECNICOS_MOCK } from '../data/mockData';
import {
  Wrench,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Server,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface Props {
  onLoginSuccess: (tecnico: Tecnico) => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@fastariam.com');
  const [password, setPassword] = useState('admin123');
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
    setLoading(true);
    setErrorMessage(null);

    try {
      const user = await ChamadoService.loginWithCredentials(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      console.warn('Erro ao autenticar:', err);
      const msg =
        err?.detail ||
        err?.message ||
        'Não foi possível autenticar. Verifique se o backend FastAPI está em execução na porta 8000.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLoginAdmin = () => {
    setEmail('admin@fastariam.com');
    setPassword('admin123');
  };

  const handleQuickLoginTecnico = () => {
    setEmail('eletropaulorefrigeracao@gmail.com');
    setPassword('senhaSuperSecreta123');
  };

  const handleOfflineDemo = () => {
    const demo = TECNICOS_MOCK[0];
    ChamadoService.login(demo.id_tecnico);
    onLoginSuccess(demo);
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
              apiOnline
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            <Server className="w-3 h-3" />
            <span>
              {apiOnline
                ? 'Backend FastAPI Conectado (:8000)'
                : 'Backend FastAPI Local (http://127.0.0.1:8000)'}
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
            FAST Gôndolas & Check-outs • Sistema Integrado de Gestão Técnica
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Falha na Autenticação</p>
              <p className="text-[11px] mt-0.5 opacity-90">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              E-mail de Acesso (Username)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fastariam.com"
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
                placeholder="admin123"
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
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando via API...</span>
              </>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Helpers */}
        <div className="mt-6 pt-4 border-t border-border space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">
            Credenciais Padrão do Backend
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickLoginAdmin}
              className="py-2 px-2 bg-secondary hover:bg-primary/10 text-foreground hover:text-primary border border-border hover:border-primary/30 rounded-xl text-[11px] font-bold transition-all text-center"
            >
              👑 Admin Mestre
              <span className="block text-[9px] font-normal text-muted-foreground">admin123</span>
            </button>
            <button
              type="button"
              onClick={handleQuickLoginTecnico}
              className="py-2 px-2 bg-secondary hover:bg-primary/10 text-foreground hover:text-primary border border-border hover:border-primary/30 rounded-xl text-[11px] font-bold transition-all text-center"
            >
              🔧 Técnico Campo
              <span className="block text-[9px] font-normal text-muted-foreground">senhaSuperSecreta123</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOfflineDemo}
            className="w-full mt-2 py-2 px-3 bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground border border-dashed border-border rounded-xl text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Acessar no Modo Local / Offline</span>
          </button>
        </div>

        {/* Security Footer */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-primary" /> FAST Gôndolas & Check-outs v2.4 • FastAPI Integration
          </p>
        </div>
      </div>
    </div>
  );
};
