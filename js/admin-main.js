// ======================================================
// CENTRALIZADOR ADMIN - js/admin-main.js
// ======================================================

import { exibirModalLogin, realizarLoginAdmin, realizarLogout } from './auth.js';
import { carregarLeads, realizarBuscaLeads } from './admin-leads.js';
import { carregarLocatarios, buscarLocatario } from './admin-locatarios.js';
import { carregarMotosFrota, salvarNovaMoto, mudarStatusMoto, excluirMoto, abrirModalEditarMoto, fecharModalMoto } from './admin-motos.js';
import { carregarPlanosAdmin, salvarNovoPlano, excluirPlano, abrirModalEditarPlano, fecharModalPlano, salvarEdicaoPlano, carregarConfiguracaoCoinsPix, salvarConfigCoinsPix, carregarItensLojaAdmin } from './admin-planos.js';
import { carregarUsuarios, cadastrarNovoUsuario, excluirUsuario } from './admin-usuarios.js';
import { salvarTransacao, initFinanceiro, carregarResumoDRE, calcularSimulacaoExpansao } from './admin-financeiro.js';

// ------------------------------------------------------
// 1. Expondo funções globalmente para os botões e formulários do HTML
// ------------------------------------------------------
window.exibirModalLogin = exibirModalLogin;
window.realizarLoginAdmin = realizarLoginAdmin;
window.realizarLogout = realizarLogout;

window.carregarLeads = carregarLeads;
window.realizarBuscaLeads = realizarBuscaLeads;

window.carregarLocatarios = carregarLocatarios;
window.buscarLocatario = buscarLocatario;

window.carregarMotosFrota = carregarMotosFrota;
window.salvarNovaMoto = salvarNovaMoto;
window.mudarStatusMoto = mudarStatusMoto;
window.excluirMoto = excluirMoto;
window.abrirModalEditarMoto = abrirModalEditarMoto;
window.fecharModalMoto = fecharModalMoto;

window.carregarPlanosAdmin = carregarPlanosAdmin;
window.salvarNovoPlano = salvarNovoPlano;
window.excluirPlano = excluirPlano;
window.abrirModalEditarPlano = abrirModalEditarPlano;
window.fecharModalPlano = fecharModalPlano;
window.salvarEdicaoPlano = salvarEdicaoPlano;

window.carregarConfiguracaoCoinsPix = carregarConfiguracaoCoinsPix;
window.salvarConfigCoinsPix = salvarConfigCoinsPix;
window.carregarItensLojaAdmin = carregarItensLojaAdmin;

window.carregarUsuarios = carregarUsuarios;
window.cadastrarNovoUsuario = cadastrarNovoUsuario;
window.excluirUsuario = excluirUsuario;

// Funções do Módulo Financeiro & DRE (Passos 1 a 4)
window.salvarTransacao = salvarTransacao;
window.initFinanceiro = initFinanceiro;
window.carregarResumoDRE = carregarResumoDRE;
window.calcularSimulacaoExpansao = calcularSimulacaoExpansao;

// ------------------------------------------------------
// 2. Navegação de Abas Unificada (Atende alternarAba e mudarAba)
// ------------------------------------------------------
window.alternarAba = function(aba) {
    const secoes = { 
        mesa: document.getElementById('secao-mesa'), 
        frota: document.getElementById('secao-frota'), 
        motos: document.getElementById('secao-motos'), 
        loja: document.getElementById('secao-loja'), 
        planos: document.getElementById('secao-planos'),
        usuarios: document.getElementById('secao-usuarios'),
        financeiro: document.getElementById('secao-financeiro')
    };

    const botoes = { 
        mesa: document.getElementById('btn-aba-mesa'), 
        frota: document.getElementById('btn-aba-frota'), 
        motos: document.getElementById('btn-aba-motos'), 
        loja: document.getElementById('btn-aba-loja'), 
        planos: document.getElementById('btn-aba-planos'),
        usuarios: document.getElementById('btn-aba-usuarios'),
        financeiro: document.getElementById('btn-aba-financeiro')
    };

    // Esconde todas as seções e reseta os botões
    Object.keys(secoes).forEach(k => { 
        if (secoes[k]) secoes[k].classList.add('hidden'); 
        if (botoes[k]) { 
            botoes[k].classList.remove('ativa', 'bg-orange-600', 'text-white'); 
            botoes[k].classList.add('text-gray-400', 'hover:text-white'); 
        } 
    });

    // Exibe a seção ativa e destaca o botão correspondente
    if (secoes[aba]) secoes[aba].classList.remove('hidden');
    if (botoes[aba]) {
        botoes[aba].classList.remove('text-gray-400', 'hover:text-white');
        botoes[aba].classList.add('ativa', 'bg-orange-600', 'text-white');
    }

    // Ao entrar na aba do financeiro, atualiza os saldos e o simulador imediatamente
    if (aba === 'financeiro') {
        if (typeof carregarResumoDRE === 'function') carregarResumoDRE();
        if (typeof calcularSimulacaoExpansao === 'function') calcularSimulacaoExpansao();
    }
};

// Garantia de compatibilidade caso algum evento chame mudarAba()
window.mudarAba = window.alternarAba;

// ------------------------------------------------------
// 3. Verificação de Permissões JWT do Administrador
// ------------------------------------------------------
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
        console.error('Erro ao verificar permissões do token:', e); 
    }
}

// ------------------------------------------------------
// 4. Carregamento Geral do Painel de Controle
// ------------------------------------------------------
window.carregarDadosPainel = function() {
    verificarPermissoesAdmin();
    carregarLeads();
    carregarLocatarios();
    carregarMotosFrota();
    carregarPlanosAdmin();
    carregarItensLojaAdmin();
    carregarConfiguracaoCoinsPix();
    carregarUsuarios();
    initFinanceiro();
};

// ------------------------------------------------------
// 5. Inicialização da Sessão ao Carregar a Página
// ------------------------------------------------------
window.onload = async () => {
    const token = localStorage.getItem('lf_admin_token');
    if (!token) {
        exibirModalLogin();
        return;
    }
    try {
        window.carregarDadosPainel();
    } catch (err) {
        console.error('Erro na inicialização do painel:', err);
        localStorage.removeItem('lf_admin_token');
        exibirModalLogin();
    }
};
