// ======================================================
// MÓDULO FINANCEIRO, DRE E SIMULADOR — js/admin-financeiro.js
// ======================================================

import { API_BASE } from './api.js';
import { fetchComAuth } from './auth.js';

// Auxiliar: Formatação de Valores em Reais (R$)
function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// 1. REGISTRAR NOVA TRANSAÇÃO NO CAIXA (ENTRADA / SAÍDA)
export async function salvarTransacao(e) {
    if (e) e.preventDefault();

    const inputData = document.getElementById('trans-data');
    const inputTipo = document.getElementById('trans-tipo');
    const inputCat = document.getElementById('trans-categoria');
    const inputDesc = document.getElementById('trans-descricao');
    const inputValor = document.getElementById('trans-valor');

    if (!inputValor || !inputValor.value || parseFloat(inputValor.value) <= 0) {
        alert('⚠️ Por favor, informe um valor válido para o lançamento.');
        return;
    }

    const payload = {
        data_transacao: inputData?.value || new Date().toISOString().split('T'),
        tipo: inputTipo?.value || 'ENTRADA',
        categoria: inputCat?.value || 'Receita - Semanalidade',
        descricao: inputDesc?.value?.trim() || 'Lançamento de Caixa',
        valor: parseFloat(inputValor.value)
    };

    try {
        const response = await fetchComAuth(`${API_BASE}/admin/financeiro/transacoes`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Erro ao gravar transação.');
        }

        alert('✅ Lançamento financeiro registrado com sucesso!');
        if (inputValor) inputValor.value = '';
        if (inputDesc) inputDesc.value = '';

        // Recarrega os indicadores da DRE em tempo real
        await carregarResumoDRE();
    } catch (err) {
        console.error('❌ Erro no salvamento financeiro:', err);
        alert(`❌ Erro: ${err.message}`);
    }
}

// 2. BUSCAR DADOS DA DRE E ATUALIZAR OS CARDS DA TELA
export async function carregarResumoDRE() {
    try {
        const response = await fetchComAuth(`${API_BASE}/admin/financeiro/resumo-dre`);
        if (!response.ok) return;

        const data = await response.json();

        const elFat = document.getElementById('dre-faturamento');
        const elOpex = document.getElementById('dre-opex');
        const elPro = document.getElementById('dre-prolabore');
        const elDiv = document.getElementById('dre-dividas');
        const elSobra = document.getElementById('dre-sobra');
        const elReserva = document.getElementById('dre-reserva');

        if (elFat) elFat.innerText = formatarMoeda(data.faturamentoBruto);
        if (elOpex) elOpex.innerText = formatarMoeda(data.opexTotal);
        if (elPro) elPro.innerText = formatarMoeda(data.proLabore);
        if (elDiv) elDiv.innerText = formatarMoeda(data.dividas);
        if (elSobra) elSobra.innerText = formatarMoeda(data.sobraLiquida);
        if (elReserva) elReserva.innerText = formatarMoeda(data.reservaLiquidaPJ);
    } catch (err) {
        console.error('Erro ao carregar resumo DRE:', err);
    }
}

// 3. SIMULADOR DE EXPANSÃO DE FROTA E CÁLCULO DE PAYBACK
export function calcularSimulacaoExpansao() {
    const precoMoto = parseFloat(document.getElementById('sim-preco-moto')?.value) || 0;
    const aporteSocio = parseFloat(document.getElementById('sim-aporte-socio')?.value) || 0;
    const semanalidade = parseFloat(document.getElementById('sim-semanalidade')?.value) || 0;
    const opexMoto = parseFloat(document.getElementById('sim-opex-moto')?.value) || 0;

    const receitaMensal = semanalidade * 4.333;
    const sobraLiquidaMensal = receitaMensal - opexMoto;

    let paybackMeses = 0;
    if (sobraLiquidaMensal > 0 && aporteSocio > 0) {
        paybackMeses = aporteSocio / sobraLiquidaMensal;
    }

    const elReceita = document.getElementById('sim-res-receita');
    const elSobra = document.getElementById('sim-res-sobra');
    const elPayback = document.getElementById('sim-res-payback');

    if (elReceita) elReceita.innerText = formatarMoeda(receitaMensal) + ' /mês';
    if (elSobra) elSobra.innerText = formatarMoeda(sobraLiquidaMensal) + ' /mês';
    if (elPayback) {
        elPayback.innerText = paybackMeses > 0 
            ? `${paybackMeses.toFixed(1)} Meses (${Math.ceil(paybackMeses * 4.333)} semanas)`
            : '0 Meses';
    }
}

// 4. INICIALIZAÇÃO ÚNICA DO MÓDULO FINANCEIRO
export function initFinanceiro() {
    const inputData = document.getElementById('trans-data');
    if (inputData && !inputData.value) {
        inputData.value = new Date().toISOString().split('T');
    }

    const formTransacao = document.getElementById('form-nova-transacao');
    if (formTransacao) {
        formTransacao.onsubmit = salvarTransacao;
    }

    // Registra os eventos em tempo real do simulador de expansão
    ['sim-preco-moto', 'sim-aporte-socio', 'sim-semanalidade', 'sim-opex-moto'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.oninput = calcularSimulacaoExpansao;
        }
    });

    carregarResumoDRE();
    calcularSimulacaoExpansao();
}

// EXPOSIÇÃO GLOBAL NO WINDOW PARA SUPORTE AO HTML
window.salvarTransacao = salvarTransacao;
window.carregarResumoDRE = carregarResumoDRE;
window.calcularSimulacaoExpansao = calcularSimulacaoExpansao;
window.initFinanceiro = initFinanceiro;