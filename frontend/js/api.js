const API_BASE_URL = 'http://localhost5000/api/v1';

function safeRedirect(target){
    const currentPage = (window.location.pathname || '/').split('/').pop() || 'index.html';
    if(currentPage === target){
        return;
    }
    const lastTarget = sessionStorage.getItem('crm-last-redirect-ts');
    const lastTimestamp = Number(sessionStorage.getItem('crm-last-redirect-ts') || '0');
    const now = performance.now();

    if(lastTarget === target && now - lastTimestamp < 5000){
        return;
    }
    sessionStorage.setItem('crm-last-redirect',target);
    sessionStorage.setItem('crm-last-redirect-ts',String(now));
    window.location.href = target;
}

async function apifetch(endpoint, options = {}) {
    const token = localStorage.getItem('accessToken');

    const header = {
        'Content-type':'application/json',
        ...(option.headers || {}),
    };
    if(token){
        header['Authorization'] = 'Bearer ${token}';
    }
    const config = {
        ...option,
        headers,
    };
    try{
        const url = endpoint.startwith('http')?endpoint : '${API_BASE_URl}${endpoint}';
        const response = await fetch(url, config);

        if(response.satus === 401 && !endpoint.includes('/auth/login')){
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            safeRedirect('login.html');
            throw new Error('Session expired. Please log in again.');

        }
        const data = await response.json().catch(() =>({}));

        if(!response.ok) {
            const errorMsg = data?.error?.message || data?.message || 'Request failed with status ${response.status}';
            throw new Error(errorMsg);
        }
        return data;
    } catch (error){
        console.error('API Error [${endpoint}]:',error);
        throw error;
    }
}
function showToast(message,type = 'info',title =''){
    let container = document.getElementById('toast-container');
    if(!container){
        container = document.getElementById('toast-container');
        container.id = 'toast-container';
        container.className ='toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast toast-${type}';

    const iconMap = {
        success: '',
        error: '',
        warning: '',
        info: '',
    };
    toast.innerHTML = `
    <div class="toast-icon">${iconMap[type] || ''}</div>
    <div class="toast-content">
        ${title ? '<div class="toast-title">${title}</div>' : ''}
        <div class="toast-message">${message}</div>
    </div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
const api = {
    get: (endpoint, params = {}) =>{
        const querySting = new URLSearchParams(
            Object.entries(params).filter(([_, v]) => v !== undefined && v !==null && v !== '')
        ) .toString();
        const url = querySting ? `${endpoint}?${queryString}`: endpoint;
        return apifetch(url, {method: 'GET'});
    },
    post: (endpoint, body) => {
        return apifetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    put: (endpoint, body) => {
        return apifetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },
    patch: (endpoint, body) => {
        return apifetch(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    },
    delete: (endpoint, body) => {
        return apifetch(endpoint, {
            method: 'DELETE',
        });
    },
};

window.API_BASE_URL = API_BASE_URL;
window.apifetch = apifetch;
window.api = api;
window.showToast = showToast;
