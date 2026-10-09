import React, { useState } from 'react';
import { ServicoEquipamento, FotoServico, MaterialUtilizado, DefeitoRelatado } from '../types';
import { Cpu, Plus, Trash2, Camera, Check, X, Wrench, PackagePlus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  equipamentoExistente?: ServicoEquipamento | null;
  onClose: () => void;
  onSave: (equipamento: ServicoEquipamento) => void;
}

const SAMPLE_DEFECT_PHOTOS = [
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
];

export const ModalEquipamentoDefeito: React.FC<Props> = ({
  isOpen,
  equipamentoExistente,
  onClose,
  onSave,
}) => {
  const [nome, setNome] = useState(equipamentoExistente?.nome_equipamento || '');
  const [modelo, setModelo] = useState(equipamentoExistente?.modelo || '');
  const [numeroSerie, setNumeroSerie] = useState(equipamentoExistente?.numero_serie || '');
  const [statusServico, setStatusServico] = useState<ServicoEquipamento['status_servico']>(
    equipamentoExistente?.status_servico || 'Sanado'
  );

  const [defeitos, setDefeitos] = useState<DefeitoRelatado[]>(
    equipamentoExistente?.defeitos || [
      { id_defeito: 'd_1', descricao: 'Ruído excessivo no ventilador do condensador', solucionado: true },
    ]
  );

  const [novoDefeitoDesc, setNovoDefeitoDesc] = useState('');

  const [fotos, setFotos] = useState<FotoServico[]>(equipamentoExistente?.fotos || []);
  const [materiais, setMateriais] = useState<MaterialUtilizado[]>(equipamentoExistente?.materiais || []);

  const [novoMatDesc, setNovoMatDesc] = useState('');
  const [novoMatQtd, setNovoMatQtd] = useState(1);
  const [novoMatUn, setNovoMatUn] = useState('UN');
  const [novoMatPreco, setNovoMatPreco] = useState(0);

  const [observacoes, setObservacoes] = useState(equipamentoExistente?.observacoes_tecnicas || '');

  if (!isOpen) return null;

  const handleAddDefeito = () => {
    if (!novoDefeitoDesc.trim()) return;
    setDefeitos([
      ...defeitos,
      { id_defeito: 'd_' + Date.now(), descricao: novoDefeitoDesc.trim(), solucionado: true },
    ]);
    setNovoDefeitoDesc('');
  };

  const handleToggleDefeito = (id: string | number) => {
    setDefeitos(
      defeitos.map((d) => (d.id_defeito === id ? { ...d, solucionado: !d.solucionado } : d))
    );
  };

  const handleRemoveDefeito = (id: string | number) => {
    setDefeitos(defeitos.filter((d) => d.id_defeito !== id));
  };

  const handleAddFoto = (tipo: 'DEFEITO' | 'CONSERTO') => {
    const randomUrl = SAMPLE_DEFECT_PHOTOS[Math.floor(Math.random() * SAMPLE_DEFECT_PHOTOS.length)];
    const novaFoto: FotoServico = {
      id_foto: 'f_' + Date.now(),
      tipo,
      url: randomUrl,
      descricao: tipo === 'DEFEITO' ? 'Registro de anomalia encontrada' : 'Registro após reparo executado',
      data_hora: new Date().toLocaleString('pt-BR'),
    };
    setFotos([...fotos, novaFoto]);
  };

  const handleRemoveFoto = (id: string | number) => {
    setFotos(fotos.filter((f) => f.id_foto !== id));
  };

  const handleAddMaterial = () => {
    if (!novoMatDesc.trim()) return;
    setMateriais([
      ...materiais,
      {
        descricao: novoMatDesc.trim(),
        quantidade: Number(novoMatQtd),
        unidade: novoMatUn,
        valor_unitario: Number(novoMatPreco),
      },
    ]);
    setNovoMatDesc('');
    setNovoMatQtd(1);
    setNovoMatPreco(0);
  };

  const handleRemoveMaterial = (idx: number) => {
    setMateriais(materiais.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onSave({
      id_servico_equipamento: equipamentoExistente?.id_servico_equipamento || Date.now(),
      nome_equipamento: nome,
      modelo: modelo || 'N/A',
      numero_serie: numeroSerie || 'S/N',
      status_servico: statusServico,
      defeitos,
      fotos,
      materiais,
      observacoes_tecnicas: observacoes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-foreground font-sans">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {equipamentoExistente ? 'Editar Equipamento & Diagnóstico' : 'Novo Equipamento Atendido'}
            </h2>
            <p className="text-xs text-muted-foreground">Registre dados de fabricação, defeitos, peças e fotos do serviço</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Equipamento Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-foreground mb-1">Nome do Equipamento *</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Gôndola Refrigerada Laticínios 3M"
                className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Modelo</label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: FAST-COOL-3000"
                className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Nº de Série</label>
              <input
                type="text"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                placeholder="Ex: SN-2024-998"
                className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Status Final</label>
              <select
                value={statusServico}
                onChange={(e) => setStatusServico(e.target.value as any)}
                className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-accent focus:outline-none"
              >
                <option value="Sanado">Sanado (Resolvido)</option>
                <option value="Pendente">Pendente (Peças/Retorno)</option>
                <option value="Substituído">Substituído Novo</option>
                <option value="Retirado para Oficina">Retirado para Oficina</option>
              </select>
            </div>
          </div>

          {/* Defect Checklist */}
          <div className="border-t border-border pt-3">
            <label className="block text-xs font-semibold text-foreground mb-2">Defeitos / Falhas Relatadas</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={novoDefeitoDesc}
                onChange={(e) => setNovoDefeitoDesc(e.target.value)}
                placeholder="Descreva o defeito encontrado..."
                className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddDefeito}
                className="px-3 py-2 bg-secondary hover:bg-muted text-xs font-semibold text-accent rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            <div className="space-y-1.5">
              {defeitos.map((d) => (
                <div key={d.id_defeito} className="flex items-center justify-between bg-secondary/50 p-2.5 rounded-xl border border-border text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={d.solucionado}
                      onChange={() => handleToggleDefeito(d.id_defeito)}
                      className="rounded border-border text-accent focus:ring-0"
                    />
                    <span className={d.solucionado ? 'text-muted-foreground line-through opacity-70' : 'text-foreground font-semibold'}>
                      {d.descricao}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDefeito(d.id_defeito)}
                    className="text-muted-foreground hover:text-destructive p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Photos (Defeito vs Conserto) */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground">Registro Fotográfico</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAddFoto('DEFEITO')}
                  className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 hover:bg-amber-500/20 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" /> Foto Defeito
                </button>
                <button
                  type="button"
                  onClick={() => handleAddFoto('CONSERTO')}
                  className="px-2.5 py-1 bg-success/10 border border-success/30 text-success hover:bg-success/20 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" /> Foto Conserto
                </button>
              </div>
            </div>

            {fotos.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic bg-secondary/50 p-3 rounded-xl border border-dashed border-border text-center">
                Nenhuma foto registrada para este equipamento ainda. Clique acima para simular foto de defeito ou reparo.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {fotos.map((f) => (
                  <div key={f.id_foto} className="relative group bg-secondary rounded-xl overflow-hidden border border-border">
                    <img src={f.url} alt="Serviço" className="w-full h-24 object-cover" />
                    <span
                      className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        f.tipo === 'DEFEITO' ? 'bg-amber-500 text-white' : 'bg-success text-white'
                      }`}
                    >
                      {f.tipo}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFoto(f.id_foto)}
                      className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Materials & Parts Used */}
          <div className="border-t border-border pt-3">
            <label className="block text-xs font-semibold text-foreground mb-2">Peças e Materiais Utilizados</label>
            <div className="grid grid-cols-12 gap-2 mb-2">
              <input
                type="text"
                placeholder="Descrição do material..."
                value={novoMatDesc}
                onChange={(e) => setNovoMatDesc(e.target.value)}
                className="col-span-6 bg-secondary border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
              />
              <input
                type="number"
                placeholder="Qtd"
                value={novoMatQtd}
                onChange={(e) => setNovoMatQtd(Number(e.target.value))}
                className="col-span-2 bg-secondary border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
              />
              <input
                type="number"
                placeholder="R$ Valor"
                value={novoMatPreco}
                onChange={(e) => setNovoMatPreco(Number(e.target.value))}
                className="col-span-2 bg-secondary border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddMaterial}
                className="col-span-2 bg-secondary hover:bg-muted text-accent rounded-xl flex items-center justify-center cursor-pointer border border-border"
              >
                <PackagePlus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {materiais.map((m, i) => (
                <div key={i} className="flex items-center justify-between bg-secondary/50 px-3 py-1.5 rounded-lg border border-border text-xs text-foreground">
                  <span>{m.quantidade}x {m.descricao}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-accent">R$ {((m.valor_unitario || 0) * m.quantidade).toFixed(2)}</span>
                    <button type="button" onClick={() => handleRemoveMaterial(i)} className="text-muted-foreground hover:text-destructive cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Notes */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Parecer Técnico do Equipamento</label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva detalhes das medições de corrente, pressão, ajustes e orientações ao cliente..."
              className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-accent focus:outline-none"
            />
          </div>

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
              <span>Salvar Registro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
