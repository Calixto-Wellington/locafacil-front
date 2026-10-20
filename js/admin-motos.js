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