import React from 'react';
import { Tecnico } from '../types';
import { LogOut, Wrench, RefreshCw, UserCheck } from 'lucide-react';

interface HeaderProps {
  tecnico: Tecnico | null;
  onLogout: () => void;
  onResetData?: () => void;
  onSwitchToAdmin?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ tecnico, onLogout, onResetData, onSwitchToAdmin, title }) => {
  return (
    <header className="bg-card/95 backdrop-blur-md border-b border-border sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold shadow-lg shadow-accent/25 ring-2 ring-white/10">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-foreground tracking-tight font-['Space_Grotesk']">
                FAST GÔNDOLAS
              </span>
              <span className="bg-accent/15 text-accent border border-accent/30 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                OS MOBILE
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {title || 'FAST Gôndolas & Check-outs — Gestão Técnica de Ordens de Serviço & Visitas'}
            </p>
          </div>
        </div>

        {/* Technician Info & Actions */}
        {tecnico && (
          <div className="flex items-center gap-3">
            {onSwitchToAdmin && (
              <button
                onClick={onSwitchToAdmin}
                className="px-3 py-1.5 bg-secondary hover:bg-muted text-foreground border border-border rounded-lg text-xs font-bold transition-all cursor-pointer hover:border-accent/40"
              >
                Painel Web Admin
              </button>
            )}

            <div className="hidden md:flex items-center gap-2 bg-secondary border border-border rounded-lg px-3 py-1.5">
              <img
                src={tecnico.avatar_url}
                alt={tecnico.nome}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-accent/40"
              />
              <div className="text-left">
                <p className="text-xs font-semibold text-foreground leading-tight">{tecnico.nome}</p>
                <p className="text-[10px] text-accent leading-tight">{tecnico.especialidade || 'Técnico Autorizado'}</p>
              </div>
            </div>

            {onResetData && (
              <button
                onClick={onResetData}
                title="Resetar Banco de Dados Simulado"
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

