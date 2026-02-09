import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set CSRF token from meta tag
const token = document.querySelector('meta[name="csrf-token"]')?.content;
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
}

// Also expose CSRF token globally for fetch API
window.csrfToken = token;
