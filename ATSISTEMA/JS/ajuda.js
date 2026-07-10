/* ajuda.js — manual estático com accordion */

const Ajuda = (function () {
  'use strict';

  const FAQ = [
    {
      p: 'Como cadastrar uma nova criança?',
      r: 'Acesse o menu "Crianças" e clique no botão "+ Nova Criança". Preencha os dados e clique em "Cadastrar". A criança aparecerá na lista principal.'
    },
    {
      p: 'Como registrar um atendimento?',
      r: 'Você pode registrar de duas formas: (1) Acesse a ficha da criança clicando no card dela e clique em "+ Novo atendimento"; (2) Acesse o menu "Atendimentos" e clique em "+ Novo Atendimento", selecionando a criança desejada.'
    },
    {
      p: 'Como gerar uma devolutiva?',
      r: 'Acesse o menu "Devolutivas", selecione a criança, o ano, o período (semestral ou anual) e a conclusão. Clique em "Gerar devolutiva". O texto é gerado automaticamente com base nos atendimentos registrados e pode ser editado antes de imprimir.'
    },
    {
      p: 'Como gerar um relatório?',
      r: 'Acesse o menu "Relatórios", selecione a criança e o período desejado. Clique em "Gerar relatório". Você pode imprimir ou exportar como PDF usando a função de impressão do navegador (Ctrl+P / Cmd+P).'
    },
    {
      p: 'Como fazer backup dos dados?',
      r: 'Acesse o menu "Backup" e clique em "Exportar JSON". Um arquivo será baixado com todos os dados do sistema. Para restaurar, clique em "Selecionar arquivo" e escolha o arquivo de backup. Atenção: a importação substitui todos os dados atuais.'
    },
    {
      p: 'Como alterar o tema (claro/escuro)?',
      r: 'Acesse o menu "Configurações" e selecione o tema desejado na seção "Aparência". A mudança é aplicada imediatamente.'
    },
    {
      p: 'Os dados ficam salvos onde?',
      r: 'Todos os dados são armazenados localmente no seu navegador usando IndexedDB. Nenhuma informação é enviada para servidores externos. O sistema funciona completamente offline.'
    },
    {
      p: 'O que acontece se eu limpar o cache do navegador?',
      r: 'Limpar o cache pode apagar os dados do IndexedDB. Por isso, recomenda-se fazer backups regulares usando a função de exportação disponível no menu "Backup".'
    },
    {
      p: 'Como ver o histórico completo de uma criança?',
      r: 'Acesse o menu "Históricos", selecione a criança no seletor. Todos os atendimentos serão exibidos em ordem cronológica, agrupados por mês e ano.'
    },
    {
      p: 'Como filtrar os resumos das sessões?',
      r: 'Acesse o menu "Resumos". Use os filtros de criança, data inicial e data final para encontrar os resumos desejados. Clique em "Limpar filtros" para redefinir.'
    },
  ];

  function renderizarView(raiz) {
    raiz.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Ajuda</h1>
          <p class="subtitulo">Perguntas frequentes e guia de uso do sistema</p>
        </div>
      </div>

      <div style="max-width:720px;">
        ${FAQ.map((item, i) => `
          <div class="ajuda-item" id="faq-${i}">
            <div class="ajuda-pergunta" data-idx="${i}">
              <span>${UI.escapeHtml(item.p)}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div class="ajuda-resposta">${UI.escapeHtml(item.r)}</div>
          </div>`).join('')}
      </div>
    `;

    raiz.querySelectorAll('.ajuda-pergunta').forEach(el => {
      el.addEventListener('click', () => {
        const item = document.getElementById(`faq-${el.dataset.idx}`);
        item.classList.toggle('aberto');
      });
    });
  }

  return { renderizarView };
})();
