import React, { useState, useEffect } from 'react';
import { OrdemServico, MotivoPausa, ServicoEquipamento, AssinaturaCliente } from '../types';
import { ChamadoService } from '../services/chamadoService';
import { StatusBadge } from '../components/StatusBadge';
import { ModalPausa } from '../components/ModalPausa';
import { ModalDeslocamento } from '../components/ModalDeslocamento';
import { ModalEquipamentoDefeito } from '../components/ModalEquipamentoDefeito';
import { CanvasAssinatura } from '../components/CanvasAssinatura';
import { RelatorioOS } from '../components/RelatorioOS';
import {
  ArrowLeft,
  Navigation,
  PlayCircle,
  PauseCircle,
  Cpu,
  PenTool,
  CheckCircle2,
  MapPin,
  Phone,
  Calendar,
  Clock,
  Plus,
  Camera,
  FileText,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface Props {
  id_os: number;
  onBack: () => void;
}

export const DetalheChamadoView: React.FC<Props> = ({ id_os, onBack }) => {
  const [chamado, setChamado] = useState<OrdemServico | null>(null);

  // Modals state
  const [showDeslocamentoIda, setShowDeslocamentoIda] = useState(false);
  const [showChegadaModal, setShowChegadaModal] = useState(false);
  const [showPausaModal, setShowPausaModal] = useState(false);
  const [showDeslocamentoVolta, setShowDeslocamentoVolta] = useState(false);
  const [showEquipamentoModal, setShowEquipamentoModal] = useState(false);
  const [equipamentoEdicao, setEquipamentoEdicao] = useState<ServicoEquipamento | null>(null);
  const [showAssinaturaModal, setShowAssinaturaModal] = useState(false);
  const [showRelatorio, setShowRelatorio] = useState(false);

  // API Custos & Confirmations state
  const [showCustosModal, setShowCustosModal] = useState(false);
  const [custosData, setCustosData] = useState<any | null>(null);
  const [loadingCustos, setLoadingCustos] = useState(false);
  const [showConfirmConcluir, setShowConfirmConcluir] = useState(false);
  const [avisoAssinatura, setAvisoAssinatura] = useState(false);

  const loadData = () => {
    const data = ChamadoService.getChamadoPorId(id_os);
    setChamado(data ? { ...data } : null);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = ChamadoService.subscribe(loadData);
    return () => unsubscribe();
  }, [id_os]);

  if (!chamado) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
        <div className="text-center">
          <p className="text-muted-foreground">Chamado não encontrado.</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-secondary hover:bg-muted text-foreground border border-border rounded-xl text-xs font-semibold cursor-pointer"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const c = chamado.cliente;
  const visita = chamado.visitas?.[0];

  // Workflow Handlers
  const handleConfirmIda = ({ km, fotoUrl }: { km: number; fotoUrl?: string }) => {
    const updated = ChamadoService.iniciarDeslocamentoIda(id_os, km, fotoUrl);
    setChamado({ ...updated });
    setShowDeslocamentoIda(false);
  };

  const handleConfirmChegada = ({ km, fotoUrl }: { km: number; fotoUrl?: string }) => {
    const updated = ChamadoService.registrarChegadaCliente(id_os, km, fotoUrl);
    setChamado({ ...updated });
    setShowChegadaModal(false);
  };

  const handleConfirmPausa = (motivo: MotivoPausa, detalhe?: string) => {
    const updated = ChamadoService.pausarVisita(id_os, motivo, detalhe);
    setChamado({ ...updated });
    setShowPausaModal(false);
  };

  const handleRetomarVisita = () => {
    const updated = ChamadoService.retomarVisita(id_os);
    setChamado({ ...updated });
  };

  const handleSaveEquipamento = (eq: ServicoEquipamento) => {
    const updated = ChamadoService.adicionarOuAtualizarServicoEquipamento(id_os, eq);
    setChamado({ ...updated });
    setShowEquipamentoModal(false);
    setEquipamentoEdicao(null);
  };

  const handleConfirmVolta = ({
    km,
    kmFimVolta,
    fotoUrl,
    pedagio,
    frete,
  }: {
    km: number;
    kmFimVolta?: number;
    fotoUrl?: string;
    pedagio?: number;
    frete?: number;
  }) => {
    const updated = ChamadoService.registrarDeslocamentoVolta(
      id_os,
      km,
      kmFimVolta || km + 15,
      fotoUrl
    );

    if (pedagio || frete) {
      if (pedagio) {
        ChamadoService.adicionarComprovante(id_os, {
          id_comprovante: 'c_' + Date.now(),
          tipo: 'pedagio',
          valor: pedagio,
          descricao: 'Pedágio deslocamento volta',
        });
      }
      if (frete) {
        ChamadoService.adicionarComprovante(id_os, {
          id_comprovante: 'c_f_' + Date.now(),
          tipo: 'frete',
          valor: frete,
          descricao: 'Frete devolução de peças',
        });
      }
    }

    setChamado({ ...ChamadoService.getChamadoPorId(id_os)! });
    setShowDeslocamentoVolta(false);
  };

  const handleSaveAssinatura = (assinatura: AssinaturaCliente) => {
    const updated = ChamadoService.salvarAssinatura(id_os, assinatura);
    setChamado({ ...updated });
    setShowAssinaturaModal(false);
  };

  const handleConcluirOS = () => {
    if (!chamado.assinatura && !chamado.assinatura_cliente_url) {
      setAvisoAssinatura(true);
      return;
    }
    setShowConfirmConcluir(true);
  };

  const handleExecuteConcluir = () => {
    const updated = ChamadoService.concluirChamado(id_os, 'Atendimento efetuado em conformidade com as normas técnicas FAST Gôndolas & Check-outs.');
    setChamado({ ...updated });
    setShowConfirmConcluir(false);
  };

  const handleAbrirCustos = async () => {
    setLoadingCustos(true);
    setShowCustosModal(true);
    const data = await ChamadoService.calcularCustos(id_os);
    setCustosData(data);
    setLoadingCustos(false);
  };

  // State condition checks
  const normStatus = String(chamado.status).toUpperCase();
  const isPausado = normStatus === 'PAUSADO';
  const isConcluido = normStatus === 'CONCLUIDO' || normStatus === 'FINALIZADO';
  const temIdaIniciada = Boolean(visita?.km_inicio_ida || visita?.hora_inicio_ida);
  const temChegadaCliente = Boolean(visita?.hora_chegada_cliente || visita?.hora_inicio_atendimento);
  const temVoltaIniciada = Boolean(visita?.km_inicio_volta || visita?.hora_inicio_volta);

  return (
    <div className="min-h-screen bg-background pb-16 text-foreground font-sans">
      {/* Navigation Header */}
      <div className="bg-card border-b border-border sticky top-0 z-30 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs font-semibold py-1 px-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos Chamados</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-foreground">
              #{chamado.codigo_os}
            </span>
            <StatusBadge status={chamado.status} size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAbrirCustos}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Custos (API)</span>
            </button>

            <button
              onClick={() => setShowRelatorio(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-muted text-accent border border-border rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Relatório OS</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Banner Alert if Paused */}
        {isPausado && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-800">OS Atualmente Pausada</h3>
                <p className="text-xs text-amber-700/80">
                  Motivo:{' '}
                  <strong>{visita?.pausas?.[(visita.pausas?.length || 1) - 1]?.motivo || 'Em Pausa Operacional'}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={handleRetomarVisita}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Retomar Atendimento
            </button>
          </div>
        )}

        {/* Client & Address Info */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-accent" />
                <h1 className="text-xl font-extrabold text-foreground">{c.nome_fantasia}</h1>
              </div>
              <p className="text-xs text-muted-foreground">{c.razao_social} • CNPJ: {c.cnpj_cpf}</p>
              <p className="text-xs text-foreground font-semibold pt-1">
                Contato: <span className="text-accent">{c.contato_responsavel}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${c.telefone}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-muted text-foreground rounded-xl text-xs font-semibold border border-border"
              >
                <Phone className="w-3.5 h-3.5 text-success" />
                <span>{c.telefone}</span>
              </a>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${c.endereco}, ${c.numero}, ${c.cidade}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl text-xs font-semibold border border-accent/20"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Abrir GPS</span>
              </a>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent shrink-0" />
              <span className="text-foreground">{c.endereco}, {c.numero} - {c.bairro}, {c.cidade}/{c.uf}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>Agendamento: {chamado.data_agendamento}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
              <span className="text-foreground font-medium">{chamado.em_garantia ? 'Em Garantia' : 'Faturado Direto'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4 bg-secondary/60 p-3.5 rounded-xl border border-border">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Solicitação / Reclamação do Cliente:
            </span>
            <p className="text-xs text-foreground leading-relaxed">{chamado.descricao_cliente}</p>
          </div>
        </div>

        {/* WORKFLOW STEP ACTION BAR */}
        {!isConcluido && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" /> Fluxo de Atendimento em Campo
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Step 1: Deslocamento Ida */}
              <button
                disabled={temIdaIniciada}
                onClick={() => setShowDeslocamentoIda(true)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  temIdaIniciada
                    ? 'bg-success/10 border-success/30 text-success'
                    : 'bg-accent/5 hover:bg-accent/10 border-accent/30 text-accent cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Passo 1</span>
                  <Navigation className="w-4 h-4" />
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-foreground">1. Saída (KM Ida)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {temIdaIniciada
                      ? `Iniciado às ${visita?.hora_inicio_ida} (${visita?.km_inicio_ida} KM)`
                      : 'Registrar odômetro de saída'}
                  </p>
                </div>
              </button>

              {/* Step 2: Chegada ao Cliente */}
              <button
                disabled={!temIdaIniciada || temChegadaCliente}
                onClick={() => setShowChegadaModal(true)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  temChegadaCliente
                    ? 'bg-success/10 border-success/30 text-success'
                    : temIdaIniciada
                    ? 'bg-accent/5 hover:bg-accent/10 border-accent/30 text-accent cursor-pointer'
                    : 'bg-secondary border-border text-muted-foreground opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Passo 2</span>
                  <PlayCircle className="w-4 h-4" />
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-foreground">2. Chegada no Cliente</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {temChegadaCliente
                      ? `Chegou às ${visita?.hora_chegada_cliente}`
                      : 'Confirmar atendimento'}
                  </p>
                </div>
              </button>

              {/* Step 3: Deslocamento Volta */}
              <button
                disabled={!temChegadaCliente || temVoltaIniciada}
                onClick={() => setShowDeslocamentoVolta(true)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  temVoltaIniciada
                    ? 'bg-success/10 border-success/30 text-success'
                    : temChegadaCliente
                    ? 'bg-accent/5 hover:bg-accent/10 border-accent/30 text-accent cursor-pointer'
                    : 'bg-secondary border-border text-muted-foreground opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Passo 3</span>
                  <Navigation className="w-4 h-4" />
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-foreground">3. KM Volta / Retorno</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {temVoltaIniciada
                      ? `Finalizado (${visita?.km_total} KM Total)`
                      : 'Registrar odômetro final'}
                  </p>
                </div>
              </button>

              {/* Step 4: Assinatura */}
              <button
                disabled={!temChegadaCliente || Boolean(chamado.assinatura)}
                onClick={() => setShowAssinaturaModal(true)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  chamado.assinatura
                    ? 'bg-success/10 border-success/30 text-success'
                    : temChegadaCliente
                    ? 'bg-accent/5 hover:bg-accent/10 border-accent/30 text-accent cursor-pointer'
                    : 'bg-secondary border-border text-muted-foreground opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Passo 4</span>
                  <PenTool className="w-4 h-4" />
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-foreground">4. Assinatura Digital</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {chamado.assinatura ? 'Assinado pelo Cliente' : 'Coletar rubrica cliente'}
                  </p>
                </div>
              </button>
            </div>

            {/* Quick Action Bar for Pause & Conclude */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
              {!isPausado && (
                <button
                  onClick={() => setShowPausaModal(true)}
                  className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <PauseCircle className="w-4 h-4 text-amber-600" /> Pausar Atendimento OS
                </button>
              )}

              <button
                onClick={handleConcluirOS}
                disabled={!chamado.assinatura}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                  chamado.assinatura
                    ? 'bg-success hover:bg-success/90 text-white shadow-md shadow-success/20 cursor-pointer'
                    : 'bg-secondary text-muted-foreground cursor-not-allowed border border-border'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Concluir e Encerrar OS
              </button>
            </div>
          </div>
        )}

        {/* Serviced Equipment Section */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Cpu className="w-5 h-5 text-accent" /> Equipamentos & Manutenções
              </h2>
              <p className="text-xs text-muted-foreground">Registre os equipamentos intervencionados na visita</p>
            </div>

            {!isConcluido && (
              <button
                onClick={() => {
                  setEquipamentoEdicao(null);
                  setShowEquipamentoModal(true);
                }}
                className="px-3.5 py-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar Equipamento
              </button>
            )}
          </div>

          {/* Equipment Cards List */}
          {visita?.servicos_realizados && visita.servicos_realizados.length > 0 ? (
            <div className="space-y-4">
              {visita.servicos_realizados.map((eq) => (
                <div key={eq.id_servico_equipamento} className="bg-secondary/50 border border-border rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{eq.nome_equipamento}</h3>
                      <p className="text-xs text-muted-foreground">Modelo: {eq.modelo} | S/N: {eq.numero_serie}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-card text-accent border border-border">
                        {eq.status_servico}
                      </span>
                      {!isConcluido && (
                        <button
                          onClick={() => {
                            setEquipamentoEdicao(eq);
                            setShowEquipamentoModal(true);
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 bg-card rounded-lg border border-border cursor-pointer"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Defects */}
                  {eq.defeitos && eq.defeitos.length > 0 && (
                    <div className="text-xs">
                      <span className="font-semibold text-muted-foreground block mb-1">Defeitos Constatados:</span>
                      <div className="space-y-1">
                        {eq.defeitos.map((d) => (
                          <div key={d.id_defeito} className="flex items-center gap-2 text-foreground">
                            <span className={d.solucionado ? 'text-success font-bold' : 'text-amber-600 font-bold'}>
                              {d.solucionado ? '✓' : '•'}
                            </span>
                            <span>{d.descricao}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photos */}
                  {eq.fotos && eq.fotos.length > 0 && (
                    <div className="text-xs">
                      <span className="font-semibold text-muted-foreground block mb-1">Fotos Anexadas:</span>
                      <div className="flex flex-wrap gap-2">
                        {eq.fotos.map((f) => (
                          <div key={f.id_foto} className="relative group rounded-lg overflow-hidden border border-border w-20 h-16 bg-card">
                            <img src={f.url} alt="Evidência" className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-center text-white truncate px-1">
                              {f.tipo}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Materials */}
                  {eq.materiais && eq.materiais.length > 0 && (
                    <div className="text-xs border-t border-border pt-2">
                      <span className="font-semibold text-muted-foreground block mb-1">Materiais Utilizados:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {eq.materiais.map((m, i) => (
                          <span key={i} className="bg-card border border-border px-2 py-0.5 rounded text-[11px] text-foreground font-medium">
                            {m.quantidade}x {m.descricao}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-secondary/40 border border-border rounded-xl p-6 text-center text-xs text-muted-foreground">
              Nenhum equipamento registrado para esta visita técnica ainda.
            </div>
          )}
        </div>

        {/* Signature Status Component */}
        {(chamado.assinatura || chamado.assinatura_cliente_url) && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <PenTool className="w-4 h-4 text-accent" /> Assinatura do Cliente Coletada
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-4 bg-secondary/50 p-4 rounded-xl border border-border">
              <div className="text-xs space-y-1">
                <p className="font-bold text-foreground">{chamado.assinatura?.nome_responsavel || c.contato_responsavel}</p>
                <p className="text-muted-foreground">RG/CPF: {chamado.assinatura?.documento || 'Documento Registrado'}</p>
                <p className="text-muted-foreground">Cargo: {chamado.assinatura?.cargo_funcao || 'Responsável no Local'}</p>
                <p className="text-muted-foreground text-[10px]">Assinado em: {chamado.assinatura?.data_assinatura || 'Atendimento'}</p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-border shadow-xs">
                <img
                  src={chamado.assinatura?.assinatura_url || chamado.assinatura_cliente_url}
                  alt="Assinatura"
                  className="h-14 object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      <ModalDeslocamento
        isOpen={showDeslocamentoIda}
        type="IDA_INICIO"
        initialKm={visita?.km_inicio_ida || 45220}
        onClose={() => setShowDeslocamentoIda(false)}
        onConfirm={handleConfirmIda}
      />

      <ModalDeslocamento
        isOpen={showChegadaModal}
        type="IDA_CHEGADA"
        initialKm={(visita?.km_inicio_ida || 45220) + 18}
        onClose={() => setShowChegadaModal(false)}
        onConfirm={handleConfirmChegada}
      />

      <ModalDeslocamento
        isOpen={showDeslocamentoVolta}
        type="VOLTA_REGISTRO"
        initialKm={visita?.km_fim_ida || 45238}
        onClose={() => setShowDeslocamentoVolta(false)}
        onConfirm={handleConfirmVolta}
      />

      <ModalPausa
        isOpen={showPausaModal}
        onClose={() => setShowPausaModal(false)}
        onConfirm={handleConfirmPausa}
      />

      <ModalEquipamentoDefeito
        isOpen={showEquipamentoModal}
        equipamentoExistente={equipamentoEdicao}
        onClose={() => {
          setShowEquipamentoModal(false);
          setEquipamentoEdicao(null);
        }}
        onSave={handleSaveEquipamento}
      />

      <CanvasAssinatura
        isOpen={showAssinaturaModal}
        nomeClienteDefault={c.contato_responsavel}
        onClose={() => setShowAssinaturaModal(false)}
        onSave={handleSaveAssinatura}
      />

      {showRelatorio && (
        <RelatorioOS chamado={chamado} onClose={() => setShowRelatorio(false)} />
      )}

      {/* Modal Custos da API FastAPI */}
      {showCustosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-foreground">Custos Calculados da OS (FastAPI)</h3>
              </div>
              <button
                onClick={() => setShowCustosModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              {loadingCustos ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Consultando endpoint /api/chamados/{id_os}/custos...
                </div>
              ) : custosData ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-secondary/50 p-3 rounded-xl border border-border">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Materiais:</span>
                      <strong className="text-foreground">R$ {Number(custosData.custo_total_materiais || 0).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Quilometragem (KM):</span>
                      <strong className="text-foreground">R$ {Number(custosData.custo_total_km || 0).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Pedágio:</span>
                      <strong className="text-foreground">R$ {Number(custosData.custo_total_pedagio || 0).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Frete Devolução:</span>
                      <strong className="text-foreground">R$ {Number(custosData.custo_total_frete || 0).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Tempo de Serviço:</span>
                      <strong className="text-foreground">R$ {Number(custosData.custo_total_servico || 0).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Tempo de Deslocamento:</span>
                      <strong className="text-foreground">R$ {Number(custosData.custo_total_deslocamento || 0).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                    <span className="font-bold text-xs">Total Geral da Ordem de Serviço:</span>
                    <strong className="text-base font-extrabold">R$ {Number(custosData.total_geral || 0).toFixed(2)}</strong>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Backend offline ou sem custos registrados para esta OS ainda.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowCustosModal(false)}
                className="px-4 py-2 bg-secondary hover:bg-muted text-foreground border border-border rounded-xl text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Conclusão */}
      {showConfirmConcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-foreground">Confirmar Encerramento Definitivo?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Deseja finalizar esta Ordem de Serviço? Ela será marcada como concluída e os custos finais serão compilados.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmConcluir(false)}
                className="px-4 py-2 bg-secondary hover:bg-muted text-foreground rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteConcluir}
                className="px-4 py-2 bg-success text-white hover:bg-success/90 rounded-xl text-xs font-bold"
              >
                Confirmar Conclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aviso de Assinatura Necessária */}
      {avisoAssinatura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-foreground">Assinatura Obrigatória</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Por favor, colete a assinatura do responsável no cliente antes de encerrar esta Ordem de Serviço.
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setAvisoAssinatura(false)}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
