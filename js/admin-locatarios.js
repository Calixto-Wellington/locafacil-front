// ======================================================
// MÓDULO DE LOCATÁRIOS / FROTA - js/admin-locatarios.js
// ======================================================

import { API_BASE } from './api.js';
import { fetchComAuth } from './auth.js';

// Variável temporária para guardar os dados do CSV processado
window.dadosCSVImportacao = [];

// 1. CARREGAR LOCATÁRIOS COM FILTRO DE STATUS (ATIVO / ARQUIVADO / TODOS)
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

// 3. ARQUIVAR LOCATÁRIO (LIBERA A MOTO AUTOMATICAMENTE NO PÁTIO)
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

// 5. BAIXAR +1 SEMANA (PIX) + MENSAGEM DINÂMICA DE WHATSAPP
export async function adicionarUmaSemana(id, placa, telefone, nome, semanasAtuais, tipoContrato = 'OPCAO_COMPRA', semanasTotais = 182, cpf = '') {
    if (!confirm(`Confirmar baixa de +1 semana paga para ${nome} (Placa: ${placa})?`)) return;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/locatarios/${id}/pagamento`, {
            method: 'POST',
            body: JSON.stringify({ semanas: 1 })
        });

        if (res.ok) {
            const data = await res.json();
            const novaSemana = data.semanas_pagas || (parseInt(semanasAtuais, 10) + 1);
            
            const primeiroNome = ((nome || '').trim().split(' ')[0] || '').toUpperCase();
            const numLimpo = (telefone || '').replace(/\D/g, '');
            const cpfLimpo = (cpf || '').replace(/\D/g, '');
            const totalSem = parseInt(semanasTotais || 182, 10);

            const dominio = 'cashback.locafacilmotos.com.br';
            const linkCashback = cpfLimpo 
                ? 'https://' + dominio + '/?cpf=' + cpfLimpo
                : 'https://' + dominio;

            let mensagem = '';

            if (tipoContrato === 'CONVENCIONAL') {
                mensagem = `🟢 *PIX CONFIRMADO — ALUGUEL EM DIA!*\n\n` +
                    `Fala ${primeiroNome}! Confirmamos o recebimento do seu Pix referente à *Semana ${novaSemana}* de aluguel! ✅\n\n` +
                    `🏍️ *Moto:* Placa ${(placa || '').toUpperCase()}\n` +
                    `📅 *Total de semanas pagas:* ${novaSemana} semanas\n\n` +
                    `🎁 *Acesse seu Painel de Cashback & Coins:*\n${linkCashback}\n\n` +
                    `Agradecemos pela parceria e por manter o seu pagamento em dia. Tenha uma excelente semana de trabalho! 👊💨\n\n` +
                    `*LOCAFACILMOTOS — Acelerando com você!*`;
            } else {
                const pct = Math.min(100, Math.round((novaSemana / totalSem) * 100));
                const faltam = totalSem - novaSemana;

                mensagem = `🚀 *PIX CONFIRMADO! MAIS UM PASSO RUMO À SUA MOTO!*\n\n` +
                    `Fala ${primeiroNome}! Confirmamos o recebimento do seu Pix da *Semana ${novaSemana} de ${totalSem}*! 🟢\n\n` +
                    `📊 *SEU PROGRESSO:* Você já conquistou *${pct}%* da sua moto!\n` +
                    `🏆 *Status:* Semana ${novaSemana} / ${totalSem} concluída com sucesso.\n` +
                    `🏁 *Faltam:* Apenas ${faltam} semanas para a transferência do documento no DETRAN!\n\n` +
                    `🎁 *Acompanhe seus Coins & Resgate Prêmios:*\n${linkCashback}\n\n` +
                    `*LOCAFACILMOTOS — Acelerando junto com você!* 👊💨`;
            }

            if (numLimpo) {
                window.open(`https://wa.me/55${numLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');
            }

            carregarLocatarios();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao registrar pagamento: ${errData.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao adicionar semana:', err);
        alert('❌ Erro de conexão ao registrar pagamento.');
    }
}

// 6. MODAL EDITAR LOCATÁRIO (PREENCHIMENTO)
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

    if (document.getElementById('edit-semanas-totais')) {
        document.getElementById('edit-semanas-totais').value = locatario.semanas_totais || 182;
    }

    if (document.getElementById('edit-tipo-contrato')) {
        document.getElementById('edit-tipo-contrato').value = locatario.tipo_contrato || 'OPCAO_COMPRA';
    }

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

// 7. SALVAR EDIÇÃO DO CARD DO PILOTO
export async function salvarEdicaoCard(event) {
    if (event) event.preventDefault();

    const id = document.getElementById('edit-id').value;
    const nome = document.getElementById('edit-nome').value;
    const placa = document.getElementById('edit-placa').value;
    const modelo = document.getElementById('edit-modelo').value;
    const telefone = document.getElementById('edit-telefone').value;
    const cpf = document.getElementById('edit-cpf').value;
    const semanas = document.getElementById('edit-semanas').value;
    const km = document.getElementById('edit-km').value;

    const semanasTotais = document.getElementById('edit-semanas-totais')?.value || 182;
    const tipoContrato = document.getElementById('edit-tipo-contrato')?.value || 'OPCAO_COMPRA';

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/locatarios/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                nome,
                placa: placa.toUpperCase().trim(),
                modelo,
                telefone,
                cpf,
                semanas_pagas: parseInt(semanas, 10),
                semanas_totais: parseInt(semanasTotais, 10),
                km_atual: parseInt(km, 10),
                tipo_contrato: tipoContrato
            })
        });

        if (res.ok) {
            alert('✅ Dados do piloto e contrato salvos com sucesso!');
            fecharModal();
            carregarLocatarios();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao salvar: ${errData.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao salvar edição do piloto:', err);
        alert('❌ Erro de conexão.');
    }
}

// ======================================================
// 8. IMPORTAÇÃO DE TELEMETRIA CSV MOBILTRACKER COM SELEÇÃO (CORRIGIDO)
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
    if (event && event.target && event.target.files) {
        file = event.target.files[0];
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

        const cabecalho = linhas[0].split(';').map(c => c.replace(/"/g, '').trim());
        
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
            textoPeriodo = `📅 Período: ${datasCabecalho[0]} até ${datasCabecalho[datasCabecalho.length - 1]}`;
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

    if (!confirm(`Confirmar atualização de KM para as ${listaFiltrada.length} motos selecionadas?`)) return;

    let sucessos = 0;
    const dataHoje = new Date().toISOString().split('T')[0];

    try {
        // 1. Busca TODOS os locatários/pilotos de uma só vez
        const resAll = await fetchComAuth(`${API_BASE}/admin/locatarios?status=ALL&_t=${Date.now()}`);
        if (!resAll.ok) throw new Error(`Erro ao buscar lista de locatários: HTTP ${resAll.status}`);
        
        const responseData = await resAll.json();
        const todosLocatarios = Array.isArray(responseData) ? responseData : (responseData.data || []);

        // 2. Processa cada item selecionado do CSV comparando a placa normalizada (sem hífen)
        for (const item of listaFiltrada) {
            const piloto = todosLocatarios.find(l => {
                const placaBancoNorm = (l.placa || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                return placaBancoNorm === item.placa;
            });

            if (piloto) {
                const kmAnterior = piloto.km_atual || 0;
                const novoKmTotal = kmAnterior + item.km_rodados;

                // Registra histórico no rastreador
                await fetchComAuth(`${API_BASE}/admin/rastreador`, {
                    method: 'POST',
                    body: JSON.stringify({
                        locatario_id: piloto.id,
                        placa: piloto.placa || item.placaExibicao,
                        semana: piloto.semanas_pagas || 0,
                        data_inicio: dataHoje,
                        data_fim: dataHoje,
                        km_anterior: kmAnterior,
                        km_atual: novoKmTotal,
                        km_rodados: item.km_rodados,
                        observacao: 'Importação CSV Mobiltracker (Seleção Manual)'
                    })
                });

                // Atualiza o hodômetro do piloto no cadastro
                await fetchComAuth(`${API_BASE}/admin/locatarios/${piloto.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ km_atual: novoKmTotal })
                });

                sucessos++;
            } else {
                console.warn(`⚠️ Placa ${item.placaExibicao} (${item.placa}) não foi encontrada no cadastro de locatários.`);
            }
        }

        alert(`✅ Importação concluída com sucesso!\n\n📊 Total de ${sucessos} de ${listaFiltrada.length} moto(s) atualizada(s) no sistema.`);
        fecharModalImportarCSV();
        if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();

    } catch (err) {
        console.error('❌ Erro na importação do CSV:', err);
        alert(`❌ Erro ao processar importação: ${err.message}`);
    }
}


// 9. RENDERIZAÇÃO DOS CARDS DA FROTA (CORRIGIDO)
function renderizarFrota(lista) {
    const grid = document.getElementById('grid-frota');
    if (!grid) return;

    if (!lista || lista.length === 0) {
        grid.innerHTML = `<div class="col-span-full bg-white p-8 rounded-2xl text-center shadow-sm text-gray-500 font-bold text-base uppercase">Nenhum piloto/moto cadastrado nesta visualização.</div>`;
        return;
    }

    grid.innerHTML = '';

    lista.forEach(item => {
        // Alias de segurança: Garante que tanto 'item' quanto 'locatario' funcionem no código
        const locatario = item; 

        const isArquivado = locatario.status === 'ARQUIVADO' || locatario.status === 'ENCERRADO';
        const tipoContrato = locatario.tipo_contrato || 'OPCAO_COMPRA';
        const semanasTotais = locatario.semanas_totais || 182;
        const semanasPagas = locatario.semanas_pagas || 0;
        const pct = Math.min(100, Math.round((semanasPagas / semanasTotais) * 100));
        const coins = locatario.locafacil_coins !== undefined ? locatario.locafacil_coins : (semanasPagas * 10);

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

                        <!-- BARRA DE PROGRESSO DO CONTRATO -->
                        <div class="bg-gray-50 p-3 rounded-xl border border-gray-200">
                            <div class="flex justify-between items-center text-xs font-black text-gray-700 mb-1">
                                <span>Semana ${semanasPagas} de ${semanasTotais}</span>
                                <span>🪙 ${coins} Coins</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div class="bg-gradient-to-r from-orange-500 to-yellow-400 h-full rounded-full" style="width: ${pct}%"></div>
                            </div>
                        </div>

                        <div class="bg-orange-50 p-3 rounded-xl border border-orange-100 text-xs">
                            <p class="text-orange-900 font-bold uppercase">Hodômetro Atual</p>
                            <p class="font-black text-gray-900 text-base mt-0.5">${Number(locatario.km_atual || 0).toLocaleString('pt-BR')} km</p>
                        </div>

                        <!-- BARRAS DE DESGASTE DE PEÇAS / OFICINA -->
                        ${window.renderizarBarrasDesgasteMotos ? window.renderizarBarrasDesgasteMotos(locatario.km_atual || 0, locatario.componentes, locatario.placa) : ''}
                    </div>
                </div>

                <!-- BOTEIS DE AÇÃO DO RODAPÉ -->
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


    // VINCULAÇÃO GLOBAL NO WINDOW PARA SUPORTE AOS EVENTOS HTML
    window.carregarLocatarios = carregarLocatarios;
    window.buscarLocatario = buscarLocatario;
    window.arquivarLocatario = arquivarLocatario;
    window.reativarLocatario = reativarLocatario;
    window.adicionarUmaSemana = adicionarUmaSemana;
    window.abrirModalEditar = abrirModalEditar;
    window.fecharModal = fecharModal;
    window.salvarEdicaoCard = salvarEdicaoCard;
    window.abrirModalImportarCSV = abrirModalImportarCSV;
window.fecharModalImportarCSV = fecharModalImportarCSV;
window.processarArquivoCSV = processarArquivoCSV;
window.confirmarImportacaoCSV = confirmarImportacaoCSV;
window.marcarDesmarcarTodosCSV = marcarDesmarcarTodosCSV;
window.atualizarContagemSelecionadosCSV = atualizarContagemSelecionadosCSV;