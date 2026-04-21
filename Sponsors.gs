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
  'origem'
];

/**
 * Garante que a aba de patrocinadores existe e tem cabeçalho.
 * - Se a aba não existir, cria.
 * - Se a aba existir mas estiver vazia (ex.: usuário renomeou a default
 *   "Sheet1" para "patrocinadores"), escreve os cabeçalhos.
 * - Se já houver dados, deixa como está.
 * Retorna a instância da Sheet.
 */
function _getOrCreateSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    sheet.setFrozenRows(1);
    const header = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
    header.setFontWeight('bold').setBackground('#8B2E2E').setFontColor('#FFF8EA');
  }
  return sheet;
}

/**
 * Saneia strings vindas do front-end.
 */
function _clean_(v, maxLen) {
  if (v === null || v === undefined) return '';
  let s = String(v).trim();
  if (maxLen && s.length > maxLen) s = s.substring(0, maxLen);
  // Evitar injection em planilha (formula injection)
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

/**
 * Registra um novo patrocinador interessado.
 *
 * @param {object} data  { nome, empresa, whatsapp, email, cota, mensagem }
 * @return {object}      { ok, id, cota, valor }  ou  { ok: false, error }
 */
function registerSponsor(data) {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Dados inválidos.');
    }

    const nome     = _clean_(data.nome, 120);
    const empresa  = _clean_(data.empresa, 120);
    const whatsapp = _clean_(data.whatsapp, 30);
    const email    = _clean_(data.email, 160);
    const cotaRaw  = _clean_(data.cota, 20).toLowerCase();
    const mensagem = _clean_(data.mensagem, 800);

    if (!nome)     throw new Error('Informe seu nome.');
    if (!whatsapp) throw new Error('Informe um WhatsApp para contato.');

    const tier = getTier(cotaRaw);
    if (!tier) throw new Error('Cota inválida. Escolha Bronze, Prata ou Ouro.');

    const sheet = _getOrCreateSheet_();
    const row = [
      new Date(),
      nome,
      empresa,
      whatsapp,
      email,
      tier.slug,
      tier.valor,
      'pendente',
      '',
      mensagem,
      'site'
    ];
    sheet.appendRow(row);

    // Notificação por email (opcional)
    if (CONFIG.NOTIFY_EMAIL) {
      try {
        const subject = '[Feijoada 2026] Novo patrocinador — ' + tier.nome + ' · ' + (empresa || nome);
        const body =
          'Novo interesse de patrocínio:\n\n' +
          'Nome:    ' + nome + '\n' +
          'Empresa: ' + empresa + '\n' +
          'WhatsApp:' + whatsapp + '\n' +
          'Email:   ' + email + '\n' +
          'Cota:    ' + tier.nome + ' (R$ ' + tier.valor + ')\n' +
          'Mensagem:\n' + (mensagem || '(sem mensagem)') + '\n\n' +
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
 * Só devolve linhas com status = "confirmado" ou "pago".
 *
 * @return {Array<object>}  lista de patrocinadores, cada um com:
 *   { nome, empresa, cota, valor, logo_url }
 */
function listSponsors() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return { ok: true, sponsors: [] };

    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return { ok: true, sponsors: [] };

    const headers = values[0];
    const rows = values.slice(1);
    const idx = {};
    headers.forEach(function(h, i) { idx[String(h).toLowerCase()] = i; });

    const visibleStatus = { confirmado: true, pago: true };

    const sponsors = rows
      .map(function(r) {
        const status = String(r[idx['status']] || '').toLowerCase();
        if (!visibleStatus[status]) return null;
        return {
          nome:     String(r[idx['nome']] || ''),
          empresa:  String(r[idx['empresa']] || ''),
          cota:     String(r[idx['cota']] || '').toLowerCase(),
          valor:    Number(r[idx['valor']]) || 0,
          logo_url: String(r[idx['logo_url']] || ''),
          mensagem: String(r[idx['mensagem']] || '')
        };
      })
      .filter(function(s) { return s !== null; });

    // Ordem: Ouro → Prata → Bronze
    const order = { ouro: 0, prata: 1, bronze: 2 };
    sponsors.sort(function(a, b) {
      const oa = order[a.cota] === undefined ? 99 : order[a.cota];
      const ob = order[b.cota] === undefined ? 99 : order[b.cota];
      if (oa !== ob) return oa - ob;
      // desempate: empresa alfabética
      return (a.empresa || a.nome).localeCompare(b.empresa || b.nome, 'pt-BR');
    });

    return { ok: true, sponsors: sponsors };
  } catch (err) {
    console.error('listSponsors falhou:', err);
    return { ok: false, error: String(err.message || err), sponsors: [] };
  }
}

/**
 * Conta patrocinadores por cota (útil para exibir "já apoiaram: X").
 */
function countSponsors() {
  const res = listSponsors();
  const counts = { bronze: 0, prata: 0, ouro: 0, total: 0 };
  if (!res.ok) return counts;
  res.sponsors.forEach(function(s) {
    if (counts[s.cota] !== undefined) counts[s.cota]++;
    counts.total++;
  });
  return counts;
}
