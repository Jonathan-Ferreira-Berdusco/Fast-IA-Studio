import React, { useState, useEffect } from 'react';
import { Tecnico } from '../types';
import { X, Wrench, Mail, Phone, Image } from 'lucide-react';

interface Props {
  isOpen: boolean;
  tecnicoEdicao?: Tecnico | null;
  onClose: () => void;
  onSave: (data: Partial<Tecnico>) => void;
}

export const ModalTecnico: React.FC<Props> = ({
  isOpen,
  tecnicoEdicao,
  onClose,
  onSave,
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (tecnicoEdicao) {
      setNome(tecnicoEdicao.nome || '');
      setEmail(tecnicoEdicao.email || '');
      setCpf(tecnicoEdicao.cpf || '');
      setTelefone(tecnicoEdicao.telefone || '');
      setAvatarUrl(tecnicoEdicao.avatar_url || '');
    } else {
      setNome('');
      setEmail('');
      setCpf('');
      setTelefone('');
      setAvatarUrl(`https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`);
    }
  }, [tecnicoEdicao, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('Por favor, informe o Nome Completo do técnico.');
      return;
    }

    onSave({
      id_tecnico: tecnicoEdicao?.id_tecnico,
      nome,
      email,
      cpf,
      telefone,
      avatar_url: avatarUrl,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl relative my-8 text-foreground">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-2xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground font-['Space_Grotesk']">
                {tecnicoEdicao ? `Editar Técnico: ${tecnicoEdicao.nome}` : 'Cadastrar Novo Técnico'}
              </h2>
              <p className="text-xs text-muted-foreground">Insira os dados profissionais do integrante da equipe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              placeholder="Ex: Carlos Eduardo Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-primary" /> E-mail Corporativo
              </label>
              <input
                type="email"
                placeholder="Ex: carlos.silva@fastgondolas.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-primary" /> Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="Ex: (11) 98765-4321"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">CPF</label>
            <input
              type="text"
              placeholder="Ex: 123.456.789-00"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1 flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-primary" /> URL Foto de Perfil / Avatar
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
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
              {tecnicoEdicao ? 'Salvar Técnico' : 'Cadastrar Técnico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

