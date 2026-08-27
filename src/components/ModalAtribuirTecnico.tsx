import React, { useState } from 'react';
import { OrdemServico, Tecnico } from '../types';
import { X, Wrench, UserCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  os: OrdemServico | null;
  tecnicos: Tecnico[];
  onClose: () => void;
  onConfirm: (id_os: number, id_tecnico: number) => void;
}

export const ModalAtribuirTecnico: React.FC<Props> = ({
  isOpen,
  os,
  tecnicos,
  onClose,
  onConfirm,
}) => {
  const [selectedTecnicoId, setSelectedTecnicoId] = useState<number>(
    os?.id_tecnico_atribuido || tecnicos[0]?.id_tecnico || 1
  );

  if (!isOpen || !os) return null;

  const handleSave = () => {
    onConfirm(os.id_os, Number(selectedTecnicoId));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl relative text-foreground">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 border border-primary/20 text-primary rounded-xl">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground font-['Space_Grotesk']">
                Atribuir Técnico a OS #{os.codigo_os}
              </h3>
              <p className="text-[11px] text-muted-foreground">Cliente: {os.cliente.nome_fantasia}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <label className="block text-xs font-semibold text-foreground">
            Selecione o Técnico Responsável:
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {tecnicos.map((t) => {
              const isSelected = Number(selectedTecnicoId) === Number(t.id_tecnico);
              return (
                <div
                  key={t.id_tecnico}
                  onClick={() => setSelectedTecnicoId(t.id_tecnico)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/30'
                      : 'bg-secondary/60 border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={t.avatar_url}
                      alt={t.nome}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-border"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">{t.nome}</p>
                      <p className="text-[10px] text-primary font-medium">{t.especialidade}</p>
                    </div>
                  </div>
                  {isSelected && <UserCheck className="w-5 h-5 text-primary" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md shadow-primary/20 cursor-pointer"
          >
            Confirmar Atribuição
          </button>
        </div>
      </div>
    </div>
  );
};
