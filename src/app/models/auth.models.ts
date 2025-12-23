export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    userId: string;
    username: string;
    email: string;
    balance: number;
    avatarUrl?: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    balance: number;
    avatarUrl?: string;
}
