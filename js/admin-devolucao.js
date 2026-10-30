// ======================================================
// SIMULADOR DE RESCISÃO & DEVOLUÇÃO — js/admin-devolucao.js
// ======================================================

import { API_BASE } from './api.js';
import { fetchComAuth } from './auth.js';

// AUXILIAR: Parse de data no fuso local (evita recuar 1 dia por causa do UTC)
export function parseDataLocal(dataStr) {
    if (!dataStr) return new Date();
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    return new Date(ano, mes - 1, dia); // Meia-noite no fuso local
}

// AUXILIAR: Formata YYYY-MM-DD para DD/MM/YYYY sem deslocamento de fuso
export function formatarDataBR(dataStr) {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
}

// 1. MOTOR DE CÁLCULO DE RESCISÃO REVISADO
export function calcularRescisaoDevolucao(
    dataInicioStr, 
    dataDevolucaoStr, 
    valorSemanal, 
    valorCaucao, 
    valorAvarias = 0, 
    valorMultas = 0, 
    taxaMulta = 0.30
) {
    const dataInicio = parseDataLocal(dataInicioStr);
    const dataDevolucao = parseDataLocal(dataDevolucaoStr);

    // Mínimo contratual de 3 meses a partir do início
    const dataFimMinimo = new Date(dataInicio);
    dataFimMinimo.setMonth(dataFimMinimo.getMonth() + 3);

    const msPorDia = 1000 * 60 * 60 * 24;
    const diasDecorridos = Math.max(0, Math.round((dataDevolucao - dataInicio) / msPorDia));
    const diasRemanescentes = Math.max(0, Math.round((dataFimMinimo - dataDevolucao) / msPorDia));

    const valorDiaria = valorSemanal / 7;
    const valorRemanescenteTotal = diasRemanescentes * valorDiaria;
    const semanasRemanescentes = (diasRemanescentes / 7).toFixed(1);

    // Multa de 30% sobre o saldo remanescente do contrato
    const multaRescisao = diasRemanescentes > 0 ? (valorRemanescenteTotal * taxaMulta) : 0;

    const totalCreditos = valorCaucao;
    const totalDebitos = multaRescisao + valorAvarias + valorMultas;
    const saldoFinal = totalCreditos - totalDebitos;

    return {
        diasDecorridos,
        diasRemanescentes,
        semanasRemanescentes,
        valorRemanescenteTotal,
        multaRescisao,
        totalCreditos,
        totalDebitos,
        saldoFinal,
        cumprimentoMinimoAtingido: diasRemanescentes <= 0
    };
}

// 2. ABRIR MODAL COM DATA ATUAL DO FUSO LOCAL
export function abrirSimuladorDevolucao(locatario = {}) {
    const modal = document.getElementById('modal-devolucao-moto');
    if (!modal) return;

    // Data de hoje em YYYY-MM-DD no fuso local
    const hojeLocal = new Date().toLocaleDateString('sv-SE');

    document.getElementById('dev-locatario-id').value = locatario.id || '';
    document.getElementById('dev-piloto-nome').innerText = locatario.nome || 'Piloto';
    document.getElementById('dev-placa').innerText = locatario.placa || 'PLACA';
    document.getElementById('dev-input-nome').value = locatario.nome || '';
    document.getElementById('dev-input-cpf').value = locatario.cpf || '';
    document.getElementById('dev-input-telefone').value = locatario.telefone || '';
    
    document.getElementById('dev-data-inicio').value = locatario.data_inicio || '2026-09-20';
    document.getElementById('dev-data-devolucao').value = hojeLocal;
    document.getElementById('dev-valor-semanal').value = locatario.valor_semanal || 250;
    document.getElementById('dev-valor-caucao').value = locatario.valor_caucao || 550;
    document.getElementById('dev-avarias').value = 0;
    document.getElementById('dev-multas').value = 0;

    executarCalculoModalDevolucao();

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

export function fecharModalDevolucao() {
    const modal = document.getElementById('modal-devolucao-moto');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// 3. RECALCULAR EM TEMPO REAL
export function executarCalculoModalDevolucao() {
    const dataInicio = document.getElementById('dev-data-inicio').value;
    const dataDevolucao = document.getElementById('dev-data-devolucao').value;
    const valorSemanal = parseFloat(document.getElementById('dev-valor-semanal').value) || 0;
    const valorCaucao = parseFloat(document.getElementById('dev-valor-caucao').value) || 0;
    const valorAvarias = parseFloat(document.getElementById('dev-avarias').value) || 0;
    const valorMultas = parseFloat(document.getElementById('dev-multas').value) || 0;

    if (!dataInicio || !dataDevolucao) return;

    const res = calcularRescisaoDevolucao(dataInicio, dataDevolucao, valorSemanal, valorCaucao, valorAvarias, valorMultas);

    document.getElementById('dev-res-decorrido').innerText = `${res.diasDecorridos} dias`;
    document.getElementById('dev-res-remanescente').innerText = res.cumprimentoMinimoAtingido 
        ? "✅ Período mínimo de 3 meses cumprido!" 
        : `${res.diasRemanescentes} dias (~${res.semanasRemanescentes} sem)`;
        
    document.getElementById('dev-res-multa').innerText = res.multaRescisao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const elSaldo = document.getElementById('dev-res-saldo');
    if (res.saldoFinal >= 0) {
        elSaldo.className = "text-base font-black text-green-600";
        elSaldo.innerText = `Reembolso via PIX (em 60 dias): ${res.saldoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    } else {
        elSaldo.className = "text-base font-black text-red-600";
        elSaldo.innerText = `Saldo Devedor / Retenção: ${Math.abs(res.saldoFinal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    }
}

// 4. DISPARAR MENSAGEM NO WHATSAPP FORMATADA COM QUEBRAS DE LINHA E DATAS CORRETAS
export function enviarSimulacaoWhatsApp() {
    const nome = document.getElementById('dev-input-nome').value;
    const telefone = document.getElementById('dev-input-telefone').value;
    const placa = document.getElementById('dev-placa').innerText;
    
    const dataInicio = document.getElementById('dev-data-inicio').value;
    const dataDevolucao = document.getElementById('dev-data-devolucao').value;
    const valorSemanal = parseFloat(document.getElementById('dev-valor-semanal').value) || 0;
    const valorCaucao = parseFloat(document.getElementById('dev-valor-caucao').value) || 0;
    const valorAvarias = parseFloat(document.getElementById('dev-avarias').value) || 0;
    const valorMultas = parseFloat(document.getElementById('dev-multas').value) || 0;

    const res = calcularRescisaoDevolucao(dataInicio, dataDevolucao, valorSemanal, valorCaucao, valorAvarias, valorMultas);
    const numLimpo = telefone.replace(/\D/g, '');
    const primeiroNome = (nome || '').split(' ')[0].toUpperCase();

    const dataInicioFmt = formatarDataBR(dataInicio);
    const dataDevolucaoFmt = formatarDataBR(dataDevolucao);

    let textoResumoSaldo = '';
    if (res.saldoFinal > 10) {
        textoResumoSaldo = `Como a multa dá ${res.multaRescisao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} e seu caução é de ${valorCaucao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, você tem um saldo a receber de ${res.saldoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (devolvido em até 60 dias via PIX após vistoria final).`;
    } else {
        textoResumoSaldo = `Como a multa contratual dá ${res.multaRescisao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} e você tem ${valorCaucao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de caução conosco, a gente faz a retenção do caução para cobrir a rescisão e zera a diferença, sem você precisar pagar nada a mais de multa no encerramento! 👍`;
    }

    const msg = `Olá ${primeiroNome}, tudo bem?\n\n` +
        `Sobre a sua solicitação para devolver a moto (Placa: ${placa}), fiz a simulação dos valores de encerramento contratual para você avaliar com calma:\n\n` +
        `🗓️ *Período de Uso:*\n` +
        `• Data de Início: ${dataInicioFmt}\n` +
        `• Data Pretendida de Devolução: ${dataDevolucaoFmt}\n` +
        `• Dias Rodados: ${res.diasDecorridos} dias\n` +
        `• Dias Restantes para completar os 3 meses mínimos: ${res.diasRemanescentes} dias (~${res.semanasRemanescentes} semanas)\n\n` +
        `📊 *Cálculo da Simulação:*\n` +
        `• Saldo restante das semanas: ${res.valorRemanescenteTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n` +
        `• Multa de encerramento antecipado (30% das semanas restantes): ${res.multaRescisao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n` +
        `• Caução depositado na entrada: ${valorCaucao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n` +
        `💡 *Como fica o acerto final:*\n` +
        `${textoResumoSaldo}\n\n` +
        `⚠️ *Multas de Trânsito Retroativas:*\n` +
        `Vale lembrar que, se chegar alguma infração referente ao período em que esteve com a moto (a partir de ${dataInicioFmt}), o pagamento e a indicação do condutor continuam sob sua responsabilidade.\n\n` +
        `Dá uma olhada nos números e me avisa se prefere agendar a devolução ou se quer continuar rodando mais um pouco até fechar os 3 meses! 👍`;

    window.open(`https://wa.me/55${numLimpo}?text=${encodeURIComponent(msg)}`, '_blank');
}

// 5. EFETIVAR ENCERRAMENTO DEFINITIVO
export async function efetivarEncerramentoDefinitivo() {
    const id = document.getElementById('dev-locatario-id').value;
    const nome = document.getElementById('dev-piloto-nome').innerText;

    if (!confirm(`⚠️ ATENÇÃO: Deseja EFETIVAR DEFINITIVAMENTE o encerramento do contrato de ${nome}? A moto voltará para o pátio como disponível.`)) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/locatarios/${id}/arquivar`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'ENCERRADO', motivo: 'Devolução / Rescisão Efetuada' })
        });

        if (!res.ok) throw new Error('Erro ao encerrar contrato no banco.');

        alert('✅ Contrato encerrado com sucesso no sistema!');
        fecharModalDevolucao();
        if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
    } catch (err) {
        console.error('Erro ao encerrar contrato:', err);
        alert(`❌ Erro ao encerrar contrato: ${err.message}`);
    }
}

// VÍNCULOS GLOBAIS
window.abrirSimuladorDevolucao = abrirSimuladorDevolucao;
window.fecharModalDevolucao = fecharModalDevolucao;
window.executarCalculoModalDevolucao = executarCalculoModalDevolucao;
window.enviarSimulacaoWhatsApp = enviarSimulacaoWhatsApp;
window.efetivarEncerramentoDefinitivo = efetivarEncerramentoDefinitivo;