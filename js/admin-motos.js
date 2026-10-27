// ======================================================
// MÓDULO MOTOS E TELEMETRIA DE PEÇAS - js/admin-motos.js
// ======================================================
// ------------------------------------------------------
// 1. RENDERIZADOR VISUAL DE DESGASTE DE PEÇAS
// ------------------------------------------------------
export function renderizarBarrasDesgasteMotos(kmAtual = 0, componentesDoBanco = [], placa = '') {
    const listaPadrao = [
        { id: 'oleo', nome: '🛢️ Troca de Óleo', limite_km: 1000, recuo_padrao: 800 },
        { id: 'pneu_tras', nome: '🛞 Pneu Traseiro', limite_km: 8000, recuo_padrao: 6200 },
        { id: 'pneu_diant', nome: '🛞 Pneu Dianteiro / Freios', limite_km: 10000, recuo_padrao: 4500 },
        { id: 'relacao', nome: '⚙️ Kit Relação', limite_km: 10000, recuo_padrao: 7800 }
    ];

    let componentesFinal = [];

    if (componentesDoBanco && componentesDoBanco.length > 0) {
        componentesFinal = componentesDoBanco.map(c => ({
            id: c.componente_id || c.id,
            nome: c.nome || (listaPadrao.find(p => p.id === (c.componente_id || c.id))?.nome) || (c.componente_id || c.id),
            km_troca: parseInt(c.km_troca || 0, 10),
            limite_km: parseInt(c.limite_km || 8000, 10)
        }));
    } else {
        componentesFinal = listaPadrao.map(p => ({
            id: p.id,
            nome: p.nome,
            km_troca: Math.max(0, kmAtual - p.recuo_padrao),
            limite_km: p.limite_km
        }));
    }

    let html = '<div class="mt-3 p-3 bg-white border border-gray-200 rounded-xl space-y-2 shadow-sm">';
    html += `<div class="flex justify-between items-center mb-1">
                <h5 class="text-[10px] font-black uppercase text-gray-500 tracking-wider">📊 Desgaste de Peças (${kmAtual.toLocaleString('pt-BR')} km)</h5>
                <button onclick="abrirModalNovaPeca('${placa}', ${kmAtual})" class="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded transition flex items-center gap-1">➕ Add Peça</button>
            </div>`;

    componentesFinal.forEach(peca => {
        const kmRodadoComPeca = Math.max(0, kmAtual - peca.km_troca);
        const percentualDesgaste = Math.min(100, Math.round((kmRodadoComPeca / peca.limite_km) * 100));
        const kmRestantes = peca.limite_km - kmRodadoComPeca;

        let corBarra = 'bg-green-500';
        let corTexto = 'text-green-700';
        let badgeStatus = `${percentualDesgaste}% gasto (${kmRestantes.toLocaleString('pt-BR')} km restantes)`;

        if (kmRestantes <= 0) {
            corBarra = 'bg-red-600 animate-pulse';
            corTexto = 'text-red-600 font-black';
            badgeStatus = `🚨 100% GASTO (${Math.abs(kmRestantes).toLocaleString('pt-BR')} km vencidos)`;
        } else if (percentualDesgaste >= 75) {
            corBarra = 'bg-amber-500';
            corTexto = 'text-amber-700 font-bold';
            badgeStatus = `🟡 ${percentualDesgaste}% gasto`;
        }

        const nomeSanitizado = (peca.nome || '').replace(/'/g, "\\'");

        html += `
            <div class="space-y-1 pt-1 border-t border-gray-100 first:border-0 first:pt-0">
                <div class="flex justify-between items-center text-xs font-bold">
                    <span class="text-gray-800 flex items-center gap-1">
                        ${peca.nome}
                        <button onclick="abrirModalEditarPeca('${placa}', '${peca.id}', '${nomeSanitizado}', ${peca.limite_km}, ${peca.km_troca})" class="text-[10px] text-gray-400 hover:text-indigo-600 transition" title="Editar peça">✏️</button>
                        <button onclick="excluirPeca('${placa}', '${peca.id}', '${nomeSanitizado}')" class="text-[10px] text-gray-400 hover:text-red-600 transition" title="Excluir peça">🗑️</button>
                    </span>
                    <span class="text-[10px] ${corTexto}">${badgeStatus}</span>
                </div>
                <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                    <div class="${corBarra} h-full transition-all duration-500" style="width: ${percentualDesgaste}%"></div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

// ------------------------------------------------------
// 2. CONTROLE DO MODAL VISUAL (NOVA PEÇA & EDIÇÃO)
// ------------------------------------------------------

// ➕ ABRIR MODAL PARA CRIAR NOVA PEÇA
export function abrirModalNovaPeca(placa, kmAtual) {
    const modal = document.getElementById('modal-peca');
    if (!modal) return;

    document.getElementById('modal-peca-titulo').innerText = '➕ Cadastrar Nova Peça';
    document.getElementById('modal-peca-subtitulo').innerText = `Moto Placa: ${placa}`;

    document.getElementById('peca-placa').value = placa;
    document.getElementById('peca-id').value = '';
    document.getElementById('peca-nome').value = '';
    document.getElementById('peca-limite').value = '10000';
    document.getElementById('peca-km-troca').value = kmAtual;

    modal.classList.remove('hidden');
}

// ✏️ ABRIR MODAL PARA EDITAR PEÇA EXISTENTE
export function abrirModalEditarPeca(placa, componenteId, nomeAtual, limiteAtual, kmTrocaAtual) {
    const modal = document.getElementById('modal-peca');
    if (!modal) return;

    document.getElementById('modal-peca-titulo').innerText = '✏️ Editar Componente';
    document.getElementById('modal-peca-subtitulo').innerText = `Moto Placa: ${placa}`;

    document.getElementById('peca-placa').value = placa;
    document.getElementById('peca-id').value = componenteId;
    document.getElementById('peca-nome').value = nomeAtual;
    document.getElementById('peca-limite').value = limiteAtual;
    document.getElementById('peca-km-troca').value = kmTrocaAtual;

    modal.classList.remove('hidden');
}

// ❌ FECHAR MODAL
export function fecharModalPeca() {
    const modal = document.getElementById('modal-peca');
    if (modal) modal.classList.add('hidden');
}

// 💾 ENVIAR FORMULÁRIO DO MODAL PARA A API
export async function salvarModalPeca(event) {
    event.preventDefault();

    const placa = document.getElementById('peca-placa').value;
    let componenteId = document.getElementById('peca-id').value;
    const nome = document.getElementById('peca-nome').value.trim();
    const limiteNum = parseInt(document.getElementById('peca-limite').value, 10);
    const kmTrocaNum = parseInt(document.getElementById('peca-km-troca').value, 10);

    if (!nome || isNaN(limiteNum) || isNaN(kmTrocaNum)) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    // Se for peça nova sem ID, gera um identificador seguro
    if (!componenteId) {
        componenteId = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_");
    }

    const btn = document.getElementById('btn-salvar-peca');
    if (btn) { btn.disabled = true; btn.innerText = '⏳ Salvando...'; }

    try {
        const res = await fetch(`${API_BASE}/admin/manutencao-componentes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                placa,
                componente_id: componenteId,
                nome,
                limite_km: limiteNum,
                km_troca: kmTrocaNum
            })
        });

        if (res.ok) {
            fecharModalPeca();
            if (typeof carregarLocatarios === 'function') carregarLocatarios();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao salvar peça: ${errData.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao salvar peça:', err);
        alert('❌ Erro de conexão ao salvar peça.');
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = '💾 Salvar Peça'; }
    }
}

// 🗑️ EXCLUIR PEÇA DA MOTO
export async function excluirPeca(placa, componenteId, nomePeca) {
    if (!confirm(`Tem certeza que deseja remover a peça "${nomePeca}" da moto ${placa}?`)) return;

    try {
        const res = await fetch(`${API_BASE}/admin/manutencao-componentes`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ placa, componente_id: componenteId })
        });

        if (res.ok) {
            if (typeof carregarLocatarios === 'function') carregarLocatarios();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao remover: ${errData.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao excluir peça:', err);
        alert('❌ Erro de conexão ao excluir peça.');
    }
}

// ------------------------------------------------------
// 3. EXPOSIÇÃO GLOBAL NO WINDOW
// ------------------------------------------------------
window.renderizarBarrasDesgasteMotos = renderizarBarrasDesgasteMotos;
window.abrirModalNovaPeca = abrirModalNovaPeca;
window.abrirModalEditarPeca = abrirModalEditarPeca;
window.fecharModalPeca = fecharModalPeca;
window.salvarModalPeca = salvarModalPeca;
window.excluirPeca = excluirPeca;
