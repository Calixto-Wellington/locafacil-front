import { API_BASE } from './api.js';

export async function carregarLeads() {
    const filtro = document.getElementById('filtro-status').value;
    document.getElementById('loading-leads').style.display = 'block';
    document.getElementById('grid-leads').innerHTML = '';
    try {
        const res = await fetch(`${API_BASE}/admin/leads?status=${filtro}`);
        const fichas = await res.json();
        document.getElementById('loading-leads').style.display = 'none';
        renderizarLeads(fichas || []);
    } catch(e) { console.error(e); }
}

export async function realizarBuscaLeads() {
    carregarLeads();
}

function renderizarLeads(fichas) {
    const grid = document.getElementById('grid-leads');
    if (!fichas.length) { grid.innerHTML = `<div class="col-span-full bg-white p-8 text-center text-gray-500 font-bold uppercase">Nenhuma ficha encontrada.</div>`; return; }
    fichas.forEach(lead => {
        const dataEnvio = new Date(lead.created_at).toLocaleString('pt-BR');
        let badgeClass = lead.status === 'APROVADO' ? 'bg-blue-600 text-white' : lead.status === 'CONTRATADO' ? 'bg-green-600 text-white' : lead.status === 'REJEITADO' ? 'bg-red-600 text-white' : 'bg-yellow-500 text-black';
        let areaAcoes = lead.status === 'PENDENTE' ? `
            <div class="space-y-3"><button onclick="validarCaucao('${lead.nome}', '${lead.telefone}')" class="w-full bg-blue-600 text-white font-black py-3 rounded-lg text-xs uppercase">💬 1. Chamar no Whats (Caução)</button>
            <div class="flex space-x-2"><button onclick="aprovarLead('${lead.id}', '${lead.telefone}', '${lead.nome}')" class="flex-1 bg-green-600 text-white font-black py-3 rounded-lg text-xs uppercase">✅ 2. Aprovar</button><button onclick="rejeitarLead('${lead.id}', '${lead.telefone}', '${lead.nome}')" class="bg-red-100 text-red-600 font-black px-4 rounded-lg text-xs uppercase">Arquivar</button></div></div>` : lead.status === 'APROVADO' ? `
            <div class="space-y-3"><div class="bg-blue-50 border p-2.5 rounded-lg text-center font-bold text-blue-800 text-[11px] uppercase">🔵 Aprovado — Aguardando Retirada</div>
            <div class="flex space-x-2"><button onclick="efetivarLocacao('${lead.id}', '${lead.telefone}', '${lead.nome}', '${lead.cpf}', '${lead.email}', '${lead.moto_interesse}')" class="flex-1 bg-orange-600 text-white font-black py-3 rounded-xl text-xs uppercase shadow-md">🏍️ Entregar Moto</button><button onclick="rejeitarLead('${lead.id}', '${lead.telefone}', '${lead.nome}')" class="bg-red-100 text-red-600 font-black px-3 rounded-xl text-xs uppercase">Desistiu</button></div></div>` : `<div class="bg-black text-orange-500 border p-3 rounded-xl text-center font-black text-xs uppercase">🚀 Contrato Ativo</div>`;

        grid.innerHTML += `
            <div class="bg-white rounded-2xl shadow-lg border overflow-hidden">
                <div class="bg-black text-white p-4 flex justify-between items-center"><span class="font-bold text-xs text-gray-300">Recebido: ${dataEnvio}</span><span class="${badgeClass} text-[10px] font-black px-2 py-1 rounded uppercase">${lead.status}</span></div>
                <div class="p-5">
                    <div class="grid grid-cols-2 gap-3 mb-4 text-xs"><div><p class="text-gray-400 font-bold uppercase">Nome</p><p class="font-black text-base uppercase text-gray-900">${lead.nome}</p></div><div><p class="text-gray-400 font-bold uppercase">CPF</p><p class="font-bold text-gray-800">${lead.cpf}</p></div><div><p class="text-gray-400 font-bold uppercase">WhatsApp</p><p class="font-bold text-gray-800">${lead.telefone}</p></div><div><p class="text-gray-400 font-bold uppercase">Email</p><p class="font-bold text-gray-800">${lead.email}</p></div></div>
                    <div class="bg-orange-50 p-3 rounded-xl border border-orange-100 mb-4 text-xs"><p class="text-orange-600 font-black uppercase">Interesse</p><p class="font-bold text-gray-900 text-sm">${lead.moto_interesse} - ${lead.plano_interesse}</p></div>
                    <div class="grid grid-cols-2 gap-3 border-t pt-3 mb-4 text-xs"><a href="${lead.cnh_url}" target="_blank" class="text-center block bg-gray-100 py-2 rounded-lg font-bold">📄 Ver CNH</a><a href="${lead.comprovante_url}" target="_blank" class="text-center block bg-gray-100 py-2 rounded-lg font-bold">📄 Ver Comprovante</a></div>
                    ${areaAcoes}
                </div>
            </div>`;
    });
}

window.validarCaucao = (n, t) => window.open(`https://wa.me/55${t.replace(/\D/g, '')}?text=${encodeURIComponent(`Fala ${n}, tudo bem? Aqui é da LOCAFACILMOTOS! 🚀 Vamos alinhar a caução?`)}`, '_blank');
window.aprovarLead = async (id, t, n) => { window.open(`https://wa.me/55${t.replace(/\D/g, '')}?text=${encodeURIComponent(`Fala ${n}! Aprovado! 🚀 Bora agendar a caução?`)}`, '_blank'); await fetch(`${API_BASE}/admin/leads/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'APROVADO' }) }); carregarLeads(); };
window.rejeitarLead = async (id, t, n) => { const m = prompt("Motivo:"); if(m) { await fetch(`${API_BASE}/admin/leads/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'REJEITADO', motivo_recusa: m }) }); carregarLeads(); } };
window.efetivarLocacao = async (id, t, n, cpf, email, moto) => {
    const placa = prompt(`PLACA para ${n}:`); if (!placa) return;
    const km = parseInt(prompt("KM inicial:", "0")) || 0;
    await fetch(`${API_BASE}/admin/leads/${id}/efetivar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: n, cpf, telefone: t, email, moto_interesse: moto, placa, km_inicial: km }) });
    alert("Contrato efetivado!"); carregarLeads();
};