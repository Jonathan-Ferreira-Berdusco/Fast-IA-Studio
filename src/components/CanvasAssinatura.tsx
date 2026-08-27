import React, { useRef, useState, useEffect } from 'react';
import { AssinaturaCliente } from '../types';
import { PenTool, Eraser, Check, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  nomeClienteDefault?: string;
  onClose: () => void;
  onSave: (assinatura: AssinaturaCliente) => void;
}

export const CanvasAssinatura: React.FC<Props> = ({
  isOpen,
  nomeClienteDefault = '',
  onClose,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [nomeResponsavel, setNomeResponsavel] = useState(nomeClienteDefault);
  const [documento, setDocumento] = useState('');
  const [cargo, setCargo] = useState('Gerente / Responsável');

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#002B49'; // Navy ink
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSignature) {
      alert('Por favor, solicite ao cliente que assine no painel antes de confirmar.');
      return;
    }
    if (!nomeResponsavel.trim()) {
      alert('Por favor, informe o nome do responsável.');
      return;
    }

    const canvas = canvasRef.current;
    const dataDataUrl = canvas ? canvas.toDataURL('image/png') : '';

    onSave({
      assinatura_url: dataDataUrl,
      nome_responsavel: nomeResponsavel,
      documento: documento || 'Não informado',
      cargo_funcao: cargo,
      data_assinatura: new Date().toLocaleString('pt-BR'),
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
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Assinatura Digital do Cliente</h2>
            <p className="text-xs text-muted-foreground">Coleta de aceite do cliente sobre os serviços prestados</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Nome do Responsável *</label>
              <input
                type="text"
                required
                value={nomeResponsavel}
                onChange={(e) => setNomeResponsavel(e.target.value)}
                placeholder="Ex: Roberto Mendes"
                className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Documento (RG / CPF)</label>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ex: 28.910.455-8"
                className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Cargo / Função</label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex: Gerente da Loja"
              className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          {/* Canvas Signature Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-foreground">Rubrica / Assinatura do Cliente *</label>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-destructive hover:opacity-80 flex items-center gap-1 p-1 cursor-pointer font-medium"
              >
                <Eraser className="w-3.5 h-3.5" /> Limpar
              </button>
            </div>

            <div className="relative bg-white border-2 border-dashed border-border hover:border-accent rounded-2xl p-1 overflow-hidden touch-none shadow-inner">
              <canvas
                ref={canvasRef}
                width={440}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 bg-white rounded-xl cursor-crosshair"
              />
              {!hasSignature && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-muted-foreground font-medium">
                  Assine com o mouse ou o toque na tela aqui...
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
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
              <span>Salvar Assinatura</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

