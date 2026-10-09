import React from 'react';
import { OrdemServico } from '../types';
import { StatusBadge } from './StatusBadge';
import { Calendar, MapPin, ArrowRight, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

interface Props {
  chamado: OrdemServico;
  onSelect: (id_os: number) => void;
}

export const CardChamado: React.FC<Props> = ({ chamado, onSelect }) => {
  const c = chamado.cliente || {
    id_cliente: chamado.id_cliente || 1,
    nome_fantasia: chamado.cliente_nome || 'Cliente',
    razao_social: chamado.cliente_nome || 'Cliente',
    cnpj_cpf: '',
    telefone: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
  };
  const visita = chamado.visitas?.[0];
  const equipamentosCount = visita?.servicos_realizados?.length || 0;

  const priorityColors = {
    Urgente: 'bg-destructive/20 text-destructive border-destructive/40',
    Alta: 'bg-warning/20 text-warning border-warning/40',
    Média: 'bg-info/20 text-info border-info/40',
    Baixa: 'bg-secondary text-muted-foreground border-border',
  };

  return (
    <div
      onClick={() => onSelect(chamado.id_os)}
      className="group relative surface-card hover:border-accent/50 p-5 transition-all duration-200 hover:shadow-xl cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top bar: OS Code, Priority & Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-foreground text-base font-['Space_Grotesk'] tracking-wide">
              #{chamado.codigo_os}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[chamado.prioridade]}`}
            >
              {chamado.prioridade}
            </span>
            {chamado.em_garantia ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success/15 border border-success/30 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Em Garantia
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-full">
                <ShieldAlert className="w-3 h-3" /> Faturado
              </span>
            )}
          </div>
          <StatusBadge status={chamado.status} size="sm" />
        </div>

        {/* Client info */}
        <div className="pt-3 pb-2">
          <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors">
            {c.nome_fantasia}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{c.razao_social} • CNPJ: {c.cnpj_cpf}</p>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-foreground/90 line-clamp-2 bg-secondary/70 p-2.5 rounded-lg border border-border/80 mb-3">
          {chamado.descricao_cliente}
        </p>

        {/* Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate">
              {[c.endereco, c.numero].filter(Boolean).join(', ')}{c.bairro || c.cidade ? ' - ' : ''}{[c.bairro, c.cidade].filter(Boolean).join('/') || (c.endereco ? '' : 'Endereço não informado')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>{chamado.data_agendamento}</span>
          </div>
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Cpu className="w-4 h-4 text-accent" />
          <span>{equipamentosCount} equipamento(s) registrado(s)</span>
        </div>

        <div className="flex items-center gap-1 font-semibold text-accent group-hover:translate-x-1 transition-transform">
          <span>Ver Detalhes</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

