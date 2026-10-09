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
} from 'lucide-react';

interface Props {
  onLogout?: () => void;
  onSwitchToTechView?: () => void;
}

export type PeriodoFiltro = 'TODOS' | 'HOJE' | 'ULTIMOS_7' | 'ESTE_MES' | 'ULTIMOS_30' | 'CUSTOM';

export const AdminDashboardView: React.FC<Props> = ({ onLogout, onSwitchToTechView }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [chamados, setChamados] = useState<OrdemServico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);

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

  const loadData = () => {
    const listOS = ChamadoService.listarChamados();
    const listCli = ChamadoService.listarClientes();
    const listTec = ChamadoService.listarTecnicos();
    setChamados(listOS);
    setClientes(listCli);
    setTecnicos(listTec);
  };

  useEffect(() => {
    loadData();
    ChamadoService.syncWithBackend().catch(() => {});
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
      // Use data_abertura or data_agendamento
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

  // --- FINANCIAL & METRICS CALCULATION ON FILTERED OS ---
  const metricasFinanceiras = useMemo(() => {
    let custoLocomocaoTotal = 0;
    let honorariosTotal = 0;
    let custoPecasTotal = 0;

    chamadosFiltradosPorData.forEach((c) => {
      // 1. Locomoção
      if (c.deslocamento?.valor_total_deslocamento) {
        custoLocomocaoTotal += c.deslocamento.valor_total_deslocamento;
      } else if (c.deslocamento?.km_percorrido && c.deslocamento?.valor_km) {
        custoLocomocaoTotal += c.deslocamento.km_percorrido * c.deslocamento.valor_km;
      }

      // Check Visitas data for displacement and travel expenses
      if (c.visitas && c.visitas.length > 0) {
        c.visitas.forEach((v) => {
          if (v.valor_pedagio) custoLocomocaoTotal += v.valor_pedagio;
          if (v.valor_frete_devolucao) custoLocomocaoTotal += v.valor_frete_devolucao;
          if (v.comprovantes && v.comprovantes.length > 0) {
            v.comprovantes.forEach((comp) => {
              custoLocomocaoTotal += comp.valor || 0;
            });
          }
          if (v.km_total && !c.deslocamento?.valor_total_deslocamento) {
            // Default calculation R$ 1.60/km if not specified
            custoLocomocaoTotal += v.km_total * 1.6;
          }
        });
      }

      // 2. Honorários
      if (c.honorarios !== undefined && c.honorarios !== null) {
        honorariosTotal += c.honorarios;
      } else if (c.valor_total_servico) {
        let pecas = 0;
        if (c.pecas_utilizadas && c.pecas_utilizadas.length > 0) {
          pecas = c.pecas_utilizadas.reduce(
            (acc: number, p: MaterialUtilizado) => acc + (p.quantidade || 0) * (p.valor_unitario || 0),
            0
          );
        }
        const desloc = c.deslocamento?.valor_total_deslocamento || 0;
        const rem = Math.max(0, (c.valor_total_servico || 0) - pecas - desloc);
        honorariosTotal += rem;
      } else {
        // Standard default base honorário for service if unconfigured
        honorariosTotal += c.em_garantia ? 0 : 250;
      }

      // 3. Custos com peças
      if (c.pecas_utilizadas && c.pecas_utilizadas.length > 0) {
        const pecas = c.pecas_utilizadas.reduce(
          (acc: number, p: MaterialUtilizado) => acc + (p.quantidade || 0) * (p.valor_unitario || 0),
          0
        );
        custoPecasTotal += pecas;
      }

      if (c.visitas && c.visitas.length > 0) {
        c.visitas.forEach((v) => {
          if (v.servicos_realizados && v.servicos_realizados.length > 0) {
            v.servicos_realizados.forEach((sr) => {
              if (sr.materiais && sr.materiais.length > 0) {
                sr.materiais.forEach((mat) => {
                  custoPecasTotal += (mat.quantidade || 0) * (mat.valor_unitario || 0);
                });
              }
            });
          }
        });
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
  const abertasOS = chamadosFiltradosPorData.filter((c) => c.status === 'ABERTO').length;
  const emAtendimentoOS = chamadosFiltradosPorData.filter((c) => c.status === 'EM_ATENDIMENTO').length;
  const pausadasOS = chamadosFiltradosPorData.filter((c) => c.status === 'PAUSADO').length;
  const concluidasOS = chamadosFiltradosPorData.filter((c) => c.status === 'CONCLUIDO').length;
  const canceladasOS = chamadosFiltradosPorData.filter((c) => c.status === 'CANCELADO').length;
  const garantiaOS = chamadosFiltradosPorData.filter((c) => c.em_garantia).length;

  // --- HANDLERS: OS ---
  const handleSaveOS = (data: any) => {
    if (data.id_os) {
      ChamadoService.atualizarOrdemServico(data.id_os, {
        id_cliente: data.id_cliente,
        id_tecnico_atribuido: data.id_tecnico_atribuido,
        prioridade: data.prioridade,
        data_agendamento: data.data_agendamento,
        descricao_cliente: data.descricao_cliente,
        em_garantia: data.em_garantia,
        pedido: data.pedido,
        honorarios: data.honorarios,
      });
    } else {
      ChamadoService.criarOrdemServico(data);
    }
    loadData();
    setShowNovaOSModal(false);
    setOsEdicao(null);
  };

  const handleConfirmAtribuir = (id_os: number, id_tecnico: number) => {
    ChamadoService.atribuirTecnico(id_os, id_tecnico);
    loadData();
    setShowAtribuirModal(false);
    setOsParaAtribuir(null);
  };

  const handleDeleteOS = (id_os: number) => {
    ChamadoService.excluirOrdemServico(id_os);
    loadData();
  };

  // --- HANDLERS: CLIENTE ---
  const handleSaveCliente = (data: Partial<Cliente>) => {
    ChamadoService.salvarCliente(data);
    loadData();
    setShowClienteModal(false);
    setClienteEdicao(null);
  };

  const handleConfirmDeleteCliente = () => {
    if (clienteParaExcluir) {
      ChamadoService.excluirCliente(clienteParaExcluir.id_cliente);
      loadData();
      setClienteParaExcluir(null);
    }
  };

  // --- HANDLERS: TECNICO ---
  const handleSaveTecnico = (data: Partial<Tecnico>) => {
    ChamadoService.salvarTecnico(data);
    loadData();
    setShowTecnicoModal(false);
    setTecnicoEdicao(null);
  };

  const handleConfirmDeleteTecnico = () => {
    if (tecnicoParaExcluir) {
      ChamadoService.excluirTecnico(tecnicoParaExcluir.id_tecnico);
      loadData();
      setTecnicoParaExcluir(null);
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

  const filteredClientes = clientes.filter(
    (c) =>
      (c.nome_fantasia || c.razao_social || '').toLowerCase().includes(searchCliente.toLowerCase()) ||
      (c.cidade || '').toLowerCase().includes(searchCliente.toLowerCase()) ||
      (c.cnpj_cpf || '').includes(searchCliente)
  );

  const filteredTecnicos = tecnicos.filter(
    (t) =>
      t.nome.toLowerCase().includes(searchTecnico.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(searchTecnico.toLowerCase()))
  );

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
          onSwitchToTechView={onSwitchToTechView}
        />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
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

              {/* Clientes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClientes.map((cli) => {
                  const totalClienteOS = chamados.filter((c) => c.id_cliente === cli.id_cliente).length;
                  return (
                    <div
                      key={cli.id_cliente}
                      className="bg-card border border-border rounded-2xl p-5 space-y-4 hover:border-accent/40 transition-all flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-extrabold text-foreground">{cli.nome_fantasia}</h3>
                            <p className="text-[11px] text-muted-foreground">{cli.razao_social}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-secondary text-accent border border-border">
                            {totalClienteOS} OS Cadastrada(s)
                          </span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs text-foreground/90">
                          <p className="flex items-center gap-2 text-muted-foreground">
                            <Building className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span>CNPJ/CPF: <strong className="text-foreground">{cli.cnpj_cpf || 'Não informado'}</strong></span>
                          </p>
                          <p className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 text-success shrink-0" />
                            <span>{cli.telefone || 'Sem telefone'} • Resp: <strong className="text-foreground">{cli.contato_responsavel || 'Não informado'}</strong></span>
                          </p>
                          <p className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>{cli.endereco}, {cli.numero} - {cli.bairro}, {cli.cidade}/{cli.uf}</span>
                          </p>

                          {/* Múltiplos Contatos */}
                          {cli.contatos && cli.contatos.length > 0 && (
                            <div className="pt-2 border-t border-border/80">
                              <span className="text-[10px] font-bold text-muted-foreground block mb-1">
                                Contatos Adicionais ({cli.contatos.length}):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {cli.contatos.map((ct) => (
                                  <span
                                    key={ct.id_contato}
                                    className="px-2 py-0.5 bg-secondary border border-border rounded-md text-[11px] text-foreground/90"
                                  >
                                    {ct.nome} {ct.cargo || ct.cargo_departamento ? `(${ct.cargo || ct.cargo_departamento})` : ''} - {ct.telefone}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                        <button
                          onClick={() => {
                            setClienteEdicao(cli);
                            setShowClienteModal(true);
                          }}
                          className="px-3 py-1.5 bg-secondary hover:bg-muted text-accent border border-border rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
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

              {/* Técnicos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredTecnicos.map((tec) => {
                  const chamadosTecnico = chamados.filter((c) => c.id_tecnico_atribuido === tec.id_tecnico);
                  const ativasCount = chamadosTecnico.filter(
                    (c) => c.status === 'EM_ATENDIMENTO' || c.status === 'ABERTO' || c.status === 'PAUSADO'
                  ).length;
                  const concluidasCount = chamadosTecnico.filter((c) => c.status === 'CONCLUIDO').length;

                  return (
                    <div
                      key={tec.id_tecnico}
                      className="bg-card border border-border rounded-2xl p-5 space-y-4 hover:border-accent/40 transition-all flex flex-col justify-between shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={tec.avatar_url}
                            alt={tec.nome}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-accent/30"
                          />
                          <div>
                            <h3 className="text-sm font-extrabold text-foreground">{tec.nome}</h3>
                            <p className="text-xs text-muted-foreground">Técnico Autorizado</p>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
                          <p className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-foreground/90">{tec.email}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-success shrink-0" />
                            <span className="text-foreground/90">{tec.telefone}</span>
                          </p>
                          {tec.cpf && (
                            <p className="text-[11px] text-muted-foreground">
                              CPF: {tec.cpf}
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
                          onClick={() => {
                            setTecnicoEdicao(tec);
                            setShowTecnicoModal(true);
                          }}
                          className="px-3 py-1.5 bg-secondary hover:bg-muted text-accent border border-border rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
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

