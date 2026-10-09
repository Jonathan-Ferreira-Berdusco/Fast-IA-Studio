import {
  OrdemServico,
  Tecnico,
  Cliente,
  ServicoEquipamento,
  EstadoVisitaResponse,
  CustoTotalResponse,
  Visita,
} from '../types';
import { apiClient } from './apiClient';

const STORAGE_KEY_AUTH = 'fast_ariam_auth_user_v1';
const STORAGE_KEY_CHAMADOS = 'fast_ariam_chamados_cache_v2';

export class ChamadoService {
  private static listeners: Array<() => void> = [];
  private static isApiOnline = false;
  private static lastChamadosError: string | null = null;

  static getLastChamadosError(): string | null {
    return this.lastChamadosError;
  }

  // Cache em memória de chamados para recuperação instantânea
  private static memoryChamados: OrdemServico[] = [];

  // --- SUBSCRIBER SYSTEM FOR REACTIVE REFRESH ---
  static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  static notifyListeners(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Erro no listener:', err);
      }
    });
  }

  // --- STATUS DE CONECTIVIDADE COM O BACKEND FASTAPI ---
  static getIsApiOnline(): boolean {
    return this.isApiOnline;
  }

  static async checkApiHealth(): Promise<boolean> {
    try {
      await apiClient.checkHealth();
      this.isApiOnline = true;
      return true;
    } catch {
      this.isApiOnline = false;
      return false;
    }
  }

  static async syncWithBackend(): Promise<boolean> {
    const prev = this.isApiOnline;
    const online = await this.checkApiHealth();
    this.isApiOnline = online;

    if (prev !== online) {
      this.notifyListeners();
    }
    return online;
  }

  // Permite reparar manualmente o cadastro do técnico mestre via UI caso o backend apresente erro 500
  static async repararPerfilTecnicoNoBackend(id: number = 1): Promise<void> {
    await apiClient.repairTecnicoProfile(id);
    this.notifyListeners();
  }

  // --- AUTENTICAÇÃO REAL ---
  static getTecnicoLogado(): Tecnico | null {
    const token = apiClient.getToken();
    if (!token) return null;

    const decoded = apiClient.decodeToken(token);
    if (!decoded) {
      apiClient.clearToken();
      return null;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH);
      if (stored) {
        const parsed = JSON.parse(stored) as Tecnico;
        if (parsed.id_tecnico === decoded.user_id) {
          return parsed;
        }
      }
    } catch {
      // Fallback to decoded token data
    }

    const isSystemAdmin = decoded.role === 'admin';
    const rawUsername = decoded.sub.includes('@') ? decoded.sub.split('@')[0] : decoded.sub;
    const formattedName = rawUsername.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      id_tecnico: decoded.user_id,
      nome: formattedName || 'Usuário',
      email: decoded.sub,
      cpf: '',
      telefone: '',
      role: decoded.role || 'tecnico',
      is_active: true,
      especialidade: isSystemAdmin ? 'Administrador do Sistema' : 'Técnico Especialista',
    };
  }

  static async loginWithCredentials(username: string, password: string): Promise<Tecnico> {
    const tokenResp = await apiClient.login(username, password);
    const decoded = apiClient.decodeToken(tokenResp.access_token);

    if (!decoded) {
      throw new Error('Token JWT retornado pelo servidor é inválido.');
    }

    const isSystemAdmin = decoded.role === 'admin';
    const rawUsername = decoded.sub.includes('@') ? decoded.sub.split('@')[0] : decoded.sub;
    const formattedName = rawUsername.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    let user: Tecnico = {
      id_tecnico: decoded.user_id,
      nome: formattedName || 'Usuário',
      email: decoded.sub,
      cpf: '',
      telefone: '',
      role: decoded.role,
      is_active: true,
      especialidade: isSystemAdmin ? 'Administrador do Sistema' : 'Técnico Especialista',
    };

    // Apenas se for técnico de campo (não admin), busca perfil complementar no backend
    if (!isSystemAdmin) {
      try {
        const tec = await apiClient.getTecnico(decoded.user_id);
        if (tec && tec.id_tecnico) {
          user = {
            ...user,
            ...tec,
            role: 'tecnico',
          };
        }
      } catch {
        // Se o técnico no backend ainda não possuir campos opcionais (telefone ou dados bancários)
        // preenchidos no banco, mantemos os dados do token sem falhar a autenticação
      }
    }

    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    this.isApiOnline = true;
    this.notifyListeners();
    return user;
  }

  static logout(): void {
    apiClient.clearToken();
    localStorage.removeItem(STORAGE_KEY_AUTH);
    this.notifyListeners();
  }

  static async alterarSenha(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.updateCurrentPassword(oldPassword, newPassword);
  }

  // --- CLIENTES CRUD REAL ---
  static async listarClientes(isActive?: boolean): Promise<Cliente[]> {
    const list = await apiClient.getClientes(isActive);
    return (list || []).map((c: any) => ({
      ...c,
      nome_fantasia: c.razao_social,
      contato_responsavel: c.contato_principal_nome || 'Responsável',
      cnpj_cpf: c.codigo ? `Cód. ${c.codigo}` : '',
    }));
  }

  static async getClientePorId(id: number): Promise<Cliente> {
    const c = await apiClient.getCliente(id);
    return {
      ...c,
      nome_fantasia: c.razao_social,
      contato_responsavel: c.contato_principal_nome || 'Responsável',
      cnpj_cpf: c.codigo ? `Cód. ${c.codigo}` : '',
    };
  }

  static async salvarCliente(clienteData: Partial<Cliente>): Promise<Cliente> {
    const payload = {
      razao_social: clienteData.razao_social || clienteData.nome_fantasia || '',
      codigo: clienteData.codigo ? Number(clienteData.codigo) : Math.floor(10000 + Math.random() * 90000),
      contato_principal_nome: clienteData.contato_principal_nome || clienteData.contato_responsavel || '',
      contato_principal_telefone: clienteData.contato_principal_telefone || clienteData.telefone || '',
      telefone: clienteData.telefone || '',
      endereco: clienteData.endereco || '',
      numero: clienteData.numero || '',
      bairro: clienteData.bairro || '',
      cidade: clienteData.cidade || '',
      uf: (clienteData.uf || 'SP').slice(0, 2).toUpperCase(),
      is_active: clienteData.is_active !== false,
    };

    let result: Cliente;
    if (clienteData.id_cliente) {
      result = await apiClient.updateCliente(clienteData.id_cliente, payload);
    } else {
      result = await apiClient.createCliente(payload);
    }

    this.notifyListeners();
    return {
      ...result,
      nome_fantasia: result.razao_social,
      contato_responsavel: result.contato_principal_nome,
    };
  }

  static async excluirCliente(id_cliente: number): Promise<void> {
    await apiClient.deleteCliente(id_cliente);
    this.notifyListeners();
  }

  static async alternarStatusCliente(id_cliente: number, is_active: boolean): Promise<void> {
    try {
      await apiClient.updateCliente(id_cliente, { is_active });
    } catch {
      if (!is_active) {
        await apiClient.deleteCliente(id_cliente);
      }
    }
    this.notifyListeners();
  }

  // --- TECNICOS CRUD REAL ---
  static async listarTecnicos(isActive?: boolean): Promise<Tecnico[]> {
    try {
      const list = await apiClient.getTecnicos(isActive);
      return (list || []).map((t: any) => ({
        ...t,
        especialidade: t.role === 'admin' ? 'Administrador do Sistema' : 'Técnico Especialista FAST',
      }));
    } catch (err: any) {
      console.warn('Não foi possível obter a lista de técnicos do backend FastAPI:', err);
      return [];
    }
  }

  static async getTecnicoPorId(id: number): Promise<Tecnico> {
    return apiClient.getTecnico(id);
  }

  static async salvarTecnico(tecnicoData: any): Promise<Tecnico> {
    let result: Tecnico;

    if (tecnicoData.id_tecnico) {
      const updatePayload: any = {
        nome: tecnicoData.nome,
        email: tecnicoData.email,
        cpf: tecnicoData.cpf,
        telefone: tecnicoData.telefone,
        cnpj: tecnicoData.cnpj,
        inscricao_estadual: tecnicoData.inscricao_estadual,
        role: tecnicoData.role,
        is_active: tecnicoData.is_active,
        dados_bancarios: tecnicoData.dados_bancarios,
      };
      result = await apiClient.updateTecnico(tecnicoData.id_tecnico, updatePayload);
    } else {
      const createPayload = {
        nome: tecnicoData.nome,
        email: tecnicoData.email,
        cpf: tecnicoData.cpf,
        cnpj: tecnicoData.cnpj,
        inscricao_estadual: tecnicoData.inscricao_estadual,
        telefone: tecnicoData.telefone,
        password: tecnicoData.password || 'senha123',
        role: tecnicoData.role || 'tecnico',
        is_active: true,
        dados_bancarios: tecnicoData.dados_bancarios || {
          banco: tecnicoData.banco || 'Banco do Brasil',
          agencia: tecnicoData.agencia || '0001',
          conta: tecnicoData.conta || '12345-6',
          pix: tecnicoData.pix || tecnicoData.email,
        },
      };
      result = await apiClient.createTecnico(createPayload);
    }

    this.notifyListeners();
    return result;
  }

  static async excluirTecnico(id_tecnico: number): Promise<void> {
    await apiClient.deleteTecnico(id_tecnico);
    this.notifyListeners();
  }

  static async alternarStatusTecnico(id_tecnico: number, is_active: boolean): Promise<void> {
    try {
      await apiClient.updateTecnico(id_tecnico, { is_active });
    } catch {
      if (!is_active) {
        await apiClient.deleteTecnico(id_tecnico);
      }
    }
    this.notifyListeners();
  }

  // --- CHAMADOS (ORDENS DE SERVIÇO) CRUD REAL ---
  static async listarChamados(
    filterStatusOrIsCancelled?: boolean | string,
    search?: string,
    clientesExistentes?: Cliente[],
    tecnicosExistentes?: Tecnico[]
  ): Promise<OrdemServico[]> {
    const isCancelledArg =
      typeof filterStatusOrIsCancelled === 'boolean' ? filterStatusOrIsCancelled : undefined;

    let rawChamados: any[] = [];
    const [rawResult, clientes, tecnicos] = await Promise.all([
      apiClient
        .getChamados(isCancelledArg)
        .then((res) => {
          this.lastChamadosError = null;
          return res;
        })
        .catch((err) => {
          console.warn('Falha ao obter lista de chamados da API FastAPI:', err);
          const detail =
            err?.detail ||
            err?.message ||
            'Erro 500 no backend FastAPI ao consultar /api/chamados/ (validação Pydantic de Visita)';
          this.lastChamadosError = detail;
          return null;
        }),
      clientesExistentes ? Promise.resolve(clientesExistentes) : this.listarClientes().catch(() => []),
      tecnicosExistentes ? Promise.resolve(tecnicosExistentes) : this.listarTecnicos().catch(() => []),
    ]);

    if (rawResult === null) {
      // Se a API retornou erro (ex: 500 no Pydantic), carrega do cache persistido
      if (this.memoryChamados.length > 0) {
        return this.memoryChamados;
      }
      try {
        const cached = localStorage.getItem(STORAGE_KEY_CHAMADOS);
        if (cached) {
          this.memoryChamados = JSON.parse(cached);
          return this.memoryChamados;
        }
      } catch {}
      return [];
    }

    rawChamados = rawResult || [];

    let list: OrdemServico[] = rawChamados.map((item: any) => {
      const id_os = Number(item.id_os || item.id || 1);
      const id_cliente = Number(item.id_cliente || item.cliente_id || (item.cliente ? item.cliente.id || item.cliente.id_cliente : 1));
      const clienteObj = typeof item.cliente === 'object' && item.cliente !== null ? item.cliente : null;

      const cliente =
        clienteObj ||
        clientes.find((c) => Number(c.id_cliente) === id_cliente) || {
          id_cliente,
          razao_social: item.cliente_nome || `Cliente #${id_cliente}`,
          nome_fantasia: item.cliente_nome || `Cliente #${id_cliente}`,
          telefone: '',
          endereco: '',
          numero: '',
          bairro: '',
          cidade: '',
          uf: '',
        };

      const id_tecnico = item.id_tecnico_atribuido || item.tecnico_id ? Number(item.id_tecnico_atribuido || item.tecnico_id) : null;
      const tecnico = id_tecnico
        ? tecnicos.find((t) => Number(t.id_tecnico) === id_tecnico)
        : undefined;

      const year = item.data_abertura ? new Date(item.data_abertura).getFullYear() : new Date().getFullYear();
      const codigo_os = item.codigo_os || `OS-${year}-${String(id_os).padStart(4, '0')}`;

      return {
        id_os,
        codigo_os,
        id_cliente,
        cliente,
        cliente_nome: item.cliente_nome || cliente.razao_social,
        id_tecnico_atribuido: id_tecnico,
        tecnico,
        status: item.status || 'Aberto',
        is_cancelled: item.is_cancelled || false,
        prioridade: item.prioridade || 'Média',
        data_abertura: item.data_abertura || '',
        data_agendamento: item.data_agendamento || '',
        data_conclusao: item.data_conclusao || '',
        descricao_cliente: item.descricao_cliente || item.descricao || '',
        pedido: item.pedido || '',
        data_faturamento: item.data_faturamento,
        em_garantia: item.em_garantia !== false,
        assinatura_cliente_url: item.assinatura_cliente_url || item.assinatura_url,
        visitas: (item.visitas || []).map((v: any) => ({
          ...v,
          id_visita: v.id_visita || v.id || 1,
          id_os: v.id_os || v.chamado_id || id_os,
          pausas: v.pausas || [],
          comprovantes: v.comprovantes || [],
          servicos_realizados: (v.servicos_realizados || []).map((s: any) => ({
            ...s,
            id_servico_equipamento: s.id_servico || s.id,
            id_servico: s.id_servico || s.id,
            nome_equipamento: s.nome_equipamento || s.numero_serie_atendido || 'Equipamento',
            numero_serie: s.numero_serie || s.numero_serie_atendido,
            numero_serie_atendido: s.numero_serie_atendido || s.numero_serie,
            materiais: (s.materiais_utilizados || s.materiais || []).map((m: any) => ({
              ...m,
              descricao: m.descricao || m.nome || 'Peça',
              nome: m.nome || m.descricao || 'Peça',
              valor_unitario: m.valor_unitario || m.valor || 0,
              valor: m.valor || m.valor_unitario || 0,
              quantidade: m.quantidade || 1,
            })),
          })),
        })),
      };
    });

    // Atualiza cache em memória e persistência local
    this.memoryChamados = list;
    try {
      localStorage.setItem(STORAGE_KEY_CHAMADOS, JSON.stringify(list));
    } catch {}

    // Optional status string filter (e.g. 'EM_ATENDIMENTO', 'PAUSADO')
    if (typeof filterStatusOrIsCancelled === 'string' && filterStatusOrIsCancelled !== 'TODOS') {
      const target = filterStatusOrIsCancelled.toUpperCase().replace(/\s+/g, '_');
      list = list.filter((item) => {
        const itemStatus = String(item.status).toUpperCase().replace(/\s+/g, '_');
        return itemStatus === target;
      });
    }

    // Optional text search filter
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.codigo_os.toLowerCase().includes(q) ||
          item.cliente.razao_social.toLowerCase().includes(q) ||
          (item.descricao_cliente && item.descricao_cliente.toLowerCase().includes(q)) ||
          (item.cliente.cidade && item.cliente.cidade.toLowerCase().includes(q))
      );
    }

    return list;
  }

  static async getChamadoPorId(id_os: number): Promise<OrdemServico> {
    const numId = Number(id_os);
    try {
      const [raw, clientes, tecnicos] = await Promise.all([
        apiClient.getChamado(numId),
        this.listarClientes().catch(() => []),
        this.listarTecnicos().catch(() => []),
      ]);

      const osId = Number(raw.id_os || raw.id || numId);
      const clienteId = Number(raw.id_cliente || raw.cliente_id || (raw.cliente ? raw.cliente.id || raw.cliente.id_cliente : 1));
      const clienteObj = typeof raw.cliente === 'object' && raw.cliente !== null ? raw.cliente : null;

      const cliente =
        clienteObj ||
        clientes.find((c) => Number(c.id_cliente) === clienteId) || {
          id_cliente: clienteId,
          razao_social: raw.cliente_nome || `Cliente #${clienteId}`,
          nome_fantasia: raw.cliente_nome || `Cliente #${clienteId}`,
          telefone: '',
          endereco: '',
          numero: '',
          bairro: '',
          cidade: '',
          uf: '',
        };

      const id_tecnico = raw.id_tecnico_atribuido || raw.tecnico_id ? Number(raw.id_tecnico_atribuido || raw.tecnico_id) : null;
      const tecnico = id_tecnico
        ? tecnicos.find((t) => Number(t.id_tecnico) === id_tecnico)
        : undefined;

      const year = raw.data_abertura ? new Date(raw.data_abertura).getFullYear() : new Date().getFullYear();
      const codigo_os = raw.codigo_os || `OS-${year}-${String(osId).padStart(4, '0')}`;

      const os: OrdemServico = {
        id_os: osId,
        codigo_os,
        id_cliente: clienteId,
        cliente,
        cliente_nome: raw.cliente_nome || cliente.razao_social,
        id_tecnico_atribuido: id_tecnico,
        tecnico,
        status: raw.status || 'Aberto',
        is_cancelled: raw.is_cancelled || false,
        prioridade: raw.prioridade || 'Média',
        data_abertura: raw.data_abertura || '',
        data_agendamento: raw.data_agendamento || '',
        data_conclusao: raw.data_conclusao || '',
        descricao_cliente: raw.descricao_cliente || raw.descricao || '',
        pedido: raw.pedido || '',
        data_faturamento: raw.data_faturamento,
        em_garantia: raw.em_garantia !== false,
        assinatura_cliente_url: raw.assinatura_cliente_url || raw.assinatura_url,
        visitas: (raw.visitas || []).map((v: any) => ({
          ...v,
          id_visita: Number(v.id_visita || v.id || 1),
          id_os: Number(v.id_os || v.chamado_id || osId),
          pausas: v.pausas || [],
          comprovantes: v.comprovantes || [],
          servicos_realizados: (v.servicos_realizados || []).map((s: any) => ({
            ...s,
            id_servico_equipamento: s.id_servico || s.id,
            id_servico: s.id_servico || s.id,
            nome_equipamento: s.nome_equipamento || s.numero_serie_atendido || 'Equipamento',
            numero_serie: s.numero_serie || s.numero_serie_atendido,
            numero_serie_atendido: s.numero_serie_atendido || s.numero_serie,
            materiais: (s.materiais_utilizados || s.materiais || []).map((m: any) => ({
              ...m,
              descricao: m.descricao || m.nome || 'Peça',
              nome: m.nome || m.descricao || 'Peça',
              valor_unitario: m.valor_unitario || m.valor || 0,
              valor: m.valor || m.valor_unitario || 0,
              quantidade: m.quantidade || 1,
            })),
          })),
        })),
      };

      const idx = this.memoryChamados.findIndex((c) => Number(c.id_os) === os.id_os);
      if (idx >= 0) this.memoryChamados[idx] = os;
      else this.memoryChamados.push(os);

      return os;
    } catch (err: any) {
      console.warn(`Aviso: falha ao buscar detalhes do chamado #${numId} da API:`, err);
      const cached = this.memoryChamados.find((c) => Number(c.id_os) === numId);
      if (cached) return cached;
      try {
        const stored = localStorage.getItem(STORAGE_KEY_CHAMADOS);
        if (stored) {
          const parsed = JSON.parse(stored) as OrdemServico[];
          const found = parsed.find((c) => Number(c.id_os) === numId);
          if (found) return found;
        }
      } catch {}
      throw err;
    }
  }

  static async criarOrdemServico(data: {
    id_cliente: number;
    id_tecnico_atribuido?: number | null;
    prioridade?: string;
    data_agendamento?: string;
    descricao_cliente: string;
    equipamento_nome?: string;
    equipamento_modelo?: string;
    equipamento_serie?: string;
    em_garantia?: boolean;
    pedido?: string;
  }): Promise<OrdemServico> {
    const payload = {
      id_cliente: Number(data.id_cliente),
      descricao_cliente: data.descricao_cliente,
      id_tecnico_atribuido: data.id_tecnico_atribuido ? Number(data.id_tecnico_atribuido) : null,
      data_agendamento: data.data_agendamento ? data.data_agendamento.split(' ')[0] : null,
      pedido: data.pedido || null,
      em_garantia: data.em_garantia !== undefined ? data.em_garantia : true,
    };

    const created = await apiClient.createChamado(payload);
    const createdId = created?.id_os || created?.id || 1;

    // If equipment specified, create initial visit with equipment
    if (data.equipamento_nome && createdId) {
      try {
        const dataHoje = new Date().toISOString().split('T')[0];
        await apiClient.createVisita(createdId, {
          data_visita: dataHoje,
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
      } catch (err) {
        console.warn('Erro ao criar visita com equipamento inicial:', err);
      }
    }

    this.notifyListeners();
    return this.getChamadoPorId(createdId);
  }

  static async atualizarOrdemServico(id_os: number, updates: any): Promise<OrdemServico> {
    const apiPayload: any = {};
    if (updates.id_cliente !== undefined) apiPayload.id_cliente = Number(updates.id_cliente);
    if (updates.id_tecnico_atribuido !== undefined) {
      apiPayload.id_tecnico_atribuido = updates.id_tecnico_atribuido ? Number(updates.id_tecnico_atribuido) : null;
    }
    if (updates.descricao_cliente !== undefined) apiPayload.descricao_cliente = updates.descricao_cliente;
    if (updates.data_agendamento !== undefined) {
      apiPayload.data_agendamento = updates.data_agendamento ? updates.data_agendamento.split(' ')[0] : null;
    }
    if (updates.pedido !== undefined) apiPayload.pedido = updates.pedido;
    if (updates.em_garantia !== undefined) apiPayload.em_garantia = updates.em_garantia;
    if (updates.status !== undefined) apiPayload.status = updates.status;

    await apiClient.updateChamado(id_os, apiPayload);
    this.notifyListeners();
    return this.getChamadoPorId(id_os);
  }

  static async atribuirTecnico(id_os: number, id_tecnico: number): Promise<OrdemServico> {
    await apiClient.updateChamado(id_os, {
      id_tecnico_atribuido: Number(id_tecnico),
      status: 'AGENDADO',
    });
    this.notifyListeners();
    try {
      return await this.getChamadoPorId(id_os);
    } catch {
      const mem = this.memoryChamados.find((c) => c.id_os === id_os);
      if (mem) {
        mem.id_tecnico_atribuido = Number(id_tecnico);
        mem.status = 'AGENDADO';
        return mem;
      }
      return this.getChamadoPorId(id_os);
    }
  }

  static async excluirOrdemServico(id_os: number): Promise<void> {
    await apiClient.deleteChamado(id_os);
    this.notifyListeners();
  }

  static async cancelarChamado(id_os: number, motivo?: string): Promise<OrdemServico> {
    if (motivo) {
      const chamadoAtual = await apiClient.getChamado(id_os).catch(() => null);
      const desc = chamadoAtual?.descricao_cliente
        ? `${chamadoAtual.descricao_cliente} | [CANCELAMENTO]: ${motivo}`
        : `[CANCELAMENTO]: ${motivo}`;
      await apiClient.updateChamado(id_os, { descricao_cliente: desc, status: 'CANCELADO' }).catch(() => {});
    }
    await apiClient.deleteChamado(id_os);
    this.notifyListeners();
    return this.getChamadoPorId(id_os);
  }

  static async reagendarChamado(id_os: number, visitaData: any): Promise<any> {
    const res = await apiClient.reagendarChamado(id_os, visitaData);
    this.notifyListeners();
    return res;
  }

  static async concluirChamado(id_os: number, observacoes?: string): Promise<OrdemServico> {
    if (observacoes) {
      try {
        const chamadoAtual = await apiClient.getChamado(id_os);
        const desc = chamadoAtual?.descricao_cliente
          ? `${chamadoAtual.descricao_cliente} | [CONCLUSAO]: ${observacoes}`
          : `[CONCLUSAO]: ${observacoes}`;
        await apiClient.updateChamado(id_os, { descricao_cliente: desc });
      } catch {
        // Continuar para concluir
      }
    }
    await apiClient.concluirChamado(id_os);
    this.notifyListeners();
    try {
      return await this.getChamadoPorId(id_os);
    } catch {
      const mem = this.memoryChamados.find((c) => c.id_os === id_os);
      if (mem) {
        mem.status = 'CONCLUIDO';
        return mem;
      }
      return this.getChamadoPorId(id_os);
    }
  }

  static async calcularCustos(id_os: number): Promise<CustoTotalResponse> {
    return apiClient.getCustosChamado(id_os);
  }

  // --- VISITAS & DESLOCAMENTO WORKFLOW REAL ---
  static async ensureActiveVisita(id_os: number): Promise<Visita> {
    const numId = Number(id_os);
    const chamado = await this.getChamadoPorId(numId).catch(() => null);
    if (chamado?.visitas && chamado.visitas.length > 0) {
      return chamado.visitas[0];
    }

    const dataHoje = new Date().toISOString().split('T')[0];
    try {
      const created = await apiClient.createVisita(numId, {
        data_visita: dataHoje,
        descricao_servico_executado: 'Atendimento Técnico de Campo',
      });
      if (created) return created;
    } catch (err: any) {
      console.warn('Aviso ao criar visita no backend:', err);
    }

    // Tenta inicializar visita via iniciar-atendimento
    try {
      await apiClient.iniciarAtendimentoChamado(numId);
      const reloaded = await this.getChamadoPorId(numId).catch(() => null);
      if (reloaded?.visitas && reloaded.visitas.length > 0) {
        return reloaded.visitas[0];
      }
    } catch {}

    const fallbackVisita: Visita = {
      id_visita: 1,
      id_os: numId,
      data_visita: dataHoje,
    };

    if (chamado) {
      if (!chamado.visitas) chamado.visitas = [];
      chamado.visitas.push(fallbackVisita);
    }

    return fallbackVisita;
  }

  static async getEstadoVisita(id_os: number, visita_id: number): Promise<EstadoVisitaResponse> {
    return apiClient.getEstadoVisita(Number(id_os), Number(visita_id));
  }

  static async iniciarDeslocamento(
    id_os: number,
    visita_id: number,
    tipo: 'ida' | 'volta',
    kmInicio: number,
    fotoFile?: File | Blob
  ): Promise<any> {
    const numId = Number(id_os);
    const numVisitaId = Number(visita_id);
    let res: any = null;
    try {
      res = await apiClient.iniciarDeslocamento(numId, numVisitaId, tipo, Number(kmInicio), fotoFile);
    } catch (err: any) {
      console.warn('Aviso na API ao iniciar deslocamento:', err);
    }

    if (fotoFile) {
      await apiClient.uploadDeslocamentoFoto(numId, numVisitaId, tipo, 'inicio', fotoFile).catch((e) => {
        console.warn('Aviso ao enviar foto de início de deslocamento:', e);
      });
    }

    this.notifyListeners();
    return res;
  }

  static async iniciarDeslocamentoIda(
    id_os: number,
    km: number,
    fotoFile?: File | Blob
  ): Promise<OrdemServico> {
    const numId = Number(id_os);
    const chamadoAtual = await this.getChamadoPorId(numId).catch(() => null);

    // 1. Só auto-atribui técnico se o chamado não tiver técnico atribuído E o usuário logado for TÉCNICO (nunca admin)
    const user = this.getTecnicoLogado();
    if (user && user.role === 'tecnico' && (!chamadoAtual?.id_tecnico_atribuido || chamadoAtual.id_tecnico_atribuido === 0)) {
      await this.atribuirTecnico(numId, Number(user.id_tecnico)).catch(() => {});
    }

    // 2. Garante visita ativa
    const visita = await this.ensureActiveVisita(numId);
    const numVisitaId = Number(visita?.id_visita || 1);

    // 3. Executa início de deslocamento
    await this.iniciarDeslocamento(numId, numVisitaId, 'ida', Number(km), fotoFile);

    // 4. Se houver foto do odômetro, envia ao endpoint
    if (fotoFile) {
      await apiClient.uploadDeslocamentoFoto(numId, numVisitaId, 'ida', 'inicio', fotoFile).catch((e) => {
        console.warn('Aviso ao enviar foto do odômetro inicial:', e);
      });
    }

    // 5. Atualiza estado em memória e sincroniza imediatamente
    const horaAgora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    let mem = this.memoryChamados.find((c) => Number(c.id_os) === numId) || chamadoAtual;
    if (mem) {
      mem.status = 'EM_ATENDIMENTO';
      if (!mem.visitas) mem.visitas = [];
      if (mem.visitas.length === 0) {
        mem.visitas.push({ id_visita: numVisitaId, id_os: numId, data_visita: new Date().toISOString().split('T')[0] });
      }
      mem.visitas[0].km_inicio_ida = Number(km);
      mem.visitas[0].hora_inicio_ida = horaAgora;
      mem.visitas[0].hora_inicio_deslocamento = horaAgora;

      const idx = this.memoryChamados.findIndex((c) => Number(c.id_os) === numId);
      if (idx >= 0) this.memoryChamados[idx] = mem;
      else this.memoryChamados.push(mem);

      try {
        localStorage.setItem(STORAGE_KEY_CHAMADOS, JSON.stringify(this.memoryChamados));
      } catch {}

      this.notifyListeners();
    }

    try {
      const refreshed = await this.getChamadoPorId(numId);
      return refreshed;
    } catch {
      if (mem) return mem;
      return (
        chamadoAtual || {
          id_os: numId,
          codigo_os: `OS-${numId}`,
          id_cliente: 1,
          cliente: { id_cliente: 1, razao_social: 'Cliente', nome_fantasia: 'Cliente', telefone: '', endereco: '', numero: '', bairro: '', cidade: '', uf: '' },
          status: 'EM_ATENDIMENTO',
          visitas: [
            {
              id_visita: numVisitaId,
              id_os: numId,
              km_inicio_ida: Number(km),
              hora_inicio_ida: horaAgora,
            },
          ],
        } as OrdemServico
      );
    }
  }

  static async finalizarDeslocamento(
    id_os: number,
    visita_id: number,
    tipo: 'ida' | 'volta',
    kmFim: number,
    fotoFile?: File | Blob,
    comprovanteFile?: File | Blob,
    comprovanteTipo?: 'pedagio' | 'frete',
    comprovanteValor?: number
  ): Promise<any> {
    const numId = Number(id_os);
    const numVisitaId = Number(visita_id);
    let res: any = null;
    try {
      res = await apiClient.finalizarDeslocamento(numId, numVisitaId, tipo, Number(kmFim), fotoFile);
    } catch (err: any) {
      console.warn('Aviso na API ao finalizar deslocamento:', err);
    }

    if (fotoFile) {
      await apiClient.uploadDeslocamentoFoto(numId, numVisitaId, tipo, 'fim', fotoFile).catch((e) => {
        console.warn('Aviso ao enviar foto de odômetro:', e);
      });
    }

    if (comprovanteFile && comprovanteTipo) {
      const fieldType = comprovanteTipo === 'frete' ? 'comprovante_frete_urls' : 'comprovante_pedagio_urls';
      await apiClient.uploadFileVisita(numId, numVisitaId, fieldType, comprovanteFile).catch((e) => {
        console.warn('Aviso ao enviar comprovante:', e);
      });
    }

    if (comprovanteValor && comprovanteTipo) {
      const field = comprovanteTipo === 'frete' ? 'valor_frete_devolucao' : 'valor_pedagio';
      await apiClient.updateVisita(numId, numVisitaId, { [field]: Number(comprovanteValor) }).catch(() => {});
    }

    this.notifyListeners();
    return res;
  }

  static async registrarChegadaCliente(
    id_os: number,
    km?: number,
    fotoFile?: File | Blob
  ): Promise<OrdemServico> {
    const numId = Number(id_os);
    const visita = await this.ensureActiveVisita(numId);
    const numVisitaId = Number(visita?.id_visita || 1);
    if (km !== undefined && km !== null) {
      await this.finalizarDeslocamento(numId, numVisitaId, 'ida', Number(km), fotoFile).catch(() => {});
    }
    await this.iniciarAtendimentoVisita(numId, numVisitaId).catch(() => {});

    const horaAgora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    let mem = this.memoryChamados.find((c) => Number(c.id_os) === numId);
    if (mem && mem.visitas?.[0]) {
      mem.status = 'EM_ATENDIMENTO';
      if (km !== undefined && km !== null) mem.visitas[0].km_fim_ida = Number(km);
      mem.visitas[0].hora_chegada_cliente = horaAgora;
      mem.visitas[0].hora_inicio_atendimento = horaAgora;

      const idx = this.memoryChamados.findIndex((c) => Number(c.id_os) === numId);
      if (idx >= 0) this.memoryChamados[idx] = mem;
      else this.memoryChamados.push(mem);

      try {
        localStorage.setItem(STORAGE_KEY_CHAMADOS, JSON.stringify(this.memoryChamados));
      } catch {}

      this.notifyListeners();
    }

    try {
      return await this.getChamadoPorId(numId);
    } catch {
      if (mem) return mem;
      return this.getChamadoPorId(numId);
    }
  }

  static async registrarDeslocamentoVolta(
    id_os: number,
    kmInicio: number,
    kmFim: number,
    fotoFile?: File | Blob
  ): Promise<OrdemServico> {
    const numId = Number(id_os);
    const visita = await this.ensureActiveVisita(numId);
    const numVisitaId = Number(visita?.id_visita || 1);
    await this.iniciarDeslocamento(numId, numVisitaId, 'volta', Number(kmInicio), fotoFile).catch(() => {});
    await this.finalizarDeslocamento(numId, numVisitaId, 'volta', Number(kmFim), fotoFile).catch(() => {});

    const horaAgora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    let mem = this.memoryChamados.find((c) => Number(c.id_os) === numId);
    if (mem && mem.visitas?.[0]) {
      mem.visitas[0].km_inicio_volta = Number(kmInicio);
      mem.visitas[0].km_fim_volta = Number(kmFim);
      mem.visitas[0].km_total =
        (mem.visitas[0].km_fim_ida && mem.visitas[0].km_inicio_ida
          ? mem.visitas[0].km_fim_ida - mem.visitas[0].km_inicio_ida
          : 0) +
        (Number(kmFim) - Number(kmInicio));
      mem.visitas[0].hora_inicio_volta = horaAgora;
      mem.visitas[0].hora_fim_volta = horaAgora;

      const idx = this.memoryChamados.findIndex((c) => Number(c.id_os) === numId);
      if (idx >= 0) this.memoryChamados[idx] = mem;
      else this.memoryChamados.push(mem);

      try {
        localStorage.setItem(STORAGE_KEY_CHAMADOS, JSON.stringify(this.memoryChamados));
      } catch {}

      this.notifyListeners();
    }

    try {
      return await this.getChamadoPorId(numId);
    } catch {
      if (mem) return mem;
      return this.getChamadoPorId(numId);
    }
  }

  static async iniciarAtendimentoVisita(id_os: number, visita_id: number): Promise<any> {
    const res = await apiClient.iniciarAtendimentoVisita(id_os, visita_id);
    this.notifyListeners();
    return res;
  }

  static async pausarVisita(
    id_os: number,
    visita_id_or_motivo: number | string,
    motivo_or_detalhe?: string,
    detalhe_opt?: string
  ): Promise<any> {
    let visita_id: number;
    let motivo: string;
    let descricao: string | undefined;

    if (typeof visita_id_or_motivo === 'number') {
      visita_id = visita_id_or_motivo;
      motivo = motivo_or_detalhe || 'Pausa';
      descricao = detalhe_opt;
    } else {
      const visita = await this.ensureActiveVisita(id_os);
      visita_id = visita.id_visita;
      motivo = visita_id_or_motivo;
      descricao = motivo_or_detalhe;
    }

    const res = await apiClient.pausarVisita(id_os, visita_id, motivo, descricao);
    this.notifyListeners();
    try {
      return await this.getChamadoPorId(id_os);
    } catch {
      const mem = this.memoryChamados.find((c) => c.id_os === id_os);
      if (mem) {
        mem.status = 'PAUSADO';
        return mem;
      }
      return this.getChamadoPorId(id_os);
    }
  }

  static async retomarVisita(id_os: number): Promise<OrdemServico> {
    const visita = await this.ensureActiveVisita(id_os);
    await apiClient.updateVisita(id_os, visita.id_visita, { status: 'EM_ATENDIMENTO' }).catch(() => {});
    await apiClient.updateChamado(id_os, { status: 'EM_ATENDIMENTO' }).catch(() => {});
    this.notifyListeners();
    try {
      return await this.getChamadoPorId(id_os);
    } catch {
      const mem = this.memoryChamados.find((c) => c.id_os === id_os);
      if (mem) {
        mem.status = 'EM_ATENDIMENTO';
        return mem;
      }
      return this.getChamadoPorId(id_os);
    }
  }

  static async salvarDadosCliente(
    id_os: number,
    visita_id: number,
    nomeCliente: string,
    documentoCliente: string
  ): Promise<any> {
    const res = await apiClient.finalizarDadosCliente(id_os, visita_id, nomeCliente, documentoCliente);
    this.notifyListeners();
    return res;
  }

  static async finalizarAtendimentoComAssinatura(
    id_os: number,
    visita_id: number,
    nomeCliente: string,
    documentoCliente: string,
    assinaturaBase64: string
  ): Promise<any> {
    const res = await apiClient.finalizarAtendimentoComAssinatura(
      id_os,
      visita_id,
      nomeCliente,
      documentoCliente,
      assinaturaBase64
    );
    this.notifyListeners();
    return res;
  }

  static async salvarAssinatura(
    id_os: number,
    assinaturaData: {
      nome_responsavel?: string;
      documento?: string;
      assinatura_url?: string;
      nomeCliente?: string;
      documentoCliente?: string;
      assinaturaBase64?: string;
    }
  ): Promise<OrdemServico> {
    const visita = await this.ensureActiveVisita(id_os);
    const nome = assinaturaData.nome_responsavel || assinaturaData.nomeCliente || 'Responsável';
    const doc = assinaturaData.documento || assinaturaData.documentoCliente || '000.000.000-00';
    const base64 = assinaturaData.assinatura_url || assinaturaData.assinaturaBase64 || '';

    await this.finalizarAtendimentoComAssinatura(id_os, visita.id_visita, nome, doc, base64);
    return this.getChamadoPorId(id_os);
  }

  static async adicionarComprovante(
    id_os: number,
    comprovante: {
      tipo: string;
      valor: number;
      descricao?: string;
      file?: File | Blob;
    }
  ): Promise<any> {
    const visita = await this.ensureActiveVisita(id_os);
    if (comprovante.file) {
      const fieldType = comprovante.tipo === 'frete' ? 'comprovante_frete_urls' : 'comprovante_pedagio_urls';
      await apiClient.uploadFileVisita(id_os, visita.id_visita, fieldType, comprovante.file).catch((e) => {
        console.warn('Erro ao subir comprovante:', e);
      });
    }

    const field = comprovante.tipo === 'frete' ? 'valor_frete_devolucao' : 'valor_pedagio';
    await apiClient.updateVisita(id_os, visita.id_visita, { [field]: comprovante.valor }).catch(() => {});
    this.notifyListeners();
    return this.getChamadoPorId(id_os);
  }

  // --- SERVIÇOS & EQUIPAMENTOS REAL ---
  static async getServicosVisita(id_os: number, visita_id: number): Promise<ServicoEquipamento[]> {
    return apiClient.getServicosVisita(id_os, visita_id);
  }

  static async salvarServicoEquipamento(
    id_os: number,
    visita_id: number,
    servico: any
  ): Promise<any> {
    let res: any;
    const payload = {
      nome_equipamento: servico.nome_equipamento,
      numero_serie_atendido: servico.numero_serie_atendido || servico.numero_serie || `SN-${Date.now()}`,
      defeitos_principais: servico.defeitos_principais || ['Refrigeração'],
      defeito_outros_descricao: servico.defeito_outros_descricao,
      sub_defeitos_refrigeracao: servico.sub_defeitos_refrigeracao,
      sub_defeitos_compressor: servico.sub_defeitos_compressor,
      sub_defeitos_vazamento: servico.sub_defeitos_vazamento,
      vazamento_ponto_descricao: servico.vazamento_ponto_descricao,
      sub_defeitos_outros: servico.sub_defeitos_outros,
      sub_defeitos_iluminacao: servico.sub_defeitos_iluminacao,
      sub_defeitos_estrutura: servico.sub_defeitos_estrutura,
      materiais_utilizados: (servico.materiais || servico.materiais_utilizados || []).map((m: any) => ({
        nome: m.nome || m.descricao || 'Peça',
        quantidade: Number(m.quantidade) || 1,
        valor: Number(m.valor || m.valor_unitario) || 0,
      })),
    };

    if (servico.id_servico || servico.id_servico_equipamento) {
      const servicoId = servico.id_servico || servico.id_servico_equipamento;
      res = await apiClient.updateServicoEquipamento(id_os, visita_id, servicoId, payload);
    } else {
      res = await apiClient.createServicoEquipamento(id_os, visita_id, payload);
    }

    this.notifyListeners();
    return res;
  }

  static async adicionarOuAtualizarServicoEquipamento(
    id_os: number,
    servico: ServicoEquipamento
  ): Promise<OrdemServico> {
    const visita = await this.ensureActiveVisita(id_os);
    await this.salvarServicoEquipamento(id_os, visita.id_visita, servico);
    return this.getChamadoPorId(id_os);
  }

  static async uploadFotoServico(
    id_os: number,
    visita_id: number,
    servico_id: number,
    tipo: 'defeito' | 'conserto',
    file: File | Blob
  ): Promise<any> {
    const res = await apiClient.uploadFotoServico(id_os, visita_id, servico_id, tipo, file);
    this.notifyListeners();
    return res;
  }

  static async getFotosServico(
    id_os: number,
    visita_id: number,
    servico_id: number
  ): Promise<{ fotos_defeito: any[]; fotos_conserto: any[] }> {
    return apiClient.getFotosServico(id_os, visita_id, servico_id);
  }
}
