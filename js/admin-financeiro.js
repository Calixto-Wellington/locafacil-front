// js/admin-financeiro.js

export async function salvarTransacao(e) {
    if (e) e.preventDefault(); // 🛑 Trava o recarregamento da página!

    const inputData = document.getElementById('trans-data');
    const inputTipo = document.getElementById('trans-tipo');
    const inputCat = document.getElementById('trans-categoria');
    const inputValor = document.getElementById('trans-valor');

    if (!inputValor || !inputValor.value) {
        alert('Por favor, informe um valor.');
        return;
    }

    const payload = {
        data_transacao: inputData ? inputData.value : new Date().toISOString().split('T')[0],
        tipo: inputTipo ? inputTipo.value : 'ENTRADA',
        categoria: inputCat ? inputCat.value : 'Receita - Semanalidade',
        valor: parseFloat(inputValor.value)
    };

    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

    try {
        const response = await fetch('/api/admin/financeiro/transacoes', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
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
    const inputData = document.getElementById('trans-data');
    if (inputData) {
        inputData.value = new Date().toISOString().split('T')[0];
    }
}