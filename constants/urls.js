const BASE_URL = '/api';

const AUTH = {
    BASE: `${BASE_URL}/auth`,
    REGISTER: '/register',
    LOGIN: '/login',
    LOGOUT: '/logout',
    GOOGLE: '/google',
    GOOGLE_CALLBACK: '/google/callback',
    SUCCESS: '/success',
    FAILURE: '/failure',
    PROTECTED: '/protected-route'
};

module.exports = {
    AUTH
};
