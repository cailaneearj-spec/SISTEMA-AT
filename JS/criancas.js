/* criancas.js — CRUD de crianças, lista com busca, ficha */

const Criancas = (function () {
  'use strict';

  /* ---- LISTA PRINCIPAL ---- */
  async function renderizarView(raiz) {
    const criancas = (await BancoAT.listarCriancas()).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    const ativas = criancas.filter(c => c.status === 'ativa').length;

    raiz.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Crianças</h1>
          <p class="subtitulo">Gerencie os prontuários das crianças atendidas</p>
        </div>
        <div class="acoes">
          <button class="btn btn-primario" id="btn-nova-crianca">+ Nova Criança</button>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:18px;">
        <div class="barra-busca" style="flex:1;max-width:420px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="busca-criancas" placeholder="Buscar por nome ou número da pasta…">
        </div>
        <div class="contador-topo">
          <strong>${ativas}</strong> ativa${ativas !== 1 ? 's' : ''}
          <span style="color:var(--border)">|</span>
          <strong>${criancas.length}</strong> total
        </div>
      </div>

      <div class="grade-criancas" id="grade-criancas"></div>
    `;

    _renderizarCards(criancas);

    document.getElementById('btn-nova-crianca').addEventListener('click', () => abrirFormulario(null));
    document.getElementById('busca-criancas').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtradas = criancas.filter(c =>
        (c.nome || '').toLowerCase().includes(q) ||
        (c.numeroPasta || '').toLowerCase().includes(q)
      );
      _renderizarCards(filtradas);
    });
  }

  function _renderizarCards(lista) {
    const grade = document.getElementById('grade-criancas');
    if (!grade) return;
    if (lista.length === 0) {
      grade.innerHTML = `
        <div class="estado-vazio" style="grid-column:1/-1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          <h3>Nenhuma criança encontrada</h3>
          <p>Cadastre a primeira criança clicando em "Nova Criança".</p>
        </div>`;
      return;
    }
    grade.innerHTML = lista.map(c => {
      const iniciais = (c.nome || '?').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
      const qtdAt = (c.atendimentos || []).length;
      return `
        <div class="card-crianca" data-id="${c.id}" role="button" tabindex="0">
          <div class="card-crianca-topo">
            <div>
              <div class="card-crianca-nome">${UI.escapeHtml(c.nome)}</div>
              <div class="card-crianca-pasta">Pasta nº ${UI.escapeHtml(c.numeroPasta || '—')}</div>
            </div>
            <span class="badge badge-${c.status === 'ativa' ? 'ativa' : 'inativa'}">${c.status === 'ativa' ? 'Ativa' : 'Inativa'}</span>
          </div>
          <div class="card-crianca-linha"><span>Idade:</span><strong>${UI.calcularIdadeTexto(c.dataNascimento)}</strong></div>
          <div class="card-crianca-linha"><span>Diagnóstico:</span><strong>${UI.escapeHtml(c.diagnostico || '—')}</strong></div>
          <div class="card-crianca-rodape">
            <span style="font-size:12px;color:var(--text-muted)">${qtdAt} atendimento${qtdAt !== 1 ? 's' : ''}</span>
            <button class="btn btn-fantasma btn-pequeno">Ver ficha →</button>
          </div>
        </div>`;
    }).join('');

    grade.querySelectorAll('.card-crianca').forEach(card => {
      const abrir = () => abrirFicha(Number(card.dataset.id));
      card.addEventListener('click', abrir);
      card.addEventListener('keydown', e => { if (e.key === 'Enter') abrir(); });
    });
  }

  /* ---- FICHA DA CRIANÇA ---- */
  async function abrirFicha(id) {
    const c = await BancoAT.obterCrianca(id);
    if (!c) return;
    const iniciais = (c.nome || '?').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
    const atendimentos = (c.atendimentos || []).sort((a, b) => (b.data || '').localeCompare(a.data || ''));

    UI.abrirModal(c.nome, `
      <div class="ficha-topo">
        <div class="ficha-identidade">
          <div class="ficha-avatar">${iniciais}</div>
          <div>
            <div style="font-size:18px;font-weight:700;">${UI.escapeHtml(c.nome)}</div>
            <div style="font-size:12.5px;color:var(--text-muted);margin-top:3px;">Pasta nº ${UI.escapeHtml(c.numeroPasta || '—')}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-secundario btn-pequeno no-print" id="ficha-btn-editar">Editar</button>
          <button class="btn btn-perigo btn-pequeno no-print" id="ficha-btn-excluir">Excluir</button>
        </div>
      </div>

      <div class="ficha-dados-grid" style="margin-bottom:20px;">
        <div><div class="ficha-dado-label">Nascimento</div><div class="ficha-dado-valor">${UI.formatarData(c.dataNascimento)}</div></div>
        <div><div class="ficha-dado-label">Idade</div><div class="ficha-dado-valor">${UI.calcularIdadeTexto(c.dataNascimento)}</div></div>
        <div><div class="ficha-dado-label">Status</div><div class="ficha-dado-valor"><span class="badge badge-${c.status === 'ativa' ? 'ativa' : 'inativa'}">${c.status === 'ativa' ? 'Ativa' : 'Inativa'}</span></div></div>
        <div><div class="ficha-dado-label">Diagnóstico</div><div class="ficha-dado-valor">${UI.escapeHtml(c.diagnostico || '—')}</div></div>
        <div><div class="ficha-dado-label">Responsável</div><div class="ficha-dado-valor">${UI.escapeHtml(c.responsavel || '—')}</div></div>
        <div><div class="ficha-dado-label">Contato</div><div class="ficha-dado-valor">${UI.escapeHtml(c.contato || '—')}</div></div>
        <div><div class="ficha-dado-label">Início do acomp.</div><div class="ficha-dado-valor">${UI.formatarData(c.dataInicioAcompanhamento)}</div></div>
        <div><div class="ficha-dado-label">Escola</div><div class="ficha-dado-valor">${UI.escapeHtml(c.escola || '—')}</div></div>
        <div><div class="ficha-dado-label">Turno</div><div class="ficha-dado-valor">${UI.escapeHtml(c.turno || '—')}</div></div>
      </div>

      ${c.observacoesGerais ? `<div style="margin-bottom:20px;"><div class="ficha-dado-label" style="margin-bottom:6px;">Observações gerais</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${UI.escapeHtml(c.observacoesGerais)}</div></div>` : ''}

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div class="secao-titulo mt-0">Atendimentos (${atendimentos.length})</div>
        <button class="btn btn-primario btn-pequeno no-print" id="ficha-btn-novo-at">+ Novo atendimento</button>
      </div>

      <div class="lista-atendimentos" id="ficha-lista-at">
        ${atendimentos.length === 0
          ? `<div class="estado-vazio" style="padding:30px 0;"><p>Nenhum atendimento registrado ainda.</p></div>`
          : atendimentos.map(at => `
            <div class="card-atendimento" data-at-id="${at.id}">
              <div class="card-atendimento-data">${UI.formatarData(at.data)}</div>
              <div class="card-atendimento-resumo">${UI.escapeHtml(at.resumo || at.escrita || '—')}</div>
              <svg class="card-atendimento-seta" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>`).join('')}
      </div>
    `, true);

    document.getElementById('ficha-btn-editar').addEventListener('click', () => { UI.fecharModal(); abrirFormulario(c); });
    document.getElementById('ficha-btn-excluir').addEventListener('click', () => _confirmarExclusao(c));
    document.getElementById('ficha-btn-novo-at').addEventListener('click', () => { UI.fecharModal(); Atendimentos.abrirFormulario(c.id, null, () => abrirFicha(c.id)); });

    document.querySelectorAll('#ficha-lista-at .card-atendimento').forEach(card => {
      card.addEventListener('click', () => {
        const at = atendimentos.find(a => a.id === Number(card.dataset.atId));
        if (at) Atendimentos.abrirDetalhe(at, c.id, () => abrirFicha(c.id));
      });
    });
  }

  function _confirmarExclusao(c) {
    UI.abrirModal('Excluir criança', `
      <p style="color:var(--text-secondary);margin-bottom:20px;">Tem certeza que deseja excluir <strong>${UI.escapeHtml(c.nome)}</strong> e todos os seus atendimentos? Esta ação não pode ser desfeita.</p>
      <div class="modal-rodape">
        <button class="btn btn-secundario" id="conf-cancelar">Cancelar</button>
        <button class="btn btn-perigo" id="conf-excluir">Excluir</button>
      </div>
    `);
    document.getElementById('conf-cancelar').addEventListener('click', UI.fecharModal);
    document.getElementById('conf-excluir').addEventListener('click', async () => {
      await BancoAT.excluirCrianca(c.id);
      UI.fecharModal();
      UI.toast(`${c.nome} excluída com sucesso.`, 'sucesso');
      App.navegar('criancas');
    });
  }

  /* ---- FORMULÁRIO ---- */
  function abrirFormulario(crianca) {
    const editando = !!crianca;
    const c = crianca || { status: 'ativa' };

    UI.abrirModal(editando ? 'Editar criança' : 'Nova criança', `
      <form id="form-crianca" autocomplete="off">
        <div class="grade-campos">
          <div class="campo">
            <label>Nome completo *</label>
            <input type="text" id="fc-nome" value="${UI.escapeHtml(c.nome || '')}" required>
          </div>
          <div class="campo">
            <label>Número da pasta</label>
            <input type="text" id="fc-pasta" value="${UI.escapeHtml(c.numeroPasta || '')}">
          </div>
          <div class="campo">
            <label>Data de nascimento</label>
            <input type="date" id="fc-nasc" value="${c.dataNascimento || ''}">
          </div>
          <div class="campo">
            <label>Status</label>
            <select id="fc-status">
              <option value="ativa" ${c.status === 'ativa' ? 'selected' : ''}>Ativa</option>
              <option value="inativa" ${c.status === 'inativa' ? 'selected' : ''}>Inativa</option>
            </select>
          </div>
          <div class="campo">
            <label>Diagnóstico</label>
            <input type="text" id="fc-diag" value="${UI.escapeHtml(c.diagnostico || '')}">
          </div>
          <div class="campo">
            <label>Responsável</label>
            <input type="text" id="fc-resp" value="${UI.escapeHtml(c.responsavel || '')}">
          </div>
          <div class="campo">
            <label>Contato (telefone)</label>
            <input type="tel" id="fc-contato" value="${UI.escapeHtml(c.contato || '')}">
          </div>
          <div class="campo">
            <label>Início do acompanhamento</label>
            <input type="date" id="fc-inicio" value="${c.dataInicioAcompanhamento || ''}">
          </div>
          <div class="campo">
            <label>Escola</label>
            <input type="text" id="fc-escola" value="${UI.escapeHtml(c.escola || '')}">
          </div>
          <div class="campo">
            <label>Turno</label>
            <select id="fc-turno">
              <option value="">—</option>
              <option value="Manhã" ${c.turno === 'Manhã' ? 'selected' : ''}>Manhã</option>
              <option value="Tarde" ${c.turno === 'Tarde' ? 'selected' : ''}>Tarde</option>
              <option value="Integral" ${c.turno === 'Integral' ? 'selected' : ''}>Integral</option>
            </select>
          </div>
        </div>
        <div class="campo">
          <label>Observações gerais</label>
          <textarea id="fc-obs" rows="3">${UI.escapeHtml(c.observacoesGerais || '')}</textarea>
        </div>
        <div class="modal-rodape">
          <button type="button" class="btn btn-secundario" id="fc-cancelar">Cancelar</button>
          <button type="submit" class="btn btn-primario">${editando ? 'Salvar alterações' : 'Cadastrar'}</button>
        </div>
      </form>
    `, true);

    document.getElementById('fc-cancelar').addEventListener('click', UI.fecharModal);
    document.getElementById('form-crianca').addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('[DEBUG] submit disparado');
      const nome = document.getElementById('fc-nome').value.trim();
      console.log('[DEBUG] nome:', nome);
      if (!nome) { UI.toast('O nome é obrigatório.', 'erro'); return; }

      const dados = {
        ...(editando ? c : {}),
        nome,
        numeroPasta: document.getElementById('fc-pasta').value.trim(),
        dataNascimento: document.getElementById('fc-nasc').value || null,
        status: document.getElementById('fc-status').value,
        diagnostico: document.getElementById('fc-diag').value.trim(),
        responsavel: document.getElementById('fc-resp').value.trim(),
        contato: document.getElementById('fc-contato').value.trim(),
        dataInicioAcompanhamento: document.getElementById('fc-inicio').value || null,
        escola: document.getElementById('fc-escola').value.trim(),
        turno: document.getElementById('fc-turno').value,
        observacoesGerais: document.getElementById('fc-obs').value.trim(),
        atendimentos: c.atendimentos || [],
      };

      console.log('[DEBUG] dados:', dados);
      try {
        const id = await BancoAT.salvarCrianca(dados);
        console.log('[DEBUG] salvo com id:', id);
        UI.fecharModal();
        UI.toast(editando ? 'Dados atualizados.' : 'Criança cadastrada.', 'sucesso');
        setTimeout(() => App.navegar('criancas'), 300);
      } catch(err) {
        console.error('[DEBUG] erro ao salvar:', err);
        UI.toast('Erro ao salvar: ' + err.message, 'erro');
      }
    });
  }

  return { renderizarView, abrirFicha, abrirFormulario };
})();
