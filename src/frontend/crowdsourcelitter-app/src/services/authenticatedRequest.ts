import { apiRequest } from "./httpClient";

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export async function authenticatedRequest<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {

    try {
        return await apiRequest<T>(path, options);
    } catch (err: any) {
        if (!err.message.includes('401')) throw err;

        try {
            return await apiRequest<T>(path, options);
        } catch {
            window.location.href = '/login';
            throw new Error('Session Expired');
        }
    }
}