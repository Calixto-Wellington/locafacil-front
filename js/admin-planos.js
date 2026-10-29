// ======================================================
// MÓDULO DE PLANOS, PREÇOS E LOJA DE COINS — js/admin-planos.js
// ======================================================

import { API_BASE } from './api.js';
import { fetchComAuth } from './auth.js';

// ------------------------------------------------------
// 1. GESTÃO DE PLANOS & CAUÇÕES DE MOTOS
// ------------------------------------------------------

export async function carregarPlanosAdmin() {
    const grid = document.getElementById('grid-planos-admin');
    const loading = document.getElementById('loading-planos');
    if (!grid) return;
    if (loading) loading.style.display = 'block';
    grid.innerHTML = '';

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/planos`);
        if (!res.ok) return;
        const lista = await res.json();
        if (loading) loading.style.display = 'none';

        if (!lista || lista.length === 0) {
            grid.innerHTML = `<div class="col-span-full bg-white p-8 rounded-2xl text-center text-gray-500 font-bold uppercase shadow-sm">Nenhum plano cadastrado.</div>`;
            return;
        }

        lista.forEach(p => {
            const jsonSanitizado = JSON.stringify(p).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

            grid.innerHTML += `
                <div class="bg-white rounded-2xl shadow-md border p-5 flex flex-col justify-between">
                    <div>
                        <span class="text-[10px] font-black uppercase text-orange-600 block mb-1">${p.modelo_nome || 'Todos os Modelos'}</span>
                        <h4 class="font-black text-gray-900 text-base uppercase mb-3">${p.nome_plano}</h4>
                        <div class="text-xs bg-gray-50 p-3 rounded-xl border space-y-1.5 font-bold text-gray-700">
                            <p class="flex justify-between"><span>Semanal:</span> <span class="text-green-600 font-black">R$ ${parseFloat(p.valor_semanal || 0).toFixed(2)}</span></p>
                            <p class="flex justify-between"><span>Caução:</span> <span class="text-gray-800 font-black">R$ ${parseFloat(p.valor_caucao || 1099).toFixed(2)}</span></p>
                            <p class="flex justify-between"><span>Destaque:</span> <span>${p.is_recomendado ? '⭐ Sim' : 'Não'}</span></p>
                        </div>
                    </div>
                    <div class="space-y-2 pt-4 border-t mt-4">
                        <button type="button" onclick="abrirModalEditarPlano(${jsonSanitizado})" class="w-full bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-lg text-xs uppercase transition">✏️ Editar Plano</button>
                        <button type="button" onclick="excluirPlano('${p.id}')" class="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black py-2.5 rounded-lg text-xs uppercase transition">🗑️ Excluir</button>
                    </div>
                </div>`;
        });
    } catch (e) {
        console.error('Erro ao carregar planos:', e);
        if (loading) loading.style.display = 'none';
    }
}

export async function salvarNovoPlano(e) {
    if (e) e.preventDefault();
    const payload = {
        modelo_nome: document.getElementById('plano-modelo').value.trim(),
        nome_plano: document.getElementById('plano-nome').value.trim(),
        valor_semanal: parseFloat(document.getElementById('plano-valor').value),
        valor_caucao: parseFloat(document.getElementById('plano-caucao').value) || 1099.00,
        is_recomendado: document.getElementById('plano-recomendado').checked
    };

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/planos`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Erro ao salvar plano');

        alert('✅ Plano cadastrado com sucesso!');
        if (e && e.target) e.target.reset();
        carregarPlanosAdmin();
    } catch (err) {
        console.error(err);
        alert('❌ Erro ao cadastrar plano.');
    }
}

export async function excluirPlano(id) {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    try {
        const res = await fetchComAuth(`${API_BASE}/admin/planos/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert('✅ Plano excluído!');
            carregarPlanosAdmin();
        } else {
            alert('❌ Erro ao excluir plano.');
        }
    } catch (err) {
        console.error(err);
    }
}

export function abrirModalEditarPlano(p) {
    const modal = document.getElementById('modal-editar-plano');
    if (!modal) return;

    document.getElementById('edit-plano-id').value = p.id || '';
    document.getElementById('edit-plano-modelo').value = p.modelo_nome || '';
    document.getElementById('edit-plano-nome').value = p.nome_plano || '';
    document.getElementById('edit-plano-valor').value = p.valor_semanal || '';
    document.getElementById('edit-plano-caucao').value = p.valor_caucao || 1099.00;
    document.getElementById('edit-plano-recomendado').checked = p.is_recomendado || false;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

export function fecharModalPlano() {
    const modal = document.getElementById('modal-editar-plano');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

export async function salvarEdicaoPlano(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('edit-plano-id').value;
    const payload = {
        modelo_nome: document.getElementById('edit-plano-modelo').value.trim(),
        nome_plano: document.getElementById('edit-plano-nome').value.trim(),
        valor_semanal: parseFloat(document.getElementById('edit-plano-valor').value),
        valor_caucao: parseFloat(document.getElementById('edit-plano-caucao').value) || 1099.00,
        is_recomendado: document.getElementById('edit-plano-recomendado').checked
    };

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/planos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Erro ao atualizar');

        alert('✅ Plano atualizado com sucesso!');
        fecharModalPlano();
        carregarPlanosAdmin();
    } catch (err) {
        console.error(err);
        alert('❌ Erro ao atualizar o plano.');
    }
}


// ------------------------------------------------------
// 2. CONFIGURAÇÃO DE COINS POR PIX & LOJA DE BRINDES
// ------------------------------------------------------

export async function carregarConfiguracaoCoinsPix() {
    try {
        const res = await fetchComAuth(`${API_BASE}/admin/config/coins_por_pix`);
        if (!res.ok) return;
        const data = await res.json();
        const input = document.getElementById('input-config-coins-pix');
        if (input && data && data.valor) {
            input.value = data.valor;
        }
    } catch (err) {
        console.error('Erro ao carregar config de coins:', err);
    }
}

export async function salvarConfigCoinsPix() {
    const input = document.getElementById('input-config-coins-pix');
    const valor = input ? input.value : '10';

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/config`, {
            method: 'POST',
            body: JSON.stringify({ chave: 'coins_por_pix', valor })
        });

        if (res.ok) {
            alert('✅ Regra de Coins por Pix atualizada com sucesso!');
        } else {
            alert('❌ Erro ao salvar regra.');
        }
    } catch (err) {
        console.error(err);
        alert('❌ Erro de conexão.');
    }
}

export async function carregarItensLojaAdmin() {
    const grid = document.getElementById('grid-itens-admin-loja');
    if (!grid) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/loja`);
        if (!res.ok) return;
        const itens = await res.json();

        grid.innerHTML = '';
        if (!itens || itens.length === 0) {
            grid.innerHTML = `<p class="text-center text-gray-500 font-bold col-span-full">Nenhum item cadastrado na loja.</p>`;
            return;
        }

        itens.forEach(i => {
            grid.innerHTML += `
                <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                    <div>
                        <p class="font-black text-gray-900 text-sm uppercase">${i.titulo}</p>
                        <p class="text-xs text-amber-700 font-black mt-0.5">🪙 ${i.custo_coins} Coins</p>
                    </div>
                    <button type="button" onclick="excluirItemLoja('${i.id}')" class="bg-red-50 hover:bg-red-100 text-red-600 font-black px-3 py-1.5 rounded-lg text-xs uppercase transition">
                        🗑️ Excluir
                    </button>
                </div>
            `;
        });
    } catch (err) {
        console.error('Erro ao carregar itens da loja:', err);
    }
}

export async function adicionarItemLoja(e) {
    if (e) e.preventDefault();
    const titulo = document.getElementById('novo-brinde-titulo')?.value?.trim();
    const custo = parseInt(document.getElementById('novo-brinde-custo')?.value || '100', 10);

    if (!titulo) return alert('⚠️ Digite o nome do brinde.');

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/loja`, {
            method: 'POST',
            body: JSON.stringify({ titulo, custo_coins: custo })
        });

        if (res.ok) {
            alert('✅ Brinde adicionado à loja!');
            if (document.getElementById('novo-brinde-titulo')) document.getElementById('novo-brinde-titulo').value = '';
            if (document.getElementById('novo-brinde-custo')) document.getElementById('novo-brinde-custo').value = '';
            carregarItensLojaAdmin();
        } else {
            alert('❌ Erro ao adicionar brinde.');
        }
    } catch (err) {
        console.error(err);
        alert('❌ Erro de conexão.');
    }
}

export async function excluirItemLoja(id) {
    if (!confirm('Tem certeza que deseja remover este item da loja?')) return;
    try {
        const res = await fetchComAuth(`${API_BASE}/admin/loja/${id}`, { method: 'DELETE' });
        if (res.ok) {
            carregarItensLojaAdmin();
        } else {
            alert('❌ Erro ao remover item.');
        }
    } catch (err) {
        console.error(err);
    }
}

// VINCULAÇÃO GLOBAL PARA EVENTOS HTML
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