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

// 8. IMPORTAÇÃO DE TELEMETRIA CSV DA MOBILTRACKER
export function abrirModalImportarCSV() {
    const modal = document.getElementById('modal-importar-csv');
    const containerPreview = document.getElementById('container-preview-csv');
    const input = document.getElementById('input-file-csv');
    const tbody = document.getElementById('tbody-preview-csv');

    if (input) input.value = '';
    if (tbody) tbody.innerHTML = '';
    if (containerPreview) containerPreview.classList.add('hidden');
    window.dadosCSVImportacao = [];

    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

export function fecharModalImportarCSV() {
    const modal = document.getElementById('modal-importar-csv');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    window.dadosCSVImportacao = [];
}

export function processarArquivoCSV(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const conteudo = e.target.result || '';
        const linhas = conteudo.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

        if (linhas.length < 2) {
            alert('⚠️ O arquivo CSV selecionado está vazio ou inválido.');
            return;
        }

        const delimitador = linhas[0].includes(';') ? ';' : ',';
        const cabecalho = linhas[0].split(delimitador).map(c => c.trim().toLowerCase());

        let idxPlaca = cabecalho.findIndex(c => c.includes('nome') || c.includes('placa') || c.includes('veiculo') || c.includes('dispositivo'));
        if (idxPlaca === -1) idxPlaca = cabecalho.length > 1 ? 1 : 0;

        let idxTotal = cabecalho.findIndex(c => c.includes('total'));
        if (idxTotal === -1) idxTotal = cabecalho.length - 1;

        let dataInicio = new Date().toISOString().split('T')[0];
        let dataFim = new Date().toISOString().split('T')[0];

        const colunasData = cabecalho.filter(c => c.includes('/') && c.split('/').length === 3);
        if (colunasData.length > 0) {
            const converterData = (strData) => {
                const partes = strData.trim().split('/');
                if (partes.length === 3) {
                    return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
                }
                return dataInicio;
            };
            dataInicio = converterData(colunasData[0]);
            dataFim = converterData(colunasData[colunasData.length - 1]);
        }

        const dadosValidos = [];
        const tbody = document.getElementById('tbody-preview-csv');
        if (tbody) tbody.innerHTML = '';

        for (let i = 1; i < linhas.length; i++) {
            const cols = linhas[i].split(delimitador);
            if (cols.length <= idxPlaca) continue;

            const nomeOuPlacaBruta = (cols[idxPlaca] || '').trim();
            const placaFormatada = nomeOuPlacaBruta.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

            if (!placaFormatada || placaFormatada === 'NOME' || placaFormatada === 'PLACA') continue;

            let kmRodadosStr = (cols[idxTotal] || '0').trim();
            kmRodadosStr = kmRodadosStr.replace(/\./g, '').replace(',', '.');
            const kmRodados = Math.round(parseFloat(kmRodadosStr) || 0);

            if (kmRodados > 0) {
                dadosValidos.push({
                    placa: placaFormatada,
                    km_rodados: kmRodados,
                    data_inicio: dataInicio,
                    data_fim: dataFim
                });

                if (tbody) {
                    tbody.innerHTML += `
                        <tr class="hover:bg-gray-100">
                            <td class="py-2 border-b"><span class="bg-orange-100 text-orange-800 font-black px-2 py-0.5 rounded text-[11px]">${placaFormatada}</span></td>
                            <td class="py-2 border-b text-right font-black text-gray-900">+${kmRodados.toLocaleString('pt-BR')} km</td>
                        </tr>
                    `;
                }
            }
        }

        window.dadosCSVImportacao = dadosValidos;

        const containerPreview = document.getElementById('container-preview-csv');
        const qtdVeiculos = document.getElementById('qtd-veiculos-csv');

        if (containerPreview) containerPreview.classList.remove('hidden');
        if (qtdVeiculos) qtdVeiculos.innerText = `${dadosValidos.length} veículos identificados`;

        if (dadosValidos.length === 0) {
            alert('⚠️ Nenhum veículo com rodagem positiva foi identificado neste arquivo CSV.');
        }
    };

    reader.readAsText(file, 'ISO-8859-1');
}

export async function confirmarImportacaoCSV() {
    const lista = window.dadosCSVImportacao || [];
    if (!lista || lista.length === 0) {
        alert('⚠️ Nenhum dado selecionado para importação.');
        return;
    }

    if (!confirm(`Confirmar atualização de quilometragem para os ${lista.length} veículos identificados no CSV?`)) {
        return;
    }

    let sucessos = 0;

    for (const item of lista) {
        try {
            const resBusca = await fetchComAuth(`${API_BASE}/admin/locatarios?busca=${encodeURIComponent(item.placa)}`);
            if (resBusca.ok) {
                const locatarios = await resBusca.json();
                const piloto = Array.isArray(locatarios) 
                    ? locatarios.find(l => (l.placa || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase() === item.placa)
                    : null;

                if (piloto) {
                    const kmAnterior = parseInt(piloto.km_atual || 0, 10);
                    const novoKmTotal = kmAnterior + item.km_rodados;

                    await fetchComAuth(`${API_BASE}/admin/rastreador`, {
                        method: 'POST',
                        body: JSON.stringify({
                            locatario_id: piloto.id,
                            placa: item.placa,
                            semana: piloto.semanas_pagas || 0,
                            data_inicio: item.data_inicio,
                            data_fim: item.data_fim,
                            km_anterior: kmAnterior,
                            km_atual: novoKmTotal,
                            km_rodados: item.km_rodados,
                            observacao: 'Importação CSV Mobiltracker'
                        })
                    });

                    await fetchComAuth(`${API_BASE}/admin/locatarios/${piloto.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            km_atual: novoKmTotal
                        })
                    });

                    sucessos++;
                }
            }
        } catch (err) {
            console.error(`Erro ao importar placa ${item.placa}:`, err);
        }
    }

    alert(`✅ Importação concluída com sucesso!\n\n📊 Total de ${sucessos} piloto(s) e moto(s) atualizados.`);
    fecharModalImportarCSV();
    carregarLocatarios();
}

// 9. RENDERIZAÇÃO DOS CARDS DA FROTA
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
        const semanasTotais = parseInt(item.semanas_totais || 182, 10);
        const tipoContrato = item.tipo_contrato || 'OPCAO_COMPRA';
        const isOpcaoCompra = tipoContrato === 'OPCAO_COMPRA';

        const pct = Math.min(100, Math.round((semanasPagas / semanasTotais) * 100));
        
        const jsonSanitizado = JSON.stringify(item).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        const nomeSanitizado = (item.nome || '').replace(/'/g, "\\'");

        // Badges com fonte text-xs (12px) em vez de 10px
        const badgeModalidade = isOpcaoCompra
            ? `<span class="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black px-3 py-1 rounded-full uppercase flex items-center gap-1">🏆 Opção de Compra (${semanasTotais} sem)</span>`
            : `<span class="bg-blue-100 text-blue-900 border border-blue-300 text-xs font-black px-3 py-1 rounded-full uppercase flex items-center gap-1">🔑 Aluguel Convencional</span>`;

        // Contador de semanas com número expandido (text-2xl) e rótulo text-xs
        const blocoSemanas = isOpcaoCompra
            ? `<div class="text-right">
                <span class="text-2xl font-black text-orange-500 block leading-none">Semana ${semanasPagas}</span>
                <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">${semanasPagas}/${semanasTotais} sem (${pct}%)</span>
               </div>`
            : `<div class="text-right">
                <span class="text-2xl font-black text-blue-400 block leading-none">${semanasPagas} sem</span>
                <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">Pagas (Contínuo)</span>
               </div>`;

        // Botão principal expandido para text-sm (14px)
        const botaoAcaoPrincipal = isArquivado ? `
            <button type="button" onclick="reativarLocatario('${item.id}', '${nomeSanitizado}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl transition uppercase text-sm shadow-md">
                🔄 Reativar Contrato
            </button>
        ` : `
            <button type="button" onclick="adicionarUmaSemana('${item.id}', '${item.placa || ''}', '${item.telefone || ''}', '${nomeSanitizado}', ${semanasPagas}, '${tipoContrato}', ${semanasTotais}, '${item.cpf || ''}')" class="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-xl transition uppercase text-sm shadow-md">
                💵 +1 Semana (Baixar Pix)
            </button>

            <div class="flex gap-2">
        <!-- 🔘 BOTÃO DE SIMULAÇÃO DEVOLUCAO -->
        <button type="button" onclick='abrirSimuladorDevolucao(${JSON.stringify(locatario).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' class="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs uppercase transition shadow">
    🔍 Simular Devolução
</button>
        `;

        grid.innerHTML += `
            <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col justify-between ${isArquivado ? 'opacity-75 border-red-200' : ''}">
                <div>
                    <!-- CABEÇALHO DO CARD -->
                    <div class="bg-gray-900 text-white p-4.5 flex justify-between items-center">
                        <div>
                            <span class="bg-orange-600 text-white text-xs font-black px-2.5 py-1 rounded uppercase tracking-wider">${item.placa || 'Sem Placa'}</span>
                            <h3 class="font-black text-xl uppercase mt-1.5 leading-tight">${item.nome || 'Sem Nome'}</h3>
                        </div>
                        <div class="text-right">
                            ${isArquivado 
                                ? '<span class="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded uppercase">📦 Arquivado</span>' 
                                : blocoSemanas
                            }
                        </div>
                    </div>

                    <div class="p-5 space-y-3.5">
                        <!-- MODALIDADE DO CONTRATO E TELEFONE -->
                        <div class="flex justify-between items-center pb-2.5 border-b border-gray-100 flex-wrap gap-2">
                            ${badgeModalidade}
                            <span class="text-xs font-bold text-gray-500 uppercase">Whats: ${item.telefone || 'N/A'}</span>
                        </div>

                        <!-- GRID MODELO E CPF DA MOTO -->
                        <div class="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div><p class="text-gray-500 font-bold uppercase text-xs">Modelo</p><p class="font-black text-gray-900 text-sm mt-0.5">${item.modelo || 'N/A'}</p></div>
                            <div><p class="text-gray-500 font-bold uppercase text-xs">CPF</p><p class="font-black text-gray-900 text-sm mt-0.5">${item.cpf || 'N/A'}</p></div>
                        </div>

                        ${isArquivado ? `
                            <div class="bg-red-50 border border-red-200 p-3.5 rounded-xl text-sm">
                                <p class="text-red-700 font-black uppercase text-xs">Motivo Encerramento:</p>
                                <p class="text-gray-800 font-bold mt-1">${item.motivo_arquivamento || 'Não detalhado'}</p>
                            </div>
                        ` : ''}

                        <!-- TELEMETRIA E DESGASTE DE PEÇAS DA OFICINA -->
                        ${window.renderizarBarrasDesgasteMotos ? window.renderizarBarrasDesgasteMotos(item.km_atual || 0, item.componentes, item.placa) : ''}
                    </div>
                </div>

                <!-- BOTÕES DE AÇÃO -->
                <div class="p-5 pt-0 space-y-2.5">
                    ${botaoAcaoPrincipal}

                    <div class="flex gap-2.5">
                        <button type="button" onclick="abrirModalEditar(${jsonSanitizado})" class="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl text-sm uppercase transition">
                            ✏️ Editar
                        </button>
                        ${!isArquivado ? `
                            <button type="button" onclick="arquivarLocatario('${item.id}', '${nomeSanitizado}', '${item.placa || ''}')" class="bg-red-100 hover:bg-red-200 text-red-700 font-black px-4 py-3 rounded-xl text-sm uppercase transition" title="Arquivar contrato">
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