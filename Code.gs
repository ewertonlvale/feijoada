/**
 * Code.gs — Entrypoint do Web App Feijotacê 2026
 *
 * Router via ?page=<rota>:
 *   - patrocinadores (default) → landing com as cotas e patrocinadores
 *   - inscricao[&cota=bronze|prata|ouro] → formulário de adesão
 *   - obrigado → página de confirmação pós-envio
 *   - lista    → galeria pública completa de patrocinadores
 *   - cardapio → cardápio do evento (lê aba "cardapio" da planilha)
 */

const ROUTES = {
  patrocinadores: 'patrocinadores',
  inscricao:      'inscricao',
  obrigado:       'obrigado',
  lista:          'lista',
  cardapio:       'cardapio'
};

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const rawPage = String(params.page || 'patrocinadores').toLowerCase();
    const pageKey = ROUTES[rawPage] ? rawPage : 'patrocinadores';

    const t = HtmlService.createTemplateFromFile(pageKey);

    // Dados disponíveis em todos os templates.
    // Obs.: funções globais (siteUrl, include) são acessíveis diretamente
    // dos scriptlets no runtime V8 — não é preciso atribuí-las em `t`.
    t.params      = params;
    t.config      = CONFIG;
    t.eventData   = CONFIG.EVENTO;
    t.tiers       = CONFIG.TIERS;
    t.atracoes    = _resolveAtracoes_(CONFIG.ATRACOES, CONFIG.IMAGES);
    t.currentPage = pageKey;

    // URLs absolutas de cada imagem.
    // Cada chave expõe o PNG (compatível com qualquer browser, no <img src>)
    // e o WebP correspondente (mesmo path, extensão trocada — usado no
    // <source srcset> dentro de <picture>). Browsers que suportam WebP
    // baixam o WebP (~10× menor); fallback transparente nos demais.
    t.img = {
      sertao:     _imageUrl_('SERTAO'),
      sertaoWebp: _toWebp_(_imageUrl_('SERTAO')),
      logo:       _imageUrl_('LOGO'),
      logoWebp:   _toWebp_(_imageUrl_('LOGO'))
    };

    // Cardápio renderizado server-side — só pago a leitura da planilha
    // quando a rota é /cardapio. Outras rotas não precisam dos dados.
    if (pageKey === 'cardapio') {
      t.menu = listMenu();
      // Carrega patrocinadores Ouro pra mostrar como banner no topo do
      // cardápio (página mais acessada). Shuffle in-place pra ordem
      // randômica em cada renderização — `listSponsors` cacheia os DADOS
      // por 60s, mas o shuffle acontece depois do lookup, então cada
      // request mistura de novo (mesmo dentro do TTL do cache).
      var sp = listSponsors();
      var ouro = (sp && sp.ok && sp.sponsors)
        ? sp.sponsors.filter(function (s) { return s.cota === 'ouro'; })
        : [];
      // Fisher-Yates shuffle (algoritmo padrão, distribuição uniforme).
      for (var i = ouro.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = ouro[i]; ouro[i] = ouro[j]; ouro[j] = tmp;
      }
      t.ouroSponsors = ouro;
    }

    const title = (pageKey === 'cardapio')
      ? (CONFIG.EVENTO.nome + ' — Cardápio')
      : (CONFIG.EVENTO.nome + ' — Patrocínio');

    return t.evaluate()
      .setTitle(title)
      .setFaviconUrl('https://www.google.com/images/icons/product/script-48.png')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
    // Obs.: HtmlOutput.addMetaTag() só aceita uma lista branca
    // (viewport, description, author, keywords, generator, application-name).
    // A meta "theme-color" vive no <head> do docs/index.html (GitHub Pages).
  } catch (err) {
    // Fallback visual — se algo falhar no evaluate() ou num scriptlet, o
    // usuário recebe uma página legível em vez da stack trace crua do
    // Apps Script. O erro completo vai para o Stackdriver via console.error.
    console.error('doGet falhou:', err && err.stack ? err.stack : err);
    return _renderErrorPage_(err);
  }
}

/**
 * Página de erro amigável — usada quando doGet() falha antes de conseguir
 * renderizar a rota pedida. Mostra mensagem + stack pra diagnóstico.
 */
function _renderErrorPage_(err) {
  const escapeHtml = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };
  const msg = escapeHtml((err && err.message) || err || 'Erro desconhecido.');
  const stack = escapeHtml((err && err.stack) || '(sem stack)');
  const name = escapeHtml((err && err.name) || 'Error');

  const html =
    '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Erro — Feijotacê</title>' +
    '<style>' +
    'body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;' +
    'background:#FBEFDD;color:#A5430D;margin:0;padding:2rem 1.2rem;' +
    'display:flex;align-items:center;justify-content:center;min-height:100vh;}' +
    '.box{max-width:720px;background:#FFF6E9;border:2px dashed #F4A623;' +
    'border-radius:14px;padding:1.6rem 1.5rem;line-height:1.55;}' +
    'h1{font-size:1.4rem;color:#E76A1F;margin-bottom:0.6rem;}' +
    'p{margin-bottom:0.8rem;}' +
    '.kv{margin:0.6rem 0;}' +
    '.kv strong{display:inline-block;min-width:70px;}' +
    'code{background:rgba(46, 74, 130,0.08);padding:0.15rem 0.4rem;' +
    'border-radius:4px;font-size:0.88rem;}' +
    'pre{background:rgba(46, 74, 130,0.06);padding:0.8rem;' +
    'border-radius:6px;font-size:0.78rem;overflow:auto;' +
    'white-space:pre-wrap;word-break:break-word;max-height:260px;}' +
    '</style></head><body><div class="box">' +
    '<h1>Ops — não conseguimos carregar a página</h1>' +
    '<p>Houve um erro interno ao montar a página de patrocínio.' +
    ' A equipe já foi notificada no log.</p>' +
    '<div class="kv"><strong>Tipo:</strong> <code>' + name + '</code></div>' +
    '<div class="kv"><strong>Mensagem:</strong> <code>' + msg + '</code></div>' +
    '<div class="kv"><strong>Stack:</strong></div><pre>' + stack + '</pre>' +
    '<p>Se o problema continuar, nos chame pelo WhatsApp pela paróquia.</p>' +
    '</div></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setTitle('Erro — Feijotacê')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Diagnóstico server-side — rode isso do editor do Apps Script
 * (Executar ▶) pra ver em qual etapa de doGet o null aparece.
 * Retorna um objeto com check de cada dependência.
 */
function diagnose() {
  const result = { steps: [] };
  const step = function (name, fn) {
    try {
      const r = fn();
      result.steps.push({ name: name, ok: true, value: r });
    } catch (e) {
      result.steps.push({ name: name, ok: false, error: String(e && e.message || e) });
    }
  };
  step('CONFIG existe',        function () { return typeof CONFIG; });
  step('CONFIG.EVENTO.nome',   function () { return CONFIG.EVENTO && CONFIG.EVENTO.nome; });
  step('CONFIG.TIERS.length',  function () { return CONFIG.TIERS && CONFIG.TIERS.length; });
  step('CONFIG.IMAGES',        function () { return typeof CONFIG.IMAGES; });
  step('siteUrl é função',     function () { return typeof siteUrl; });
  step('include é função',     function () { return typeof include; });
  step('siteUrl("lista")',     function () { return siteUrl('lista'); });
  step('_imageUrl_("LOGO")',   function () { return _imageUrl_('LOGO'); });
  step('getTier("ouro")',      function () { return typeof getTier === 'function' ? !!getTier('ouro') : 'getTier não é função'; });
  step('createTemplateFromFile("patrocinadores")', function () {
    const t = HtmlService.createTemplateFromFile('patrocinadores');
    return typeof t;
  });
  step('createTemplateFromFile + evaluate', function () {
    const t = HtmlService.createTemplateFromFile('patrocinadores');
    t.params      = {};
    t.config      = CONFIG;
    t.eventData   = CONFIG.EVENTO;
    t.tiers       = CONFIG.TIERS;
    t.currentPage = 'patrocinadores';
    t.img = {
      sertao: _imageUrl_('SERTAO'),
      logo:   _imageUrl_('LOGO')
    };
    const html = t.evaluate().getContent();
    return 'evaluate ok, ' + html.length + ' chars';
  });
  return result;
}

/**
 * Inclui o conteúdo de outro arquivo HTML no template atual, processando
 * scriptlets (<?= ?>, <? ?>, <?!= ?>). Recebe um objeto opcional com as
 * variáveis que o template incluído precisa enxergar.
 *
 * Uso simples (sem scriptlets no arquivo incluído):
 *   <?!= include('shared_styles') ?>
 *
 * Uso com contexto:
 *   <?!= include('shared_topbar', { currentPage: currentPage, img: img }) ?>
 *
 * IMPORTANTE: NÃO passe funções (ex.: siteUrl) como valores do context.
 * O HtmlTemplate do Apps Script V8 trava com "object null is not a function"
 * ao ler propriedades do tipo function. Funções globais já são visíveis nos
 * scriptlets do template incluído — chame direto `<?= siteUrl('...') ?>`.
 */
function include(filename, context) {
  const t = HtmlService.createTemplateFromFile(filename);
  if (context && typeof context === 'object') {
    Object.keys(context).forEach(function (k) { t[k] = context[k]; });
  }
  return t.evaluate().getContent();
}

/**
 * Constrói uma URL pública no custom domain (GitHub Pages), usada pelos
 * templates como destino de <a href> com target="_top".
 *
 * Cada rota tem seu próprio shell HTML em docs/:
 *   patrocinadores → /            (docs/index.html)
 *   lista          → /lista.html
 *   inscricao      → /inscricao.html  (ex.: /inscricao.html?cota=ouro)
 *   obrigado       → /obrigado.html   (ex.: /obrigado.html?cota=ouro)
 *   cardapio       → /cardapio.html
 *
 * Exemplo em template:
 *   <a href="<?= siteUrl('lista') ?>" target="_top">Patrocinadores</a>
 *   <a href="<?= siteUrl('inscricao', { cota: 'ouro' }) ?>" target="_top">Apoiar Ouro</a>
 */
function siteUrl(page, extraParams) {
  const base = String(CONFIG.CUSTOM_BASE_URL || '').replace(/\/+$/, '');
  const paths = {
    patrocinadores: '/',
    lista:          '/lista.html',
    inscricao:      '/inscricao.html',
    obrigado:       '/obrigado.html',
    cardapio:       '/cardapio.html'
  };
  if (page && !paths[page]) {
    console.warn('siteUrl: rota desconhecida:', page);
  }
  const path = paths[page] || '/';
  let url = base + path;

  if (extraParams) {
    const qp = [];
    for (const k in extraParams) {
      if (Object.prototype.hasOwnProperty.call(extraParams, k)) {
        const v = extraParams[k];
        if (v === null || v === undefined || v === '') continue;
        qp.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
      }
    }
    if (qp.length) url += '?' + qp.join('&');
  }
  return url;
}

/**
 * Resolve `CONFIG.ATRACOES` em uma lista pronta pro template, com
 * `poster_url` absoluto. Aceita tanto `'marquinhos.png'` (filename
 * relativo a /images/atracoes/) quanto URL completa começando com http.
 *
 * Se `images.BASE_URL` não estiver configurada ou o `poster` for vazio,
 * a entrada vai com `poster_url: ''` — o template trata exibindo só uma
 * moldura cinza com o nome (degradação graciosa).
 *
 * @param {Array<{nome:string, poster:string}>} atracoes
 * @param {object} images  Bloco CONFIG.IMAGES com BASE_URL.
 * @return {Array<{nome:string, poster_url:string}>}
 */
function _resolveAtracoes_(atracoes, images) {
  if (!atracoes || !atracoes.length) return [];
  return atracoes.map(function (a) {
    var nome = String(a && a.nome || '').trim();
    // `poster` é o NOME do arquivo na pasta pública do Drive (ex.:
    // 'dj_titio.png') ou uma URL completa. Resolvido via _driveImageUrl_.
    var url = _driveImageUrl_(String(a && a.poster || '').trim());
    return {
      nome: nome,
      poster_url: url,
      // Drive serve a imagem única (sem variante WebP separada).
      poster_url_webp: ''
    };
  });
}

/**
 * Monta a URL completa de uma imagem definida em CONFIG.IMAGES.
 * Aceita valores tanto como filename (concatena com BASE_URL) quanto
 * como URL absoluta (começando com http).
 *
 * @param {string} key  Chave em CONFIG.IMAGES (PANELA, SERTAO, LOGO, DANCA)
 * @return {string} URL absoluta pronta para src=""
 */
function _imageUrl_(key) {
  const images = CONFIG.IMAGES || {};
  const file = images[key];
  if (!file) return '';
  // Se já veio URL absoluto, retorna como está
  if (/^https?:\/\//i.test(file)) return file;
  const base = (images.BASE_URL || '').replace(/\/+$/, '');
  if (!base) return file;
  return base + '/' + String(file).replace(/^\/+/, '');
}

/**
 * Troca a extensão final por `.webp`. Usado pra montar a URL do WebP a
 * partir da URL do PNG configurada em CONFIG.IMAGES, sem precisar
 * duplicar a chave no Config.
 *
 * Se a string não terminar com `.png`/`.jpg`/`.jpeg`, retorna vazio
 * (assim o template detecta e não emite um `<source>` quebrado).
 */
function _toWebp_(url) {
  if (!url) return '';
  const m = String(url).match(/^(.+)\.(png|jpe?g)$/i);
  return m ? (m[1] + '.webp') : '';
}

/**
 * Monta o mapa { nomeDoArquivo(minúsculo) -> URL pública } varrendo a pasta
 * pública do Drive (CONFIG.DRIVE_IMAGES_FOLDER_ID). O resultado é cacheado
 * por 5 minutos (CacheService) — subir/renomear imagem reflete em poucos
 * minutos, sem varrer o Drive a cada visita.
 *
 * A URL usa o endpoint de thumbnail do Drive, que é o método confiável hoje
 * para exibir imagens públicas do Drive em <img> (o antigo uc?export=view
 * foi descontinuado). Aceita tamanhos grandes via sz=w<largura>.
 *
 * @return {Object<string,string>} mapa nome->URL (vazio se algo falhar).
 */
function _driveImageMap_() {
  const folderId = String(CONFIG.DRIVE_IMAGES_FOLDER_ID || '').trim();
  if (!folderId) return {};
  const cache = CacheService.getScriptCache();
  const ckey = 'driveImgMap_' + folderId;
  const hit = cache.get(ckey);
  if (hit) {
    try { return JSON.parse(hit); } catch (e) { /* cache corrompido: recarrega */ }
  }
  const size = String(CONFIG.DRIVE_IMAGE_SIZE || 'w1600');
  const map = {};
  try {
    const it = DriveApp.getFolderById(folderId).getFiles();
    while (it.hasNext()) {
      const f = it.next();
      map[String(f.getName()).toLowerCase()] =
        'https://drive.google.com/thumbnail?id=' + f.getId() + '&sz=' + size;
    }
  } catch (err) {
    console.error('_driveImageMap_ falhou (verifique o ID da pasta e o compartilhamento): '
      + (err && err.message ? err.message : err));
    return {};
  }
  try { cache.put(ckey, JSON.stringify(map), 300); } catch (e) { /* >100KB: segue sem cache */ }
  return map;
}

/**
 * Resolve um valor de imagem (nome de arquivo na pasta do Drive OU URL
 * completa) em uma URL pronta para <img src>.
 *
 *   - "acme.png"            -> URL pública do Drive (via _driveImageMap_)
 *   - "https://.../x.png"   -> passa direto (compat com valores antigos)
 *   - vazio / inválido / não encontrado -> '' (front-end não exibe imagem)
 *
 * @param {string} raw  Nome do arquivo ou URL.
 * @return {string} URL absoluta ou ''.
 */
function _driveImageUrl_(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (!s) return '';
  // URL completa: valida e passa direto.
  if (/^https?:\/\//i.test(s)) return /^https?:\/\/\S+$/i.test(s) ? s : '';
  // Defesa contra path traversal e caminhos — usa só o nome do arquivo.
  if (s.indexOf('..') !== -1) return '';
  const filename = s.split(/[/\\]/).pop();
  if (!filename) return '';
  const map = _driveImageMap_();
  return map[filename.toLowerCase()] || '';
}

/**
 * Healthcheck simples. Útil para testar do editor do Apps Script
 * antes de publicar (Executar ▶ → ping). Não é rota do router.
 */
function ping() {
  return {
    ok: true,
    now: new Date().toISOString(),
    evento: CONFIG.EVENTO.nome,
    scriptUrl: ScriptApp.getService().getUrl() || '(não publicado)'
  };
}
