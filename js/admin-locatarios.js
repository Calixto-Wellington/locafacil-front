// ======================================================
// MÓDULO LOCATÁRIOS E FROTA - js/admin-locatarios.js
// ======================================================

import { API_BASE } from './api.js';

let dadosCSVProcessados = [];

function converterDataParaISO(dataStr) {
    if (!dataStr) return new Date().toISOString().split('T')[0];
    const partes = dataStr.trim().split('/');
    if (partes.length === 3) {
        return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
    }
    return dataStr;
}

// ------------------------------------------------------
// 1. CARREGAMENTO E BUSCA DA FROTA
// ------------------------------------------------------
export async function carregarLocatarios() {
    const loading = document.getElementById('loading-frota');
    if (loading) loading.style.display = 'block';
    try {
        const res = await fetch(`${API_BASE}/admin/locatarios`);
        const lista = await res.json() || [];
        if (loading) loading.style.display = 'none';
        renderizarFrota(lista);
    } catch (err) {
        console.error('Erro ao carregar frota:', err);
        if (loading) loading.style.display = 'none';
    }
}

export function buscarLocatario(query) {
    const termo = (query || document.getElementById('input-busca-frota')?.value || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.card-locatario');
    cards.forEach(card => {
        const texto = card.innerText.toLowerCase();
        card.style.display = texto.includes(termo) ? 'block' : 'none';
    });
}

function renderizarFrota(lista) {
    const container = document.getElementById('grid-frota') || document.getElementById('container-cards-frota');
    if (!container) return;
    container.innerHTML = '';

    if (!lista || lista.length === 0) {
        container.innerHTML = '<div class="col-span-full bg-white p-8 rounded-2xl text-center text-gray-500 font-bold uppercase">Nenhum piloto/moto cadastrado.</div>';
        return;
    }

    lista.forEach(item => {
        const kmAtual = item.km_atual || 0;
        const semanasPagas = item.semanas_pagas || item.semana_atual || 0;
        const pct = Math.min(100, Math.round((semanasPagas / 182) * 100));
        const coins = item.locafacil_coins || 0;
        const jsonFormatado = JSON.stringify(item).replace(/'/g, "&apos;");

        container.innerHTML += `
            <div class="card-locatario bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col justify-between">
                <div>
                    <!-- TOPO DO CARD -->
                    <div class="bg-gray-900 text-white p-4 flex justify-between items-center">
                        <div>
                            <span class="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">${item.placa || 'Sem Placa'}</span>
                            <h3 class="font-black text-lg uppercase mt-1 leading-tight">${item.nome || 'Piloto Sem Nome'}</h3>
                        </div>
                        <span class="text-2xl font-black text-orange-500">${semanasPagas} sem.</span>
                    </div>

                    <!-- CORPO DO CARD -->
                    <div class="p-5 space-y-4">
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <div><p class="text-gray-400 font-bold uppercase">Modelo</p><p class="font-bold text-gray-800">${item.modelo || 'Moto'}</p></div>
                            <div><p class="text-gray-400 font-bold uppercase">WhatsApp</p><p class="font-bold text-gray-800">${item.telefone || '-'}</p></div>
                        </div>

                        <!-- PROGRESSO -->
                        <div class="bg-gray-50 p-3 rounded-xl border border-gray-200">
                            <div class="flex justify-between items-center text-xs font-black text-gray-700 mb-1">
                                <span>Semana ${semanasPagas} Concluída</span>
                                <span>🪙 ${coins} Coins</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div class="bg-gradient-to-r from-orange-500 to-yellow-400 h-full rounded-full" style="width: ${pct}%"></div>
                            </div>
                        </div>

                        <!-- BARRAS VISUAIS DE DESGASTE DE PEÇAS (TELEMETRIA) -->
                        ${window.renderizarBarrasDesgasteMotos ? window.renderizarBarrasDesgasteMotos(kmAtual, item.componentes) : `
                            <div class="bg-orange-50 p-3 rounded-xl border border-orange-100 text-xs">
                                <p class="text-orange-900 font-bold uppercase">KM Atual do Painel</p>
                                <p class="font-black text-gray-900 text-base mt-0.5">${kmAtual.toLocaleString('pt-BR')} km</p>
                            </div>
                        `}
                    </div>
                </div>

                <!-- BOTÕES DE AÇÃO -->
                <div class="p-5 pt-0 space-y-2">
                    <button onclick="adicionarUmaSemana('${item.id}', '${item.cpf || ''}', '${item.telefone || ''}', '${item.nome || ''}', ${semanasPagas}, ${coins})"
                        class="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition uppercase text-xs shadow-md flex items-center justify-center gap-2">
                        💵 +1 Semana & +10 Coins (Baixar Pix)
                    </button>

                    <div class="flex gap-2">
                        <button onclick="resetarContadorPeca('${item.placa}', 'oleo', ${kmAtual})" 
                            class="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-2 rounded-xl text-xs uppercase transition">
                            🔧 Resetar Peça
                        </button>
                        <button onclick='abrirModalEditar(${jsonFormatado})' 
                            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-3 py-2 rounded-xl text-xs uppercase">
                            ✏️ Editar
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

// ------------------------------------------------------
// 2. AÇÕES RÁPIDAS
// ------------------------------------------------------
window.adicionarUmaSemana = async (id, cpf, tel, nome, sem, coins) => {
    const novasSemanas = sem + 1;
    const novosCoins = coins + 10;
    const primeiroNome = (nome || 'PILOTO').split(' ')[0].toUpperCase();
    const numLimpo = (tel || '').replace(/\D/g, '');
    const cpfLimpo = (cpf || '').replace(/\D/g, '');
    const pct = Math.min(100, Math.round((novasSemanas / 182) * 100));

    try {
        await fetch(`${API_BASE}/admin/locatarios/${id}/pagar-semana`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ semanas_pagas: novasSemanas, locafacil_coins: novosCoins })
        });

        const URL_PAINEL_CLIENTE = "https://cashback.locafacilmotos.com.br";
        const linkCliente = `${URL_PAINEL_CLIENTE}?cpf=${cpfLimpo}`;

        let textoProgresso = `🎉 *PARABÉNS! VOCÊ COMPLETOU ${novasSemanas} SEMANAS COM SUCESSO!* 🟢`;
        if (pct > 50) {
            textoProgresso = `🚀 *MAIS DA METADE DA MOTO JÁ É SUA! (${pct}% QUITADO — SEMANA ${novasSemanas} DE 182)* 🟢`;
        }

        const msg = `🚀 *PIX CONFIRMADO! MAIS UM PASSO RUMO À SUA MOTO!*\n\n` +
            `Fala ${primeiroNome}! Seu pagamento foi confirmado!\n` +
            `${textoProgresso}\n` +
            `🪙 *Bônus:* +10 Locafacil Coins creditados! (Saldo: ${novosCoins} Coins)\n\n` +
            `Acompanhe seu progresso e resgate prêmios em:\n👉 ${linkCliente}\n\n*LOCAFACILMOTOS — Parceria de verdade.* 👊`;

        window.open(`https://wa.me/55${numLimpo}?text=${encodeURIComponent(msg)}`, '_blank');
        carregarLocatarios();
    } catch (err) {
        console.error('Erro ao baixar semana:', err);
    }
};

export function abrirModalEditar(item) {
    if (!document.getElementById('modal-editar')) return;
    document.getElementById('edit-id').value = item.id || '';
    document.getElementById('edit-nome').value = item.nome || '';
    document.getElementById('edit-placa').value = item.placa || '';
    document.getElementById('edit-modelo').value = item.modelo || 'Honda CG 160 Start';
    document.getElementById('edit-telefone').value = item.telefone || '';
    document.getElementById('edit-cpf').value = item.cpf || '';
    document.getElementById('edit-semanas').value = item.semanas_pagas || 0;
    document.getElementById('edit-coins').value = item.locafacil_coins || 0;
    document.getElementById('edit-km-atual').value = item.km_atual || 0;
    document.getElementById('modal-editar').classList.remove('hidden');
}

export function fecharModal() {
    if (document.getElementById('modal-editar')) {
        document.getElementById('modal-editar').classList.add('hidden');
    }
}

// ------------------------------------------------------
// 3. IMPORTADOR CSV MOBILTRACKER
// ------------------------------------------------------
export function abrirModalImportarCSV() {
    dadosCSVProcessados = [];
    const container = document.getElementById('container-preview-csv');
    if (container) container.classList.add('hidden');
    const input = document.getElementById('input-file-csv');
    if (input) input.value = '';
    const modal = document.getElementById('modal-importar-csv');
    if (modal) modal.classList.remove('hidden');
}

export function fecharModalImportarCSV() {
    const modal = document.getElementById('modal-importar-csv');
    if (modal) modal.classList.add('hidden');
}

export function processarArquivoCSV(event) {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const conteudo = e.target.result;
        const linhas = conteudo.split(/\r?\n/);
        
        dadosCSVProcessados = [];
        const tbody = document.getElementById('tbody-preview-csv');
        if (tbody) tbody.innerHTML = '';

        if (linhas.length < 2) return;

        const cabecalho = linhas[0].split(';').map(c => c.trim().replace(/"/g, ''));
        let dataInicioISO = new Date().toISOString().split('T')[0];
        let dataFimISO = new Date().toISOString().split('T')[0];

        if (cabecalho.length >= 4) {
            dataInicioISO = converterDataParaISO(cabecalho[2]);
            dataFimISO = converterDataParaISO(cabecalho[cabecalho.length - 2]);
        }

        let listaLocatarios = [];
        try {
            const resLoc = await fetch(`${API_BASE}/admin/locatarios`);
            listaLocatarios = await resLoc.json() || [];
        } catch (err) {
            console.error('Erro ao buscar locatários:', err);
        }

        linhas.forEach((linha, index) => {
            if (index === 0 || !linha.trim()) return;

            const colunas = linha.split(';').map(c => c.trim().replace(/"/g, ''));
            if (colunas.length < 3) return;

            const identificadorOriginal = colunas[0] || '';
            const placaLimpa = identificadorOriginal.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const valorTotalStr = colunas[colunas.length - 1] || '0';
            const kmRodados = Math.round(parseFloat(valorTotalStr.replace('.', '').replace(',', '.')) || 0);

            if (placaLimpa && kmRodados > 0) {
                const locatarioEncontrado = listaLocatarios.find(l => 
                    (l.placa || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === placaLimpa
                );

                const semanaReal = locatarioEncontrado 
                    ? (locatarioEncontrado.semanas_pagas || locatarioEncontrado.semana_atual || 1) 
                    : 1;

                const item = {
                    locatario_id: locatarioEncontrado ? locatarioEncontrado.id : null,
                    placa: placaLimpa,
                    placa_exibicao: identificadorOriginal,
                    km_rodados: kmRodados,
                    km_anterior: locatarioEncontrado ? (locatarioEncontrado.km_atual || 0) : 0,
                    semana: semanaReal,
                    data_inicio: dataInicioISO,
                    data_fim: dataFimISO,
                    status: locatarioEncontrado ? 'VALIDO' : 'NAO_ENCONTRADO',
                    nome: locatarioEncontrado ? locatarioEncontrado.nome : 'Placa não cadastrada'
                };

                dadosCSVProcessados.push(item);

                if (tbody) {
                    tbody.innerHTML += `
                        <tr class="${item.status === 'VALIDO' ? 'text-gray-900 border-b border-gray-100' : 'text-red-500 bg-red-50 border-b border-red-100'}">
                            <td class="p-2 font-black">${item.placa_exibicao} <span class="text-[10px] text-gray-400 block font-normal">${item.nome} (Semana ${item.semana})</span></td>
                            <td class="p-2 text-orange-600 font-black">+${item.km_rodados.toLocaleString('pt-BR')} km</td>
                            <td class="p-2">
                                ${item.status === 'VALIDO' 
                                    ? '<span class="text-green-700 bg-green-100 font-bold px-2 py-0.5 rounded text-[10px]">🟢 Pronta</span>' 
                                    : '<span class="text-red-700 bg-red-100 font-bold px-2 py-0.5 rounded text-[10px]">⚠️ Não Encontrada</span>'}
                            </td>
                        </tr>
                    `;
                }
            }
        });

        const qtdValidos = dadosCSVProcessados.filter(d => d.status === 'VALIDO').length;
        const elQtd = document.getElementById('qtd-veiculos-csv');
        if (elQtd) elQtd.innerText = `${qtdValidos} de ${dadosCSVProcessados.length} veículos identificados`;

        document.getElementById('container-preview-csv')?.classList.remove('hidden');
    };

    reader.readAsText(file, 'ISO-8859-1');
}

export async function confirmarImportacaoCSV() {
    const validos = dadosCSVProcessados.filter(d => d.status === 'VALIDO');

    if (validos.length === 0) {
        alert('Nenhum veículo válido encontrado para atualizar.');
        return;
    }

    const btnConfirmar = document.querySelector("#modal-importar-csv button[onclick='confirmarImportacaoCSV()']");
    if (btnConfirmar) {
        btnConfirmar.disabled = true;
        btnConfirmar.innerText = '⏳ Gravando no banco...';
    }

    try {
        for (const item of validos) {
            const novoKmTotal = item.km_anterior + item.km_rodados;

            await fetch(`${API_BASE}/admin/rastreador`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locatario_id: item.locatario_id,
                    placa: item.placa,
                    semana: item.semana,
                    data_inicio: item.data_inicio,
                    data_fim: item.data_fim,
                    km_anterior: item.km_anterior,
                    km_atual: novoKmTotal,
                    km_rodados: item.km_rodados,
                    observacao: 'Importação CSV Mobiltracker'
                })
            });
        }

        alert(`✅ Sucesso! Telemetria gravada com datas e semanas reais!`);
        fecharModalImportarCSV();
        if (typeof carregarLocatarios === 'function') carregarLocatarios();

    } catch (err) {
        console.error('Erro ao importar CSV:', err);
        alert(`❌ Erro ao gravar dados: ${err.message}`);
    } finally {
        if (btnConfirmar) {
            btnConfirmar.disabled = false;
            btnConfirmar.innerText = '💾 Confirmar e Atualizar Frota';
        }
    }
}