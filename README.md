# MessyProtect Web Service

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-grey)

## Visão Geral

Este projeto consiste em um sistema para gerenciamento de acesso a servidores de Minecraft. A aplicação atua como um gatekeeper, validando conexões de usuários através de uma interface web e gerenciando automaticamente a inclusão na whitelist do servidor.

## Arquitetura

- **Backend (API):** Desenvolvido em **Bun** com **Fastify**. Responsável pela lógica de negócios, comunicação via HTTPS com o servidor Minecraft, validação de segurança (Anti-VPN) e gerenciamento de sessões.
- **Frontend (Interface):** Desenvolvido em **Svelte**. Oferece uma interface reativa, leve e de alto desempenho para que o usuário final solicite o acesso.
- **Database:** **bun:sqlite** - Banco de dados SQLite nativo do Bun, com inicialização automática.

## Funcionalidades Principais

- **Automação de Whitelist:** Adição automática de nicknames ao servidor Minecraft após validação bem-sucedida.
- **Segurança Anti-VPN/Proxy:** Middleware dedicado para análise de reputação de IP. Bloqueia automaticamente tentativas de acesso mascaradas (VPNs, Proxies Datacenter, Tor Exit Nodes).
- **Comunicação HTTP:** Integração direta com o plugin no servidor para execução de ações.
- **Validação de Nickname:** Verificação de formato e validade do nome de usuário.
- **Interface Responsiva:** Design adaptável para desktop e dispositivos móveis via Svelte.

## Tecnologias Utilizadas

- **Runtime:** Bun
- **Framework Frontend:** Svelte / SvelteKit
- **Servidor Web:** Fastify
- **Database:** bun:sqlite (nativo)
- **Protocolo:** HTTP
- **Estilização:** TailwindCSS

## Pré-requisitos

Antes de iniciar, certifique-se de ter os seguintes componentes instalados em seu ambiente:

- Bun (Runtime)
- Plugin Messy Protect instalado no servidor Minecraft.

## Instalação e Configuração

Siga os passos abaixo para configurar o ambiente de desenvolvimento.

### 1. Clonar o Repositório

```bash
git clone https://github.com/nekowy/messy-protect-service
cd messy-protect-service
```

### 2. Configuração de Variáveis de Ambiente

Crie um arquivo .env na raiz do projeto. Utilize o exemplo abaixo como referência:

```env
# Configurações do Servidor HTTP
PORT=3000
NODE_ENV=development

# CHAVES
VERIFICATION_KEY=<SEGREDO DE 8 CARACTERES> # VERIFICAÇÃO DA COMUNICAÇÃO
DB_SECRET=<SEGREDO DE 16 CARACTERES> # CRIPTOGRAFIA DA DB
MP_API_KEY=<SEGREDO DE 32 CARACTERES> # COMUNICAÇÃO INICIAL MINECRAFT -> MESSY PROTECT WEB
```

### 3. Instalação de Dependências: Instale as dependências necessárias para o backend e/ou o frontend.

```bash
bun install
cd frontend
bun install
```

### 4. Rodando o projeto (Tradicional)

```bash
bun index.js
```

### 5. Rodando via Docker (Recomendado)

O projeto inclui um `Dockerfile` otimizado.

Build:

```bash
docker build -t messyprotect .
```

Run:

```bash
docker run -p 3000:3000 -v $(pwd)/frontend/static/config.json:/app/public/config.json messyprotect
```

Isso irá iniciar o serviço e expor na porta 3000. O arquivo `.env` será gerado automaticamente se não existir.

## Customização

### Logos

Você pode configurar os logos exibidos na interface editando o arquivo `frontend/static/config.json`.
Os campos disponíveis são `logo1`, `logo2` e `logo3`.

Exemplo:

```json
{
  "logo1": "MEU",
  "logo2": "SERVIDOR",
  "logo3": "MC"
}
```

## Contribuição

Contribuições são bem-vindas. Para alterações importantes, por favor abra uma issue primeiro para discutir o que você gostaria de mudar.

1. Faça um Fork do projeto

2. Crie uma Branch para sua Feature (git checkout -b feature/NovaFeature)

3. Faça o Commit (git commit -m 'Add: Nova Feature')

4. Faça o Push (git push origin feature/NovaFeature)

5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.
