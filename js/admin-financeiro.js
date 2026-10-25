import { fetchComAuth } from './auth.js';
import { API_BASE } from './api.js';

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

    } catch (err) {
        console.error('❌ Erro no salvamento financeiro:', err);
        alert(`❌ Erro: ${err.message}`);
    }
}

export function initFinanceiro() {
    // 1. Preenche a data de hoje por padrão
    const inputData = document.getElementById('trans-data');
    if (inputData && !inputData.value) {
        inputData.value = new Date().toISOString().split('T');
    }

    // 2. Vincula a função ao evento de envio do formulário
    const formTransacao = document.getElementById('form-nova-transacao');
    if (formTransacao) {
        formTransacao.onsubmit = salvarTransacao;
    }
}