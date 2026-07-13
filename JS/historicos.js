/* historicos.js — linha do tempo cronológica por criança */

const Historicos = (function () {
  'use strict';

  async function renderizarView(raiz) {
    const criancas = (await BancoAT.listarCriancas()).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    raiz.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Históricos</h1>
          <p class="subtitulo">Linha do tempo cronológica dos atendimentos por criança</p>
        </div>
      </div>

      <div class="filtros-linha">
        <div class="campo">
          <label>Criança</label>
          <select id="hist-select-crianca">
            <option value="">Selecione uma criança…</option>
            ${criancas.map(c => `<option value="${c.id}">${UI.escapeHtml(c.nome)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div id="hist-conteudo">
        <div class="estado-vazio">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>
          <h3>Selecione uma criança</h3>
          <p>O histórico completo de atendimentos será exibido aqui.</p>
        </div>
      </div>
    `;

    document.getElementById('hist-select-crianca').addEventListener('change', async (e) => {
      const id = e.target.value;
      if (!id) return;
      const crianca = await BancoAT.obterCrianca(Number(id));
      _renderizarLinha(crianca);
    });
  }

  function _renderizarLinha(crianca) {
    const conteudo = document.getElementById('hist-conteudo');
    const atendimentos = (crianca.atendimentos || []).sort((a, b) => (a.data || '').localeCompare(b.data || ''));

    if (atendimentos.length === 0) {
      conteudo.innerHTML = `<div class="estado-vazio"><p>Nenhum atendimento registrado para ${UI.escapeHtml(crianca.nome)}.</p></div>`;
      return;
    }

    const grupos = {};
    atendimentos.forEach(at => {
      const [ano, mes] = (at.data || '').split('-');
      const chave = `${ano}-${mes}`;
      if (!grupos[chave]) grupos[chave] = { ano, mes, itens: [] };
      grupos[chave].itens.push(at);
    });

    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    conteudo.innerHTML = `
      <div style="margin-bottom:16px;">
        <div class="contador-topo"><strong>${atendimentos.length}</strong> atendimento${atendimentos.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="linha-tempo">
        ${Object.values(grupos).map(g => `
          <div class="lt-grupo">
            <div class="lt-mes-label">${meses[Number(g.mes) - 1]} ${g.ano}</div>
            ${g.itens.map(at => `
              <div class="lt-item card-atendimento" data-at-id="${at.id}">
                <div class="card-atendimento-data">${UI.formatarData(at.data)}</div>
                <div class="card-atendimento-resumo">${UI.escapeHtml(at.resumo || at.escrita || '—')}</div>
                <svg class="card-atendimento-seta" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>`).join('')}
          </div>`).join('')}
      </div>
    `;

    conteudo.querySelectorAll('.lt-item').forEach(card => {
      card.addEventListener('click', () => {
        const at = atendimentos.find(a => a.id === Number(card.dataset.atId));
        if (at) Atendimentos.abrirDetalhe(at, crianca.id, () => _renderizarLinha(crianca));
      });
    });
  }

  return { renderizarView };
})();
