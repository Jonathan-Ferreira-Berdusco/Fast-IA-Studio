import React, { useState, useEffect } from 'react';
import { Cliente } from '../types';
import { X, Building, MapPin, Phone, User, Hash } from 'lucide-react';

interface Props {
  isOpen: boolean;
  clienteEdicao?: Cliente | null;
  onClose: () => void;
  onSave: (data: Partial<Cliente>) => void;
}

export const ModalCliente: React.FC<Props> = ({
  isOpen,
  clienteEdicao,
  onClose,
  onSave,
}) => {
  const [razaoSocial, setRazaoSocial] = useState('');
  const [codigo, setCodigo] = useState<number | ''>('');
  const [contatoNome, setContatoNome] = useState('');
  const [contatoTelefone, setContatoTelefone] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('SP');
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setErrorMsg(null);
    if (clienteEdicao) {
      setRazaoSocial(clienteEdicao.razao_social || clienteEdicao.nome_fantasia || '');
      setCodigo(clienteEdicao.codigo ?? '');
      setContatoNome(clienteEdicao.contato_principal_nome || clienteEdicao.contato_responsavel || '');
      setContatoTelefone(clienteEdicao.contato_principal_telefone || '');
      setTelefone(clienteEdicao.telefone || '');
      setEndereco(clienteEdicao.endereco || '');
      setNumero(clienteEdicao.numero || '');
      setBairro(clienteEdicao.bairro || '');
      setCidade(clienteEdicao.cidade || '');
      setUf(clienteEdicao.uf || 'SP');
      setIsActive(clienteEdicao.is_active !== false);
    } else {
      setRazaoSocial('');
      setCodigo('');
      setContatoNome('');
      setContatoTelefone('');
      setTelefone('');
      setEndereco('');
      setNumero('');
      setBairro('');
      setCidade('São Paulo');
      setUf('SP');
      setIsActive(true);
    }
  }, [clienteEdicao, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial.trim()) {
      setErrorMsg('Por favor, informe a Razão Social do cliente.');
      return;
    }
    if (!telefone.trim()) {
      setErrorMsg('Por favor, informe o Telefone do cliente.');
      return;
    }
    setErrorMsg(null);

    onSave({
      id_cliente: clienteEdicao?.id_cliente,
      razao_social: razaoSocial.trim(),
      codigo: codigo !== '' ? Number(codigo) : undefined,
      contato_principal_nome: contatoNome.trim() || undefined,
      contato_principal_telefone: contatoTelefone.trim() || undefined,
      telefone: telefone.trim(),
      endereco: endereco.trim(),
      numero: numero.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      uf: uf.trim().slice(0, 2).toUpperCase(),
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col text-foreground">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-2xl">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground font-['Space_Grotesk']">
                {clienteEdicao ? `Editar Cliente: ${clienteEdicao.razao_social}` : 'Cadastrar Novo Cliente'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Dados cadastrais e endereço do cliente conforme contrato do backend
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 font-semibold">
              {errorMsg}
            </div>
          )}
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-foreground mb-1">Razão Social / Nome da Empresa *</label>
              <input
                type="text"
                required
                placeholder="Ex: AUTO SERVIÇO JONAS LTDA"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-primary" /> Código Interno
              </label>
              <input
                type="number"
                placeholder="Ex: 55835"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-primary" /> Telefone Geral *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 1134567890"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-primary" /> Contato Principal
              </label>
              <input
                type="text"
                placeholder="Ex: Sylvia Rodrigues"
                value={contatoNome}
                onChange={(e) => setContatoNome(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-primary" /> Tel. do Contato
              </label>
              <input
                type="text"
                placeholder="Ex: 11987654321"
                value={contatoTelefone}
                onChange={(e) => setContatoTelefone(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-secondary/50 p-4 rounded-2xl border border-border space-y-3">
            <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" /> Endereço Completo de Atendimento
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-muted-foreground mb-1">Logradouro / Rua *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: PRACA JOAO APARECIDO"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Número *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 354"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Bairro *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CENTRO"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Cidade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: SERRA"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">UF (Estado) *</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  placeholder="Ex: ES"
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none font-bold uppercase"
                />
              </div>
            </div>
          </div>

          {/* Status de Atividade (Soft Delete) */}
          <div className="bg-secondary/40 border border-border rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-foreground block">Status de Atividade no Sistema</span>
              <span className="text-[11px] text-muted-foreground">
                {isActive
                  ? 'Cliente Ativo. Disponível para abertura e agendamento de novas OS.'
                  : 'Cliente Inativo (Soft Delete). Ficará oculto das buscas padrão de novas OS.'}
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded bg-secondary border-border accent-emerald-500 cursor-pointer"
              />
              <span className={`text-xs font-bold ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {isActive ? 'Ativo' : 'Inativo (Excluído)'}
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
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
              {clienteEdicao ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
