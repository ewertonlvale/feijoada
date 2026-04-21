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
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .addMetaTag('theme-color', '#8B2E2E');
}

/**
 * Inclui o conteúdo de outro arquivo HTML no template atual.
 * Uso: <?!= include('shared_styles') ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Constrói uma URL para outra rota do próprio web app.
 * Uso em template: <?= urlFor('inscricao', { cota: 'ouro' }) ?>
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
