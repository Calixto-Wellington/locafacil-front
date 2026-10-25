import { fetchComAuth } from './auth.js';
import { API_BASE } from './api.js';

// Função para formatar valores no padrão R$ 0,00
function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 1. REGISTRAR NOVA TRANSAÇÃO NO CAIXA
export async function salvarTransacao(e) {
    if (e) e.preventDefault(); // 🛑 Impede o recarregamento da página!

    const inputData = document.getElementById('trans-data');
    const inputTipo = document.getElementById('trans-tipo');
    const inputCat = document.getElementById('trans-categoria');
    const inputValor = document.getElementById('trans-valor');

    if (!inputValor || !inputValor.value || parseFloat(inputValor.value) <= 0) {
        alert('Por favor, informe um valor válido.');
        return;
    }

    const payload = {
        data_transacao: inputData && inputData.value ? inputData.value : new Date().toISOString().split('T'),
        tipo: inputTipo ? inputTipo.value : 'ENTRADA',
        categoria: inputCat ? inputCat.value : 'Receita - Semanalidade',
        valor: parseFloat(inputValor.value)
    };

    try {
        const response = await fetchComAuth(`${API_BASE}/admin/financeiro/transacoes`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Erro ao gravar transação no banco');
        }

        alert('✅ Lançamento registrado no caixa com sucesso!');
        inputValor.value = '';

        // Recarrega a DRE atualizada na hora após salvar
        await carregarResumoDRE();

    } catch (err) {
        console.error('❌ Erro no salvamento financeiro:', err);
        alert(`❌ Erro: ${err.message}`);
    }
}

// 2. BUSCA OS DADOS DA DRE E ATUALIZA O CARD NA TELA
export async function carregarResumoDRE() {
    try {
        const response = await fetchComAuth(`${API_BASE}/admin/financeiro/resumo-dre`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        const elFat = document.getElementById('dre-faturamento');
        const elOpex = document.getElementById('dre-opex');
        const elDividas = document.getElementById('dre-dividas');
        const elProlabore = document.getElementById('dre-prolabore');
        const elReserva = document.getElementById('dre-reserva-pj');

        if (elFat) elFat.innerText = formatarMoeda(data.faturamentoBruto);
        if (elOpex) elOpex.innerText = formatarMoeda(data.opexTotal);
        if (elDividas) elDividas.innerText = formatarMoeda(data.dividasCapital);
        if (elProlabore) elProlabore.innerText = formatarMoeda(data.proLabore);
        if (elReserva) elReserva.innerText = `${formatarMoeda(data.reservaLiquidaPJ)} /mês`;

    } catch (err) {
        console.error('Erro ao carregar resumo DRE:', err);
    }
}

// 3. SIMULADOR DE EXPANSÃO DE FROTA (PASSO 4)
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

    if (elReceita) elReceita.innerText = receitaMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + ' /mês';
    if (elSobra) elSobra.innerText = sobraLiquidaMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + ' /mês';
    if (elPayback) elPayback.innerText = paybackMeses > 0 ? `${paybackMeses.toFixed(1)} Meses (${Math.ceil(paybackMeses * 4.333)} semanas)` : '0 Meses';
}

// 4. INICIALIZADOR ÚNICO DO MÓDULO FINANCEIRO
export function initFinanceiro() {
    // Data de hoje por padrão
    const inputData = document.getElementById('trans-data');
    if (inputData && !inputData.value) {
        inputData.value = new Date().toISOString().split('T');
    }

    // Vincula a função ao formulário
    const formTransacao = document.getElementById('form-nova-transacao');
    if (formTransacao) {
        formTransacao.onsubmit = salvarTransacao;
    }

    // Carrega o resumo dinâmico da DRE
    carregarResumoDRE();

    // Roda o cálculo inicial do simulador se ele existir na tela
    calcularSimulacaoExpansao();
}