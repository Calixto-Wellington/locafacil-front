// ======================================================
// MÓDULO DE LOCATÁRIOS / FROTA - js/admin-locatarios.js
// ======================================================

import { API_BASE } from './api.js';
import { fetchComAuth } from './auth.js';

// 1. CARREGAR LOCATÁRIOS COM FILTRO DE STATUS
export async function carregarLocatarios() {
    const loading = document.getElementById('loading-frota');
    const grid = document.getElementById('grid-frota');
    const filtroStatus = document.getElementById('filtro-status-frota')?.value || 'ATIVO';

    if (loading) loading.style.display = 'block';
    if (grid) grid.innerHTML = '';

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/locatarios?status=${filtroStatus}&_t=${Date.now()}`, {
            cache: 'no-store'
        });
        if (!res.ok) return;
        const lista = await res.json();

        if (loading) loading.style.display = 'none';
        renderizarFrota(lista || []);
    } catch (err) {
        console.error('Erro ao carregar locatários:', err);
        if (loading) loading.style.display = 'none';
    }
}

// 2. BUSCA POR NOME / PLACA / CPF
export async function buscarLocatario() {
    const termo = document.getElementById('input-busca-frota')?.value?.trim() || '';
    if (!termo) return carregarLocatarios();

    const loading = document.getElementById('loading-frota');
    const grid = document.getElementById('grid-frota');

    if (loading) loading.style.display = 'block';
    if (grid) grid.innerHTML = '';

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/locatarios?busca=${encodeURIComponent(termo)}&_t=${Date.now()}`);
        if (!res.ok) return;
        const lista = await res.json();

        if (loading) loading.style.display = 'none';
        renderizarFrota(lista || []);
    } catch (err) {
        console.error('Erro na busca de locatários:', err);
        if (loading) loading.style.display = 'none';
    }
}

// 3. ARQUIVAR LOCATÁRIO
export async function arquivarLocatario(id, nome, placa) {
    const motivo = prompt(`Deseja arquivar o contrato de ${nome} (Placa: ${placa})?\n\nDigite o motivo (a moto será liberada no pátio automaticamente):`, 'Devolução de veículo / Encerramento de contrato');
    if (motivo === null) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/locatarios/${id}/arquivar`, {
            method: 'PATCH',
            body: JSON.stringify({ motivo })
        });

        if (res.ok) {
            alert(`📦 Piloto ${nome} arquivado com sucesso e moto ${placa} liberada no pátio!`);
            carregarLocatarios();
            if (typeof window.carregarMotosFrota === 'function') window.carregarMotosFrota();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao arquivar: ${errData.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao arquivar locatário:', err);
        alert('❌ Erro de conexão.');
    }
}

// 4. REATIVAR LOCATÁRIO
export async function reativarLocatario(id, nome) {
    if (!confirm(`Deseja reativar o contrato de ${nome}?`)) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/locatarios/${id}/reativar`, {
            method: 'PATCH'
        });

        if (res.ok) {
            alert(`✅ Contrato de ${nome} reativado!`);
            carregarLocatarios();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao reativar: ${errData.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao reativar locatário:', err);
    }
}

// 5. BAIXAR +1 SEMANA (PIX)
export async function adicionarUmaSemana(id, placa, telefone, nome, semanasAtuais) {
    if (!confirm(`Confirmar baixa de +1 semana paga para ${nome} (Placa: ${placa})?`)) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/locatarios/${id}/pagamento`, {
            method: 'POST',
            body: JSON.stringify({ semanas: 1 })
        });

        if (res.ok) {
            carregarLocatarios();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao registrar pagamento: ${errData.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao adicionar semana:', err);
    }
}

// 6. MODAL EDITAR LOCATÁRIO
export function abrirModalEditar(locatario) {
    const modal = document.getElementById('modal-locatario');
    if (!modal) return;

    document.getElementById('edit-id').value = locatario.id || '';
    document.getElementById('edit-nome').value = locatario.nome || '';
    document.getElementById('edit-cpf').value = locatario.cpf || '';
    document.getElementById('edit-telefone').value = locatario.telefone || '';
    document.getElementById('edit-placa').value = locatario.placa || '';
    document.getElementById('edit-modelo').value = locatario.modelo || '';
    document.getElementById('edit-semanas').value = locatario.semanas_pagas || 0;
    document.getElementById('edit-km').value = locatario.km_atual || 0;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

export function fecharModal() {
    const modal = document.getElementById('modal-locatario');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// 7. RENDERIZAÇÃO DOS CARDS DA FROTA
function renderizarFrota(lista) {
    const grid = document.getElementById('grid-frota');
    if (!grid) return;

    grid.innerHTML = '';
    if (!lista || lista.length === 0) {
        grid.innerHTML = `<div class="col-span-full bg-white p-8 rounded-2xl text-center text-gray-500 font-bold text-base uppercase shadow-sm">Nenhum piloto encontrado nesta visualização.</div>`;
        return;
    }

    lista.forEach(item => {
        const isArquivado = item.status === 'ARQUIVADO';
        const semanasPagas = parseInt(item.semanas_pagas || 0, 10);
        const pct = Math.min(100, Math.round((semanasPagas / 182) * 100));
        
        // Evita quebra de sintaxe no JSON no atributo onclick
        const jsonSanitizado = JSON.stringify(item).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const nomeSanitizado = (item.nome || '').replace(/'/g, "\\'");

        const botaoAcaoPrincipal = isArquivado ? `
            <button type="button" onclick="reativarLocatario('${item.id}', '${nomeSanitizado}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl transition uppercase text-xs shadow-md">
                🔄 Reativar Contrato
            </button>
        ` : `
            <button type="button" onclick="adicionarUmaSemana('${item.id}', '${item.placa || ''}', '${item.telefone || ''}', '${nomeSanitizado}', ${semanasPagas})" class="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition uppercase text-xs shadow-md">
                💵 +1 Semana (Baixar Pix)
            </button>
        `;

        grid.innerHTML += `
            <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col justify-between ${isArquivado ? 'opacity-75 border-red-200' : ''}">
                <div>
                    <!-- CABEÇALHO DO CARD -->
                    <div class="bg-gray-900 text-white p-4 flex justify-between items-center">
                        <div>
                            <span class="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">${item.placa || 'Sem Placa'}</span>
                            <h3 class="font-black text-lg uppercase mt-1 leading-tight">${item.nome || 'Sem Nome'}</h3>
                        </div>
                        <!-- EXIBIÇÃO DA SEMANA PAGA E PORCENTAGEM -->
                        <div class="text-right">
                            ${isArquivado 
                                ? '<span class="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase">📦 Arquivado</span>' 
                                : `<div class="text-right">
                                    <span class="text-xl font-black text-orange-500 block leading-none">Semana ${semanasPagas}</span>
                                    <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${semanasPagas}/182 sem (${pct}%)</span>
                                   </div>`
                            }
                        </div>
                    </div>

                    <div class="p-5 space-y-3">
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <div><p class="text-gray-400 font-bold uppercase">Modelo</p><p class="font-bold text-gray-800">${item.modelo || 'N/A'}</p></div>
                            <div><p class="text-gray-400 font-bold uppercase">WhatsApp</p><p class="font-bold text-gray-800">${item.telefone || 'N/A'}</p></div>
                        </div>

                        ${isArquivado ? `
                            <div class="bg-red-50 border border-red-200 p-3 rounded-xl text-xs">
                                <p class="text-red-700 font-black uppercase">Motivo Encerramento:</p>
                                <p class="text-gray-700 font-semibold mt-0.5">${item.motivo_arquivamento || 'Não detalhado'}</p>
                            </div>
                        ` : ''}

                        <!-- TELEMETRIA DE PEÇAS DE MANUTENÇÃO -->
                        ${window.renderizarBarrasDesgasteMotos ? window.renderizarBarrasDesgasteMotos(item.km_atual || 0, item.componentes, item.placa) : ''}
                    </div>
                </div>

                <!-- BOTÕES DE AÇÃO -->
                <div class="p-5 pt-0 space-y-2">
                    ${botaoAcaoPrincipal}

                    <div class="flex gap-2">
                        <button type="button" onclick="abrirModalEditar(${jsonSanitizado})" class="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-lg text-xs uppercase transition">
                            ✏️ Editar
                        </button>
                        ${!isArquivado ? `
                            <button type="button" onclick="arquivarLocatario('${item.id}', '${nomeSanitizado}', '${item.placa || ''}')" class="bg-red-100 hover:bg-red-200 text-red-600 font-black px-3 py-2.5 rounded-lg text-xs uppercase transition" title="Arquivar contrato">
                                📦 Arquivar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
}

// VINCULAÇÃO GLOBAL NO WINDOW
window.carregarLocatarios = carregarLocatarios;
window.buscarLocatario = buscarLocatario;
window.arquivarLocatario = arquivarLocatario;
window.reativarLocatario = reativarLocatario;
window.adicionarUmaSemana = adicionarUmaSemana;
window.abrirModalEditar = abrirModalEditar;
window.fecharModal = fecharModal;