# `docs/` — site público (GitHub Pages)

Esta pasta é o que o **GitHub Pages** publica em
`https://feijoada.pnscaparecida.com`.

O conteúdo do Apps Script (formulários, planilha, lógica) **não vive aqui** —
fica no diretório-pai do repo e é enviado via `clasp push`.
Este `docs/` contém só o **shell estático** que abre o Web App em um iframe.

## Arquivos

| Arquivo            | Função                                                                 |
|--------------------|------------------------------------------------------------------------|
| `index.html`       | Landing — mostra splash e injeta o iframe apontando para o `/exec` do Apps Script. |
| `CNAME`            | Diz ao GitHub Pages para servir o conteúdo no domínio personalizado.   |
| `manifest.json`    | Manifesto PWA (instalável como app no celular).                        |
| `.nojekyll`        | Desativa o pré-processamento Jekyll do GitHub Pages.                   |
| `images/`          | PNGs reais usados pelo splash, ícone, OG image e pelos templates Apps Script (mesmos arquivos servidos via `CONFIG.IMAGES.BASE_URL`). |

## Configuração obrigatória

1. **Publique o Web App no Apps Script** (Implantar → Nova implantação → Web app,
   acesso "Qualquer pessoa") e copie a URL que termina em `/exec`.

2. **Edite `docs/index.html`** e cole a URL na constante:
   ```js
   var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb…/exec';
   ```

3. **Suba os PNGs em `docs/images/`** com os nomes:
   - `logo-paroquia.png` (192×192 ou maior — usado como ícone PWA)
   - `panela-feijoada.png`
   - `sertao-forro.png`
   - `dancando-feijoes.png`

   Esses mesmos arquivos servem ao Apps Script via
   `CONFIG.IMAGES.BASE_URL = 'https://feijoada.pnscaparecida.com/images'`.

## Ativando o GitHub Pages

No repositório:

1. **Settings → Pages**
2. **Source:** `Deploy from a branch`
3. **Branch:** `main` · **Folder:** `/docs`
4. **Custom domain:** `feijoada.pnscaparecida.com`
5. Marque **Enforce HTTPS** depois que o cert for emitido.

## DNS (Cloudflare / provedor do domínio)

Crie um `CNAME` no subdomínio:

```
feijoada.pnscaparecida.com   CNAME   <seu-usuario>.github.io
```

(ou registros A apontando para os IPs do GitHub Pages — veja a doc oficial).

## Por que iframe e não só link?

Permite ter URL própria, ícone PWA, manifesto e splash com a identidade da
paróquia, escondendo a URL feia do `script.google.com`. A querystring
(`?cota=ouro`) é repassada ao iframe para que o link de cada cota continue
funcionando do jeito esperado.
