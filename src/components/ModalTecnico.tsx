import React, { useState, useEffect } from 'react';
import { Tecnico, UserRole } from '../types';
import { X, Wrench, Mail, Phone, CreditCard, Shield, Lock, FileText } from 'lucide-react';

interface Props {
  isOpen: boolean;
  tecnicoEdicao?: Tecnico | null;
  onClose: () => void;
  onSave: (data: any) => void;
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
  const [cnpj, setCnpj] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [telefone, setTelefone] = useState('');
  const [role, setRole] = useState<UserRole>('tecnico');
  const [password, setPassword] = useState('');
  const [banco, setBanco] = useState('');
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [pix, setPix] = useState('');

  useEffect(() => {
    if (tecnicoEdicao) {
      setNome(tecnicoEdicao.nome || '');
      setEmail(tecnicoEdicao.email || '');
      setCpf(tecnicoEdicao.cpf || '');
      setCnpj(tecnicoEdicao.cnpj || '');
      setInscricaoEstadual(tecnicoEdicao.inscricao_estadual || '');
      setTelefone(tecnicoEdicao.telefone || '');
      setRole((tecnicoEdicao.role as UserRole) || 'tecnico');
      setPassword('');
      setBanco(tecnicoEdicao.dados_bancarios?.banco || tecnicoEdicao.banco || '');
      setAgencia(tecnicoEdicao.dados_bancarios?.agencia || tecnicoEdicao.agencia || '');
      setConta(tecnicoEdicao.dados_bancarios?.conta || tecnicoEdicao.conta || '');
      setPix(tecnicoEdicao.dados_bancarios?.pix || tecnicoEdicao.pix || '');
    } else {
      setNome('');
      setEmail('');
      setCpf('');
      setCnpj('');
      setInscricaoEstadual('');
      setTelefone('');
      setRole('tecnico');
      setPassword('');
      setBanco('Banco do Brasil');
      setAgencia('0001');
      setConta('12345-6');
      setPix('');
    }
  }, [tecnicoEdicao, isOpen]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !cpf.trim() || !telefone.trim()) {
      setErrorMsg('Por favor, preencha os campos obrigatórios (Nome, E-mail, CPF e Telefone).');
      return;
    }
    if (!tecnicoEdicao && !password.trim()) {
      setErrorMsg('Por favor, defina uma senha inicial de acesso para o novo técnico.');
      return;
    }
    setErrorMsg(null);

    const payload: any = {
      id_tecnico: tecnicoEdicao?.id_tecnico,
      nome: nome.trim(),
      email: email.trim(),
      cpf: cpf.trim(),
      cnpj: cnpj.trim() || undefined,
      inscricao_estadual: inscricaoEstadual.trim() || undefined,
      telefone: telefone.trim(),
      role,
      banco: banco.trim() || 'Banco do Brasil',
      agencia: agencia.trim() || '0001',
      conta: conta.trim() || '12345-6',
      pix: pix.trim() || email.trim(),
      dados_bancarios: {
        banco: banco.trim() || 'Banco do Brasil',
        agencia: agencia.trim() || '0001',
        conta: conta.trim() || '12345-6',
        pix: pix.trim() || email.trim(),
      },
    };

    if (!tecnicoEdicao) {
      payload.password = password;
    }

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl relative my-8 text-foreground max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-2xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground font-['Space_Grotesk']">
                {tecnicoEdicao ? `Editar Técnico: ${tecnicoEdicao.nome}` : 'Cadastrar Novo Técnico'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Dados profissionais, fiscais, credenciais e dados bancários conforme o backend
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label className="block font-semibold text-foreground mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-primary" /> E-mail (Username para Login) *
              </label>
              <input
                type="email"
                required
                placeholder="Ex: carlos.silva@fastariam.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1">CPF *</label>
              <input
                type="text"
                required
                maxLength={14}
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">CNPJ (Opcional)</label>
              <input
                type="text"
                maxLength={18}
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-primary" /> Telefone *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 11987654321"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-primary" /> Inscrição Estadual
              </label>
              <input
                type="text"
                placeholder="Ex: 001.122.334.455"
                value={inscricaoEstadual}
                onChange={(e) => setInscricaoEstadual(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-primary" /> Papel / Perfil *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="tecnico">Técnico de Campo</option>
                <option value="admin">Administrador Mestre</option>
              </select>
            </div>

            {!tecnicoEdicao && (
              <div>
                <label className="block font-semibold text-foreground mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-primary" /> Senha Inicial *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Dados Bancários */}
          <div className="bg-secondary/50 p-4 rounded-2xl border border-border space-y-3">
            <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-primary" /> Dados Bancários da Conta Jurídica (Reembolso / Honorários)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Banco</label>
                <input
                  type="text"
                  placeholder="Ex: Santander"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Agência</label>
                <input
                  type="text"
                  placeholder="Ex: 0011-2"
                  value={agencia}
                  onChange={(e) => setAgencia(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Conta Corrente</label>
                <input
                  type="text"
                  placeholder="Ex: 99887-3"
                  value={conta}
                  onChange={(e) => setConta(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Chave PIX</label>
                <input
                  type="text"
                  placeholder="CNPJ ou e-mail"
                  value={pix}
                  onChange={(e) => setPix(e.target.value)}
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
              {tecnicoEdicao ? 'Salvar Alterações' : 'Cadastrar Técnico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
