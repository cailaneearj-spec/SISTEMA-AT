/* relatorios.js — relatório completo + exportação via impressão nativa */

const Relatorios = (function () {
  'use strict';

  async function renderizarView(raiz) {
    const criancas = (await BancoAT.listarCriancas()).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    raiz.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Relatórios</h1>
          <p class="subtitulo">Gere relatórios completos por criança para impressão ou exportação</p>
        </div>
      </div>

      <div class="filtros-linha">
        <div class="campo">
          <label>Criança</label>
          <select id="rel-crianca">
            <option value="">Selecione...</option>
            ${criancas.map(c => `<option value="${c.id}">${UI.escapeHtml(c.nome)}</option>`).join('')}
          </select>
        </div>
        <div class="campo">
          <label>Período — de</label>
          <input type="date" id="rel-de">
        </div>
        <div class="campo">
          <label>Até</label>
          <input type="date" id="rel-ate">
        </div>
        <div class="campo" style="justify-content:flex-end;">
          <button class="btn btn-primario" id="rel-btn-gerar">Gerar relatório</button>
        </div>
      </div>

      <div id="rel-resultado"></div>
    `;

    document.getElementById('rel-btn-gerar').addEventListener('click', async () => {
      const criancaId = document.getElementById('rel-crianca').value;
      if (!criancaId) { UI.toast('Selecione uma criança.', 'erro'); return; }
      const de = document.getElementById('rel-de').value;
      const ate = document.getElementById('rel-ate').value;
      await _gerarRelatorio(Number(criancaId), de, ate);
    });
  }

  async function _gerarRelatorio(criancaId, de, ate) {
    const crianca = await BancoAT.obterCrianca(criancaId);
    const cfg = await BancoAT.obterConfiguracoes();
    if (!crianca) return;

    let atendimentos = (crianca.atendimentos || []).sort((a, b) => (a.data || '').localeCompare(b.data || ''));
    if (de) atendimentos = atendimentos.filter(at => at.data >= de);
    if (ate) atendimentos = atendimentos.filter(at => at.data <= ate);

    const resultado = document.getElementById('rel-resultado');
    resultado.innerHTML = `
      <div class="secao-titulo">Pré-visualização do relatório</div>
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
          <div>
            <div style="font-size:18px;font-weight:700;">${UI.escapeHtml(crianca.nome)}</div>
            <div style="font-size:12.5px;color:var(--text-muted);margin-top:2px;">Pasta nº ${UI.escapeHtml(crianca.numeroPasta || '—')}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secundario btn-pequeno no-print" id="rel-btn-copiar">Copiar texto</button>
            <button class="btn btn-primario btn-pequeno no-print" id="rel-btn-imprimir">Imprimir / Exportar PDF</button>
          </div>
        </div>

        <div class="ficha-dados-grid" style="margin-bottom:16px;">
          <div><div class="ficha-dado-label">Nascimento</div><div class="ficha-dado-valor">${UI.formatarData(crianca.dataNascimento)}</div></div>
          <div><div class="ficha-dado-label">Idade</div><div class="ficha-dado-valor">${UI.calcularIdadeTexto(crianca.dataNascimento)}</div></div>
          <div><div class="ficha-dado-label">Diagnóstico</div><div class="ficha-dado-valor">${UI.escapeHtml(crianca.diagnostico || '—')}</div></div>
          <div><div class="ficha-dado-label">Responsável</div><div class="ficha-dado-valor">${UI.escapeHtml(crianca.responsavel || '—')}</div></div>
          <div><div class="ficha-dado-label">Início do acomp.</div><div class="ficha-dado-valor">${UI.formatarData(crianca.dataInicioAcompanhamento)}</div></div>
          <div><div class="ficha-dado-label">Total de sessões</div><div class="ficha-dado-valor">${atendimentos.length}</div></div>
        </div>

        <div class="secao-titulo">Atendimentos no período</div>
        ${atendimentos.length === 0
          ? `<p style="color:var(--text-muted);font-size:13px;">Nenhum atendimento no período selecionado.</p>`
          : `<table class="tabela">
              <thead><tr>
                <th>Data</th>
                ${Atendimentos.CAMPOS_QUALITATIVOS.map(c => `<th>${c.rotulo}</th>`).join('')}
                <th>Resumo</th>
              </tr></thead>
              <tbody>
                ${atendimentos.map(at => `
                  <tr>
                    <td style="white-space:nowrap;">${UI.formatarData(at.data)}</td>
                    ${Atendimentos.CAMPOS_QUALITATIVOS.map(c => `<td>${UI.escapeHtml(at[c.chave] || '—')}</td>`).join('')}
                    <td>${UI.escapeHtml(at.resumo || '—')}</td>
                  </tr>`).join('')}
              </tbody>
            </table>`}
      </div>
    `;

    document.getElementById('rel-btn-imprimir').addEventListener('click', () => _imprimir(crianca, atendimentos, cfg));
    document.getElementById('rel-btn-copiar').addEventListener('click', async () => {
      const texto = _gerarTextoPlano(crianca, atendimentos, cfg);
      try {
        await navigator.clipboard.writeText(texto);
        UI.toast('Texto copiado.', 'sucesso');
      } catch {
        UI.toast('Não foi possível copiar automaticamente.', 'erro');
      }
    });
  }

  function _gerarTextoPlano(crianca, atendimentos, cfg) {
    const linhas = [
      `RELATÓRIO DE ATENDIMENTOS`,
      ``,
      `Criança: ${crianca.nome}`,
      `Nascimento: ${UI.formatarData(crianca.dataNascimento)} | Idade: ${UI.calcularIdadeTexto(crianca.dataNascimento)}`,
      `Diagnóstico: ${crianca.diagnostico || '—'}`,
      `Responsável: ${crianca.responsavel || '—'}`,
      `Início do acompanhamento: ${UI.formatarData(crianca.dataInicioAcompanhamento)}`,
      `Total de sessões: ${atendimentos.length}`,
      ``,
      `——————————————————————————————`,
      ``,
    ];
    atendimentos.forEach(at => {
      linhas.push(`Data: ${UI.formatarData(at.data)}`);
      Atendimentos.CAMPOS_QUALITATIVOS.forEach(c => {
        if (at[c.chave] && at[c.chave].trim()) linhas.push(`${c.rotulo}: ${at[c.chave]}`);
      });
      if (at.resumo) linhas.push(`Resumo: ${at.resumo}`);
      if (at.observacoes) linhas.push(`Observações: ${at.observacoes}`);
      linhas.push('');
    });
    if (cfg && cfg.profissionalNome) {
      linhas.push('', '_________________________________', cfg.profissionalNome, 'Atendente Terapêutico');
    }
    return linhas.join('\n');
  }

  function _imprimir(crianca, atendimentos, cfg) {
    const texto = _gerarTextoPlano(crianca, atendimentos, cfg);
    const janela = window.open('', '_blank');
    janela.document.write(`
      <html><head>
        <title>Relatório — ${UI.escapeHtml(crianca.nome)}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #111; font-size: 13px; line-height: 1.6; }
          h1 { font-size: 16px; margin-bottom: 20px; }
          pre { white-space: pre-wrap; font-family: inherit; }
        </style>
      </head><body>
        <h1>Relatório de Atendimentos — ${UI.escapeHtml(crianca.nome)}</h1>
        <pre>${UI.escapeHtml(texto)}</pre>
      </body></html>
    `);
    janela.document.close();
    janela.focus();
    setTimeout(() => janela.print(), 250);
  }

  return { renderizarView };
})();
