// ======================================================
// MÓDULO DE LEADS E MESA DE APROVAÇÃO — js/admin-leads.js
// ======================================================

import { API_BASE } from './api.js';
import { fetchComAuth } from './auth.js';

// 1. CARREGAR E FILTRAR LEADS DA MESA DE APROVAÇÃO
export async function carregarLeads() {
    // Suporte aos seletores de filtro da tela
    const selectFiltro = document.getElementById('filtro-status-lead') 
                      || document.getElementById('filtro-status');
    
    let filtro = selectFiltro ? selectFiltro.value : 'PENDENTE';
    if (!filtro || filtro === 'undefined') filtro = 'PENDENTE';

    // Atualiza o subtítulo indicativo da tela se o elemento existir
    const elSubtitulo = document.getElementById('subtitulo-mesa');
    if (elSubtitulo) {
        let textoSubtitulo = "Exibindo fichas pendentes de análise";
        if (filtro === 'APROVADO') textoSubtitulo = "Exibindo fichas aprovadas (Aguardando caução / retirada)";
        if (filtro === 'CONTRATADO') textoSubtitulo = "Exibindo contratos ativos (Moto entregue)";
        if (filtro === 'REJEITADO') textoSubtitulo = "Exibindo fichas arquivadas / recusadas";
        if (filtro === 'TODOS') textoSubtitulo = "Exibindo todo o histórico de cadastros";
        elSubtitulo.innerText = textoSubtitulo;
    }

    const loading = document.getElementById('loading-leads') || document.getElementById('loading');
    const grid = document.getElementById('grid-leads');

    if (loading) loading.classList.remove('hidden');
    if (grid) grid.innerHTML = '';

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/leads?status=${filtro}&_t=${Date.now()}`);
        if (!res.ok) throw new Error(`Erro de rede HTTP ${res.status}`);

        let fichas = await res.json();

        // Fallback automático de busca se a busca específica por filtro voltar vazia
        if ((!fichas || fichas.length === 0) && filtro !== 'TODOS' && filtro !== 'PENDENTE') {
            console.warn(`Nenhum registro com status ${filtro}. Consultando todos os leads...`);
            const resTodos = await fetchComAuth(`${API_BASE}/admin/leads?status=TODOS&_t=${Date.now()}`);
            if (resTodos.ok) {
                const todosData = await resTodos.json();
                if (todosData && todosData.length > 0) {
                    fichas = todosData;
                }
            }
        }

        if (loading) loading.classList.add('hidden');

        if (!fichas || fichas.length === 0) {
            if (grid) {
                grid.innerHTML = `
                    <div class="col-span-full bg-white p-8 rounded-2xl text-center shadow-sm text-gray-500 font-bold text-sm uppercase border border-gray-200">
                        <span class="text-3xl block mb-2">📭</span>
                        Nenhum cadastro encontrado para o status "<b>${filtro}</b>".
                    </div>`;
            }
            return;
        }

        renderizarLeads(fichas);
    } catch (err) {
        console.error('❌ Erro ao carregar leads:', err);
        if (loading) loading.classList.add('hidden');
        if (grid) {
            grid.innerHTML = `
                <div class="col-span-full bg-red-50 border border-red-200 p-6 rounded-2xl text-center text-red-700 font-bold text-sm uppercase">
                    ❌ Erro ao carregar as fichas de cadastro.<br>
                    <span class="text-xs font-normal text-red-600 block mt-1">${err.message}</span>
                </div>`;
        }
    }
}

// 2. BUSCA ATIVA POR NOME, CPF OU WHATSAPP
export async function realizarBuscaLeads() {
    const inputBusca = document.getElementById('input-busca-leads') || document.getElementById('input-busca');
    const termo = inputBusca ? inputBusca.value.trim() : '';

    if (!termo) {
        return carregarLeads();
    }

    const loading = document.getElementById('loading-leads') || document.getElementById('loading');
    const grid = document.getElementById('grid-leads');

    if (loading) loading.classList.remove('hidden');
    if (grid) grid.innerHTML = '';

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/leads?status=TODOS&busca=${encodeURIComponent(termo)}&_t=${Date.now()}`);
        if (!res.ok) throw new Error(`Erro na busca HTTP ${res.status}`);

        const fichas = await res.json();
        if (loading) loading.classList.add('hidden');

        renderizarLeads(fichas || []);
    } catch (err) {
        console.error('❌ Erro ao realizar busca de leads:', err);
        if (loading) loading.classList.add('hidden');
    }
}

// 3. RENDERIZAÇÃO DOS CARDS NA MESA DE APROVAÇÃO
function renderizarLeads(fichas) {
    const grid = document.getElementById('grid-leads');
    if (!grid) return;

    if (!fichas || fichas.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full bg-white p-8 rounded-2xl text-center shadow-sm text-gray-500 font-bold text-sm uppercase border border-gray-200">
                Nenhum cadastro encontrado nesta visualização.
            </div>`;
        return;
    }

    grid.innerHTML = '';

    fichas.forEach(lead => {
        const dataEnvio = lead.created_at ? new Date(lead.created_at).toLocaleString('pt-BR') : 'Data N/I';
        const statusAtual = (lead.status || 'PENDENTE').toUpperCase();

        // Cores dos badges de status
        let badgeClass = 'bg-yellow-500 text-black';
        if (statusAtual === 'APROVADO') badgeClass = 'bg-blue-600 text-white';
        else if (statusAtual === 'CONTRATADO') badgeClass = 'bg-green-600 text-white';
        else if (statusAtual === 'REJEITADO' || statusAtual === 'ARQUIVADO') badgeClass = 'bg-red-600 text-white';

        // Sanitização de nomes e dados para prevenção de quebra de sintaxe no JS inline
        const nomeSanitizado = (lead.nome || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const telSanitizado = (lead.telefone || '').replace(/\D/g, '');
        const cpfSanitizado = (lead.cpf || '').replace(/'/g, "\\'");
        const emailSanitizado = (lead.email || '').replace(/'/g, "\\'");
        const motoInteresse = (lead.moto_interesse || 'Honda CG 160 Start').replace(/'/g, "\\'");

        // Lógica das Ações no Rodapé do Card
        let areaAcoes = '';
        if (statusAtual === 'PENDENTE') {
            areaAcoes = `
                <div class="space-y-3">
                    <button type="button" onclick="validarCaucao('${nomeSanitizado}', '${telSanitizado}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl transition uppercase text-xs flex items-center justify-center gap-2 shadow-sm">
                        💬 1. Chamar no Whats (Caução R$ 1.000)
                    </button>
                    <div class="flex gap-2">
                        <button type="button" onclick="aprovarLead('${lead.id}', '${telSanitizado}', '${nomeSanitizado}')" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition uppercase text-xs shadow-sm">
                            ✅ 2. Aprovar Ficha
                        </button>
                        <button type="button" onclick="rejeitarLead('${lead.id}', '${telSanitizado}', '${nomeSanitizado}')" class="bg-red-100 hover:bg-red-200 text-red-600 font-black px-4 py-3 rounded-xl transition uppercase text-xs">
                            Arquivar
                        </button>
                    </div>
                </div>`;
        } else if (statusAtual === 'APROVADO') {
            areaAcoes = `
                <div class="space-y-3">
                    <div class="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-center font-bold text-blue-800 uppercase text-[11px]">
                        🔵 Ficha Aprovada no Risco — Aguardando Caução / Retirada na Base
                    </div>
                    <div class="flex gap-2">
                        <button type="button" onclick="efetivarLocacao('${lead.id}', '${telSanitizado}', '${nomeSanitizado}', '${cpfSanitizado}', '${emailSanitizado}', '${motoInteresse}')" 
                            class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-black py-3.5 rounded-xl transition uppercase text-xs shadow-md flex items-center justify-center gap-2">
                            🏍️ Entregar Moto (Efetivar Contrato)
                        </button>
                        <button type="button" onclick="rejeitarLead('${lead.id}', '${telSanitizado}', '${nomeSanitizado}')" class="bg-red-100 hover:bg-red-200 text-red-600 font-black px-3.5 py-3 rounded-xl transition uppercase text-xs">
                            Desistiu
                        </button>
                    </div>
                </div>`;
        } else if (statusAtual === 'CONTRATADO') {
            areaAcoes = `
                <div class="bg-black text-orange-500 border-2 border-orange-500 p-3.5 rounded-xl text-center font-black uppercase text-xs tracking-wide shadow-sm">
                    🚀 Contrato Ativo: Moto Entregue e Piloto Registrado na Frota
                </div>`;
        } else {
            areaAcoes = `
                <div class="bg-red-50 border border-red-200 p-3.5 rounded-xl">
                    <p class="text-xs text-red-700 font-black uppercase mb-1">❌ Ficha Recusada / Arquivada</p>
                    <p class="text-xs font-bold text-gray-800">${lead.motivo_recusa || "Motivo não detalhado no sistema."}</p>
                </div>`;
        }

        grid.innerHTML += `
            <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col justify-between" id="card-${lead.id}">
                <div>
                    <!-- CABEÇALHO DO CARD -->
                    <div class="bg-black text-white p-4 flex justify-between items-center">
                        <span class="font-bold text-xs uppercase text-gray-300">Recebido: ${dataEnvio}</span>
                        <span class="${badgeClass} text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">${statusAtual}</span>
                    </div>

                    <div class="p-5 space-y-4">
                        <!-- DADOS PESSOAIS DO PILOTO -->
                        <div class="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div><p class="text-gray-400 font-bold uppercase text-[10px]">Nome Completo</p><p class="font-black text-sm uppercase text-gray-900 mt-0.5">${lead.nome || 'N/I'}</p></div>
                            <div><p class="text-gray-400 font-bold uppercase text-[10px]">CPF</p><p class="font-bold text-gray-800 text-xs mt-0.5">${lead.cpf || 'N/I'}</p></div>
                            <div><p class="text-gray-400 font-bold uppercase text-[10px]">WhatsApp</p><p class="font-bold text-gray-800 text-xs mt-0.5">${lead.telefone || 'N/I'}</p></div>
                            <div><p class="text-gray-400 font-bold uppercase text-[10px]">E-mail</p><p class="font-bold text-gray-800 text-xs mt-0.5 truncate">${lead.email || 'N/I'}</p></div>
                        </div>

                        <!-- ENDEREÇO -->
                        ${lead.endereco ? `
                            <div class="text-xs">
                                <p class="text-gray-400 font-bold uppercase text-[10px]">Endereço Declarado</p>
                                <p class="font-bold text-gray-800 uppercase text-xs mt-0.5">${lead.endereco}</p>
                            </div>
                        ` : ''}

                        <!-- BLOCO MOTO & PLANO DE INTERESSE -->
                        <div class="bg-orange-50 p-3.5 rounded-xl border border-orange-100 text-xs">
                            <p class="text-orange-700 font-black uppercase text-[10px]">Interesse de Assinatura</p>
                            <p class="font-bold text-gray-900 text-sm mt-0.5">${lead.moto_interesse || 'Honda CG 160 Start'} — ${lead.plano_interesse || 'Plano Fidelidade'}</p>
                            <p class="text-green-700 font-black text-[11px] mt-1.5 flex items-center gap-1">✓ Declarou possuir valor de Caução + 1ª Semana (R$ 1.000,00)</p> 
                        </div>

                        <!-- DOCUMENTOS DE CNH E COMPROVANTE -->
                        <div class="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-xs">
                            ${lead.cnh_url ? `<a href="${lead.cnh_url}" target="_blank" class="text-center block bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-xl border transition">📄 Ver CNH (PDF/Img)</a>` : `<div class="text-center text-gray-400 font-bold py-2 bg-gray-50 rounded-xl">Sem CNH</div>`}
                            ${lead.comprovante_url ? `<a href="${lead.comprovante_url}" target="_blank" class="text-center block bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-xl border transition">📄 Ver Compr. End.</a>` : `<div class="text-center text-gray-400 font-bold py-2 bg-gray-50 rounded-xl">Sem Comprovante</div>`}
                        </div>

                        <!-- ANEXOS DE RELATÓRIO DE RISCO 1 & 2 -->
                        <div class="space-y-2">
                            <div class="bg-gray-50 border border-gray-200 p-3 rounded-xl">
                                <p class="text-[10px] text-gray-600 font-bold uppercase mb-1.5">Relatório de Risco 1 (PDF)</p>
                                ${lead.pdf_consulta_url 
                                    ? `<a href="${lead.pdf_consulta_url}" target="_blank" class="w-full text-center block bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-black py-2 rounded-lg text-xs uppercase shadow-sm border border-indigo-200">📥 Baixar / Ver Relatório PDF 1</a>`
                                    : `<div class="flex gap-2 items-center">
                                         <input type="file" id="file-pdf1-${lead.id}" accept="application/pdf" class="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-gray-200 file:text-gray-700 cursor-pointer">
                                         <button type="button" onclick="anexarPdf1('${lead.id}')" id="btn-pdf1-${lead.id}" class="bg-gray-800 hover:bg-black text-white font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase transition">Anexar</button>
                                       </div>`
                                }
                            </div>

                            <div class="bg-gray-50 border border-gray-200 p-3 rounded-xl">
                                <p class="text-[10px] text-gray-600 font-bold uppercase mb-1.5">Relatório Secundário 2 (PDF)</p>
                                ${lead.pdf_consulta_2_url 
                                    ? `<a href="${lead.pdf_consulta_2_url}" target="_blank" class="w-full text-center block bg-teal-100 hover:bg-teal-200 text-teal-800 font-black py-2 rounded-lg text-xs uppercase shadow-sm border border-teal-200">📥 Baixar / Ver Relatório PDF 2</a>`
                                    : `<div class="flex gap-2 items-center">
                                         <input type="file" id="file-pdf2-${lead.id}" accept="application/pdf" class="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-gray-200 file:text-gray-700 cursor-pointer">
                                         <button type="button" onclick="anexarPdf2('${lead.id}')" id="btn-pdf2-${lead.id}" class="bg-gray-800 hover:bg-black text-white font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase transition">Anexar</button>
                                       </div>`
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AÇÕES DA FICHA -->
                <div class="p-5 pt-0">
                    ${areaAcoes}
                </div>
            </div>
        `;
    });
}

// 4. FUNÇÕES DE AÇÃO INDIVIDUAIS
export function validarCaucao(nomeCompleto, telefone) {
    const primeiroNome = (nomeCompleto || '').split(' ').toUpperCase();
    const numLimpo = (telefone || '').replace(/\D/g, '');
    const texto = `Fala ${primeiroNome}! Aqui é da LOCAFACILMOTOS. Sua ficha foi RECEBIDA. O Sr. tem o valor da caução + primeira semana = R$ 1.000,00?`;
    window.open(`https://wa.me/55${numLimpo}?text=${encodeURIComponent(texto)}`, '_blank');
}

export async function aprovarLead(id, telefone, nome) {
    const numLimpo = (telefone || '').replace(/\D/g, '');
    const primeiroNome = (nome || '').split(' ').toUpperCase();
    const msg = `Fala ${primeiroNome}! Sua ficha na LOCAFACILMOTOS foi *APROVADA*! 🚀\n\nBora agendar o pagamento da caução e a retirada da sua moto na nossa base em Santo André?`;

    window.open(`https://wa.me/55${numLimpo}?text=${encodeURIComponent(msg)}`, '_blank');

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/leads/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'APROVADO' })
        });

        if (!res.ok) throw new Error('Erro ao alterar status no servidor.');
        carregarLeads();
    } catch (err) {
        console.error('Erro ao aprovar lead:', err);
        alert('❌ Ocorreu um erro ao atualizar a ficha para Aprovado.');
    }
}

export async function rejeitarLead(id, telefone, nome) {
    const motivo = prompt(`Digite o motivo da recusa / arquivamento para o candidato ${nome}:`);
    if (motivo === null) return;
    if (!motivo.trim()) {
        alert("⚠️ É necessário informar o motivo da recusa para arquivar a ficha!");
        return;
    }

    if (confirm(`Confirmar o arquivamento da ficha de ${nome}?`)) {
        const primeiroNome = (nome || '').split(' ');
        const numLimpo = (telefone || '').replace(/\D/g, '');
        const textoNegacao = `Olá ${primeiroNome}, tudo bem!?\n\nFinalizamos a análise dos seus dados e, infelizmente, sua ficha não foi aprovada neste momento por critérios internos da locadora.`;

        window.open(`https://wa.me/55${numLimpo}?text=${encodeURIComponent(textoNegacao)}`, '_blank');

        try {
            const res = await fetchComAuth(`${API_BASE}/admin/leads/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'REJEITADO', motivo_recusa: motivo.trim() })
            });

            if (!res.ok) throw new Error('Erro ao atualizar status de rejeição.');
            carregarLeads();
        } catch (err) {
            console.error('Erro ao rejeitar lead:', err);
            alert('❌ Erro ao arquivar a ficha.');
        }
    }
}

export async function efetivarLocacao(id, telefone, nome, cpf, email, moto) {
    const placaInput = prompt(`MOTO ENTREGUE! Digite a PLACA vinculada ao piloto ${nome}:`);
    if (!placaInput || !placaInput.trim()) {
        alert("⚠️ A placa é obrigatória para efetivar o contrato!");
        return;
    }

    const kmInicialStr = prompt(`Digite o KM INICIAL do painel da moto (${placaInput.toUpperCase()}):`, "0");
    if (kmInicialStr === null) return;
    const kmInicial = parseInt(kmInicialStr.replace(/\D/g, ''), 10) || 0;

    const placaFormatada = placaInput.trim().toUpperCase();
    const numLimpo = (telefone || '').replace(/\D/g, '');
    const primeiroNome = (nome || '').split(' ').toUpperCase();

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/leads/${id}/efetivar`, {
            method: 'POST',
            body: JSON.stringify({
                nome,
                cpf,
                telefone,
                email,
                moto_interesse: moto,
                placa: placaFormatada,
                km_inicial: kmInicial
            })
        });

        if (!res.ok) throw new Error('Erro ao efetivar contrato.');

        alert("✅ Contrato efetivado com sucesso! Piloto registrado na frota.");

        const linkCliente = `[suspicious link removed]{placaFormatada}`;
        const msg = `🏍️ *MOTO ENTREGUE E CONTRATO ATIVO!*\n\n` +
            `Fala ${primeiroNome}, parabéns! Sua ${moto || 'Honda CG 160 Start'} (Placa: ${placaFormatada}) já está pronta para rodar! 🚀\n\n` +
            `📊 Seu painel exclusivo para acompanhar a conquista da sua moto está no ar:\n` +
            `👉 ${linkCliente}\n\n` +
            `*LOCAFACILMOTOS — Parceria de verdade.* 👊`;

        window.open(`https://wa.me/55${numLimpo}?text=${encodeURIComponent(msg)}`, '_blank');

        carregarLeads();
        if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
    } catch (err) {
        console.error('Erro ao efetivar locação:', err);
        alert(`❌ Erro ao efetivar contrato: ${err.message}`);
    }
}

// 5. ANEXAR RELATÓRIOS DE RISCO PDF 1 E 2
export async function anexarPdf1(id) {
    const fileInput = document.getElementById(`file-pdf1-${id}`);
    const btn = document.getElementById(`btn-pdf1-${id}`);
    const file = fileInput?.files;

    if (!file) {
        alert("⚠️ Selecione o primeiro arquivo PDF!");
        return;
    }

    if (btn) {
        btn.innerText = "Enviando...";
        btn.disabled = true;
    }

    try {
        const formData = new FormData();
        formData.append('pdf1', file);

        const res = await fetchComAuth(`${API_BASE}/admin/leads/${id}/pdf1`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Erro ao anexar PDF 1');
        
        alert("✅ Relatório de Risco PDF 1 anexado com sucesso!");
        carregarLeads();
    } catch (err) {
        console.error(err);
        alert("❌ Erro ao anexar o PDF 1.");
        if (btn) {
            btn.innerText = "Anexar";
            btn.disabled = false;
        }
    }
}

export async function anexarPdf2(id) {
    const fileInput = document.getElementById(`file-pdf2-${id}`);
    const btn = document.getElementById(`btn-pdf2-${id}`);
    const file = fileInput?.files;

    if (!file) {
        alert("⚠️ Selecione o segundo arquivo PDF!");
        return;
    }

    if (btn) {
        btn.innerText = "Enviando...";
        btn.disabled = true;
    }

    try {
        const formData = new FormData();
        formData.append('pdf2', file);

        const res = await fetchComAuth(`${API_BASE}/admin/leads/${id}/pdf2`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Erro ao anexar PDF 2');

        alert("✅ Relatório Secundário PDF 2 anexado com sucesso!");
        carregarLeads();
    } catch (err) {
        console.error(err);
        alert("❌ Erro ao anexar o PDF 2.");
        if (btn) {
            btn.innerText = "Anexar";
            btn.disabled = false;
        }
    }
}

// 6. EXPAGINAÇÃO E VÍNCULO GLOBAL NO WINDOW
window.carregarLeads = carregarLeads;
window.realizarBuscaLeads = realizarBuscaLeads;
window.validarCaucao = validarCaucao;
window.aprovarLead = aprovarLead;
window.rejeitarLead = rejeitarLead;
window.efetivarLocacao = efetivarLocacao;
window.anexarPdf1 = anexarPdf1;
window.anexarPdf2 = anexarPdf2;