import React, { useState, useEffect } from 'react';
import { Tecnico } from './types';
import { ChamadoService } from './services/chamadoService';
import { LoginView } from './views/LoginView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { Shield, Smartphone, LogOut } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<Tecnico | null>(null);

  useEffect(() => {
    const active = ChamadoService.getTecnicoLogado();
    if (active) {
      setUser(active);
    }

    // Tenta sincronizar com o backend FastAPI automaticamente
    ChamadoService.syncWithBackend().catch(() => {});
  }, []);

  const handleLoginSuccess = (usr: Tecnico) => {
    setUser(usr);
  };

  const handleLogout = () => {
    ChamadoService.logout();
    setUser(null);
  };

  // Se não estiver logado, exibe tela de login integrada
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Se o usuário logado for exclusivamente técnico de campo operacional:
  // Informa com clareza que o portal web é 100% administrativo e orienta para o app mobile
  if (user.role === 'tecnico') {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 text-foreground font-sans">
        <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-md">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
              Acesso Técnico de Campo
            </span>
            <h1 className="text-xl font-black text-foreground font-['Space_Grotesk']">
              Portal Web Exclusivo para Administradores
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Olá, <strong className="text-foreground">{user.nome}</strong>. O painel web da FAST Gôndolas & Check-outs é dedicado exclusivamente à gestão administrativa e despacho de Ordens de Serviço.
            </p>
          </div>

          <div className="bg-secondary/60 p-4 rounded-2xl border border-border text-left text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>Como executar seus atendimentos:</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Utilize o <strong>Aplicativo Mobile FAST</strong> instalado no seu smartphone para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground text-[11px] space-y-1 pl-1">
              <li>Registrar fotos do odômetro e deslocamento (ida e volta)</li>
              <li>Fazer check-in no cliente e apontamento de serviços</li>
              <li>Coletar fotos de defeitos e assinatura digital do cliente</li>
            </ul>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 bg-secondary hover:bg-muted text-foreground border border-border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
            <span>Sair e Conectar como Administrador</span>
          </button>
        </div>
      </div>
    );
  }

  // Painel de Gestão Integrada (Admin Dashboard) 100% voltado para o Administrador
  return (
    <AdminDashboardView onLogout={handleLogout} />
  );
}

export default App;
