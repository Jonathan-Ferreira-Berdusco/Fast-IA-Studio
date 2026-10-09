/**
 * Cliente HTTP para a API FastAPI do FAST Ariam
 * Conecta diretamente ao backend FastAPI (padrão http://127.0.0.1:8000 via proxy /api do Vite).
 */

const TOKEN_KEY = 'fast_ariam_jwt_token';
const USER_KEY = 'fast_ariam_current_user';
const BASE_URL = ((import.meta as any).env?.VITE_API_URL as string) || '';

export interface ApiTokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserTokenPayload {
  sub: string;
  user_id: number;
  role: 'admin' | 'tecnico';
  exp?: number;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(`API Error ${status}: ${detail}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  // --- TOKEN MANAGEMENT ---
  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  decodeToken(token?: string): UserTokenPayload | null {
    const t = token || this.getToken();
    if (!t) return null;
    try {
      const parts = t.split('.');
      if (parts.length !== 3) return null;
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as UserTokenPayload;
    } catch (e) {
      console.warn('Erro ao decodificar token JWT:', e);
      return null;
    }
  }

  // --- BASE REQUEST METHOD ---
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    // Adiciona Bearer token se autenticado
    const token = this.getToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Se o corpo não for FormData ou URLSearchParams, adiciona Content-Type JSON
    if (options.body && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 204) {
        return null as unknown as T;
      }

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        let detailMsg = 'Erro na requisição';
        if (data && typeof data === 'object') {
          if (typeof data.detail === 'string') {
            detailMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            detailMsg = data.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
          } else {
            detailMsg = JSON.stringify(data);
          }
        } else if (typeof data === 'string') {
          detailMsg = data;
        }
        throw new ApiError(response.status, detailMsg);
      }

      return data as T;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Falha de rede (ex: backend offline)
      throw new ApiError(0, error.message || 'Falha de conexão com a API do backend.');
    }
  }

  // --- AUTH ENDPOINTS ---
  async login(username: string, password: string): Promise<ApiTokenResponse> {
    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);

    const data = await this.request<ApiTokenResponse>('/api/auth/login', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (data?.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  async checkHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/');
  }

  // --- TÉCNICOS ENDPOINTS ---
  async getTecnicos(isActive?: boolean): Promise<any[]> {
    const query = isActive !== undefined ? `?is_active=${isActive}` : '';
    return this.request<any[]>(`/api/tecnicos${query}`);
  }

  async getTecnico(id: number): Promise<any> {
    return this.request<any>(`/api/tecnicos/${id}`);
  }

  async createTecnico(tecnicoData: any): Promise<any> {
    return this.request<any>('/api/tecnicos', {
      method: 'POST',
      body: JSON.stringify(tecnicoData),
    });
  }

  async updateTecnico(id: number, tecnicoData: any): Promise<any> {
    return this.request<any>(`/api/tecnicos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(tecnicoData),
    });
  }

  async deleteTecnico(id: number): Promise<void> {
    return this.request<void>(`/api/tecnicos/${id}`, {
      method: 'DELETE',
    });
  }

  async updateCurrentPassword(oldPassword: string, newPassword: string): Promise<void> {
    return this.request<void>('/api/tecnicos/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  }

  // --- CLIENTES ENDPOINTS ---
  async getClientes(isActive?: boolean): Promise<any[]> {
    const query = isActive !== undefined ? `?is_active=${isActive}` : '';
    return this.request<any[]>(`/api/clientes${query}`);
  }

  async getCliente(id: number): Promise<any> {
    return this.request<any>(`/api/clientes/${id}`);
  }

  async createCliente(clienteData: any): Promise<any> {
    return this.request<any>('/api/clientes', {
      method: 'POST',
      body: JSON.stringify(clienteData),
    });
  }

  async updateCliente(id: number, clienteData: any): Promise<any> {
    return this.request<any>(`/api/clientes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(clienteData),
    });
  }

  async deleteCliente(id: number): Promise<void> {
    return this.request<void>(`/api/clientes/${id}`, {
      method: 'DELETE',
    });
  }

  // --- CHAMADOS (ORDENS DE SERVIÇO) ENDPOINTS ---
  async getChamados(isCancelled?: boolean): Promise<any[]> {
    const query = isCancelled !== undefined ? `?is_cancelled=${isCancelled}` : '';
    return this.request<any[]>(`/api/chamados${query}`);
  }

  async getChamado(id: number): Promise<any> {
    return this.request<any>(`/api/chamados/${id}`);
  }

  async createChamado(chamadoData: any): Promise<any> {
    return this.request<any>('/api/chamados', {
      method: 'POST',
      body: JSON.stringify(chamadoData),
    });
  }

  async updateChamado(id: number, updateData: any): Promise<any> {
    return this.request<any>(`/api/chamados/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async deleteChamado(id: number): Promise<void> {
    return this.request<void>(`/api/chamados/${id}`, {
      method: 'DELETE',
    });
  }

  async iniciarAtendimentoChamado(chamadoId: number): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/iniciar-atendimento`, {
      method: 'POST',
    });
  }

  async concluirChamado(chamadoId: number): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/concluir`, {
      method: 'POST',
    });
  }

  async reagendarChamado(chamadoId: number, visitaData: any): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/reagendar`, {
      method: 'POST',
      body: JSON.stringify(visitaData),
    });
  }

  async getCustosChamado(chamadoId: number): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/custos`);
  }

  // --- VISITAS & DESLOCAMENTO ENDPOINTS ---
  async createVisita(chamadoId: number, visitaData: any): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/visitas`, {
      method: 'POST',
      body: JSON.stringify(visitaData),
    });
  }

  async updateVisita(chamadoId: number, visitaId: number, updateData: any): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/visitas/${visitaId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async getEstadoVisita(chamadoId: number, visitaId: number): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/visitas/${visitaId}/estado`);
  }

  async iniciarDeslocamento(
    chamadoId: number,
    visitaId: number,
    tipo: 'ida' | 'volta',
    kmInicio: number
  ): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/visitas/${visitaId}/iniciar-deslocamento`, {
      method: 'POST',
      body: JSON.stringify({ tipo, km_inicio: kmInicio }),
    });
  }

  async finalizarDeslocamento(
    chamadoId: number,
    visitaId: number,
    tipo: 'ida' | 'volta',
    kmFim: number
  ): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/visitas/${visitaId}/finalizar-deslocamento`, {
      method: 'POST',
      body: JSON.stringify({ tipo, km_fim: kmFim }),
    });
  }

  async uploadDeslocamentoFoto(
    chamadoId: number,
    visitaId: number,
    tipo: 'ida' | 'volta',
    momento: 'inicio' | 'fim',
    file: File | Blob
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    formData.append('momento', momento);

    return this.request<any>(`/api/chamados/${chamadoId}/visitas/${visitaId}/upload-deslocamento`, {
      method: 'POST',
      body: formData,
    });
  }

  async iniciarAtendimentoVisita(chamadoId: number, visitaId: number): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/visitas/${visitaId}/iniciar-atendimento`, {
      method: 'POST',
    });
  }

  async pausarVisita(
    chamadoId: number,
    visitaId: number,
    motivo: string,
    descricao?: string
  ): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/visitas/${visitaId}/pausar`, {
      method: 'POST',
      body: JSON.stringify({ motivo, descricao: descricao || '' }),
    });
  }

  async finalizarDadosCliente(
    chamadoId: number,
    visitaId: number,
    nomeCliente: string,
    documentoCliente: string
  ): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/visitas/${visitaId}/finalizar-dados`, {
      method: 'POST',
      body: JSON.stringify({
        nome_cliente: nomeCliente,
        documento_cliente: documentoCliente,
      }),
    });
  }

  async finalizarAtendimentoComAssinatura(
    chamadoId: number,
    visitaId: number,
    nomeCliente: string,
    documentoCliente: string,
    assinaturaBase64: string
  ): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/visitas/${visitaId}/finalizar-atendimento`, {
      method: 'POST',
      body: JSON.stringify({
        nome_cliente: nomeCliente,
        documento_cliente: documentoCliente,
        assinatura_base64: assinaturaBase64,
      }),
    });
  }

  async uploadFileVisita(
    chamadoId: number,
    visitaId: number,
    fileType: string,
    file: File | Blob
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    return this.request<any>(`/api/chamados/${chamadoId}/visitas/${visitaId}/upload_file`, {
      method: 'POST',
      body: formData,
    });
  }

  // --- SERVIÇOS & EQUIPAMENTOS ENDPOINTS ---
  async getServicosVisita(chamadoId: number, visitaId: number): Promise<any[]> {
    return this.request<any[]>(`/api/chamados/${chamadoId}/visitas/${visitaId}/servicos`);
  }

  async createServicoEquipamento(chamadoId: number, visitaId: number, payload: any): Promise<any> {
    return this.request<any>(`/api/chamados/${chamadoId}/visitas/${visitaId}/servicos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateServicoEquipamento(
    chamadoId: number,
    visitaId: number,
    servicoId: number,
    payload: any
  ): Promise<any> {
    return this.request<any>(
      `/api/chamados/${chamadoId}/visitas/${visitaId}/servicos/${servicoId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  }

  async uploadFotoServico(
    chamadoId: number,
    visitaId: number,
    servicoId: number,
    tipo: 'defeito' | 'conserto',
    file: File | Blob
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);

    return this.request<any>(
      `/api/chamados/${chamadoId}/visitas/${visitaId}/servicos/${servicoId}/upload-foto`,
      {
        method: 'POST',
        body: formData,
      }
    );
  }

  async getFotosServico(chamadoId: number, visitaId: number, servicoId: number): Promise<any> {
    return this.request<any>(
      `/api/chamados/${chamadoId}/visitas/${visitaId}/servicos/${servicoId}/fotos`
    );
  }
}

export const apiClient = new ApiClient();
