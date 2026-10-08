import React from 'react';
import {
  Plus,
  LogOut,
} from 'lucide-react';

interface Props {
  activeTabTitle: string;
  totalChamados: number;
  totalConcluidos: number;
  onOpenNovaOS: () => void;
  onLogout?: () => void;
}

export const AdminHeader: React.FC<Props> = ({
  activeTabTitle,
  totalChamados,
  totalConcluidos,
  onOpenNovaOS,
  onLogout,
}) => {
  return (
    <header className="bg-[#003875] border-b border-blue-900/60 sticky top-0 z-30 px-6 py-4 text-white shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title */}
        <div>
          <h1 className="text-xl font-black text-white font-['Space_Grotesk'] tracking-tight flex items-center gap-2">
            <span>{activeTabTitle}</span>
          </h1>
          <p className="text-xs text-blue-200 mt-0.5 font-medium">
            Gestão Integrada de Ordens de Serviço — FAST Gôndolas & Check-outs
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-3 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/20 text-xs backdrop-blur-xs">
            <div>
              <span className="text-blue-200 text-[10px] block font-medium">Total OS</span>
              <span className="font-bold text-white">{totalChamados}</span>
            </div>
            <div className="h-5 w-px bg-white/20" />
            <div>
              <span className="text-blue-200 text-[10px] block font-medium">Concluídas</span>
              <span className="font-bold text-emerald-300">{totalConcluidos}</span>
            </div>
          </div>

          {/* Nova OS */}
          <button
            onClick={onOpenNovaOS}
            className="px-4 py-2 bg-white hover:bg-blue-50 text-[#003875] font-black text-xs rounded-xl shadow-md shadow-black/20 flex items-center gap-1.5 transition-all cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-[#003875] group-hover:rotate-90 transition-transform" />
            <span>Nova OS</span>
          </button>

          {/* Logout if provided */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sair do Sistema"
              className="p-2 bg-white/10 hover:bg-red-500/25 text-white hover:text-red-200 rounded-xl border border-white/20 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


