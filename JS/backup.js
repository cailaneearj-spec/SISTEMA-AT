/* backup.js — exportar/importar banco em JSON + backup automático a cada 14 dias */

const Backup = (function () {
  'use strict';

  const CHAVE_ULTIMO_BACKUP = 'sistemaAT_ultimoBackup';
  const INTERVALO_DIAS = 14;

  /* ---- VERIFICAÇÃO AUTOMÁTICA (chamada pelo app.js no init) ---- */
  async function verificarBackupAutomatico() {
    const criancas = await BancoAT.listarCriancas();
    if (criancas.length === 0) return; // Nada para fazer backup

    const ultimoStr = localStorage.getItem(CHAVE_ULTIMO_BACKUP);
    const agora = Date.now();
    const intervaloMs = INTERVALO_DIAS * 24 * 60 * 60 * 1000;

    if (ultimoStr && (agora - Number(ultimoStr)) < intervaloMs) return; // Ainda não chegou a hora

    // Chegou a hora — baixa automaticamente
    await _executarExportacao(true);
  }

  /* ---- EXPORTAÇÃO ---- */
  async function _executarExportacao(automatico = false) {
    const dados = await BancoAT.exportarTudo();
    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const data = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `SistemaAT_backup_${data}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    localStorage.setItem(CHAVE_ULTIMO_BACKUP, String(Date.now()));

    if (automatico) {
      UI.toast('📦 Backup automático realizado (a cada 14 dias).', 'sucesso');
    } else {
      UI.toast('Backup exportado com sucesso.', 'sucesso');
    }
  }

  /* ---- VIEW ---- */
  async function renderizarView(raiz) {
    const criancas = await BancoAT.listarCriancas();
    const totalAt = criancas.reduce((s, c) => s + (c.atendimentos || []).length, 0);

    const ultimoStr = localStorage.getItem(CHAVE_ULTIMO_BACKUP);
    const ultimoTexto = ultimoStr
      ? UI.formatarData(new Date(Number(ultimoStr)).toISOString().slice(0, 10))
      : 'Nunca realizado';

    const proximoMs = ultimoStr ? Number(ultimoStr) + INTERVALO_DIAS * 24 * 60 * 60 * 1000 : null;
    const proximoTexto = proximoMs
      ? UI.formatarData(new Date(proximoMs).toISOString().slice(0, 10))
      : 'No próximo acesso';

    raiz.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Backup</h1>
          <p class="subtitulo">Exportação e importação de dados — backup automático a cada ${INTERVALO_DIAS} dias</p>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;padding:16px 20px;">
        <div style="display:flex;gap:32px;flex-wrap:wrap;">
          <div>
            <div class="ficha-dado-label">Dados atuais</div>
            <div class="ficha-dado-valor">
              <strong>${criancas.length}</strong> criança${criancas.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
              <strong>${totalAt}</strong> atendimento${totalAt !== 1 ? 's' : ''}
            </div>
          </div>
          <div>
            <div class="ficha-dado-label">Último backup</div>
            <div class="ficha-dado-valor">${ultimoTexto}</div>
          </div>
          <div>
            <div class="ficha-dado-label">Próximo backup automático</div>
            <div class="ficha-dado-valor" style="color:var(--accent-strong);">${proximoTexto}</div>
          </div>
        </div>
      </div>

      <div class="backup-grid">
        <div class="card backup-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
          <h3>Exportar agora</h3>
          <p>Baixe um arquivo JSON com todos os dados. O backup automático também usa este formato.</p>
          <button class="btn btn-primario" id="btn-exportar">Exportar JSON</button>
        </div>

        <div class="card backup-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
          <h3>Importar dados</h3>
          <p>Restaure um backup anterior. <strong style="color:var(--danger);">Atenção: os dados atuais serão substituídos.</strong></p>
          <label class="btn btn-secundario" style="cursor:pointer;">
            Selecionar arquivo
            <input type="file" id="input-importar" accept=".json" style="display:none;">
          </label>
        </div>
      </div>

      <div class="card" style="margin-top:16px;padding:16px 20px;background:var(--accent-soft);border-color:var(--accent);">
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">
          <strong style="color:var(--accent-strong);">ℹ️ Como funciona o backup automático</strong><br>
          A cada ${INTERVALO_DIAS} dias, ao abrir o sistema, um arquivo JSON é baixado automaticamente para a pasta de downloads do seu dispositivo.
          Guarde esses arquivos em um local seguro (Google Drive, nuvem, etc.) para garantir a recuperação dos dados.
        </div>
      </div>
    `;

    document.getElementById('btn-exportar').addEventListener('click', () => _executarExportacao(false));
    document.getElementById('input-importar').addEventListener('change', _importar);
  }

  /* ---- IMPORTAÇÃO ---- */
  function _importar(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    UI.abrirModal('Confirmar importação', `
      <p style="color:var(--text-secondary);margin-bottom:20px;">
        Você está prestes a importar <strong>${UI.escapeHtml(arquivo.name)}</strong>.<br><br>
        <span style="color:var(--danger);font-weight:600;">Todos os dados atuais serão apagados e substituídos pelos dados do arquivo.</span><br><br>
        Deseja continuar?
      </p>
      <div class="modal-rodape">
        <button class="btn btn-secundario" id="imp-cancelar">Cancelar</button>
        <button class="btn btn-perigo" id="imp-confirmar">Importar e substituir</button>
      </div>
    `);

    document.getElementById('imp-cancelar').addEventListener('click', () => {
      UI.fecharModal();
      e.target.value = '';
    });

    document.getElementById('imp-confirmar').addEventListener('click', () => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const dados = JSON.parse(ev.target.result);
          await BancoAT.importarTudo(dados);
          UI.fecharModal();
          UI.toast('Dados importados com sucesso.', 'sucesso');
          App.navegar('criancas');
        } catch {
          UI.fecharModal();
          UI.toast('Arquivo inválido ou corrompido.', 'erro');
        }
      };
      reader.readAsText(arquivo);
    });
  }

  return { renderizarView, verificarBackupAutomatico };
})();
