// ======================================================
// LOCAFACILMOTOS LTDA — PAINEL CENTRAL DE OPERAÇÕES
// ORQUESTRADOR CENTRALIZADOR DA APLICAÇÃO (js/admin-main.js)
// ======================================================

// ------------------------------------------------------
// 1. MÓDULO DE AUTENTICAÇÃO E SESSÃO SEGURA (JWT)
// ------------------------------------------------------
import { 
    exibirModalLogin, 
    realizarLoginAdmin, 
    realizarLogout, 
    fetchComAuth 
} from './auth.js';

// ------------------------------------------------------
// 2. MÓDULO DE MESA DE APROVAÇÃO E LEADS (FICHAS)
// ------------------------------------------------------
import { 
    carregarLeads, 
    realizarBuscaLeads,
    validarCaucao,
    aprovarLead,
    efetivarLocacao,
    rejeitarLead
} from './admin-leads.js';

// ------------------------------------------------------
// 3. MÓDULO DE FROTA, LOCATÁRIOS E TELEMETRIA (CSV)
// ------------------------------------------------------
import { 
    carregarLocatarios, 
    buscarLocatario, 
    abrirModalEditar, 
    fecharModal, 
    salvarEdicaoCard, 
    arquivarLocatario, 
    reativarLocatario, 
    adicionarUmaSemana,
    abrirModalImportarCSV, 
    fecharModalImportarCSV, 
    processarArquivoCSV, 
    confirmarImportacaoCSV,
    marcarDesmarcarTodosCSV
} from './admin-locatarios.js';

// ------------------------------------------------------
// 4. MÓDULO DE PÁTIO DE MOTOS E INVENTÁRIO
// ------------------------------------------------------
import { 
    carregarMotosFrota, 
    salvarNovaMoto, 
    mudarStatusMoto, 
    excluirMoto, 
    abrirModalEditarMoto, 
    fecharModalMoto, 
    salvarEdicaoMoto 
} from './admin-motos.js';

// ------------------------------------------------------
// 5. MÓDULO DE PLANOS DE CONTRATO E LOJA DE COINS
// ------------------------------------------------------
import { 
    carregarPlanosAdmin, 
    salvarNovoPlano, 
    excluirPlano, 
    abrirModalEditarPlano, 
    fecharModalPlano, 
    salvarEdicaoPlano, 
    carregarConfiguracaoCoinsPix, 
    salvarConfigCoinsPix, 
    carregarItensLojaAdmin,
    adicionarItemLoja,
    excluirItemLoja
} from './admin-planos.js';

// ------------------------------------------------------
// 6. MÓDULO DE GESTÃO DE USUÁRIOS E PERMISSÕES
// ------------------------------------------------------
import { 
    carregarUsuarios, 
    cadastrarNovoUsuario, 
    excluirUsuario 
} from './admin-usuarios.js';

// ------------------------------------------------------
// 7. MÓDULO DE GESTÃO FINANCEIRA E DRE
// ------------------------------------------------------
import { 
    initFinanceiro, 
    salvarTransacao 
} from './admin-financeiro.js';

// ------------------------------------------------------
// 8. MÓDULO SIMULADOR DE DEVOLUÇÃO / RESCISÃO
// ------------------------------------------------------
import { 
    abrirSimuladorDevolucao 
} from './admin-devolucao.js';

// ======================================================
// REGISTRO DE FUNÇÕES GLOBAIS NO OBJETO WINDOW
// (Garante acesso via onclick e onsubmit nos arquivos HTML)
// ======================================================

// Helper HTTP
window.fetchComAuth = fetchComAuth;

// Autenticação
window.exibirModalLogin = exibirModalLogin;
window.realizarLoginAdmin = realizarLoginAdmin;
window.realizarLogout = realizarLogout;

// Mesa de Aprovação / Leads
window.carregarLeads = carregarLeads;
window.realizarBuscaLeads = realizarBuscaLeads;
window.validarCaucao = validarCaucao;
window.aprovarLead = aprovarLead;
window.efetivarLocacao = efetivarLocacao;
window.rejeitarLead = rejeitarLead;

// Frota & Locatários
window.carregarLocatarios = carregarLocatarios;
window.buscarLocatario = buscarLocatario;
window.abrirModalEditar = abrirModalEditar;
window.fecharModal = fecharModal;
window.salvarEdicaoCard = salvarEdicaoCard;
window.arquivarLocatario = arquivarLocatario;
window.reativarLocatario = reativarLocatario;
window.adicionarUmaSemana = adicionarUmaSemana;
window.abrirModalImportarCSV = abrirModalImportarCSV;
window.fecharModalImportarCSV = fecharModalImportarCSV;
window.processarArquivoCSV = processarArquivoCSV;
window.confirmarImportacaoCSV = confirmarImportacaoCSV;
window.marcarDesmarcarTodosCSV = marcarDesmarcarTodosCSV;

// Pátio de Motos
window.carregarMotosFrota = carregarMotosFrota;
window.salvarNovaMoto = salvarNovaMoto;
window.mudarStatusMoto = mudarStatusMoto;
window.excluirMoto = excluirMoto;
window.abrirModalEditarMoto = abrirModalEditarMoto;
window.fecharModalMoto = fecharModalMoto;
window.salvarEdicaoMoto = salvarEdicaoMoto;

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
window.adicionarItemLoja = adicionarItemLoja;
window.excluirItemLoja = excluirItemLoja;

// Usuários
window.carregarUsuarios = carregarUsuarios;
window.cadastrarNovoUsuario = cadastrarNovoUsuario;
window.excluirUsuario = excluirUsuario;

// Financeiro & Devolução
window.initFinanceiro = initFinanceiro;
window.salvarTransacao = salvarTransacao;
window.abrirSimuladorDevolucao = abrirSimuladorDevolucao;

// ======================================================
// SISTEMA DE NAVEGAÇÃO ENTRE ABAS DO PAINEL
// (Com chamada automática de busca de dados na API)
// ======================================================
window.alternarAba = function(aba) {
    const chaves = [
        'mesa', 
        'frota', 
        'motos', 
        'loja', 
        'planos', 
        'usuarios', 
        'financeiro', 
        'devolucao'
    ];

    // 1. Oculta todas as seções e reseta o destaque dos botões
    chaves.forEach(k => { 
        const secao = document.getElementById(`secao-${k}`) || document.getElementById(`aba-${k}`);
        const btn = document.getElementById(`btn-aba-${k}`);

        if (secao) {
            secao.classList.add('hidden');
        }
        if (btn) { 
            btn.classList.remove('ativa', 'bg-orange-600', 'text-white'); 
            btn.classList.add('text-gray-400', 'hover:text-white'); 
        } 
    });
    
    // 2. Torna visível a seção ativa e aplica estilo visual no botão
    const secaoAlvo = document.getElementById(`secao-${aba}`) || document.getElementById(`aba-${aba}`);
    const btnAtivo = document.getElementById(`btn-aba-${aba}`);

    if (secaoAlvo) {
        secaoAlvo.classList.remove('hidden');
    }
    if (btnAtivo) {
        btnAtivo.classList.remove('text-gray-400', 'hover:text-white');
        btnAtivo.classList.add('ativa', 'bg-orange-600', 'text-white');
    }

    // 3. Dispara a requisição HTTP automaticamente ao selecionar a aba
    if (aba === 'frota' && typeof window.carregarLocatarios === 'function') {
        window.carregarLocatarios();
    } else if (aba === 'motos' && typeof window.carregarMotosFrota === 'function') {
        window.carregarMotosFrota();
    } else if (aba === 'mesa' && typeof window.carregarLeads === 'function') {
        window.carregarLeads();
    } else if (aba === 'planos' && typeof window.carregarPlanosAdmin === 'function') {
        window.carregarPlanosAdmin();
    } else if (aba === 'loja' && typeof window.carregarItensLojaAdmin === 'function') {
        window.carregarItensLojaAdmin();
        if (typeof window.carregarConfiguracaoCoinsPix === 'function') {
            window.carregarConfiguracaoCoinsPix();
        }
    } else if (aba === 'usuarios' && typeof window.carregarUsuarios === 'function') {
        window.carregarUsuarios();
    } else if (aba === 'financeiro' && typeof window.initFinanceiro === 'function') {
        window.initFinanceiro();
    }
};

// ======================================================
// VERIFICAÇÃO DE PERMISSÕES E INICIALIZAÇÃO DE SESSÃO
// ======================================================
function verificarPermissoesAdmin() {
    const token = localStorage.getItem('lf_admin_token');
    if (!token) return;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        if (payload && payload.role === 'ADMIN') {
            const btnUsuarios = document.getElementById('btn-aba-usuarios');
            if (btnUsuarios) {
                btnUsuarios.classList.remove('hidden');
            }
        }
    } catch (e) {
        console.error('Erro ao verificar permissão de admin:', e);
    }
}

window.carregarDadosPainel = function() {
    verificarPermissoesAdmin();
    // Carrega a aba padrão inicial da frota
    if (typeof window.carregarLocatarios === 'function') {
        window.carregarLocatarios();
    }
};

// ======================================================
// CICLO DE VIDA AO CARREGAR A PÁGINA (ONLOAD)
// ======================================================
window.onload = async () => {
    const token = localStorage.getItem('lf_admin_token');
    if (!token) {
        if (typeof window.exibirModalLogin === 'function') {
            window.exibirModalLogin();
        }
        return;
    }
    try {
        window.carregarDadosPainel();
    } catch (err) {
        console.error('Erro na inicialização do painel:', err);
        localStorage.removeItem('lf_admin_token');
        if (typeof window.exibirModalLogin === 'function') {
            window.exibirModalLogin();
        }
    }
};