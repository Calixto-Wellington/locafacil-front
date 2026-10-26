import { API_BASE } from './api.js';

export async function carregarLocatarios() {
    document.getElementById('loading-frota').style.display = 'block';
    const res = await fetch(`${API_BASE}/admin/locatarios`);
    const lista = await res.json();
    document.getElementById('loading-frota').style.display = 'none';
    renderizarFrota(lista || []);
}

export async function buscarLocatario() { 
    carregarLocatarios(); 
}

function renderizarFrota(lista) {
    const grid = document.getElementById('grid-frota'); grid.innerHTML = '';
    if (!lista.length) { grid.innerHTML = `<div class="col-span-full bg-white p-8 text-center uppercase font-bold text-gray-500">Nenhum piloto.</div>`; return; }
    lista.forEach(item => {
        const pct = Math.min(100, Math.round(((item.semanas_pagas || 0) / 182) * 100));
        grid.innerHTML += `
            <div class="bg-white rounded-2xl shadow-lg border overflow-hidden flex flex-col justify-between">
                <div class="bg-gray-900 text-white p-4 flex justify-between items-center"><div><span class="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">${item.placa}</span><h3 class="font-black text-lg uppercase mt-1">${item.nome}</h3></div><span class="text-2xl font-black text-orange-500">${item.semanas_pagas || 0} sem.</span></div>
                <div class="p-5 space-y-4">
                    <div class="grid grid-cols-2 gap-2 text-xs"><div>Modelo<br><b>${item.modelo}</b></div><div>WhatsApp<br><b>${item.telefone}</b></div></div>
                    <div class="bg-gray-50 p-3 rounded-xl border"><div class="flex justify-between text-xs font-black mb-1"><span>Semana ${item.semanas_pagas || 0}</span><span>🪙 ${item.locafacil_coins || 0} Coins</span></div><div class="w-full bg-gray-200 rounded-full h-3"><div class="bg-orange-500 h-full rounded-full" style="width: ${pct}%"></div></div></div>
                    <div class="bg-orange-50 p-3 rounded-xl border text-xs"><p class="text-orange-900 font-bold uppercase">Hodômetro</p><p class="font-black text-gray-900 text-base">${(item.km_atual || 0).toLocaleString('pt-BR')} km</p></div>
                </div>
                <div class="p-5 pt-0 space-y-2">
                    <button onclick="adicionarUmaSemana('${item.id}', '${item.cpf}', '${item.telefone}', '${item.nome}', ${item.semanas_pagas || 0}, ${item.locafacil_coins || 0})" class="w-full bg-green-600 text-white font-black py-3 rounded-xl text-xs uppercase shadow-md">💵 +1 Semana (Baixar Pix)</button>
                    <div class="flex gap-2"><button onclick="lancarKmRastreador('${item.id}', '${item.placa}', ${item.semanas_pagas || 0}, ${item.km_atual || 0})" class="flex-1 bg-indigo-50 text-indigo-800 font-bold py-2 rounded-lg text-xs uppercase border">📡 Rastreador</button><button onclick='abrirModalEditar(${JSON.stringify(item)})' class="bg-gray-900 text-white font-bold px-3 py-2 rounded-lg text-xs uppercase">✏️ Editar</button></div>
                </div>
            </div>`;
    });
}

// LÊ E PROCESSA O ARQUIVO CSV REAL DE QUILOMETRAGEM
export function processarArquivoCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const conteudo = e.target.result;
        const linhas = conteudo.split(/\r?\n/);
        
        dadosCSVProcessados = [];
        const tbody = document.getElementById('tbody-preview-csv');
        if (tbody) tbody.innerHTML = '';

        // Busca a lista de locatários ativos para cruzar as placas
        let listaLocatarios = [];
        try {
            const resLoc = await fetch(`${API_BASE}/admin/locatarios`);
            listaLocatarios = await resLoc.json() || [];
        } catch (err) {
            console.error('Erro ao buscar locatários:', err);
        }

        linhas.forEach((linha, index) => {
            if (index === 0 || !linha.trim()) return; // Pula o cabeçalho (id;nome;17/10;...) e linhas vazias

            // Separa as colunas pelo ponto e vírgula (;)
            const colunas = linha.split(';').map(c => c.trim().replace(/"/g, ''));

            if (colunas.length < 3) return;

            // Coluna 1 (nome) contêm a placa (Ex: "TKA3e77", "URX-7J14")
            const identificadorOriginal = colunas[1] || '';
            const placaLimpa = identificadorOriginal.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

            // Última coluna contém a soma total da rodagem (Ex: "1233,36")
            const valorTotalStr = colunas[colunas.length - 1] || '0';
            const kmRodados = Math.round(parseFloat(valorTotalStr.replace('.', '').replace(',', '.')) || 0);

            if (placaLimpa && kmRodados > 0) {
                // Procura a moto no banco de dados pela placa limpa
                const locatarioEncontrado = listaLocatarios.find(l => 
                    (l.placa || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === placaLimpa
                );

                const item = {
                    locatario_id: locatarioEncontrado ? locatarioEncontrado.id : null,
                    placa: placaLimpa,
                    placa_exibicao: identificadorOriginal,
                    km_rodados: kmRodados,
                    km_anterior: locatarioEncontrado ? (locatarioEncontrado.km_atual || 0) : 0,
                    status: locatarioEncontrado ? 'VALIDO' : 'NAO_ENCONTRADO',
                    nome: locatarioEncontrado ? locatarioEncontrado.nome : 'Placa não cadastrada na frota'
                };

                dadosCSVProcessados.push(item);

                // Injeta a linha na pré-visualização do modal
                if (tbody) {
                    tbody.innerHTML += `
                        <tr class="${item.status === 'VALIDO' ? 'text-gray-900 border-b border-gray-100' : 'text-red-500 bg-red-50 border-b border-red-100'}">
                            <td class="p-2 font-black">${item.placa_exibicao} <span class="text-[10px] text-gray-400 block font-normal">${item.nome}</span></td>
                            <td class="p-2 text-orange-600 font-black">+${item.km_rodados.toLocaleString('pt-BR')} km</td>
                            <td class="p-2">
                                ${item.status === 'VALIDO' 
                                    ? '<span class="text-green-700 bg-green-100 font-bold px-2 py-0.5 rounded text-[10px]">🟢 Mapeada</span>' 
                                    : '<span class="text-red-700 bg-red-100 font-bold px-2 py-0.5 rounded text-[10px]">⚠️ Não Encontrada</span>'}
                            </td>
                        </tr>
                    `;
                }
            }
        });

        // ======================================================
// MÓDULO IMPORTADOR DE CSV MOBILTRACKER
// ======================================================
let dadosCSVProcessados = [];

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
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const conteudo = e.target.result;
        const linhas = conteudo.split(/\r?\n/);
        
        dadosCSVProcessados = [];
        const tbody = document.getElementById('tbody-preview-csv');
        if (tbody) tbody.innerHTML = '';

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

            const identificadorOriginal = colunas[1] || '';
            const placaLimpa = identificadorOriginal.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const valorTotalStr = colunas[colunas.length - 1] || '0';
            const kmRodados = Math.round(parseFloat(valorTotalStr.replace('.', '').replace(',', '.')) || 0);

            if (placaLimpa && kmRodados > 0) {
                const locatarioEncontrado = listaLocatarios.find(l => 
                    (l.placa || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === placaLimpa
                );

                const item = {
                    locatario_id: locatarioEncontrado ? locatarioEncontrado.id : null,
                    placa: placaLimpa,
                    placa_exibicao: identificadorOriginal,
                    km_rodados: kmRodados,
                    km_anterior: locatarioEncontrado ? (locatarioEncontrado.km_atual || 0) : 0,
                    status: locatarioEncontrado ? 'VALIDO' : 'NAO_ENCONTRADO',
                    nome: locatarioEncontrado ? locatarioEncontrado.nome : 'Placa não cadastrada'
                };

                dadosCSVProcessados.push(item);

                if (tbody) {
                    tbody.innerHTML += `
                        <tr class="${item.status === 'VALIDO' ? 'text-gray-900 border-b border-gray-100' : 'text-red-500 bg-red-50 border-b border-red-100'}">
                            <td class="p-2 font-black">${item.placa_exibicao} <span class="text-[10px] text-gray-400 block font-normal">${item.nome}</span></td>
                            <td class="p-2 text-orange-600 font-black">+${item.km_rodados.toLocaleString('pt-BR')} km</td>
                            <td class="p-2">
                                ${item.status === 'VALIDO' 
                                    ? '<span class="text-green-700 bg-green-100 font-bold px-2 py-0.5 rounded text-[10px]">🟢 Mapeada</span>' 
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

    try {
        const hoje = new Date().toISOString().split('T')[0];

        for (const item of validos) {
            const novoKmTotal = item.km_anterior + item.km_rodados;

            await fetch(`${API_BASE}/admin/rastreador`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locatario_id: item.locatario_id,
                    placa: item.placa,
                    semana: 0,
                    data_inicio: hoje,
                    data_fim: hoje,
                    km_anterior: item.km_anterior,
                    km_atual: novoKmTotal,
                    km_rodados: item.km_rodados,
                    observacao: 'Importação CSV Mobiltracker'
                })
            });
        }

        alert(`✅ Sucesso! Telemetria de ${validos.length} veículos atualizada!`);
        fecharModalImportarCSV();
        if (typeof carregarLocatarios === 'function') carregarLocatarios();

    } catch (err) {
        console.error('Erro ao importar CSV:', err);
        alert(`❌ Erro ao gravar dados: ${err.message}`);
    }
}

        const qtdValidos = dadosCSVProcessados.filter(d => d.status === 'VALIDO').length;
        const elQtd = document.getElementById('qtd-veiculos-csv');
        if (elQtd) elQtd.innerText = `${qtdValidos} de ${dadosCSVProcessados.length} veículos identificados`;

        document.getElementById('container-preview-csv')?.classList.remove('hidden');
    };

    reader.readAsText(file, 'ISO-8859-1');
}

window.adicionarUmaSemana = async (id, cpf, tel, nome, sem, coins) => {
    const resC = await fetch(`${API_BASE}/admin/config/coins_por_pix`); const dC = await resC.json();
    const inc = parseInt(dC.valor) || 10;
    await fetch(`${API_BASE}/admin/locatarios/${id}/pagar-semana`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ semanas_pagas: sem + 1, locafacil_coins: coins + inc }) });
    window.open(`https://wa.me/55${tel.replace(/\D/g, '')}?text=${encodeURIComponent(`Fala ${nome.split(' ')[0]}! Pix confirmado, semana ${sem + 1} registrada! +${inc} Coins 🪙`)}`, '_blank');
    carregarLocatarios();
};

window.lancarKmRastreador = async (id, placa, sem, kmAnt) => {
    const ini = prompt("Data inicial (AAAA-MM-DD):", "2026-09-20"); if (!ini) return;
    const fim = prompt("Data final (AAAA-MM-DD):", "2026-09-27"); if (!fim) return;
    const rodados = parseInt(prompt("KM rodados:", "0")) || 0;
    const novoKm = kmAnt + rodados;
    await fetch(`${API_BASE}/admin/rastreador`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locatario_id: id, placa, semana: sem, data_inicio: ini, data_fim: fim, km_anterior: kmAnt, km_atual: novoKm, km_rodados: rodados, observacao: 'Rastreador' }) });
    alert("KM registrado!"); carregarLocatarios();
};

export function abrirModalEditar(item) {
    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-nome').value = item.nome || '';
    document.getElementById('edit-placa').value = item.placa || '';
    document.getElementById('edit-modelo').value = item.modelo || '';
    document.getElementById('edit-telefone').value = item.telefone || '';
    document.getElementById('edit-cpf').value = item.cpf || '';
    document.getElementById('edit-semanas').value = item.semanas_pagas || 0;
    document.getElementById('edit-coins').value = item.locafacil_coins || 0;
    document.getElementById('edit-km-atual').value = item.km_atual || 0;
    document.getElementById('modal-editar').classList.remove('hidden');
}

export function fecharModal() {
    document.getElementById('modal-editar').classList.add('hidden');
}