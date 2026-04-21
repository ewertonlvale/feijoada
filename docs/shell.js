/**
 * shell.js — bootstrap compartilhado dos shells que embutem o Apps Script.
 *
 * Cada shell HTML (docs/index.html, lista.html, inscricao.html, obrigado.html)
 * carrega esse script com um data-page pra indicar qual rota do Apps Script
 * deve popular no iframe:
 *
 *     <script src="shell.js" data-page="lista"></script>
 *
 * O script:
 *   1. Lê o data-page
 *   2. Mescla com a querystring do top (ex.: ?cota=ouro)
 *   3. Monta o src do iframe: APPS_SCRIPT_URL?page=<PAGE_NAME>&<extras>
 *   4. Some com o splash quando o iframe carregar (ou após 12s de timeout)
 *
 * Centralizar aqui significa que pra trocar APPS_SCRIPT_URL (ex.: após
 * publicar uma nova implantação), a gente edita UM arquivo, não quatro.
 */

(function () {
  'use strict';

  // ⚠️ EDITE AQUI depois de publicar o Web App:
  //    Apps Script → Implantar → Gerenciar implantações → nova versão
  //    Copie a "URL da Web app" (termina em /exec) e cole abaixo.
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxaa5CDUxN9aB8_FSstWePBQuuHYJy5nZefhOM6UiHYeOPqg7fCu0t7DyGiSi9cmIsX/exec';

  // Lê o data-page do próprio tag <script>
  var currentScript = document.currentScript;
  var PAGE_NAME = (currentScript && currentScript.dataset && currentScript.dataset.page) ||
                  'patrocinadores';

  var frame  = document.getElementById('app-frame');
  var splash = document.getElementById('splash');
  var errBox = document.getElementById('error-box');

  if (!frame) {
    console.error('[shell] iframe #app-frame não encontrado.');
    return;
  }

  var isPlaceholder = /XXXXXXXXXXXX/.test(APPS_SCRIPT_URL) ||
                      !/\/macros\/s\/[^/]+\/exec/.test(APPS_SCRIPT_URL);

  if (isPlaceholder) {
    if (errBox) errBox.style.display = 'block';
    return;
  }

  // Mescla querystring do top (ex.: ?cota=ouro) com o page=<PAGE_NAME> fixo.
  var extras = (window.location.search || '').replace(/^\?/, '');
  var finalQs = 'page=' + encodeURIComponent(PAGE_NAME) +
                (extras ? '&' + extras : '');
  frame.src = APPS_SCRIPT_URL + '?' + finalQs;

  function hideSplash() {
    frame.classList.add('ready');
    if (splash) splash.classList.add('hidden');
  }

  frame.addEventListener('load', hideSplash);

  // Failsafe: se o iframe não disparar onload em 12s, some com o splash
  setTimeout(function () {
    if (!frame.classList.contains('ready')) hideSplash();
  }, 12000);
})();
