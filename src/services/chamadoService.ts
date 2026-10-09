import {
  OrdemServico,
  Tecnico,
  Cliente,
  StatusChamado,
  MotivoPausa,
  ServicoEquipamento,
  FotoServico,
  MaterialUtilizado,
  ComprovanteCusto,
  AssinaturaCliente,
  EstadoVisitaResponse,
  CustoTotalResponse,
} from '../types';
import { INITIAL_CHAMADOS, TECNICOS_MOCK, CLIENTES_MOCK } from '../data/mockData';
import { apiClient, ApiError } from './apiClient';

const STORAGE_KEY_CHAMADOS = 'fast_ariam_chamados_v1';
const STORAGE_KEY_CLIENTES = 'fast_ariam_clientes_v1';
const STORAGE_KEY_TECNICOS = 'fast_ariam_tecnicos_v1';
const STORAGE_KEY_AUTH = 'fast_ariam_auth_tecnico_v1';
const STORAGE_KEY_API_ONLINE = 'fast_ariam_api_online_status';

export class ChamadoService {
  private static isApiOnline: boolean = false;
  private static listeners: Array<() => void> = [];

  // --- SUBSCRIBER SYSTEM FOR REACTIVE REFRESH ---
  static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Erro no listener:', err);
      }
    });
  }

  // --- STATUS DE CONECTIVIDADE COM O BACKEND FASTAPI ---
  static async checkApiHealth(): Promise<boolean> {
    try {
      await apiClient.checkHealth();
      this.isApiOnline = true;
      localStorage.setItem(STORAGE_KEY_API_ONLINE, 'true');
      return true;
    } catch {
      this.isApiOnline = false;
      localStorage.setItem(STORAGE_KEY_API_ONLINE, 'false');
      return false;
    }
  }

  static getIsApiOnline(): boolean {
    return localStorage.getItem(STORAGE_KEY_API_ONLINE) === 'true';
  }

  // --- SINCRONIZAÇÃO COMPLETA COM BACKEND FASTAPI ---
  static async syncWithBackend(): Promise<void> {
    try {
      const isOnline = await this.checkApiHealth();
      if (!isOnline) return;

      // 1. Carrega técnicos da API
      try {
        const apiTecnicos = await apiClient.getTecnicos();
        if (Array.isArray(apiTecnicos) && apiTecnicos.length > 0) {
          const mappedTecs: Tecnico[] = apiTecnicos.map((t: any) => ({
            id_tecnico: t.id_tecnico,
            nome: t.nome,
            email: t.email,
            cpf: t.cpf,
            telefone: t.telefone,
            cnpj: t.cnpj,
            inscricao_estadual: t.inscricao_estadual,
            role: t.role || 'tecnico',
            is_active: t.is_active !== false,
            dados_bancarios: t.dados_bancarios || {
              banco: t.banco,
              agencia: t.agencia,
              conta: t.conta,
              pix: t.pix,
            },
            especialidade: t.especialidade || 'Técnico Especialista FAST',
            avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          }));
          localStorage.setItem(STORAGE_KEY_TECNICOS, JSON.stringify(mappedTecs));
        }
      } catch (e) {
        console.warn('Não foi possível carregar técnicos do backend:', e);
      }

      // 2. Carrega clientes da API
      try {
        const apiClientes = await apiClient.getClientes();
        if (Array.isArray(apiClientes) && apiClientes.length > 0) {
          const mappedClients: Cliente[] = apiClientes.map((c: any) => ({
            id_cliente: c.id_cliente,
            razao_social: c.razao_social,
            nome_fantasia: c.razao_social,
            codigo: c.codigo,
            contato_principal_nome: c.contato_principal_nome,
            contato_principal_telefone: c.contato_principal_telefone,
            contato_responsavel: c.contato_principal_nome || 'Responsável',
            telefone: c.telefone || '',
            endereco: c.endereco || '',
            numero: c.numero || '',
            bairro: c.bairro || '',
            cidade: c.cidade || '',
            uf: c.uf || '',
            is_active: c.is_active !== false,
          }));
          localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(mappedClients));
        }
      } catch (e) {
        console.warn('Não foi possível carregar clientes do backend:', e);
      }

      // 3. Carrega chamados da API
      try {
        const apiChamados = await apiClient.getChamados();
        if (Array.isArray(apiChamados)) {
          const clientes = this.listarClientes();
          const tecnicos = this.listarTecnicos();

          const mappedChamados: OrdemServico[] = apiChamados.map((item: any) => {
            const cliente = clientes.find((c) => c.id_cliente === item.id_cliente) || {
              id_cliente: item.id_cliente,
              razao_social: item.cliente_nome || `Cliente #${item.id_cliente}`,
              nome_fantasia: item.cliente_nome || `Cliente #${item.id_cliente}`,
              telefone: '',
              endereco: '',
              numero: '',
              bairro: '',
              cidade: '',
              uf: '',
            };

            const tecnico = item.id_tecnico_atribuido
              ? tecnicos.find((t) => t.id_tecnico === item.id_tecnico_atribuido)
              : undefined;

            const year = item.data_abertura ? new Date(item.data_abertura).getFullYear() : new Date().getFullYear();
            const codigo_os = `OS-${year}-${String(item.id_os).padStart(4, '0')}`;

            return {
              id_os: item.id_os,
              codigo_os,
              id_cliente: item.id_cliente,
              cliente,
              cliente_nome: item.cliente_nome || cliente.razao_social,
              id_tecnico_atribuido: item.id_tecnico_atribuido,
              tecnico,
              status: item.status || 'Aberto',
              is_cancelled: item.is_cancelled || false,
              prioridade: 'Média',
              data_abertura: item.data_abertura || new Date().toISOString().split('T')[0],
              data_agendamento: item.data_agendamento || '',
              data_conclusao: item.data_conclusao,
              descricao_cliente: item.descricao_cliente || '',
              pedido: item.pedido || '',
              data_faturamento: item.data_faturamento,
              em_garantia: item.em_garantia !== false,
              assinatura_cliente_url: item.assinatura_cliente_url,
              visitas: (item.visitas || []).map((v: any) => ({
                ...v,
                pausas: v.pausas || [],
                comprovantes: v.comprovantes || [],
                servicos_realizados: (v.servicos_realizados || []).map((s: any) => ({
                  ...s,
                  id_servico_equipamento: s.id_servico,
                  nome_equipamento: s.nome_equipamento || s.numero_serie_atendido || 'Equipamento',
                  modelo: 'Padrão FAST',
                  numero_serie: s.numero_serie_atendido,
                  status_servico: 'Pendente',
                  defeitos: (s.defeitos_principais || []).map((d: string, idx: number) => ({
                    id_defeito: `def_${idx}`,
                    descricao: d,
                    solucionado: false,
                  })),
                  fotos: [],
                  materiais: (s.materiais_utilizados || []).map((m: any) => ({
                    id_material: m.id_material,
                    nome: m.nome,
                    descricao: m.nome,
                    quantidade: m.quantidade,
                    valor: m.valor,
                    valor_unitario: m.valor,
                  })),
                })),
              })),
            };
          });

          this.saveChamados(mappedChamados);
        }
      } catch (e) {
        console.warn('Não foi possível carregar chamados do backend:', e);
      }

      this.notifyListeners();
    } catch (e) {
      console.warn('Falha na sincronização com o backend:', e);
    }
  }

  // --- STORAGE CACHE HELPERS ---
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

  static async salvarClienteAsync(clienteData: Partial<Cliente>): Promise<Cliente> {
    const clientes = this.listarClientes();
    let cliente: Cliente;

    if (clienteData.id_cliente) {
      try {
        const updated = await apiClient.updateCliente(clienteData.id_cliente, {
          razao_social: clienteData.razao_social,
          contato_principal_nome: clienteData.contato_principal_nome || clienteData.contato_responsavel,
          contato_principal_telefone: clienteData.contato_principal_telefone,
          telefone: clienteData.telefone,
          endereco: clienteData.endereco,
          numero: clienteData.numero,
          bairro: clienteData.bairro,
          cidade: clienteData.cidade,
          uf: clienteData.uf,
          codigo: clienteData.codigo,
        });
        cliente = { ...clienteData, ...updated } as Cliente;
      } catch {
        cliente = clienteData as Cliente;
      }

      const idx = clientes.findIndex((c) => c.id_cliente === clienteData.id_cliente);
      if (idx >= 0) clientes[idx] = { ...clientes[idx], ...cliente };
      else clientes.push(cliente);
    } else {
      const payload = {
        razao_social: clienteData.razao_social || clienteData.nome_fantasia || 'Novo Cliente Ltda',
        contato_principal_nome: clienteData.contato_principal_nome || clienteData.contato_responsavel || 'Contato',
        contato_principal_telefone: clienteData.contato_principal_telefone || clienteData.telefone || '11900000000',
        telefone: clienteData.telefone || '1134567890',
        endereco: clienteData.endereco || 'Rua Principal',
        numero: clienteData.numero || '100',
        bairro: clienteData.bairro || 'Centro',
        cidade: clienteData.cidade || 'São Paulo',
        uf: (clienteData.uf || 'SP').slice(0, 2).toUpperCase(),
        codigo: clienteData.codigo || Math.floor(10000 + Math.random() * 89999),
        is_active: true,
      };

      try {
        const created = await apiClient.createCliente(payload);
        cliente = {
          ...payload,
          id_cliente: created.id_cliente,
          nome_fantasia: payload.razao_social,
          contato_responsavel: payload.contato_principal_nome,
        };
      } catch {
        const newId = Math.max(0, ...clientes.map((c) => c.id_cliente)) + 1;
        cliente = {
          ...payload,
          id_cliente: newId,
          nome_fantasia: payload.razao_social,
          contato_responsavel: payload.contato_principal_nome,
        };
      }
      clientes.push(cliente);
    }

    localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
    this.notifyListeners();
    return cliente;
  }

  static salvarCliente(clienteData: Partial<Cliente>): Cliente {
    // Sincroniza localmente de imediato
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
      // Sync assíncrono com a API
      apiClient.updateCliente(clienteData.id_cliente, clienteData).catch(() => {});
    } else {
      const newId = Math.max(0, ...clientes.map((c) => c.id_cliente)) + 1;
      cliente = {
        id_cliente: newId,
        nome_fantasia: clienteData.nome_fantasia || clienteData.razao_social || 'Novo Cliente',
        razao_social: clienteData.razao_social || clienteData.nome_fantasia || 'Razão Social Ltda',
        cnpj_cpf: clienteData.cnpj_cpf || '00.000.000/0001-00',
        telefone: clienteData.telefone || '(11) 90000-0000',
        contato_responsavel: clienteData.contato_responsavel || clienteData.contato_principal_nome || 'Responsável',
        contato_principal_nome: clienteData.contato_principal_nome || clienteData.contato_responsavel || 'Responsável',
        contato_principal_telefone: clienteData.contato_principal_telefone || clienteData.telefone,
        endereco: clienteData.endereco || 'Rua Principal',
        numero: clienteData.numero || '100',
        bairro: clienteData.bairro || 'Centro',
        cidade: clienteData.cidade || 'São Paulo',
        uf: (clienteData.uf || 'SP').slice(0, 2).toUpperCase(),
        codigo: clienteData.codigo || Math.floor(10000 + Math.random() * 89999),
        is_active: true,
      };
      clientes.push(cliente);

      // Sync assíncrono com a API
      apiClient
        .createCliente({
          razao_social: cliente.razao_social,
          contato_principal_nome: cliente.contato_principal_nome,
          contato_principal_telefone: cliente.contato_principal_telefone,
          telefone: cliente.telefone,
          endereco: cliente.endereco,
          numero: cliente.numero,
          bairro: cliente.bairro,
          cidade: cliente.cidade,
          uf: cliente.uf,
          codigo: cliente.codigo,
          is_active: true,
        })
        .catch(() => {});
    }

    localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
    return cliente;
  }

  static excluirCliente(id_cliente: number): boolean {
    const clientes = this.listarClientes();
    const filtered = clientes.filter((c) => c.id_cliente !== id_cliente);
    localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(filtered));

    apiClient.deleteCliente(id_cliente).catch(() => {});
    this.notifyListeners();
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
      apiClient.updateTecnico(tecnicoData.id_tecnico, tecnicoData).catch(() => {});
    } else {
      const newId = Math.max(0, ...tecnicos.map((t) => t.id_tecnico)) + 1;
      tecnico = {
        id_tecnico: newId,
        nome: tecnicoData.nome || 'Novo Técnico',
        email: tecnicoData.email || 'tecnico@fastariam.com.br',
        cpf: tecnicoData.cpf || '000.000.000-00',
        telefone: tecnicoData.telefone || '(11) 99999-9999',
        cnpj: tecnicoData.cnpj || '00.000.000/0001-00',
        role: tecnicoData.role || 'tecnico',
        is_active: true,
        dados_bancarios: tecnicoData.dados_bancarios || {
          banco: 'Banco do Brasil',
          agencia: '0001',
          conta: '12345-6',
        },
        especialidade: tecnicoData.especialidade || 'Manutenção Geral',
        avatar_url:
          tecnicoData.avatar_url ||
          `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      };
      tecnicos.push(tecnico);

      apiClient
        .createTecnico({
          nome: tecnico.nome,
          email: tecnico.email,
          cpf: tecnico.cpf,
          telefone: tecnico.telefone,
          cnpj: tecnico.cnpj,
          password: 'senhaPadrao123',
          role: tecnico.role || 'tecnico',
          dados_bancarios: tecnico.dados_bancarios,
        })
        .catch(() => {});
    }

    localStorage.setItem(STORAGE_KEY_TECNICOS, JSON.stringify(tecnicos));
    this.notifyListeners();
    return tecnico;
  }

  static excluirTecnico(id_tecnico: number): boolean {
    const tecnicos = this.listarTecnicos();
    const filtered = tecnicos.filter((t) => t.id_tecnico !== id_tecnico);
    localStorage.setItem(STORAGE_KEY_TECNICOS, JSON.stringify(filtered));

    apiClient.deleteTecnico(id_tecnico).catch(() => {});
    this.notifyListeners();
    return true;
  }

  // --- AUTH FOR FIELD TECHNICIAN & ADMIN ---
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

  static async loginWithCredentials(username: string, password: string): Promise<Tecnico> {
    try {
      // 1. Tenta autenticação real com a API FastAPI
      const tokenResp = await apiClient.login(username, password);
      const decoded = apiClient.decodeToken(tokenResp.access_token);

      const tecnicos = this.listarTecnicos();
      let loggedUser = tecnicos.find(
        (t) => t.email.toLowerCase() === username.toLowerCase() || (decoded && t.id_tecnico === decoded.user_id)
      );

      if (!loggedUser) {
        loggedUser = {
          id_tecnico: decoded?.user_id || 1,
          nome: decoded?.sub?.split('@')[0] || username.split('@')[0],
          email: decoded?.sub || username,
          cpf: '000.000.000-00',
          telefone: '(11) 98765-4321',
          role: decoded?.role || 'admin',
          is_active: true,
          especialidade: 'Especialista FAST Ariam',
        };
      } else if (decoded?.role) {
        loggedUser.role = decoded.role;
      }

      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(loggedUser));
      this.isApiOnline = true;
      localStorage.setItem(STORAGE_KEY_API_ONLINE, 'true');

      // Dispara sincronização em segundo plano com o banco FastAPI
      this.syncWithBackend().catch(() => {});
      return loggedUser;
    } catch (error: any) {
      // Se falhar e a API estiver inacessível, verifica se é login demo local
      const tecnicos = this.listarTecnicos();
      const demoUser = tecnicos.find((t) => t.email.toLowerCase() === username.toLowerCase());
      if (demoUser) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(demoUser));
        return demoUser;
      }
      throw error;
    }
  }

  static login(tecnicoId: number): Tecnico {
    const tecnicos = this.listarTecnicos();
    const t = tecnicos.find((item) => item.id_tecnico === tecnicoId) || tecnicos[0];
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(t));
    return t;
  }

  static logout(): void {
    apiClient.clearToken();
    localStorage.removeItem(STORAGE_KEY_AUTH);
  }

  // --- ORDEM DE SERVIÇO CRUD ---
  static listarChamados(filterStatus?: StatusChamado | 'TODOS', searchQuery?: string): OrdemServico[] {
    let list = this.getStoredChamados();

    if (filterStatus && filterStatus !== 'TODOS') {
      const target = String(filterStatus).trim().toUpperCase();
      list = list.filter((item) => {
        const itemStatus = String(item.status).trim().toUpperCase();
        if (target === 'CONCLUIDO' || target === 'FINALIZADO') {
          return itemStatus === 'CONCLUIDO' || itemStatus === 'FINALIZADO';
        }
        if (target === 'EM_ATENDIMENTO') {
          return itemStatus === 'EM_ATENDIMENTO' || itemStatus === 'EM ATENDIMENTO';
        }
        return itemStatus === target;
      });
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.codigo_os.toLowerCase().includes(q) ||
          item.cliente.nome_fantasia?.toLowerCase().includes(q) ||
          item.cliente.razao_social.toLowerCase().includes(q) ||
          item.cliente.cidade?.toLowerCase().includes(q) ||
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

  static async criarOrdemServicoAsync(data: {
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
  }): Promise<OrdemServico> {
    const list = this.getStoredChamados();
    const clientes = this.listarClientes();
    const tecnicos = this.listarTecnicos();

    const cliente = clientes.find((c) => c.id_cliente === Number(data.id_cliente)) || clientes[0];
    const tecnico = tecnicos.find((t) => t.id_tecnico === Number(data.id_tecnico_atribuido)) || tecnicos[0];

    const dataAtual = new Date().toISOString().split('T')[0];
    const payloadBackend = {
      id_cliente: Number(data.id_cliente),
      descricao_cliente: data.descricao_cliente,
      id_tecnico_atribuido: data.id_tecnico_atribuido ? Number(data.id_tecnico_atribuido) : null,
      data_agendamento: data.data_agendamento ? data.data_agendamento.split(' ')[0] : null,
      pedido: data.pedido || `PED-${Math.floor(10000 + Math.random() * 90000)}`,
      em_garantia: data.em_garantia !== undefined ? data.em_garantia : true,
      status: data.id_tecnico_atribuido ? 'Agendado' : 'Aberto',
    };

    let novaOS: OrdemServico;

    try {
      const respApi = await apiClient.createChamado(payloadBackend);
      const nextId = respApi.id_os;
      const dateYear = new Date().getFullYear();
      const codigo_os = `OS-${dateYear}-${String(nextId).padStart(4, '0')}`;

      // Se houver dados de equipamento/visita inicial, cria a visita
      let visitasCriadas: any[] = [];
      if (data.equipamento_nome) {
        try {
          const visitaResp = await apiClient.createVisita(nextId, {
            data_visita: dataAtual,
            hora_inicio_deslocamento: '08:00',
            hora_chegada_cliente: '09:00',
            hora_inicio_atendimento: '09:15',
            hora_fim_atendimento: '11:00',
            km_total: 10,
            descricao_servico_executado: data.descricao_cliente,
            servicos_realizados: [
              {
                numero_serie_atendido: data.equipamento_serie || `SN-${Date.now()}`,
                nome_equipamento: data.equipamento_nome,
                defeitos_principais: ['Refrigeração'],
                materiais_utilizados: [],
              },
            ],
          });
          visitasCriadas = [visitaResp];
        } catch (e) {
          console.warn('Erro ao criar visita inicial no backend:', e);
        }
      }

      novaOS = {
        id_os: nextId,
        codigo_os,
        id_cliente: cliente.id_cliente,
        cliente,
        cliente_nome: cliente.razao_social,
        id_tecnico_atribuido: tecnico.id_tecnico,
        tecnico,
        status: data.id_tecnico_atribuido ? 'AGENDADO' : 'ABERTO',
        prioridade: data.prioridade || 'Média',
        data_abertura: dataAtual,
        data_agendamento: data.data_agendamento || `${dataAtual} 14:00`,
        descricao_cliente: data.descricao_cliente,
        pedido: payloadBackend.pedido,
        em_garantia: payloadBackend.em_garantia,
        visitas: visitasCriadas.length > 0 ? visitasCriadas : [
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
                    defeitos: [{ id_defeito: 'd_' + Date.now(), descricao: data.descricao_cliente, solucionado: false }],
                    fotos: [],
                    materiais: [],
                  },
                ]
              : [],
          },
        ],
      };
    } catch {
      // Fallback local se a API estiver offline
      const nextId = Math.max(100, ...list.map((o) => o.id_os)) + 1;
      const dateYear = new Date().getFullYear();
      const codigo_os = `OS-${dateYear}-${String(nextId).padStart(4, '0')}`;

      novaOS = {
        id_os: nextId,
        codigo_os,
        id_cliente: cliente.id_cliente,
        cliente,
        cliente_nome: cliente.razao_social,
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
                    defeitos: [{ id_defeito: 'd_' + Date.now(), descricao: data.descricao_cliente, solucionado: false }],
                    fotos: [],
                    materiais: [],
                  },
                ]
              : [],
          },
        ],
      };
    }

    list.unshift(novaOS);
    this.saveChamados(list);
    this.notifyListeners();
    return novaOS;
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
    // Sincroniza localmente de imediato e dispara async
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
      cliente_nome: cliente.razao_social,
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
                  defeitos: [{ id_defeito: 'd_' + Date.now(), descricao: data.descricao_cliente, solucionado: false }],
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

    // Dispara criação no FastAPI
    apiClient
      .createChamado({
        id_cliente: Number(data.id_cliente),
        descricao_cliente: data.descricao_cliente,
        id_tecnico_atribuido: data.id_tecnico_atribuido ? Number(data.id_tecnico_atribuido) : null,
        data_agendamento: data.data_agendamento ? data.data_agendamento.split(' ')[0] : null,
        pedido: data.pedido || `PED-${Math.floor(10000 + Math.random() * 90000)}`,
        em_garantia: data.em_garantia !== undefined ? data.em_garantia : true,
        status: data.id_tecnico_atribuido ? 'Agendado' : 'Aberto',
      })
      .then((created) => {
        // Atualiza com id real do banco se retornado
        if (created?.id_os && created.id_os !== nextId) {
          novaOS.id_os = created.id_os;
          this.saveChamados(list);
          this.notifyListeners();
        }
      })
      .catch(() => {});

    return novaOS;
  }

  static atualizarOrdemServico(id_os: number, updates: Partial<OrdemServico>): OrdemServico {
    const list = this.getStoredChamados();
    const idx = list.findIndex((o) => o.id_os === id_os);
    if (idx < 0) throw new Error('Ordem de serviço não encontrada.');

    if (updates.id_tecnico_atribuido) {
      const tecnicos = this.listarTecnicos();
      const tec = tecnicos.find((t) => t.id_tecnico === Number(updates.id_tecnico_atribuido));
      if (tec) updates.tecnico = tec;
    }

    if (updates.id_cliente) {
      const clientes = this.listarClientes();
      const cli = clientes.find((c) => c.id_cliente === Number(updates.id_cliente));
      if (cli) updates.cliente = cli;
    }

    list[idx] = { ...list[idx], ...updates };
    this.saveChamados(list);

    // Sync com FastAPI
    const apiPayload: any = {};
    if (updates.id_cliente) apiPayload.id_cliente = updates.id_cliente;
    if (updates.descricao_cliente) apiPayload.descricao_cliente = updates.descricao_cliente;
    if (updates.id_tecnico_atribuido !== undefined) apiPayload.id_tecnico_atribuido = updates.id_tecnico_atribuido;
    if (updates.status) apiPayload.status = updates.status;
    if (updates.data_agendamento) apiPayload.data_agendamento = updates.data_agendamento.split(' ')[0];

    apiClient.updateChamado(id_os, apiPayload).catch(() => {});
    this.notifyListeners();
    return list[idx];
  }

  static excluirOrdemServico(id_os: number): boolean {
    const list = this.getStoredChamados();
    const filtered = list.filter((o) => o.id_os !== id_os);
    this.saveChamados(filtered);

    apiClient.deleteChamado(id_os).catch(() => {});
    this.notifyListeners();
    return true;
  }

  static cancelarChamado(id_os: number, motivo?: string): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os) throw new Error('OS não encontrada.');

    os.status = 'CANCELADO';
    os.is_cancelled = true;
    if (motivo) {
      os.descricao_cliente = (os.descricao_cliente ? os.descricao_cliente + ' | ' : '') + `[CANCELAMENTO]: ${motivo}`;
    }
    this.saveChamados(list);

    apiClient.deleteChamado(id_os).catch(() => {});
    this.notifyListeners();
    return os;
  }

  static atribuirTecnico(id_os: number, id_tecnico: number): OrdemServico {
    const tecnicos = this.listarTecnicos();
    const tec = tecnicos.find((t) => t.id_tecnico === Number(id_tecnico));
    if (!tec) throw new Error('Técnico não encontrado.');

    return this.atualizarOrdemServico(id_os, {
      id_tecnico_atribuido: id_tecnico,
      tecnico: tec,
      status: 'AGENDADO',
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

    // Sync com FastAPI
    if (visita.id_visita) {
      apiClient.iniciarDeslocamento(id_os, visita.id_visita, 'ida', kmInicio).catch(() => {});
    }

    this.notifyListeners();
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

    // Sync com FastAPI
    if (visita.id_visita) {
      apiClient.finalizarDeslocamento(id_os, visita.id_visita, 'ida', kmFimIda || visita.km_inicio_ida || 0).catch(() => {});
      apiClient.iniciarAtendimentoVisita(id_os, visita.id_visita).catch(() => {});
    }

    this.notifyListeners();
    return os;
  }

  static pausarVisita(id_os: number, motivo: MotivoPausa, detalhe?: string): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os || !os.visitas?.[0]) throw new Error('OS ou Visita não encontrada.');

    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const visita = os.visitas[0];

    visita.pausas = visita.pausas || [];
    visita.pausas.push({
      id_pausa: 'p_' + Date.now(),
      motivo,
      detalhe,
      hora_inicio: horaAtual,
    });

    os.status = 'PAUSADO';
    this.saveChamados(list);

    if (visita.id_visita) {
      apiClient.pausarVisita(id_os, visita.id_visita, motivo, detalhe).catch(() => {});
    }

    this.notifyListeners();
    return os;
  }

  static retomarVisita(id_os: number): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os || !os.visitas?.[0]) throw new Error('OS ou Visita não encontrada.');

    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const visita = os.visitas[0];

    if (visita.pausas && visita.pausas.length > 0) {
      const últimaPausa = visita.pausas[visita.pausas.length - 1];
      if (últimaPausa && !últimaPausa.hora_fim) {
        últimaPausa.hora_fim = horaAtual;
      }
    }

    os.status = 'EM_ATENDIMENTO';
    this.saveChamados(list);

    apiClient.iniciarAtendimentoChamado(id_os).catch(() => {});
    this.notifyListeners();
    return os;
  }

  static adicionarOuAtualizarServicoEquipamento(id_os: number, servico: ServicoEquipamento): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os || !os.visitas?.[0]) throw new Error('OS ou Visita não encontrada.');

    const visita = os.visitas[0];
    visita.servicos_realizados = visita.servicos_realizados || [];
    const idx = visita.servicos_realizados.findIndex(
      (s) => (s.id_servico && s.id_servico === servico.id_servico) || s.id_servico_equipamento === servico.id_servico_equipamento
    );

    if (idx >= 0) {
      visita.servicos_realizados[idx] = servico;
      if (visita.id_visita && servico.id_servico) {
        apiClient.updateServicoEquipamento(id_os, visita.id_visita, servico.id_servico, {
          nome_equipamento: servico.nome_equipamento,
          numero_serie_atendido: servico.numero_serie_atendido || servico.numero_serie,
          defeitos_principais: servico.defeitos_principais || [],
          materiais_utilizados: (servico.materiais || []).map((m) => ({
            nome: m.nome || m.descricao,
            quantidade: m.quantidade,
            valor: m.valor || m.valor_unitario || 0,
          })),
        }).catch(() => {});
      }
    } else {
      servico.id_servico_equipamento = Date.now();
      visita.servicos_realizados.push(servico);
      if (visita.id_visita) {
        apiClient.createServicoEquipamento(id_os, visita.id_visita, {
          nome_equipamento: servico.nome_equipamento,
          numero_serie_atendido: servico.numero_serie_atendido || servico.numero_serie || `SN-${Date.now()}`,
          defeitos_principais: servico.defeitos_principais || ['Refrigeração'],
          materiais_utilizados: (servico.materiais || []).map((m) => ({
            nome: m.nome || m.descricao,
            quantidade: m.quantidade,
            valor: m.valor || m.valor_unitario || 0,
          })),
        }).catch(() => {});
      }
    }

    this.saveChamados(list);
    this.notifyListeners();
    return os;
  }

  static adicionarFotoServico(id_os: number, id_servico_equipamento: number, foto: FotoServico): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os || !os.visitas?.[0]) throw new Error('OS ou Visita não encontrada.');

    const visita = os.visitas[0];
    const eq = (visita.servicos_realizados || []).find((s) => s.id_servico_equipamento === id_servico_equipamento || s.id_servico === id_servico_equipamento);
    if (eq) {
      eq.fotos = eq.fotos || [];
      eq.fotos.push(foto);
    }

    this.saveChamados(list);
    this.notifyListeners();
    return os;
  }

  static adicionarComprovante(id_os: number, comprovante: ComprovanteCusto): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os || !os.visitas?.[0]) throw new Error('OS ou Visita não encontrada.');

    const visita = os.visitas[0];
    visita.comprovantes = visita.comprovantes || [];
    visita.comprovantes.push(comprovante);

    if (comprovante.tipo === 'pedagio') {
      visita.valor_pedagio = (visita.valor_pedagio || 0) + comprovante.valor;
    } else if (comprovante.tipo === 'frete') {
      visita.valor_frete_devolucao = (visita.valor_frete_devolucao || 0) + comprovante.valor;
    }

    this.saveChamados(list);
    this.notifyListeners();
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
    const diffIda = visita.km_fim_ida && visita.km_inicio_ida ? visita.km_fim_ida - visita.km_inicio_ida : 0;
    visita.km_total = (diffIda > 0 ? diffIda : 0) + (diffVolta > 0 ? diffVolta : 0);

    this.saveChamados(list);

    if (visita.id_visita) {
      apiClient.iniciarDeslocamento(id_os, visita.id_visita, 'volta', kmInicioVolta).catch(() => {});
      apiClient.finalizarDeslocamento(id_os, visita.id_visita, 'volta', kmFimVolta).catch(() => {});
    }

    this.notifyListeners();
    return os;
  }

  static salvarAssinatura(id_os: number, assinatura: AssinaturaCliente): OrdemServico {
    const list = this.getStoredChamados();
    const os = list.find((item) => item.id_os === id_os);
    if (!os) throw new Error('OS não encontrada.');

    os.assinatura = assinatura;
    this.saveChamados(list);

    const visita = os.visitas?.[0];
    if (visita?.id_visita) {
      apiClient.finalizarAtendimentoComAssinatura(
        id_os,
        visita.id_visita,
        assinatura.nome_responsavel,
        assinatura.documento,
        assinatura.assinatura_url
      ).catch(() => {});
    }

    this.notifyListeners();
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

    apiClient.concluirChamado(id_os).catch(() => {});
    this.notifyListeners();
    return os;
  }

  // --- CÁLCULO DE CUSTOS (ENDPOINTS /api/chamados/{id}/custos) ---
  static async calcularCustos(id_os: number): Promise<CustoTotalResponse | null> {
    try {
      return await apiClient.getCustosChamado(id_os);
    } catch (e) {
      console.warn('Erro ao calcular custos via API:', e);
      return null;
    }
  }

  // --- ESTADO DA VISITA (ENDPOINTS /api/chamados/{id}/visitas/{visita_id}/estado) ---
  static async getEstadoVisita(id_os: number, visita_id: number): Promise<EstadoVisitaResponse | null> {
    try {
      return await apiClient.getEstadoVisita(id_os, visita_id);
    } catch {
      return null;
    }
  }
}
