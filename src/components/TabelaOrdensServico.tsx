import React, { useState } from 'react';
import { OrdemServico, StatusChamado, Tecnico } from '../types';
import { StatusBadge } from './StatusBadge';
import {
  Search,
  Filter,
  Eye,
  Edit2,
  UserCheck,
  Building,
  Wrench,
  Clock,
  ShieldCheck,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface Props {
  chamados: OrdemServico[];
  tecnicos: Tecnico[];
  onSelectOS: (os: OrdemServico) => void;
  onEditOS: (os: OrdemServico) => void;
  onAssignTecnico: (os: OrdemServico) => void;
  onOpenNovaOS: () => void;
}

export const TabelaOrdensServico: React.FC<Props> = ({
  chamados,
  tecnicos,
  onSelectOS,
  onEditOS,
  onAssignTecnico,
  onOpenNovaOS,
}) => {
  const [filterStatus, setFilterStatus] = useState<StatusChamado | 'TODOS'>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter logic
  const filtered = chamados.filter((item) => {
    if (filterStatus !== 'TODOS' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCode = item.codigo_os.toLowerCase().includes(q);
      const matchClient = item.cliente.nome_fantasia.toLowerCase().includes(q);
      const matchCity = item.cliente.cidade.toLowerCase().includes(q);
      const matchTec = item.tecnico?.nome.toLowerCase().includes(q);
      const matchDesc = item.descricao_cliente.toLowerCase().includes(q);
      return matchCode || matchClient || matchCity || matchTec || matchDesc;
    }
    return true;
  });

  return (
    <div className="surface-card p-5 space-y-4">
      {/* Header Controls & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-foreground font-['Space_Grotesk'] tracking-tight">
            Gestão Geral de Ordens de Serviço
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Exibindo <strong className="text-accent">{filtered.length}</strong> de {chamados.length} ordens de serviço
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar código, cliente, cidade ou técnico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none cursor-pointer"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ABERTO">Aberto (Aguardando)</option>
            <option value="EM_ATENDIMENTO">Em Atendimento</option>
            <option value="PAUSADO">Pausado</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          <button
            onClick={onOpenNovaOS}
            className="py-2 px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Nova OS</span>
          </button>
        </div>
      </div>

      {/* OS Responsive Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/80 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Código / Status</th>
              <th className="py-3 px-4">Cliente / Localização</th>
              <th className="py-3 px-4">Técnico Responsável</th>
              <th className="py-3 px-4">Data de Agendamento</th>
              <th className="py-3 px-4">Garantia</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma ordem de serviço encontrada com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const tec = item.tecnico;
                return (
                  <tr key={item.id_os} className="hover:bg-muted/50 transition-colors group">
                    {/* Código & Status */}
                    <td className="py-3.5 px-4 font-medium">
                      <div className="flex flex-col gap-1">
                        <span className="font-extrabold text-foreground font-['Space_Grotesk'] text-xs group-hover:text-primary transition-colors">
                          #{item.codigo_os}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-foreground flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{item.cliente.nome_fantasia}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item.cliente.cidade}/{item.cliente.uf} • Contato: {item.cliente.contato_responsavel}
                        </p>
                      </div>
                    </td>

                    {/* Técnico */}
                    <td className="py-3.5 px-4">
                      {tec ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={tec.avatar_url}
                            alt={tec.nome}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
                          />
                          <div>
                            <p className="font-bold text-foreground text-xs">{tec.nome.split(' ')[0]} {tec.nome.split(' ')[1] || ''}</p>
                            <p className="text-[10px] text-muted-foreground">{tec.email}</p>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAssignTecnico(item)}
                          className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[11px] font-semibold border border-primary/30 flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3" /> Atribuir
                        </button>
                      )}
                    </td>

                    {/* Agendamento */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-foreground/90 font-medium">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{item.data_agendamento || item.data_abertura}</span>
                      </div>
                    </td>

                    {/* Garantia */}
                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                        item.em_garantia ? 'text-success' : 'text-muted-foreground'
                      }`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {item.em_garantia ? 'Em Garantia' : 'Faturado'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Visualizar Detalhes da OS"
                          onClick={() => onSelectOS(item)}
                          className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/30 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detalhes</span>
                        </button>

                        <button
                          title="Reatribuir Técnico"
                          onClick={() => onAssignTecnico(item)}
                          className="p-1.5 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>

                        <button
                          title="Editar OS"
                          onClick={() => onEditOS(item)}
                          className="p-1.5 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


