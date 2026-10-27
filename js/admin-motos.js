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
// 1. MEDIDOR VISUAL DE DESGASTE DE PEÇAS (PORCENTAGEM + BARRA)
// ------------------------------------------------------
export function renderizarBarrasDesgasteMotos(kmAtual = 0, componentes = []) {
    if (!componentes || componentes.length === 0) {
        // Metas padrão do Mobiltracker se não houver registros prévios
        componentes = [
            { id: 'oleo', nome: '🛢️ Troca de Óleo', km_troca: Math.max(0, kmAtual - 800), limite_km: 1000 },
            { id: 'pneu_tras', nome: '🛞 Pneu Traseiro', km_troca: Math.max(0, kmAtual - 6200), limite_km: 8000 },
            { id: 'pneu_diant', nome: '🛞 Pneu Dianteiro / Freios', km_troca: Math.max(0, kmAtual - 4500), limite_km: 10000 },
            { id: 'relacao', nome: '⚙️ Kit Relação', km_troca: Math.max(0, kmAtual - 7800), limite_km: 10000 }
        ];
    }

    let html = '<div class="mt-3 p-3 bg-white border border-gray-200 rounded-xl space-y-2 shadow-sm">';
    html += `<h5 class="text-[10px] font-black uppercase text-gray-500 tracking-wider flex justify-between">
                <span>📊 Desgaste de Peças (Telemetria)</span>
                <span class="text-indigo-600">KM Atual: ${kmAtual.toLocaleString('pt-BR')} km</span>
            </h5>`;

    componentes.forEach(peca => {
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
            badgeStatus = `🟡 ${percentualDesgaste}% gasto (Trocar em breve)`;
        }

        html += `
            <div class="space-y-1 pt-1 border-t border-gray-100 first:border-0 first:pt-0">
                <div class="flex justify-between items-center text-xs font-bold">
                    <span class="text-gray-800">${peca.nome}</span>
                    <span class="text-[10px] ${corTexto}">${badgeStatus}</span>
                </div>
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
// 2. RESET DE PEÇA INTERATIVO (ESCOLHA DA PEÇA + DIGITAÇÃO DO KM)
// ------------------------------------------------------
export async function resetarContadorPeca(placa, componenteIdPadrao, kmAtual) {
    // 1. Popup para selecionar qual peça foi trocada
    const opcao = prompt(
        `🔧 REGISTRO DE MANUTENÇÃO - MOTO ${placa}\n\n` +
        `Digite o número correspondente à peça trocada:\n` +
        `1 - 🛢️ Troca de Óleo (Limite: 1.000 km)\n` +
        `2 - 🛞 Pneu Traseiro (Limite: 8.000 km)\n` +
        `3 - 🛞 Pneu Dianteiro / Freios (Limite: 10.000 km)\n` +
        `4 - ⚙️ Kit Relação (Limite: 10.000 km)`
    );

    if (!opcao) return;

    let pecaId = 'oleo';
    let limite = 1000;
    
    if (opcao === '2') { pecaId = 'pneu_tras'; limite = 8000; }
    else if (opcao === '3') { pecaId = 'pneu_diant'; limite = 10000; }
    else if (opcao === '4') { pecaId = 'relacao'; limite = 10000; }
    else if (opcao !== '1') {
        alert('Opção inválida.');
        return;
    }

    // 2. Popup para informar o KM em que a peça foi trocada
    const kmDigitado = prompt(`Digite o KM exato do odômetro em que a peça foi trocada:`, kmAtual);
    if (kmDigitado === null) return;

    const kmTrocaReal = parseInt(kmDigitado, 10);
    if (isNaN(kmTrocaReal)) {
        alert('Por favor, digite um número de KM válido.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/admin/manutencao-componentes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                placa: placa,
                componente_id: pecaId,
                km_troca: kmTrocaReal,
                limite_km: limite
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert(`✅ Troca de peça registrada com sucesso no KM ${kmTrocaReal.toLocaleString('pt-BR')}!`);
            if (typeof carregarLocatarios === 'function') carregarLocatarios();
        } else {
            alert(`❌ Erro ao salvar: ${data.error || 'Erro interno'}`);
        }
    } catch (err) {
        console.error('Erro ao registrar troca:', err);
        alert('❌ Erro de conexão ao salvar troca.');
    }
}

// ------------------------------------------------------
// 3. GESTÃO DE MOTOS DA FROTA
// ------------------------------------------------------
export async function carregarMotosFrota() {
    try {
        const res = await fetch(`${API_BASE}/admin/motos`);
        const lista = await res.json() || [];
        console.log('Motos carregadas:', lista.length);
    } catch (err) {
        console.error('Erro ao carregar motos:', err);
    }
}

export function salvarNovaMoto() {}
export function mudarStatusMoto() {}
export function excluirMoto() {}
export function abrirModalEditarMoto() {}
export function fecharModalMoto() {}
