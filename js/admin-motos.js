import { API_BASE } from './api.js';
import { fetchComAuth } from './auth.js';

export async function carregarMotosFrota() {
    const grid = document.getElementById('grid-motos');
    const loading = document.getElementById('loading-motos');
    if (!grid) return;
    
    if (loading) loading.style.display = 'block'; 
    grid.innerHTML = '';
    
    try {
        // Tenta buscar no endpoint administrativo com autenticação
        const res = await fetchComAuth(`${API_BASE}/admin/motos`);
        const data = await res.json();
        
        if (loading) loading.style.display = 'none';
        
        if (!data || data.length === 0) { 
            grid.innerHTML = `<div class="col-span-full bg-white p-8 rounded-2xl text-center text-gray-500 font-bold text-sm uppercase">Nenhuma moto cadastrada.</div>`; 
            return; 
        }
        
        data.forEach(item => {
            // Tratamento contra campos indefinidos (fallback para nomes alternativos se existirem)
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
                
            const botoesAcao = status === 'DISPONIVEL' 
                ? `<div class="grid grid-cols-2 gap-2"><button onclick="mudarStatusMoto('${item.id}', 'ALUGADA')" class="bg-blue-600 text-white font-black py-2 rounded-xl text-xs uppercase">Alugar</button><button onclick="mudarStatusMoto('${item.id}', 'MANUTENCAO')" class="bg-yellow-500 text-black font-black py-2 rounded-xl text-xs uppercase">Oficina</button></div>` 
                : status === 'ALUGADA' 
                ? `<div class="grid grid-cols-2 gap-2"><button onclick="mudarStatusMoto('${item.id}', 'DISPONIVEL')" class="bg-green-600 text-white font-black py-2 rounded-xl text-xs uppercase">Pátio</button><button onclick="mudarStatusMoto('${item.id}', 'MANUTENCAO')" class="bg-yellow-500 text-black font-black py-2 rounded-xl text-xs uppercase">Oficina</button></div>` 
                : `<button onclick="mudarStatusMoto('${item.id}', 'DISPONIVEL')" class="w-full bg-green-600 text-white font-black py-2 rounded-xl text-xs uppercase">Liberar p/ Pátio</button>`;
                
            const imgUrl = item.imagem_url || item.imagem || item.modelos_catalogo?.imagem_url;
            const imgHtml = imgUrl 
                ? `<img src="${imgUrl}" class="w-full h-44 object-cover rounded-xl mb-3 border">` 
                : `<div class="w-full h-44 bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-gray-400 text-3xl">🏍️</div>`;
            
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
                        <div class="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border mb-4 font-bold text-center">
                            <div>Placa<br><b>${placa}</b></div>
                            <div>Cor<br><b>${cor}</b></div>
                            <div>KM<br><b>${Number(km).toLocaleString('pt-BR')}</b></div>
                        </div>
                    </div>
                    <div class="space-y-2 pt-2 border-t">
                        ${botoesAcao}
                        <div class="flex gap-2">
                            <button onclick='abrirModalEditarMoto(${JSON.stringify(item)})' class="flex-1 bg-gray-100 py-2 rounded-lg text-xs uppercase font-bold">✏️ Editar</button>
                            <button onclick="excluirMoto('${item.id}', '${placa}')" class="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs uppercase font-bold">🗑️</button>
                        </div>
                    </div>
                </div>`;
        });
    } catch(e) { 
        console.error('Erro ao carregar motos:', e);
        if (loading) loading.style.display = 'none';
    }
}

export async function salvarNovaMoto(e) {
    e.preventDefault();
    await fetchComAuth(`${API_BASE}/admin/motos`, {
        method: 'POST',
        body: JSON.stringify({
            marca: document.getElementById('novo-moto-marca').value, 
            modelo: document.getElementById('novo-moto-modelo').value,
            cor: document.getElementById('novo-moto-cor').value, 
            ano: parseInt(document.getElementById('novo-moto-ano').value) || 2025,
            placa: document.getElementById('novo-moto-placa').value.toUpperCase(), 
            km_atual: parseInt(document.getElementById('novo-moto-km').value) || 0,
            status: document.getElementById('novo-moto-status').value, 
            imagem: document.getElementById('novo-moto-imagem').value
        })
    });
    alert("Moto cadastrada!"); 
    e.target.reset(); 
    carregarMotosFrota();
}

export async function mudarStatusMoto(id, status) {
    await fetchComAuth(`${API_BASE}/admin/motos/${id}/status`, { 
        method: 'PATCH', 
        body: JSON.stringify({ status }) 
    });
    carregarMotosFrota();
}

export async function excluirMoto(id, placa) {
    if (confirm(`Excluir moto placa ${placa}?`)) {
        await fetchComAuth(`${API_BASE}/admin/motos/${id}`, { method: 'DELETE' });
        carregarMotosFrota();
    }
}

export function abrirModalEditarMoto(item) {
    document.getElementById('edit-moto-id').value = item.id;
    document.getElementById('edit-moto-marca').value = item.marca || item.marca_nome || '';
    document.getElementById('edit-moto-modelo').value = item.modelo || item.modelo_nome || '';
    document.getElementById('edit-moto-cor').value = item.cor || '';
    document.getElementById('edit-moto-ano').value = item.ano || 2025;
    document.getElementById('edit-moto-placa').value = item.placa || item.placa_veiculo || '';
    document.getElementById('edit-moto-km').value = item.km_atual ?? item.km ?? 0;
    document.getElementById('edit-moto-status').value = item.status || 'DISPONIVEL';
    document.getElementById('modal-editar-moto').classList.remove('hidden');
}

export function fecharModalMoto() {
    document.getElementById('modal-editar-moto').classList.add('hidden');
}

// ======================================================
// MÓDULO MOTOS E TELEMETRIA DE PEÇAS - js/admin-motos.js
// ======================================================
// ------------------------------------------------------
// HELPERS DE DATA
// ------------------------------------------------------

// Formata data ISO ou YYYY-MM-DD para DD/MM/AAAA
export function formatarDataTroca(dataStr) {
    if (!dataStr) return 'Sem data';
    try {
        if (typeof dataStr === 'string' && dataStr.includes('-')) {
            const partes = dataStr.split('T')[0].split('-');
            if (partes.length === 3) {
                return `${partes[2]}/${partes[1]}/${partes[0]}`;
            }
        }
        const d = new Date(dataStr);
        if (isNaN(d.getTime())) return 'Sem data';
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return 'Sem data';
    }
}

// Converte qualquer data para o formato YYYY-MM-DD exigido pelo <input type="date">
export function obterDataParaInput(dataIso) {
    if (!dataIso) return new Date().toISOString().split('T')[0];
    try {
        if (typeof dataIso === 'string' && dataIso.includes('-')) {
            return dataIso.split('T')[0];
        }
        const d = new Date(dataIso);
        if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
        return d.toISOString().split('T')[0];
    } catch {
        return new Date().toISOString().split('T')[0];
    }
}

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
            limite_km: parseInt(c.limite_km || 8000, 10),
            data_troca_raw: c.updated_at || c.created_at || c.data_troca,
            data_troca: formatarDataTroca(c.updated_at || c.created_at || c.data_troca)
        }));
    } else {
        componentesFinal = listaPadrao.map(p => ({
            id: p.id,
            nome: p.nome,
            km_troca: Math.max(0, kmAtual - p.recuo_padrao),
            limite_km: p.limite_km,
            data_troca_raw: null,
            data_troca: 'Estimado'
        }));
    }

    let html = '<div class="mt-3 p-3 bg-white border border-gray-200 rounded-xl space-y-2.5 shadow-sm">';
    html += `<div class="flex justify-between items-center mb-1">
                <h5 class="text-[10px] font-black uppercase text-gray-500 tracking-wider">📊 Desgaste de Peças (${kmAtual.toLocaleString('pt-BR')} km)</h5>
                <button type="button" onclick="abrirModalNovaPeca('${placa}', ${kmAtual})" class="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded transition flex items-center gap-1">➕ Add Peça</button>
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
        const dataRawStr = peca.data_troca_raw ? `'${peca.data_troca_raw}'` : 'null';

        html += `
            <div class="space-y-1 pt-1.5 border-t border-gray-100 first:border-0 first:pt-0">
                <!-- LINHA 1: NOME DA PEÇA E STATUS -->
                <div class="flex justify-between items-center text-xs font-bold">
                    <span class="text-gray-800 flex items-center gap-1">
                        ${peca.nome}
                        <button type="button" onclick="abrirModalEditarPeca('${placa}', '${peca.id}', '${nomeSanitizado}', ${peca.limite_km}, ${peca.km_troca}, ${dataRawStr})" class="text-[10px] text-gray-400 hover:text-indigo-600 transition" title="Editar peça">✏️</button>
                        <button type="button" onclick="excluirPeca('${placa}', '${peca.id}', '${nomeSanitizado}')" class="text-[10px] text-gray-400 hover:text-red-600 transition" title="Excluir peça">🗑️</button>
                    </span>
                    <span class="text-[10px] ${corTexto}">${badgeStatus}</span>
                </div>

                <!-- LINHA 2: DETALHES DE TROCA, DATA E DURABILIDADE -->
                <div class="flex justify-between items-center text-[10px] text-gray-500 font-semibold px-0.5">
                    <span>📍 Troca: <b class="text-gray-700">${peca.km_troca.toLocaleString('pt-BR')} km</b> <span class="text-gray-400">(${peca.data_troca})</span></span>
                    <span>⏱️ Dura: <b class="text-gray-700">${peca.limite_km.toLocaleString('pt-BR')} km</b></span>
                </div>

                <!-- LINHA 3: BARRA PROGRESSIVA -->
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
// 2. CONTROLE DO MODAL VISUAL
// ------------------------------------------------------

export function abrirModalNovaPeca(placa, kmAtual) {
    const modal = document.getElementById('modal-peca');
    if (!modal) {
        alert('⚠️ O elemento #modal-peca não foi encontrado no HTML.');
        return;
    }

    const hoje = obterDataParaInput();

    if (document.getElementById('modal-peca-titulo')) document.getElementById('modal-peca-titulo').innerText = '➕ Cadastrar Nova Peça';
    if (document.getElementById('modal-peca-subtitulo')) document.getElementById('modal-peca-subtitulo').innerText = `Moto Placa: ${placa || 'Sem placa'}`;
    if (document.getElementById('peca-placa')) document.getElementById('peca-placa').value = placa || '';
    if (document.getElementById('peca-id')) document.getElementById('peca-id').value = '';
    if (document.getElementById('peca-nome')) document.getElementById('peca-nome').value = '';
    if (document.getElementById('peca-limite')) document.getElementById('peca-limite').value = '10000';
    if (document.getElementById('peca-km-troca')) document.getElementById('peca-km-troca').value = kmAtual || 0;
    if (document.getElementById('peca-data-troca')) document.getElementById('peca-data-troca').value = hoje;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

export function abrirModalEditarPeca(placa, componenteId, nomeAtual, limiteAtual, kmTrocaAtual, dataAtual) {
    const modal = document.getElementById('modal-peca');
    if (!modal) {
        alert('⚠️ O elemento #modal-peca não foi encontrado no HTML.');
        return;
    }

    const dataFormatada = obterDataParaInput(dataAtual);

    if (document.getElementById('modal-peca-titulo')) document.getElementById('modal-peca-titulo').innerText = '✏️ Editar Componente';
    if (document.getElementById('modal-peca-subtitulo')) document.getElementById('modal-peca-subtitulo').innerText = `Moto Placa: ${placa || 'Sem placa'}`;
    if (document.getElementById('peca-placa')) document.getElementById('peca-placa').value = placa || '';
    if (document.getElementById('peca-id')) document.getElementById('peca-id').value = componenteId || '';
    if (document.getElementById('peca-nome')) document.getElementById('peca-nome').value = nomeAtual || '';
    if (document.getElementById('peca-limite')) document.getElementById('peca-limite').value = limiteAtual || 8000;
    if (document.getElementById('peca-km-troca')) document.getElementById('peca-km-troca').value = kmTrocaAtual || 0;
    if (document.getElementById('peca-data-troca')) document.getElementById('peca-data-troca').value = dataFormatada;

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

    const elPlaca = document.getElementById('peca-placa');
    const elId = document.getElementById('peca-id');
    const elNome = document.getElementById('peca-nome');
    const elLimite = document.getElementById('peca-limite');
    const elKmTroca = document.getElementById('peca-km-troca');
    const elDataTroca = document.getElementById('peca-data-troca');

    if (!elPlaca || !elNome || !elLimite || !elKmTroca) {
        alert('Erro interno: alguns campos obrigatórios do modal não foram encontrados no HTML.');
        return;
    }

    const placa = elPlaca.value;
    let componenteId = elId ? elId.value : '';
    const nome = elNome.value.trim();
    const limiteNum = parseInt(elLimite.value, 10);
    const kmTrocaNum = parseInt(elKmTroca.value, 10);
    const dataTrocaVal = elDataTroca ? elDataTroca.value : null;

    if (!nome || isNaN(limiteNum) || isNaN(kmTrocaNum)) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

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
                km_troca: kmTrocaNum,
                data_troca: dataTrocaVal
            })
        });

        if (res.ok) {
            fecharModalPeca();
            if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
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

export async function excluirPeca(placa, componenteId, nomePeca) {
    if (!confirm(`Tem certeza que deseja remover a peça "${nomePeca}" da moto ${placa}?`)) return;

    try {
        const res = await fetch(`${API_BASE}/admin/manutencao-componentes`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ placa, componente_id: componenteId })
        });

        if (res.ok) {
            // Recarrega os locatários e a frota para atualizar os cards imediatamente
            if (typeof window.carregarLocatarios === 'function') {
                window.carregarLocatarios();
            }
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao remover: ${errData.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao excluir peça:', err);
        alert('❌ Erro de conexão ao excluir peça.');
    }
}

export async function resetarContadorPeca(placa, componenteIdPadrao, kmAtual) {
    const kmDigitado = prompt(`Digite o KM exato em que a manutenção foi realizada:`, kmAtual);
    if (!kmDigitado) return;

    const kmTrocaReal = parseInt(kmDigitado, 10);
    if (isNaN(kmTrocaReal)) return;

    try {
        const res = await fetch(`${API_BASE}/admin/manutencao-componentes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                placa,
                componente_id: componenteIdPadrao || 'oleo',
                km_troca: kmTrocaReal
            })
        });

        if (res.ok) {
            if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
        }
    } catch (err) {
        console.error('Erro ao resetar peça:', err);
    }
}
// ------------------------------------------------------
// 4. VINCULAÇÃO GLOBAL NO WINDOW
// ------------------------------------------------------
window.formatarDataTroca = formatarDataTroca;
window.obterDataParaInput = obterDataParaInput;
window.renderizarBarrasDesgasteMotos = renderizarBarrasDesgasteMotos;
window.abrirModalNovaPeca = abrirModalNovaPeca;
window.abrirModalEditarPeca = abrirModalEditarPeca;
window.fecharModalPeca = fecharModalPeca;
window.salvarModalPeca = salvarModalPeca;
window.excluirPeca = excluirPeca;
window.resetarContadorPeca = resetarContadorPeca;
window.carregarMotosFrota = carregarMotosFrota;
window.salvarNovaMoto = salvarNovaMoto;
window.mudarStatusMoto = mudarStatusMoto;
window.excluirMoto = excluirMoto;
window.abrirModalEditarMoto = abrirModalEditarMoto;
window.fecharModalMoto = fecharModalMoto;