/* ==========================================================================
   devolutivas.js
   Responsabilidade única: geração automática da devolutiva (semestral/anual)
   a partir dos atendimentos registrados, seguindo a estrutura obrigatória
   definida no briefing do sistema. O texto gerado é editável antes da
   impressão/exportação.
   Exposto globalmente como window.Devolutivas
   ========================================================================== */
 
const Devolutivas = (function () {
  'use strict';
 
  const ROTULOS_CATEGORIA = Atendimentos.CAMPOS_QUALITATIVOS;
 
  function calcularMesesEntre(dataInicioIso, dataFimIso) {
    if (!dataInicioIso || !dataFimIso) return 0;
    const inicio = new Date(dataInicioIso + 'T00:00:00');
    const fim = new Date(dataFimIso + 'T00:00:00');
    let meses = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth());
    if (fim.getDate() < inicio.getDate()) meses--;
    return Math.max(meses, 0);
  }
 
  function filtrarPorPeriodo(atendimentos, ano, periodo) {
    return atendimentos.filter((at) => {
      if (!at.data) return false;
      const [anoAt, mesAt] = at.data.split('-').map(Number);
      if (anoAt !== Number(ano)) return false;
      if (periodo === '1' && mesAt > 6) return false;
      if (periodo === '2' && mesAt <= 6) return false;
      return true;
    }).sort((a, b) => (a.data || '').localeCompare(b.data || ''));
  }
 
  function montarSecaoCategoria(rotulo, chave, atendimentosPeriodo) {
    const observacoes = atendimentosPeriodo
      .filter(at => at[chave] && at[chave].trim())
      .map(at => `  • (${UI.formatarData(at.data)}) ${at[chave].trim()}`);
 
    if (observacoes.length === 0) {
      return `${rotulo}: Sem observações específicas registradas neste período.`;
    }
    return `${rotulo}:\n${observacoes.join('\n')}`;
  }
 
  async function gerarTextoDevolutiva(criancaId, ano, periodo, conclusaoContinua, configuracoes) {
    const crianca = await BancoAT.obterCrianca(criancaId);
    if (!crianca) return '';
 
    const todosAtendimentos = crianca.atendimentos || [];
    const atendimentosPeriodo = filtrarPorPeriodo(todosAtendimentos, ano, periodo);
 
    const primeiro = atendimentosPeriodo[0] || todosAtendimentos[0] || null;
    const ultimo = atendimentosPeriodo[atendimentosPeriodo.length - 1] || todosAtendimentos[todosAtendimentos.length - 1] || null;
 
    const dificuldadesIniciais = primeiro
      ? (ROTULOS_CATEGORIA.map(c => primeiro[c.chave]).find(v => v && v.trim()) || 'aspectos gerais do desenvolvimento observados no início do acompanhamento')
      : 'aspectos gerais do desenvolvimento observados no início do acompanhamento';
 
    const quadroAtual = ultimo && ultimo.resumo && ultimo.resumo.trim()
      ? ultimo.resumo.trim()
      : 'evolução progressiva conforme registrado nos atendimentos mais recentes';
 
    const dataReferenciaFinal = ultimo ? ultimo.data : UI.hojeIso();
    const meses = calcularMesesEntre(crianca.dataInicioAcompanhamento, dataReferenciaFinal);
 
    const secoes = ROTULOS_CATEGORIA
      .map(c => montarSecaoCategoria(c.rotulo, c.chave, atendimentosPeriodo))
      .join('\n\n');
 
    const nomeProfissional = (configuracoes && configuracoes.profissionalNome) ? configuracoes.profissionalNome.trim() : '';
 
    const texto =
`I. IDENTIFICAÇÃO
 
Nome da criança: ${crianca.nome || '—'}
Data de nascimento: ${UI.formatarData(crianca.dataNascimento)}
Idade: ${UI.calcularIdadeTexto(crianca.dataNascimento)}
 
——————————————————————————————
 
Tendo como objetivo compartilhar informações sobre o rendimento da criança em questão, segue a devolutiva resultante dos atendimentos do ano de ${ano}.
 
A criança/adolescente ${crianca.nome || '______'} vem sendo acompanhada no setor de atendimento terapêutico desde ${UI.formatarData(crianca.dataInicioAcompanhamento)}, sendo as terapias uma vez por semana com duração de 40 minutos.
 
De início, a criança mostrou possuir dificuldades no(a) ${dificuldadesIniciais}.
 
Depois de ${meses} meses de atendimento, a criança apresenta um quadro de ${quadroAtual}.
 
Durante esse período, observou-se:
 
${secoes}
 
Conclusão:
 
A criança:
( ${conclusaoContinua ? 'X' : ' '} ) Necessita continuar o atendimento no ano seguinte.
( ${conclusaoContinua ? ' ' : 'X'} ) Não necessita continuar o atendimento pois apresentou avanços significativos.
 
Atenção: o presente instrumental não serve como relatório para perícias médicas e afins.
 
${nomeProfissional ? `\n\n_________________________________\n${nomeProfissional}\nAtendente Terapêutico` : ''}`;
 
    return texto;
  }
 
  async function renderizarView(raiz) {
    const criancas = (await BancoAT.listarCriancas()).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    const configuracoes = await BancoAT.obterConfiguracoes();
    const anoAtual = new Date().getFullYear();
 
    raiz.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Devolutivas</h1>
          <p class="subtitulo">Geração automática da devolutiva semestral com base nos atendimentos registrados</p>
        </div>
      </div>
 
      <div class="filtros-linha">
        <div class="campo">
          <label>Criança</label>
          <select id="dev-select-crianca">
            <option value="">Selecione...</option>
            ${criancas.map(c => `<option value="${c.id}">${UI.escapeHtml(c.nome)}</option>`).join('')}
          </select>
        </div>
        <div class="campo">
          <label>Ano</label>
          <select id="dev-select-ano">
            ${[anoAtual, anoAtual - 1, anoAtual - 2].map(a => `<option value="${a}">${a}</option>`).join('')}
          </select>
        </div>
        <div class="campo">
          <label>Período</label>
          <select id="dev-select-periodo">
            <option value="ano">Ano completo</option>
            <option value="1">1º semestre</option>
            <option value="2">2º semestre</option>
          </select>
        </div>
        <div class="campo">
          <label>Conclusão</label>
          <select id="dev-select-conclusao">
            <option value="sim">Necessita continuar</option>
            <option value="nao">Não necessita continuar</option>
          </select>
        </div>
        <div class="campo" style="justify-content:flex-end;">
          <button class="btn btn-primario" id="dev-btn-gerar">Gerar devolutiva</button>
        </div>
      </div>
 
      <div id="dev-resultado"></div>
    `;
 
    document.getElementById('dev-btn-gerar').addEventListener('click', async () => {
      const criancaId = document.getElementById('dev-select-crianca').value;
      if (!criancaId) {
        UI.toast('Selecione uma criança.', 'erro');
        return;
      }
      const ano = document.getElementById('dev-select-ano').value;
      const periodoSelect = document.getElementById('dev-select-periodo').value;
      const periodo = periodoSelect === 'ano' ? 'ano' : periodoSelect;
      const continua = document.getElementById('dev-select-conclusao').value === 'sim';
 
      const texto = await gerarTextoDevolutiva(criancaId, ano, periodo, continua, configuracoes);
 
      document.getElementById('dev-resultado').innerHTML = `
        <div class="secao-titulo">Devolutiva gerada (edite livremente antes de exportar)</div>
        <textarea id="dev-texto" class="documento-editavel">${UI.escapeHtml(texto)}</textarea>
        <div class="flex-fim" style="margin-top:14px;">
          <button class="btn btn-secundario no-print" id="dev-btn-copiar">Copiar texto</button>
          <button class="btn btn-primario no-print" id="dev-btn-imprimir">Exportar / Imprimir</button>
        </div>
      `;
 
      document.getElementById('dev-btn-copiar').addEventListener('click', async () => {
        const valor = document.getElementById('dev-texto').value;
        try {
          await navigator.clipboard.writeText(valor);
          UI.toast('Texto copiado para a área de transferência.', 'sucesso');
        } catch {
          UI.toast('Não foi possível copiar automaticamente. Selecione o texto manualmente.', 'erro');
        }
      });
 
      document.getElementById('dev-btn-imprimir').addEventListener('click', () => {
        imprimirTexto('Devolutiva', document.getElementById('dev-texto').value);
      });
    });
  }
 
  /** Abre uma janela de impressão nativa do navegador com o texto formatado (sem bibliotecas externas). */
  function imprimirTexto(titulo, texto) {
    const janela = window.open('', '_blank');
    janela.document.write(`
      <html>
        <head>
          <title>${UI.escapeHtml(titulo)}</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #111; white-space: pre-wrap; line-height: 1.6; font-size: 13.5px; }
            h1 { font-size: 16px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${UI.escapeHtml(titulo)}</h1>
          ${UI.escapeHtml(texto)}
        </body>
      </html>
    `);
    janela.document.close();
    janela.focus();
    setTimeout(() => janela.print(), 250);
  }
 
  return {
    renderizarView,
    gerarTextoDevolutiva,
    imprimirTexto
  };
})();
 