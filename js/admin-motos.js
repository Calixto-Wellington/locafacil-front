// ======================================================
// MÓDULO DE MOTOS, PÁTIO E OFICINA — js/admin-motos.js
// ======================================================

import { API_BASE } from './api.js';
import { fetchComAuth } from './auth.js';

// ======================================================
// 1. CARREGAR INVENTÁRIO DE MOTOS DO PÁTIO E FROTA
// ======================================================
export async function carregarMotosFrota() {
    const grid = document.getElementById('grid-motos');
    const loading = document.getElementById('loading-motos');
    if (!grid) return;

    if (loading) loading.style.display = 'block';
    grid.innerHTML = '';

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/motos?_t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) {
            if (loading) loading.style.display = 'none';
            grid.innerHTML = `<div class="col-span-full bg-red-50 p-6 rounded-2xl text-center text-red-600 font-bold text-sm uppercase">Erro ao carregar lista de motos do servidor.</div>`;
            return;
        }

        const data = await res.json();
        if (loading) loading.style.display = 'none';

        if (!data || data.length === 0) {
            grid.innerHTML = `<div class="col-span-full bg-white p-8 rounded-2xl text-center text-gray-500 font-bold text-sm uppercase shadow-sm">Nenhuma moto cadastrada no pátio.</div>`;
            return;
        }

        data.forEach(item => {
            const marca = item.marca || item.marca_nome || 'N/A';
            const modelo = item.modelo || item.modelo_nome || 'SEM MODELO';
            const placa = (item.placa || item.placa_veiculo || 'S/ PLACA').toUpperCase();
            const cor = item.cor || 'Preta';
            const ano = item.ano || 2025;
            const km = item.km_atual ?? item.km ?? 0;
            const status = (item.status || 'DISPONIVEL').toUpperCase();

            const jsonSanitizado = JSON.stringify(item).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const placaSanitizada = placa.replace(/'/g, "\\'");

            let badgeStatus = '';
            if (status === 'DISPONIVEL') {
                badgeStatus = '<span class="bg-green-100 text-green-800 text-[11px] font-black px-2.5 py-1 rounded-full uppercase border border-green-200">🟢 Disponível</span>';
            } else if (status === 'ALUGADA') {
                badgeStatus = '<span class="bg-blue-100 text-blue-800 text-[11px] font-black px-2.5 py-1 rounded-full uppercase border border-blue-200">🔵 Alugada</span>';
            } else {
                badgeStatus = '<span class="bg-yellow-100 text-yellow-800 text-[11px] font-black px-2.5 py-1 rounded-full uppercase border border-yellow-200">🟡 Manutenção</span>';
            }

            let botoesAcao = '';
            if (status === 'DISPONIVEL') {
                botoesAcao = `
                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" onclick="mudarStatusMoto('${item.id}', 'ALUGADA')" class="bg-blue-600 hover:bg-blue-700 text-white font-black py-2 rounded-xl text-xs uppercase shadow transition">Alugar</button>
                        <button type="button" onclick="mudarStatusMoto('${item.id}', 'MANUTENCAO')" class="bg-yellow-500 hover:bg-yellow-600 text-black font-black py-2 rounded-xl text-xs uppercase shadow transition">Oficina</button>
                    </div>`;
            } else if (status === 'ALUGADA') {
                botoesAcao = `
                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" onclick="mudarStatusMoto('${item.id}', 'DISPONIVEL')" class="bg-green-600 hover:bg-green-700 text-white font-black py-2 rounded-xl text-xs uppercase shadow transition">Pátio</button>
                        <button type="button" onclick="mudarStatusMoto('${item.id}', 'MANUTENCAO')" class="bg-yellow-500 hover:bg-yellow-600 text-black font-black py-2 rounded-xl text-xs uppercase shadow transition">Oficina</button>
                    </div>`;
            } else {
                botoesAcao = `
                    <button type="button" onclick="mudarStatusMoto('${item.id}', 'DISPONIVEL')" class="w-full bg-green-600 hover:bg-green-700 text-white font-black py-2 rounded-xl text-xs uppercase shadow transition">Liberar p/ Pátio</button>`;
            }

            const imgUrl = item.imagem_url || item.imagem || item.modelos_catalogo?.imagem_url;
            const imgHtml = imgUrl
                ? `<img src="${imgUrl}" class="w-full h-44 object-cover rounded-xl mb-3 border border-gray-200 shadow-inner">`
                : `<div class="w-full h-44 bg-gray-100 rounded-xl mb-3 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-300">
                    <span class="text-3xl">🏍️</span>
                    <span class="text-[10px] font-bold uppercase mt-1">Sem Imagem</span>
                   </div>`;

            grid.innerHTML += `
                <div class="bg-white rounded-2xl shadow-md border border-gray-200 p-4 flex flex-col justify-between hover:shadow-lg transition">
                    <div>
                        ${imgHtml}
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <span class="text-[10px] font-black uppercase text-orange-600 tracking-wider">${marca} (${ano})</span>
                                <h4 class="font-black text-gray-900 text-base uppercase leading-tight">${modelo}</h4>
                            </div>
                            ${badgeStatus}
                        </div>

                        <div class="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-200 mb-3 font-bold text-center">
                            <div><span class="text-gray-400 block text-[9px] uppercase">Placa</span><b class="text-gray-800">${placa}</b></div>
                            <div><span class="text-gray-400 block text-[9px] uppercase">Cor</span><b class="text-gray-800">${cor}</b></div>
                            <div><span class="text-gray-400 block text-[9px] uppercase">KM Atual</span><b class="text-orange-600">${Number(km).toLocaleString('pt-BR')}</b></div>
                        </div>
                    </div>

                    <div class="space-y-2 pt-2 border-t border-gray-100">
                        ${botoesAcao}
                        <div class="flex gap-2">
                            <button type="button" onclick='abrirModalEditarMoto(${jsonSanitizado})' class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-xs uppercase font-bold transition">✏️ Editar</button>
                            <button type="button" onclick="excluirMoto('${item.id}', '${placaSanitizada}')" class="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-xs uppercase font-bold transition" title="Excluir moto">🗑️</button>
                        </div>
                    </div>
                </div>`;
        });
    } catch (e) {
        console.error('Erro ao carregar motos do pátio:', e);
        if (loading) loading.style.display = 'none';
    }
}

// ======================================================
// 2. CADASTRAR NOVA MOTO NO PÁTIO
// ======================================================
export async function salvarNovaMoto(e) {
    if (e) e.preventDefault();

    const marca = document.getElementById('novo-moto-marca')?.value?.trim();
    const modelo = document.getElementById('novo-moto-modelo')?.value?.trim();
    const cor = document.getElementById('novo-moto-cor')?.value?.trim();
    const ano = parseInt(document.getElementById('novo-moto-ano')?.value, 10) || 2025;
    const placa = document.getElementById('novo-moto-placa')?.value?.trim()?.toUpperCase();
    const km_atual = parseInt(document.getElementById('novo-moto-km')?.value, 10) || 0;
    const status = document.getElementById('novo-moto-status')?.value || 'DISPONIVEL';
    const imagem = document.getElementById('novo-moto-imagem')?.value?.trim();

    if (!marca || !modelo || !placa) {
        alert('⚠️ Preencha os campos obrigatórios (Marca, Modelo e Placa).');
        return;
    }

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/motos`, {
            method: 'POST',
            body: JSON.stringify({ marca, modelo, cor, ano, placa, km_atual, status, imagem })
        });

        if (res.ok) {
            alert('✅ Moto cadastrada no pátio com sucesso!');
            if (e && e.target) e.target.reset();
            carregarMotosFrota();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao cadastrar moto: ${errData.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao salvar nova moto:', err);
        alert('❌ Erro de conexão.');
    }
}

// ======================================================
// 3. ALTERAR STATUS DA MOTO (DISPONÍVEL / ALUGADA / MANUTENÇÃO)
// ======================================================
export async function mudarStatusMoto(id, status) {
    try {
        const res = await fetchComAuth(`${API_BASE}/admin/motos/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });

        if (res.ok) {
            carregarMotosFrota();
        } else {
            const errData = await res.json();
            alert(`❌ Não foi possível alterar o status: ${errData.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao mudar status da moto:', err);
    }
}

// ======================================================
// 4. EXCLUIR MOTO DO PÁTIO
// ======================================================
export async function excluirMoto(id, placa) {
    if (!confirm(`Tem certeza que deseja excluir a moto de placa ${placa} do inventário?`)) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/motos/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert(`✅ Moto placa ${placa} removida do pátio.`);
            carregarMotosFrota();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao excluir moto: ${errData.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao excluir moto:', err);
        alert('❌ Erro de conexão.');
    }
}

// ======================================================
// 5. MODAL DE EDIÇÃO DE MOTO
// ======================================================
export function abrirModalEditarMoto(item) {
    const modal = document.getElementById('modal-editar-moto');
    if (!modal) return;

    document.getElementById('edit-moto-id').value = item.id || '';
    document.getElementById('edit-moto-marca').value = item.marca || item.marca_nome || '';
    document.getElementById('edit-moto-modelo').value = item.modelo || item.modelo_nome || '';
    document.getElementById('edit-moto-cor').value = item.cor || '';
    document.getElementById('edit-moto-ano').value = item.ano || 2025;
    document.getElementById('edit-moto-placa').value = (item.placa || item.placa_veiculo || '').toUpperCase();
    document.getElementById('edit-moto-km').value = item.km_atual ?? item.km ?? 0;
    document.getElementById('edit-moto-status').value = item.status || 'DISPONIVEL';

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

export function fecharModalMoto() {
    const modal = document.getElementById('modal-editar-moto');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

export async function salvarEdicaoMoto(e) {
    if (e) e.preventDefault();

    const id = document.getElementById('edit-moto-id').value;
    const payload = {
        marca: document.getElementById('edit-moto-marca').value.trim(),
        modelo: document.getElementById('edit-moto-modelo').value.trim(),
        cor: document.getElementById('edit-moto-cor').value.trim(),
        ano: parseInt(document.getElementById('edit-moto-ano').value, 10) || 2025,
        placa: document.getElementById('edit-moto-placa').value.trim().toUpperCase(),
        km_atual: parseInt(document.getElementById('edit-moto-km').value, 10) || 0,
        status: document.getElementById('edit-moto-status').value
    };

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/motos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('✅ Dados da moto atualizados com sucesso!');
            fecharModalMoto();
            carregarMotosFrota();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao salvar moto: ${errData.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao salvar edição da moto:', err);
        alert('❌ Erro de conexão.');
    }
}

// ======================================================
// 6. MANUTENÇÃO & TELEMETRIA DE PEÇAS DA OFICINA
// ======================================================

export function renderizarBarrasDesgasteMotos(kmAtual = 0, componentesDoBanco = [], placa = '') {
    const placaSanitizada = (placa || '').replace(/'/g, "\\'");

    let html = `<div class="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3 mt-2 shadow-inner">
        <div class="flex justify-between items-center pb-2 border-b border-gray-200">
            <span class="text-[10px] font-black uppercase text-gray-700 tracking-wider flex items-center gap-1">
                📊 Desgaste de Peças (Telemetria)
            </span>
            <div class="flex items-center gap-2">
                <span class="text-[10px] text-orange-600 font-black">KM: ${Number(kmAtual).toLocaleString('pt-BR')}</span>
                <button type="button" onclick="abrirModalNovaPeca('${placaSanitizada}', ${kmAtual})" class="bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] px-2.5 py-1 rounded-lg uppercase transition shadow flex items-center gap-1" title="Cadastrar nova peça">
                    ➕ Nova Peça
                </button>
            </div>
        </div>`;

    if (!componentesDoBanco || componentesDoBanco.length === 0) {
        html += `<div class="text-[11px] text-gray-400 font-bold text-center py-2">
            Nenhuma peça cadastrada. Clique em <b class="text-orange-600">+ Nova Peça</b> para incluir.
        </div></div>`;
        return html;
    }

    componentesDoBanco.forEach(peca => {
        const limite = peca.limite_km || 5000;
        const kmTroca = peca.km_troca || 0;
        const rodadoDesdeTroca = Math.max(0, kmAtual - kmTroca);
        const pctUso = Math.min(100, Math.round((rodadoDesdeTroca / limite) * 100));

        let dataTrocaStr = '---';
        if (peca.data_troca) {
            const dt = new Date(peca.data_troca.includes('T') ? peca.data_troca : peca.data_troca + 'T00:00:00');
            if (!isNaN(dt.getTime())) {
                dataTrocaStr = dt.toLocaleDateString('pt-BR');
            } else {
                dataTrocaStr = peca.data_troca;
            }
        } else if (peca.created_at) {
            const dt = new Date(peca.created_at);
            if (!isNaN(dt.getTime())) dataTrocaStr = dt.toLocaleDateString('pt-BR');
        }

        let corBarra = 'bg-green-500';
        let statusTexto = 'OK';

        if (pctUso >= 90) {
            corBarra = 'bg-red-600 animate-pulse';
            statusTexto = 'Trocar Urgente';
        } else if (pctUso >= 75) {
            corBarra = 'bg-yellow-500';
            statusTexto = 'Trocar em Breve';
        }

        const nomeSanitizado = (peca.nome || peca.componente_id || 'Componente').replace(/'/g, "\\'");
        const pecaIdSanitizado = (peca.id || '').replace(/'/g, "\\'");
        const jsonPecaSanitizado = JSON.stringify(peca).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

        html += `
            <div class="text-[11px] bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm space-y-1.5">
                <div class="flex justify-between items-center font-bold text-gray-800">
                    <span class="font-black uppercase text-gray-900">${peca.nome || peca.componente_id || 'Peça'}</span>
                    <span class="text-[10px] ${pctUso >= 90 ? 'text-red-600 font-black' : pctUso >= 75 ? 'text-amber-600 font-black' : 'text-green-600 font-bold'}">
                        ${pctUso}% (${statusTexto})
                    </span>
                </div>

                <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200 flex items-center">
                    <div class="${corBarra} h-full rounded-full transition-all duration-500" style="width: ${pctUso}%"></div>
                </div>

                <div class="grid grid-cols-2 gap-1 text-[10px] font-semibold text-gray-500 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                    <div>📍 Trocado com: <b class="text-gray-900">${Number(kmTroca).toLocaleString('pt-BR')} km</b></div>
                    <div>📅 Data: <b class="text-gray-900">${dataTrocaStr}</b></div>
                    <div>⏱️ Rodado: <b class="text-orange-600">${Number(rodadoDesdeTroca).toLocaleString('pt-BR')} km</b></div>
                    <div>🏁 Limite: <b class="text-gray-900">${Number(limite).toLocaleString('pt-BR')} km</b></div>
                </div>

                <div class="flex justify-between items-center text-[10px] font-bold pt-1 border-t border-gray-100">
                    <button type="button" onclick="resetarContadorPeca('${pecaIdSanitizado}', '${nomeSanitizado}', ${kmAtual})" class="text-green-700 hover:text-green-800 font-black flex items-center gap-0.5 hover:underline transition">
                        🔄 Zerar Troca
                    </button>
                    <div class="flex items-center gap-2">
                        <button type="button" onclick='abrirModalEditarPeca("${placaSanitizada}", ${jsonPecaSanitizado})' class="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 hover:underline transition">
                            ✏️ Editar
                        </button>
                        <button type="button" onclick="excluirPeca('${pecaIdSanitizado}', '${nomeSanitizado}')" class="text-red-600 hover:text-red-800 font-bold flex items-center gap-0.5 hover:underline transition" title="Excluir peça">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

export function abrirModalNovaPeca(placa, kmAtual = 0) {
    const modal = document.getElementById('modal-peca');
    if (!modal) return;

    const elId = document.getElementById('edit-peca-id') || document.getElementById('peca-id');
    const elPlaca = document.getElementById('edit-peca-placa') || document.getElementById('peca-placa');
    const elNome = document.getElementById('edit-peca-nome') || document.getElementById('peca-nome');
    const elLimite = document.getElementById('edit-peca-limite') || document.getElementById('peca-limite');
    const elKmTroca = document.getElementById('edit-peca-km-troca') || document.getElementById('peca-km-troca');
    const elDataTroca = document.getElementById('edit-peca-data-troca') || document.getElementById('peca-data-troca');
    const elTitulo = document.getElementById('modal-peca-titulo');
    const elSub = document.getElementById('modal-peca-subtitulo');

    if (elId) elId.value = '';
    if (elPlaca) elPlaca.value = placa || '';
    if (elNome) elNome.value = '';
    if (elLimite) elLimite.value = '5000';
    if (elKmTroca) elKmTroca.value = kmAtual || '0';

    const hoje = new Date().toISOString().split('T');
    if (elDataTroca) elDataTroca.value = hoje;

    if (elTitulo) elTitulo.innerText = '➕ Cadastrar Nova Peça';
    if (elSub) elSub.innerText = `Moto Placa: ${placa || 'Sem placa'}`;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

export function abrirModalEditarPeca(placa, pecaObj) {
    const modal = document.getElementById('modal-peca');
    if (!modal) return;

    const peca = (typeof pecaObj === 'object' && pecaObj !== null) ? pecaObj : { id: pecaObj };

    const elId = document.getElementById('edit-peca-id') || document.getElementById('peca-id');
    const elPlaca = document.getElementById('edit-peca-placa') || document.getElementById('peca-placa');
    const elNome = document.getElementById('edit-peca-nome') || document.getElementById('peca-nome');
    const elLimite = document.getElementById('edit-peca-limite') || document.getElementById('peca-limite');
    const elKmTroca = document.getElementById('edit-peca-km-troca') || document.getElementById('peca-km-troca');
    const elDataTroca = document.getElementById('edit-peca-data-troca') || document.getElementById('peca-data-troca');
    const elTitulo = document.getElementById('modal-peca-titulo');
    const elSub = document.getElementById('modal-peca-subtitulo');

    if (elId) elId.value = peca.id || '';
    if (elPlaca) elPlaca.value = placa || peca.placa || '';
    if (elNome) elNome.value = peca.nome || peca.componente_id || '';
    if (elLimite) elLimite.value = peca.limite_km || 5000;
    if (elKmTroca) elKmTroca.value = peca.km_troca || 0;

    let dataVal = peca.data_troca;
    if (!dataVal && peca.created_at) {
        dataVal = peca.created_at.split('T');
    }
    if (!dataVal) {
        dataVal = new Date().toISOString().split('T');
    } else if (dataVal.includes('T')) {
        dataVal = dataVal.split('T');
    }
    if (elDataTroca) elDataTroca.value = dataVal;

    if (elTitulo) elTitulo.innerText = '✏️ Editar Peça de Manutenção';
    if (elSub) elSub.innerText = `Moto Placa: ${placa || peca.placa || 'Sem placa'}`;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

export function fecharModalPeca() {
    const modal = document.getElementById('modal-peca');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

export async function salvarModalPeca(event) {
    if (event) event.preventDefault();

    const id = (document.getElementById('edit-peca-id') || document.getElementById('peca-id'))?.value;
    const placa = (document.getElementById('edit-peca-placa') || document.getElementById('peca-placa'))?.value;
    const nome = (document.getElementById('edit-peca-nome') || document.getElementById('peca-nome'))?.value?.trim();
    const limiteNum = parseInt((document.getElementById('edit-peca-limite') || document.getElementById('peca-limite'))?.value, 10) || 5000;
    const kmTrocaNum = parseInt((document.getElementById('edit-peca-km-troca') || document.getElementById('peca-km-troca'))?.value, 10) || 0;
    const dataTroca = (document.getElementById('edit-peca-data-troca') || document.getElementById('peca-data-troca'))?.value || new Date().toISOString().split('T');

    if (!nome) {
        alert('⚠️ Digite o nome do componente/peça.');
        return;
    }

    const url = id 
        ? `${API_BASE}/admin/manutencao-componentes/${id}` 
        : `${API_BASE}/admin/manutencao-componentes`;
    
    const metodo = id ? 'PUT' : 'POST';

    try {
        const res = await fetchComAuth(url, {
            method: metodo,
            body: JSON.stringify({
                id: id || undefined,
                placa,
                nome,
                componente_id: nome.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                limite_km: limiteNum,
                km_troca: kmTrocaNum,
                data_troca: dataTroca
            })
        });

        if (res.ok) {
            alert(id ? '✅ Peça atualizada com sucesso!' : '✅ Nova peça cadastrada com sucesso!');
            fecharModalPeca();
            if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
            if (typeof window.carregarMotosFrota === 'function') window.carregarMotosFrota();
        } else {
            const isJson = res.headers.get('content-type')?.includes('application/json');
            const errData = isJson ? await res.json() : null;
            alert(`❌ Erro ao salvar (${res.status}): ${errData?.error || 'Erro ao processar no servidor.'}`);
        }
    } catch (err) {
        console.error('Erro ao salvar peça:', err);
        alert('❌ Erro de conexão ao salvar peça.');
    }
}

export async function excluirPeca(id, nomePeca = '') {
    if (!id) {
        alert('⚠️ ID da peça não informado.');
        return;
    }
    if (!confirm(`Tem certeza que deseja excluir a peça "${nomePeca || 'selecionada'}"?`)) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/manutencao-componentes/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert(`✅ Peça "${nomePeca || 'removida'}" excluída com sucesso!`);
            fecharModalPeca();
            if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
            if (typeof window.carregarMotosFrota === 'function') window.carregarMotosFrota();
        } else {
            const isJson = res.headers.get('content-type')?.includes('application/json');
            const errData = isJson ? await res.json() : null;
            alert(`❌ Erro ao excluir componente: ${errData?.error || 'Erro no servidor'}`);
        }
    } catch (err) {
        console.error('Erro ao excluir peça:', err);
        alert('❌ Erro de conexão ao excluir peça.');
    }
}

export async function resetarContadorPeca(componenteId, nomePeca, kmAtual) {
    const dataHoje = new Date().toISOString().split('T');
    if (!confirm(`Confirmar a substituição da peça "${nomePeca}" no KM ${Number(kmAtual).toLocaleString('pt-BR')} (Data: ${new Date().toLocaleDateString('pt-BR')})?`)) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/manutencao-componentes/${componenteId}/reset`, {
            method: 'PATCH',
            body: JSON.stringify({ 
                km_troca: kmAtual,
                data_troca: dataHoje
            })
        });

        if (res.ok) {
            alert(`✅ Troca da peça "${nomePeca}" registrada no KM ${Number(kmAtual).toLocaleString('pt-BR')}. Contador zerado!`);
            if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
            if (typeof window.carregarMotosFrota === 'function') window.carregarMotosFrota();
        } else {
            alert('❌ Erro ao zerar contador da peça.');
        }
    } catch (err) {
        console.error('Erro ao resetar peça:', err);
        alert('❌ Erro de conexão.');
    }
}

// VINCULAÇÃO GLOBAL NO WINDOW PARA SUPORTE AOS EVENTOS HTML
window.carregarMotosFrota = carregarMotosFrota;
window.salvarNovaMoto = salvarNovaMoto;
window.mudarStatusMoto = mudarStatusMoto;
window.excluirMoto = excluirMoto;
window.abrirModalEditarMoto = abrirModalEditarMoto;
window.fecharModalMoto = fecharModalMoto;
window.salvarEdicaoMoto = salvarEdicaoMoto;

window.renderizarBarrasDesgasteMotos = renderizarBarrasDesgasteMotos;
window.abrirModalNovaPeca = abrirModalNovaPeca;
window.abrirModalEditarPeca = abrirModalEditarPeca;
window.fecharModalPeca = fecharModalPeca;
window.salvarModalPeca = salvarModalPeca;
window.excluirPeca = excluirPeca;
window.resetarContadorPeca = resetarContadorPeca;