import React, { useState, useEffect } from 'react';
import { Cliente, Tecnico, OrdemServico } from '../types';
import { X, Sparkles, Building, Wrench, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  clientes: Cliente[];
  tecnicos: Tecnico[];
  osEdicao?: OrdemServico | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const ModalNovaOS: React.FC<Props> = ({
  isOpen,
  clientes,
  tecnicos,
  osEdicao,
  onClose,
  onSave,
}) => {
  const [idCliente, setIdCliente] = useState<number>(clientes[0]?.id_cliente || 1);
  const [idTecnico, setIdTecnico] = useState<number>(tecnicos[0]?.id_tecnico || 1);
  const [prioridade, setPrioridade] = useState<'Baixa' | 'Média' | 'Alta' | 'Urgente'>('Média');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [descricaoCliente, setDescricaoCliente] = useState('');
  const [equipamentoNome, setEquipamentoNome] = useState('');
  const [equipamentoModelo, setEquipamentoModelo] = useState('');
  const [equipamentoSerie, setEquipamentoSerie] = useState('');
  const [emGarantia, setEmGarantia] = useState(true);
  const [pedido, setPedido] = useState('');

  useEffect(() => {
    if (osEdicao) {
      setIdCliente(osEdicao.id_cliente);
      setIdTecnico(osEdicao.id_tecnico_atribuido || tecnicos[0]?.id_tecnico || 1);
      setPrioridade(osEdicao.prioridade);
      setDataAgendamento(osEdicao.data_agendamento || '');
      setDescricaoCliente(osEdicao.descricao_cliente || '');
      setEmGarantia(osEdicao.em_garantia);
      setPedido(osEdicao.pedido || '');

      const eq = osEdicao.visitas?.[0]?.servicos_realizados?.[0];
      if (eq) {
        setEquipamentoNome(eq.nome_equipamento || '');
        setEquipamentoModelo(eq.modelo || '');
        setEquipamentoSerie(eq.numero_serie || '');
      }
    } else {
      setIdCliente(clientes[0]?.id_cliente || 1);
      setIdTecnico(tecnicos[0]?.id_tecnico || 1);
      setPrioridade('Média');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDataAgendamento(`${tomorrow.toISOString().split('T')[0]} 09:00`);
      setDescricaoCliente('');
      setEquipamentoNome('');
      setEquipamentoModelo('');
      setEquipamentoSerie('');
      setEmGarantia(true);
      setPedido(`PED-${Math.floor(10000 + Math.random() * 90000)}`);
    }
  }, [osEdicao, isOpen, clientes, tecnicos]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricaoCliente.trim()) {
      alert('Por favor, informe a descrição do problema ou solicitação.');
      return;
    }

    onSave({
      id_os: osEdicao?.id_os,
      id_cliente: Number(idCliente),
      id_tecnico_atribuido: Number(idTecnico),
      prioridade,
      data_agendamento: dataAgendamento,
      descricao_cliente: descricaoCliente,
      equipamento_nome: equipamentoNome,
      equipamento_modelo: equipamentoModelo,
      equipamento_serie: equipamentoSerie,
      em_garantia: emGarantia,
      pedido,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl relative my-8 text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-2xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground font-['Space_Grotesk']">
                {osEdicao ? `Editar Ordem de Serviço #${osEdicao.codigo_os}` : 'Nova Ordem de Serviço (OS)'}
              </h2>
              <p className="text-xs text-muted-foreground">Preencha as especificações para triagem e atendimento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Client & Technician Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-primary" /> Cliente Solicitante *
              </label>
              <select
                value={idCliente}
                onChange={(e) => setIdCliente(Number(e.target.value))}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nome_fantasia} ({c.cidade}/{c.uf})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-primary" /> Técnico Responsável *
              </label>
              <select
                value={idTecnico}
                onChange={(e) => setIdTecnico(Number(e.target.value))}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                {tecnicos.map((t) => (
                  <option key={t.id_tecnico} value={t.id_tecnico}>
                    {t.nome} ({t.especialidade})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheduling & Priority & Warrant */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Data / Hora Agendamento
              </label>
              <input
                type="text"
                placeholder="Ex: 2026-08-07 10:00"
                value={dataAgendamento}
                onChange={(e) => setDataAgendamento(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1.5">Prioridade *</label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as any)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1.5">Nº Pedido / Referência</label>
              <input
                type="text"
                placeholder="Ex: PED-99012"
                value={pedido}
                onChange={(e) => setPedido(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Equipment Details */}
          <div className="bg-secondary/50 p-4 rounded-2xl border border-border space-y-3">
            <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-primary" /> Equipamento a ser Manutenido (Opcional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Nome do Equipamento</label>
                <input
                  type="text"
                  placeholder="Ex: Câmara Fria 3M"
                  value={equipamentoNome}
                  onChange={(e) => setEquipamentoNome(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Modelo</label>
                <input
                  type="text"
                  placeholder="Ex: ARIAM-COOL-3000X"
                  value={equipamentoModelo}
                  onChange={(e) => setEquipamentoModelo(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Número de Série</label>
                <input
                  type="text"
                  placeholder="Ex: SN-8891-2024"
                  value={equipamentoSerie}
                  onChange={(e) => setEquipamentoSerie(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Problem Description */}
          <div>
            <label className="block font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-primary" /> Descrição do Problema / Solicitação *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Descreva detalhadamente a solicitação do cliente, falhas observadas ou objetivos do atendimento..."
              value={descricaoCliente}
              onChange={(e) => setDescricaoCliente(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Warranty Toggle */}
          <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-xl border border-border">
            <input
              type="checkbox"
              id="em_garantia"
              checked={emGarantia}
              onChange={(e) => setEmGarantia(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
            <label htmlFor="em_garantia" className="font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-success" /> Atendimento Coberto por Garantia do Fabricante (FAST Gôndolas)
            </label>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md shadow-primary/20 cursor-pointer"
            >
              {osEdicao ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
