// ======================================================
// MÓDULO DE LOCATÁRIOS / FROTA — js/admin-locatarios.js
// ======================================================

import { API_BASE } from './api.js';
import { fetchComAuth } from './auth.js';

window.dadosCSVImportacao = [];

// ======================================================
// 1. CARREGAR LOCATÁRIOS COM FILTRO DE STATUS
// ======================================================
export async function carregarLocatarios() {
    const loading = document.getElementById('loading-frota');
    const grid = document.getElementById('grid-frota');
    const selectStatus = document.getElementById('filtro-status-frota');
    const filtroStatus = selectStatus ? selectStatus.value : 'ATIVO';

    if (loading) loading.style.display = 'block';
    if (grid) grid.innerHTML = '';

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/locatarios?status=${filtroStatus}&_t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const responseData = await res.json();
        const lista = Array.isArray(responseData) ? responseData : (responseData.data || []);

        if (loading) loading.style.display = 'none';
        renderizarFrota(lista);
    } catch (err) {
        console.error('Erro ao carregar locatários:', err);
        if (loading) loading.style.display = 'none';
        if (grid) {
            grid.innerHTML = `<div class="col-span-full bg-red-50 p-6 rounded-2xl text-center text-red-600 font-bold uppercase text-xs">Erro ao carregar lista de pilotos: ${err.message}</div>`;
        }
    }
}

// ======================================================
// 2. BUSCA RÁPIDA DE PILOTOS
// ======================================================
export async function buscarLocatario() {
    const termo = document.getElementById('input-busca-frota')?.value?.trim() || '';
    if (!termo) return carregarLocatarios();

    const loading = document.getElementById('loading-frota');
    const grid = document.getElementById('grid-frota');

    if (loading) loading.style.display = 'block';
    if (grid) grid.innerHTML = '';

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/locatarios?busca=${encodeURIComponent(termo)}&_t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const responseData = await res.json();
        const lista = Array.isArray(responseData) ? responseData : (responseData.data || []);

        if (loading) loading.style.display = 'none';
        renderizarFrota(lista);
    } catch (err) {
        console.error('Erro na busca de locatário:', err);
        if (loading) loading.style.display = 'none';
    }
}

// ======================================================
// 3. ARQUIVAR CONTRATO
// ======================================================
export async function arquivarLocatario(id, nome, placa) {
    const motivo = prompt(`Digite o motivo do arquivamento/encerramento do contrato de ${nome} (${placa}):`, "Devolução amigável");
    if (motivo === null) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/locatarios/${id}/arquivar`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'ARQUIVADO', motivo_recusa: motivo })
        });

        if (res.ok) {
            alert(`📦 Contrato de ${nome} arquivado com sucesso! A moto foi liberada para o pátio.`);
            carregarLocatarios();
            if (typeof window.carregarMotosFrota === 'function') window.carregarMotosFrota();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao arquivar: ${errData.error || 'Falha no servidor'}`);
        }
    } catch (err) {
        console.error('Erro ao arquivar:', err);
        alert(`❌ Erro inesperado: ${err.message}`);
    }
}

// ======================================================
// 4. REATIVAR CONTRATO
// ======================================================
export async function reativarLocatario(id, nome) {
    if (!confirm(`Deseja REATIVAR o contrato de ${nome} na frota ativa?`)) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/locatarios/${id}/arquivar`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'ATIVO' })
        });

        if (res.ok) {
            alert(`🔄 Contrato de ${nome} reativado com sucesso!`);
            carregarLocatarios();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao reativar: ${errData.error || 'Falha no servidor'}`);
        }
    } catch (err) {
        console.error('Erro ao reativar:', err);
        alert(`❌ Erro inesperado: ${err.message}`);
    }
}

// ======================================================
// 5. BAIXA DE PAGAMENTO PIX (+1 SEMANA & +10 COINS)
// ======================================================
export async function adicionarUmaSemana(id, placa, telefone, nome, semanasAtuais, tipoContrato, semanasTotais, cpf) {
    const novasSemanas = semanasAtuais + 1;
    const primeiroNome = (nome || '').split(' ').toUpperCase();
    const numLimpo = (telefone || '').replace(/\D/g, '');
    const cpfLimpo = (cpf || '').replace(/\D/g, '');

    try {
        const resConfig = await fetchComAuth(`${API_BASE}/admin/config/coins_por_pix`);
        let incCoins = 10;
        if (resConfig.ok) {
            const cfg = await resConfig.json();
            incCoins = parseInt(cfg.valor) || 10;
        }

        const res = await fetchComAuth(`${API_BASE}/admin/locatarios/${id}/pagar-semana`, {
            method: 'POST',
            body: JSON.stringify({
                semanas_pagas: novasSemanas,
                incremento_coins: incCoins
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const responseData = await res.json();
        const saldoCoinsNovo = responseData.locafacil_coins || 0;
        const totalSem = semanasTotais || 182;
        const pct = Math.min(100, Math.round((novasSemanas / totalSem) * 100));

        const linkCliente = `[suspicious link removed]{cpfLimpo}`;

        let textoProgresso = `🎉 *PARABÉNS! VOCÊ COMPLETOU ${novasSemanas} SEMANAS COM SUCESSO!* 🟢`;
        if (pct >= 50) {
            textoProgresso = `🚀 *MAIS DA METADE DA MOTO JÁ É SUA! (${pct}% QUITADO — SEMANA ${novasSemanas} DE ${totalSem})* 🟢`;
        }

        const msg = `🚀 *PIX CONFIRMADO! MAIS UM PASSO RUMO À SUA MOTO!*\n\n` +
            `Fala ${primeiroNome}! Seu pagamento da semana foi confirmado! 🟢\n` +
            `${textoProgresso}\n` +
            `🪙 *Bônus:* +${incCoins} Locafacil Coins creditados! (Saldo Atual: ${saldoCoinsNovo} Coins)\n\n` +
            `Acompanhe seu progresso e resgate prêmios no seu painel:\n👉 ${linkCliente}\n\n` +
            `*LOCAFACILMOTOS — Parceria de verdade.* 👊`;

        window.open(`https://wa.me/55${numLimpo}?text=${encodeURIComponent(msg)}`, '_blank');
        carregarLocatarios();
    } catch (err) {
        console.error('Erro ao dar baixa na semana:', err);
        alert(`❌ Erro ao dar baixa no Pix: ${err.message}`);
    }
}

// ======================================================
// 6. MODAL DE EDIÇÃO DE CARD DE PILOTO (EDITION MANUAL)
// ======================================================
export function abrirModalEditar(locatario) {
    const modal = document.getElementById('modal-locatario') || document.getElementById('modal-editar');
    if (!modal) return;

    if (document.getElementById('edit-id')) document.getElementById('edit-id').value = locatario.id || '';
    if (document.getElementById('edit-nome')) document.getElementById('edit-nome').value = locatario.nome || '';
    if (document.getElementById('edit-placa')) document.getElementById('edit-placa').value = locatario.placa || '';
    if (document.getElementById('edit-modelo')) document.getElementById('edit-modelo').value = locatario.modelo || '';
    if (document.getElementById('edit-telefone')) document.getElementById('edit-telefone').value = locatario.telefone || '';
    if (document.getElementById('edit-cpf')) document.getElementById('edit-cpf').value = locatario.cpf || '';
    if (document.getElementById('edit-semanas')) document.getElementById('edit-semanas').value = locatario.semanas_pagas || 0;
    if (document.getElementById('edit-semanas-totais')) document.getElementById('edit-semanas-totais').value = locatario.semanas_totais || 182;
    if (document.getElementById('edit-coins')) document.getElementById('edit-coins').value = locatario.locafacil_coins || 0;
    
    // O KM Atual só é alterado aqui de forma explicitamente manual pelo usuário
    if (document.getElementById('edit-km-atual')) document.getElementById('edit-km-atual').value = locatario.km_atual || 0;
    
    if (document.getElementById('edit-tipo-contrato')) {
        document.getElementById('edit-tipo-contrato').value = locatario.tipo_contrato || 'OPCAO_COMPRA';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

export function fecharModal() {
    const modal = document.getElementById('modal-locatario') || document.getElementById('modal-editar');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

export async function salvarLocatario(e) {
    if (e && e.preventDefault) e.preventDefault();

    const id = document.getElementById('edit-id')?.value;
    if (!id) return;

    const payload = {
        nome: document.getElementById('edit-nome')?.value?.trim(),
        placa: document.getElementById('edit-placa')?.value?.trim()?.toUpperCase(),
        modelo: document.getElementById('edit-modelo')?.value?.trim(),
        telefone: document.getElementById('edit-telefone')?.value?.trim(),
        cpf: document.getElementById('edit-cpf')?.value?.trim(),
        semanas_pagas: parseInt(document.getElementById('edit-semanas')?.value) || 0,
        semanas_totais: parseInt(document.getElementById('edit-semanas-totais')?.value) || 182,
        locafacil_coins: parseInt(document.getElementById('edit-coins')?.value) || 0,
        
        // Atualização manual do KM Total pelo modal
        km_atual: parseInt(document.getElementById('edit-km-atual')?.value) || 0,
        
        tipo_contrato: document.getElementById('edit-tipo-contrato')?.value || 'OPCAO_COMPRA'
    };

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/locatarios/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('✅ Cadastro e KM Total salvos com sucesso!');
            fecharModal();
            carregarLocatarios();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao salvar: ${errData.error || 'Falha no servidor'}`);
        }
    } catch (err) {
        console.error('Erro ao salvar locatário:', err);
        alert(`❌ Erro ao salvar: ${err.message}`);
    }
}

export const salvarEdicaoCard = salvarLocatario;

// ======================================================
// 7. TELEMETRIA CSV MOBILTRACKER (KM TOTAL MANTIDO MANUAL)
// ======================================================

export function abrirModalImportarCSV() {
    const modal = document.getElementById('modal-importar-csv');
    const containerPreview = document.getElementById('container-preview-csv');
    const tbody = document.getElementById('tbody-preview-csv');
    const inputFile = document.getElementById('input-file-csv');
    const qtdVeiculos = document.getElementById('qtd-veiculos-csv');
    const elPeriodo = document.getElementById('periodo-csv-mobiltracker');
    const checkMaster = document.getElementById('check-todos-csv');

    window.dadosCSVImportacao = [];
    
    if (inputFile) inputFile.value = '';
    if (tbody) tbody.innerHTML = '';
    if (qtdVeiculos) qtdVeiculos.innerText = '0 selecionadas';
    if (elPeriodo) elPeriodo.innerText = 'Selecione o arquivo baixado do portal';
    if (checkMaster) checkMaster.checked = true;
    
    if (containerPreview) {
        containerPreview.classList.add('hidden');
        containerPreview.style.display = 'none';
    }

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.display = 'flex';
    }
}

export function fecharModalImportarCSV() {
    const modal = document.getElementById('modal-importar-csv');
    const containerPreview = document.getElementById('container-preview-csv');
    const tbody = document.getElementById('tbody-preview-csv');
    const inputFile = document.getElementById('input-file-csv');

    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.style.display = 'none';
    }
    if (inputFile) inputFile.value = '';
    if (tbody) tbody.innerHTML = '';
    if (containerPreview) {
        containerPreview.classList.add('hidden');
        containerPreview.style.display = 'none';
    }
    window.dadosCSVImportacao = [];
}

export function marcarDesmarcarTodosCSV(elMaster) {
    const checkboxes = document.querySelectorAll('.check-placa-csv');
    checkboxes.forEach(cb => cb.checked = elMaster.checked);
    atualizarContagemSelecionadosCSV();
}

export function atualizarContagemSelecionadosCSV() {
    const selecionados = document.querySelectorAll('.check-placa-csv:checked').length;
    const totalGeral = document.querySelectorAll('.check-placa-csv').length;
    const qtdVeiculos = document.getElementById('qtd-veiculos-csv');
    
    if (qtdVeiculos) {
        qtdVeiculos.innerText = `${selecionados} de ${totalGeral} selecionadas`;
    }
}

export function processarArquivoCSV(event) {
    let file = null;
    if (event && event.target && event.target.files && event.target.files) {
        file = event.target.files;
    } else if (event instanceof File) {
        file = event;
    }

    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const conteudo = e.target.result.replace(/^\uFEFF/, '');
        const linhas = conteudo.split(/\r\n|\n/).filter(l => l.trim().length > 0);
        
        if (linhas.length < 2) {
            alert('⚠️ Arquivo CSV vazio ou inválido.');
            return;
        }

        const cabecalho = linhas.split(';').map(c => c.replace(/"/g, '').trim());
        
        let colPlaca = cabecalho.findIndex(c => {
            const h = c.toLowerCase();
            return h.includes('nome') || h.includes('veiculo') || h.includes('veículo') || h.includes('placa');
        });
        if (colPlaca === -1) colPlaca = 1;

        let colTotal = cabecalho.findIndex(c => c.toLowerCase().includes('total'));
        if (colTotal === -1) colTotal = cabecalho.length - 1;

        const datasCabecalho = cabecalho.filter(c => /^\d{2}\/\d{2}\/\d{4}$/.test(c.trim()));
        let textoPeriodo = 'Relatório de Telemetria';
        if (datasCabecalho.length > 0) {
            textoPeriodo = `📅 Período: ${datasCabecalho} até ${datasCabecalho[datasCabecalho.length - 1]}`;
        }

        const dadosValidos = [];
        const tbody = document.getElementById('tbody-preview-csv');
        if (tbody) tbody.innerHTML = '';

        for (let i = 1; i < linhas.length; i++) {
            const colunas = linhas[i].split(';').map(c => c.replace(/"/g, '').trim());
            if (colunas.length <= colPlaca) continue;

            const placaOriginal = colunas[colPlaca] || '';
            const placaNorm = placaOriginal.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

            const rawTotal = colunas[colTotal] || '0';
            const distTratada = rawTotal.replace(/\./g, '').replace(',', '.');
            const kmRodados = Math.round(parseFloat(distTratada)) || 0;

            if (placaNorm && kmRodados > 0) {
                dadosValidos.push({
                    placa: placaNorm,
                    placaExibicao: placaOriginal.trim().toUpperCase(),
                    km_rodados: kmRodados
                });

                if (tbody) {
                    tbody.innerHTML += `
                        <tr class="border-b border-gray-100 hover:bg-orange-50/50 transition text-xs">
                            <td class="p-3 text-center">
                                <input type="checkbox" 
                                       class="check-placa-csv w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500 cursor-pointer" 
                                       data-placa="${placaNorm}" 
                                       checked 
                                       onchange="atualizarContagemSelecionadosCSV()">
                            </td>
                            <td class="p-3 font-black text-gray-900">
                                <span class="bg-orange-100 text-orange-950 border border-orange-200 px-2.5 py-1 rounded-lg text-xs font-black">
                                    ${placaOriginal.trim().toUpperCase()}
                                </span>
                            </td>
                            <td class="p-3 text-right font-black text-green-600 text-sm">
                                +${kmRodados.toLocaleString('pt-BR')} km
                            </td>
                        </tr>`;
                }
            }
        }

        window.dadosCSVImportacao = dadosValidos;

        const elPeriodo = document.getElementById('periodo-csv-mobiltracker');
        if (elPeriodo) elPeriodo.innerText = textoPeriodo;

        atualizarContagemSelecionadosCSV();

        const containerPreview = document.getElementById('container-preview-csv');
        if (containerPreview) {
            containerPreview.classList.remove('hidden');
            containerPreview.style.display = 'block';
        }
    };

    reader.readAsText(file, 'ISO-8859-1');
}

export async function confirmarImportacaoCSV() {
    const checkboxesMarcados = document.querySelectorAll('.check-placa-csv:checked');
    if (checkboxesMarcados.length === 0) {
        alert('⚠️ Nenhuma placa foi selecionada! Marque ao menos uma caixinha.');
        return;
    }

    const placasPermitidas = Array.from(checkboxesMarcados).map(cb => cb.getAttribute('data-placa'));
    const listaFiltrada = (window.dadosCSVImportacao || []).filter(item => placasPermitidas.includes(item.placa));

    if (!confirm(`Confirmar registro de telemetria para as ${listaFiltrada.length} motos selecionadas?\n\n(Nota: O KM Total dos cards NÃO será alterado).`)) return;

    let sucessos = 0;
    const dataHoje = new Date().toISOString().split('T');

    try {
        let todosLocatarios = [];
        try {
            const res = await fetchComAuth(`${API_BASE}/admin/locatarios?_t=${Date.now()}`);
            if (res.ok) {
                const responseData = await res.json();
                todosLocatarios = Array.isArray(responseData) ? responseData : (responseData.data || []);
            }
        } catch (e) {
            console.warn('Erro ao carregar lista de locatários:', e);
        }

        for (const item of listaFiltrada) {
            const placaCsvNorm = item.placa;

            let piloto = todosLocatarios.find(l => {
                const placaBancoNorm = (l.placa || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                return placaBancoNorm === placaCsvNorm;
            });

            if (!piloto && placaCsvNorm.length >= 3) {
                try {
                    const prefixo = placaCsvNorm.substring(0, 3);
                    const resBusca = await fetchComAuth(`${API_BASE}/admin/locatarios?busca=${encodeURIComponent(prefixo)}&_t=${Date.now()}`);
                    if (resBusca.ok) {
                        const responseData = await resBusca.json();
                        const arrBusca = Array.isArray(responseData) ? responseData : (responseData.data || []);
                        piloto = arrBusca.find(l => {
                            const placaBancoNorm = (l.placa || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                            return placaBancoNorm === placaCsvNorm;
                        });
                    }
                } catch (errBusca) {
                    console.warn(`Erro no fallback de busca para ${placaCsvNorm}:`, errBusca);
                }
            }

            if (piloto) {
                const kmAtualNoCard = piloto.km_atual || 0;

                // Registra apenas o histórico no rastreador
                await fetchComAuth(`${API_BASE}/admin/rastreador`, {
                    method: 'POST',
                    body: JSON.stringify({
                        locatario_id: piloto.id,
                        placa: piloto.placa || item.placaExibicao,
                        semana: piloto.semanas_pagas || 0,
                        data_inicio: dataHoje,
                        data_fim: dataHoje,
                        km_anterior: kmAtualNoCard,
                        km_atual: kmAtualNoCard, // Mantém o KM atual intacto
                        km_rodados: item.km_rodados,
                        observacao: 'Telemetria CSV Mobiltracker (KM Total Mantido Manual)'
                    })
                });

                // SEM CHAMADA PUT PARA /admin/locatarios/:id -> O KM Total permanece 100% manual!

                sucessos++;
            } else {
                console.warn(`⚠️ Placa ${item.placaExibicao} (${item.placa}) não foi encontrada no cadastro de locatários.`);
            }
        }

        alert(`✅ Registros de telemetria salvos com sucesso!\n\n📊 Total de ${sucessos} de ${listaFiltrada.length} moto(s) registradas no histórico.\n(O KM Total do card permaneceu inalterado).`);
        fecharModalImportarCSV();
        if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();

    } catch (err) {
        console.error('❌ Erro no registro da telemetria CSV:', err);
        alert(`❌ Erro ao processar registro: ${err.message}`);
    }
}

// ======================================================
// 8. RENDERIZAÇÃO DOS CARDS DA FROTA (COM LINK DE CASHBACK)
// ======================================================
function renderizarFrota(lista) {
    const grid = document.getElementById('grid-frota');
    if (!grid) return;

    if (!lista || lista.length === 0) {
        grid.innerHTML = `<div class="col-span-full bg-white p-8 rounded-2xl text-center shadow-sm text-gray-500 font-bold text-base uppercase">Nenhum piloto/moto encontrado nesta visualização.</div>`;
        return;
    }

    grid.innerHTML = '';

    lista.forEach(locatario => {
        const isArquivado = locatario.status === 'ARQUIVADO' || locatario.status === 'ENCERRADO';
        const tipoContrato = locatario.tipo_contrato || 'OPCAO_COMPRA';
        const semanasTotais = locatario.semanas_totais || 182;
        const semanasPagas = locatario.semanas_pagas || 0;
        const pct = Math.min(100, Math.round((semanasPagas / semanasTotais) * 100));
        const coins = locatario.locafacil_coins !== undefined ? locatario.locafacil_coins : (semanasPagas * 10);

        // 🔗 GERAÇÃO DO LINK INDIVIDUAL DE CASHBACK PELO CPF
        const cpfLimpo = (locatario.cpf || '').replace(/\D/g, '');
        const linkCashback = cpfLimpo ? `[https://cashback.locafacilmotos.com.br/]{cpfLimpo}` : '#';

        const jsonFormatado = JSON.stringify(locatario)
            .replace(/'/g, "&#39;")
            .replace(/"/g, "&quot;");

        const nomeSanitizado = (locatario.nome || 'Piloto').replace(/'/g, "\\'");

        const badgeTipoContrato = tipoContrato === 'OPCAO_COMPRA' 
            ? `<span class="bg-orange-100 text-orange-950 border border-orange-300 text-xs font-black px-3 py-1 rounded-full uppercase flex items-center gap-1">🏆 Opção de Compra (${semanasTotais}x)</span>`
            : `<span class="bg-blue-100 text-blue-900 border border-blue-300 text-xs font-black px-3 py-1 rounded-full uppercase flex items-center gap-1">🔑 Aluguel Convencional</span>`;

        const botaoAcaoPrincipal = isArquivado ? `
            <button type="button" onclick="reativarLocatario('${locatario.id}', '${nomeSanitizado}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl transition uppercase text-sm shadow-md">
                🔄 Reativar Contrato do Piloto
            </button>
        ` : `
            <button type="button" onclick="adicionarUmaSemana('${locatario.id}', '${locatario.placa || ''}', '${locatario.telefone || ''}', '${nomeSanitizado}', ${semanasPagas}, '${tipoContrato}', ${semanasTotais}, '${locatario.cpf || ''}')" class="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-xl transition uppercase text-sm shadow-md flex items-center justify-center gap-2">
                💵 +1 Semana (Baixar Pix)
            </button>
        `;

        grid.innerHTML += `
            <div class="bg-white rounded-2xl shadow-lg border ${isArquivado ? 'border-red-300 bg-red-50/20' : 'border-gray-200'} overflow-hidden flex flex-col justify-between">
                <div>
                    <!-- TOPO DO CARD -->
                    <div class="bg-gray-900 text-white p-4 flex justify-between items-center">
                        <div>
                            <span class="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">${locatario.placa || 'SEM PLACA'}</span>
                            <h3 class="font-black text-lg uppercase mt-1 leading-tight text-white">${locatario.nome || 'Piloto'}</h3>
                        </div>
                        <div class="text-right">
                            <span class="text-2xl font-black text-orange-500">${pct}%</span>
                        </div>
                    </div>

                    <!-- CORPO DO CARD -->
                    <div class="p-5 space-y-4">
                        <div class="flex justify-between items-center text-xs">
                            ${badgeTipoContrato}
                            <span class="font-black text-gray-500">CPF: ${locatario.cpf || 'N/I'}</span>
                        </div>

                        <div class="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div><p class="text-gray-400 font-bold uppercase text-xs">Modelo</p><p class="font-bold text-gray-800">${locatario.modelo || 'Não informado'}</p></div>
                            <div><p class="text-gray-400 font-bold uppercase text-xs">WhatsApp</p><p class="font-bold text-gray-800">${locatario.telefone || 'N/I'}</p></div>
                        </div>

                        <!-- BARRA DE PROGRESSO DO CONTRATO COM LINK CLICÁVEL DE CASHBACK -->
                        <div class="bg-gray-50 p-3 rounded-xl border border-gray-200">
                            <div class="flex justify-between items-center text-xs font-black text-gray-700 mb-1">
                                <span>Semana ${semanasPagas} de ${semanasTotais}</span>
                                ${cpfLimpo ? `
                                <a href="${linkCashback}" target="_blank" rel="noopener noreferrer" class="text-orange-600 hover:text-orange-700 font-black underline flex items-center gap-1 transition" title="Abrir painel de cashback do piloto">
                                    🪙 ${coins} Coins ↗️
                                </a>
                                ` : `<span class="text-gray-500">🪙 ${coins} Coins</span>`}
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div class="bg-gradient-to-r from-orange-500 to-yellow-400 h-full rounded-full" style="width: ${pct}%"></div>
                            </div>
                        </div>

                        <div class="bg-orange-50 p-3 rounded-xl border border-orange-100 text-xs">
                            <p class="text-orange-900 font-bold uppercase">Hodômetro Atual (Manual)</p>
                            <p class="font-black text-gray-900 text-base mt-0.5">${Number(locatario.km_atual || 0).toLocaleString('pt-BR')} km</p>
                        </div>

                        <!-- BARRAS DE DESGASTE DE PEÇAS / OFICINA -->
                        ${window.renderizarBarrasDesgasteMotos ? window.renderizarBarrasDesgasteMotos(locatario.km_atual || 0, locatario.componentes, locatario.placa) : ''}
                    </div>
                </div>

                <!-- BOTÕES DE AÇÃO DO RODAPÉ -->
                <div class="p-5 pt-0 space-y-2">
                    ${botaoAcaoPrincipal}

                    <div class="flex gap-2">
                        ${!isArquivado ? `
                        <button type="button" onclick='abrirSimuladorDevolucao(${jsonFormatado})' class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-xl text-xs uppercase transition shadow flex items-center justify-center gap-1" title="Simular ou efetivar rescisão">
                            🔍 Simular Devolução
                        </button>
                        ` : ''}

                        <button type="button" onclick='abrirModalEditar(${jsonFormatado})' class="bg-gray-900 hover:bg-black text-white font-bold px-4 py-3 rounded-xl text-xs uppercase transition">
                            ✏️ Editar
                        </button>

                        ${!isArquivado ? `
                        <button type="button" onclick="arquivarLocatario('${locatario.id}', '${nomeSanitizado}', '${locatario.placa || ''}')" class="bg-red-100 hover:bg-red-200 text-red-700 font-black px-4 py-3 rounded-xl text-xs uppercase transition" title="Arquivar contrato">
                            📦 Arquivar
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
}

// ======================================================
// EXPOSIÇÃO GLOBAL NO ESCOPO WINDOW
// ======================================================
window.carregarLocatarios = carregarLocatarios;
window.buscarLocatario = buscarLocatario;
window.arquivarLocatario = arquivarLocatario;
window.reativarLocatario = reativarLocatario;
window.adicionarUmaSemana = adicionarUmaSemana;
window.abrirModalEditar = abrirModalEditar;
window.fecharModal = fecharModal;
window.salvarLocatario = salvarLocatario;
window.salvarEdicaoCard = salvarLocatario;
window.abrirModalImportarCSV = abrirModalImportarCSV;
window.fecharModalImportarCSV = fecharModalImportarCSV;
window.marcarDesmarcarTodosCSV = marcarDesmarcarTodosCSV;
window.atualizarContagemSelecionadosCSV = atualizarContagemSelecionadosCSV;
window.processarArquivoCSV = processarArquivoCSV;
window.confirmarImportacaoCSV = confirmarImportacaoCSV;
window.renderizarFrota = renderizarFrota;