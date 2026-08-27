import React, { useState, useEffect } from 'react';
import { Cliente, ContatoCliente } from '../types';
import { X, Building, MapPin, Phone, User, Plus, Trash2, Mail, Briefcase } from 'lucide-react';

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
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [contatoResponsavel, setContatoResponsavel] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('SP');
  const [cep, setCep] = useState('');
  const [contatos, setContatos] = useState<ContatoCliente[]>([]);

  useEffect(() => {
    if (clienteEdicao) {
      setNomeFantasia(clienteEdicao.nome_fantasia || '');
      setRazaoSocial(clienteEdicao.razao_social || '');
      setCnpjCpf(clienteEdicao.cnpj_cpf || '');
      setTelefone(clienteEdicao.telefone || '');
      setContatoResponsavel(clienteEdicao.contato_responsavel || '');
      setEndereco(clienteEdicao.endereco || '');
      setNumero(clienteEdicao.numero || '');
      setBairro(clienteEdicao.bairro || '');
      setCidade(clienteEdicao.cidade || '');
      setUf(clienteEdicao.uf || 'SP');
      setCep(clienteEdicao.cep || '');
      setContatos(clienteEdicao.contatos ? [...clienteEdicao.contatos] : []);
    } else {
      setNomeFantasia('');
      setRazaoSocial('');
      setCnpjCpf('');
      setTelefone('');
      setContatoResponsavel('');
      setEndereco('');
      setNumero('');
      setBairro('');
      setCidade('São Paulo');
      setUf('SP');
      setCep('');
      setContatos([]);
    }
  }, [clienteEdicao, isOpen]);

  if (!isOpen) return null;

  const handleAddContato = () => {
    setContatos([
      ...contatos,
      {
        id_contato: Date.now(),
        nome: '',
        cargo: '',
        telefone: '',
        email: '',
      },
    ]);
  };

  const handleUpdateContato = (index: number, field: keyof ContatoCliente, value: string) => {
    const updated = [...contatos];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setContatos(updated);
  };

  const handleRemoveContato = (index: number) => {
    setContatos(contatos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFantasia.trim()) {
      alert('Por favor, informe o Nome Fantasia do cliente.');
      return;
    }

    onSave({
      id_cliente: clienteEdicao?.id_cliente,
      nome_fantasia: nomeFantasia,
      razao_social: razaoSocial || nomeFantasia,
      cnpj_cpf: cnpjCpf,
      telefone,
      contato_responsavel: contatoResponsavel,
      endereco,
      numero,
      bairro,
      cidade,
      uf,
      cep,
      contatos: contatos.filter((c) => c.nome.trim() !== ''),
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
                {clienteEdicao ? `Editar Cliente: ${clienteEdicao.nome_fantasia}` : 'Cadastrar Novo Cliente'}
              </h2>
              <p className="text-xs text-muted-foreground">Insira os dados cadastrais, múltiplos contatos e endereço do cliente</p>
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
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1">Nome Fantasia / Empresa *</label>
              <input
                type="text"
                required
                placeholder="Ex: Supermercado Alvorada - Loja 02"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Razão Social</label>
              <input
                type="text"
                placeholder="Ex: Alvorada Comercio de Alimentos Ltda"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1">CNPJ / CPF</label>
              <input
                type="text"
                placeholder="Ex: 12.345.678/0002-99"
                value={cnpjCpf}
                onChange={(e) => setCnpjCpf(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-primary" /> Telefone Geral
              </label>
              <input
                type="text"
                placeholder="Ex: (11) 3456-7890"
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
                placeholder="Ex: Sr. Roberto Mendes"
                value={contatoResponsavel}
                onChange={(e) => setContatoResponsavel(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Múltiplos Contatos Dinâmicos */}
          <div className="bg-secondary/50 p-4 rounded-2xl border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" /> Contatos & Responsáveis Adicionais
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Cadastre gerentes, encarregados de manutenção ou técnicos no cliente
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddContato}
                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Contato
              </button>
            </div>

            {contatos.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-2 italic text-center">
                Nenhum contato adicional adicionado. Clique no botão acima para incluir.
              </p>
            ) : (
              <div className="space-y-2.5">
                {contatos.map((cont, index) => (
                  <div
                    key={index}
                    className="p-3 bg-card rounded-xl border border-border grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end relative"
                  >
                    <div>
                      <label className="block text-[10px] text-muted-foreground mb-1">Nome</label>
                      <input
                        type="text"
                        placeholder="Ex: João Silva"
                        value={cont.nome}
                        onChange={(e) => handleUpdateContato(index, 'nome', e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg p-2 text-foreground focus:border-primary focus:outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-muted-foreground mb-1">Cargo / Depto</label>
                      <input
                        type="text"
                        placeholder="Ex: Gerente de Loja"
                        value={cont.cargo || ''}
                        onChange={(e) => handleUpdateContato(index, 'cargo', e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg p-2 text-foreground focus:border-primary focus:outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-muted-foreground mb-1">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        placeholder="Ex: (11) 98765-4321"
                        value={cont.telefone || ''}
                        onChange={(e) => handleUpdateContato(index, 'telefone', e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg p-2 text-foreground focus:border-primary focus:outline-none text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] text-muted-foreground mb-1">E-mail</label>
                        <input
                          type="email"
                          placeholder="joao@empresa.com"
                          value={cont.email || ''}
                          onChange={(e) => handleUpdateContato(index, 'email', e.target.value)}
                          className="w-full bg-secondary border border-border rounded-lg p-2 text-foreground focus:border-primary focus:outline-none text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveContato(index)}
                        className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg border border-destructive/30 transition-colors cursor-pointer mt-4"
                        title="Remover Contato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Endereço */}
          <div className="bg-secondary/50 p-4 rounded-2xl border border-border space-y-3">
            <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" /> Endereço Completo de Atendimento
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-muted-foreground mb-1">Logradouro / Avenida</label>
                <input
                  type="text"
                  placeholder="Ex: Av. Paulista"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Número</label>
                <input
                  type="text"
                  placeholder="Ex: 1578"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Bairro</label>
                <input
                  type="text"
                  placeholder="Ex: Bela Vista"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Cidade</label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">UF</label>
                <input
                  type="text"
                  placeholder="Ex: SP"
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">CEP</label>
                <input
                  type="text"
                  placeholder="Ex: 01310-200"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
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

