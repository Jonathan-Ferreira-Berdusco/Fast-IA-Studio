import React, { useState, useEffect } from 'react';
import { OrdemServico, StatusChamado, Tecnico } from '../types';
import { ChamadoService } from '../services/chamadoService';
import { CardChamado } from '../components/CardChamado';
import { Header } from '../components/Header';
import { Search, Filter, Wrench, Clock, PlayCircle, PauseCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface Props {
  tecnico: Tecnico;
  onLogout: () => void;
  onSelectChamado: (id_os: number) => void;
  onSwitchToAdmin?: () => void;
}

export const HomeView: React.FC<Props> = ({ tecnico, onLogout, onSelectChamado, onSwitchToAdmin }) => {
  const [chamados, setChamados] = useState<OrdemServico[]>([]);
  const [filterStatus, setFilterStatus] = useState<StatusChamado | 'TODOS'>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');

  const loadChamados = () => {
    const list = ChamadoService.listarChamados(filterStatus, searchQuery);
    setChamados(list);
  };

  useEffect(() => {
    loadChamados();
  }, [filterStatus, searchQuery]);

  // Stats calculation
  const totalCount = chamados.length;
  const abertosCount = chamados.filter((c) => c.status === 'ABERTO').length;
  const emAndamentoCount = chamados.filter((c) => c.status === 'EM_ATENDIMENTO').length;
  const pausadosCount = chamados.filter((c) => c.status === 'PAUSADO').length;
  const concluidosCount = chamados.filter((c) => c.status === 'CONCLUIDO').length;

  const tabs: { key: StatusChamado | 'TODOS'; label: string; count: number }[] = [
    { key: 'TODOS', label: 'Todos', count: totalCount },
    { key: 'EM_ATENDIMENTO', label: 'Em Atendimento', count: emAndamentoCount },
    { key: 'PAUSADO', label: 'Pausados', count: pausadosCount },
    { key: 'ABERTO', label: 'Abertos', count: abertosCount },
    { key: 'CONCLUIDO', label: 'Concluídos', count: concluidosCount },
  ];

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground">
      <Header tecnico={tecnico} onLogout={onLogout} onSwitchToAdmin={onSwitchToAdmin} />

      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {/* Welcome & Stats Row */}
        <div className="surface-card p-6 relative overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-foreground font-['Space_Grotesk'] tracking-tight">
                Olá, {tecnico.nome.split(' ')[0]} 👋
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Você possui <strong className="text-accent">{emAndamentoCount + abertosCount} chamado(s) ativos</strong> para atendimento hoje.
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-secondary/70 border border-border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-accent text-xs font-semibold mb-1">
                  <PlayCircle className="w-3.5 h-3.5" /> Em Atendimento
                </div>
                <span className="text-xl font-bold text-foreground font-['Space_Grotesk']">{emAndamentoCount}</span>
              </div>

              <div className="bg-secondary/70 border border-border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-warning text-xs font-semibold mb-1">
                  <PauseCircle className="w-3.5 h-3.5" /> Pausados
                </div>
                <span className="text-xl font-bold text-foreground font-['Space_Grotesk']">{pausadosCount}</span>
              </div>

              <div className="bg-secondary/70 border border-border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-info text-xs font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5" /> Abertos
                </div>
                <span className="text-xl font-bold text-foreground font-['Space_Grotesk']">{abertosCount}</span>
              </div>

              <div className="bg-secondary/70 border border-border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-success text-xs font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Concluídos
                </div>
                <span className="text-xl font-bold text-foreground font-['Space_Grotesk']">{concluidosCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Tabs Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border overflow-x-auto shadow-2xs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === tab.key
                    ? 'bg-accent text-white font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filterStatus === tab.key ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 md:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por OS, Cliente ou Endereço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none shadow-2xs"
            />
          </div>
        </div>

        {/* Chamados Grid */}
        {chamados.length === 0 ? (
          <div className="surface-card p-12 text-center my-8 shadow-sm">
            <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">Nenhum chamado encontrado</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Tente alterar os filtros ou a palavra de busca para encontrar as Ordens de Serviço.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chamados.map((item) => (
              <CardChamado key={item.id_os} chamado={item} onSelect={onSelectChamado} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
