// ======================================================
// ORQUESTRADOR CENTRAL DO PAINEL ADMIN - js/admin-main.js
// ======================================================

import { API_BASE } from './api.js';

import { 
    exibirModalLogin, 
    realizarLoginAdmin, 
    realizarLogout,
    fetchComAuth 
} from './auth.js';

import { 
    carregarLeads, 
    realizarBuscaLeads,
    validarCaucao,
    aprovarLead,
    rejeitarLead,
    efetivarLocacao,
    arquivarLocatario,
    reativarLocatario
} from './admin-leads.js';

import { 
    carregarLocatarios, 
    buscarLocatario,
    abrirModalEditar,
    fecharModal
} from './admin-locatarios.js';

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

import { 
    carregarPlanosAdmin, 
    salvarNovoPlano, 
    excluirPlano, 
    abrirModalEditarPlano, 
    fecharModalPlano, 
    salvarEdicaoPlano, 
    carregarConfiguracaoCoinsPix, 
    salvarConfigCoinsPix, 
    carregarItensLojaAdmin 
} from './admin-planos.js';

import { 
    carregarUsuarios, 
    cadastrarNovoUsuario, 
    excluirUsuario 
} from './admin-usuarios.js';

import { 
    salvarTransacao, 
    initFinanceiro 
} from './admin-financeiro.js';

// EXPOSIÇÃO GLOBAL NO WINDOW PARA EVENTOS HTML (onclick/onsubmit)
window.exibirModalLogin = exibirModalLogin;
window.realizarLoginAdmin = realizarLoginAdmin;
window.realizarLogout = realizarLogout;

// Leads & Mesa
window.carregarLeads = carregarLeads;
window.realizarBuscaLeads = realizarBuscaLeads;
window.validarCaucao = validarCaucao;
window.aprovarLead = aprovarLead;
window.rejeitarLead = rejeitarLead;
window.efetivarLocacao = efetivarLocacao;

// Locatários & Frota
window.carregarLocatarios = carregarLocatarios;
window.buscarLocatario = buscarLocatario;
window.abrirModalEditar = abrirModalEditar;
window.fecharModal = fecharModal;
window.arquivarLocatario = arquivarLocatario;
window.reativarLocatario = reativarLocatario;

// Motos, Pátio & Telemetria/Peças
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

// Planos & Loja
window.carregarPlanosAdmin = carregarPlanosAdmin;
window.salvarNovoPlano = salvarNovoPlano;
window.excluirPlano = excluirPlano;
window.abrirModalEditarPlano = abrirModalEditarPlano;
window.fecharModalPlano = fecharModalPlano;
window.salvarEdicaoPlano = salvarEdicaoPlano;
window.carregarConfiguracaoCoinsPix = carregarConfiguracaoCoinsPix;
window.salvarConfigCoinsPix = salvarConfigCoinsPix;
window.carregarItensLojaAdmin = carregarItensLojaAdmin;

// Usuários
window.carregarUsuarios = carregarUsuarios;
window.cadastrarNovoUsuario = cadastrarNovoUsuario;
window.excluirUsuario = excluirUsuario;

// Financeiro
window.salvarTransacao = salvarTransacao;
window.initFinanceiro = initFinanceiro;

// Navegação por Abas
window.alternarAba = function(aba) {
    const secoes = { 
        mesa: document.getElementById('secao-mesa'), 
        frota: document.getElementById('secao-frota'), 
        motos: document.getElementById('secao-motos'), 
        loja: document.getElementById('secao-loja'), 
        planos: document.getElementById('secao-planos'),
        usuarios: document.getElementById('secao-usuarios')
    };
    const botoes = { 
        mesa: document.getElementById('btn-aba-mesa'), 
        frota: document.getElementById('btn-aba-frota'), 
        motos: document.getElementById('btn-aba-motos'), 
        loja: document.getElementById('btn-aba-loja'), 
        planos: document.getElementById('btn-aba-planos'),
        usuarios: document.getElementById('btn-aba-usuarios')
    };
    
    Object.keys(secoes).forEach(k => { 
        if (secoes[k]) secoes[k].classList.add('hidden'); 
        if (botoes[k]) { 
            botoes[k].classList.remove('ativa', 'bg-orange-600', 'text-white'); 
            botoes[k].classList.add('text-gray-400', 'hover:text-white'); 
        } 
    });
    
    if (secoes[aba]) secoes[aba].classList.remove('hidden');
    if (botoes[aba]) {
        botoes[aba].classList.remove('text-gray-400', 'hover:text-white');
        botoes[aba].classList.add('ativa', 'bg-orange-600', 'text-white');
    }
};

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

window.carregarDadosPainel = function() {
    verificarPermissoesAdmin();
    if (typeof carregarLeads === 'function') carregarLeads();
    if (typeof carregarLocatarios === 'function') carregarLocatarios();
    if (typeof carregarMotosFrota === 'function') carregarMotosFrota();
    if (typeof carregarPlanosAdmin === 'function') carregarPlanosAdmin();
    if (typeof carregarItensLojaAdmin === 'function') carregarItensLojaAdmin();
    if (typeof carregarConfiguracaoCoinsPix === 'function') carregarConfiguracaoCoinsPix();
    if (typeof carregarUsuarios === 'function') carregarUsuarios();
    if (typeof initFinanceiro === 'function') initFinanceiro();
};

window.onload = async () => {
    const token = localStorage.getItem('lf_admin_token');
    if (!token) {
        exibirModalLogin();
        return;
    }
    try {
        window.carregarDadosPainel();
    } catch (err) {
        console.error('Erro na inicialização:', err);
        localStorage.removeItem('lf_admin_token');
        exibirModalLogin();
    }
};