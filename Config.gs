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
  CUSTOM_BASE_URL: 'https://feijoada-familias.pnscaparecida.com',

  // ───────── CONTATO ─────────
  // WhatsApp da equipe responsável pela captação (sem +, sem espaços).
  // Formato: 55 + DDD + número. Ex.: 5586999999999
  WHATSAPP: '5586988521231',

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
    BASE_URL: 'https://feijoada-familias.pnscaparecida.com/images',
    PANELA:   'panela-feijoada.png',
    SERTAO:   'sertao-forro.png',
    LOGO:     'logo-paroquia.png',
    DANCA:    'dancando-feijoes.png'
  },

  // ───────── EVENTO ─────────
  EVENTO: {
    nome:         'Feijoada das Famílias',
    subtitulo:    'Forró com Feijão',
    data_iso:     '2026-05-17',
    data_label:   '17 de Maio · 2026',
    hora_label:   'a partir das 11h',
    local_curto:  'Quadra Renascença I',
    local_longo:  'Quadra de Esportes do Renascença I',
    cidade:       'Teresina · PI',
    bairro:       'Renascença',
    paroquia:     'Paróquia Nossa Senhora da Conceição Aparecida',
    hashtag:      '#FeijoadaDasFamilias',

    // Título visual do hero na landing. É montado como:
    //   <hero_parte_1> & <hero_parte_2>
    //   —<hero_tagline>—
    // Mantido como campos separados pra evitar o hack
    // `nome.split(' das ')[0]` (frágil quando o nome do evento muda).
    hero_parte_1: 'Feijoada',
    hero_parte_2: 'Forró',
    hero_tagline: '— das Famílias —'
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
  { nome: 'Marquinhos do Pará', poster: 'marquinhos_para.png' },
  { nome: 'DJ Titio',           poster: 'dj_titio.png'         }
],

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
        { texto: 'Exposição de <strong>banner</strong> no evento', highlight: false },
        { texto: '<strong>Testemunhal</strong> durante o evento', highlight: false }
      ]
    },
    {
      slug: 'prata',
      nome: 'Prata',
      valor: 150,
      emoji: '🥈',
      destaque: false,
      beneficios: [
        { texto: 'Divulgação nas <strong>redes sociais</strong>', highlight: true },
        { texto: 'Exposição de <strong>banner</strong> no evento', highlight: false },
        { texto: '<strong>Testemunhal</strong> durante o evento', highlight: false }
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
        { texto: 'Divulgação nas <strong>redes sociais</strong>', highlight: false },
        { texto: 'Exposição de <strong>banner</strong> no evento', highlight: false },
        { texto: '<strong>Testemunhal</strong> durante o evento', highlight: false },
        { texto: '<strong>Logo em materiais impressos</strong>', highlight: true }
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
