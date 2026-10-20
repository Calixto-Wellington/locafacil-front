import { API_BASE } from './api.js';

export function exibirModalLogin() {
    const modal = document.getElementById('modal-login');
    if (modal) modal.classList.remove('hidden');
}

export async function realizarLoginAdmin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value.trim();
    const erroDiv = document.getElementById('login-erro');

    erroDiv.classList.add('hidden');

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');

        localStorage.setItem('lf_admin_token', data.token);
        document.getElementById('modal-login').classList.add('hidden');
        
        if (typeof window.carregarDadosPainel === 'function') {
            window.carregarDadosPainel();
        }
    } catch (err) {
        erroDiv.innerText = `❌ ${err.message}`;
        erroDiv.classList.remove('hidden');
    }
}

export function realizarLogout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.removeItem('lf_admin_token');
        location.reload();
    }
}

export async function fetchComAuth(url, options = {}) {
    const token = localStorage.getItem('lf_admin_token');
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const res = await fetch(url, options);
    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('lf_admin_token');
        exibirModalLogin();
    }
    return res;
}