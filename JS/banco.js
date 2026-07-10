/* banco.js — camada IndexedDB, sem lógica de UI */

const BancoAT = (function () {
  'use strict';

  const NOME_DB = 'SistemaAT_DB';
  const VERSAO = 1;
  let _db = null;

  function abrir() {
    return new Promise((resolve, reject) => {
      if (_db) return resolve(_db);
      const req = indexedDB.open(NOME_DB, VERSAO);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('criancas')) {
          const store = db.createObjectStore('criancas', { keyPath: 'id', autoIncrement: true });
          store.createIndex('nome', 'nome', { unique: false });
          store.createIndex('numeroPasta', 'numeroPasta', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
        if (!db.objectStoreNames.contains('configuracoes')) {
          db.createObjectStore('configuracoes', { keyPath: 'chave' });
        }
      };

      req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  function _tx(store, modo) {
    return _db.transaction(store, modo).objectStore(store);
  }

  function _promessa(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  /* ---- CRIANÇAS ---- */

  async function listarCriancas() {
    await abrir();
    return _promessa(_tx('criancas', 'readonly').getAll());
  }

  async function obterCrianca(id) {
    await abrir();
    return _promessa(_tx('criancas', 'readonly').get(Number(id)));
  }

  async function salvarCrianca(dados) {
    await abrir();
    if (dados.id) {
      return _promessa(_tx('criancas', 'readwrite').put(dados));
    }
    return _promessa(_tx('criancas', 'readwrite').add(dados));
  }

  async function excluirCrianca(id) {
    await abrir();
    return _promessa(_tx('criancas', 'readwrite').delete(Number(id)));
  }

  /* ---- ATENDIMENTOS (dentro do registro da criança) ---- */

  async function salvarAtendimento(criancaId, atendimento) {
    const crianca = await obterCrianca(criancaId);
    if (!crianca) throw new Error('Criança não encontrada');
    crianca.atendimentos = crianca.atendimentos || [];
    if (atendimento.id) {
      const idx = crianca.atendimentos.findIndex(a => a.id === atendimento.id);
      if (idx >= 0) crianca.atendimentos[idx] = atendimento;
      else crianca.atendimentos.push(atendimento);
    } else {
      atendimento.id = Date.now();
      atendimento.criadoEm = new Date().toISOString();
      crianca.atendimentos.push(atendimento);
    }
    await salvarCrianca(crianca);
    return atendimento.id;
  }

  async function excluirAtendimento(criancaId, atendimentoId) {
    const crianca = await obterCrianca(criancaId);
    if (!crianca) return;
    crianca.atendimentos = (crianca.atendimentos || []).filter(a => a.id !== atendimentoId);
    await salvarCrianca(crianca);
  }

  /* ---- CONFIGURAÇÕES ---- */

  async function obterConfiguracoes() {
    await abrir();
    const cfg = await _promessa(_tx('configuracoes', 'readonly').get('principal'));
    return cfg || { chave: 'principal', tema: 'escuro', profissionalNome: '', assinatura: '', logo: '' };
  }

  async function salvarConfiguracoes(dados) {
    await abrir();
    dados.chave = 'principal';
    return _promessa(_tx('configuracoes', 'readwrite').put(dados));
  }

  /* ---- BACKUP ---- */

  async function exportarTudo() {
    const criancas = await listarCriancas();
    const configuracoes = await obterConfiguracoes();
    return { versao: VERSAO, exportadoEm: new Date().toISOString(), criancas, configuracoes };
  }

  async function importarTudo(dados) {
    await abrir();
    const tx = _db.transaction(['criancas', 'configuracoes'], 'readwrite');
    const storeCriancas = tx.objectStore('criancas');
    const storeCfg = tx.objectStore('configuracoes');

    await _promessa(storeCriancas.clear());
    await _promessa(storeCfg.clear());

    for (const c of (dados.criancas || [])) storeCriancas.put(c);
    if (dados.configuracoes) storeCfg.put(dados.configuracoes);

    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  return { abrir, listarCriancas, obterCrianca, salvarCrianca, excluirCrianca, salvarAtendimento, excluirAtendimento, obterConfiguracoes, salvarConfiguracoes, exportarTudo, importarTudo };
})();
