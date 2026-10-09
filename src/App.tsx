import React, { useState, useEffect } from 'react';
import { Tecnico } from './types';
import { ChamadoService } from './services/chamadoService';
import { LoginView } from './views/LoginView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { HomeView } from './views/HomeView';
import { DetalheChamadoView } from './views/DetalheChamadoView';

export function App() {
  const [tecnico, setTecnico] = useState<Tecnico | null>(null);
  const [viewMode, setViewMode] = useState<'admin' | 'tecnico'>('admin');
  const [selectedOSId, setSelectedOSId] = useState<number | null>(null);

  useEffect(() => {
    const active = ChamadoService.getTecnicoLogado();
    if (active) {
      setTecnico(active);
      if (active.role === 'tecnico') {
        setViewMode('tecnico');
      } else {
        setViewMode('admin');
      }
    }

    // Tenta sincronizar com o backend FastAPI automaticamente
    ChamadoService.syncWithBackend().catch(() => {});
  }, []);

  const handleLoginSuccess = (tec: Tecnico) => {
    setTecnico(tec);
    if (tec.role === 'tecnico') {
      setViewMode('tecnico');
    } else {
      setViewMode('admin');
    }
  };

  const handleLogout = () => {
    ChamadoService.logout();
    setTecnico(null);
    setSelectedOSId(null);
  };

  // Se não estiver logado, exibe tela de login integrada
  if (!tecnico) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Se técnico selecionou uma OS para atendimento detalhado
  if (viewMode === 'tecnico' && selectedOSId !== null) {
    return (
      <DetalheChamadoView
        id_os={selectedOSId}
        onBack={() => setSelectedOSId(null)}
      />
    );
  }

  // Modo Técnico de Campo (Mobile / Operacional)
  if (viewMode === 'tecnico') {
    return (
      <HomeView
        tecnico={tecnico}
        onLogout={handleLogout}
        onSelectChamado={(id_os) => setSelectedOSId(id_os)}
        onSwitchToAdmin={() => setViewMode('admin')}
      />
    );
  }

  // Painel de Gestão Integrada (Admin Dashboard)
  return (
    <AdminDashboardView
      onLogout={handleLogout}
      onSwitchToTechView={() => setViewMode('tecnico')}
    />
  );
}

export default App;
