/**
 * Menu.gs — Cardápio do evento, lido da aba `cardapio` da planilha.
 *
 * Estrutura da aba (cabeçalhos da linha 1):
 *   categoria | nome | descricao | preco | ativo | ordem
 *
 *   - categoria: uma das strings em CONFIG.MENU_CATEGORIAS (case-insensitive)
 *   - nome:      como aparece no cardápio (ex.: "Cerveja Skol — lata")
 *   - descricao: opcional, exibida em itálico embaixo do nome
 *   - preco:     número (R$). Vazio = "a definir" no site.
 *   - ativo:     TRUE/FALSE — FALSE oculta o item sem deletar a linha
 *   - ordem:     número, ordenação dentro da categoria (gaps tipo 10/20/30
 *                facilitam inserir entre depois)
 *
 * Uso pelo template:
 *   const result = listMenu();
 *   result.groups → [{ categoria, items: [...] }, ...]
 *
 * O front-end NÃO chama listMenu() — Code.gs entrega os dados ao template
 * em tempo de doGet (renderização server-side, sem spinner de carregamento).
 */

const MENU_HEADERS = [
  'categoria',
  'nome',
  'descricao',
  'preco',
  'ativo',
  'ordem'
];

const MENU_CACHE_KEY = 'menu_v1';
const MENU_CACHE_TTL_S = 60;

/**
 * Falha cedo se a planilha não estiver configurada — evita erro genérico
 * "Unable to open spreadsheet" do Sheets API.
 */
function _assertMenuConfigured_() {
  const id = String(CONFIG.SPREADSHEET_ID || '');
  if (!id || /COLOQUE_AQUI/i.test(id)) {
    throw new Error('Planilha não configurada. Edite CONFIG.SPREADSHEET_ID em Config.gs.');
  }
  const tab = String(CONFIG.MENU_SHEET_NAME || '');
  if (!tab) {
    throw new Error('Aba do cardápio não configurada. Edite CONFIG.MENU_SHEET_NAME em Config.gs.');
  }
}

/**
 * Cria a aba `cardapio` com cabeçalhos e linhas-exemplo se ainda não existir.
 * Rode uma vez do editor do Apps Script (Executar ▶ → setupMenuSheet) depois
 * de configurar CONFIG.MENU_SHEET_NAME.
 *
 * Não sobrescreve nada — é seguro rodar múltiplas vezes.
 */
function setupMenuSheet() {
  _assertMenuConfigured_();
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.MENU_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.MENU_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(MENU_HEADERS);
    sheet.setFrozenRows(1);
    const header = sheet.getRange(1, 1, 1, MENU_HEADERS.length);
    header.setFontWeight('bold').setBackground('#E76A1F').setFontColor('#FFF6E9');

    // Linhas-exemplo — admin sobrescreve com valores reais.
    // Os preços ficam em branco de propósito ("a definir" no site).
    const examples = [
      ['Prato principal',  'Feijoada — porção',           'Feijão preto com carnes variadas, arroz branco, couve refogada, farofa e laranja em rodelas', '', true, 10],
      ['Espetinho',        'Espetinho',                   'mix de tipos definido na compra', '', true, 10],
      ['Bebidas',          'Cerveja Skol — lata',         '', '', true, 10],
      ['Bebidas',          'Cerveja Skol — long neck',    '', '', true, 20],
      ['Bebidas',          'Cerveja Heineken — lata',     '', '', true, 30],
      ['Bebidas',          'Cerveja Heineken — long neck','', '', true, 40],
      ['Bebidas',          'Coquetel',                    'caipirinhas e batidas', '', true, 50],
      ['Bebidas',          'Cajuína',                     '', '', true, 60],
      ['Bebidas',          'Refrigerante — lata 350 ml',  '', '', true, 70],
      ['Bebidas',          'Suco',                        '', '', true, 80],
      ['Bebidas',          'Água mineral — 500 ml',       '', '', true, 90],
      ['Doces e gelados',  'Cremosinho',                  '', '', true, 10],
      ['Doces e gelados',  'Dindim',                      '', '', true, 20],
      ['Doces e gelados',  'Bolo no pote',                '', '', true, 30],
      ['Doces e gelados',  'Trufa',                       '', '', true, 40]
    ];
    sheet.getRange(2, 1, examples.length, MENU_HEADERS.length).setValues(examples);
    sheet.autoResizeColumns(1, MENU_HEADERS.length);
  }
  return 'OK — aba "' + CONFIG.MENU_SHEET_NAME + '" pronta.';
}

/**
 * Invalida o cache do cardápio. Admin que editar a planilha manualmente
 * pode rodar essa função do editor pra forçar refresh imediato.
 */
function clearMenuCache() {
  try { CacheService.getScriptCache().remove(MENU_CACHE_KEY); }
  catch (e) { /* cache opcional */ }
}

/**
 * Lê o cardápio da planilha e devolve agrupado por categoria, na ordem
 * definida em CONFIG.MENU_CATEGORIAS.
 *
 * @return {object}  { ok, groups: [{ categoria, items: [...] }, ...] }
 *                   item: { nome, descricao, preco, preco_label, ordem }
 *                   preco_label: "R$ 8" se número, "a definir" se vazio.
 */
function listMenu() {
  // Cache curto pra refletir edições do admin sem hit a cada render.
  try {
    const cached = CacheService.getScriptCache().get(MENU_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (e) { /* segue */ }

  try {
    _assertMenuConfigured_();
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.MENU_SHEET_NAME);
    if (!sheet) {
      // Aba ainda não existe — devolve estrutura vazia mas válida.
      // Permite a página /cardapio renderizar com placeholder amigável
      // antes do admin rodar setupMenuSheet().
      return { ok: true, groups: _emptyGroups_() };
    }

    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return { ok: true, groups: _emptyGroups_() };

    const headers = values[0];
    const idx = {};
    headers.forEach(function (h, i) { idx[String(h || '').toLowerCase()] = i; });

    const required = ['categoria', 'nome', 'preco', 'ativo'];
    const missing = required.filter(function (c) { return idx[c] === undefined; });
    if (missing.length) {
      console.error('Colunas ausentes na aba cardapio:', missing);
      return {
        ok: false,
        error: 'Aba "' + CONFIG.MENU_SHEET_NAME + '" fora do esquema (colunas: ' + missing.join(', ') + ').',
        groups: _emptyGroups_()
      };
    }

    const col = function (row, name) {
      const i = idx[name];
      return i === undefined ? '' : row[i];
    };

    // Mapeia categorias permitidas em lookup case-insensitive.
    const allowed = {};
    CONFIG.MENU_CATEGORIAS.forEach(function (c) {
      allowed[c.toLowerCase()] = c;
    });

    const items = [];
    values.slice(1).forEach(function (r) {
      const ativo = col(r, 'ativo');
      // Sheets devolve TRUE/FALSE como boolean; "FALSE" como string conta
      // como truthy. Normalizamos para tratar ambos.
      const isAtivo = ativo === true ||
                      String(ativo).toLowerCase() === 'true' ||
                      String(ativo).toLowerCase() === 'sim';
      if (!isAtivo) return;

      const catRaw = String(col(r, 'categoria') || '').trim();
      const cat = allowed[catRaw.toLowerCase()];
      if (!cat) {
        if (catRaw) console.warn('Categoria fora da lista permitida:', catRaw);
        return;
      }

      const nome = String(col(r, 'nome') || '').trim();
      if (!nome) return;

      const precoRaw = col(r, 'preco');
      const preco = (precoRaw === '' || precoRaw === null || precoRaw === undefined)
        ? null
        : Number(precoRaw);
      const precoValid = preco !== null && !isNaN(preco) && preco > 0;

      items.push({
        categoria:   cat,
        nome:        nome,
        descricao:   String(col(r, 'descricao') || '').trim(),
        preco:       precoValid ? preco : null,
        preco_label: precoValid ? _formatPrice_(preco) : 'a definir',
        ordem:       Number(col(r, 'ordem')) || 999
      });
    });

    // Agrupa por categoria preservando a ordem de CONFIG.MENU_CATEGORIAS.
    const groups = CONFIG.MENU_CATEGORIAS.map(function (cat) {
      const list = items
        .filter(function (i) { return i.categoria === cat; })
        .sort(function (a, b) {
          if (a.ordem !== b.ordem) return a.ordem - b.ordem;
          return a.nome.localeCompare(b.nome, 'pt-BR');
        });
      return { categoria: cat, items: list };
    });

    const result = { ok: true, groups: groups };
    try {
      CacheService.getScriptCache().put(
        MENU_CACHE_KEY, JSON.stringify(result), MENU_CACHE_TTL_S
      );
    } catch (e) { /* cache cheio? segue sem cache */ }
    return result;
  } catch (err) {
    console.error('listMenu falhou:', err);
    return { ok: false, error: String(err.message || err), groups: _emptyGroups_() };
  }
}

/** Formata número como "R$ 8" ou "R$ 8,50". Sem casas se for inteiro. */
function _formatPrice_(n) {
  if (n === Math.floor(n)) return 'R$ ' + n;
  return 'R$ ' + n.toFixed(2).replace('.', ',');
}

/** Estrutura vazia mas válida — cada categoria com items: []. */
function _emptyGroups_() {
  return CONFIG.MENU_CATEGORIAS.map(function (cat) {
    return { categoria: cat, items: [] };
  });
}
