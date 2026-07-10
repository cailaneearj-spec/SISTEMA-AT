/* ==========================================================================
   historicos.js
   Responsabilidade única: tela "Históricos".
   Permite escolher uma criança e visualizar todos os seus atendimentos
   organizados em ordem cronológica (mais recente primeiro), reaproveitando
   os cards e o modal de detalhe já existentes em atendimentos.js.
   Exposto globalmente como window.Historicos
   ========================================================================== */
 
const Historicos = (function () {
  'use strict';
 
  async function renderizarView(raiz) {
    const criancas = (await BancoAT.listarCriancas()).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
 
    raiz.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Históricos</h1>
          <p class="subtitulo">Evolução completa de cada criança, em ordem cronológica</p>
        </div>
      </div>
 
      <div class="filtros-linha">
        <div class="campo">
          <label>Selecione a criança</label>
          <select id="select-crianca-historico">
            <option value="">Selecione...</option>
            ${criancas.map(c => `<option value="${c.id}">${UI.escapeHtml(c.nome)} — Pasta ${UI.escapeHtml(c.numeroPasta || '—')}</option>`).join('')}
          </select>
        </div>
      </div>
 
      <div id="conteudo-historico"></div>
    `;
 
    const select = document.getElementById('select-crianca-historico');
    const conteudo = document.getElementById('conteudo-historico');
 
    async function carregar(id) {
      if (!id) {
        conteudo.innerHTML = `
          <div class="estado-vazio">
            ${UI.icone('historicos')}
            <h3>Selecione uma criança</h3>
            <p>O histórico completo de atendimentos aparecerá aqui.</p>
          </div>
        `;
        return;
      }
 
      const crianca = await BancoAT.obterCrianca(id);
      if (!crianca) return;
 
      const ordenados = [...(crianca.atendimentos || [])].sort((a, b) => (b.data || '').localeCompare(a.data || ''));
 
      conteudo.innerHTML = `
        <div class="secao-titulo mt-0">${UI.escapeHtml(crianca.nome)} &middot; ${ordenados.length} atendimento${ordenados.length === 1 ? '' : 's'}</div>
        <div id="lista-historico" class="lista-atendimentos"></div>
      `;
 
      Atendimentos.renderizarListaEmFicha(
        document.getElementById('lista-historico'),
        ordenados,
        crianca,
        () => carregar(id)
      );
    }
 
    select.addEventListener('change', (evento) => carregar(evento.target.value));
    carregar('');
  }
 
  return { renderizarView };
})();
 
