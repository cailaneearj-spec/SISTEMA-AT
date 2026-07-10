/* backup.js — exportar/importar + backup automático no Google Drive */

const Backup = (function () {
  'use strict';

  const CHAVE_ULTIMO_BACKUP = 'sistemaAT_ultimoBackup';
  const INTERVALO_DIAS = 14;

  /* ---- BACKUP AUTOMÁTICO ---- */
  async function verificarBackupAutomatico() {
    const criancas = await BancoAT.listarCriancas();
    if (criancas.length === 0) return;

    const ultimoStr = localStorage.getItem(CHAVE_ULTIMO_BACKUP);
    const agora = Date.now();
    const intervaloMs = INTERVALO_DIAS * 24 * 60 * 60 * 1000;
    if (ultimoStr && (agora - Number(ultimoStr)) < intervaloMs) return;

    await _executarBackupDrive(true);
  }

  async function _executarBackupDrive(automatico = false) {
    const dados = await BancoAT.exportarTudo();
    const json = JSON.stringify(dados, null, 2);
    const data = new Date().toISOString().slice(0, 10);
    const nomeArquivo = `SistemaAT_backup_${data}.json`;
    _baixarJson(json, nomeArquivo);
    localStorage.setItem(CHAVE_ULTIMO_BACKUP, String(Date.now()));
    if (automatico) {
      UI.toast('📦 Backup automático baixado para seus Downloads.', 'sucesso');
    } else {
      UI.toast('Backup baixado com sucesso.', 'sucesso');
    }
  }

  function _baixarJson(json, nomeArquivo) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <p class="subtitulo">Backup automático a cada ${INTERVALO_DIAS} dias direto no Google Drive</p>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;padding:16px 20px;">
        <div style="display:flex;gap:32px;flex-wrap:wrap;">
          <div>
            <div class="ficha-dado-label">Dados atuais</div>
            <div class="ficha-dado-valor"><strong>${criancas.length}</strong> criança${criancas.length !== 1 ? 's' : ''} · <strong>${totalAt}</strong> atendimento${totalAt !== 1 ? 's' : ''}</div>
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
          <h3>Backup no Google Drive</h3>
          <p>Salva um arquivo JSON com todos os dados direto na sua conta Google Drive.</p>
          <button class="btn btn-primario" id="btn-backup-drive">Salvar no Drive agora</button>
        </div>

        <div class="card backup-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
          <h3>Baixar arquivo local</h3>
          <p>Baixa o arquivo JSON para o seu dispositivo como cópia extra de segurança.</p>
          <button class="btn btn-secundario" id="btn-exportar-local">Baixar JSON</button>
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
          <strong style="color:var(--accent-strong);">ℹ️ Como funciona</strong><br>
          A cada ${INTERVALO_DIAS} dias, ao abrir o sistema, o backup é salvo automaticamente na pasta <strong>Dados do aplicativo</strong> do seu Google Drive. Você pode ver os arquivos em <a href="https://drive.google.com" target="_blank" style="color:var(--accent-strong);">drive.google.com</a> → Armazenamento → Dados do aplicativo.
        </div>
      </div>
    `;

    document.getElementById('btn-backup-drive').addEventListener('click', () => _executarBackupDrive(false));
    document.getElementById('btn-exportar-local').addEventListener('click', async () => {
      const dados = await BancoAT.exportarTudo();
      const json = JSON.stringify(dados, null, 2);
      const data = new Date().toISOString().slice(0, 10);
      _baixarJson(json, `SistemaAT_backup_${data}.json`);
      UI.toast('Backup baixado com sucesso.', 'sucesso');
    });
    document.getElementById('input-importar').addEventListener('change', _importar);
  }

  function _importar(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    UI.abrirModal('Confirmar importação', `
      <p style="color:var(--text-secondary);margin-bottom:20px;">
        Você está prestes a importar <strong>${UI.escapeHtml(arquivo.name)}</strong>.<br><br>
        <span style="color:var(--danger);font-weight:600;">Todos os dados atuais serão apagados e substituídos.</span><br><br>
        Deseja continuar?
      </p>
      <div class="modal-rodape">
        <button class="btn btn-secundario" id="imp-cancelar">Cancelar</button>
        <button class="btn btn-perigo" id="imp-confirmar">Importar e substituir</button>
      </div>
    `);

    document.getElementById('imp-cancelar').addEventListener('click', () => { UI.fecharModal(); e.target.value = ''; });
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
