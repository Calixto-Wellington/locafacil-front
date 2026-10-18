// locafacil-front/js/api.js
export const API_BASE = 'https://locafacil-api-2onp.onrender.com/api';

export async function api(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    const config = {
        method,
        headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro na requisição');
        }
        return data;
    } catch (error) {
        console.error('Error in API request:', error);
        throw error;
    }
}