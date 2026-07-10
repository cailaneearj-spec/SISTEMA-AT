/* configuracoes.js — tema claro/escuro + dados do profissional */

const Configuracoes = (function () {
  'use strict';

  async function renderizarView(raiz) {
    const cfg = await BancoAT.obterConfiguracoes();

    raiz.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Configurações</h1>
          <p class="subtitulo">Personalize o sistema e os dados do profissional</p>
        </div>
      </div>

      <div class="config-bloco">
        <div class="secao-titulo">Aparência</div>
        <div class="campo">
          <label>Tema</label>
          <div class="tema-opcoes">
            <div class="tema-opcao ${cfg.tema !== 'claro' ? 'selecionado' : ''}" data-tema="escuro">🌙 Escuro</div>
            <div class="tema-opcao ${cfg.tema === 'claro' ? 'selecionado' : ''}" data-tema="claro">☀️ Claro</div>
          </div>
        </div>

        <div class="secao-titulo" style="margin-top:28px;">Dados do profissional</div>
        <form id="form-cfg" autocomplete="off">
          <div class="campo">
            <label>Nome do profissional</label>
            <input type="text" id="cfg-nome" value="${UI.escapeHtml(cfg.profissionalNome || '')}" placeholder="Ex: Maria Silva">
          </div>
          <div class="campo">
            <label>Logotipo (imagem)</label>
            <div class="upload-preview">
              ${cfg.logo ? `<img id="cfg-logo-preview" src="${cfg.logo}" alt="Logo">` : `<div id="cfg-logo-preview" style="width:64px;height:64px;border-radius:10px;border:1px solid var(--border);background:var(--bg-input);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;">Sem logo</div>`}
              <label class="btn btn-secundario btn-pequeno" style="cursor:pointer;">
                Escolher imagem
                <input type="file" id="cfg-logo-input" accept="image/*" style="display:none;">
              </label>
              ${cfg.logo ? `<button type="button" class="btn btn-perigo btn-pequeno" id="cfg-logo-remover">Remover</button>` : ''}
            </div>
          </div>
          <div class="campo">
            <label>Assinatura (texto)</label>
            <textarea id="cfg-assinatura" rows="2" placeholder="Ex: AT — CRP 00/00000">${UI.escapeHtml(cfg.assinatura || '')}</textarea>
          </div>
          <div class="modal-rodape" style="padding-top:8px;">
            <button type="submit" class="btn btn-primario">Salvar configurações</button>
          </div>
        </form>
      </div>
    `;

    // Tema
    let temaSelecionado = cfg.tema || 'escuro';
    document.querySelectorAll('.tema-opcao').forEach(el => {
      el.addEventListener('click', () => {
        temaSelecionado = el.dataset.tema;
        document.querySelectorAll('.tema-opcao').forEach(o => o.classList.remove('selecionado'));
        el.classList.add('selecionado');
        UI.aplicarTema(temaSelecionado);
      });
    });

    // Logo preview
    let logoBase64 = cfg.logo || '';
    document.getElementById('cfg-logo-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        logoBase64 = ev.target.result;
        const preview = document.getElementById('cfg-logo-preview');
        if (preview.tagName === 'IMG') {
          preview.src = logoBase64;
        } else {
          const img = document.createElement('img');
          img.id = 'cfg-logo-preview';
          img.src = logoBase64;
          img.alt = 'Logo';
          img.style.cssText = 'width:64px;height:64px;object-fit:contain;border-radius:10px;border:1px solid var(--border);';
          preview.replaceWith(img);
        }
      };
      reader.readAsDataURL(file);
    });

    const btnRemover = document.getElementById('cfg-logo-remover');
    if (btnRemover) {
      btnRemover.addEventListener('click', () => {
        logoBase64 = '';
        renderizarView(raiz);
      });
    }

    // Salvar
    document.getElementById('form-cfg').addEventListener('submit', async (e) => {
      e.preventDefault();
      await BancoAT.salvarConfiguracoes({
        tema: temaSelecionado,
        profissionalNome: document.getElementById('cfg-nome').value.trim(),
        assinatura: document.getElementById('cfg-assinatura').value.trim(),
        logo: logoBase64,
      });
      UI.toast('Configurações salvas.', 'sucesso');
    });
  }

  return { renderizarView };
})();
