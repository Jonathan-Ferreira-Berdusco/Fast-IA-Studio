import React, { useState } from 'react';
import { ServicoEquipamento, MaterialUtilizado } from '../types';
import { Cpu, Plus, Trash2, Camera, Check, X, PackagePlus, Upload } from 'lucide-react';

interface Props {
  isOpen: boolean;
  equipamentoExistente?: ServicoEquipamento | null;
  onClose: () => void;
  onSave: (
    equipamento: ServicoEquipamento,
    novasFotos?: { tipo: 'defeito' | 'conserto'; file: File }[]
  ) => void;
}

const DEFEITOS_PRINCIPAIS_OPCOES = ['Refrigeração', 'Iluminação', 'Estrutura', 'Outros'];

const SUB_DEFEITOS_REFRIGERACAO = ['Compressor', 'Vazamento', 'Outros (Refrigeração)'];
const SUB_DEFEITOS_COMPRESSOR = [
  'Queimado',
  'Em Massa',
  'Em Curto',
  'Corrente Alta',
  'Não Parte',
  'Sem Compressão',
  'Travado',
  'Com Barulho',
  'Não Succiona',
  'Desarmado',
];
const SUB_DEFEITOS_VAZAMENTO = ['Nº Ponto', 'Não Localizado'];
const SUB_DEFEITOS_OUTROS = [
  'Filtro Entupido',
  'Capilar Obstruído',
  'Micromotor Queimado',
  'Micromotor Travado',
  'Controlador Queimado',
  'Regulagem Parâmetros',
];
const SUB_DEFEITOS_ILUMINACAO = ['Lâmpada Queimada', 'Sem Alimentação', 'Em Curto'];
const SUB_DEFEITOS_ESTRUTURA = [
  '01 - Perfil Curvo Vidro',
  '02 - Perfil Suporte Iluminação',
  '03 - Lente Calha Iluminação',
  '04 - Perfil Vedação',
  '05 - Perfil Porta Etiqueta',
  '06 - Puxador',
  '07 - Porta Parachoque',
  '08 - Canto 90°',
  '09 - Acrílico Carel',
  '10 - Perfil Frontal',
  '11 - Parachoque Frontal',
  '12 - Parachoque Lateral',
];

export const ModalEquipamentoDefeito: React.FC<Props> = ({
  isOpen,
  equipamentoExistente,
  onClose,
  onSave,
}) => {
  const [nome, setNome] = useState(equipamentoExistente?.nome_equipamento || '');
  const [numeroSerie, setNumeroSerie] = useState(
    equipamentoExistente?.numero_serie_atendido || equipamentoExistente?.numero_serie || ''
  );
  const [defeitosPrincipais, setDefeitosPrincipais] = useState<string[]>(
    equipamentoExistente?.defeitos_principais || ['Refrigeração']
  );
  const [defeitoOutrosDesc, setDefeitoOutrosDesc] = useState(
    equipamentoExistente?.defeito_outros_descricao || ''
  );

  // Sub-defeitos
  const [subRef, setSubRef] = useState<string[]>(equipamentoExistente?.sub_defeitos_refrigeracao || []);
  const [subComp, setSubComp] = useState<string[]>(equipamentoExistente?.sub_defeitos_compressor || []);
  const [subVaz, setSubVaz] = useState<string[]>(equipamentoExistente?.sub_defeitos_vazamento || []);
  const [vazDesc, setVazDesc] = useState(equipamentoExistente?.vazamento_ponto_descricao || '');
  const [subOutros, setSubOutros] = useState<string[]>(equipamentoExistente?.sub_defeitos_outros || []);
  const [subIlum, setSubIlum] = useState<string[]>(equipamentoExistente?.sub_defeitos_iluminacao || []);
  const [subEstrut, setSubEstrut] = useState<string[]>(equipamentoExistente?.sub_defeitos_estrutura || []);

  // Materiais
  const [materiais, setMateriais] = useState<MaterialUtilizado[]>(
    equipamentoExistente?.materiais_utilizados || equipamentoExistente?.materiais || []
  );
  const [novoMatNome, setNovoMatNome] = useState('');
  const [novoMatQtd, setNovoMatQtd] = useState(1);
  const [novoMatValor, setNovoMatValor] = useState(0);

  // Fotos
  const [novasFotos, setNovasFotos] = useState<{ tipo: 'defeito' | 'conserto'; file: File; preview: string }[]>([]);

  if (!isOpen) return null;

  const toggleArrayItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleFotoUpload = (tipo: 'defeito' | 'conserto', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNovasFotos([
        ...novasFotos,
        { tipo, file, preview: URL.createObjectURL(file) },
      ]);
    }
  };

  const handleRemoveFoto = (index: number) => {
    setNovasFotos(novasFotos.filter((_, i) => i !== index));
  };

  const handleAddMaterial = () => {
    if (!novoMatNome.trim()) return;
    setMateriais([
      ...materiais,
      {
        nome: novoMatNome.trim(),
        descricao: novoMatNome.trim(),
        quantidade: Number(novoMatQtd) || 1,
        valor: Number(novoMatValor) || 0,
        valor_unitario: Number(novoMatValor) || 0,
      },
    ]);
    setNovoMatNome('');
    setNovoMatQtd(1);
    setNovoMatValor(0);
  };

  const handleRemoveMaterial = (idx: number) => {
    setMateriais(materiais.filter((_, i) => i !== idx));
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !numeroSerie.trim()) {
      setErrorMsg('Por favor, informe o Nome do Equipamento e o Número de Série.');
      return;
    }
    setErrorMsg(null);

    const payload: ServicoEquipamento = {
      id_servico: equipamentoExistente?.id_servico,
      id_servico_equipamento: equipamentoExistente?.id_servico_equipamento,
      nome_equipamento: nome.trim(),
      numero_serie_atendido: numeroSerie.trim(),
      numero_serie: numeroSerie.trim(),
      defeitos_principais: defeitosPrincipais,
      defeito_outros_descricao: defeitoOutrosDesc.trim() || undefined,
      sub_defeitos_refrigeracao: subRef,
      sub_defeitos_compressor: subComp,
      sub_defeitos_vazamento: subVaz,
      vazamento_ponto_descricao: vazDesc.trim() || undefined,
      sub_defeitos_outros: subOutros,
      sub_defeitos_iluminacao: subIlum,
      sub_defeitos_estrutura: subEstrut,
      materiais_utilizados: materiais,
      materiais,
      status_servico: 'Pendente',
    };

    onSave(
      payload,
      novasFotos.map((f) => ({ tipo: f.tipo, file: f.file }))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in overflow-y-auto font-sans">
      <div className="bg-card border border-border w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-foreground">
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
              {equipamentoExistente ? 'Editar Equipamento & Defeitos' : 'Novo Equipamento Atendido'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Cadastre o equipamento, defeitos categorizados, fotos e peças conforme o backend
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Identificação Básica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nome do Equipamento *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Gôndola Refrigerada Laticínios"
                className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Número de Série *
              </label>
              <input
                type="text"
                required
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                placeholder="Ex: SN-FREEZER-2025"
                className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Categorias Principais de Defeito */}
          <div className="border-t border-border pt-3">
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Categorias Principais de Defeito *
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFEITOS_PRINCIPAIS_OPCOES.map((opcao) => {
                const ativo = defeitosPrincipais.includes(opcao);
                return (
                  <button
                    key={opcao}
                    type="button"
                    onClick={() => toggleArrayItem(defeitosPrincipais, opcao, setDefeitosPrincipais)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      ativo
                        ? 'bg-accent text-white border-accent'
                        : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {opcao}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-defeitos: Refrigeração */}
          {defeitosPrincipais.includes('Refrigeração') && (
            <div className="p-3 bg-secondary/40 rounded-xl border border-border space-y-2">
              <span className="font-bold text-accent text-xs block">Sub-defeitos de Refrigeração:</span>
              <div className="flex flex-wrap gap-1.5">
                {SUB_DEFEITOS_REFRIGERACAO.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleArrayItem(subRef, sub, setSubRef)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer ${
                      subRef.includes(sub)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-card text-muted-foreground border-border'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {subRef.includes('Compressor') && (
                <div className="pt-2">
                  <span className="font-semibold text-muted-foreground text-[10px] block mb-1">
                    Defeitos do Compressor:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {SUB_DEFEITOS_COMPRESSOR.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleArrayItem(subComp, item, setSubComp)}
                        className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                          subComp.includes(item)
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-card text-muted-foreground border-border'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {subRef.includes('Vazamento') && (
                <div className="pt-2 space-y-1">
                  <span className="font-semibold text-muted-foreground text-[10px] block">
                    Defeitos de Vazamento:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {SUB_DEFEITOS_VAZAMENTO.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleArrayItem(subVaz, item, setSubVaz)}
                        className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                          subVaz.includes(item)
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-card text-muted-foreground border-border'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Descrição do ponto de vazamento..."
                    value={vazDesc}
                    onChange={(e) => setVazDesc(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg p-2 text-xs text-foreground focus:border-accent focus:outline-none mt-1"
                  />
                </div>
              )}
            </div>
          )}

          {/* Sub-defeitos: Iluminação */}
          {defeitosPrincipais.includes('Iluminação') && (
            <div className="p-3 bg-secondary/40 rounded-xl border border-border space-y-2">
              <span className="font-bold text-accent text-xs block">Defeitos de Iluminação:</span>
              <div className="flex flex-wrap gap-1.5">
                {SUB_DEFEITOS_ILUMINACAO.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleArrayItem(subIlum, sub, setSubIlum)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer ${
                      subIlum.includes(sub)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-card text-muted-foreground border-border'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sub-defeitos: Estrutura */}
          {defeitosPrincipais.includes('Estrutura') && (
            <div className="p-3 bg-secondary/40 rounded-xl border border-border space-y-2">
              <span className="font-bold text-accent text-xs block">Defeitos de Estrutura:</span>
              <div className="flex flex-wrap gap-1.5">
                {SUB_DEFEITOS_ESTRUTURA.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleArrayItem(subEstrut, sub, setSubEstrut)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer ${
                      subEstrut.includes(sub)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-card text-muted-foreground border-border'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Outros Defeitos Descrição */}
          {defeitosPrincipais.includes('Outros') && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Descrição de Outros Defeitos
              </label>
              <textarea
                rows={2}
                value={defeitoOutrosDesc}
                onChange={(e) => setDefeitoOutrosDesc(e.target.value)}
                placeholder="Detalhes adicionais de anomalias encontradas..."
                className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          )}

          {/* Registro Fotográfico Real */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground">Fotos (Upload Real)</label>
              <div className="flex gap-2">
                <label className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 hover:bg-amber-500/20 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <span>+ Foto Defeito</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFotoUpload('defeito', e)}
                    className="hidden"
                  />
                </label>
                <label className="px-2.5 py-1 bg-success/10 border border-success/30 text-success hover:bg-success/20 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <span>+ Foto Conserto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFotoUpload('conserto', e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {novasFotos.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic bg-secondary/50 p-2.5 rounded-xl border border-dashed border-border text-center">
                Nenhuma nova foto anexada. Use os botões acima para selecionar imagens reais (mín. 720p).
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {novasFotos.map((f, i) => (
                  <div key={i} className="relative group bg-secondary rounded-xl overflow-hidden border border-border">
                    <img src={f.preview} alt={f.tipo} className="w-full h-20 object-cover" />
                    <span
                      className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        f.tipo === 'defeito' ? 'bg-amber-500 text-white' : 'bg-success text-white'
                      }`}
                    >
                      {f.tipo.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFoto(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Peças e Materiais Utilizados */}
          <div className="border-t border-border pt-3">
            <label className="block text-xs font-semibold text-foreground mb-2">Peças e Materiais Utilizados</label>
            <div className="grid grid-cols-12 gap-2 mb-2">
              <input
                type="text"
                placeholder="Nome da peça..."
                value={novoMatNome}
                onChange={(e) => setNovoMatNome(e.target.value)}
                className="col-span-6 bg-secondary border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
              />
              <input
                type="number"
                min={1}
                placeholder="Qtd"
                value={novoMatQtd}
                onChange={(e) => setNovoMatQtd(Number(e.target.value))}
                className="col-span-2 bg-secondary border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
              />
              <input
                type="number"
                step="0.01"
                min={0}
                placeholder="Valor R$"
                value={novoMatValor === 0 ? '' : novoMatValor}
                onChange={(e) => setNovoMatValor(Number(e.target.value))}
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
                  <span>{m.quantidade}x {m.nome || m.descricao}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-accent">
                      R$ {(((m.valor || m.valor_unitario || 0) * m.quantidade)).toFixed(2)}
                    </span>
                    <button type="button" onClick={() => handleRemoveMaterial(i)} className="text-muted-foreground hover:text-destructive cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
