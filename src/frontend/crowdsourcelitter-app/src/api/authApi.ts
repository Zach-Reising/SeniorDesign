import { apiRequest } from "../services/httpClient";

export function login(email: string, password: string){
    return apiRequest<void>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({email, password}),
    });
}

export function register(email: string, password: string) {
    return apiRequest<void>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({email, password}),
    });
}

export function logout() {
    return apiRequest<void>('/api/auth/logout', {
        method: 'POST',
    });
}