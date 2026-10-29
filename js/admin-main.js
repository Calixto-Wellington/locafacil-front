// ======================================================
// ORQUESTRADOR CENTRAL DO PAINEL ADMIN — js/admin-main.js
// ======================================================

// 1. AUTENTICAÇÃO E SESSÃO
import { 
    exibirModalLogin, 
    realizarLoginAdmin, 
    realizarLogout 
} from './auth.js';

// 2. MESA DE APROVAÇÃO (LEADS & FICHAS DE CLIENTES)
import { 
    carregarLeads, 
    realizarBuscaLeads 
} from './admin-leads.js';

// 3. GESTÃO DE FROTA, LOCATÁRIOS E TELEMETRIA CSV (MOBILTRACKER)
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
    confirmarImportacaoCSV
} from './admin-locatarios.js';

// 4. PÁTIO, MOTOS FÍSICAS E PEÇAS DE MANUTENÇÃO (OFICINA)
import { 
    carregarMotosFrota, 
    salvarNovaMoto, 
    mudarStatusMoto, 
    excluirMoto, 
    abrirModalEditarMoto, 
    fecharModalMoto,
    salvarEdicaoMoto,
    renderizarBarrasDesgasteMotos,
    abrirModalNovaPeca,
    abrirModalEditarPeca,
    fecharModalPeca,
    salvarModalPeca,
    excluirPeca,
    resetarContadorPeca
} from './admin-motos.js';

// 5. GESTÃO DE PLANOS, REGRAS DE COINS E LOJA DE BRINDES
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

// 6. GESTÃO DE USUÁRIOS E PERMISSÕES (ADMIN / OPERADOR)
import { 
    carregarUsuarios, 
    cadastrarNovoUsuario, 
    excluirUsuario 
} from './admin-usuarios.js';

// 7. GESTÃO FINANCEIRA E CAIXA / DRE
import { 
    salvarTransacao, 
    initFinanceiro 
} from './admin-financeiro.js';


// ======================================================
// EXPOSIÇÃO GLOBAL NO WINDOW PARA SUPORTE AOS EVENTOS HTML
// ======================================================

// Autenticação
window.exibirModalLogin = exibirModalLogin;
window.realizarLoginAdmin = realizarLoginAdmin;
window.realizarLogout = realizarLogout;

// Mesa de Aprovação
window.carregarLeads = carregarLeads;
window.realizarBuscaLeads = realizarBuscaLeads;

// Frota & Contratos
window.carregarLocatarios = carregarLocatarios;
window.buscarLocatario = buscarLocatario;
window.abrirModalEditar = abrirModalEditar;
window.fecharModal = fecharModal;
window.salvarEdicaoCard = salvarEdicaoCard;
window.arquivarLocatario = arquivarLocatario;
window.reativarLocatario = reativarLocatario;
window.adicionarUmaSemana = adicionarUmaSemana;

// Telemetria CSV Mobiltracker
window.abrirModalImportarCSV = abrirModalImportarCSV;
window.fecharModalImportarCSV = fecharModalImportarCSV;
window.processarArquivoCSV = processarArquivoCSV;
window.confirmarImportacaoCSV = confirmarImportacaoCSV;

// Motos & Oficina
window.carregarMotosFrota = carregarMotosFrota;
window.salvarNovaMoto = salvarNovaMoto;
window.mudarStatusMoto = mudarStatusMoto;
window.excluirMoto = excluirMoto;
window.abrirModalEditarMoto = abrirModalEditarMoto;
window.fecharModalMoto = fecharModalMoto;
window.salvarEdicaoMoto = salvarEdicaoMoto;
window.renderizarBarrasDesgasteMotos = renderizarBarrasDesgasteMotos;
window.abrirModalNovaPeca = abrirModalNovaPeca;
window.abrirModalEditarPeca = abrirModalEditarPeca;
window.fecharModalPeca = fecharModalPeca;
window.salvarModalPeca = salvarModalPeca;
window.excluirPeca = excluirPeca;
window.resetarContadorPeca = resetarContadorPeca;

// Planos & Loja de Coins
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

// Financeiro
window.salvarTransacao = salvarTransacao;
window.initFinanceiro = initFinanceiro;


// ======================================================
// NAVEGAÇÃO ENTRE ABAS DO PAINEL
// ======================================================
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

    // Oculta todas as seções e reseta o destaque visual dos botões
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
};


// ======================================================
// CHECAGEM DE PERMISSÕES JWT E CARREGAMENTO
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
            if (btnUsuarios) btnUsuarios.classList.remove('hidden');
        }
    } catch (e) { 
        console.error('Erro ao decodificar token de permissão:', e); 
    }
}

window.carregarDadosPainel = function() {
    verificarPermissoesAdmin();
    if (typeof window.carregarLeads === 'function') window.carregarLeads();
    if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
    if (typeof window.carregarMotosFrota === 'function') window.carregarMotosFrota();
    if (typeof window.carregarPlanosAdmin === 'function') window.carregarPlanosAdmin();
    if (typeof window.carregarItensLojaAdmin === 'function') window.carregarItensLojaAdmin();
    if (typeof window.carregarConfiguracaoCoinsPix === 'function') window.carregarConfiguracaoCoinsPix();
    if (typeof window.carregarUsuarios === 'function') window.carregarUsuarios();
    if (typeof window.initFinanceiro === 'function') window.initFinanceiro();
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
        console.error('Erro ao inicializar o painel:', err);
        localStorage.removeItem('lf_admin_token');
        exibirModalLogin();
    }
};