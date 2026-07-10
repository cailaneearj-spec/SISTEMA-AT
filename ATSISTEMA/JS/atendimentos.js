/* atendimentos.js — formulário e renderização de atendimentos */

const Atendimentos = (function () {
  'use strict';

  const CAMPOS_QUALITATIVOS = [
    { chave: 'escrita',       rotulo: 'Escrita e Leitura' },
    { chave: 'linguagem',     rotulo: 'Linguagem e Comunicação' },
    { chave: 'avds',          rotulo: 'AVDs (Atividades de Vida Diária)' },
    { chave: 'matematica',    rotulo: 'Raciocínio Lógico / Matemática' },
    { chave: 'socializacao',  rotulo: 'Socialização e Comportamento' },
    { chave: 'cognicao',      rotulo: 'Cognição e Atenção' },
  ];

  /* ---- TELA GLOBAL DE ATENDIMENTOS ---- */
  async function renderizarView(raiz) {
    const criancas = (await BancoAT.listarCriancas()).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    // Coleta todos os atendimentos com referência à criança
    const todos = [];
    criancas.forEach(c => {
      (c.atendimentos || []).forEach(at => todos.push({ ...at, _criancaId: c.id, _criancaNome: c.nome }));
    });
    todos.sort((a, b) => (b.data || '').localeCompare(a.data || ''));

    raiz.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Atendimentos</h1>
          <p class="subtitulo">Todos os atendimentos registrados no sistema</p>
        </div>
        <div class="acoes">
          <button class="btn btn-primario" id="btn-novo-at-global">+ Novo Atendimento</button>
        </div>
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px;align-items:flex-end;">
        <div class="barra-busca" style="flex:1;max-width:360px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="busca-at" placeholder="Buscar por criança ou resumo…">
        </div>
        <div class="campo" style="margin:0;min-width:180px;">
          <select id="filtro-crianca-at">
            <option value="">Todas as crianças</option>
            ${criancas.map(c => `<option value="${c.id}">${UI.escapeHtml(c.nome)}</option>`).join('')}
          </select>
        </div>
        <div class="contador-topo">${todos.length} atendimento${todos.length !== 1 ? 's' : ''}</div>
      </div>

      <div class="lista-atendimentos" id="lista-at-global"></div>
    `;

    let filtrados = [...todos];

    function renderLista() {
      const lista = document.getElementById('lista-at-global');
      if (!lista) return;
      if (filtrados.length === 0) {
        lista.innerHTML = `<div class="estado-vazio"><p>Nenhum atendimento encontrado.</p></div>`;
        return;
      }
      lista.innerHTML = filtrados.map(at => `
        <div class="card-atendimento" data-at-id="${at.id}" data-crianca-id="${at._criancaId}">
          <div class="card-atendimento-data">${UI.formatarData(at.data)}</div>
          <div style="font-size:12px;color:var(--accent-strong);min-width:140px;font-weight:600;">${UI.escapeHtml(at._criancaNome)}</div>
          <div class="card-atendimento-resumo">${UI.escapeHtml(at.resumo || at.escrita || '—')}</div>
          <svg class="card-atendimento-seta" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`).join('');

      lista.querySelectorAll('.card-atendimento').forEach(card => {
        card.addEventListener('click', () => {
          const at = filtrados.find(a => a.id === Number(card.dataset.atId) && a._criancaId === Number(card.dataset.criancaId));
          if (at) abrirDetalhe(at, at._criancaId, () => renderizarView(raiz));
        });
      });
    }

    renderLista();

    function aplicarFiltros() {
      const q = document.getElementById('busca-at').value.toLowerCase();
      const criancaId = document.getElementById('filtro-crianca-at').value;
      filtrados = todos.filter(at => {
        const matchCrianca = !criancaId || String(at._criancaId) === criancaId;
        const matchTexto = !q || (at._criancaNome || '').toLowerCase().includes(q) || (at.resumo || '').toLowerCase().includes(q) || (at.escrita || '').toLowerCase().includes(q);
        return matchCrianca && matchTexto;
      });
      renderLista();
    }

    document.getElementById('busca-at').addEventListener('input', aplicarFiltros);
    document.getElementById('filtro-crianca-at').addEventListener('change', aplicarFiltros);
    document.getElementById('btn-novo-at-global').addEventListener('click', () => {
      const criancaId = document.getElementById('filtro-crianca-at').value || null;
      abrirFormulario(criancaId, null, () => renderizarView(raiz));
    });
  }

  /* ---- FORMULÁRIO DE ATENDIMENTO ---- */
  async function abrirFormulario(criancaId, atendimento, onSalvo) {
    const criancas = (await BancoAT.listarCriancas()).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    const editando = !!atendimento;
    const at = atendimento || { data: UI.hojeIso() };

    UI.abrirModal(editando ? 'Editar atendimento' : 'Novo atendimento', `
      <form id="form-at" autocomplete="off">
        <div class="grade-campos">
          <div class="campo">
            <label>Criança *</label>
            <select id="fat-crianca" ${editando ? 'disabled' : ''}>
              <option value="">Selecione...</option>
              ${criancas.map(c => `<option value="${c.id}" ${String(c.id) === String(criancaId) ? 'selected' : ''}>${UI.escapeHtml(c.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="campo">
            <label>Data *</label>
            <input type="date" id="fat-data" value="${at.data || UI.hojeIso()}" required>
          </div>
        </div>

        ${CAMPOS_QUALITATIVOS.map(c => `
          <div class="campo">
            <label>${c.rotulo}</label>
            <textarea id="fat-${c.chave}" rows="2">${UI.escapeHtml(at[c.chave] || '')}</textarea>
          </div>`).join('')}

        <div class="campo">
          <label>Resumo geral da sessão</label>
          <textarea id="fat-resumo" rows="3">${UI.escapeHtml(at.resumo || '')}</textarea>
        </div>
        <div class="campo">
          <label>Observações</label>
          <textarea id="fat-obs" rows="2">${UI.escapeHtml(at.observacoes || '')}</textarea>
        </div>

        <div class="modal-rodape">
          <button type="button" class="btn btn-secundario" id="fat-cancelar">Cancelar</button>
          <button type="submit" class="btn btn-primario">${editando ? 'Salvar alterações' : 'Registrar'}</button>
        </div>
      </form>
    `, true);

    document.getElementById('fat-cancelar').addEventListener('click', UI.fecharModal);
    document.getElementById('form-at').addEventListener('submit', async (e) => {
      e.preventDefault();
      const cId = editando ? criancaId : document.getElementById('fat-crianca').value;
      if (!cId) { UI.toast('Selecione uma criança.', 'erro'); return; }
      const data = document.getElementById('fat-data').value;
      if (!data) { UI.toast('Informe a data.', 'erro'); return; }

      const dados = {
        ...(editando ? at : {}),
        data,
        resumo: document.getElementById('fat-resumo').value.trim(),
        observacoes: document.getElementById('fat-obs').value.trim(),
      };
      CAMPOS_QUALITATIVOS.forEach(c => {
        dados[c.chave] = document.getElementById(`fat-${c.chave}`).value.trim();
      });

      await BancoAT.salvarAtendimento(Number(cId), dados);
      UI.fecharModal();
      UI.toast(editando ? 'Atendimento atualizado.' : 'Atendimento registrado.', 'sucesso');
      if (onSalvo) onSalvo();
    });
  }

  /* ---- DETALHE DO ATENDIMENTO ---- */
  function abrirDetalhe(at, criancaId, onVoltar) {
    const campos = CAMPOS_QUALITATIVOS.filter(c => at[c.chave] && at[c.chave].trim());

    UI.abrirModal(`Atendimento — ${UI.formatarData(at.data)}`, `
      <div class="detalhe-grid">
        ${campos.map(c => `
          <div class="detalhe-bloco">
            <h4>${c.rotulo}</h4>
            <p>${UI.escapeHtml(at[c.chave])}</p>
          </div>`).join('')}
        ${at.resumo ? `<div class="detalhe-bloco" style="grid-column:1/-1;"><h4>Resumo geral</h4><p>${UI.escapeHtml(at.resumo)}</p></div>` : ''}
        ${at.observacoes ? `<div class="detalhe-bloco" style="grid-column:1/-1;"><h4>Observações</h4><p>${UI.escapeHtml(at.observacoes)}</p></div>` : ''}
      </div>
      <div class="modal-rodape" style="margin-top:16px;">
        <button class="btn btn-perigo btn-pequeno" id="det-excluir">Excluir</button>
        <button class="btn btn-secundario btn-pequeno" id="det-editar">Editar</button>
        <button class="btn btn-fantasma btn-pequeno" id="det-fechar">Fechar</button>
      </div>
    `, true);

    document.getElementById('det-fechar').addEventListener('click', UI.fecharModal);
    document.getElementById('det-editar').addEventListener('click', () => {
      UI.fecharModal();
      abrirFormulario(criancaId, at, onVoltar);
    });
    document.getElementById('det-excluir').addEventListener('click', async () => {
      await BancoAT.excluirAtendimento(Number(criancaId), at.id);
      UI.fecharModal();
      UI.toast('Atendimento excluído.', 'sucesso');
      if (onVoltar) onVoltar();
    });
  }

  return { renderizarView, abrirFormulario, abrirDetalhe, CAMPOS_QUALITATIVOS };
})();
