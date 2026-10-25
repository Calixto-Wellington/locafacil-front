// Preenche a data de hoje por padrão ao carregar
document.addEventListener('DOMContentLoaded', () => {
    const inputData = document.getElementById('trans-data');
    if (inputData) inputData.value = new Date().toISOString().split('T')[0];
});

async function salvarTransacao(e) {
    e.preventDefault();
    
    const payload = {
        data_transacao: document.getElementById('trans-data').value,
        tipo: document.getElementById('trans-tipo').value,
        categoria: document.getElementById('trans-categoria').value,
        valor: parseFloat(document.getElementById('trans-valor').value)
    };

    try {
        const response = await fetch('/api/admin/financeiro/transacoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Erro ao salvar');

        alert('✅ Lançamento registrado no caixa com sucesso!');
        document.getElementById('trans-valor').value = '';
    } catch (err) {
        alert(`❌ Erro: ${err.message}`);
    }
}