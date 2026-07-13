/* banco.js — camada de acesso ao Supabase (substitui IndexedDB) */

const BancoAT = (function () {
  'use strict';

  const SUPABASE_URL = 'https://bqakxguzundktwjefjae.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_q3E8nFjeKFGvkiM4Oo_uLw_RMbkByNJ';

  const _client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  /* ---- AUTH ---- */
  function getClient() { return _client; }

  async function loginComGoogle() {
    const { error } = await _client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/drive.file',
        redirectTo: location.href,
      }
    });
    if (error) throw error;
  }

  async function logout() {
    await _client.auth.signOut();
  }

  async function getUsuario() {
    const { data: { user } } = await _client.auth.getUser();
    return user;
  }

  function onAuthChange(callback) {
    _client.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }

  /* ---- HELPERS ---- */
  async function _userId() {
    const user = await getUsuario();
    if (!user) throw new Error('Usuário não autenticado');
    return user.id;
  }

  async function _req(promise) {
    const { data, error } = await promise;
    if (error) throw error;
    return data;
  }

  /* ---- CRIANÇAS ---- */
  async function listarCriancas() {
    const uid = await _userId();
    const rows = await _req(_client.from('criancas').select('*').eq('user_id', uid).order('nome').limit(1000));
    return rows.map(_deserializar);
  }

  async function obterCrianca(id) {
    const uid = await _userId();
    const rows = await _req(_client.from('criancas').select('*').eq('id', id).eq('user_id', uid).limit(1));
    return rows.length ? _deserializar(rows[0]) : null;
  }

  async function salvarCrianca(dados) {
    const uid = await _userId();
    const row = _serializar({ ...dados, user_id: uid });
    if (dados.id) {
      await _req(_client.from('criancas').update(row).eq('id', dados.id).eq('user_id', uid));
      return dados.id;
    }
    const inserted = await _req(_client.from('criancas').insert(row).select('id').single());
    return inserted.id;
  }

  async function excluirCrianca(id) {
    const uid = await _userId();
    await _req(_client.from('criancas').delete().eq('id', id).eq('user_id', uid));
  }

  /* ---- ATENDIMENTOS (array dentro do registro da criança) ---- */
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
    const uid = await _userId();
    const rows = await _req(_client.from('configuracoes').select('*').eq('user_id', uid).limit(1));
    return rows.length ? rows[0] : { tema: 'escuro', profissionalNome: '', assinatura: '', logo: '' };
  }

  async function salvarConfiguracoes(dados) {
    const uid = await _userId();
    const row = { ...dados, user_id: uid };
    const rows = await _req(_client.from('configuracoes').select('id').eq('user_id', uid).limit(1));
    if (rows.length) {
      await _req(_client.from('configuracoes').update(row).eq('user_id', uid));
    } else {
      await _req(_client.from('configuracoes').insert(row));
    }
  }

  /* ---- SERIALIZAÇÃO (atendimentos como JSONB) ---- */
  function _serializar(dados) {
    return { ...dados, atendimentos: dados.atendimentos || [] };
  }

  function _deserializar(row) {
    return { ...row, atendimentos: row.atendimentos || [] };
  }

  /* ---- BACKUP ---- */
  async function exportarTudo() {
    const criancas = await listarCriancas();
    const configuracoes = await obterConfiguracoes();
    return { versao: 2, exportadoEm: new Date().toISOString(), criancas, configuracoes };
  }

  async function importarTudo(dados) {
    const uid = await _userId();
    // Apaga tudo do usuário
    await _req(_client.from('criancas').delete().eq('user_id', uid));
    await _req(_client.from('configuracoes').delete().eq('user_id', uid));
    // Reimporta
    for (const c of (dados.criancas || [])) {
      const { id, ...resto } = c;
      await _req(_client.from('criancas').insert(_serializar({ ...resto, user_id: uid })));
    }
    if (dados.configuracoes) {
      const { id, ...resto } = dados.configuracoes;
      await _req(_client.from('configuracoes').insert({ ...resto, user_id: uid }));
    }
  }

  /* ---- REALTIME ---- */
  function escutarMudancas(tabela, callback) {
    _client.channel(`public:${tabela}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tabela }, callback)
      .subscribe();
  }

  /* ---- GOOGLE DRIVE BACKUP ---- */
  async function salvarBackupNoDrive(jsonStr, nomeArquivo) {
    const { data: { session } } = await _client.auth.getSession();
    const token = session?.provider_token;
    if (!token) throw new Error('Token do Google não disponível.');
    const metadata = { name: nomeArquivo, mimeType: 'application/json', parents: ['appDataFolder'] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([jsonStr], { type: 'application/json' }));
    const resp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!resp.ok) throw new Error('Falha ao salvar no Google Drive');
    return await resp.json();
  }

  return {
    getClient, loginComGoogle, logout, getUsuario, onAuthChange,
    listarCriancas, obterCrianca, salvarCrianca, excluirCrianca,
    salvarAtendimento, excluirAtendimento,
    obterConfiguracoes, salvarConfiguracoes,
    exportarTudo, importarTudo, salvarBackupNoDrive,
    escutarMudancas,
  };
})();
