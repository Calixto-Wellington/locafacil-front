// ======================================================
// MÓDULO DE LEADS E MESA DE APROVAÇÃO - js/admin-leads.js
// ======================================================

import { fetchComAuth } from './auth.js';
import { API_BASE } from './api.js';

export async function carregarLeads() {
    const filtro = document.getElementById('filtro-status')?.value || 'PENDENTE';
    const loading = document.getElementById('loading-leads');
    const grid = document.getElementById('grid-leads');

    if (loading) loading.style.display = 'block';
    if (grid) grid.innerHTML = '';
    
    try {
        const res = await fetchComAuth(`${API_BASE}/admin/leads?status=${filtro}`);
        if (!res.ok) return;
        const fichas = await res.json();
        
        if (loading) loading.style.display = 'none';
        renderizarLeads(fichas || []);
    } catch (e) { 
        console.error('Erro ao carregar leads:', e);
        if (loading) loading.style.display = 'none';
    }
}

export async function realizarBuscaLeads() {
    carregarLeads();
}

function renderizarLeads(fichas) {
    const grid = document.getElementById('grid-leads');
    if (!grid) return;
    
    if (!fichas || fichas.length === 0) { 
        grid.innerHTML = `<div class="col-span-full bg-white p-8 text-center text-gray-500 font-bold uppercase">Nenhuma ficha encontrada nesta visualização.</div>`; 
        return; 
    }
    
    grid.innerHTML = '';

    fichas.forEach(lead => {
        const dataEnvio = lead.created_at ? new Date(lead.created_at).toLocaleString('pt-BR') : 'Data n/a';
        const statusAtual = (lead.status || 'PENDENTE').toUpperCase();
        
        let badgeClass = 'bg-yellow-500 text-black';
        if (statusAtual === 'APROVADO') badgeClass = 'bg-blue-600 text-white';
        else if (statusAtual === 'CONTRATADO') badgeClass = 'bg-green-600 text-white';
        else if (statusAtual === 'REJEITADO') badgeClass = 'bg-red-600 text-white';

        let areaAcoes = '';
        const nomeSanitizado = (lead.nome || '').replace(/'/g, "\\'");
        const telSanitizado = (lead.telefone || '').replace(/'/g, "\\'");
        const cpfSanitizado = (lead.cpf || '').replace(/'/g, "\\'");
        const emailSanitizado = (lead.email || '').replace(/'/g, "\\'");
        const motoSanitizada = (lead.moto_interesse || '').replace(/'/g, "\\'");

        if (statusAtual === 'PENDENTE') {
            areaAcoes = `
                <div class="space-y-3">
                    <button type="button" onclick="validarCaucao('${nomeSanitizado}', '${telSanitizado}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-lg transition uppercase text-xs flex items-center justify-center gap-2">
                        💬 1. Chamar no Whats (Caução)
                    </button>
                    <div class="flex space-x-2">
                        <button type="button" onclick="aprovarLead('${lead.id}', '${telSanitizado}', '${nomeSanitizado}')" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-lg transition uppercase text-xs">
                            ✅ 2. Aprovar
                        </button>
                        <button type="button" onclick="rejeitarLead('${lead.id}', '${telSanitizado}', '${nomeSanitizado}')" class="bg-red-100 hover:bg-red-200 text-red-600 font-black px-4 rounded-lg transition uppercase text-xs">
                            Arquivar
                        </button>
                    </div>
                </div>`;
        } else if (statusAtual === 'APROVADO') {
            areaAcoes = `
                <div class="space-y-3">
                    <div class="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-center font-bold text-blue-800 uppercase text-[11px]">
                        🔵 Ficha Aprovada — Aguardando Caução / Retirada
                    </div>
                    <div class="flex space-x-2">
                        <button type="button" onclick="efetivarLocacao('${lead.id}', '${telSanitizado}', '${nomeSanitizado}', '${cpfSanitizado}', '${emailSanitizado}', '${motoSanitizada}')" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-xl transition uppercase text-xs shadow-md">
                            🏍️ Entregar Moto
                        </button>
                        <button type="button" onclick="rejeitarLead('${lead.id}', '${telSanitizado}', '${nomeSanitizado}')" class="bg-red-100 hover:bg-red-200 text-red-600 font-black px-3 rounded-xl transition uppercase text-xs">
                            Desistiu
                        </button>
                    </div>
                </div>`;
        } else if (statusAtual === 'CONTRATADO') {
            areaAcoes = `<div class="bg-black text-orange-500 border-2 border-orange-500 p-3 rounded-xl text-center font-black text-xs uppercase">🚀 Contrato Ativo: Moto Entregue</div>`;
        } else if (statusAtual === 'REJEITADO') {
            areaAcoes = `<div class="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-center font-bold text-xs uppercase">❌ Ficha Rejeitada / Arquivada ${lead.motivo_recusa ? `(${lead.motivo_recusa})` : ''}</div>`;
        } else {
            areaAcoes = `<div class="bg-gray-100 text-gray-700 border p-3 rounded-xl text-center font-bold text-xs uppercase">${statusAtual}</div>`;
        }

        grid.innerHTML += `
            <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div class="bg-black text-white p-4 flex justify-between items-center">
                    <span class="font-bold text-xs text-gray-300">Recebido: ${dataEnvio}</span>
                    <span class="${badgeClass} text-[10px] font-black px-2 py-1 rounded uppercase">${statusAtual}</span>
                </div>
                <div class="p-5">
                    <div class="grid grid-cols-2 gap-3 mb-4 text-xs">
                        <div><p class="text-gray-400 font-bold uppercase">Nome</p><p class="font-black text-base uppercase text-gray-900">${lead.nome || 'N/A'}</p></div>
                        <div><p class="text-gray-400 font-bold uppercase">CPF</p><p class="font-bold text-gray-800">${lead.cpf || 'N/A'}</p></div>
                        <div><p class="text-gray-400 font-bold uppercase">WhatsApp</p><p class="font-bold text-gray-800">${lead.telefone || 'N/A'}</p></div>
                        <div><p class="text-gray-400 font-bold uppercase">Email</p><p class="font-bold text-gray-800">${lead.email || 'N/A'}</p></div>
                    </div>
                    <div class="bg-orange-50 p-3 rounded-xl border border-orange-100 mb-4 text-xs">
                        <p class="text-orange-600 font-black uppercase">Interesse</p>
                        <p class="font-bold text-gray-900 text-sm">${lead.moto_interesse || 'Não informado'} - ${lead.plano_interesse || 'Padrão'}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 mb-4 text-xs">
                        <a href="${lead.cnh_url || '#'}" target="_blank" class="text-center block bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-bold text-gray-800 transition">📄 Ver CNH</a>
                        <a href="${lead.comprovante_url || '#'}" target="_blank" class="text-center block bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-bold text-gray-800 transition">📄 Ver Comprovante</a>
                    </div>
                    ${areaAcoes}
                </div>
            </div>`;
    });
}

export function validarCaucao(n, t) {
    const num = (t || '').replace(/\D/g, '');
    const msg = `Fala ${n}, tudo bem? Aqui é da LOCAFACILMOTOS! 🚀 Vamos alinhar a caução?`;
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
}

export async function aprovarLead(id, t, n) {
    const num = (t || '').replace(/\D/g, '');
    const msg = `Fala ${n}! Sua ficha na LOCAFACILMOTOS foi *APROVADA*! 🚀\n\nBora agendar o pagamento da caução e a retirada da sua moto?`;
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');

    try {
        await fetchComAuth(`${API_BASE}/admin/leads/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'APROVADO' })
        });
        carregarLeads();
    } catch (e) {
        console.error('Erro ao aprovar lead:', e);
    }
}

export async function rejeitarLead(id, t, n) {
    const m = prompt(`Digite o motivo do arquivamento para ${n}:`);
    if (!m || !m.trim()) return;

    try {
        await fetchComAuth(`${API_BASE}/admin/leads/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'REJEITADO', motivo_recusa: m })
        });
        carregarLeads();
    } catch (e) {
        console.error('Erro ao rejeitar lead:', e);
    }
}

export async function efetivarLocacao(id, t, n, cpf, email, moto) {
    const placa = prompt(`MOTO ENTREGUE! Digite a PLACA vinculada ao piloto ${n}:`);
    if (!placa || !placa.trim()) return alert("⚠️ A placa é obrigatória!");

    const km = parseInt(prompt("KM inicial do painel:", "0"), 10) || 0;

    try {
        const res = await fetchComAuth(`${API_BASE}/admin/leads/${id}/efetivar`, {
            method: 'POST',
            body: JSON.stringify({ 
                nome: n, 
                cpf, 
                telefone: t, 
                email, 
                moto_interesse: moto, 
                placa: placa.trim().toUpperCase(), 
                km_inicial: km 
            })
        });

        if (res.ok) {
            alert("✅ Contrato efetivado com sucesso!");
            carregarLeads();
            if (typeof window.carregarLocatarios === 'function') window.carregarLocatarios();
        } else {
            const errData = await res.json();
            alert(`❌ Erro ao efetivar: ${errData.error || 'Erro desconhecido'}`);
        }
    } catch (e) {
        console.error('Erro ao efetivar locação:', e);
    }
}

// Vinculação global no window
window.carregarLeads = carregarLeads;
window.realizarBuscaLeads = realizarBuscaLeads;
window.validarCaucao = validarCaucao;
window.aprovarLead = aprovarLead;
window.rejeitarLead = rejeitarLead;
window.efetivarLocacao = efetivarLocacao;