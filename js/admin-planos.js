import { API_BASE } from './api.js';

export async function carregarPlanosAdmin() {
    const grid = document.getElementById('grid-planos-admin');
    const loading = document.getElementById('loading-planos');
    if (!grid) return;
    loading.style.display = 'block'; grid.innerHTML = '';
    try {
        const res = await fetch(`${API_BASE}/admin/planos`);
        const lista = await res.json();
        loading.style.display = 'none';
        if (!lista || lista.length === 0) {
            grid.innerHTML = `<div class="col-span-full bg-white p-8 rounded-2xl text-center text-gray-500 font-bold uppercase">Nenhum plano cadastrado.</div>`;
            return;
        }
        lista.forEach(p => {
            grid.innerHTML += `
                <div class="bg-white rounded-2xl shadow-md border p-4 flex flex-col justify-between">
                    <div>
                        <span class="text-[10px] font-black uppercase text-orange-600 block">${p.modelo_nome}</span>
                        <h4 class="font-black text-gray-900 text-base uppercase mb-2">${p.nome_plano}</h4>
                        <div class="text-xs bg-gray-50 p-3 rounded-xl border space-y-1 font-bold">
                            <p>Semanal: <span class="text-green-600 font-black">R$ ${parseFloat(p.valor_semanal).toFixed(2)}</span></p>
                            <p>Caução: <span class="text-gray-700">R$ ${parseFloat(p.valor_caucao || 1099).toFixed(2)}</span></p>
                            <p>Destaque: ${p.is_recomendado ? '⭐ Sim' : 'Não'}</p>
                        </div>
                    </div>
                    <div class="space-y-2 pt-3 border-t mt-4">
                        <button onclick='abrirModalEditarPlano(${JSON.stringify(p)})' class="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-lg text-xs uppercase">✏️ Editar Plano</button>
                        <button onclick="excluirPlano('${p.id}')" class="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-lg text-xs uppercase">🗑️ Excluir</button>
                    </div>
                </div>`;
        });
    } catch(e) { console.error(e); }
}

export async function salvarNovoPlano(e) {
    e.preventDefault();
    const payload = {
        modelo_nome: document.getElementById('plano-modelo').value.trim(),
        nome_plano: document.getElementById('plano-nome').value.trim(),
        valor_semanal: parseFloat(document.getElementById('plano-valor').value),
        valor_caucao: parseFloat(document.getElementById('plano-caucao').value) || 1099.00,
        is_recomendado: document.getElementById('plano-recomendado').checked
    };
    try {
        const res = await fetch(`${API_BASE}/admin/planos`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error('Erro');
        alert('✅ Plano cadastrado com sucesso!');
        e.target.reset();
        carregarPlanosAdmin();
    } catch(err) { alert('❌ Erro ao cadastrar plano.'); }
}

export async function excluirPlano(id) {
    if(confirm('Tem certeza que deseja excluir este plano?')) {
        await fetch(`${API_BASE}/admin/planos/${id}`, { method: 'DELETE' });
        carregarPlanosAdmin();
    }
}

export function abrirModalEditarPlano(p) {
    document.getElementById('edit-plano-id').value = p.id;
    document.getElementById('edit-plano-modelo').value = p.modelo_nome || '';
    document.getElementById('edit-plano-nome').value = p.nome_plano || '';
    document.getElementById('edit-plano-valor').value = p.valor_semanal || '';
    document.getElementById('edit-plano-caucao').value = p.valor_caucao || 1099.00;
    document.getElementById('edit-plano-recomendado').checked = p.is_recomendado || false;
    document.getElementById('modal-editar-plano').classList.remove('hidden');
}

export function fecharModalPlano() {
    document.getElementById('modal-editar-plano').classList.add('hidden');
}

export async function carregarConfiguracaoCoinsPix() {
    const res = await fetch(`${API_BASE}/admin/config/coins_por_pix`);
    const data = await res.json();
    document.getElementById('input-config-coins-pix').value = data.valor;
}

export async function salvarConfigCoinsPix() {
    await fetch(`${API_BASE}/admin/config`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chave: 'coins_por_pix', valor: document.getElementById('input-config-coins-pix').value }) });
    alert("Salvo com sucesso!");
}

export async function carregarItensLojaAdmin() {
    const res = await fetch(`${API_BASE}/admin/loja`);
    const itens = await res.json();
    const grid = document.getElementById('grid-itens-admin-loja'); grid.innerHTML = '';
    (itens || []).forEach(i => {
        grid.innerHTML += `<div class="bg-white p-4 rounded-xl border flex justify-between items-center"><div><p class="font-black">${i.titulo}</p><p class="text-xs text-amber-700 font-bold">🪙 ${i.custo_coins} Coins</p></div><button onclick="excluirItemLoja('${i.id}')" class="text-red-500 font-bold text-xs uppercase">Excluir</button></div>`;
    });
}