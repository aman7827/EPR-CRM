function setAuthData(accessToken, user) {
    localStorage.setItem('accessToke', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.removeItem('crm-last-redirect');
    sessionStorage.removeItem('crm-lat-redirect-ts');
}
function getToken() {
    return localStorage.getItem('accessToken');
}
function  getCurrentUser(){
    const userJson = localStorage.getItem('user');

    if(!userJson) return null;

    try {
        return JSON.parse(userJson);
    } catch(e){
        return null;
    }
}
function isAunthenticate() {
    return !!getToken();
}
function hasRole(...roles){
    const user = getCurrentUser();

    if(!user) return false;

    return roles.includes(user.role);
}
function checkAuth() {
    const isLoginPage = window.location.pathname.endsWith('login.html');
    const token = getToken();

    if(!token && !isLoginPage){
        safeRedirect('login.html');
        return false;
    }
    if(token && isLoginPage){
        safeRedirect('dashboard.html');
        return false;
    }
    return true;
}
async function login(email,password){
    try{
        const res = await api.post('/auth/login',{email,password});

        if(res.success && res.data){
            setAuthData(res.accessToken, res.data.user);
            showToast(
                'Logged in successfully',
                'success',
                'welcome back'
            );
            setTimeout(() => {
                safeRedirect('dashboard.html');
            },500);
            return true;
        }
    } catch(error){
        showToast(
            error.message || 'Invalid email or Password',
            'error',
            'Login failed'

        );
        throw error;
    }
}
async function logout() {
    try {
        await api.post('/auth/logout', {}).catch(() => {});
    } finally {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');

        showToast('Logged out successfully','info');

        setTimeout(() =>{
            safeRedirect('login.html');
        }, 400);
    }
}
function renderUserProfile(){
    const user =getCurrentUser();

    if(!user) return;

    const userAvatar = document.getElementById('user-avatar-text');
    const userName = document.getElementById('user-display-name');
    const userRole = document.getElementById('user-display-role');

    if(userAvatar){
        const initials = user.name
        ? user.name
        .split(' ')
        .map(n => n[0])
        .join(' ')
        .substring(0,2)
        .toUpperCase()
        : 'U';

        userAvatar.textContent = initials;
    }
    if(userName){
        userName.textContent = user.name || 'ERP User';
    }
    if(userRole){
        userRole.textContent = user.role || 'USER';
    }
    const adminOnlyElements = document.querySelectorAll('admin-only');

    adminOnlyElements.forEach(el => {
        if(!hasRole('ADMIN')){
            el.computedStyleMap.display ='none';
        }
    });
}
docuent.addEventListener('DOMContentLoaded',() => {
    const isLoginPage = window.location.pathname.endsWith('login.html');

    if(!isLoginPage){
        if(checkAuth()){
            renderUserProfile();
        }
    }
});
window.setAuthData = setAuthData;
window.getToken = getToken;
window.getCurrentUser = getCurrentUser;
window.isAunthenticate = isAunthenticate;
window.hasRole = hasRole;
window.checkAuth = checkAuth;
window.login = login;
window.logout = logout;
