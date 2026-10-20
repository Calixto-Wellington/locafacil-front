import { fetchComAuth } from './auth.js';
import { API_BASE } from './api.js';

export async function carregarUsuarios() {
    try {
        const res = await fetchComAuth(`${API_BASE}/auth/usuarios`);
        if (!res.ok) return;

        const usuarios = await res.json();
        const grid = document.getElementById('grid-usuarios');
        if (!grid) return;

        grid.innerHTML = '';
        usuarios.forEach(u => {
            grid.innerHTML += `
                <div class="bg-gray-50 p-4 rounded-2xl border flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">${u.role}</span>
                            <span class="text-[10px] font-bold ${u.ativo ? 'text-green-600' : 'text-red-600'}">${u.ativo ? '● Ativo' : '○ Inativo'}</span>
                        </div>
                        <h4 class="font-black text-gray-900 text-sm uppercase">${u.nome}</h4>
                        <p class="text-xs text-gray-500 font-bold">${u.email}</p>
                    </div>
                    ${u.role !== 'ADMIN' ? `
                        <div class="pt-3 border-t mt-3">
                            <button onclick="excluirUsuario('${u.id}')" class="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1.5 rounded-lg text-xs uppercase">🗑️ Remover Acesso</button>
                        </div>
                    ` : ''}
                </div>`;
        });
    } catch (err) { console.error(err); }
}

export async function cadastrarNovoUsuario(e) {
    e.preventDefault();
    const payload = {
        nome: document.getElementById('user-nome').value.trim(),
        email: document.getElementById('user-email').value.trim(),
        senha: document.getElementById('user-senha').value.trim(),
        role: document.getElementById('user-role').value
    };

    try {
        const res = await fetchComAuth(`${API_BASE}/auth/usuarios`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Erro ao criar usuário');
        }

        alert('✅ Usuário cadastrado com sucesso!');
        e.target.reset();
        carregarUsuarios();
    } catch (err) {
        alert(`❌ ${err.message}`);
    }
}

export async function excluirUsuario(id) {
    if (confirm('Deseja realmente remover o acesso deste usuário?')) {
        await fetchComAuth(`${API_BASE}/auth/usuarios/${id}`, { method: 'DELETE' });
        carregarUsuarios();
    }
}