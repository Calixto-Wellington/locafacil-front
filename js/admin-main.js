// ======================================================
// ORQUESTRADOR CENTRAL DO PAINEL ADMIN - js/admin-main.js
// ======================================================

import { API_BASE } from './api.js';

// ------------------------------------------------------
// 1. IMPORTAÇÕES DOS MÓDULOS DE NAVEGAÇÃO E REGRAS
// ------------------------------------------------------

// Módulo de Locatários, Frota Ativa e Modais de Edição
import {
    carregarLocatarios,
    buscarLocatario,
    abrirModalEditar,
    fecharModal
} from './admin-locatarios.js';

// Módulo de Motos do Pátio e Telemetria de Peças
import {
    carregarMotosFrota,
    salvarNovaMoto,
    mudarStatusMoto,
    excluirMoto,
    abrirModalEditarMoto,
    fecharModalMoto,
    renderizarBarrasDesgasteMotos,
    abrirModalNovaPeca,
    abrirModalEditarPeca,
    fecharModalPeca,
    salvarModalPeca,
    excluirPeca,
    resetarContadorPeca
} from './admin-motos.js';

// ------------------------------------------------------
// 2. FUNÇÃO DE ALTERNÂNCIA DE ABAS (NAVEGAÇÃO FLUIDA)
// ------------------------------------------------------
export function alternarAba(abaId) {
    // Esconde todas as seções
    const secoes = document.querySelectorAll('.aba-conteudo, section[id^="secao-"], section[id^="aba-"]');
    secoes.forEach(el => el.classList.add('hidden'));

    // Reseta o estilo de todos os botões de aba
    const botoes = document.querySelectorAll('.btn-aba, .tab-btn, .aba-btn');
    botoes.forEach(btn => {
        btn.classList.remove('ativa', 'bg-indigo-600', 'bg-orange-600', 'text-white');
        btn.classList.add('text-gray-400');
    });

    // Exibe a seção alvo
    const abaAlvo = document.getElementById(`secao-${abaId}`) || document.getElementById(`aba-${abaId}`);
    if (abaAlvo) {
        abaAlvo.classList.remove('hidden');
    }

    // Destaca o botão correspondente
    const btnAtivo = document.getElementById(`btn-aba-${abaId}`);
    if (btnAtivo) {
        btnAtivo.classList.remove('text-gray-400');
        btnAtivo.classList.add('ativa', 'bg-indigo-600', 'text-white');
    }
}

// Exposição explícita no window para uso com onclick no HTML
window.alternarAba = alternarAba;

// ------------------------------------------------------
// 3. SESSÃO, AUTENTICAÇÃO E REQUISIÇÕES SEGURAS (JWT)
// ------------------------------------------------------
export function exibirModalLogin() {
    const modal = document.getElementById('modal-login');
    if (modal) modal.classList.remove('hidden');
}

export async function realizarLoginAdmin(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById('login-email');
    const senhaInput = document.getElementById('login-senha');
    const erroDiv = document.getElementById('login-erro');

    if (!emailInput || !senhaInput) return;

    const email = emailInput.value.trim();
    const senha = senhaInput.value.trim();
    if (erroDiv) erroDiv.classList.add('hidden');

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao realizar login.');

        localStorage.setItem('lf_admin_token', data.token);
        const modalLogin = document.getElementById('modal-login');
        if (modalLogin) modalLogin.classList.add('hidden');

        carregarDadosPainel();
    } catch (err) {
        if (erroDiv) {
            erroDiv.innerText = `❌ ${err.message}`;
            erroDiv.classList.remove('hidden');
        }
    }
}

export function realizarLogout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.removeItem('lf_admin_token');
        location.reload();
    }
}

export async function fetchComAuth(url, options = {}) {
    const token = localStorage.getItem('lf_admin_token');
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const res = await fetch(url, options);
    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('lf_admin_token');
        exibirModalLogin();
    }
    return res;
}

function verificarPermissoesAdmin() {
    const token = localStorage.getItem('lf_admin_token');
    if (!token) return;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        if (payload && payload.role === 'ADMIN') {
            const btnUsuarios = document.getElementById('btn-aba-usuarios');
            if (btnUsuarios) btnUsuarios.classList.remove('hidden');
        }
    } catch (e) {
        console.error('Erro ao verificar permissões:', e);
    }
}

// ------------------------------------------------------
// 4. CARREGAMENTO INICIAL E VINCULAÇÃO GLOBAL (WINDOW)
// ------------------------------------------------------

// Vincula todas as funções importadas ao objeto window para uso no HTML
window.exibirModalLogin = exibirModalLogin;
window.realizarLoginAdmin = realizarLoginAdmin;
window.realizarLogout = realizarLogout;

// Locatários e Frota
window.carregarLocatarios = carregarLocatarios;
window.buscarLocatario = buscarLocatario;
window.abrirModalEditar = abrirModalEditar;
window.fecharModal = fecharModal;

// Motos e Peças
window.carregarMotosFrota = carregarMotosFrota;
window.salvarNovaMoto = salvarNovaMoto;
window.mudarStatusMoto = mudarStatusMoto;
window.excluirMoto = excluirMoto;
window.abrirModalEditarMoto = abrirModalEditarMoto;
window.fecharModalMoto = fecharModalMoto;
window.renderizarBarrasDesgasteMotos = renderizarBarrasDesgasteMotos;
window.abrirModalNovaPeca = abrirModalNovaPeca;
window.abrirModalEditarPeca = abrirModalEditarPeca;
window.fecharModalPeca = fecharModalPeca;
window.salvarModalPeca = salvarModalPeca;
window.excluirPeca = excluirPeca;
window.resetarContadorPeca = resetarContadorPeca;

// Função centralizadora de carga de dados
export function carregarDadosPainel() {
    verificarPermissoesAdmin();

    if (typeof window.carregarLeads === 'function') window.carregarLeads();
    if (typeof carregarLocatarios === 'function') carregarLocatarios();
    if (typeof carregarMotosFrota === 'function') carregarMotosFrota();
    if (typeof window.carregarPlanosAdmin === 'function') window.carregarPlanosAdmin();
    if (typeof window.carregarItensLojaAdmin === 'function') window.carregarItensLojaAdmin();
    if (typeof window.carregarUsuarios === 'function') window.carregarUsuarios();
}

window.carregarDadosPainel = carregarDadosPainel;

// Inicialização automática ao carregar a página
window.onload = async () => {
    const token = localStorage.getItem('lf_admin_token');
    
    // Se não houver token salvo, abre o modal de login
    if (!token) {
        exibirModalLogin();
        return;
    }

    try {
        carregarDadosPainel();
    } catch (err) {
        console.error('Erro ao inicializar o painel:', err);
        localStorage.removeItem('lf_admin_token');
        exibirModalLogin();
    }
};