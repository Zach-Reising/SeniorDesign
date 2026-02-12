import { env } from '../config/env';

export async function apiRequest<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetch(`${env.apiUrl}${path}`, {
        credentials: 'include',
        headers: { 
            'Content-Type': 'application/json', 
            ...options.headers 
        },
        ...options,
    });

    const text = await res.text();
    let data: any = null;
    try {
            data = text ? JSON.parse(text) : null;
            
        }
        catch {
            data = text;
        }

    if (!res.ok) {
        throw new Error(data?.msg || data || 'Request Failed');
    }

    if (res.status ===204){
        return null as T;
    }

    return data;
}