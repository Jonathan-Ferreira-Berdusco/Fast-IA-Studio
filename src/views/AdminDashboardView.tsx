import React, { useState, useEffect, useMemo } from 'react';
import { OrdemServico, Cliente, Tecnico, StatusChamado, MaterialUtilizado } from '../types';
import { ChamadoService } from '../services/chamadoService';
import { Sidebar, AdminTab } from '../components/Sidebar';
import { AdminHeader } from '../components/AdminHeader';
import { DashboardCharts } from '../components/DashboardCharts';
import { TabelaOrdensServico } from '../components/TabelaOrdensServico';
import { ModalNovaOS } from '../components/ModalNovaOS';
import { ModalAtribuirTecnico } from '../components/ModalAtribuirTecnico';
import { ModalCliente } from '../components/ModalCliente';
import { ModalTecnico } from '../components/ModalTecnico';
import { ModalDetalheOSAdmin } from '../components/ModalDetalheOSAdmin';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Wrench,
  Users,
  Building,
  Plus,
  Edit2,
  Trash2,
  Search,
  ShieldCheck,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  DollarSign,
  Car,
  Package,
  Calendar,
  Filter,
  X,
  FileSpreadsheet,
  UserCheck,
  UserX,
  Power,
} from 'lucide-react';

interface Props {
  onLogout?: () => void;
}

export type PeriodoFiltro = 'TODOS' | 'HOJE' | 'ULTIMOS_7' | 'ESTE_MES' | 'ULTIMOS_30' | 'CUSTOM';
export type StatusFilterAtividade = 'ATIVOS' | 'TODOS' | 'INATIVOS';

export const AdminDashboardView: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [chamados, setChamados] = useState<OrdemServico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);

  // Soft delete / activity status filters (defaults to ATIVOS)
  const [filtroStatusCliente, setFiltroStatusCliente] = useState<StatusFilterAtividade>('ATIVOS');
  const [filtroStatusTecnico, setFiltroStatusTecnico] = useState<StatusFilterAtividade>('ATIVOS');

  // Date filter state
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoFiltro>('TODOS');
  const [dataInicioCustom, setDataInicioCustom] = useState('');
  const [dataFimCustom, setDataFimCustom] = useState('');

  // Modals state
  const [showNovaOSModal, setShowNovaOSModal] = useState(false);
  const [osEdicao, setOsEdicao] = useState<OrdemServico | null>(null);

  const [showAtribuirModal, setShowAtribuirModal] = useState(false);
  const [osParaAtribuir, setOsParaAtribuir] = useState<OrdemServico | null>(null);

  const [showDetalheModal, setShowDetalheModal] = useState(false);
  const [osDetalhe, setOsDetalhe] = useState<OrdemServico | null>(null);

  const [showClienteModal, setShowClienteModal] = useState(false);
  const [clienteEdicao, setClienteEdicao] = useState<Cliente | null>(null);

  const [showTecnicoModal, setShowTecnicoModal] = useState(false);
  const [tecnicoEdicao, setTecnicoEdicao] = useState<Tecnico | null>(null);

  // Deletion Confirmation Modals
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);
  const [tecnicoParaExcluir, setTecnicoParaExcluir] = useState<Tecnico | null>(null);

  // Search state for Clientes and Técnicos sub-views
  const [searchCliente, setSearchCliente] = useState('');
  const [searchTecnico, setSearchTecnico] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listCli, listTec] = await Promise.all([
        ChamadoService.listarClientes().catch(() => []),
        ChamadoService.listarTecnicos().catch(() => []),
      ]);
      const listOS = await ChamadoService.listarChamados(undefined, undefined, listCli, listTec).catch(() => []);
      setChamados(listOS);
      setClientes(listCli);
      setTecnicos(listTec);
      const chamadosErr = ChamadoService.getLastChamadosError();
      if (chamadosErr && listOS.length === 0) {
        setErrorMsg(`Aviso: O backend retornou erro 500 ao listar chamados (/api/chamados/). Causa: Falha de validação Pydantic no modelo de Visitas (campos de horário nulos no banco ou km_total=0).`);
      } else {
        setErrorMsg(null);
      }
    } catch (err: any) {
      console.warn('Aviso ao sincronizar dados no Dashboard:', err);
      // Mantém os dados existentes em memória e exibe aviso apenas se não houver dados
      if (chamados.length === 0) {
        setErrorMsg(err?.detail || err?.message || 'Aviso: instabilidade ao sincronizar com o backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = ChamadoService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // --- DATE FILTER LOGIC ---
  const chamadosFiltradosPorData = useMemo(() => {
    if (periodoSelecionado === 'TODOS') return chamados;

    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const fimHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);

    return chamados.filter((c) => {
      const dataOS = new Date(c.data_abertura || c.data_agendamento || agora);

      if (periodoSelecionado === 'HOJE') {
        return dataOS >= inicioHoje && dataOS <= fimHoje;
      }

      if (periodoSelecionado === 'ULTIMOS_7') {
        const seteDiasAtras = new Date(agora);
        seteDiasAtras.setDate(agora.getDate() - 7);
        seteDiasAtras.setHours(0, 0, 0, 0);
        return dataOS >= seteDiasAtras && dataOS <= fimHoje;
      }

      if (periodoSelecionado === 'ESTE_MES') {
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        return dataOS >= inicioMes && dataOS <= fimHoje;
      }

      if (periodoSelecionado === 'ULTIMOS_30') {
        const trintaDiasAtras = new Date(agora);
        trintaDiasAtras.setDate(agora.getDate() - 30);
        trintaDiasAtras.setHours(0, 0, 0, 0);
        return dataOS >= trintaDiasAtras && dataOS <= fimHoje;
      }

      if (periodoSelecionado === 'CUSTOM') {
        if (!dataInicioCustom && !dataFimCustom) return true;
        const inicio = dataInicioCustom ? new Date(dataInicioCustom + 'T00:00:00') : new Date(0);
        const fim = dataFimCustom ? new Date(dataFimCustom + 'T23:59:59') : new Date(8640000000000000);
        return dataOS >= inicio && dataOS <= fim;
      }

      return true;
    });
  }, [chamados, periodoSelecionado, dataInicioCustom, dataFimCustom]);

  // --- FINANCIAL & METRICS CALCULATION (USING BACKEND VALORES_ASSISTENCIA RULES) ---
  const metricasFinanceiras = useMemo(() => {
    let custoLocomocaoTotal = 0;
    let honorariosTotal = 0;
    let custoPecasTotal = 0;

    chamadosFiltradosPorData.forEach((c) => {
      // 1. Locomoção baseada na regra de R$ 1.15/KM + pedágio + frete da Visita
      if (c.visitas && c.visitas.length > 0) {
        c.visitas.forEach((v) => {
          if (v.valor_pedagio) custoLocomocaoTotal += Number(v.valor_pedagio);
          if (v.valor_frete_devolucao) custoLocomocaoTotal += Number(v.valor_frete_devolucao);
          if (v.km_total) {
            custoLocomocaoTotal += Number(v.km_total) * 1.15;
          }
        });
      }

      // 2. Peças e materiais reais utilizados nos serviços
      if (c.visitas && c.visitas.length > 0) {
        c.visitas.forEach((v) => {
          if (v.servicos_realizados && v.servicos_realizados.length > 0) {
            v.servicos_realizados.forEach((sr) => {
              const mats = sr.materiais_utilizados || sr.materiais || [];
              mats.forEach((mat) => {
                const val = Number(mat.valor || mat.valor_unitario || 0);
                const qtd = Number(mat.quantidade || 0);
                custoPecasTotal += val * qtd;
              });
            });
          }
        });
      }

      // 3. Honorários / Tempo de Atendimento Técnico
      if (c.honorarios !== undefined && c.honorarios !== null) {
        honorariosTotal += Number(c.honorarios);
      } else if (!c.em_garantia && c.visitas && c.visitas.length > 0) {
        // Regra de serviço fora da garantia: 87.01 primeira hora + 62.15 por hora seguinte
        honorariosTotal += 87.01;
      }
    });

    const valorGeralTotal = custoLocomocaoTotal + honorariosTotal + custoPecasTotal;

    return {
      custoLocomocaoTotal,
      honorariosTotal,
      custoPecasTotal,
      valorGeralTotal,
    };
  }, [chamadosFiltradosPorData]);

  // Status counters on filtered data
  const totalOS = chamadosFiltradosPorData.length;
  const abertasOS = chamadosFiltradosPorData.filter((c) => String(c.status).toUpperCase() === 'ABERTO').length;
  const emAtendimentoOS = chamadosFiltradosPorData.filter((c) => String(c.status).toUpperCase() === 'EM_ATENDIMENTO' || String(c.status) === 'Em Atendimento').length;
  const pausadasOS = chamadosFiltradosPorData.filter((c) => String(c.status).toUpperCase() === 'PAUSADO' || String(c.status) === 'Pausado').length;
  const concluidasOS = chamadosFiltradosPorData.filter((c) => String(c.status).toUpperCase() === 'CONCLUIDO' || String(c.status).toUpperCase() === 'FINALIZADO' || String(c.status) === 'Finalizado').length;
  const canceladasOS = chamadosFiltradosPorData.filter((c) => String(c.status).toUpperCase() === 'CANCELADO' || c.is_cancelled).length;
  const garantiaOS = chamadosFiltradosPorData.filter((c) => c.em_garantia).length;

  // --- HANDLERS: OS ---
  const handleSaveOS = async (data: any) => {
    try {
      if (data.id_os) {
        await ChamadoService.atualizarOrdemServico(data.id_os, {
          id_cliente: data.id_cliente,
          id_tecnico_atribuido: data.id_tecnico_atribuido,
          prioridade: data.prioridade,
          data_agendamento: data.data_agendamento,
          descricao_cliente: data.descricao_cliente,
          em_garantia: data.em_garantia,
          pedido: data.pedido,
        });
      } else {
        await ChamadoService.criarOrdemServico(data);
      }
      await loadData();
      setShowNovaOSModal(false);
      setOsEdicao(null);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.detail || err?.message || 'Erro ao salvar Ordem de Serviço no backend.');
    }
  };

  const handleConfirmAtribuir = async (id_os: number, id_tecnico: number) => {
    try {
      await ChamadoService.atribuirTecnico(id_os, id_tecnico);
      await loadData();
      setShowAtribuirModal(false);
      setOsParaAtribuir(null);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.detail || err?.message || 'Erro ao atribuir técnico na API.');
    }
  };

  const handleDeleteOS = async (id_os: number) => {
    try {
      await ChamadoService.excluirOrdemServico(id_os);
      await loadData();
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.detail || err?.message || 'Erro ao excluir Ordem de Serviço na API.');
    }
  };

  // --- HANDLERS: CLIENTE ---
  const handleSaveCliente = async (data: Partial<Cliente>) => {
    try {
      await ChamadoService.salvarCliente(data);
      await loadData();
      setShowClienteModal(false);
      setClienteEdicao(null);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.detail || err?.message || 'Erro ao salvar cliente na API.');
    }
  };

  const handleConfirmDeleteCliente = async () => {
    if (clienteParaExcluir) {
      try {
        await ChamadoService.excluirCliente(clienteParaExcluir.id_cliente);
        await loadData();
        setClienteParaExcluir(null);
        setErrorMsg(null);
      } catch (err: any) {
        setErrorMsg(err?.detail || err?.message || 'Erro ao excluir cliente na API.');
      }
    }
  };

  const handleToggleStatusCliente = async (cliente: Cliente) => {
    const novoStatus = !(cliente.is_active !== false);
    try {
      await ChamadoService.alternarStatusCliente(cliente.id_cliente, novoStatus);
      await loadData();
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.detail || err?.message || 'Erro ao alternar status do cliente.');
    }
  };

  // --- HANDLERS: TECNICO ---
  const handleSaveTecnico = async (data: any) => {
    try {
      await ChamadoService.salvarTecnico(data);
      await loadData();
      setShowTecnicoModal(false);
      setTecnicoEdicao(null);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.detail || err?.message || 'Erro ao salvar técnico na API.');
    }
  };

  const handleConfirmDeleteTecnico = async () => {
    if (tecnicoParaExcluir) {
      try {
        await ChamadoService.excluirTecnico(tecnicoParaExcluir.id_tecnico);
        await loadData();
        setTecnicoParaExcluir(null);
        setErrorMsg(null);
      } catch (err: any) {
        setErrorMsg(err?.detail || err?.message || 'Erro ao excluir técnico na API.');
      }
    }
  };

  const handleToggleStatusTecnico = async (tecnico: Tecnico) => {
    const novoStatus = !(tecnico.is_active !== false);
    try {
      await ChamadoService.alternarStatusTecnico(tecnico.id_tecnico, novoStatus);
      await loadData();
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.detail || err?.message || 'Erro ao alternar status do técnico.');
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Painel de Controle Principal';
      case 'chamados':
        return 'Gestão de Ordens de Serviço';
      case 'clientes':
        return 'Cadastro de Clientes';
      case 'tecnicos':
        return 'Equipe de Atendimento Técnico';
      default:
        return 'Painel Administrativo';
    }
  };

  const filteredClientes = clientes.filter((c) => {
    const matchesSearch =
      (c.nome_fantasia || c.razao_social || '').toLowerCase().includes(searchCliente.toLowerCase()) ||
      (c.cidade || '').toLowerCase().includes(searchCliente.toLowerCase()) ||
      (c.cnpj_cpf || '').includes(searchCliente);

    if (!matchesSearch) return false;

    const isActive = c.is_active !== false;
    if (filtroStatusCliente === 'ATIVOS') return isActive;
    if (filtroStatusCliente === 'INATIVOS') return !isActive;
    return true; // TODOS
  });

  const filteredTecnicos = tecnicos.filter((t) => {
    const matchesSearch =
      t.nome.toLowerCase().includes(searchTecnico.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(searchTecnico.toLowerCase()));

    if (!matchesSearch) return false;

    const isActive = t.is_active !== false;
    if (filtroStatusTecnico === 'ATIVOS') return isActive;
    if (filtroStatusTecnico === 'INATIVOS') return !isActive;
    return true; // TODOS
  });

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNovaOS={() => {
          setOsEdicao(null);
          setShowNovaOSModal(true);
        }}
        totalOS={chamados.length}
        totalEmAtendimento={chamados.filter((c) => c.status === 'EM_ATENDIMENTO').length}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader
          activeTabTitle={getTabTitle()}
          totalChamados={chamados.length}
          totalConcluidos={chamados.filter((c) => c.status === 'CONCLUIDO').length}
          onOpenNovaOS={() => {
            setOsEdicao(null);
            setShowNovaOSModal(true);
          }}
          onLogout={onLogout}
        />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {errorMsg && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-destructive">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={async () => {
                    await ChamadoService.repararPerfilTecnicoNoBackend(1);
                    loadData();
                  }}
                  className="px-3 py-1 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 cursor-pointer shadow-xs"
                  title="Atualiza os campos obrigatórios do técnico mestre no backend para sanar inconsistências de validação"
                >
                  🛠️ Reparar Cadastro no Banco
                </button>
                <button
                  onClick={loadData}
                  className="px-3 py-1 bg-destructive text-white rounded-lg font-bold hover:bg-destructive/90 cursor-pointer shadow-xs"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center p-4 text-xs text-muted-foreground gap-2 bg-secondary/40 rounded-2xl border border-border">
              <Clock className="w-4 h-4 animate-spin text-accent" />
              <span>Sincronizando dados reais com o backend FastAPI...</span>
            </div>
          )}

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* TOP BAR: DATE FILTER */}
              <div className="surface-card p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground font-['Space_Grotesk'] flex items-center gap-2">
                      Filtro de Período do Dashboard
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Filtra automaticamente todos os indicadores, gráficos e listas da tela
                    </p>
                  </div>
                </div>

                {/* Period Selector Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'TODOS', label: 'Todo o Histórico' },
                    { id: 'HOJE', label: 'Hoje' },
                    { id: 'ULTIMOS_7', label: 'Últimos 7 dias' },
                    { id: 'ESTE_MES', label: 'Este Mês' },
                    { id: 'ULTIMOS_30', label: 'Últimos 30 dias' },
                    { id: 'CUSTOM', label: 'Personalizado' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setPeriodoSelecionado(item.id as PeriodoFiltro)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        periodoSelecionado === item.id
                          ? 'bg-accent text-white font-bold shadow-sm shadow-accent/20'
                          : 'bg-secondary text-muted-foreground hover:text-foreground border border-border hover:border-border/80'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Inputs if CUSTOM is active */}
              {periodoSelecionado === 'CUSTOM' && (
                <div className="surface-card p-4 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <label className="text-muted-foreground font-semibold">Data Inicial:</label>
                    <input
                      type="date"
                      value={dataInicioCustom}
                      onChange={(e) => setDataInicioCustom(e.target.value)}
                      className="bg-secondary border border-border rounded-xl px-3 py-1.5 text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-muted-foreground font-semibold">Data Final:</label>
                    <input
                      type="date"
                      value={dataFimCustom}
                      onChange={(e) => setDataFimCustom(e.target.value)}
                      className="bg-secondary border border-border rounded-xl px-3 py-1.5 text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                  {(dataInicioCustom || dataFimCustom) && (
                    <button
                      onClick={() => {
                        setDataInicioCustom('');
                        setDataFimCustom('');
                      }}
                      className="px-3 py-1.5 bg-secondary hover:bg-muted text-foreground rounded-xl text-xs font-semibold cursor-pointer border border-border"
                    >
                      Limpar Datas
                    </button>
                  )}
                </div>
              )}

              {/* 3 FINANCIAL KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* CARD 1: Custo de Locomoção */}
                <div className="surface-card p-5 shadow-sm relative overflow-hidden group hover:border-accent/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Custo de Locomoção</p>
                      <h3 className="text-2xl font-black text-foreground font-['Space_Grotesk'] mt-1">
                        R$ {metricasFinanceiras.custoLocomocaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <span className="text-accent font-bold">Deslocamento</span> em quilometragem apurada
                      </p>
                    </div>
                    <div className="p-3 bg-accent/10 border border-accent/20 text-accent rounded-2xl">
                      <Car className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* CARD 2: Honorários */}
                <div className="surface-card p-5 shadow-sm relative overflow-hidden group hover:border-success/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Honorários</p>
                      <h3 className="text-2xl font-black text-foreground font-['Space_Grotesk'] mt-1">
                        R$ {metricasFinanceiras.honorariosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <span className="text-success font-bold">Mão de obra</span> e serviços técnicos
                      </p>
                    </div>
                    <div className="p-3 bg-success/10 border border-success/20 text-success rounded-2xl">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* CARD 3: Custos com Peças */}
                <div className="surface-card p-5 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Custos com Peças</p>
                      <h3 className="text-2xl font-black text-foreground font-['Space_Grotesk'] mt-1">
                        R$ {metricasFinanceiras.custoPecasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <span className="text-primary font-bold">Componentes</span> e materiais aplicados
                      </p>
                    </div>
                    <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-2xl">
                      <Package className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECONDARY STATUS KPI CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="surface-card p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Total de OS (Período)</span>
                  <div className="text-xl font-bold text-foreground font-['Space_Grotesk'] mt-0.5">{totalOS}</div>
                  <span className="text-[10px] text-accent font-medium">{abertasOS} Abertas • {emAtendimentoOS} Em Campo</span>
                </div>

                <div className="surface-card p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Concluídas</span>
                  <div className="text-xl font-bold text-success font-['Space_Grotesk'] mt-0.5">{concluidasOS}</div>
                  <span className="text-[10px] text-success font-medium">
                    {totalOS > 0 ? Math.round((concluidasOS / totalOS) * 100) : 0}% resolutividade
                  </span>
                </div>

                <div className="surface-card p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Em Garantia</span>
                  <div className="text-xl font-bold text-warning font-['Space_Grotesk'] mt-0.5">{garantiaOS}</div>
                  <span className="text-[10px] text-muted-foreground font-medium">Sem custo adicional</span>
                </div>

                <div className="surface-card p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Faturamento Geral</span>
                  <div className="text-xl font-bold text-foreground font-['Space_Grotesk'] mt-0.5">
                    R$ {metricasFinanceiras.valorGeralTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">Locomoção + Honorários + Peças</span>
                </div>
              </div>

              {/* Recharts Data Visualizations (with internal status filter) */}
              <DashboardCharts chamados={chamadosFiltradosPorData} tecnicos={tecnicos} />

              {/* Quick Table Preview of OS */}
              <TabelaOrdensServico
                chamados={chamadosFiltradosPorData}
                tecnicos={tecnicos}
                onSelectOS={(os) => {
                  setOsDetalhe(os);
                  setShowDetalheModal(true);
                }}
                onEditOS={(os) => {
                  setOsEdicao(os);
                  setShowNovaOSModal(true);
                }}
                onAssignTecnico={(os) => {
                  setOsParaAtribuir(os);
                  setShowAtribuirModal(true);
                }}
                onOpenNovaOS={() => {
                  setOsEdicao(null);
                  setShowNovaOSModal(true);
                }}
              />
            </div>
          )}

          {/* TAB 2: ORDENS DE SERVIÇO (FULL CRUD) */}
          {activeTab === 'chamados' && (
            <TabelaOrdensServico
              chamados={chamados}
              tecnicos={tecnicos}
              onSelectOS={(os) => {
                setOsDetalhe(os);
                setShowDetalheModal(true);
              }}
              onEditOS={(os) => {
                setOsEdicao(os);
                setShowNovaOSModal(true);
              }}
              onAssignTecnico={(os) => {
                setOsParaAtribuir(os);
                setShowAtribuirModal(true);
              }}
              onOpenNovaOS={() => {
                setOsEdicao(null);
                setShowNovaOSModal(true);
              }}
            />
          )}

          {/* TAB 3: GESTÃO DE CLIENTES */}
          {activeTab === 'clientes' && (
            <div className="surface-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-foreground font-['Space_Grotesk'] flex items-center gap-2">
                    <Building className="w-5 h-5 text-accent" /> Cadastro e Gestão de Clientes
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Gerencie estabelecimentos, múltiplos contatos e endereços atendidos pela FAST Gôndolas & Check-outs
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar cliente ou cidade..."
                      value={searchCliente}
                      onChange={(e) => setSearchCliente(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setClienteEdicao(null);
                      setShowClienteModal(true);
                    }}
                    className="py-2 px-4 bg-accent hover:bg-accent/90 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Cliente</span>
                  </button>
                </div>
              </div>

              {/* Filtros de Atividade / Soft Delete */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-secondary/50 rounded-2xl border border-border w-fit text-xs">
                <span className="text-[11px] font-bold text-muted-foreground px-2 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filtrar Status:
                </span>
                <button
                  type="button"
                  onClick={() => setFiltroStatusCliente('ATIVOS')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filtroStatusCliente === 'ATIVOS'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Apenas Ativos (Padrão)</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-extrabold">
                    {clientes.filter((c) => c.is_active !== false).length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatusCliente('TODOS')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filtroStatusCliente === 'TODOS'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <span>Todos os Registros</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-extrabold">
                    {clientes.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatusCliente('INATIVOS')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filtroStatusCliente === 'INATIVOS'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Inativos / Soft Delete</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-extrabold">
                    {clientes.filter((c) => c.is_active === false).length}
                  </span>
                </button>
              </div>

              {/* Clientes Grid */}
              {filteredClientes.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border">
                  <Building className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-foreground">
                    {filtroStatusCliente === 'INATIVOS'
                      ? 'Nenhum cliente inativo (soft deleted) encontrado.'
                      : 'Nenhum cliente cadastrado no sistema'}
                  </p>
                  <p className="text-xs mt-1">
                    {filtroStatusCliente === 'INATIVOS'
                      ? 'Todos os seus clientes estão ativos no momento.'
                      : 'Clique em "Novo Cliente" acima para registrar o primeiro cliente no backend.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredClientes.map((cli) => {
                    const totalClienteOS = chamados.filter((c) => c.id_cliente === cli.id_cliente).length;
                    const isAtivo = cli.is_active !== false;
                    return (
                      <div
                        key={cli.id_cliente}
                        className={`bg-card border rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between shadow-sm ${
                          isAtivo ? 'border-border hover:border-accent/40' : 'border-amber-500/30 bg-amber-500/5'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-extrabold text-foreground">{cli.razao_social}</h3>
                                {isAtivo ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <UserCheck className="w-3 h-3" /> Ativo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    <UserX className="w-3 h-3" /> Inativo (Soft Delete)
                                  </span>
                                )}
                              </div>
                              {cli.codigo && (
                                <p className="text-[11px] text-accent font-semibold">Código: #{cli.codigo}</p>
                              )}
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-secondary text-accent border border-border">
                              {totalClienteOS} OS Cadastrada(s)
                            </span>
                          </div>

                          <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs text-foreground/90">
                            {cli.contato_principal_nome && (
                              <p className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-3.5 h-3.5 text-success shrink-0" />
                                <span>
                                  Contato: <strong className="text-foreground">{cli.contato_principal_nome}</strong>
                                  {cli.contato_principal_telefone ? ` (${cli.contato_principal_telefone})` : ''}
                                </span>
                              </p>
                            )}
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>Telefone Geral: <strong className="text-foreground">{cli.telefone || 'Sem telefone'}</strong></span>
                            </p>
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span>{cli.endereco}, {cli.numero} - {cli.bairro}, {cli.cidade}/{cli.uf}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                          <button
                            type="button"
                            onClick={() => {
                              setClienteEdicao(cli);
                              setShowClienteModal(true);
                            }}
                            className="px-3 py-1.5 bg-secondary hover:bg-muted text-accent border border-border rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatusCliente(cli)}
                            title={isAtivo ? 'Desativar cliente (Soft Delete)' : 'Reativar cliente no sistema'}
                            className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                              isAtivo
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{isAtivo ? 'Desativar (Soft)' : 'Reativar'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setClienteParaExcluir(cli)}
                            className="px-3 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EQUIPE TÉCNICA */}
          {activeTab === 'tecnicos' && (
            <div className="surface-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-foreground font-['Space_Grotesk'] flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-accent" /> Equipe de Técnicos de Campo
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Cadastre e supervisione os profissionais credenciados da FAST Gôndolas & Check-outs
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou e-mail..."
                      value={searchTecnico}
                      onChange={(e) => setSearchTecnico(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setTecnicoEdicao(null);
                      setShowTecnicoModal(true);
                    }}
                    className="py-2 px-4 bg-accent hover:bg-accent/90 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Técnico</span>
                  </button>
                </div>
              </div>

              {/* Filtros de Atividade / Soft Delete Técnicos */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-secondary/50 rounded-2xl border border-border w-fit text-xs">
                <span className="text-[11px] font-bold text-muted-foreground px-2 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filtrar Status:
                </span>
                <button
                  type="button"
                  onClick={() => setFiltroStatusTecnico('ATIVOS')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filtroStatusTecnico === 'ATIVOS'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Apenas Ativos (Padrão)</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-extrabold">
                    {tecnicos.filter((t) => t.is_active !== false).length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatusTecnico('TODOS')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filtroStatusTecnico === 'TODOS'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <span>Todos os Registros</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-extrabold">
                    {tecnicos.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatusTecnico('INATIVOS')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filtroStatusTecnico === 'INATIVOS'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Inativos / Soft Delete</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-extrabold">
                    {tecnicos.filter((t) => t.is_active === false).length}
                  </span>
                </button>
              </div>

              {/* Técnicos Grid */}
              {filteredTecnicos.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground bg-secondary/30 rounded-2xl border border-dashed border-border">
                  <Wrench className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-foreground">
                    {filtroStatusTecnico === 'INATIVOS'
                      ? 'Nenhum técnico inativo (soft deleted) encontrado.'
                      : 'Nenhum técnico cadastrado no sistema'}
                  </p>
                  <p className="text-xs mt-1">
                    {filtroStatusTecnico === 'INATIVOS'
                      ? 'Todos os seus técnicos estão ativos no momento.'
                      : 'Clique em "Novo Técnico" acima para cadastrar integrantes da equipe técnica.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredTecnicos.map((tec) => {
                    const chamadosTecnico = chamados.filter((c) => c.id_tecnico_atribuido === tec.id_tecnico);
                    const ativasCount = chamadosTecnico.filter(
                      (c) => c.status === 'EM_ATENDIMENTO' || c.status === 'ABERTO' || c.status === 'PAUSADO'
                    ).length;
                    const concluidasCount = chamadosTecnico.filter((c) => c.status === 'CONCLUIDO').length;
                    const isAtivo = tec.is_active !== false;

                    return (
                      <div
                        key={tec.id_tecnico}
                        className={`bg-card border rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between shadow-sm ${
                          isAtivo ? 'border-border hover:border-accent/40' : 'border-amber-500/30 bg-amber-500/5'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-base">
                              {tec.nome.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h3 className="text-sm font-extrabold text-foreground truncate">{tec.nome}</h3>
                                {isAtivo ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                                    <UserCheck className="w-3 h-3" /> Ativo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                                    <UserX className="w-3 h-3" /> Inativo
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-accent font-semibold">
                                {tec.role === 'admin' ? 'Administrador Mestre' : 'Técnico de Campo'}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
                            <p className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-foreground/90 truncate">{tec.email}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-success shrink-0" />
                              <span className="text-foreground/90">{tec.telefone}</span>
                            </p>
                            {tec.cpf && (
                              <p className="text-[11px] text-muted-foreground truncate">
                                CPF: <strong className="text-foreground">{tec.cpf}</strong>
                                {tec.cnpj ? <> • CNPJ: <strong className="text-foreground">{tec.cnpj}</strong></> : null}
                              </p>
                            )}
                          </div>

                          {/* Workload metric pill */}
                          <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                            <div className="bg-secondary p-2 rounded-xl border border-border">
                              <span className="text-[10px] text-muted-foreground block">Ativos em Campo</span>
                              <span className="font-extrabold text-accent">{ativasCount}</span>
                            </div>
                            <div className="bg-secondary p-2 rounded-xl border border-border">
                              <span className="text-[10px] text-muted-foreground block">Concluídas</span>
                              <span className="font-extrabold text-success">{concluidasCount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                          <button
                            type="button"
                            onClick={() => {
                              setTecnicoEdicao(tec);
                              setShowTecnicoModal(true);
                            }}
                            className="px-3 py-1.5 bg-secondary hover:bg-muted text-accent border border-border rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatusTecnico(tec)}
                            title={isAtivo ? 'Desativar técnico (Soft Delete)' : 'Reativar técnico no sistema'}
                            className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                              isAtivo
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{isAtivo ? 'Desativar (Soft)' : 'Reativar'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTecnicoParaExcluir(tec)}
                            className="px-3 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ALL SYSTEM MODALS */}
      <ModalNovaOS
        isOpen={showNovaOSModal}
        clientes={clientes}
        tecnicos={tecnicos}
        osEdicao={osEdicao}
        onClose={() => {
          setShowNovaOSModal(false);
          setOsEdicao(null);
        }}
        onSave={handleSaveOS}
      />

      <ModalAtribuirTecnico
        isOpen={showAtribuirModal}
        os={osParaAtribuir}
        tecnicos={tecnicos}
        onClose={() => {
          setShowAtribuirModal(false);
          setOsParaAtribuir(null);
        }}
        onConfirm={handleConfirmAtribuir}
      />

      <ModalCliente
        isOpen={showClienteModal}
        clienteEdicao={clienteEdicao}
        onClose={() => {
          setShowClienteModal(false);
          setClienteEdicao(null);
        }}
        onSave={handleSaveCliente}
      />

      <ModalTecnico
        isOpen={showTecnicoModal}
        tecnicoEdicao={tecnicoEdicao}
        onClose={() => {
          setShowTecnicoModal(false);
          setTecnicoEdicao(null);
        }}
        onSave={handleSaveTecnico}
      />

      <ModalDetalheOSAdmin
        isOpen={showDetalheModal}
        os={osDetalhe}
        onClose={() => {
          setShowDetalheModal(false);
          setOsDetalhe(null);
        }}
        onEdit={(os) => {
          setOsEdicao(os);
          setShowNovaOSModal(true);
        }}
        onAssignTecnico={(os) => {
          setOsParaAtribuir(os);
          setShowAtribuirModal(true);
        }}
      />

      {/* CONFIRMATION MODAL: DELETE CLIENTE */}
      {clienteParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground font-['Space_Grotesk']">
                  Confirmar Exclusão de Cliente
                </h3>
                <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-xs text-foreground/90 leading-relaxed">
              Você tem certeza que deseja remover o cliente{' '}
              <strong className="text-foreground font-bold">{clienteParaExcluir.nome_fantasia}</strong>{' '}
              ({clienteParaExcluir.cnpj_cpf})?
            </p>

            {chamados.some((c) => c.id_cliente === clienteParaExcluir.id_cliente) && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-xl text-[11px] text-warning-foreground">
                Atenção: Existem Ordens de Serviço associadas a este cliente no histórico.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setClienteParaExcluir(null)}
                className="px-4 py-2 bg-secondary hover:bg-muted text-foreground rounded-xl text-xs font-semibold cursor-pointer border border-border"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCliente}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Sim, Excluir Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE TECNICO */}
      {tecnicoParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground font-['Space_Grotesk']">
                  Confirmar Exclusão de Técnico
                </h3>
                <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-xs text-foreground/90 leading-relaxed">
              Você tem certeza que deseja remover o técnico{' '}
              <strong className="text-foreground font-bold">{tecnicoParaExcluir.nome}</strong> da equipe?
            </p>

            {chamados.some((c) => c.id_tecnico_atribuido === tecnicoParaExcluir.id_tecnico) && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-xl text-[11px] text-warning-foreground">
                Atenção: Existem Ordens de Serviço atribuídas a este técnico.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setTecnicoParaExcluir(null)}
                className="px-4 py-2 bg-secondary hover:bg-muted text-foreground rounded-xl text-xs font-semibold cursor-pointer border border-border"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTecnico}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Sim, Excluir Técnico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

