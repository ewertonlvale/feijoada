/**
 * ImportPDF.gs — Importa para a aba "patrocinadores" os 14 apoiadores
 * extraídos do PDF "Patrocinios Feijoada EJC".
 *
 * COMO USAR (uma vez só):
 *   1. Abra o editor do Apps Script
 *   2. Selecione a função `importPatrocinadoresPDF` no dropdown de execução
 *   3. Clique em Executar (▶)
 *   4. Confira o log — deve dizer "OK — 14 patrocinadores importados."
 *
 * DEFAULTS aplicados em todas as linhas:
 *   - cota:    'prata'       (R$ 150) — o admin reatribui Ouro/Bronze depois
 *                              direto na planilha; basta trocar a célula da
 *                              coluna `cota` e (idealmente) a `valor`.
 *   - status:  'confirmado'  — patrocinador aparece na home e na /lista.
 *   - origem:  'pdf-import'  — marca de auditoria.
 *
 * O QUE O SCRIPT NÃO FAZ (admin completa manualmente na planilha):
 *   - logo_url: cada patrocinador precisa do logo hospedado em URL pública
 *               (ex.: docs/images/<slug>.png no GitHub Pages → URL absoluta).
 *   - cota:     todos entram como Prata; ajuste para Ouro/Bronze conforme
 *               o que foi acordado com cada apoiador.
 *
 * IDEMPOTÊNCIA:
 *   Se a planilha já tiver pelo menos uma linha com origem='pdf-import', o
 *   script aborta com mensagem clara — pra evitar duplicar. Para reimportar,
 *   rode `clearImportedPatrocinadoresPDF()` antes (apaga só as linhas com
 *   origem='pdf-import', preserva o resto).
 */

// ─────────────────────────────────────────────────────────────────────────
// Dados extraídos do PDF (uma entrada por patrocinador). Telefones já
// normalizados em `whatsapp_num` (só dígitos, prefixo 55). Comentários
// indicam pontos que precisam de revisão pelo admin.
// ─────────────────────────────────────────────────────────────────────────
const PATROCINADORES_PDF_DATA = [
  {
    empresa: 'Oficina Jerry Peças',
    mensagem: 'Movendo o mundo sobre rodas!',
    instagram: '',                         // não constava no PDF
    whatsapp_num: '5586988695807',         // (86) 98869-5807
    endereco: 'R. Des. Sá Barreto, 4400 - Extrema, Teresina, PI'
  },
  {
    empresa: 'CIEL Cursos',
    mensagem: 'Orientação escolar · Idiomas · Acompanhamento psicopedagógico',
    instagram: 'cielcursos',
    whatsapp_num: '5586988979036',         // (86) 98897-9036
    endereco: 'Rua Deputado Antônio Gaioso, Q. 205 C. 15 - Dirceu II, Teresina, PI'
  },
  {
    empresa: 'Dekott',
    mensagem: 'Para mulheres que exigem elegância e presença.',
    instagram: 'dekottoficial',
    whatsapp_num: '5586995204266',         // (86) 99520-4266
    endereco: 'Rua Hegesipo Marques Servio, 5275 - Novo Horizonte, Teresina, PI'
  },
  {
    empresa: 'Prolimgel',
    mensagem: 'Soluções para limpeza doméstica e automotiva — 10+ anos cuidando do seu lar e negócio.',
    instagram: 'prolimgel',
    whatsapp_num: '5586999700126',         // (86) 99970-0126
    endereco: 'Av. Joaquim Nelson, Quadra 81 - Casa 18 - Itararé, Teresina, PI'
  },
  {
    empresa: 'Fran Bolos',
    mensagem: '',
    instagram: 'franbolosthe',
    whatsapp_num: '5586994497191',         // (86) 99449-7191
    endereco: 'R. Cesar Negreiro Barros, 3287 - Novo Horizonte, Teresina, PI'
  },
  {
    empresa: 'Bagacus Bar',
    mensagem: '',
    instagram: 'bagacusbar',
    whatsapp_num: '5586988736361',         // (86) 98873-6361
    endereco: 'R. Senador Valdemar Santos, Quadra 15 Casa 03 - Renascença I, Teresina, PI'
  },
  {
    empresa: 'GreenWave',
    mensagem: 'Soluções inovadoras para otimizar processos e impulsionar a transformação digital.',
    instagram: 'greenwave.tec',
    whatsapp_num: '',                      // não constava no PDF
    endereco: 'Av. Homero Castelo Branco, 3645 - Ininga, Teresina, PI'
  },
  {
    empresa: 'D Prints',
    mensagem: '',
    instagram: 'dprintsoficial',
    whatsapp_num: '5586988175759',         // (86) 98817-5759
    endereco: 'R. Dr. Chagas Martins, Quadra 91 - Casa 11 - Dirceu I, Teresina, PI'
  },
  {
    empresa: 'JJ Modas',
    mensagem: '',
    instagram: 'jj_modas20',
    whatsapp_num: '5586981086281',         // (86) 98108-6281
    endereco: 'Shopping da Cidade, Box 437 - Corredor Eliseu Martins, Teresina, PI'
  },
  {
    empresa: 'Emilene Salgados',
    mensagem: '',
    instagram: 'emilenesalgados',
    whatsapp_num: '5586994411977',         // (86) 99441-1977
    endereco: ''                           // não constava no PDF
  },
  {
    empresa: 'Comercial do Marcelo',
    mensagem: '',
    instagram: 'comercialdomarcelo',       // veio sem @ no PDF; mantive como handle
    whatsapp_num: '',                      // não constava no PDF
    endereco: ''                           // não constava no PDF
  },
  {
    empresa: 'Dra. Beatryz Ferreira',
    mensagem: '',
    instagram: 'dra.beatryzferreira',
    // ⚠ ATENÇÃO admin: o PDF mostra "(86) 9975-3993" (8 dígitos no local) —
    // formato incomum. Verificar com a Dra. Beatryz se está correto ou se é
    // 9-9975-3993 (mobile). Por ora foi armazenado como veio.
    whatsapp_num: '558699753993',          // (86) 9975-3993
    endereco: 'R. Monsenhor Zaul Pedreira, 370 - Casa 9/2 - Comprida, Teresina, PI'
  },
  {
    empresa: 'R2 Bijux',
    mensagem: '',
    instagram: 'r2bijux',
    whatsapp_num: '5586999062509',         // (86) 99906-2509
    endereco: 'R. Juíz Emíliano Paes Landim - Itararé, Teresina, PI'
  },
  {
    empresa: 'ISA Teresina',
    mensagem: '',
    instagram: 'isateresina',              // veio sem @ no PDF
    whatsapp_num: '558632318892',          // (86) 3231-8892 — landline
    endereco: 'R. Iolanda Raulino, 3978 - Dirceu II, Teresina, PI'
  }
];

/**
 * Importa todos os patrocinadores do PDF para a aba `patrocinadores`.
 * Aborta se já houver linhas com origem='pdf-import' — rode
 * clearImportedPatrocinadoresPDF() antes para reimportar.
 */
function importPatrocinadoresPDF() {
  const sheet = _getOrCreateSheet_();

  // Idempotência — aborta se já houver linhas com origem='pdf-import'
  const values = sheet.getDataRange().getValues();
  if (values.length > 1) {
    const headers = values[0];
    const idxOrigem = headers.indexOf('origem');
    if (idxOrigem !== -1) {
      const hasImport = values.slice(1).some(function (r) {
        return String(r[idxOrigem] || '') === 'pdf-import';
      });
      if (hasImport) {
        throw new Error(
          'Já existem linhas com origem=pdf-import. ' +
          'Para reimportar, rode primeiro clearImportedPatrocinadoresPDF().'
        );
      }
    }
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    throw new Error('Sistema ocupado, tente novamente em instantes.');
  }
  try {
    const tier = getTier('prata') || { slug: 'prata', valor: 150 };
    const rows = PATROCINADORES_PDF_DATA.map(function (p) {
      const igHandle = String(p.instagram || '').replace(/^@+/, '').trim();
      const igUrl = igHandle ? ('https://instagram.com/' + igHandle) : '';

      const wa = String(p.whatsapp_num || '').replace(/\D/g, '');
      const waDisplay = wa ? _formatPhoneBR_(wa) : '';

      const mapsUrl = p.endereco
        ? ('https://maps.google.com/?q=' + encodeURIComponent(p.endereco))
        : '';

      const data = {
        timestamp:     new Date(),
        nome:          p.empresa,           // mesmo valor que empresa
        empresa:       p.empresa,
        whatsapp:      waDisplay,
        email:         '',
        cota:          tier.slug,
        valor:         tier.valor,
        status:        'confirmado',
        logo_url:      '',                  // admin preenche depois
        mensagem:      p.mensagem || '',
        origem:        'pdf-import',
        instagram_url: igUrl,
        whatsapp_num:  wa,
        endereco:      p.endereco || '',
        maps_url:      mapsUrl
      };
      return SHEET_HEADERS.map(function (h) {
        return data[h] !== undefined ? data[h] : '';
      });
    });

    // Bulk write em vez de appendRow em loop — uma única chamada à API
    // do Sheets, que é mais rápida e menos sujeita a quota.
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, SHEET_HEADERS.length).setValues(rows);

    clearSponsorsCache();
    const msg = 'OK — ' + rows.length + ' patrocinadores importados (status=confirmado, cota=prata). ' +
                'Ajuste cotas/logos manualmente na planilha.';
    console.info(msg);
    return msg;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Apaga as linhas com origem='pdf-import'. Útil pra reimportar do zero
 * sem afetar patrocinadores cadastrados pelo formulário ou manualmente.
 */
function clearImportedPatrocinadoresPDF() {
  const sheet = _getOrCreateSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return 'Planilha vazia — nada a apagar.';

  const headers = values[0];
  const idxOrigem = headers.indexOf('origem');
  if (idxOrigem === -1) {
    throw new Error('Coluna "origem" não encontrada — planilha não tem o schema esperado.');
  }

  // Apaga de baixo pra cima pra não bagunçar os índices durante o loop.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error('Sistema ocupado, tente novamente.');
  try {
    let removed = 0;
    for (let i = values.length - 1; i >= 1; i--) {
      if (String(values[i][idxOrigem] || '') === 'pdf-import') {
        sheet.deleteRow(i + 1); // +1 porque getRange é 1-indexed
        removed++;
      }
    }
    clearSponsorsCache();
    return 'OK — ' + removed + ' linhas com origem=pdf-import apagadas.';
  } finally {
    lock.releaseLock();
  }
}

/**
 * Formata "5586988695807" → "(86) 98869-5807" para gravar no campo
 * `whatsapp` (display). Aceita também sem prefixo 55. Retorna o input
 * original se o tamanho não bater com mobile (11) ou landline (10).
 */
function _formatPhoneBR_(digits) {
  const clean = String(digits || '').replace(/\D/g, '').replace(/^55/, '');
  if (clean.length === 11) {
    return '(' + clean.slice(0, 2) + ') ' + clean.slice(2, 7) + '-' + clean.slice(7);
  }
  if (clean.length === 10) {
    return '(' + clean.slice(0, 2) + ') ' + clean.slice(2, 6) + '-' + clean.slice(6);
  }
  return digits;
}
