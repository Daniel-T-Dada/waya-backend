export interface User {
    id: string;
    email: string;
    full_name: string;
    password: string; // hashed
    role?: string;
}
