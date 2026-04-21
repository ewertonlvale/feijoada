# Feijoada das Famílias 2026 — Patrocínio

Mini-site para campanha de patrocínio da **Feijoada das Famílias — Forró com Feijão**, evento do ECC (Encontro de Casais com Cristo) da Paróquia Nossa Senhora da Conceição Aparecida (Teresina / PI — Renascença).

> 17 de Maio de 2026 · 11h · Quadra de Esportes do Renascença I

---

## O que esse projeto contém

Um Google Apps Script Web App standalone que serve quatro páginas:

| Rota | Arquivo | O que faz |
|------|---------|-----------|
| `?page=patrocinadores` (default) | `patrocinadores.html` | Landing com hero do evento, três cotas (Bronze R$100 / Prata R$150 / Ouro R$200), benefícios de cada cota e como participar. |
| `?page=inscricao&cota=ouro` | `inscricao.html` | Formulário de adesão — nome, empresa, WhatsApp, email, cota, mensagem. |
| `?page=obrigado` | `obrigado.html` | Página de confirmação pós-envio. |
| `?page=lista` | `lista.html` | Galeria pública dos patrocinadores confirmados (Ouro / Prata / Bronze). |

Backend no próprio Apps Script:

- `Code.gs` — router `doGet()` + helper `include()` para templates.
- `Config.gs` — dados do evento, cotas, ID da planilha de patrocinadores.
- `Sponsors.gs` — `registerSponsor(dados)` grava na planilha; `listSponsors()` devolve os confirmados para a galeria.

---

## Estrutura do repositório

```
feijoada-familias-2026/
├── appsscript.json         # manifesto do Apps Script
├── Code.gs                 # router doGet + include()
├── Config.gs               # constantes (evento, tiers, planilha)
├── Sponsors.gs             # CRUD da planilha
├── patrocinadores.html     # landing (default)
├── inscricao.html          # formulário
├── obrigado.html           # confirmação
├── lista.html              # galeria pública
├── shared_styles.html      # CSS da paleta feijoada (incluído em todas)
├── shared_topbar.html      # topbar reutilizável
├── .claspignore            # o que não vai para o Apps Script
├── .gitignore              # o que não vai para o Git
└── README.md
```

---

## Como fazer deploy (primeira vez)

### 1. Criar a planilha de patrocinadores

No Google Drive, crie uma planilha nova chamada por exemplo **"Patrocinadores Feijoada 2026"**. Copie o ID que aparece na URL:

```
https://docs.google.com/spreadsheets/d/<<< ESSE_ID_AQUI >>>/edit
```

### 2. Preencher `Config.gs`

Abra `Config.gs` e substitua:

- `SPREADSHEET_ID` → ID que você copiou acima.
- `WHATSAPP` → número no formato `55DDNNNNNNNNN` (sem `+`, sem espaços).
- Dados do evento (data, hora, local) se mudarem.
- Valores das cotas, se mudarem.

### 3. Criar projeto Apps Script novo (via clasp)

Pré-requisito: Node.js e [`clasp`](https://github.com/google/clasp) instalados globalmente.

```bash
npm install -g @google/clasp
clasp login
```

Dentro da pasta do repo:

```bash
clasp create --type webapp --title "Feijoada das Famílias 2026"
# clasp cria o .clasp.json com o scriptId — não commite esse arquivo (está no .gitignore)
clasp push
```

### 4. Autorizar acesso à planilha

Na primeira vez que o `registerSponsor()` rodar, o Apps Script vai pedir autorização para editar a planilha. Rode uma vez pelo editor do Apps Script:

1. Abra o projeto com `clasp open`.
2. Selecione a função `registerSponsor` no dropdown superior.
3. Clique em ▶ Executar e autorize nas permissões que o Google pedir.

### 5. Publicar como Web App

No editor do Apps Script:

- **Implantar → Nova implantação → Tipo: Aplicativo da Web**
- Executar como: **Você** (ou **quem acessa** se quiser multi-usuário).
- Quem tem acesso: **Qualquer pessoa**.
- Copie a URL `/exec` que o Apps Script devolve — essa é a URL pública.

A URL terá este formato:

```
https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec
```

Divulgue essa URL (ou coloque um encurtador tipo `feijoada.pnscaparecida.com`).

### 6. Atualizações seguintes

```bash
git pull
clasp push
clasp deploy   # cria nova versão, mantendo URL
```

---

## Fluxo do patrocinador

1. Abre `/exec` → vê o hero, as três cotas e o botão **Apoiar** em cada uma.
2. Clica em **Apoiar Ouro** (por exemplo) → vai para `/exec?page=inscricao&cota=ouro` com a cota já pré-selecionada no form.
3. Preenche nome, empresa, WhatsApp, email, mensagem opcional e envia.
4. `google.script.run.registerSponsor()` grava uma linha nova na planilha com `status=pendente`.
5. O usuário é redirecionado para `/exec?page=obrigado` com as instruções.
6. A equipe do ECC recebe notificação no email (se configurado em `Config.gs`) e faz contato pelo WhatsApp para combinar pagamento, envio do logo, etc.
7. Quando o patrocínio é confirmado, a equipe muda manualmente `status` para `confirmado` na planilha, e esse patrocinador passa a aparecer na galeria pública em `?page=lista`.

---

## Schema da planilha

Aba **`patrocinadores`** (criada automaticamente na primeira execução):

| Coluna | Tipo | Descrição |
|---|---|---|
| `timestamp` | Data/Hora | Quando foi registrado |
| `nome` | Texto | Nome do contato |
| `empresa` | Texto | Razão social / nome fantasia |
| `whatsapp` | Texto | Número com DDD |
| `email` | Texto | Email de contato |
| `cota` | Texto | `bronze`, `prata` ou `ouro` |
| `valor` | Número | Em R$, preenchido automaticamente pela cota |
| `status` | Texto | `pendente` → `confirmado` → `pago` |
| `logo_url` | URL | Link do logotipo (preenchido depois, manualmente) |
| `mensagem` | Texto | Mensagem opcional do patrocinador |
| `origem` | Texto | `site` (default), `whatsapp`, `presencial` etc. |

---

## Personalizar para uma edição nova (2027, outro evento)

1. Duplicar a planilha.
2. Trocar o título em `appsscript.json` se for criar projeto novo.
3. Alterar os valores em `Config.gs` (data, local, tiers).
4. `clasp push` em um projeto Apps Script novo.

---

## Licença e créditos

Projeto interno da **Paróquia Nossa Senhora da Conceição Aparecida** — Teresina / PI.
Equipe ECC.

`#FeijoadaDasFamilias` · `#ECC`
