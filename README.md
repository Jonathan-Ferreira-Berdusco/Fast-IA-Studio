# FAST Gôndolas & Check-outs — Frontend & Integração FastAPI

Sistema completo de Gestão de Ordens de Serviço, Deslocamento e Atendimento Técnico para **FAST Gôndolas & Check-outs**, integrado com o backend Python FastAPI.

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- **Node.js**: v18+ (recomendado v20 ou v22)
- **Python**: 3.10+ (para o backend FastAPI)
- **MySQL / PostgreSQL / SQLite** configurado conforme o seu arquivo `.env` do backend

---

### 2. Executando o Backend (FastAPI)

1. No terminal do backend, crie e ative o ambiente virtual:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\activate

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

3. Crie o arquivo `.env` a partir do `.env.example`:
   ```env
   DATABASE_URL=mysql+pymysql://usuario:senha@localhost:3306/fast_db
   SECRET_KEY=sua_chave_secreta_aqui_para_jwt
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

4. Popule o banco inicial com o usuário administrador mestre:
   ```bash
   python seed.py
   ```
   *(Cria o Administrador Mestre: `admin@fastariam.com` com senha `admin123`)*

5. Inicie o servidor FastAPI:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API disponível em: `http://127.0.0.1:8000`
   - Documentação Swagger: `http://127.0.0.1:8000/docs`

---

### 3. Executando o Frontend (React + Vite)

1. Na pasta do frontend, instale as dependências:
   ```bash
   npm install
   ```

2. *(Opcional)* Crie o arquivo `.env` na raiz do frontend se quiser alterar a URL do backend:
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```
   *Nota: Se deixar em branco, o proxy integrado do Vite já redireciona automaticamente `/api` e `/static` para `http://127.0.0.1:8000` sem nenhum problema de CORS!*

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   - Frontend disponível em: `http://localhost:3000`

---

## 🔑 Credenciais Padrão de Acesso

### Administrador Mestre
- **E-mail:** `admin@fastariam.com`
- **Senha:** `admin123`
- *Acesso ao Painel Geral, Dashboard com gráficos, Criação de OS, Gestão de Clientes e Técnicos, Reagendamento e Custos.*

### Técnico de Campo
- **E-mail:** `eletropaulorefrigeracao@gmail.com`
- **Senha:** `senhaSuperSecreta123`
- *Acesso ao fluxo mobile de atendimento em campo: Odômetro de Ida, Chegada, Pausas, Equipamentos e Defeitos, Fotos, Assinatura Digital do Cliente e Odômetro de Volta.*

---

## 🛠️ Endpoints Integrados

- **Autenticação JWT:** `POST /api/auth/login` (OAuth2 Form Data com Bearer token)
- **Ordens de Serviço:**
  - `GET /api/chamados`
  - `POST /api/chamados`
  - `GET /api/chamados/{id}`
  - `PATCH /api/chamados/{id}`
  - `DELETE /api/chamados/{id}`
  - `POST /api/chamados/{id}/iniciar-atendimento`
  - `POST /api/chamados/{id}/concluir`
  - `GET /api/chamados/{id}/custos` (cálculo de honorários, KM, pedágio, frete)
- **Visitas & Deslocamento:**
  - `POST /api/chamados/{id}/visitas`
  - `POST /api/chamados/{id}/visitas/{visita_id}/iniciar-deslocamento`
  - `POST /api/chamados/{id}/visitas/{visita_id}/finalizar-deslocamento`
  - `POST /api/chamados/{id}/visitas/{visita_id}/upload-deslocamento`
  - `POST /api/chamados/{id}/visitas/{visita_id}/pausar`
  - `POST /api/chamados/{id}/visitas/{visita_id}/finalizar-atendimento` (assinatura base64)
- **Serviços & Equipamentos:**
  - `GET /api/chamados/{id}/visitas/{visita_id}/servicos`
  - `POST /api/chamados/{id}/visitas/{visita_id}/servicos`
  - `POST /api/chamados/{id}/visitas/{visita_id}/servicos/{servico_id}/upload-foto`
- **Clientes e Técnicos:**
  - `GET /api/clientes` e `POST /api/clientes`
  - `GET /api/tecnicos` e `POST /api/tecnicos`
