/**
 * Config.gs — Configurações do mini-site Feijotacê 2026
 *
 * Edite SOMENTE este arquivo para personalizar a campanha.
 * Tudo o que pode mudar entre edições do evento está aqui.
 */

const CONFIG = {

  // ───────── PLANILHA DE PATROCINADORES ─────────
  // ID da planilha onde os patrocinadores são gravados.
  // Pegue da URL: https://docs.google.com/spreadsheets/d/<ID>/edit
  SPREADSHEET_ID: '19Xowz9vNCMTwyyY7amkRRwuG3KrL-ljjtNlUT1N6Pag',
  SHEET_NAME: 'patrocinadores',

  // Aba do cardápio (mesmo SPREADSHEET_ID acima).
  // Use o helper setupMenuSheet() em Menu.gs (Executar ▶) para criar a aba
  // já com os cabeçalhos e linhas-exemplo de cada categoria.
  MENU_SHEET_NAME: 'cardapio',

  // Categorias permitidas no cardápio. A ordem aqui controla a sequência
  // das seções renderizadas na página /cardapio. Se o admin colocar uma
  // categoria fora desta lista na planilha, o item é ignorado (com warn).
  // Quando adicionar categoria nova, lembre de mapear o ícone correspondente
  // no <? if (group.categoria === ...) ?> em cardapio.html (senão cai no
  // ícone genérico "outros").
  MENU_CATEGORIAS: [
    'Prato principal',
    'Espetinho',
    'Crepes',
    'Bebidas',
    'Doces e gelados'
  ],

  // ───────── DOMÍNIO PÚBLICO (GitHub Pages) ─────────
  // Base do custom domain onde estão os shells que embutem o Web App
  // (docs/index.html, docs/lista.html, docs/inscricao.html, docs/obrigado.html).
  //
  // Todos os links internos gerados pelo Apps Script usam essa base +
  // target="_top" pra fazer navegação real do navegador — assim a URL bar
  // sempre reflete a página aberta e o usuário nunca sai do domínio custom.
  CUSTOM_BASE_URL: 'https://feijotace.pnscaparecida.com',

  // ───────── CONTATO ─────────
  // WhatsApp principal da equipe responsável pela captação (sem +, sem espaços).
  // Formato: 55 + DDD + número. Ex.: 5586999999999
  WHATSAPP: '5586995457246',

  // Contatos exibidos na seção "Seja um patrocinador" (botões do WhatsApp).
  CONTATOS: [
    { nome: 'Gabhy Ramos',    numero: '(86) 99545-7246', whatsapp: '5586995457246' },
    { nome: 'Pedro Henrique', numero: '(86) 99848-9064', whatsapp: '5586998489064' }
  ],

  // Email para receber notificação a cada novo patrocinador (opcional).
  // Deixe '' (string vazia) para desativar.
  NOTIFY_EMAIL: 'ewertonlv@gmail.com',

  // ───────── IMAGENS ─────────
  // O Apps Script não serve arquivos binários, então as imagens precisam
  // estar hospedadas em uma URL pública. A BASE_URL abaixo aponta para a
  // pasta /images servida pelo GitHub Pages no domínio customizado.
  //
  // Se for trocar de host, basta editar a BASE_URL aqui.
  IMAGES: {
    BASE_URL: 'https://feijotace.pnscaparecida.com/images',
    SERTAO:   'sertao-forro.png',
    LOGO:     'logo-paroquia.png'
  },

  // ───────── IMAGENS NO GOOGLE DRIVE ─────────
  // Logos dos patrocinadores e pôsteres das atrações ficam numa pasta
  // pública do Drive. Na planilha (coluna logo_url) e em ATRACOES (campo
  // poster) basta o NOME do arquivo — ex.: 'acme.png' — que o app resolve
  // para a URL pública automaticamente (com cache de alguns minutos).
  //
  // Pré-requisito: a pasta E as imagens precisam estar compartilhadas como
  // "qualquer pessoa com o link pode ver".
  // O ID fica na URL: drive.google.com/drive/folders/<ESTE_ID>
  DRIVE_IMAGES_FOLDER_ID: '1bj7ghuATSsHWMJwgzY8MhCHcPo-ZWHr7',
  // Tamanho servido pelo endpoint de thumbnail do Drive (largura máx).
  DRIVE_IMAGE_SIZE: 'w1600',

  // ───────── EVENTO ─────────
  EVENTO: {
    nome:         'Feijotacê',
    subtitulo:    'O Puro Suco da Alegria',
    organizador:  'EJC',
    data_iso:     '2026-08-02',
    data_label:   '02 de Agosto · 2026',
    hora_label:   'a partir das 12h',
    local_curto:  'Quadra Renascença I',
    local_longo:  'Quadra de Esportes do Renascença I · Zona Sudeste',
    cidade:       'Teresina · PI',
    bairro:       'Renascença',
    paroquia:     'Paróquia Nossa Senhora da Conceição Aparecida',
    hashtag:      '#Feijotacê',

    // Título visual do hero na landing. É montado como:
    //   <hero_parte_1> <hero_parte_2>
    //   <hero_tagline>
    hero_parte_1: 'Feijotacê',
    hero_parte_2: '',
    hero_tagline: '— O Puro Suco da Alegria —'
  },

  // ───────── ATRAÇÕES MUSICAIS ─────────
  // Mostradas na home (patrocinadores.html) logo abaixo do hero.
  // Cada entrada vira um card com o pôster cheio (imagem promocional já
  // contém o nome do artista e identidade visual do evento).
  //
  // - `nome`   é usado APENAS como alt text da imagem (acessibilidade /
  //   SEO) — o pôster mostra o nome visualmente.
  // - `poster` é o nome do arquivo dentro de /images/atracoes/ no
  //   GitHub Pages. Pode ser tanto `marquinhos.png` quanto a URL completa.
  //
  // Layout responsivo (definido em patrocinadores.html):
  //   - Desktop ≥720px: grid 2-col, ambos pôsteres visíveis lado a lado.
  //   - Mobile <720px: carrossel horizontal scroll-snap, ~1.25 pôster
  //     visível por vez (mesmo padrão da seção Ouro de patrocinadores).
  //
  // Deixe `[]` (array vazio) se não houver atrações — a seção some
  // automaticamente.
ATRACOES: [
  { nome: 'DJ Titio · Grupo Samblack', poster: 'atracao.jpg' }
],

  // ───────── COTAS DE PATROCÍNIO ─────────
  // A ordem aqui controla a ordem dos cards na página.
  // Cada cota acumula benefícios da anterior.
  TIERS: [
    {
      slug: 'bronze',
      nome: 'Bronze',
      valor: 75,
      emoji: '🥉',
      destaque: false,
      beneficios: [
        { texto: '<strong>Logo no painel de patrocínio:</strong> exposição da logo no painel de patrocinadores no local do evento', highlight: false },
        { texto: '<strong>Divulgação durante o evento:</strong> anúncios e menções da marca em momentos estratégicos do evento', highlight: false }
      ]
    },
    {
      slug: 'prata',
      nome: 'Prata',
      valor: 125,
      emoji: '🥈',
      destaque: false,
      beneficios: [
        { texto: '<strong>Divulgação nas redes sociais:</strong> postagens promocionais destacando a marca até a data do evento', highlight: true },
        { texto: '<strong>Divulgação durante o evento:</strong> anúncios e menções da marca em momentos estratégicos do evento', highlight: false },
        { texto: '<strong>Logo no painel de patrocínio:</strong> exposição da logo no painel de patrocinadores no local do evento', highlight: false }
      ]
    },
    {
      slug: 'ouro',
      nome: 'Ouro',
      valor: 200,
      emoji: '🥇',
      destaque: true,
      destaque_label: 'TOP',
      beneficios: [
        { texto: '<strong>Divulgação nas redes sociais:</strong> postagens promocionais destacando a marca até a data do evento', highlight: false },
        { texto: '<strong>Divulgação durante o evento:</strong> anúncios e menções da marca em momentos estratégicos do evento', highlight: false },
        { texto: '<strong>Logo no painel de patrocínio:</strong> exposição destacada no painel de patrocinadores no local do evento', highlight: false },
        { texto: '<strong>Logo nos impressos do evento:</strong> inclusão da logo em todos os materiais impressos distribuídos aos participantes', highlight: true }
      ]
    }
  ],

  // ───────── VALIDAÇÃO ─────────
  // Regex aplicadas no backend em registerSponsor() para rejeitar lixo
  // de bots e enganos simples. Deliberadamente permissivas — só peneiram.
  VALIDATION: {
    // 8 a 20 chars, só dígitos e os separadores comuns.
    WHATSAPP_REGEX: /^[+()\d\s-]{8,20}$/,
    // Email simples — não pega tudo, mas é bom o suficiente.
    EMAIL_REGEX:    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
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
 * Fonte única da lógica — front-end pode espelhar em JS pra atualização
 * dinâmica, mas a mensagem canônica vive aqui.
 */
function buildWhatsAppUrl(cotaSlug) {
  const tier = getTier(cotaSlug);
  const base = 'https://wa.me/' + CONFIG.WHATSAPP;
  const msg = tier
    ? 'Olá! Tenho interesse na cota ' + tier.nome + ' da ' + CONFIG.EVENTO.nome + '.'
    : 'Olá! Tenho interesse em apoiar a ' + CONFIG.EVENTO.nome + '.';
  return base + '?text=' + encodeURIComponent(msg);
}
