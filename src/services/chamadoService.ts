import { OrdemServico, Tecnico, Cliente, StatusChamado, MotivoPausa, ServicoEquipamento, FotoServico, MaterialUtilizado, ComprovanteCusto, AssinaturaCliente } from '../types';
import { INITIAL_CHAMADOS, TECNICOS_MOCK, CLIENTES_MOCK } from '../data/mockData';

const STORAGE_KEY_CHAMADOS = 'fast_ariam_chamados_v1';
const STORAGE_KEY_CLIENTES = 'fast_ariam_clientes_v1';
const STORAGE_KEY_TECNICOS = 'fast_ariam_tecnicos_v1';
const STORAGE_KEY_AUTH = 'fast_ariam_auth_tecnico_v1';

export class ChamadoService {
  private static getStoredChamados(): OrdemServico[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CHAMADOS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Erro ao ler localStorage:', e);
    }
    this.saveChamados(INITIAL_CHAMADOS);
    return INITIAL_CHAMADOS;
  }

  private static saveChamados(chamados: OrdemServico[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_CHAMADOS, JSON.stringify(chamados));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  }

  // --- CLIENTES CRUD ---
  static listarClientes(): Cliente[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CLIENTES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler clientes do localStorage:', e);
    }
    localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(CLIENTES_MOCK));
    return CLIENTES_MOCK;
  }

  static cancelarChamado(id_os: number, motivo?: string): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os) throw new Error('OS não encontrada.');

    os.status = 'CANCELADO';
    if (motivo) {
      os.descricao_cliente = (os.descricao_cliente ? os.descricao_cliente + ' | ' : '') + `[CANCELAMENTO]: ${motivo}`;
    }
    this.saveChamados(list);
    return os;
  }

  static salvarCliente(clienteData: Partial<Cliente>): Cliente {
    const clientes = this.listarClientes();
    let cliente: Cliente;

    if (clienteData.id_cliente) {
      const idx = clientes.findIndex((c) => c.id_cliente === clienteData.id_cliente);
      if (idx >= 0) {
        clientes[idx] = { ...clientes[idx], ...clienteData } as Cliente;
        cliente = clientes[idx];
      } else {
        cliente = { ...clienteData, id_cliente: clienteData.id_cliente } as Cliente;
        clientes.push(cliente);
      }
    } else {
      const newId = Math.max(0, ...clientes.map((c) => c.id_cliente)) + 1;
      cliente = {
        id_cliente: newId,
        nome_fantasia: clienteData.nome_fantasia || 'Novo Cliente',
        razao_social: clienteData.razao_social || clienteData.nome_fantasia || 'Razão Social Ltda',
        cnpj_cpf: clienteData.cnpj_cpf || '00.000.000/0001-00',
        telefone: clienteData.telefone || '(11) 90000-0000',
        contato_responsavel: clienteData.contato_responsavel || 'Responsável',
        contatos: clienteData.contatos || [],
        endereco: clienteData.endereco || 'Rua Principal',
        numero: clienteData.numero || '100',
        bairro: clienteData.bairro || 'Centro',
        cidade: clienteData.cidade || 'São Paulo',
        uf: clienteData.uf || 'SP',
        cep: clienteData.cep || '01000-000',
      };
      clientes.push(cliente);
    }

    localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
    return cliente;
  }

  static excluirCliente(id_cliente: number): boolean {
    const clientes = this.listarClientes();
    const filtered = clientes.filter((c) => c.id_cliente !== id_cliente);
    localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(filtered));
    return true;
  }

  // --- TECNICOS CRUD ---
  static listarTecnicos(): Tecnico[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TECNICOS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler técnicos do localStorage:', e);
    }
    localStorage.setItem(STORAGE_KEY_TECNICOS, JSON.stringify(TECNICOS_MOCK));
    return TECNICOS_MOCK;
  }

  static salvarTecnico(tecnicoData: Partial<Tecnico>): Tecnico {
    const tecnicos = this.listarTecnicos();
    let tecnico: Tecnico;

    if (tecnicoData.id_tecnico) {
      const idx = tecnicos.findIndex((t) => t.id_tecnico === tecnicoData.id_tecnico);
      if (idx >= 0) {
        tecnicos[idx] = { ...tecnicos[idx], ...tecnicoData } as Tecnico;
        tecnico = tecnicos[idx];
      } else {
        tecnico = { ...tecnicoData, id_tecnico: tecnicoData.id_tecnico } as Tecnico;
        tecnicos.push(tecnico);
      }
    } else {
      const newId = Math.max(0, ...tecnicos.map((t) => t.id_tecnico)) + 1;
      tecnico = {
        id_tecnico: newId,
        nome: tecnicoData.nome || 'Novo Técnico',
        email: tecnicoData.email || 'tecnico@fastariam.com.br',
        cpf: tecnicoData.cpf || '000.000.000-00',
        telefone: tecnicoData.telefone || '(11) 99999-9999',
        especialidade: tecnicoData.especialidade || 'Manutenção Geral',
        avatar_url: tecnicoData.avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      };
      tecnicos.push(tecnico);
    }

    localStorage.setItem(STORAGE_KEY_TECNICOS, JSON.stringify(tecnicos));
    return tecnico;
  }

  static excluirTecnico(id_tecnico: number): boolean {
    const tecnicos = this.listarTecnicos();
    const filtered = tecnicos.filter((t) => t.id_tecnico !== id_tecnico);
    localStorage.setItem(STORAGE_KEY_TECNICOS, JSON.stringify(filtered));
    return true;
  }

  // --- AUTH FOR FIELD TECHNICIAN ---
  static getTecnicoLogado(): Tecnico | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUTH);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Erro ao carregar autenticação:', e);
    }
    const tecnicos = this.listarTecnicos();
    const def = tecnicos[0] || TECNICOS_MOCK[0];
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(def));
    return def;
  }

  static login(tecnicoId: number): Tecnico {
    const tecnicos = this.listarTecnicos();
    const t = tecnicos.find((item) => item.id_tecnico === tecnicoId) || tecnicos[0];
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(t));
    return t;
  }

  static logout(): void {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  }

  // --- ORDEM DE SERVIÇO CRUD ---
  static listarChamados(filterStatus?: StatusChamado | 'TODOS', searchQuery?: string): OrdemServico[] {
    let list = this.getStoredChamados();

    if (filterStatus && filterStatus !== 'TODOS') {
      list = list.filter((item) => item.status === filterStatus);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => 
        item.codigo_os.toLowerCase().includes(q) ||
        item.cliente.nome_fantasia.toLowerCase().includes(q) ||
        item.cliente.cidade.toLowerCase().includes(q) ||
        item.descricao_cliente.toLowerCase().includes(q) ||
        item.tecnico?.nome.toLowerCase().includes(q)
      );
    }

    return list;
  }

  static getChamadoPorId(id_os: number): OrdemServico | null {
    const list = this.getStoredChamados();
    return list.find((item) => item.id_os === id_os) || null;
  }

  static criarOrdemServico(data: {
    id_cliente: number;
    id_tecnico_atribuido: number;
    prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
    data_agendamento: string;
    descricao_cliente: string;
    equipamento_nome?: string;
    equipamento_modelo?: string;
    equipamento_serie?: string;
    em_garantia?: boolean;
    pedido?: string;
  }): OrdemServico {
    const list = this.getStoredChamados();
    const clientes = this.listarClientes();
    const tecnicos = this.listarTecnicos();

    const cliente = clientes.find((c) => c.id_cliente === Number(data.id_cliente)) || clientes[0];
    const tecnico = tecnicos.find((t) => t.id_tecnico === Number(data.id_tecnico_atribuido)) || tecnicos[0];

    const nextId = Math.max(100, ...list.map((o) => o.id_os)) + 1;
    const dateYear = new Date().getFullYear();
    const codigo_os = `OS-${dateYear}-${String(nextId).padStart(4, '0')}`;
    const dataAtual = new Date().toISOString().split('T')[0];

    const novaOS: OrdemServico = {
      id_os: nextId,
      codigo_os,
      id_cliente: cliente.id_cliente,
      cliente,
      id_tecnico_atribuido: tecnico.id_tecnico,
      tecnico,
      status: 'ABERTO',
      prioridade: data.prioridade || 'Média',
      data_abertura: dataAtual,
      data_agendamento: data.data_agendamento || `${dataAtual} 14:00`,
      descricao_cliente: data.descricao_cliente,
      pedido: data.pedido || `PED-${Math.floor(10000 + Math.random() * 90000)}`,
      em_garantia: data.em_garantia !== undefined ? data.em_garantia : true,
      visitas: [
        {
          id_visita: Date.now(),
          id_os: nextId,
          data_visita: dataAtual,
          pausas: [],
          comprovantes: [],
          servicos_realizados: data.equipamento_nome
            ? [
                {
                  id_servico_equipamento: Date.now() + 1,
                  nome_equipamento: data.equipamento_nome,
                  modelo: data.equipamento_modelo || 'Modelo Padrão',
                  numero_serie: data.equipamento_serie || `SN-${Math.floor(1000 + Math.random() * 9000)}`,
                  status_servico: 'Pendente',
                  defeitos: [
                    {
                      id_defeito: 'd_' + Date.now(),
                      descricao: data.descricao_cliente,
                      solucionado: false,
                    },
                  ],
                  fotos: [],
                  materiais: [],
                },
              ]
            : [],
        },
      ],
    };

    list.unshift(novaOS);
    this.saveChamados(list);
    return novaOS;
  }

  static atualizarOrdemServico(id_os: number, updates: Partial<OrdemServico>): OrdemServico {
    const list = this.getStoredChamados();
    const idx = list.findIndex((o) => o.id_os === id_os);
    if (idx < 0) throw new Error('Ordem de serviço não encontrada.');

    // If technician assigned changed, sync technician object
    if (updates.id_tecnico_atribuido) {
      const tecnicos = this.listarTecnicos();
      const tec = tecnicos.find((t) => t.id_tecnico === Number(updates.id_tecnico_atribuido));
      if (tec) {
        updates.tecnico = tec;
      }
    }

    // If client changed, sync client object
    if (updates.id_cliente) {
      const clientes = this.listarClientes();
      const cli = clientes.find((c) => c.id_cliente === Number(updates.id_cliente));
      if (cli) {
        updates.cliente = cli;
      }
    }

    list[idx] = { ...list[idx], ...updates };
    this.saveChamados(list);
    return list[idx];
  }

  static excluirOrdemServico(id_os: number): boolean {
    const list = this.getStoredChamados();
    const filtered = list.filter((o) => o.id_os !== id_os);
    this.saveChamados(filtered);
    return true;
  }

  static atribuirTecnico(id_os: number, id_tecnico: number): OrdemServico {
    const tecnicos = this.listarTecnicos();
    const tec = tecnicos.find((t) => t.id_tecnico === Number(id_tecnico));
    if (!tec) throw new Error('Técnico não encontrado.');

    return this.atualizarOrdemServico(id_os, {
      id_tecnico_atribuido: id_tecnico,
      tecnico: tec,
    });
  }

  // --- ACTIONS ON CHAMADOS & VISITAS ---

  static iniciarDeslocamentoIda(id_os: number, kmInicio: number, fotoUrl?: string): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os) throw new Error('OS não encontrada.');

    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dataAtual = new Date().toISOString().split('T')[0];

    let visita = os.visitas?.[0];
    if (!visita) {
      visita = {
        id_visita: Date.now(),
        id_os: os.id_os,
        data_visita: dataAtual,
        pausas: [],
        comprovantes: [],
        servicos_realizados: [],
      };
      os.visitas = [visita];
    }

    visita.km_inicio_ida = kmInicio;
    visita.hora_inicio_ida = horaAtual;
    if (fotoUrl) visita.foto_inicio_ida_url = fotoUrl;

    os.status = 'EM_ATENDIMENTO';
    this.saveChamados(list);
    return os;
  }

  static registrarChegadaCliente(id_os: number, kmFimIda?: number, fotoUrl?: string): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os || !os.visitas?.[0]) throw new Error('OS ou Visita não encontrada.');

    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const visita = os.visitas[0];

    visita.hora_chegada_cliente = horaAtual;
    visita.hora_inicio_atendimento = horaAtual;

    if (kmFimIda !== undefined) {
      visita.km_fim_ida = kmFimIda;
      visita.hora_fim_ida = horaAtual;
      if (visita.km_inicio_ida) {
        visita.km_total = (visita.km_total || 0) + (kmFimIda - visita.km_inicio_ida);
      }
    }
    if (fotoUrl) visita.foto_fim_ida_url = fotoUrl;

    os.status = 'EM_ATENDIMENTO';
    this.saveChamados(list);
    return os;
  }

  static pausarVisita(id_os: number, motivo: MotivoPausa, detalhe?: string): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os || !os.visitas?.[0]) throw new Error('OS ou Visita não encontrada.');

    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const visita = os.visitas[0];

    visita.pausas.push({
      id_pausa: 'p_' + Date.now(),
      motivo,
      detalhe,
      hora_inicio: horaAtual,
    });

    os.status = 'PAUSADO';
    this.saveChamados(list);
    return os;
  }

  static retomarVisita(id_os: number): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os || !os.visitas?.[0]) throw new Error('OS ou Visita não encontrada.');

    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const visita = os.visitas[0];

    const últimaPausa = visita.pausas[visita.pausas.length - 1];
    if (últimaPausa && !últimaPausa.hora_fim) {
      últimaPausa.hora_fim = horaAtual;
    }

    os.status = 'EM_ATENDIMENTO';
    this.saveChamados(list);
    return os;
  }

  static adicionarOuAtualizarServicoEquipamento(id_os: number, servico: ServicoEquipamento): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os || !os.visitas?.[0]) throw new Error('OS ou Visita não encontrada.');

    const visita = os.visitas[0];
    const idx = visita.servicos_realizados.findIndex((s) => s.id_servico_equipamento === servico.id_servico_equipamento);

    if (idx >= 0) {
      visita.servicos_realizados[idx] = servico;
    } else {
      servico.id_servico_equipamento = Date.now();
      visita.servicos_realizados.push(servico);
    }

    this.saveChamados(list);
    return os;
  }

  static adicionarFotoServico(id_os: number, id_servico_equipamento: number, foto: FotoServico): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os || !os.visitas?.[0]) throw new Error('OS ou Visita não encontrada.');

    const visita = os.visitas[0];
    const eq = visita.servicos_realizados.find((s) => s.id_servico_equipamento === id_servico_equipamento);
    if (eq) {
      eq.fotos.push(foto);
    }

    this.saveChamados(list);
    return os;
  }

  static adicionarComprovante(id_os: number, comprovante: ComprovanteCusto): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os || !os.visitas?.[0]) throw new Error('OS ou Visita não encontrada.');

    const visita = os.visitas[0];
    visita.comprovantes.push(comprovante);

    if (comprovante.tipo === 'pedagio') {
      visita.valor_pedagio = (visita.valor_pedagio || 0) + comprovante.valor;
    } else if (comprovante.tipo === 'frete') {
      visita.valor_frete_devolucao = (visita.valor_frete_devolucao || 0) + comprovante.valor;
    }

    this.saveChamados(list);
    return os;
  }

  static registrarDeslocamentoVolta(
    id_os: number,
    kmInicioVolta: number,
    kmFimVolta: number,
    fotoVoltaUrl?: string
  ): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os || !os.visitas?.[0]) throw new Error('OS ou Visita não encontrada.');

    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const visita = os.visitas[0];

    visita.km_inicio_volta = kmInicioVolta;
    visita.hora_inicio_volta = visita.hora_inicio_volta || horaAtual;
    visita.km_fim_volta = kmFimVolta;
    visita.hora_fim_volta = horaAtual;
    if (fotoVoltaUrl) visita.foto_fim_volta_url = fotoVoltaUrl;

    const diffVolta = kmFimVolta - kmInicioVolta;
    const diffIda = (visita.km_fim_ida && visita.km_inicio_ida) ? (visita.km_fim_ida - visita.km_inicio_ida) : 0;
    visita.km_total = (diffIda > 0 ? diffIda : 0) + (diffVolta > 0 ? diffVolta : 0);

    this.saveChamados(list);
    return os;
  }

  static salvarAssinatura(id_os: number, assinatura: AssinaturaCliente): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os) throw new Error('OS não encontrada.');

    os.assinatura = assinatura;
    this.saveChamados(list);
    return os;
  }

  static concluirChamado(id_os: number, parecerFinal?: string): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os) throw new Error('OS não encontrada.');

    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dataAtual = new Date().toISOString().split('T')[0];

    os.status = 'CONCLUIDO';
    os.data_conclusao = dataAtual + ' ' + horaAtual;

    if (os.visitas?.[0]) {
      os.visitas[0].hora_fim_atendimento = horaAtual;
      os.visitas[0].servico_finalizado = true;
      if (parecerFinal) {
        os.visitas[0].descricao_servico_executado = parecerFinal;
      }
    }

    this.saveChamados(list);
    return os;
  }
}
