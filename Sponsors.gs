/**
 * Sponsors.gs — CRUD da planilha de patrocinadores.
 *
 * Todas as funções chamáveis via google.script.run do front-end
 * (inscricao.html, lista.html) vivem aqui.
 */

const SHEET_HEADERS = [
  'timestamp',
  'nome',
  'empresa',
  'whatsapp',
  'email',
  'cota',
  'valor',
  'status',
  'logo_url',
  'mensagem',
  'origem',
  // ── Campos de contato pública (preenchidos pelo admin na planilha) ──
  // Aparecem nos cards de patrocinador na home e na /lista como ícones
  // clicáveis. Vazios = ícone simplesmente não é exibido.
  'instagram_url',  // ex.: https://instagram.com/padaria_aparecida
  'whatsapp_num',   // só dígitos, ex.: 5586999999999  (sem +, sem espaços)
  'endereco',       // texto livre — exibido como tooltip no botão Endereço
  'maps_url'        // ex.: https://maps.google.com/?q=...  (abre no Maps)
];

/** Status que fazem o patrocinador aparecer na galeria pública. */
const VISIBLE_STATUSES = { confirmado: true };

/** Cache do listSponsors. TTL curto pra refletir edições do admin. */
const SPONSORS_CACHE_KEY = 'sponsors_v2';
const SPONSORS_CACHE_TTL_S = 60;

/**
 * Guard contra placeholder: se o admin publicou o Web App sem preencher
 * CONFIG.SPREADSHEET_ID, falha cedo com uma mensagem clara em vez de dar
 * "Unable to open spreadsheet" genérico do Sheets API.
 */
function _assertSpreadsheetConfigured_() {
  const id = String(CONFIG.SPREADSHEET_ID || '');
  if (!id || /COLOQUE_AQUI/i.test(id)) {
    throw new Error('Planilha não configurada. Edite CONFIG.SPREADSHEET_ID em Config.gs.');
  }
}

/**
 * Garante que a aba de patrocinadores existe e tem cabeçalho.
 * - Se a aba não existir, cria.
 * - Se a aba existir mas estiver vazia (ex.: usuário renomeou a default
 *   "Sheet1" para "patrocinadores"), escreve os cabeçalhos.
 * - Se já houver dados, deixa como está.
 */
function _getOrCreateSheet_() {
  _assertSpreadsheetConfigured_();
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    sheet.setFrozenRows(1);
    const header = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
    header.setFontWeight('bold').setBackground('#E76A1F').setFontColor('#FFF6E9');
  } else {
    // Migração automática: planilhas antigas (criadas antes dos campos
    // de contato existirem) ganham os cabeçalhos faltantes anexados à
    // direita. Não toca em ordem ou conteúdo das colunas existentes.
    const lastCol = sheet.getLastColumn();
    const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const existingSet = {};
    existing.forEach(function (h) { existingSet[String(h || '').toLowerCase()] = true; });
    const missing = SHEET_HEADERS.filter(function (h) { return !existingSet[h.toLowerCase()]; });
    if (missing.length) {
      const startCol = lastCol + 1;
      sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
      sheet.getRange(1, startCol, 1, missing.length)
        .setFontWeight('bold').setBackground('#E76A1F').setFontColor('#FFF6E9');
      console.info('Adicionei colunas que faltavam:', missing.join(', '));
    }
  }
  return sheet;
}

/**
 * Saneia strings vindas do front-end.
 *
 * O prefixo com `'` quando a string começa com [=+\-@] é a defesa contra
 * formula injection. OBS: o apóstrofe não aparece quando a célula é lida
 * de volta via getValues() — ele é só um "marcador de texto" no Sheets.
 * Próximo dev: não remova esse prefixo achando que é bug de exibição.
 */
function _clean_(v, maxLen) {
  if (v === null || v === undefined) return '';
  let s = String(v).trim();
  if (maxLen && s.length > maxLen) s = s.substring(0, maxLen);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

/** Normaliza um whatsapp para comparação (só dígitos). */
function _normalizeWhatsapp_(s) {
  return String(s || '').replace(/\D/g, '');
}

/**
 * Valida uma URL para ser exibida em <a href="..."> ou <img src="...">.
 * Aceita apenas http:// e https:// para impedir javascript: / data: URIs.
 *
 * Usado tanto para logo_url, instagram_url, quanto maps_url.
 */
function _isSafeUrl_(url) {
  if (!url) return false;
  return /^https?:\/\/\S+$/i.test(String(url).trim());
}

/**
 * Resolve o valor do `logo_url` da planilha em uma URL absoluta.
 *
 * Agora as imagens vêm da pasta pública do Google Drive
 * (CONFIG.DRIVE_IMAGES_FOLDER_ID). Basta salvar o NOME do arquivo na
 * planilha — ex.: "acme.png". URLs completas (http...) ainda passam direto,
 * mantendo compatibilidade com linhas antigas.
 *
 * A lógica de resolução (nome→URL do Drive, cache, validação e defesa
 * contra path traversal) vive em _driveImageUrl_ (Code.gs).
 */
function _resolveLogoUrl_(raw) {
  return _driveImageUrl_(raw);
}

// Alias histórico — alguns trechos antigos chamavam _isSafeLogoUrl_.
// Mantido para não quebrar caso alguém referencie em código adicional.
function _isSafeLogoUrl_(url) { return _isSafeUrl_(url); }

/**
 * Invalida o cache de patrocinadores. Chame depois de alterar a planilha
 * via script (registerSponsor já faz isso). O admin que edita manualmente
 * pode rodar essa função do editor pra forçar refresh imediato.
 */
function clearSponsorsCache() {
  try { CacheService.getScriptCache().remove(SPONSORS_CACHE_KEY); }
  catch (e) { /* cache opcional, não falhar */ }
}

/**
 * Migração on-demand — garante que a planilha tem todos os cabeçalhos
 * de SHEET_HEADERS. Útil ao adicionar colunas novas (instagram_url,
 * whatsapp_num, etc.) numa planilha já em produção, sem esperar uma
 * inscrição nova pra rodar a migração.
 *
 * Rode do editor: Executar ▶ → setupSponsorsSheet
 */
function setupSponsorsSheet() {
  _getOrCreateSheet_();
  clearSponsorsCache();
  return 'OK — aba "' + CONFIG.SHEET_NAME + '" alinhada com SHEET_HEADERS.';
}

/**
 * Registra um novo patrocinador interessado.
 *
 * @param {object} input  { nome, empresa, whatsapp, instagram, endereco,
 *                          cota, mensagem, website }
 *                        `website` é o honeypot anti-bot (deve vir vazio).
 * @return {object}       { ok, cota, valor, redirect }  ou  { ok: false, error }
 */
function registerSponsor(input) {
  try {
    if (!input || typeof input !== 'object') {
      throw new Error('Dados inválidos.');
    }

    // Honeypot: bots preenchem todos os campos, humanos não enxergam
    // o input .hp-field. Se `website` veio preenchido, aceitamos
    // silenciosamente pro bot acreditar que funcionou, mas nada grava.
    if (_clean_(input.website, 200)) {
      console.warn('Honeypot acionado — submissão ignorada.');
      return {
        ok: true,
        cota: 'bronze',
        valor: 0,
        redirect: siteUrl('obrigado')
      };
    }

    const nome      = _clean_(input.nome, 120);
    const empresa   = _clean_(input.empresa, 120);
    const whatsapp  = _clean_(input.whatsapp, 30);
    const instagram = _clean_(input.instagram, 80);
    const endereco  = _clean_(input.endereco, 200);
    const cotaRaw   = _clean_(input.cota, 20).toLowerCase();
    const mensagem  = _clean_(input.mensagem, 800);

    if (!nome)     throw new Error('Informe seu nome.');
    if (!whatsapp) throw new Error('Informe um WhatsApp para contato.');

    // Validação de formato no backend (fonte de verdade — HTML type=tel
    // ajuda a UX mas é burlável via POST direto).
    if (!CONFIG.VALIDATION.WHATSAPP_REGEX.test(whatsapp)) {
      throw new Error('WhatsApp em formato inválido. Ex.: (86) 99999-9999.');
    }

    const tier = getTier(cotaRaw);
    if (!tier) throw new Error('Cota inválida. Escolha Bronze, Prata ou Ouro.');

    // ── Normalização do Instagram ──
    // Aceita "@handle", "handle", "instagram.com/handle", URL completa, etc.
    // Resultado: "https://instagram.com/<handle>" ou string vazia.
    //
    // O strip inicial de ['"] é defesa contra o prefixo de apóstrofo que
    // _clean_() adiciona quando o input começa com @ (proteção contra
    // formula injection do Sheets). Sem isso, "@teste" virava "'@teste"
    // e o @ não era removido.
    let instagramUrl = '';
    if (instagram) {
      const handle = String(instagram)
        .replace(/^['"]+/, '')
        .replace(/^https?:\/\//i, '')
        .replace(/^(?:www\.)?instagram\.com\//i, '')
        .replace(/^@+/, '')
        .split(/[?#\/]/)[0]
        .trim();
      if (handle) instagramUrl = 'https://instagram.com/' + handle;
    }

    // ── Normalização do WhatsApp ──
    // Só dígitos com prefixo 55. wa.me/<num> exige formato internacional.
    const waDigits = whatsapp.replace(/\D/g, '');
    const whatsappNum = waDigits
      ? (waDigits.indexOf('55') === 0 ? waDigits : ('55' + waDigits))
      : '';

    // ── maps_url derivada do endereço ──
    const mapsUrl = endereco
      ? ('https://maps.google.com/?q=' + encodeURIComponent(endereco))
      : '';

    // Lock para evitar race condition em duas submissões simultâneas.
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      throw new Error('Sistema ocupado, tente novamente em instantes.');
    }
    try {
      const sheet = _getOrCreateSheet_();
      // Monta a row a partir de SHEET_HEADERS para garantir alinhamento
      // mesmo que algum dia adicionem coluna nova entre as existentes.
      const rowData = {
        timestamp:     new Date(),
        nome:          nome,
        empresa:       empresa,
        whatsapp:      whatsapp,
        email:         '',  // campo histórico — formulário não pede mais
        cota:          tier.slug,
        valor:         tier.valor,
        status:        'pendente',
        logo_url:      '',
        mensagem:      mensagem,
        origem:        'site',
        instagram_url: instagramUrl,
        whatsapp_num:  whatsappNum,
        endereco:      endereco,
        maps_url:      mapsUrl
      };
      const row = SHEET_HEADERS.map(function (h) {
        return rowData[h] !== undefined ? rowData[h] : '';
      });
      sheet.appendRow(row);
      clearSponsorsCache();
    } finally {
      lock.releaseLock();
    }

    // Notificação por email (opcional) ao admin
    if (CONFIG.NOTIFY_EMAIL) {
      try {
        const subject = '[Feijoada 2026] Novo patrocinador — ' + tier.nome + ' · ' + (empresa || nome);
        const body =
          'Novo interesse de patrocínio:\n\n' +
          'Nome:      ' + nome + '\n' +
          'Empresa:   ' + empresa + '\n' +
          'WhatsApp:  ' + whatsapp + '\n' +
          'Instagram: ' + (instagramUrl || '(não informado)') + '\n' +
          'Endereço:  ' + (endereco || '(não informado)') + '\n' +
          'Cota:      ' + tier.nome + ' (R$ ' + tier.valor + ')\n' +
          'Mensagem:\n' + (mensagem || '(sem mensagem)') + '\n\n' +
          'Status inicial: pendente\n' +
          '→ Lembre de trocar para "confirmado" na planilha assim que o\n' +
          '  pagamento for compensado, pra o logo aparecer na galeria pública.\n\n' +
          'Registrado em: ' + new Date().toLocaleString('pt-BR');
        MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, subject, body);
      } catch (mailErr) {
        // Não quebra o fluxo se o email falhar
        console.warn('Falha ao enviar email de notificação:', mailErr);
      }
    }

    return {
      ok: true,
      cota: tier.slug,
      valor: tier.valor,
      redirect: siteUrl('obrigado', { cota: tier.slug })
    };
  } catch (err) {
    console.error('registerSponsor falhou:', err);
    return { ok: false, error: String(err.message || err) };
  }
}

/**
 * Lista patrocinadores confirmados para exibir na galeria pública.
 * Só devolve linhas com status = "confirmado".
 *
 * Faz validação defensiva do schema: se alguém renomear uma coluna na
 * planilha, devolve erro explícito em vez de esconder tudo silenciosamente.
 *
 * @return {object}  { ok, sponsors }  ou  { ok: false, error, sponsors: [] }
 */
function listSponsors() {
  // ── Cache curto (60s) ──
  // 40 patrocinadores * Sheets API a cada visita = lentidão e quota.
  // O front-end nunca espera mais que 60s pra ver edição manual feita
  // na planilha; admin que precisa de refresh imediato roda
  // clearSponsorsCache() do editor.
  try {
    const cached = CacheService.getScriptCache().get(SPONSORS_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (e) { /* cache opcional, segue com leitura normal */ }

  try {
    _assertSpreadsheetConfigured_();
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return { ok: true, sponsors: [] };

    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return { ok: true, sponsors: [] };

    const headers = values[0];
    const idx = {};
    headers.forEach(function (h, i) { idx[String(h || '').toLowerCase()] = i; });

    const required = ['status', 'cota', 'nome', 'empresa', 'logo_url', 'mensagem'];
    const missing = required.filter(function (c) { return idx[c] === undefined; });
    if (missing.length) {
      console.error('Colunas ausentes na planilha:', missing);
      return {
        ok: false,
        error: 'Planilha fora do esquema esperado (colunas: ' + missing.join(', ') + ').',
        sponsors: []
      };
    }

    // Helper local — só lê coluna se ela existe (campos novos podem estar
    // ausentes em planilhas que ainda não foram atualizadas com os headers).
    const col = function (row, name) {
      const i = idx[name];
      return i === undefined ? '' : row[i];
    };

    const sponsors = values.slice(1)
      .map(function (r) {
        const status = String(col(r, 'status') || '').toLowerCase();
        if (!VISIBLE_STATUSES[status]) return null;

        const rawLogo = String(col(r, 'logo_url') || '').trim();
        const rawIg   = String(col(r, 'instagram_url') || '').trim();
        const rawWa   = String(col(r, 'whatsapp_num') || '').replace(/\D/g, '');
        const rawMaps = String(col(r, 'maps_url') || '').trim();
        const rawEnd  = String(col(r, 'endereco') || '').trim();

        return {
          nome:     String(col(r, 'nome') || ''),
          empresa:  String(col(r, 'empresa') || ''),
          cota:     String(col(r, 'cota') || '').toLowerCase(),
          valor:    Number(col(r, 'valor')) || 0,
          mensagem: String(col(r, 'mensagem') || ''),
          // logo_url aceita "cielcursos.png" (nome do arquivo) ou URL
          // completa. _resolveLogoUrl_ trata ambos os casos e bloqueia
          // path traversal.
          logo_url:      _resolveLogoUrl_(rawLogo),
          // Só expõe URLs se o esquema for seguro (http/https).
          // Isso evita payloads do tipo javascript: chegarem ao DOM.
          instagram_url: _isSafeUrl_(rawIg)   ? rawIg   : '',
          maps_url:      _isSafeUrl_(rawMaps) ? rawMaps : '',
          // whatsapp_url derivado do número — front não precisa montar.
          // 8 a 15 dígitos = mais permissivo que o regex de validação,
          // mas o suficiente pra rejeitar lixo óbvio.
          whatsapp_url:  /^\d{8,15}$/.test(rawWa) ? ('https://wa.me/' + rawWa) : '',
          endereco:      rawEnd
        };
      })
      .filter(function (s) { return s !== null; });

    // Ordem: Ouro → Prata → Bronze, depois alfabético por empresa/nome.
    // O front-end usa essa ordenação direta — fatia em ouro/!ouro pra
    // separar carrossel da lista vertical da home.
    const order = { ouro: 0, prata: 1, bronze: 2 };
    sponsors.sort(function (a, b) {
      const oa = order[a.cota] === undefined ? 99 : order[a.cota];
      const ob = order[b.cota] === undefined ? 99 : order[b.cota];
      if (oa !== ob) return oa - ob;
      return (a.empresa || a.nome).localeCompare(b.empresa || b.nome, 'pt-BR');
    });

    const result = { ok: true, sponsors: sponsors };
    try {
      CacheService.getScriptCache().put(
        SPONSORS_CACHE_KEY, JSON.stringify(result), SPONSORS_CACHE_TTL_S
      );
    } catch (e) { /* cache cheio? segue sem cache */ }
    return result;
  } catch (err) {
    console.error('listSponsors falhou:', err);
    return { ok: false, error: String(err.message || err), sponsors: [] };
  }
}

/**
 * Conta patrocinadores por cota (útil para "já apoiaram: X").
 * Implementação direta — não reutiliza listSponsors() pra evitar o sort.
 */
function countSponsors() {
  const counts = { bronze: 0, prata: 0, ouro: 0, total: 0 };
  try {
    _assertSpreadsheetConfigured_();
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return counts;

    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return counts;

    const headers = values[0];
    const idx = {};
    headers.forEach(function (h, i) { idx[String(h || '').toLowerCase()] = i; });
    if (idx['status'] === undefined || idx['cota'] === undefined) return counts;

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const status = String(row[idx['status']] || '').toLowerCase();
      if (!VISIBLE_STATUSES[status]) continue;
      const cota = String(row[idx['cota']] || '').toLowerCase();
      if (counts[cota] !== undefined) counts[cota]++;
      counts.total++;
    }
    return counts;
  } catch (err) {
    console.error('countSponsors falhou:', err);
    return counts;
  }
}
