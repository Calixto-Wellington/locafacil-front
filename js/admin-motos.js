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

            // Sanitização de objeto JSON e strings para injeção segura no HTML
            const jsonSanitizado = JSON.stringify(item).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const placaSanitizada = placa.replace(/'/g, "\\'");

            // Badge visual por status no pátio
            let badgeStatus = '';
            if (status === 'DISPONIVEL') {
                badgeStatus = '<span class="bg-green-100 text-green-800 text-[11px] font-black px-2.5 py-1 rounded-full uppercase border border-green-200">🟢 Disponível</span>';
            } else if (status === 'ALUGADA') {
                badgeStatus = '<span class="bg-blue-100 text-blue-800 text-[11px] font-black px-2.5 py-1 rounded-full uppercase border border-blue-200">🔵 Alugada</span>';
            } else {
                badgeStatus = '<span class="bg-yellow-100 text-yellow-800 text-[11px] font-black px-2.5 py-1 rounded-full uppercase border border-yellow-200">🟡 Manutenção</span>';
            }

            // Ações dinâmicas de mudança de status rápidas
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
            body: JSON.stringify({
                marca,
                modelo,
                cor,
                ano,
                placa,
                km_atual,
                status,
                imagem
            })
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
// 5. MODAL DE EDIÇÃO DE MOTO (ABRIR / FECHAR / SALVAR)
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
// 6. MANUTENÇÃO & COMPONENTES DE OFICINA (TELEMETRIA DE KM)
// ======================================================

// Renderiza as barras visuais de desgaste de cada peça na frota
export function renderizarBarrasDesgasteMotos(kmAtual = 0, componentesDoBanco = [], placa = '') {
    if (!componentesDoBanco || componentesDoBanco.length === 0) {
        return `<div class="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-400 font-bold text-center">Nenhuma peça cadastrada para monitoramento.</div>`;
    }

    let html = `<div class="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2.5 mt-2">
        <div class="flex justify-between items-center text-[10px] font-black uppercase text-gray-500 pb-1 border-b border-gray-200">
            <span>📊 Telemetria de Peças</span>
            <span class="text-orange-600 font-black">KM: ${Number(kmAtual).toLocaleString('pt-BR')}</span>
        </div>`;

    componentesDoBanco.forEach(peca => {
        const limite = peca.limite_km || 5000;
        const kmTroca = peca.km_troca || 0;
        const rodadoDesdeTroca = Math.max(0, kmAtual - kmTroca);
        const pctUso = Math.min(100, Math.round((rodadoDesdeTroca / limite) * 100));

        let corBarra = 'bg-green-500';
        let statusTexto = 'OK';

        if (pctUso >= 90) {
            corBarra = 'bg-red-600 animate-pulse';
            statusTexto = 'Trocar Urgente';
        } else if (pctUso >= 75) {
            corBarra = 'bg-yellow-500';
            statusTexto = 'Trocar em Breve';
        }

        const nomeSanitizado = (peca.nome || '').replace(/'/g, "\\'");

        html += `
            <div class="text-[11px]">
                <div class="flex justify-between font-bold text-gray-700 mb-0.5">
                    <span>${peca.nome}</span>
                    <span class="text-[10px] ${pctUso >= 90 ? 'text-red-600 font-black' : 'text-gray-500'}">${pctUso}% (${statusTexto})</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex items-center">
                    <div class="${corBarra} h-full rounded-full transition-all duration-500" style="width: ${pctUso}%"></div>
                </div>
                <div class="flex justify-between text-[9px] font-bold text-gray-400 mt-1">
                    <button type="button" onclick="resetarContadorPeca('${peca.id}', '${nomeSanitizado}', ${kmAtual})" class="hover:text-green-600 transition flex items-center gap-0.5">🔄 Zerar Troca</button>
                    <button type="button" onclick="abrirModalEditarPeca('${placa}', '${peca.id}', '${nomeSanitizado}', ${limite}, ${kmTroca})" class="hover:text-orange-600 transition flex items-center gap-0.5">✏️ Limite (${limite}km)</button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

export function abrirModalNovaPeca(placa, kmAtual) {
    const modal = document.getElementById('modal-peca');
    if (!modal) return;

    document.getElementById('edit-peca-id').value = '';
    document.getElementById('edit-peca-placa').value = placa || '';
    document.getElementById('edit-peca-nome').value = '';
    document.getElementById('edit-peca-limite').value = '5000';
    document.getElementById('edit-peca-km-troca').value = kmAtual || '0';

    if (document.getElementById('modal-peca-subtitulo')) {
        document.getElementById('modal-peca-subtitulo').innerText = `Moto Placa: ${placa || 'Sem placa'}`;
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

export function abrirModalEditarPeca(placa, componenteId, nomeAtual, limiteAtual, kmTrocaAtual) {
    const modal = document.getElementById('modal-peca');
    if (!modal) return;

    document.getElementById('edit-peca-id').value = componenteId || '';
    document.getElementById('edit-peca-placa').value = placa || '';
    document.getElementById('edit-peca-nome').value = nomeAtual || '';
    document.getElementById('edit-peca-limite').value = limiteAtual || 5000;
    document.getElementById('edit-peca-km-troca').value = kmTrocaAtual || 0;

    if (document.getElementById('modal-peca-subtitulo')) {
        document.getElementById('modal-peca-subtitulo').innerText = `Moto Placa: ${placa || 'Sem placa'}`;
    }

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

    const id = document.getElementById('edit-peca-id').value;
    const placa = document.getElementById('edit-peca-placa').value;
    const nome = document.getElementById('edit-peca-nome').value.trim();
    const limiteNum = parseInt(document.getElementById('edit-peca-limite').value, 10) || 5000;
    const kmTrocaNum = parseInt(document.getElementById('edit-peca-km-troca').value, 10) || 0;

    if (!nome) {
        alert('⚠️ Digite o nome do componente.');
        return;
    }

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/manutencao-componentes`, {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify({
                id: id || undefined,
                placa,
                nome,
                limite_km: limiteNum,
                km_troca: kmTrocaNum
            })
        });

        if (res.ok) {
            alert('✅ Componente salvo com sucesso!');
            fecharModalPeca();
            if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao salvar peça: ${errData.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao salvar peça:', err);
        alert('❌ Erro de conexão.');
    }
}

export async function excluirPeca(id) {
    if (!confirm('Tem certeza que deseja remover este componente de manutenção?')) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/manutencao-componentes/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert('✅ Peça removida com sucesso!');
            fecharModalPeca();
            if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
        } else {
            alert('❌ Erro ao remover componente.');
        }
    } catch (err) {
        console.error('Erro ao excluir peça:', err);
        alert('❌ Erro de conexão.');
    }
}

export async function resetarContadorPeca(componenteId, nomePeca, kmAtual) {
    if (!confirm(`Confirmar a substituição da peça "${nomePeca}" no KM ${kmAtual.toLocaleString('pt-BR')}?`)) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/manutencao-componentes/${componenteId}/reset`, {
            method: 'PATCH',
            body: JSON.stringify({ km_troca: kmAtual })
        });

        if (res.ok) {
            alert(`✅ Troca da peça "${nomePeca}" registrada no KM ${kmAtual.toLocaleString('pt-BR')}. Contador zerado!`);
            if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
        } else {
            alert('❌ Erro ao zerar contador da peça.');
        }
    } catch (err) {
        console.error('Erro ao resetar peça:', err);
        alert('❌ Erro de conexão.');
    }
}

// ======================================================
// VINCULAÇÃO GLOBAL NO WINDOW PARA SUPORTE AOS EVENTOS HTML
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