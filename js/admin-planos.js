// ======================================================
// MÓDULO DE PLANOS, PREÇOS E LOJA DE COINS — js/admin-planos.js
// ======================================================

import { API_BASE } from './api.js';
import { fetchComAuth } from './auth.js';

// Auxiliar: Formatação de Moeda em Reais (R$)
function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// ======================================================
// 1. GESTÃO DE PLANOS DE ALUGUEL E PREÇOS POR MODELO
// ======================================================

export async function carregarPlanosAdmin() {
    const grid = document.getElementById('grid-planos') || document.getElementById('grid-planos-admin');
    if (!grid) return;

    grid.innerHTML = '<div class="col-span-full text-center font-bold text-gray-500 py-8">Carregando planos de aluguel...</div>';

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/planos?_t=${Date.now()}`);
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

        const responseData = await res.json();
        const planos = Array.isArray(responseData) ? responseData : (responseData.data || []);

        if (planos.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full bg-white p-8 rounded-2xl text-center shadow-sm text-gray-500 font-bold text-sm uppercase border border-gray-200">
                    <span class="text-3xl block mb-2">🏷️</span>
                    Nenhum plano de aluguel cadastrado no banco de dados.
                </div>`;
            return;
        }

        grid.innerHTML = '';
        planos.forEach(plano => {
            const isRecomendado = plano.is_recomendado || plano.recomendado;
            const jsonPlanoSanitizado = JSON.stringify(plano).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const nomeModelo = plano.modelo_nome || plano.modelo || 'Modelo Padrão';

            grid.innerHTML += `
                <div class="bg-white rounded-2xl shadow-lg border ${isRecomendado ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200'} p-5 flex flex-col justify-between relative overflow-hidden">
                    ${isRecomendado ? `<span class="bg-orange-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl absolute top-0 right-0 tracking-wider">Mais Popular</span>` : ''}

                    <div class="space-y-3">
                        <div class="border-b border-gray-100 pb-3">
                            <span class="text-[10px] font-black uppercase text-orange-600 tracking-wider block">${nomeModelo}</span>
                            <h3 class="font-black text-lg text-gray-900 uppercase mt-0.5 leading-tight">${plano.nome_plano || 'Plano Semanal'}</h3>
                        </div>

                        <div class="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-2">
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-500 font-bold uppercase">Semanalidade:</span>
                                <span class="text-base font-black text-green-600">${formatarMoeda(plano.valor_semanal)}</span>
                            </div>
                            <div class="flex justify-between items-center border-t border-gray-200/60 pt-2">
                                <span class="text-xs text-gray-500 font-bold uppercase">Caução Exigido:</span>
                                <span class="text-xs font-black text-gray-800">${formatarMoeda(plano.valor_caucao || 650)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-2 pt-4 border-t border-gray-100 mt-4">
                        <button type="button" onclick='abrirModalEditarPlano(${jsonPlanoSanitizado})' class="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs uppercase transition shadow-sm">
                            ✏️ Editar
                        </button>
                        <button type="button" onclick="excluirPlano('${plano.id}', '${(plano.nome_plano || 'Plano').replace(/'/g, "\\'")}')" class="bg-red-100 hover:bg-red-200 text-red-600 font-black px-3.5 py-2.5 rounded-xl text-xs uppercase transition">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error('❌ Erro ao carregar planos:', err);
        grid.innerHTML = `
            <div class="col-span-full bg-red-50 border border-red-200 p-6 rounded-2xl text-center text-red-700 font-bold text-sm uppercase">
                ❌ Erro de conexão ao carregar planos.<br>
                <span class="text-xs font-normal text-red-600 block mt-1">${err.message}</span>
            </div>`;
    }
}

export function abrirModalEditarPlano(plano = {}) {
    const modal = document.getElementById('modal-editar-plano');
    if (!modal) return;

    const inputId = document.getElementById('edit-plano-id');
    const inputModelo = document.getElementById('edit-plano-modelo') || document.getElementById('plano-modelo');
    const inputNome = document.getElementById('edit-plano-nome') || document.getElementById('plano-nome');
    const inputValor = document.getElementById('edit-plano-valor-semanal') || document.getElementById('plano-valor');
    const inputCaucao = document.getElementById('edit-plano-valor-caucao') || document.getElementById('plano-caucao');
    const inputRec = document.getElementById('edit-plano-recomendado') || document.getElementById('plano-recomendado');

    if (inputId) inputId.value = plano.id || '';
    if (inputModelo) inputModelo.value = plano.modelo_nome || plano.modelo || '';
    if (inputNome) inputNome.value = plano.nome_plano || '';
    if (inputValor) inputValor.value = plano.valor_semanal || '';
    if (inputCaucao) inputCaucao.value = plano.valor_caucao || 650.00;
    if (inputRec) inputRec.checked = !!(plano.is_recomendado || plano.recomendado);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

export function fecharModalPlano() {
    const modal = document.getElementById('modal-editar-plano');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

export async function salvarEdicaoPlano(e) {
    if (e) e.preventDefault();

    const id = document.getElementById('edit-plano-id')?.value;
    const modelo_nome = (document.getElementById('edit-plano-modelo') || document.getElementById('plano-modelo'))?.value?.trim();
    const nome_plano = (document.getElementById('edit-plano-nome') || document.getElementById('plano-nome'))?.value?.trim();
    const valor_semanal = parseFloat((document.getElementById('edit-plano-valor-semanal') || document.getElementById('plano-valor'))?.value) || 0;
    const valor_caucao = parseFloat((document.getElementById('edit-plano-valor-caucao') || document.getElementById('plano-caucao'))?.value) || 650.00;
    const is_recomendado = (document.getElementById('edit-plano-recomendado') || document.getElementById('plano-recomendado'))?.checked;

    const payload = { modelo_nome, nome_plano, valor_semanal, valor_caucao, is_recomendado };
    const url = id ? `${API_BASE}/admin/planos/${id}` : `${API_BASE}/admin/planos`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const res = await fetchComAuth(url, {
            method: metodo,
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Erro ao salvar plano (${res.status})`);

        alert(id ? '✅ Plano atualizado com sucesso!' : '✅ Novo plano criado com sucesso!');
        fecharModalPlano();
        carregarPlanosAdmin();
    } catch (err) {
        console.error('Erro ao salvar plano:', err);
        alert(`❌ Erro ao salvar plano: ${err.message}`);
    }
}

export async function salvarNovoPlano(e) {
    return salvarEdicaoPlano(e);
}

export async function excluirPlano(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir o plano "${nome}"?`)) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/planos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao excluir plano no servidor');

        alert('✅ Plano excluído com sucesso!');
        carregarPlanosAdmin();
    } catch (err) {
        console.error('Erro ao excluir plano:', err);
        alert(`❌ Erro ao excluir plano: ${err.message}`);
    }
}

// ======================================================
// 2. LOJA DE COINS & REGRAS DE GAMIFICAÇÃO (POP 04)
// ======================================================

export async function carregarConfiguracaoCoinsPix() {
    const inputCoins = document.getElementById('input-coins-pix') || document.getElementById('input-config-coins-pix');
    if (!inputCoins) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/config/coins_por_pix?_t=${Date.now()}`);
        if (res.ok) {
            const data = await res.json();
            inputCoins.value = data.valor || 10;
        }
    } catch (err) {
        console.error('Erro ao carregar regra de coins:', err);
    }
}

export async function salvarConfigCoinsPix(e) {
    if (e) e.preventDefault();

    const inputCoins = document.getElementById('input-coins-pix') || document.getElementById('input-config-coins-pix');
    const valor = parseInt(inputCoins?.value, 10) || 10;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/config`, {
            method: 'POST',
            body: JSON.stringify({ chave: 'coins_por_pix', valor: valor.toString() })
        });

        if (!res.ok) throw new Error('Erro ao salvar configuração');
        alert('✅ Regra de acúmulo de Locafacil Coins atualizada!');
    } catch (err) {
        console.error('Erro ao salvar regra de coins:', err);
        alert(`❌ Erro ao salvar regra: ${err.message}`);
    }
}

export async function carregarItensLojaAdmin() {
    const grid = document.getElementById('grid-itens-loja') || document.getElementById('grid-itens-admin-loja');
    if (!grid) return;

    grid.innerHTML = '<div class="col-span-full text-center font-bold text-gray-500 py-6">Carregando catálogo da loja...</div>';

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/loja?_t=${Date.now()}`);
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

        const responseData = await res.json();
        const itens = Array.isArray(responseData) ? responseData : (responseData.data || []);

        if (itens.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full bg-white p-6 rounded-2xl text-center shadow-sm text-gray-500 font-bold text-xs uppercase border border-gray-200">
                    🎁 Nenhum item/brinde disponível na loja. Adicione o primeiro item acima.
                </div>`;
            return;
        }

        grid.innerHTML = '';
        itens.forEach(item => {
            const tituloSanitizado = (item.titulo || 'Brinde').replace(/'/g, "\\'");

            grid.innerHTML += `
                <div class="bg-gray-50 rounded-2xl border border-gray-200 p-4 flex justify-between items-center shadow-sm">
                    <div>
                        <h4 class="font-black text-sm text-gray-900 uppercase">${item.titulo || 'Brinde'}</h4>
                        <span class="text-xs font-bold text-orange-600 flex items-center gap-1 mt-0.5">
                            🪙 ${item.custo_coins || 0} Coins
                        </span>
                    </div>
                    <button type="button" onclick="excluirItemLoja('${item.id}', '${tituloSanitizado}')" class="bg-red-100 hover:bg-red-200 text-red-600 font-black p-2.5 rounded-xl text-xs transition" title="Excluir item">
                        🗑️
                    </button>
                </div>
            `;
        });
    } catch (err) {
        console.error('❌ Erro ao carregar loja:', err);
        grid.innerHTML = `
            <div class="col-span-full bg-red-50 border border-red-200 p-4 rounded-2xl text-center text-red-700 font-bold text-xs uppercase">
                ❌ Erro ao carregar itens da loja: ${err.message}
            </div>`;
    }
}

export async function adicionarItemLoja(e) {
    if (e) e.preventDefault();

    const inputTitulo = document.getElementById('item-loja-titulo') || document.getElementById('novo-brinde-titulo');
    const inputCusto = document.getElementById('item-loja-custo') || document.getElementById('novo-brinde-custo');

    const titulo = inputTitulo?.value?.trim();
    const custo_coins = parseInt(inputCusto?.value, 10) || 0;

    if (!titulo || custo_coins <= 0) {
        alert('⚠️ Preencha o nome do brinde e uma pontuação válida em Coins.');
        return;
    }

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/loja`, {
            method: 'POST',
            body: JSON.stringify({ titulo, custo_coins })
        });

        if (!res.ok) throw new Error('Erro ao adicionar brinde na loja');

        alert('✅ Brinde adicionado com sucesso!');
        if (inputTitulo) inputTitulo.value = '';
        if (inputCusto) inputCusto.value = '';
        carregarItensLojaAdmin();
    } catch (err) {
        console.error('Erro ao adicionar item:', err);
        alert(`❌ Erro ao adicionar brinde: ${err.message}`);
    }
}

export async function excluirItemLoja(id, titulo) {
    if (!confirm(`Remover o item "${titulo}" da Loja de Coins?`)) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/loja/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao excluir item');

        alert('✅ Item removido da loja!');
        carregarItensLojaAdmin();
    } catch (err) {
        console.error('Erro ao excluir item:', err);
        alert(`❌ Erro ao excluir item: ${err.message}`);
    }
}

// ======================================================
// VÍNCULOS GLOBAIS ÚNICOS NO WINDOW
// ======================================================
window.carregarPlanosAdmin = carregarPlanosAdmin;
window.abrirModalEditarPlano = abrirModalEditarPlano;
window.fecharModalPlano = fecharModalPlano;
window.salvarEdicaoPlano = salvarEdicaoPlano;
window.salvarNovoPlano = salvarNovoPlano;
window.excluirPlano = excluirPlano;

window.carregarConfiguracaoCoinsPix = carregarConfiguracaoCoinsPix;
window.salvarConfigCoinsPix = salvarConfigCoinsPix;
window.carregarItensLojaAdmin = carregarItensLojaAdmin;
window.adicionarItemLoja = adicionarItemLoja;
window.excluirItemLoja = excluirItemLoja;