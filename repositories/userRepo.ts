import { promises as fs } from 'fs';
import path from 'path';
import { User } from '../models/user';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

async function ensureFile() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, JSON.stringify([]), 'utf8');
    }
}

async function readAll(): Promise<User[]> {
    await ensureFile();
    const raw = await fs.readFile(USERS_FILE, 'utf8');
    try {
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

async function writeAll(users: User[]) {
    await ensureFile();
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export async function findByEmail(email: string): Promise<User | null> {
    const users = await readAll();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findById(id: string): Promise<User | null> {
    const users = await readAll();
    return users.find(u => u.id === id) ?? null;
}

export async function saveUser(user: User): Promise<void> {
    const users = await readAll();
    users.push(user);
    await writeAll(users);
}

export async function updateUser(user: User): Promise<void> {
    const users = await readAll();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    await writeAll(users);
}
