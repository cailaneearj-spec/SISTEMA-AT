/* app.js — roteador, login Google, inicialização com Supabase */

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

  function raiz() { return document.getElementById('view-root'); }

  function rotaAtual() {
    return location.hash.replace('#/', '').split('?')[0].trim() || 'criancas';
  }

  function navegar(rota) {
    if (location.hash === `#/${rota}`) {
      _rotear(); // força re-render se já está na mesma rota
    } else {
      location.hash = `#/${rota}`;
    }
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
      try { await fn(); }
      catch (err) {
        console.error('[App] Erro ao renderizar rota:', rota, err);
        raiz().innerHTML = `<div class="estado-vazio"><h3>Erro ao carregar a tela</h3><p>${UI.escapeHtml(err.message)}</p></div>`;
      }
    } else { navegar('criancas'); }
  }

  /* ---- TELA DE LOGIN ---- */
  function _mostrarLogin() {
    document.querySelector('.app-shell').style.display = 'none';
    document.getElementById('tela-login').style.display = 'flex';
  }

  function _mostrarApp(user) {
    document.getElementById('tela-login').style.display = 'none';
    document.querySelector('.app-shell').style.display = 'flex';

    // Mostra nome do usuário na sidebar
    const footer = document.getElementById('sidebar-status-db');
    footer.innerHTML = `<span class="ok">● ${UI.escapeHtml(user.email)}</span>`;

    // Botão sair
    const btnSair = document.getElementById('btn-sair');
    if (btnSair) {
      btnSair.addEventListener('click', async () => {
        await BancoAT.logout();
        _mostrarLogin();
      });
    }
  }

  function _registrarServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .catch(err => console.warn('[PWA] Falha ao registrar SW:', err));
    }
  }

  async function init() {
    _registrarServiceWorker();
    UI.injetarIcones();
    UI._initModal();

    // Escuta mudanças de autenticação
    BancoAT.onAuthChange(async (user) => {
      if (user) {
        _mostrarApp(user);

        // Aplica tema
        try {
          const cfg = await BancoAT.obterConfiguracoes();
          UI.aplicarTema(cfg.tema || 'escuro');
        } catch { /* usa padrão */ }

        // Backup automático
        try { await Backup.verificarBackupAutomatico(); } catch { /* silencioso */ }

        // Realtime — recarrega a view quando dados mudam em outro dispositivo
        BancoAT.escutarMudancas('criancas', () => _rotear());

        // Roteamento
        window.removeEventListener('hashchange', _rotear);
        window.addEventListener('hashchange', _rotear);
        await _rotear();
      } else {
        _mostrarLogin();
      }
    });

    // Botão de login
    document.getElementById('btn-login-google').addEventListener('click', async () => {
      try {
        await BancoAT.loginComGoogle();
      } catch (err) {
        UI.toast('Erro ao fazer login. Tente novamente.', 'erro');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { navegar };
})();
