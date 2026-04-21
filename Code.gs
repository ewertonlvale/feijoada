/**
 * Code.gs — Entrypoint do Web App Feijoada das Famílias 2026
 *
 * Router via ?page=<rota>:
 *   - patrocinadores (default) → landing com as cotas
 *   - inscricao[&cota=bronze|prata|ouro] → formulário de adesão
 *   - obrigado → página de confirmação pós-envio
 *   - lista   → galeria pública de patrocinadores confirmados
 */

const ROUTES = {
  patrocinadores: 'patrocinadores',
  inscricao:      'inscricao',
  obrigado:       'obrigado',
  lista:          'lista'
};

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const pageKey = String(params.page || 'patrocinadores').toLowerCase();
  const templateName = ROUTES[pageKey] || 'patrocinadores';

  const t = HtmlService.createTemplateFromFile(templateName);

  // Dados disponíveis em todos os templates
  t.scriptUrl   = ScriptApp.getService().getUrl() || '';
  t.params      = params;
  t.config      = CONFIG;
  t.eventData   = CONFIG.EVENTO;
  t.tiers       = CONFIG.TIERS;
  t.currentPage = pageKey in ROUTES ? pageKey : 'patrocinadores';

  // Função helper que os templates usam pra gerar links pro custom domain.
  // Binda com bind() pra garantir o `this` correto no scope do template.
  t.siteUrl = siteUrl;

  // URLs absolutas de cada imagem (já prontas para usar no src="...")
  t.img = {
    panela: _imageUrl_('PANELA'),
    sertao: _imageUrl_('SERTAO'),
    logo:   _imageUrl_('LOGO'),
    danca:  _imageUrl_('DANCA')
  };

  const title = CONFIG.EVENTO.nome + ' — Patrocínio';

  return t.evaluate()
    .setTitle(title)
    .setFaviconUrl('https://www.google.com/images/icons/product/script-48.png')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
  // Obs.: HtmlOutput.addMetaTag() só aceita uma lista branca
  // (viewport, description, author, keywords, generator, application-name).
  // A meta "theme-color" vive no <head> do docs/index.html (GitHub Pages).
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
 *   <?!= include('shared_topbar', { siteUrl: siteUrl, currentPage: currentPage, img: img }) ?>
 */
function include(filename, context) {
  const t = HtmlService.createTemplateFromFile(filename);
  if (context && typeof context === 'object') {
    Object.keys(context).forEach(function (k) { t[k] = context[k]; });
  }
  return t.evaluate().getContent();
}

/**
 * Constrói uma URL para outra rota do próprio web app (Apps Script direto).
 * Uso raro — só quando precisamos mesmo do URL /exec (ex.: redirect server-side).
 * Para links públicos em templates, prefira siteUrl().
 */
function urlFor(page, extraParams) {
  const base = ScriptApp.getService().getUrl() || '';
  const qp = ['page=' + encodeURIComponent(page)];
  if (extraParams) {
    for (const k in extraParams) {
      if (Object.prototype.hasOwnProperty.call(extraParams, k)) {
        qp.push(encodeURIComponent(k) + '=' + encodeURIComponent(extraParams[k]));
      }
    }
  }
  return base + '?' + qp.join('&');
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
    obrigado:       '/obrigado.html'
  };
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
 * Healthcheck simples. Útil para testar do editor do Apps Script
 * antes de publicar (Executar ▶ → ping).
 */
function ping() {
  return {
    ok: true,
    now: new Date().toISOString(),
    evento: CONFIG.EVENTO.nome,
    scriptUrl: ScriptApp.getService().getUrl() || '(não publicado)'
  };
}
