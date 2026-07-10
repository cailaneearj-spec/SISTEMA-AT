/* app.js — roteador hash-based, inicialização, liga tudo */

const App = (function () {
  'use strict';

  const ROTAS = {
    criancas:      () => Criancas.renderizarView(raiz()),
    atendimentos:  () => Atendimentos.renderizarView(raiz()),
    historicos:    () => Historicos.renderizarView(raiz()),
    resumos:       () => Resumos.renderizarView(raiz()),
    devolutivas:   () => Devolutivas.renderizarView(raiz()),
    relatorios:    () => Relatorios.renderizarView(raiz()),
    backup:        () => Backup.renderizarView(raiz()),
    configuracoes: () => Configuracoes.renderizarView(raiz()),
    ajuda:         () => Ajuda.renderizarView(raiz()),
  };

  function raiz() {
    return document.getElementById('view-root');
  }

  function rotaAtual() {
    const hash = location.hash.replace('#/', '').split('?')[0].trim();
    return hash || 'criancas';
  }

  function navegar(rota) {
    location.hash = `#/${rota}`;
  }

  function _atualizarNavAtivo(rota) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('ativo', el.dataset.rota === rota);
    });
  }

  async function _rotear() {
    const rota = rotaAtual();
    _atualizarNavAtivo(rota);
    const fn = ROTAS[rota];
    if (fn) {
      try {
        await fn();
      } catch (err) {
        console.error('[App] Erro ao renderizar rota:', rota, err);
        raiz().innerHTML = `<div class="estado-vazio"><h3>Erro ao carregar a tela</h3><p>${UI.escapeHtml(err.message)}</p></div>`;
      }
    } else {
      navegar('criancas');
    }
  }

  function _registrarServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('[PWA] Service Worker registrado.'))
        .catch(err => console.warn('[PWA] Falha ao registrar SW:', err));
    }
  }

  async function init() {
    // Registra PWA
    _registrarServiceWorker();

    // Inicializa banco
    try {
      await BancoAT.abrir();
      document.getElementById('sidebar-status-db').innerHTML = '<span class="ok">● Banco conectado</span>';
    } catch (err) {
      document.getElementById('sidebar-status-db').innerHTML = '<span class="erro">● Erro no banco</span>';
      console.error('[App] Erro ao abrir banco:', err);
    }

    // Aplica tema salvo
    try {
      const cfg = await BancoAT.obterConfiguracoes();
      UI.aplicarTema(cfg.tema || 'escuro');
    } catch { /* usa tema padrão */ }

    // Injeta ícones SVG na sidebar
    UI.injetarIcones();

    // Inicializa modal
    UI._initModal();

    // Verifica backup automático (a cada 14 dias)
    try {
      await Backup.verificarBackupAutomatico();
    } catch (err) {
      console.warn('[Backup] Erro na verificação automática:', err);
    }

    // Roteamento
    window.addEventListener('hashchange', _rotear);
    await _rotear();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { navegar };
})();
