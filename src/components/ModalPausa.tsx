import React, { useState } from 'react';
import { MotivoPausa } from '../types';
import { PauseCircle, X, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: MotivoPausa, detalhe?: string) => void;
}

const MOTIVOS: MotivoPausa[] = [
  'Falta de Peças / Componentes',
  'Aguardando Liberação do Cliente',
  'Horário de Almoço / Intervalo',
  'Fim de Expediente',
  'Aguardando Suporte Técnico',
  'Outros',
];

export const ModalPausa: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const [selectedMotivo, setSelectedMotivo] = useState<MotivoPausa>(MOTIVOS[0]);
  const [detalhe, setDetalhe] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(selectedMotivo, detalhe);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl p-6 shadow-2xl relative text-foreground">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
            <PauseCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Pausar Ordem de Serviço</h2>
            <p className="text-xs text-muted-foreground">Selecione o motivo da interrupção temporária do atendimento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Motivo da Pausa *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MOTIVOS.map((motivo) => (
                <button
                  key={motivo}
                  type="button"
                  onClick={() => setSelectedMotivo(motivo)}
                  className={`text-left text-xs p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedMotivo === motivo
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 font-semibold ring-1 ring-amber-500/30'
                      : 'bg-secondary/60 border-border text-foreground hover:border-accent/40'
                  }`}
                >
                  {motivo}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Observações / Detalhes Adicionais (opcional)
            </label>
            <textarea
              rows={3}
              value={detalhe}
              onChange={(e) => setDetalhe(e.target.value)}
              placeholder="Ex: Peça encomendada com prazo de entrega para às 15h. Código do item: DANFOSS-TES2."
              className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Ao pausar, o status do chamado mudará para <strong>Pausado</strong> e o cronômetro de atendimento será paralisado até a retomada.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary hover:bg-muted transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              Confirmar Pausa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
