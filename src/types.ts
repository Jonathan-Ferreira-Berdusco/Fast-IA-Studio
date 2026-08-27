export type StatusChamado = 'ABERTO' | 'EM_ATENDIMENTO' | 'PAUSADO' | 'CONCLUIDO' | 'CANCELADO';

export type MotivoPausa = 
  | 'Falta de Peças / Componentes'
  | 'Aguardando Liberação do Cliente'
  | 'Horário de Almoço / Intervalo'
  | 'Fim de Expediente'
  | 'Aguardando Suporte Técnico'
  | 'Outros';

export interface Tecnico {
  id_tecnico: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
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
  nome_fantasia: string;
  razao_social: string;
  cnpj_cpf: string;
  telefone: string;
  contato_responsavel: string;
  contatos?: ContatoCliente[];
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  latitude?: number;
  longitude?: number;
}

export interface MaterialUtilizado {
  id_material?: number;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario?: number;
}

export interface FotoServico {
  id_foto: string;
  tipo: 'DEFEITO' | 'CONSERTO' | 'ODOMETRO_IDA' | 'ODOMETRO_VOLTA' | 'COMPROVANTE';
  url: string;
  descricao?: string;
  data_hora: string;
}

export interface DefeitoRelatado {
  id_defeito: string;
  descricao: string;
  solucionado: boolean;
  observacoes?: string;
}

export interface ServicoEquipamento {
  id_servico_equipamento: number;
  nome_equipamento: string;
  modelo: string;
  numero_serie: string;
  status_servico: 'Pendente' | 'Sanado' | 'Substituído' | 'Retirado para Oficina';
  defeitos: DefeitoRelatado[];
  fotos: FotoServico[];
  materiais: MaterialUtilizado[];
  observacoes_tecnicas?: string;
}

export interface RegistroPausa {
  id_pausa: string;
  motivo: MotivoPausa;
  detalhe?: string;
  hora_inicio: string;
  hora_fim?: string;
}

export interface ComprovanteCusto {
  id_comprovante: string;
  tipo: 'pedagio' | 'frete' | 'combustivel' | 'outros';
  valor: number;
  descricao: string;
  foto_url?: string;
}

export interface Visita {
  id_visita: number;
  id_os: number;
  data_visita: string;
  
  // Deslocamento IDA
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
  pendencias?: string;

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

  pausas: RegistroPausa[];
  comprovantes: ComprovanteCusto[];
  servicos_realizados: ServicoEquipamento[];
}

export interface AssinaturaCliente {
  assinatura_url: string;
  nome_responsavel: string;
  documento: string; // RG or CPF
  cargo_funcao: string;
  data_assinatura: string;
}

export interface OrdemServico {
  id_os: number;
  codigo_os: string;
  id_cliente: number;
  cliente: Cliente;
  id_tecnico_atribuido: number;
  tecnico?: Tecnico;
  status: StatusChamado;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  data_abertura: string;
  data_agendamento: string;
  data_conclusao?: string;
  descricao_cliente: string;
  pedido?: string;
  em_garantia: boolean;
  honorarios?: number;
  valor_total_servico?: number;
  deslocamento?: {
    km_percorrido?: number;
    valor_km?: number;
    valor_total_deslocamento?: number;
  };
  pecas_utilizadas?: MaterialUtilizado[];
  assinatura?: AssinaturaCliente;
  visitas: Visita[];
}
