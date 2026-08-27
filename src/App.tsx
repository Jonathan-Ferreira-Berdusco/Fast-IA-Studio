import React, { useState, useEffect } from 'react';
import { Tecnico } from './types';
import { ChamadoService } from './services/chamadoService';
import { LoginView } from './views/LoginView';
import { AdminDashboardView } from './views/AdminDashboardView';

export function App() {
  const [tecnico, setTecnico] = useState<Tecnico | null>(null);

  useEffect(() => {
    const active = ChamadoService.getTecnicoLogado();
    if (active) {
      setTecnico(active);
    }
  }, []);

  const handleLoginSuccess = (tec: Tecnico) => {
    setTecnico(tec);
  };

  const handleLogout = () => {
    ChamadoService.logout();
    setTecnico(null);
  };

  // If not logged in, show Login screen
  if (!tecnico) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Unified Management & Operations Dashboard
  return <AdminDashboardView onLogout={handleLogout} />;
}

export default App;
