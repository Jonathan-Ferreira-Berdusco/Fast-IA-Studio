import React, { useState } from 'react';
import { OrdemServico, StatusChamado } from '../types';
import { StatusBadge } from './StatusBadge';
import { RelatorioOS } from './RelatorioOS';
import { ChamadoService } from '../services/chamadoService';
import {
  X,
  Building,
  Wrench,
  User,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  FileText,
  Navigation,
  PenTool,
  AlertTriangle,
  DollarSign,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Car,
  Receipt,
  Layers,
  ZoomIn,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  os: OrdemServico | null;
  onClose: () => void;
  onEdit: (os: OrdemServico) => void;
  onAssignTecnico: (os: OrdemServico) => void;
  onStatusUpdated?: () => void;
}

export const ModalDetalheOSAdmin: React.FC<Props> = ({
  isOpen,
  os,
  onClose,
  onEdit,
  onAssignTecnico,
  onStatusUpdated,
}) => {
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!isOpen || !os) return null;

  const c = os.cliente || {
    id_cliente: os.id_cliente || 1,
    nome_fantasia: os.cliente_nome || 'Cliente',
    razao_social: os.cliente_nome || 'Cliente',
    cnpj_cpf: '',
    contato_responsavel: 'Responsável',
    telefone: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
  };
  const t = os.tecnico;
  const visita = os.visitas?.[0];

  // Financial calculations for this specific OS
  const kmTotal = visita?.km_total || 0;
  const custoLocomocaoKm = kmTotal * 2.5; // R$ 2.50 per KM
  const valorPedagio = visita?.valor_pedagio || 0;
  const valorFrete = visita?.valor_frete_devolucao || 0;
  const custoLocomocaoTotal = custoLocomocaoKm + valorPedagio + valorFrete;

  const honorariosTotal = os.honorarios !== undefined ? os.honorarios : (os.status === 'CONCLUIDO' ? 180 : 0);

  let custoPecasTotal = 0;
  visita?.servicos_realizados?.forEach((eq) => {
    eq.materiais?.forEach((mat) => {
      custoPecasTotal += (mat.quantidade || 0) * (mat.valor_unitario || 0);
    });
  });

  const custoTotalOS = custoLocomocaoTotal + honorariosTotal + custoPecasTotal;

  // Collect all odometer images for the evidence gallery
  const odometerEvidences = [
    {
      title: 'Odômetro: Saída da Base',
      url: visita?.foto_inicio_ida_url,
      km: visita?.km_inicio_ida,
      hora: visita?.hora_inicio_ida,
    },
    {
      title: 'Odômetro: Chegada no Cliente',
      url: visita?.foto_fim_ida_url,
      km: visita?.km_fim_ida,
      hora: visita?.hora_chegada_cliente,
    },
    {
      title: 'Odômetro: Saída do Cliente',
      url: visita?.foto_inicio_volta_url,
      km: visita?.km_inicio_volta,
      hora: visita?.hora_inicio_volta,
    },
    {
      title: 'Odômetro: Retorno na Base',
      url: visita?.foto_fim_volta_url,
      km: visita?.km_fim_volta,
      hora: visita?.hora_fim_volta,
    },
  ].filter((item) => item.km || item.url || item.hora);

  const handleCancelOS = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Por favor, informe o motivo do cancelamento.');
      return;
    }
    setCancelError(null);
    try {
      await ChamadoService.cancelarChamado(os.id_os, cancelReason);
      setShowCancelPrompt(false);
      if (onStatusUpdated) onStatusUpdated();
      onClose();
    } catch (err: any) {
      setCancelError(err?.detail || err?.message || 'Falha ao cancelar chamado.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="w-full max-w-5xl bg-card border border-border rounded-3xl p-6 shadow-2xl relative my-6 max-h-[92vh] flex flex-col text-foreground">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 border border-accent/20 text-accent rounded-2xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-extrabold text-foreground font-['Space_Grotesk'] tracking-tight">
                  Ordem de Serviço #{os.codigo_os}
                </h2>
                <StatusBadge status={os.status} size="md" />
                {os.em_garantia && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-success/10 text-success border border-success/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Garantia
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                <span>Abertura: <strong className="text-foreground">{os.data_abertura}</strong></span>
                <span>•</span>
                <span>Agendamento: <strong className="text-accent">{os.data_agendamento || 'Não agendado'}</strong></span>
                {os.pedido && (
                  <>
                    <span>•</span>
                    <span>Pedido: <strong className="text-foreground">{os.pedido}</strong></span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRelatorio(true)}
              className="px-3.5 py-2 bg-secondary hover:bg-muted text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-accent" />
              <span>Gerar Relatório</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(os);
              }}
              className="px-3.5 py-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 rounded-xl text-xs font-bold cursor-pointer"
            >
              Editar OS
            </button>
            {os.status !== 'CANCELADO' && os.status !== 'CONCLUIDO' && (
              <button
                onClick={() => setShowCancelPrompt(true)}
                className="px-3 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar OS
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cancel Confirmation Prompt */}
        {showCancelPrompt && (
          <div className="mb-5 p-4 bg-destructive/10 border border-destructive/30 rounded-2xl space-y-3 shrink-0">
            <div className="flex items-center gap-2 text-destructive font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirmar Cancelamento da Ordem de Serviço</span>
            </div>
            {cancelError && (
              <p className="text-destructive text-xs font-semibold">{cancelError}</p>
            )}
            <input
              type="text"
              placeholder="Digite o motivo do cancelamento (ex: cliente desmarcou, cancelado pela gerência)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-card border border-destructive/40 rounded-xl p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelPrompt(false)}
                className="px-3 py-1.5 bg-secondary hover:bg-muted text-foreground rounded-lg text-xs font-semibold cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelOS}
                className="px-4 py-1.5 bg-destructive hover:bg-destructive/90 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="space-y-6 text-xs overflow-y-auto pr-1 flex-1">
          {/* Section 1: Envolvidos (Cliente & Técnico) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cliente Box */}
            <div className="bg-secondary/40 p-4 rounded-2xl border border-border space-y-2.5">
              <div className="flex items-center justify-between text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-accent">
                  <Building className="w-4 h-4" /> Cliente Solicitante
                </span>
                <span className="text-muted-foreground">ID #{c.id_cliente}</span>
              </div>
              <h3 className="text-sm font-extrabold text-foreground">{c.nome_fantasia}</h3>
              <p className="text-muted-foreground text-[11px]">{c.razao_social} • CNPJ/CPF: <span className="text-foreground">{c.cnpj_cpf}</span></p>

              <div className="pt-2 border-t border-border space-y-1.5">
                <p className="text-foreground font-semibold">
                  Contato Principal: <span className="text-accent font-bold">{c.contato_responsavel}</span> ({c.telefone})
                </p>

                {/* Additional Contacts if registered */}
                {c.contatos && c.contatos.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Outros Responsáveis / Contatos:
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {c.contatos.map((cont, idx) => (
                        <div key={idx} className="bg-card p-2 rounded-lg border border-border text-[11px] text-foreground flex justify-between items-center">
                          <span>
                            <strong>{cont.nome}</strong> ({cont.cargo || cont.cargo_departamento || 'Responsável'})
                          </span>
                          <span className="text-accent font-medium text-[10px]">{cont.telefone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-muted-foreground text-[11px] flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {c.endereco}, {c.numero} - {c.bairro}, {c.cidade}/{c.uf}
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.endereco}, ${c.numero}, ${c.cidade} ${c.uf}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline flex items-center gap-0.5 text-[10px] shrink-0 font-medium"
                  >
                    <span>Ver no Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>

            {/* Técnico Box */}
            <div className="bg-secondary/40 p-4 rounded-2xl border border-border space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px] font-bold uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5 text-accent">
                    <Wrench className="w-4 h-4" /> Técnico de Campo Atribuído
                  </span>
                  <button
                    onClick={() => onAssignTecnico(os)}
                    className="text-[10px] text-accent hover:underline cursor-pointer font-bold"
                  >
                    Alterar Técnico
                  </button>
                </div>
                {t ? (
                  <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border">
                    <img
                      src={t.avatar_url}
                      alt={t.nome}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-accent/30"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{t.nome}</h3>
                      <p className="text-[11px] text-muted-foreground">{t.email}</p>
                      <p className="text-[11px] text-success font-semibold mt-0.5">{t.telefone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-card rounded-xl border border-border text-center text-muted-foreground">
                    Nenhum técnico atribuído a esta OS ainda.
                  </div>
                )}
              </div>

              {/* Consolidated Financial Summary Card */}
              <div className="bg-card p-3.5 rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1 text-accent">
                    <DollarSign className="w-4 h-4" /> Resumo Financeiro da OS
                  </span>
                  <span className="text-sm font-extrabold text-foreground">
                    R$ {custoTotalOS.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] pt-1 border-t border-border">
                  <div>
                    <span className="text-muted-foreground block">Locomoção:</span>
                    <strong className="text-foreground font-semibold">R$ {custoLocomocaoTotal.toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Honorários:</span>
                    <strong className="text-foreground font-semibold">R$ {honorariosTotal.toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Peças:</span>
                    <strong className="text-foreground font-semibold">R$ {custoPecasTotal.toFixed(2).replace('.', ',')}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Solicitação Original */}
          <div className="bg-secondary/40 p-4 rounded-2xl border border-border space-y-1.5">
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Descrição da Solicitação / Reclamação:
            </span>
            <p className="text-foreground leading-relaxed font-medium text-xs bg-card p-3 rounded-xl border border-border">
              {os.descricao_cliente}
            </p>
          </div>

          {/* Section 3: Registro de Atendimento e Deslocamento */}
          {visita && (
            <div className="bg-secondary/40 p-5 rounded-2xl border border-border space-y-4">
              <h4 className="font-bold text-foreground text-xs flex items-center gap-2 uppercase tracking-wider">
                <Car className="w-4 h-4 text-accent" /> Registro de Atendimento & Deslocamento
              </h4>

              {/* Workflow Time & KM Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-card p-3.5 rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground block font-semibold">1. Saída do Técnico (Base)</span>
                  <span className="text-sm font-extrabold text-foreground">{visita.hora_inicio_ida || '--:--'}</span>
                  <span className="text-[11px] text-accent font-bold block mt-1">
                    {visita.km_inicio_ida ? `${visita.km_inicio_ida} KM` : 'KM não reg.'}
                  </span>
                </div>

                <div className="bg-card p-3.5 rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground block font-semibold">2. Chegada no Cliente</span>
                  <span className="text-sm font-extrabold text-foreground">{visita.hora_chegada_cliente || '--:--'}</span>
                  <span className="text-[11px] text-success font-bold block mt-1">
                    {visita.km_fim_ida ? `${visita.km_fim_ida} KM` : 'KM não reg.'}
                  </span>
                </div>

                <div className="bg-card p-3.5 rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground block font-semibold">3. Saída do Cliente</span>
                  <span className="text-sm font-extrabold text-foreground">
                    {visita.hora_inicio_volta || visita.hora_fim_atendimento || '--:--'}
                  </span>
                  <span className="text-[11px] text-foreground font-bold block mt-1">
                    {visita.km_inicio_volta ? `${visita.km_inicio_volta} KM` : 'KM não reg.'}
                  </span>
                </div>

                <div className="bg-card p-3.5 rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground block font-semibold">4. Retorno na Base / Total</span>
                  <span className="text-sm font-extrabold text-foreground">{visita.hora_fim_volta || '--:--'}</span>
                  <span className="text-[11px] text-accent font-extrabold block mt-1">
                    {kmTotal ? `${kmTotal} KM Total` : '0 KM'}
                  </span>
                </div>
              </div>

              {/* Section 4: Evidências de Odômetro (Gallery) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4 text-accent" /> Galeria de Evidências de Odômetro
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Fotos registradas nas etapas de locomoção
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {odometerEvidences.map((ev, idx) => (
                    <div
                      key={idx}
                      className="bg-card border border-border rounded-xl p-3 space-y-2 flex flex-col justify-between group hover:border-accent/40 transition-all"
                    >
                      <span className="text-[11px] font-bold text-foreground block truncate" title={ev.title}>
                        {ev.title}
                      </span>
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary border border-border flex items-center justify-center">
                        {ev.url ? (
                          <>
                            <img
                              src={ev.url}
                              alt={ev.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => setLightboxImage({ url: ev.url!, title: ev.title })}
                            />
                            <button
                              onClick={() => setLightboxImage({ url: ev.url!, title: ev.title })}
                              className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                            >
                              <ZoomIn className="w-5 h-5 text-white" />
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-2">
                            <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                            <span className="text-[9px] text-muted-foreground">Sem foto</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex justify-between">
                        <span>{ev.hora || '--:--'}</span>
                        <strong className="text-accent">{ev.km ? `${ev.km} KM` : ''}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Equipamentos e Diagnósticos (Solved / Not Solved) */}
              {visita.servicos_realizados && visita.servicos_realizados.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Wrench className="w-4 h-4 text-accent" /> Equipamentos & Diagnósticos Técnicos
                  </span>

                  <div className="space-y-3">
                    {visita.servicos_realizados.map((eq) => (
                      <div key={eq.id_servico_equipamento} className="bg-card p-4 rounded-xl border border-border space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h5 className="font-extrabold text-foreground text-xs">
                              {eq.nome_equipamento}
                            </h5>
                            <p className="text-[11px] text-muted-foreground">
                              Modelo: <span className="text-foreground">{eq.modelo || 'Padrão'}</span> • Nº Série: <span className="text-accent">{eq.numero_serie || 'N/A'}</span>
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            eq.status_servico === 'Sanado' || eq.status_servico === 'Substituído'
                              ? 'bg-success/10 text-success border-success/30'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                          }`}>
                            Status: {eq.status_servico}
                          </span>
                        </div>

                        {/* Defeitos list with explicit Solucionado / Não Solucionado badges */}
                        {eq.defeitos && eq.defeitos.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Problemas / Diagnósticos Apontados:
                            </span>
                            <div className="space-y-1.5">
                              {eq.defeitos.map((d) => (
                                <div
                                  key={d.id_defeito}
                                  className="flex items-center justify-between gap-2 bg-secondary/50 p-2.5 rounded-lg border border-border"
                                >
                                  <span className="text-xs text-foreground font-medium">{d.descricao}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 flex items-center gap-1 border ${
                                      d.solucionado
                                        ? 'bg-success/10 text-success border-success/30'
                                        : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                    }`}
                                  >
                                    {d.solucionado ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3" /> Solucionado
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle className="w-3 h-3" /> Não Solucionado
                                      </>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Materials applied */}
                        {eq.materiais && eq.materiais.length > 0 && (
                          <div className="pt-2 border-t border-border space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Peças e Materiais Utilizados:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {eq.materiais.map((m, i) => (
                                <div key={i} className="bg-secondary/50 p-2 rounded-lg border border-border text-[11px] flex justify-between items-center">
                                  <span className="text-foreground font-medium">
                                    {m.quantidade}x {m.descricao}
                                  </span>
                                  {m.valor_unitario !== undefined && (
                                    <span className="text-accent font-bold text-[10px]">
                                      R$ {((m.quantidade || 1) * m.valor_unitario).toFixed(2).replace('.', ',')}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature section */}
              {os.assinatura && (
                <div className="bg-card p-4 rounded-2xl border border-border flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-success flex items-center gap-1.5">
                      <PenTool className="w-4 h-4" /> Assinatura Digital do Cliente Coletada
                    </span>
                    <p className="text-foreground font-extrabold text-sm mt-1">{os.assinatura.nome_responsavel}</p>
                    <p className="text-muted-foreground text-[11px]">
                      RG/CPF: <span className="text-foreground">{os.assinatura.documento}</span> • Cargo: <span className="text-foreground">{os.assinatura.cargo_funcao}</span>
                    </p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">Data/Hora: {os.assinatura.data_assinatura}</p>
                  </div>
                  <div className="bg-secondary p-2.5 rounded-xl border border-border">
                    <img src={os.assinatura.assinatura_url} alt="Assinatura Digital" className="h-14 object-contain" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between mt-4 shrink-0">
          <span className="text-[11px] text-muted-foreground">
            FAST Gôndolas & Check-outs • Sistema de Gestão Técnica • OS #{os.codigo_os}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-secondary hover:bg-muted text-foreground rounded-xl font-bold cursor-pointer text-xs"
          >
            Fechar Visualização
          </button>
        </div>
      </div>

      {/* Lightbox for Odometer / Equipment Images */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-3xl w-full text-center space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white pb-2 border-b border-white/20">
              <span className="font-bold text-sm">{lightboxImage.title}</span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 text-white/70 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-h-[75vh] w-auto mx-auto rounded-2xl border border-white/20 shadow-2xl object-contain"
            />
          </div>
        </div>
      )}

      {/* PDF Report Modal */}
      {showRelatorio && (
        <RelatorioOS chamado={os} onClose={() => setShowRelatorio(false)} />
      )}
    </div>
  );
};

