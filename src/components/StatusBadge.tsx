import React from 'react';
import { StatusChamado } from '../types';
import { Clock, PlayCircle, PauseCircle, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  status: StatusChamado;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const configs: Record<StatusChamado, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
    ABERTO: {
      label: 'Aberto',
      bg: 'bg-info/15',
      text: 'text-info',
      border: 'border-info/30',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    EM_ATENDIMENTO: {
      label: 'Em Atendimento',
      bg: 'bg-accent/15',
      text: 'text-accent',
      border: 'border-accent/40',
      icon: <PlayCircle className="w-3.5 h-3.5" />,
    },
    PAUSADO: {
      label: 'Pausado',
      bg: 'bg-warning/15',
      text: 'text-warning',
      border: 'border-warning/30',
      icon: <PauseCircle className="w-3.5 h-3.5" />,
    },
    CONCLUIDO: {
      label: 'Concluído',
      bg: 'bg-success/15',
      text: 'text-success',
      border: 'border-success/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    CANCELADO: {
      label: 'Cancelado',
      bg: 'bg-destructive/15',
      text: 'text-destructive',
      border: 'border-destructive/30',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  };

  const c = configs[status] || configs.ABERTO;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-bold gap-2',
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${c.bg} ${c.text} ${c.border} ${sizeClasses[size]} whitespace-nowrap`}>
      {c.icon}
      <span>{c.label}</span>
    </span>
  );
};

