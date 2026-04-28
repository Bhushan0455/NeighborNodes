export const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? "http://localhost:5000" 
    : "";

export const API_BASE_URL = `${BACKEND_URL}/api`;

export const getImageUrl = (url, fallback = 'https://via.placeholder.com/600') => {
    if (!url) return fallback;
    if (url.startsWith('/uploads/')) return `${BACKEND_URL}${url}`;
    return url;
};

export const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (token) {
        options.headers = {
            ...options.headers,
            "Authorization": `Bearer ${token}`
        };
    }
    const response = await fetch(url, options);
    // If the backend rejects the token, auto-logout the user
    if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        window.location.href = "auth.html";
        throw new Error("Unauthorized");
    }
    return response;
};
