/* resumos.js — listagem filtrável de resumos dos atendimentos */

const Resumos = (function () {
  'use strict';

  async function renderizarView(raiz) {
    const criancas = (await BancoAT.listarCriancas()).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    const todos = [];
    criancas.forEach(c => {
      (c.atendimentos || []).forEach(at => {
        if (at.resumo && at.resumo.trim()) {
          todos.push({ ...at, _criancaId: c.id, _criancaNome: c.nome });
        }
      });
    });
    todos.sort((a, b) => (b.data || '').localeCompare(a.data || ''));

    raiz.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Resumos</h1>
          <p class="subtitulo">Resumos das sessões filtráveis por criança e período</p>
        </div>
      </div>

      <div class="filtros-linha">
        <div class="campo">
          <label>Criança</label>
          <select id="res-crianca">
            <option value="">Todas</option>
            ${criancas.map(c => `<option value="${c.id}">${UI.escapeHtml(c.nome)}</option>`).join('')}
          </select>
        </div>
        <div class="campo">
          <label>Data inicial</label>
          <input type="date" id="res-de">
        </div>
        <div class="campo">
          <label>Data final</label>
          <input type="date" id="res-ate">
        </div>
        <div class="campo" style="justify-content:flex-end;">
          <button class="btn btn-secundario" id="res-limpar">Limpar filtros</button>
        </div>
      </div>

      <div id="res-lista"></div>
    `;

    let filtrados = [...todos];

    function renderLista() {
      const lista = document.getElementById('res-lista');
      if (!lista) return;
      if (filtrados.length === 0) {
        lista.innerHTML = `<div class="estado-vazio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><h3>Nenhum resumo encontrado</h3><p>Ajuste os filtros ou registre atendimentos com resumo.</p></div>`;
        return;
      }
      lista.innerHTML = `
        <div class="contador-topo" style="margin-bottom:14px;"><strong>${filtrados.length}</strong> resumo${filtrados.length !== 1 ? 's' : ''}</div>
        ${filtrados.map(at => `
          <div class="card" style="margin-bottom:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
              <div style="font-weight:700;color:var(--text-primary);">${UI.escapeHtml(at._criancaNome)}</div>
              <div style="font-size:12.5px;font-weight:700;color:var(--accent-strong);">${UI.formatarData(at.data)}</div>
            </div>
            <p style="font-size:13.5px;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap;">${UI.escapeHtml(at.resumo)}</p>
          </div>`).join('')}
      `;
    }

    function aplicarFiltros() {
      const criancaId = document.getElementById('res-crianca').value;
      const de = document.getElementById('res-de').value;
      const ate = document.getElementById('res-ate').value;
      filtrados = todos.filter(at => {
        if (criancaId && String(at._criancaId) !== criancaId) return false;
        if (de && at.data < de) return false;
        if (ate && at.data > ate) return false;
        return true;
      });
      renderLista();
    }

    renderLista();
    document.getElementById('res-crianca').addEventListener('change', aplicarFiltros);
    document.getElementById('res-de').addEventListener('change', aplicarFiltros);
    document.getElementById('res-ate').addEventListener('change', aplicarFiltros);
    document.getElementById('res-limpar').addEventListener('click', () => {
      document.getElementById('res-crianca').value = '';
      document.getElementById('res-de').value = '';
      document.getElementById('res-ate').value = '';
      filtrados = [...todos];
      renderLista();
    });
  }

  return { renderizarView };
})();
