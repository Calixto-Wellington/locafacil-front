// ======================================================
// MÓDULO DE MOTOS, PÁTIO E TELEMETRIA DE MANUTENÇÃO
// js/admin-motos.js
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
            throw new Error(`Erro HTTP ${res.status}`);
        }
        const data = await res.json();

        if (loading) loading.style.display = 'none';

        if (!data || data.length === 0) {
            grid.innerHTML = `<div class="col-span-full bg-white p-8 rounded-2xl text-center text-gray-500 font-bold text-sm uppercase">Nenhuma moto cadastrada no pátio.</div>`;
            return;
        }

        // Armazena no escopo global para permitir busca por ID no modal de edição
        window.listaMotosGlobal = data;

        data.forEach(item => {
            const id = item.id || item.id_moto || item.uuid || '';
            const marca = item.marca || item.marca_nome || 'N/A';
            const modelo = item.modelo || item.modelo_nome || 'SEM MODELO';
            const placa = item.placa || item.placa_veiculo || 'S/ PLACA';
            const cor = item.cor || 'Preta';
            const km = item.km_atual ?? item.km ?? 0;
            const status = (item.status || 'DISPONIVEL').toUpperCase();

            let badgeStatus = status === 'DISPONIVEL'
                ? '<span class="bg-green-100 text-green-800 text-[11px] font-black px-2.5 py-1 rounded-full uppercase">🟢 Disponível</span>'
                : status === 'ALUGADA'
                ? '<span class="bg-blue-100 text-blue-800 text-[11px] font-black px-2.5 py-1 rounded-full uppercase">🔵 Alugada</span>'
                : '<span class="bg-yellow-100 text-yellow-800 text-[11px] font-black px-2.5 py-1 rounded-full uppercase">🟡 Manutenção</span>';

            let botoesAcao = '';
            if (status === 'DISPONIVEL') {
                botoesAcao = `
                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" onclick="mudarStatusMoto('${id}', 'ALUGADA')" class="bg-blue-600 hover:bg-blue-700 text-white font-black py-2 rounded-xl text-xs uppercase shadow transition">Alugar</button>
                        <button type="button" onclick="mudarStatusMoto('${id}', 'MANUTENCAO')" class="bg-yellow-500 hover:bg-yellow-600 text-black font-black py-2 rounded-xl text-xs uppercase shadow transition">Oficina</button>
                    </div>`;
            } else if (status === 'ALUGADA') {
                botoesAcao = `
                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" onclick="mudarStatusMoto('${id}', 'DISPONIVEL')" class="bg-green-600 hover:bg-green-700 text-white font-black py-2 rounded-xl text-xs uppercase shadow transition">Pátio</button>
                        <button type="button" onclick="mudarStatusMoto('${id}', 'MANUTENCAO')" class="bg-yellow-500 hover:bg-yellow-600 text-black font-black py-2 rounded-xl text-xs uppercase shadow transition">Oficina</button>
                    </div>`;
            } else {
                botoesAcao = `
                    <button type="button" onclick="mudarStatusMoto('${id}', 'DISPONIVEL')" class="w-full bg-green-600 hover:bg-green-700 text-white font-black py-2 rounded-xl text-xs uppercase shadow transition">Liberar p/ Pátio</button>`;
            }

            const imgUrl = item.imagem_url || item.imagem || item.modelos_catalogo?.imagem_url;
            const imgHtml = imgUrl
                ? `<img src="${imgUrl}" class="w-full h-44 object-cover rounded-xl mb-3 border">`
                : `<div class="w-full h-44 bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-gray-400 text-3xl">🏍️</div>`;

            const placaSanitizada = (placa || '').replace(/'/g, "\\'");

            grid.innerHTML += `
                <div class="bg-white rounded-2xl shadow-md border p-4 flex flex-col justify-between">
                    <div>
                        ${imgHtml}
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <span class="text-[10px] font-black uppercase text-orange-600">${marca}</span>
                                <h4 class="font-black text-gray-900 text-base uppercase">${modelo}</h4>
                            </div>
                            ${badgeStatus}
                        </div>

                        <div class="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border mb-3 font-bold text-center">
                            <div>Placa<br><b>${placa}</b></div>
                            <div>Cor<br><b>${cor}</b></div>
                            <div>KM<br><b>${Number(km).toLocaleString('pt-BR')}</b></div>
                        </div>
                    </div>

                    <div class="space-y-2 pt-3 border-t mt-3">
                        ${botoesAcao}
                        <div class="flex gap-2">
                            <button type="button" onclick="abrirModalEditarMoto('${id}')" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-xs uppercase font-bold transition">✏️ Editar Moto</button>
                            <button type="button" onclick="excluirMoto('${id}', '${placaSanitizada}')" class="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-xs uppercase font-bold transition" title="Excluir moto">🗑️</button>
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
// 2. CADASTRAR NOVA MOTO NO PÁTIO (FORMULÁRIO INLINE)
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
    const imagem = document.getElementById('novo-moto-imagem')?.value?.trim() || '';

    if (!marca || !modelo || !placa) {
        alert('⚠️ Marca, Modelo e Placa são campos obrigatórios!');
        return;
    }

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/motos`, {
            method: 'POST',
            body: JSON.stringify({ marca, modelo, cor, ano, placa, km_atual, status, imagem })
        });

        if (res.ok) {
            alert('✅ Moto cadastrada no pátio com sucesso!');
            const form = e?.target || document.querySelector('form[onsubmit*="salvarNovaMoto"]');
            if (form && typeof form.reset === 'function') form.reset();
            carregarMotosFrota();
        } else {
            let errorMsg = `Erro HTTP ${res.status}`;
            try {
                const errData = await res.json();
                errorMsg = errData.error || errorMsg;
            } catch (_) {
                errorMsg = `Falha no servidor (${res.status})`;
            }
            alert(`❌ Erro ao cadastrar moto: ${errorMsg}`);
        }
    } catch (err) {
        console.error('Erro de conexão ao cadastrar moto:', err);
        alert(`❌ Falha na conexão: ${err.message}`);
    }
}

// ======================================================
// 3. ALTERAR STATUS DA MOTO (DISPONÍVEL / ALUGADA / MANUTENÇÃO)
// ======================================================
export async function mudarStatusMoto(id, status) {
    if (!id || id === 'undefined') {
        alert('❌ Erro: ID da moto não identificado.');
        return;
    }

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/motos/${encodeURIComponent(id)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });

        if (res.ok) {
            carregarMotosFrota();
        } else {
            let errorMsg = `Erro HTTP ${res.status}`;
            try {
                const errData = await res.json();
                errorMsg = errData.error || errorMsg;
            } catch (_) {}
            alert(`❌ Erro ao alterar status: ${errorMsg}`);
        }
    } catch (err) {
        console.error('Erro ao mudar status da moto:', err);
        alert(`❌ Falha na conexão: ${err.message}`);
    }
}

// ======================================================
// 4. EXCLUIR MOTO DO PÁTIO
// ======================================================
export async function excluirMoto(id, placa) {
    if (!id || id === 'undefined') {
        alert('❌ Erro: ID da moto não identificado.');
        return;
    }

    if (!confirm(`Tem certeza que deseja excluir a moto de placa ${placa} do inventário?`)) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/motos/${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert(`✅ Moto placa ${placa} removida do pátio.`);
            carregarMotosFrota();
        } else {
            let errorMsg = `Erro HTTP ${res.status}`;
            try {
                const errData = await res.json();
                errorMsg = errData.error || errorMsg;
            } catch (_) {}
            alert(`❌ Erro ao excluir moto: ${errorMsg}`);
        }
    } catch (err) {
        console.error('Erro ao excluir moto:', err);
        alert(`❌ Falha na conexão: ${err.message}`);
    }
}

// ======================================================
// 5. MODAL DE EDIÇÃO E NOVO CADASTRO DE MOTO
// ======================================================
export function abrirModalEditarMoto(motoIdOuObjeto) {
    const modal = document.getElementById('modal-editar-moto');
    if (!modal) return;

    let id = '';
    let item = null;

    if (typeof motoIdOuObjeto === 'string' && motoIdOuObjeto.trim() !== '') {
        id = motoIdOuObjeto.trim();
        item = (window.listaMotosGlobal || []).find(m => (m.id || m.id_moto) === id || m.placa === id) || null;
    } else if (typeof motoIdOuObjeto === 'object' && motoIdOuObjeto !== null) {
        id = motoIdOuObjeto.id || motoIdOuObjeto.id_moto || '';
        item = motoIdOuObjeto;
    }

    if (!id || id === 'undefined') {
        document.getElementById('edit-moto-id').value = '';
        document.getElementById('edit-moto-marca').value = '';
        document.getElementById('edit-moto-modelo').value = '';
        document.getElementById('edit-moto-cor').value = '';
        document.getElementById('edit-moto-ano').value = 2025;
        document.getElementById('edit-moto-placa').value = '';
        document.getElementById('edit-moto-km').value = 0;
        document.getElementById('edit-moto-status').value = 'DISPONIVEL';
    } else {
        const dados = item || {};
        document.getElementById('edit-moto-id').value = id;
        document.getElementById('edit-moto-marca').value = dados.marca || dados.marca_nome || '';
        document.getElementById('edit-moto-modelo').value = dados.modelo || dados.modelo_nome || '';
        document.getElementById('edit-moto-cor').value = dados.cor || '';
        document.getElementById('edit-moto-ano').value = dados.ano || 2025;
        document.getElementById('edit-moto-placa').value = (dados.placa || dados.placa_veiculo || '').toUpperCase();
        document.getElementById('edit-moto-km').value = dados.km_atual ?? dados.km ?? 0;
        document.getElementById('edit-moto-status').value = dados.status || 'DISPONIVEL';
    }

    modal.classList.remove('hidden');
    if (modal.style.display === 'none') modal.style.display = 'flex';
}

export function fecharModalMoto() {
    const modal = document.getElementById('modal-editar-moto');
    if (modal) {
        modal.classList.add('hidden');
        if (modal.style.display !== 'none') modal.style.display = 'none';
    }
}

export async function salvarEdicaoMoto(e) {
    if (e) e.preventDefault();

    const idInput = document.getElementById('edit-moto-id');
    const id = idInput ? idInput.value.trim() : '';

    const marca = document.getElementById('edit-moto-marca')?.value?.trim();
    const modelo = document.getElementById('edit-moto-modelo')?.value?.trim();
    const cor = document.getElementById('edit-moto-cor')?.value?.trim();
    const ano = parseInt(document.getElementById('edit-moto-ano')?.value, 10) || 2025;
    const placa = document.getElementById('edit-moto-placa')?.value?.trim()?.toUpperCase();
    const km_atual = parseInt(document.getElementById('edit-moto-km')?.value, 10) || 0;
    const status = document.getElementById('edit-moto-status')?.value || 'DISPONIVEL';

    if (!marca || !modelo || !placa) {
        alert("⚠️ Marca, Modelo e Placa são campos obrigatórios!");
        return;
    }

    const payload = { marca, modelo, cor, ano, placa, km_atual, status };

    try {
        let res;
        if (id && id !== 'undefined') {
            res = await fetchComAuth(`${API_BASE}/admin/motos/${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetchComAuth(`${API_BASE}/admin/motos`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        if (res.ok) {
            alert(id ? '✅ Dados da moto atualizados com sucesso!' : '✅ Nova moto cadastrada no pátio com sucesso!');
            fecharModalMoto();
            if (typeof carregarMotosFrota === 'function') carregarMotosFrota();
        } else {
            let errorMsg = `Erro HTTP ${res.status}`;
            try {
                const errData = await res.json();
                errorMsg = errData.error || errorMsg;
            } catch (_) {
                errorMsg = `Erro no servidor (${res.status})`;
            }
            alert(`❌ Erro ao salvar moto: ${errorMsg}`);
        }
    } catch (err) {
        console.error('Erro ao salvar moto:', err);
        alert(`❌ Falha na conexão: ${err.message}`);
    }
}

// ======================================================
// 6. TELEMETRIA E BARRAS DE DESGASTE DE PEÇAS
// ======================================================
export function renderizarBarrasDesgasteMotos(kmAtual = 0, componentesDoBanco = [], placa = '') {
    const placaSanitizada = (placa || '').replace(/'/g, "\\'");

    let html = `
        <div class="mt-3 pt-3 border-t border-gray-100">
            <div class="flex justify-between items-center mb-2">
                <span class="text-[11px] font-black uppercase text-indigo-900 tracking-tight flex items-center gap-1">
                    📊 Desgaste de Peças (Telemetria)
                </span>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold text-gray-500 uppercase">KM: ${Number(kmAtual || 0).toLocaleString('pt-BR')}</span>
                    <button type="button" onclick="abrirModalNovaPeca('${placaSanitizada}', ${kmAtual})" class="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-2.5 py-1 rounded-lg uppercase transition shadow flex items-center gap-1" title="Cadastrar nova peça">
                        ➕ Nova Peça
                    </button>
                </div>
            </div>`;

    if (!componentesDoBanco || componentesDoBanco.length === 0) {
        html += `<p class="text-[10px] text-gray-400 font-bold text-center py-2 bg-gray-50 rounded-lg">Nenhum componente cadastrado para telemetria.</p></div>`;
        return html;
    }

    html += `<div class="space-y-2">`;

    componentesDoBanco.forEach(peca => {
        const kmTroca = Number(peca.km_troca || peca.km_ultima_troca || 0);
        const vidaUtil = Number(peca.vida_util_km || peca.intervalo_km || 10000);
        const kmRodadosDesdeTroca = Math.max(0, kmAtual - kmTroca);
        const pctDesgaste = Math.min(100, Math.round((kmRodadosDesdeTroca / vidaUtil) * 100));

        let corBarra = 'bg-green-500';
        let statusTexto = `${pctDesgaste}% gasto (${Math.max(0, vidaUtil - kmRodadosDesdeTroca).toLocaleString('pt-BR')} km restantes)`;
        let corTexto = 'text-green-700';

        if (pctDesgaste >= 90) {
            corBarra = 'bg-red-600';
            statusTexto = `🚨 ${pctDesgaste}% gasto (URGENTE - Trocar agora!)`;
            corTexto = 'text-red-700';
        } else if (pctDesgaste >= 75) {
            corBarra = 'bg-amber-500';
            statusTexto = `⚠️ ${pctDesgaste}% gasto (Trocar em breve)`;
            corTexto = 'text-amber-700';
        }

        const jsonPecaSanitizado = JSON.stringify(peca).replace(/'/g, "&apos;");
        const pecaIdSanitizado = (peca.id || '').replace(/'/g, "\\'");
        const nomeSanitizado = (peca.nome || peca.componente || 'Peça').replace(/'/g, "\\'");

        html += `
            <div class="bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs">
                <div class="flex justify-between items-center mb-1">
                    <span class="font-black text-gray-900 uppercase text-[11px]">${peca.nome || peca.componente || 'Peça'}</span>
                    <span class="text-[10px] font-black ${corTexto}">${statusTexto}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-1.5">
                    <div class="${corBarra} h-full rounded-full transition-all duration-500" style="width: ${pctDesgaste}%"></div>
                </div>
                <div class="flex justify-between items-center text-[10px] text-gray-500 font-bold border-t pt-1 border-gray-100">
                    <span>Troca: ${kmTroca.toLocaleString('pt-BR')} km</span>
                    <div class="flex gap-2">
                        <button type="button" onclick="resetarContadorPeca('${pecaIdSanitizado}', '${nomeSanitizado}', ${kmAtual})" class="text-green-700 hover:text-green-800 font-black flex items-center gap-0.5 hover:underline transition">
                            🔄 Zerar (${Number(kmAtual).toLocaleString('pt-BR')} km)
                        </button>
                        <button type="button" onclick='abrirModalEditarPeca("${placaSanitizada}", ${jsonPecaSanitizado})' class="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 hover:underline transition">
                            ✏️ Editar
                        </button>
                        <button type="button" onclick="excluirPeca('${pecaIdSanitizado}', '${nomeSanitizado}')" class="text-red-600 hover:text-red-800 font-bold flex items-center gap-0.5 hover:underline transition" title="Excluir peça">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>`;
    });

    html += `</div></div>`;
    return html;
}

// ======================================================
// 7. MODAIS E MANUTENÇÃO DE COMPONENTES
// ======================================================
export function abrirModalNovaPeca(placa, kmAtual = 0) {
    const modal = document.getElementById('modal-peca');
    if (!modal) return;

    const elId = document.getElementById('edit-peca-id') || document.getElementById('peca-id');
    const elPlaca = document.getElementById('edit-peca-placa') || document.getElementById('peca-placa');
    const elNome = document.getElementById('edit-peca-nome') || document.getElementById('peca-nome');
    const elKmTroca = document.getElementById('edit-peca-km-troca') || document.getElementById('peca-km-troca');
    const elVidaUtil = document.getElementById('edit-peca-vida-util') || document.getElementById('peca-vida-util');

    if (elId) elId.value = '';
    if (elPlaca) elPlaca.value = placa || '';
    if (elNome) elNome.value = '';
    if (elKmTroca) elKmTroca.value = kmAtual || 0;
    if (elVidaUtil) elVidaUtil.value = 10000;

    modal.classList.remove('hidden');
    if (modal.style.display === 'none') modal.style.display = 'flex';
}

export function abrirModalEditarPeca(placa, pecaObj) {
    const modal = document.getElementById('modal-peca');
    if (!modal) return;

    const peca = (typeof pecaObj === 'object' && pecaObj !== null) ? pecaObj : { id: pecaObj };

    const elId = document.getElementById('edit-peca-id') || document.getElementById('peca-id');
    const elPlaca = document.getElementById('edit-peca-placa') || document.getElementById('peca-placa');
    const elNome = document.getElementById('edit-peca-nome') || document.getElementById('peca-nome');
    const elKmTroca = document.getElementById('edit-peca-km-troca') || document.getElementById('peca-km-troca');
    const elVidaUtil = document.getElementById('edit-peca-vida-util') || document.getElementById('peca-vida-util');

    if (elId) elId.value = peca.id || '';
    if (elPlaca) elPlaca.value = placa || peca.placa || '';
    if (elNome) elNome.value = peca.nome || peca.componente || '';
    if (elKmTroca) elKmTroca.value = peca.km_troca || peca.km_ultima_troca || 0;
    if (elVidaUtil) elVidaUtil.value = peca.vida_util_km || peca.intervalo_km || 10000;

    modal.classList.remove('hidden');
    if (modal.style.display === 'none') modal.style.display = 'flex';
}

export function fecharModalPeca() {
    const modal = document.getElementById('modal-peca');
    if (modal) {
        modal.classList.add('hidden');
        if (modal.style.display !== 'none') modal.style.display = 'none';
    }
}

export async function salvarModalPeca(event) {
    if (event) event.preventDefault();

    const id = (document.getElementById('edit-peca-id') || document.getElementById('peca-id'))?.value?.trim();
    const placa = (document.getElementById('edit-peca-placa') || document.getElementById('peca-placa'))?.value?.trim().toUpperCase();
    const nome = (document.getElementById('edit-peca-nome') || document.getElementById('peca-nome'))?.value?.trim();
    const km_troca = parseInt((document.getElementById('edit-peca-km-troca') || document.getElementById('peca-km-troca'))?.value, 10) || 0;
    const vida_util_km = parseInt((document.getElementById('edit-peca-vida-util') || document.getElementById('peca-vida-util'))?.value, 10) || 10000;

    if (!placa || !nome) {
        alert("⚠️ Placa e Nome da peça são obrigatórios!");
        return;
    }

    const payload = { placa, nome, km_troca, vida_util_km };
    const url = id
        ? `${API_BASE}/admin/manutencao-componentes/${encodeURIComponent(id)}`
        : `${API_BASE}/admin/manutencao-componentes`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const res = await fetchComAuth(url, {
            method: metodo,
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert(id ? "✅ Peça atualizada com sucesso!" : "✅ Nova peça cadastrada!");
            fecharModalPeca();
            if (typeof window.carregarMotosFrota === 'function') window.carregarMotosFrota();
            if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
        } else {
            const errData = await res.json().catch(() => ({}));
            alert(`❌ Erro ao salvar peça: ${errData.error || 'Erro no servidor'}`);
        }
    } catch (err) {
        console.error('Erro ao salvar peça:', err);
        alert('❌ Erro de conexão ao salvar peça.');
    }
}

export async function excluirPeca(id, nomePeca = '') {
    if (!id || id === 'undefined') {
        alert("❌ Erro: ID da peça ausente.");
        return;
    }

    if (!confirm(`Tem certeza que deseja excluir a peça "${nomePeca || 'selecionada'}" da telemetria?`)) {
        return;
    }

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/manutencao-componentes/${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert(`✅ Peça "${nomePeca || 'removida'}" excluída com sucesso!`);
            fecharModalPeca();
            if (typeof window.carregarMotosFrota === 'function') window.carregarMotosFrota();
            if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
        } else {
            const errData = await res.json().catch(() => ({}));
            alert(`❌ Erro ao excluir peça: ${errData.error || 'Erro no servidor'}`);
        }
    } catch (err) {
        console.error('Erro ao excluir peça:', err);
        alert('❌ Erro de conexão ao excluir peça.');
    }
}

export async function resetarContadorPeca(componenteId, nomePeca, kmAtual) {
    if (!componenteId || componenteId === 'undefined') {
        alert("❌ Erro: ID da peça ausente.");
        return;
    }

    if (!confirm(`Deseja registrar a TROCA da peça "${nomePeca}" no KM ${Number(kmAtual).toLocaleString('pt-BR')}? O contador de desgaste será zerado.`)) {
        return;
    }

    const dataHoje = new Date().toISOString().split('T');

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/manutencao-componentes/${encodeURIComponent(componenteId)}/reset`, {
            method: 'PATCH',
            body: JSON.stringify({
                km_troca: kmAtual,
                km_ultima_troca: kmAtual,
                data_troca: dataHoje
            })
        });

        if (res.ok) {
            alert(`✅ Troca da peça "${nomePeca}" registrada no KM ${Number(kmAtual).toLocaleString('pt-BR')}. Contador zerado!`);
            if (typeof window.carregarMotosFrota === 'function') window.carregarMotosFrota();
            if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
        } else {
            alert('❌ Erro ao zerar contador da peça.');
        }
    } catch (err) {
        console.error('Erro ao resetar contador da peça:', err);
        alert('❌ Erro de conexão ao zerar contador.');
    }
}

// ======================================================
// 8. EXPOSIÇÃO EXPLÍCITA NO WINDOW PARA EVENTOS INLINE DO HTML
// ======================================================
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