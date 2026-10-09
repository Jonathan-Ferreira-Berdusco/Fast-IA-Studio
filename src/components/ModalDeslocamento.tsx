import React, { useState } from 'react';
import { Navigation, Camera, X, Check, Upload, Image as ImageIcon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  type: 'IDA_INICIO' | 'IDA_CHEGADA' | 'VOLTA_REGISTRO';
  initialKm?: number;
  onClose: () => void;
  onConfirm: (data: {
    km: number;
    kmFimVolta?: number;
    fotoFile?: File;
    comprovanteFile?: File;
    comprovanteTipo?: 'pedagio' | 'frete';
    comprovanteValor?: number;
  }) => void;
}

export const ModalDeslocamento: React.FC<Props> = ({
  isOpen,
  type,
  initialKm = 0,
  onClose,
  onConfirm,
}) => {
  const [km, setKm] = useState<number>(initialKm);
  const [kmVolta, setKmVolta] = useState<number>(initialKm);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const [pedagio, setPedagio] = useState<number>(0);
  const [frete, setFrete] = useState<number>(0);
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [comprovantePreview, setComprovantePreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setKm(initialKm || 0);
      setKmVolta(initialKm || 0);
      setFotoFile(null);
      setFotoPreview(null);
      setPedagio(0);
      setFrete(0);
      setComprovanteFile(null);
      setComprovantePreview(null);
    }
  }, [isOpen, initialKm]);

  if (!isOpen) return null;

  const titles = {
    IDA_INICIO: 'Registro de Saída (Início Deslocamento Ida)',
    IDA_CHEGADA: 'Chegada ao Cliente (Fim Deslocamento Ida)',
    VOLTA_REGISTRO: 'Registro de Deslocamento de Volta (Retorno)',
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleComprovanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setComprovanteFile(file);
      setComprovantePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let comprovanteTipo: 'pedagio' | 'frete' | undefined = undefined;
    let comprovanteValor: number | undefined = undefined;
    if (pedagio > 0) {
      comprovanteTipo = 'pedagio';
      comprovanteValor = pedagio;
    } else if (frete > 0) {
      comprovanteTipo = 'frete';
      comprovanteValor = frete;
    }

    onConfirm({
      km,
      kmFimVolta: type === 'VOLTA_REGISTRO' ? kmVolta : undefined,
      fotoFile: fotoFile || undefined,
      comprovanteFile: comprovanteFile || undefined,
      comprovanteTipo,
      comprovanteValor,
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
            <p className="text-xs text-muted-foreground">Insira a quilometragem real e anexe a foto do painel</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {type !== 'VOLTA_REGISTRO' ? (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Quilometragem do Odômetro (KM) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  value={km === 0 ? '' : km}
                  onChange={(e) => setKm(Number(e.target.value))}
                  placeholder="Ex: 45220"
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
                  min={0}
                  value={km === 0 ? '' : km}
                  onChange={(e) => setKm(Number(e.target.value))}
                  placeholder="Ex: 45238"
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-base font-bold text-foreground focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">KM Chegada Base *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={kmVolta === 0 ? '' : kmVolta}
                  onChange={(e) => setKmVolta(Number(e.target.value))}
                  placeholder="Ex: 45255"
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-base font-bold text-accent focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Real Photo Attachment */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Foto do Painel / Odômetro (Comprovante Real)
            </label>
            <div className="flex items-center gap-3 bg-secondary/60 p-3 rounded-xl border border-border">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Odômetro" className="w-16 h-14 object-cover rounded-lg border border-border" />
              ) : (
                <div className="w-16 h-14 rounded-lg bg-card border border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground font-semibold truncate">
                  {fotoFile ? fotoFile.name : 'Nenhum arquivo selecionado'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {fotoFile ? `${(fotoFile.size / 1024).toFixed(0)} KB` : 'Tire uma foto ou selecione da galeria'}
                </p>
              </div>
              <label className="px-3 py-1.5 bg-card hover:bg-muted text-xs font-semibold text-foreground border border-border rounded-lg flex items-center gap-1 cursor-pointer">
                <Camera className="w-3.5 h-3.5 text-accent" />
                <span>{fotoFile ? 'Alterar' : 'Anexar'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFotoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Despesas de viagem (pedagio / frete) */}
          {type !== 'IDA_INICIO' && (
            <div className="pt-2 border-t border-border space-y-3">
              <span className="block text-xs font-semibold text-foreground">Despesas / Reembolsos de Viagem</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Valor Pedágio (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={pedagio === 0 ? '' : pedagio}
                    onChange={(e) => setPedagio(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-secondary border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Valor Frete / Devolução (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={frete === 0 ? '' : frete}
                    onChange={(e) => setFrete(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-secondary border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              {(pedagio > 0 || frete > 0) && (
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">
                    Comprovante de Pedágio / Frete (Foto ou Cupom)
                  </label>
                  <div className="flex items-center gap-2 bg-secondary/50 p-2.5 rounded-xl border border-border">
                    {comprovantePreview && (
                      <img src={comprovantePreview} alt="Comprovante" className="w-10 h-10 object-cover rounded border" />
                    )}
                    <span className="text-[11px] text-muted-foreground flex-1 truncate">
                      {comprovanteFile ? comprovanteFile.name : 'Anexar cupom fiscal / comprovante'}
                    </span>
                    <label className="px-2.5 py-1 bg-card hover:bg-muted text-xs rounded-lg border border-border cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3 text-accent" />
                      <span>{comprovanteFile ? 'Trocar' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleComprovanteChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
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
              <span>Confirmar Registro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
