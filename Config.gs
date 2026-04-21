/**
 * Config.gs — Configurações do mini-site Feijoada das Famílias 2026
 *
 * Edite SOMENTE este arquivo para personalizar a campanha.
 * Tudo o que pode mudar entre edições do evento está aqui.
 */

const CONFIG = {

  // ───────── PLANILHA DE PATROCINADORES ─────────
  // ID da planilha onde os patrocinadores são gravados.
  // Pegue da URL: https://docs.google.com/spreadsheets/d/<ID>/edit
  SPREADSHEET_ID: 'COLOQUE_AQUI_O_ID_DA_PLANILHA',
  SHEET_NAME: 'patrocinadores',

  // ───────── DOMÍNIO PÚBLICO (GitHub Pages) ─────────
  // Base do custom domain onde estão os shells que embutem o Web App
  // (docs/index.html, docs/lista.html, docs/inscricao.html, docs/obrigado.html).
  //
  // Todos os links internos gerados pelo Apps Script usam essa base +
  // target="_top" pra fazer navegação real do navegador — assim a URL bar
  // sempre reflete a página aberta e o usuário nunca sai do domínio custom.
  CUSTOM_BASE_URL: 'https://feijoada-familias.pnscaparecida.com',

  // ───────── CONTATO ─────────
  // WhatsApp da equipe responsável pela captação (sem +, sem espaços).
  // Formato: 55 + DDD + número. Ex.: 5586999999999
  WHATSAPP: '5586999999999',

  // Email para receber notificação a cada novo patrocinador (opcional).
  // Deixe '' (string vazia) para desativar.
  NOTIFY_EMAIL: '',

  // ───────── IMAGENS ─────────
  // O Apps Script não serve arquivos binários, então as imagens precisam
  // estar hospedadas em uma URL pública. A BASE_URL abaixo aponta para a
  // pasta /images servida pelo GitHub Pages no domínio customizado.
  //
  // Se for trocar de host, basta editar a BASE_URL aqui.
  IMAGES: {
    BASE_URL: 'https://feijoada-familias.pnscaparecida.com/images',
    PANELA:   'panela-feijoada.png',
    SERTAO:   'sertao-forro.png',
    LOGO:     'logo-paroquia.png',
    DANCA:    'dancando-feijoes.png'
  },

  // ───────── EVENTO ─────────
  EVENTO: {
    nome: 'Feijoada das Famílias',
    subtitulo: 'Forró com Feijão',
    data_iso: '2026-05-17',
    data_label: '17 de Maio · 2026',
    hora_label: 'a partir das 11h',
    local_curto: 'Quadra Renascença I',
    local_longo: 'Quadra de Esportes do Renascença I',
    cidade: 'Teresina · PI',
    paroquia: 'Paróquia Nossa Senhora da Conceição Aparecida',
    hashtag: '#FeijoadaDasFamilias · #ECC'
  },

  // ───────── COTAS DE PATROCÍNIO ─────────
  // A ordem aqui controla a ordem dos cards na página.
  // Cada cota acumula benefícios da anterior.
  TIERS: [
    {
      slug: 'bronze',
      nome: 'Bronze',
      valor: 100,
      emoji: '🥉',
      destaque: false,
      beneficios: [
        { texto: 'Exposição da marca em <strong>banner coletivo</strong> no dia do evento', highlight: false },
        { texto: '<strong>Testemunhal</strong> de agradecimento no palco', highlight: false },
        { texto: 'Certificado digital de apoio à paróquia', highlight: false }
      ]
    },
    {
      slug: 'prata',
      nome: 'Prata',
      valor: 150,
      emoji: '🥈',
      destaque: false,
      beneficios: [
        { texto: 'Tudo do <strong>Bronze</strong>, mais…', highlight: false },
        { texto: 'Divulgação nas <strong>redes sociais</strong> da paróquia (Instagram + WhatsApp da comunidade)', highlight: true },
        { texto: 'Destaque individual no <strong>banner principal</strong> do evento', highlight: false },
        { texto: 'Logo na página oficial de patrocinadores', highlight: false }
      ]
    },
    {
      slug: 'ouro',
      nome: 'Ouro',
      valor: 200,
      emoji: '🥇',
      destaque: true,
      destaque_label: 'Mais Votado',
      beneficios: [
        { texto: 'Tudo do <strong>Prata</strong>, mais…', highlight: false },
        { texto: '<strong>Logotipo nos materiais impressos</strong> (flyers, cartazes, ingressos)', highlight: true },
        { texto: 'Espaço de exposição para panfletos no dia', highlight: false },
        { texto: 'Menção destacada nos avisos da missa', highlight: false }
      ]
    }
  ]
};

/**
 * Helper: devolve um tier pelo slug, ou null.
 */
function getTier(slug) {
  if (!slug) return null;
  const s = String(slug).toLowerCase();
  for (let i = 0; i < CONFIG.TIERS.length; i++) {
    if (CONFIG.TIERS[i].slug === s) return CONFIG.TIERS[i];
  }
  return null;
}

/**
 * Helper: monta um link wa.me com mensagem pré-preenchida.
 */
function buildWhatsAppUrl(cotaSlug) {
  const tier = getTier(cotaSlug);
  const base = 'https://wa.me/' + CONFIG.WHATSAPP;
  if (!tier) {
    return base + '?text=' + encodeURIComponent(
      'Olá! Tenho interesse em apoiar a ' + CONFIG.EVENTO.nome + '.'
    );
  }
  const msg = 'Olá! Tenho interesse na cota ' + tier.nome + ' da ' + CONFIG.EVENTO.nome + '.';
  return base + '?text=' + encodeURIComponent(msg);
}
