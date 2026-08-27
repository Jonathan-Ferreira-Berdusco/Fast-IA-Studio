import React, { useState } from 'react';
import { Navigation, Camera, X, Check, DollarSign } from 'lucide-react';

interface Props {
  isOpen: boolean;
  type: 'IDA_INICIO' | 'IDA_CHEGADA' | 'VOLTA_REGISTRO';
  initialKm?: number;
  onClose: () => void;
  onConfirm: (data: { km: number; fotoUrl?: string; kmFimVolta?: number; pedagio?: number; frete?: number }) => void;
}

const SAMPLE_ODOMETER_PHOTOS = [
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600&auto=format&fit=crop&q=80',
];

export const ModalDeslocamento: React.FC<Props> = ({ isOpen, type, initialKm = 45220, onClose, onConfirm }) => {
  const [km, setKm] = useState<number>(initialKm);
  const [kmVolta, setKmVolta] = useState<number>(initialKm + 15);
  const [fotoUrl, setFotoUrl] = useState<string>(SAMPLE_ODOMETER_PHOTOS[0]);
  const [pedagio, setPedagio] = useState<number>(0);
  const [frete, setFrete] = useState<number>(0);

  if (!isOpen) return null;

  const titles = {
    IDA_INICIO: 'Registro de Saída / KM Inicial (Ida)',
    IDA_CHEGADA: 'Chegada ao Cliente / Confirmar KM Final Ida',
    VOLTA_REGISTRO: 'Registro de Deslocamento de Volta (KM)',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      km,
      fotoUrl,
      kmFimVolta: type === 'VOLTA_REGISTRO' ? kmVolta : undefined,
      pedagio: pedagio > 0 ? pedagio : undefined,
      frete: frete > 0 ? frete : undefined,
    });
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
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{titles[type]}</h2>
            <p className="text-xs text-muted-foreground">Insira a leitura do odômetro e comprovantes de deslocamento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type !== 'VOLTA_REGISTRO' ? (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Quilometragem Atual do Veículo (KM) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  value={km}
                  onChange={(e) => setKm(Number(e.target.value))}
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-lg font-bold text-accent focus:border-accent focus:outline-none"
                />
                <span className="absolute right-3 top-3.5 text-xs text-muted-foreground font-semibold">KM</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">KM Início Volta *</label>
                <input
                  type="number"
                  required
                  value={km}
                  onChange={(e) => setKm(Number(e.target.value))}
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-base font-bold text-foreground focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">KM Chegada / Fim *</label>
                <input
                  type="number"
                  required
                  value={kmVolta}
                  onChange={(e) => setKmVolta(Number(e.target.value))}
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-base font-bold text-accent focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Odometer Photo Attachment */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Foto do Painel / Odômetro (Anexo Comprovatório)
            </label>
            <div className="flex items-center gap-3 bg-secondary/60 p-3 rounded-xl border border-border">
              <img src={fotoUrl} alt="Odômetro" className="w-16 h-12 object-cover rounded-lg border border-border" />
              <div className="flex-1">
                <p className="text-xs text-foreground font-semibold">Foto capturada</p>
                <p className="text-[10px] text-muted-foreground">Leitura visível para auditoria</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFotoUrl(
                    fotoUrl === SAMPLE_ODOMETER_PHOTOS[0]
                      ? SAMPLE_ODOMETER_PHOTOS[1]
                      : SAMPLE_ODOMETER_PHOTOS[0]
                  )
                }
                className="px-2.5 py-1.5 bg-card hover:bg-muted text-xs font-semibold text-foreground border border-border rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Trocar</span>
              </button>
            </div>
          </div>

          {/* Expenses / Pedágio / Frete (if Volta or Chegada) */}
          {type !== 'IDA_INICIO' && (
            <div className="pt-2 border-t border-border">
              <span className="block text-xs font-semibold text-foreground mb-2">Despesas de Viagem / Custos (R$)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Valor Pedágio</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      value={pedagio}
                      onChange={(e) => setPedagio(Number(e.target.value))}
                      className="w-full bg-secondary border border-border rounded-lg py-2 pl-8 pr-2 text-xs text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Valor Frete / Devolução</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">R$</span>
                    <input
                      type="number"
                      step="1.00"
                      value={frete}
                      onChange={(e) => setFrete(Number(e.target.value))}
                      className="w-full bg-secondary border border-border rounded-lg py-2 pl-8 pr-2 text-xs text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary hover:bg-muted cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent/90 shadow-md shadow-accent/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Registros</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
