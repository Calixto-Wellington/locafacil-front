document.addEventListener('DOMContentLoaded', () => {
    carregarMotosLocal();
    configurarEventosModal();
});

function carregarMotosLocal() {
    const container = document.getElementById('grid-motos');
    if (!container) return;

    // Dados estáticos direto no front para teste imediato
    const motos = [
        {
            id: 1,
            nome: "HONDA CG 160 START",
            imagem_url: "https://xbjwhjwqwmllbrybpycd.supabase.co/storage/v1/object/public/frota/moto-honda.png",
            planos: [
                { titulo: "Plano Semestral", valor_diaria: "55,71", valor_semanal: "390,00", valor_caucao: "650,00" },
                { titulo: "Plano Anual", valor_diaria: "54,29", valor_semanal: "380,00", valor_caucao: "650,00" },
                { titulo: "Plano Minha Locafacil<br>(38 meses)", valor_diaria: "50,00", valor_semanal: "350,00", valor_caucao: "650,00", observacao: "Toda manutenção por conta do locatário" }
            ]
        },
        {
            id: 2,
            nome: "YAMAHA FACTOR 150 DX",
            imagem_url: "https://xbjwhjwqwmllbrybpycd.supabase.co/storage/v1/object/public/frota/factor.jpeg",
            planos: [
                { titulo: "Plano Semestral", valor_diaria: "55,71", valor_semanal: "390,00", valor_caucao: "650,00" },
                { titulo: "Plano Anual", valor_diaria: "54,28", valor_semanal: "380,00", valor_caucao: "650,00" },
                { titulo: "Plano Minha Locafacil<br>(38 meses)", valor_diaria: "50,00", valor_semanal: "350,00", valor_caucao: "650,00", observacao: "Toda manutenção por conta do locatário" }
            ]
        }
    ];

    container.innerHTML = motos.map(moto => criarCardMoto(moto)).join('');
}

function criarCardMoto(moto) {
    const planosHtml = moto.planos.map((plano, index) => `
        <div class="${index < moto.planos.length - 1 ? 'py-8 border-b border-gray-200' : 'py-8'}">
            <h4 class="font-extrabold text-xl text-gray-900 mb-4">${plano.titulo}</h4>
            <p class="text-xs text-gray-600 font-medium mb-1">Diária à partir de</p>
            <div class="text-3xl font-black text-gray-900 mb-1">R$ ${plano.valor_diaria}</div>
            <p class="text-xs text-gray-500 mb-5">por dia</p>
            <p class="text-sm font-bold text-gray-800 mb-2">R$ ${plano.valor_semanal} por semana</p>
            <p class="text-xs font-medium text-gray-600">Valor do caução de R$ ${plano.valor_caucao}</p>
            ${plano.observacao ? `<p class="text-xs font-medium text-gray-600 mt-1">${plano.observacao}</p>` : ''}
        </div>
    `).join('');

    return `
        <div class="bg-white rounded-2xl shadow-2xl border-t-4 border-orange-600 overflow-hidden transform hover:-translate-y-2 transition duration-300 w-full max-w-md mx-auto relative flex flex-col">
            <div class="p-8 border-b border-gray-100 bg-gray-50">
                <img src="${moto.imagem_url}" alt="${moto.nome}" class="h-40 mx-auto object-contain drop-shadow-md">
                <h3 class="text-3xl font-black mt-6 text-gray-900 uppercase">${moto.nome}</h3>
            </div>

            <div class="px-8 pb-8 flex-grow flex flex-col justify-between">
                <div>
                    ${planosHtml}
                </div>

                <button onclick="abrirModal()"
                    class="block w-full bg-orange-600 text-white font-black py-4 rounded-xl hover:bg-orange-700 hover:scale-105 transition-all shadow-[0_0_15px_rgba(234,88,12,0.5)] text-xl mt-4 uppercase tracking-widest text-center animate-pulse">
                    🔥 Alugar Agora
                </button>
            </div>
        </div>
    `;
}

// Funções do Modal
window.abrirModal = function() {
    document.getElementById('modal-regiao')?.classList.remove('hidden');
};

window.fecharModal = function() {
    document.getElementById('modal-regiao')?.classList.add('hidden');
    document.getElementById('msg-fora-area')?.classList.add('hidden');
    const select = document.getElementById('select-cidade');
    if (select) select.value = "";
};

window.validarRegiao = function() {
    const cidadeSelect = document.getElementById('select-cidade');
    const msgErro = document.getElementById('msg-fora-area');
    const cidade = cidadeSelect ? cidadeSelect.value : '';

    if (!cidade) return;

    if (cidade === 'outra') {
        msgErro?.classList.remove('hidden');
    } else {
        // Redireciona para o arquivo de agendamento local que você acabou de criar
        window.location.href = `agendamento.html?cidade=${cidade}`;
        
        // Ou, se a sua página de agendamento estiver na raiz como index do app, pode ser:
        // window.location.href = `/agendamento?cidade=${cidade}`;
    }
};

function configurarEventosModal() {
    const modal = document.getElementById('modal-regiao');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.fecharModal();
        });
    }
}
