export type StatusChamado =
  | 'ABERTO'
  | 'AGENDADO'
  | 'EM_ATENDIMENTO'
  | 'PENDENTE'
  | 'PAUSADO'
  | 'CONCLUIDO'
  | 'FINALIZADO'
  | 'CANCELADO'
  | 'AGUARDANDO_REAGENDAMENTO'
  | 'Aberto'
  | 'Agendado'
  | 'Em Atendimento'
  | 'Pendente'
  | 'Finalizado'
  | 'Pausado'
  | 'Aguardando Reagendamento';

export type MotivoPausa = 
  | 'Falta de Peças / Componentes'
  | 'Aguardando Liberação do Cliente'
  | 'Horário de Almoço / Intervalo'
  | 'Fim de Expediente'
  | 'Aguardando Suporte Técnico'
  | 'Outros';

export interface DadosBancarios {
  banco?: string;
  agencia?: string;
  conta?: string;
  pix?: string;
}

export interface Tecnico {
  id_tecnico: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cnpj?: string;
  inscricao_estadual?: string;
  role?: 'admin' | 'tecnico';
  is_active?: boolean;
  dados_bancarios?: DadosBancarios;
  banco?: string;
  agencia?: string;
  conta?: string;
  pix?: string;
  especialidade?: string;
  avatar_url?: string;
}

export interface ContatoCliente {
  id_contato: string | number;
  nome: string;
  cargo?: string;
  cargo_departamento?: string;
  telefone: string;
  email?: string;
}

export interface Cliente {
  id_cliente: number;
  razao_social: string;
  nome_fantasia?: string;
  codigo?: number;
  cnpj_cpf?: string;
  telefone: string;
  contato_principal_nome?: string;
  contato_principal_telefone?: string;
  contato_responsavel?: string;
  contatos?: ContatoCliente[];
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep?: string;
  is_active?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface MaterialUtilizado {
  id_material?: number;
  nome?: string;
  descricao?: string;
  quantidade: number;
  unidade?: string;
  valor?: number;
  valor_unitario?: number;
}

export interface FotoServico {
  id_foto: string | number;
  tipo: 'DEFEITO' | 'CONSERTO' | 'ODOMETRO_IDA' | 'ODOMETRO_VOLTA' | 'COMPROVANTE' | 'defeito' | 'conserto';
  url: string;
  descricao?: string;
  data_hora?: string;
}

export interface DefeitoRelatado {
  id_defeito: string | number;
  descricao: string;
  solucionado: boolean;
  observacoes?: string;
}

export interface ServicoEquipamento {
  id_servico?: number;
  id_servico_equipamento?: number;
  id_visita?: number;
  nome_equipamento: string;
  modelo?: string;
  numero_serie?: string;
  numero_serie_atendido?: string;
  status_servico?: 'Pendente' | 'Sanado' | 'Substituído' | 'Retirado para Oficina';
  defeitos_principais?: string[];
  defeito_outros_descricao?: string;
  sub_defeitos_refrigeracao?: string[];
  sub_defeitos_compressor?: string[];
  sub_defeitos_vazamento?: string[];
  vazamento_ponto_descricao?: string;
  sub_defeitos_outros?: string[];
  sub_defeitos_iluminacao?: string[];
  sub_defeitos_estrutura?: string[];
  defeitos?: DefeitoRelatado[];
  fotos_defeito?: string[];
  fotos_conserto?: string[];
  fotos?: FotoServico[];
  materiais_utilizados?: MaterialUtilizado[];
  materiais?: MaterialUtilizado[];
  observacoes_tecnicas?: string;
}

export interface RegistroPausa {
  id_pausa: string | number;
  visita_id?: number;
  motivo: MotivoPausa | string;
  descricao?: string;
  detalhe?: string;
  hora_inicio?: string;
  hora_fim?: string;
  criado_em?: string;
  is_ativa?: boolean;
}

export interface ComprovanteCusto {
  id_comprovante: string | number;
  id_visita?: number;
  tipo: 'pedagio' | 'frete' | 'combustivel' | 'outros';
  valor: number;
  descricao?: string;
  url?: string;
  foto_url?: string;
}

export interface Visita {
  id_visita: number;
  id_os: number;
  data_visita: string;
  
  // Deslocamento IDA
  hora_inicio_deslocamento?: string;
  km_inicio_ida?: number;
  hora_inicio_ida?: string;
  foto_inicio_ida_url?: string;
  
  km_fim_ida?: number;
  hora_fim_ida?: string;
  foto_fim_ida_url?: string;

  // Atendimento
  hora_chegada_cliente?: string;
  hora_inicio_atendimento?: string;
  hora_fim_atendimento?: string;
  descricao_servico_executado?: string;
  pendencia?: string;
  pendencias?: string;

  nome_ajudante?: string;
  telefone_ajudante?: string;

  // Deslocamento VOLTA
  km_inicio_volta?: number;
  hora_inicio_volta?: string;
  foto_inicio_volta_url?: string;

  km_fim_volta?: number;
  hora_fim_volta?: string;
  foto_fim_volta_url?: string;

  km_total?: number;
  valor_pedagio?: number;
  valor_frete_devolucao?: number;
  servico_finalizado?: boolean;

  odometro_inicio_url?: string;
  odometro_fim_url?: string;
  comprovante_pedagio_urls?: string[];
  comprovante_frete_urls?: string[];

  nome_cliente?: string;
  documento_cliente?: string;

  pausas?: RegistroPausa[];
  comprovantes?: ComprovanteCusto[];
  servicos_realizados?: ServicoEquipamento[];
}

export interface EstadoVisitaResponse {
  pode_iniciar_deslocamento_ida: boolean;
  pode_finalizar_deslocamento_ida: boolean;
  pode_iniciar_atendimento: boolean;
  pode_finalizar_atendimento: boolean;
  pode_iniciar_deslocamento_volta: boolean;
  pode_finalizar_deslocamento_volta: boolean;
  pode_concluir_chamado: boolean;
  pode_pausar_os: boolean;
  is_os_pausada: boolean;
  motivo_pausa?: string | null;
}

export interface AssinaturaCliente {
  assinatura_url: string;
  nome_responsavel: string;
  documento: string; // RG or CPF
  cargo_funcao?: string;
  data_assinatura?: string;
}

export interface CustoMaterialDetalhado {
  nome: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface CustoVisitaDetalhado {
  id_visita: number;
  data: string;
  custo_total_materiais: number;
  custo_km: number;
  custo_pedagio: number;
  custo_frete: number;
  custo_tempo_servico: number;
  custo_tempo_deslocamento: number;
  subtotal_visita: number;
}

export interface CustoTotalResponse {
  id_os: number;
  custo_total_materiais: number;
  custo_total_km: number;
  custo_total_pedagio: number;
  custo_total_frete: number;
  custo_total_servico: number;
  custo_total_deslocamento: number;
  total_geral: number;
  detalhes_por_visita: CustoVisitaDetalhado[];
  detalhes_materiais_compilado: CustoMaterialDetalhado[];
}

export interface OrdemServico {
  id_os: number;
  codigo_os: string;
  id_cliente: number;
  cliente: Cliente;
  cliente_nome?: string;
  id_tecnico_atribuido: number | null;
  tecnico?: Tecnico;
  status: StatusChamado;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  data_abertura: string;
  data_agendamento?: string;
  data_conclusao?: string;
  descricao_cliente: string;
  pedido?: string;
  data_faturamento?: string;
  em_garantia: boolean;
  is_cancelled?: boolean;
  assinatura_cliente_url?: string;
  assinatura?: AssinaturaCliente;
  honorarios?: number;
  valor_total_servico?: number;
  deslocamento?: {
    km_percorrido?: number;
    valor_km?: number;
    valor_total_deslocamento?: number;
  };
  pecas_utilizadas?: MaterialUtilizado[];
  visitas: Visita[];
}
