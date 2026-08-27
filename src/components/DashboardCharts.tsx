import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { OrdemServico, Tecnico, StatusChamado } from '../types';
import { Filter, PieChart as PieIcon, BarChart2 } from 'lucide-react';

interface Props {
  chamados: OrdemServico[];
  tecnicos: Tecnico[];
  chartStatusFilter?: StatusChamado | 'TODOS';
  onChartStatusFilterChange?: (status: StatusChamado | 'TODOS') => void;
}

export const DashboardCharts: React.FC<Props> = ({
  chamados,
  tecnicos,
  chartStatusFilter = 'TODOS',
  onChartStatusFilterChange,
}) => {
  const [internalStatus, setInternalStatus] = useState<StatusChamado | 'TODOS'>(chartStatusFilter);

  const activeStatus = onChartStatusFilterChange ? chartStatusFilter : internalStatus;
  const handleStatusChange = (s: StatusChamado | 'TODOS') => {
    if (onChartStatusFilterChange) {
      onChartStatusFilterChange(s);
    } else {
      setInternalStatus(s);
    }
  };

  // Filter chamados specifically for the charts if a status is selected
  const chartChamados = activeStatus === 'TODOS'
    ? chamados
    : chamados.filter((c) => c.status === activeStatus);

  // Calculate status counts for the distribution pie chart
  const abertos = (activeStatus === 'TODOS' || activeStatus === 'ABERTO')
    ? chamados.filter((c) => c.status === 'ABERTO').length
    : 0;
  const emAtendimento = (activeStatus === 'TODOS' || activeStatus === 'EM_ATENDIMENTO')
    ? chamados.filter((c) => c.status === 'EM_ATENDIMENTO').length
    : 0;
  const pausados = (activeStatus === 'TODOS' || activeStatus === 'PAUSADO')
    ? chamados.filter((c) => c.status === 'PAUSADO').length
    : 0;
  const concluidos = (activeStatus === 'TODOS' || activeStatus === 'CONCLUIDO')
    ? chamados.filter((c) => c.status === 'CONCLUIDO').length
    : 0;
  const cancelados = (activeStatus === 'TODOS' || activeStatus === 'CANCELADO')
    ? chamados.filter((c) => c.status === 'CANCELADO').length
    : 0;

  // FAST brand chart colors: Corporate Blue, Light Blue, Amber, Green, Red
  const statusData = [
    { name: 'Aberto', value: abertos, color: '#004F9F' },
    { name: 'Em Atendimento', value: emAtendimento, color: '#2563EB' },
    { name: 'Pausado', value: pausados, color: '#D97706' },
    { name: 'Concluído', value: concluidos, color: '#16A34A' },
    { name: 'Cancelado', value: cancelados, color: '#DC2626' },
  ].filter((d) => d.value > 0);

  // Calculate Technician workload based on filtered chartChamados
  const tecnicoWorkloadData = tecnicos.map((tec) => {
    const ativas = chartChamados.filter(
      (c) => c.id_tecnico_atribuido === tec.id_tecnico && (c.status === 'EM_ATENDIMENTO' || c.status === 'ABERTO' || c.status === 'PAUSADO')
    ).length;
    const concluidas = chartChamados.filter(
      (c) => c.id_tecnico_atribuido === tec.id_tecnico && c.status === 'CONCLUIDO'
    ).length;
    const canceladas = chartChamados.filter(
      (c) => c.id_tecnico_atribuido === tec.id_tecnico && c.status === 'CANCELADO'
    ).length;

    return {
      nome: tec.nome.split(' ')[0] + ' ' + (tec.nome.split(' ')[1]?.[0] || '') + '.',
      Ativas: ativas,
      Concluídas: concluidas,
      Canceladas: canceladas,
    };
  });

  return (
    <div className="space-y-4">
      {/* Charts Status Filter Sub-Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-foreground">
            Filtro Exclusivo de Gráficos (Status):
          </span>
          <span className="text-[11px] text-muted-foreground">
            {chartChamados.length} OS consideradas nos gráficos
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activeStatus}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="bg-secondary border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground focus:border-accent focus:outline-none cursor-pointer"
          >
            <option value="TODOS">Todos os Status nos Gráficos</option>
            <option value="ABERTO">Somente Abertos</option>
            <option value="EM_ATENDIMENTO">Somente Em Atendimento</option>
            <option value="PAUSADO">Somente Pausados</option>
            <option value="CONCLUIDO">Somente Concluídos</option>
            <option value="CANCELADO">Somente Cancelados</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Status Distribution (Pie Chart) */}
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-accent/10 rounded-xl border border-accent/20 text-accent">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground font-['Space_Grotesk']">
                  Distribuição por Status
                </h3>
                <p className="text-xs text-muted-foreground">Volume de ordens de serviço por etapa operacional</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-secondary text-accent border border-border">
              {chartChamados.length} OS
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '0.75rem',
                      color: 'var(--color-foreground)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-foreground/80 text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-xs">Sem dados de status no momento.</div>
            )}
          </div>
        </div>

        {/* Chart 2: Technical Workload (Bar Chart) */}
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground font-['Space_Grotesk']">
                  Ordens por Técnico
                </h3>
                <p className="text-xs text-muted-foreground">Distribuição de chamados na equipe de campo</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tecnicoWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="nome" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '0.75rem',
                    color: 'var(--color-foreground)',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="square"
                  formatter={(value) => <span className="text-foreground/80 text-xs">{value}</span>}
                />
                <Bar dataKey="Ativas" fill="#004F9F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Concluídas" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};


