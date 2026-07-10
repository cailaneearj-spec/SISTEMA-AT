/* ui.js — utilitários compartilhados de interface */

const UI = (function () {
  'use strict';

  /* ---- TOAST ---- */
  function toast(msg, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${tipo === 'erro' ? 'erro' : tipo === 'sucesso' ? 'sucesso' : ''}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  /* ---- MODAL ---- */
  function abrirModal(titulo, htmlCorpo, largura = false) {
    document.getElementById('modal-title').textContent = titulo;
    document.getElementById('modal-body').innerHTML = htmlCorpo;
    const box = document.getElementById('modal-box');
    box.classList.toggle('modal-larga', largura);
    document.getElementById('modal-overlay').hidden = false;
  }

  function fecharModal() {
    document.getElementById('modal-overlay').hidden = true;
    document.getElementById('modal-body').innerHTML = '';
  }

  function _initModal() {
    document.getElementById('modal-close-btn').addEventListener('click', fecharModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) fecharModal();
    });
  }

  /* ---- DATAS ---- */
  function hojeIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatarData(iso) {
    if (!iso) return '—';
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  }

  function calcularIdade(dataNascIso) {
    if (!dataNascIso) return null;
    const nasc = new Date(dataNascIso + 'T00:00:00');
    const hoje = new Date();
    let anos = hoje.getFullYear() - nasc.getFullYear();
    let meses = hoje.getMonth() - nasc.getMonth();
    if (meses < 0) { anos--; meses += 12; }
    if (hoje.getDate() < nasc.getDate()) meses--;
    if (meses < 0) { anos--; meses += 12; }
    return { anos, meses };
  }

  function calcularIdadeTexto(dataNascIso) {
    const idade = calcularIdade(dataNascIso);
    if (!idade) return '—';
    if (idade.anos === 0) return `${idade.meses} meses`;
    if (idade.meses === 0) return `${idade.anos} anos`;
    return `${idade.anos} anos e ${idade.meses} meses`;
  }

  /* ---- SEGURANÇA ---- */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---- TEMA ---- */
  function aplicarTema(tema) {
    document.documentElement.setAttribute('data-tema', tema === 'claro' ? 'claro' : 'escuro');
  }

  /* ---- ÍCONES SVG (inline, sem dependência externa) ---- */
  const ICONES = {
    criancas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
    atendimentos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
    historicos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>`,
    resumos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    devolutivas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    relatorios: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    backup: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>`,
    configuracoes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    ajuda: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  };

  function injetarIcones() {
    document.querySelectorAll('.nav-icon[data-icon]').forEach(el => {
      const svg = ICONES[el.dataset.icon];
      if (svg) el.innerHTML = svg;
    });
  }

  return { toast, abrirModal, fecharModal, _initModal, hojeIso, formatarData, calcularIdade, calcularIdadeTexto, escapeHtml, aplicarTema, injetarIcones };
})();
