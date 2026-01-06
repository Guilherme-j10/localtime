# 🕐 LocalTime Bun

Uma ferramenta para sincronização automática do horário do sistema Windows utilizando a API do TimezoneDB, desenvolvida com [Bun](https://bun.sh) e FFI (Foreign Function Interface).

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Como Funciona](#-como-funciona)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Ambiente Docker Windows](#-ambiente-docker-windows)
- [Tratamento de Erros](#-tratamento-de-erros)
- [Licença](#-licença)

---

## 📖 Sobre o Projeto

O **LocalTime Bun** é uma aplicação que sincroniza automaticamente o relógio do sistema Windows com um servidor de tempo online. Utiliza a API do [TimezoneDB](https://timezonedb.com/) para obter o horário preciso do fuso horário `America/Sao_Paulo` e aplica diretamente no sistema operacional através de chamadas nativas à DLL `kernel32.dll` do Windows.

### Casos de Uso

- ✅ Sincronização de horário em máquinas virtuais Windows
- ✅ Correção de drift de relógio em sistemas isolados
- ✅ Automação de sincronização de tempo em containers Windows
- ✅ Ambientes onde o NTP está bloqueado ou indisponível

---

## ⚙️ Como Funciona

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   TimezoneDB API    │────▶│   Bun Runtime    │────▶│  Windows Kernel32   │
│  (Horário Preciso)  │     │   (Processamento)│     │   (SetLocalTime)    │
└─────────────────────┘     └──────────────────┘     └─────────────────────┘
```

1. **Requisição HTTP**: A aplicação faz uma requisição GET para a API do TimezoneDB
2. **Parsing dos dados**: O timestamp retornado é parseado e convertido para o formato `SYSTEMTIME` do Windows
3. **Chamada FFI**: Utilizando `bun:ffi`, a função `SetLocalTime` da `kernel32.dll` é invocada diretamente
4. **Atualização do sistema**: O horário do Windows é atualizado instantaneamente

### Estrutura SYSTEMTIME

A estrutura `SYSTEMTIME` do Windows é representada como um buffer de 16 bytes:

| Campo          | Tipo    | Offset | Descrição                |
|----------------|---------|--------|--------------------------|
| wYear          | Uint16  | 0      | Ano (ex: 2026)           |
| wMonth         | Uint16  | 2      | Mês (1-12)               |
| wDayOfWeek     | Uint16  | 4      | Dia da semana (0-6)      |
| wDay           | Uint16  | 6      | Dia do mês (1-31)        |
| wHour          | Uint16  | 8      | Hora (0-23)              |
| wMinute        | Uint16  | 10     | Minuto (0-59)            |
| wSecond        | Uint16  | 12     | Segundo (0-59)           |
| wMilliseconds  | Uint16  | 14     | Milissegundos (0-999)    |

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| [Bun](https://bun.sh) | 1.3.3+ | Runtime JavaScript/TypeScript de alta performance |
| [TypeScript](https://www.typescriptlang.org/) | ^5 | Superset tipado do JavaScript |
| [Axios](https://axios-http.com/) | ^1.13.2 | Cliente HTTP baseado em Promises |
| [Moment.js](https://momentjs.com/) | ^2.30.1 | Manipulação de datas e horários |
| [Bun FFI](https://bun.sh/docs/api/ffi) | nativo | Interface para funções nativas C/C++ |

---

## 📦 Pré-requisitos

- **Sistema Operacional**: Windows 10/11 (ou container Windows)
- **Bun Runtime**: versão 1.3.3 ou superior
- **Privilégios de Administrador**: necessário para alterar o horário do sistema
- **Conexão com Internet**: para acessar a API TimezoneDB

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/localtime_bun.git
cd localtime_bun
```

### 2. Instale as dependências

```bash
bun install
```

### 3. Configure a API Key (opcional)

A aplicação já possui uma chave de API configurada. Para usar sua própria chave:

1. Acesse [TimezoneDB](https://timezonedb.com/register) e registre-se gratuitamente
2. Edite o arquivo `src/index.ts` e substitua a chave na URL:

```typescript
const TIMEZONEDB = "https://api.timezonedb.com/v2.1/get-time-zone?key=SUA_CHAVE_AQUI&format=json&by=zone&zone=America/Sao_Paulo";
```

---

## 💻 Uso

### Execução direta

> ⚠️ **Importante**: Execute como Administrador para ter permissão de alterar o horário do sistema.

```bash
bun run src/index.ts
```

### Compilar para executável

Para gerar um executável standalone para Windows:

```bash
bun build src/index.ts --compile --target=bun-windows-x64 --outfile localtime
```

O executável gerado pode ser encontrado na pasta `shared/` para uso em containers Windows.

### Executar o executável

```bash
./shared/localtime.exe
```

---

## 📁 Estrutura do Projeto

```
localtime_bun/
├── 📄 docker-compose.yml    # Configuração do container Windows
├── 📄 package.json          # Dependências e scripts do projeto
├── 📄 README.md             # Documentação do projeto
├── 📄 tsconfig.json         # Configurações do TypeScript
├── 📂 shared/               # Pasta compartilhada com o container
│   └── 📄 localtime.exe     # Executável compilado
└── 📂 src/
    └── 📄 index.ts          # Código fonte principal
```

### Descrição dos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/index.ts` | Código principal da aplicação com lógica de sincronização |
| `docker-compose.yml` | Configuração para executar Windows 10 em container Docker |
| `package.json` | Manifesto do projeto com dependências |
| `tsconfig.json` | Configurações do compilador TypeScript |
| `shared/localtime.exe` | Binário compilado para Windows |

---

## 🐳 Ambiente Docker Windows

O projeto inclui uma configuração Docker para executar um Windows 10 virtualizado, útil para testes e desenvolvimento.

### Pré-requisitos Docker

```bash
# Carregar módulo KVM (Linux)
sudo modprobe kvm_amd  # Para processadores AMD
# ou
sudo modprobe kvm_intel  # Para processadores Intel

# Dar permissões ao dispositivo KVM
sudo chmod 666 /dev/kvm
```

### Iniciar o Container

```bash
docker-compose up -d
```

### Acessar o Windows

| Método | Endereço |
|--------|----------|
| Web (noVNC) | http://localhost:8006 |
| RDP | localhost:3389 |

### Credenciais padrão

- **Usuário**: guilherme
- **Senha**: 1234

### Configurações do Container

| Parâmetro | Valor |
|-----------|-------|
| Versão Windows | 10 |
| RAM | 4GB |
| Idioma | pt-br |
| Fuso Horário | America/Sao_Paulo |

---

## ⚠️ Tratamento de Erros

A aplicação possui tratamento de erros robusto:

### Erros de Rede (Axios)

Erros de conexão com a API são registrados no arquivo `error.log`:

```
[2026-01-05 10:30:45] Axios Error: Network Error
```

### Erros de Permissão

Se executado sem privilégios de administrador:

```
Error: Failed to set system time. Are you running with sufficient privileges?
```

**Solução**: Execute o terminal como Administrador ou use `sudo` em ambientes compatíveis.

---

## 📊 Referência Técnica

### Tipos de Dados (DataView)

| Tamanho | Tipo em JS | Capacidade (Decimal) |
|---------|-----------|----------------------|
| 1 Byte  | Uint8     | 0 a 255              |
| 2 Bytes | Uint16    | 0 a 65.535           |
| 4 Bytes | Uint32    | 0 a 4.294.967.295    |
| 8 Bytes | BigUint64 | Números astronômicos |

### API TimezoneDB - Resposta

```json
{
  "status": "OK",
  "message": "",
  "countryCode": "BR",
  "countryName": "Brazil",
  "zoneName": "America/Sao_Paulo",
  "abbreviation": "BRT",
  "gmtOffset": -10800,
  "dst": "0",
  "timestamp": 1767676800,
  "formatted": "2026-01-05 10:30:00"
}
```

---

## 🔧 Scripts Disponíveis

```bash
# Instalar dependências
bun install

# Executar aplicação
bun run src/index.ts

# Verificar tipos TypeScript
bun run tsc --noEmit

# Compilar para executável Windows
bun build src/index.ts --compile --target=bun-windows-x64 --outfile shared/localtime
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um Fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona NovaFeature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abrir um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👤 Autor

Desenvolvido com ❤️ usando [Bun](https://bun.sh) - O runtime JavaScript mais rápido do mundo.
