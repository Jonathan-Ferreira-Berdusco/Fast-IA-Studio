import React from 'react';
import { OrdemServico } from '../types';
import { Printer, X } from 'lucide-react';

interface Props {
  chamado: OrdemServico;
  onClose: () => void;
}

export const RelatorioOS: React.FC<Props> = ({ chamado, onClose }) => {
  const c = chamado.cliente;
  const visita = chamado.visitas?.[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in overflow-y-auto font-sans">
      <div className="bg-card border border-border w-full max-w-3xl rounded-2xl p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-foreground print:text-black print:bg-white print:p-0 print:border-none">
        
        {/* Header toolbar (screen only) */}
        <div className="flex items-center justify-between pb-6 border-b border-border print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full uppercase">
              Relatório de Atendimento Técnico
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white font-bold text-xs rounded-xl shadow-md shadow-accent/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground bg-secondary hover:bg-muted rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div id="printable-area" className="space-y-6 pt-4">
          
          {/* Header OS Info */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                  ORDEM DE SERVIÇO #{chamado.codigo_os}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground mt-1">FAST Gôndolas & Check-outs — Soluções Técnicas & Refrigeração Comercial</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-semibold text-accent">Data Abertura: {chamado.data_abertura}</p>
              <p className="text-muted-foreground">Agendamento: {chamado.data_agendamento}</p>
              {chamado.data_conclusao && (
                <p className="font-bold text-success mt-1">Concluído em: {chamado.data_conclusao}</p>
              )}
            </div>
          </div>

          {/* Client & Technician Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-secondary/60 p-4 rounded-xl border border-border">
              <h3 className="font-bold text-accent mb-2 uppercase tracking-wide">Dados do Cliente</h3>
              <p className="font-bold text-sm text-foreground">{c.nome_fantasia}</p>
              <p className="text-muted-foreground">{c.razao_social}</p>
              <p className="text-muted-foreground">CNPJ: {c.cnpj_cpf}</p>
              <p className="text-muted-foreground mt-1">Contato: {c.contato_responsavel} ({c.telefone})</p>
              <p className="text-muted-foreground mt-1">{c.endereco}, {c.numero} - {c.bairro}, {c.cidade}/{c.uf}</p>
            </div>

            <div className="bg-secondary/60 p-4 rounded-xl border border-border">
              <h3 className="font-bold text-accent mb-2 uppercase tracking-wide">Dados Técnicos & Visita</h3>
              <p className="font-bold text-sm text-foreground">Técnico: {chamado.tecnico?.nome || 'Carlos Silva'}</p>
              <p className="text-muted-foreground">Especialidade: {chamado.tecnico?.especialidade || 'Refrigeração Comercial'}</p>
              <p className="text-muted-foreground mt-2">Status OS: <strong className="text-success">{chamado.status}</strong></p>
              <p className="text-muted-foreground">Em Garantia: {chamado.em_garantia ? 'SIM' : 'NÃO (Serviço Faturado)'}</p>
              {visita?.km_total && (
                <p className="text-muted-foreground font-semibold mt-1">KM Total Percorrido: {visita.km_total} KM</p>
              )}
            </div>
          </div>

          {/* Services & Equipment Executed */}
          <div className="bg-secondary/60 p-4 rounded-xl border border-border text-xs">
            <h3 className="font-bold text-accent mb-3 uppercase tracking-wide">Equipamentos & Diagnósticos Registrados</h3>
            {visita?.servicos_realizados && visita.servicos_realizados.length > 0 ? (
              <div className="space-y-4">
                {visita.servicos_realizados.map((eq, idx) => (
                  <div key={idx} className="bg-card p-3 rounded-lg border border-border">
                    <div className="flex justify-between items-center font-bold text-foreground text-sm mb-1">
                      <span>{eq.nome_equipamento}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-accent border border-border">
                        {eq.status_servico}
                      </span>
                    </div>
                    <p className="text-muted-foreground">Modelo: {eq.modelo} | S/N: {eq.numero_serie}</p>
                    
                    {/* Defects */}
                    {eq.defeitos.length > 0 && (
                      <div className="mt-2 text-foreground">
                        <span className="font-semibold text-muted-foreground">Defeitos Constatados:</span>
                        <ul className="list-disc list-inside mt-0.5 pl-1 space-y-0.5 text-foreground">
                          {eq.defeitos.map((d, di) => (
                            <li key={di}>
                              {d.descricao} {d.solucionado ? '(Sanado)' : '(Pendente)'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Materials */}
                    {eq.materiais.length > 0 && (
                      <div className="mt-2 text-foreground">
                        <span className="font-semibold text-muted-foreground">Peças Utilizadas:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {eq.materiais.map((m, mi) => (
                            <span key={mi} className="bg-secondary px-2 py-0.5 rounded border border-border text-foreground font-medium">
                              {m.quantidade}x {m.descricao}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">Nenhum equipamento registrado.</p>
            )}
          </div>

          {/* Service Description Summary */}
          {visita?.descricao_servico_executado && (
            <div className="bg-secondary/60 p-4 rounded-xl border border-border text-xs">
              <h3 className="font-bold text-accent mb-1 uppercase tracking-wide">Parecer Técnico Final</h3>
              <p className="text-foreground leading-relaxed whitespace-pre-line">{visita.descricao_servico_executado}</p>
            </div>
          )}

          {/* Signature Block */}
          <div className="border-t border-border pt-6 mt-6">
            <h3 className="font-bold text-xs text-accent uppercase tracking-wide mb-4">Aceite do Cliente & Assinatura</h3>
            {chamado.assinatura ? (
              <div className="flex flex-wrap items-center justify-between gap-6 bg-secondary/60 p-4 rounded-xl border border-border">
                <div className="text-xs">
                  <p className="font-bold text-foreground">{chamado.assinatura.nome_responsavel}</p>
                  <p className="text-muted-foreground">Documento: {chamado.assinatura.documento}</p>
                  <p className="text-muted-foreground">Cargo: {chamado.assinatura.cargo_funcao}</p>
                  <p className="text-muted-foreground mt-1">Assinado em: {chamado.assinatura.data_assinatura}</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-border shadow-xs">
                  <img
                    src={chamado.assinatura.assinatura_url}
                    alt="Assinatura"
                    className="h-16 object-contain"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic bg-secondary/60 p-3 rounded-xl border border-border">
                Pendente de assinatura digital.
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

