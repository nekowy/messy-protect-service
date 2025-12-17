import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const storedUser = browser ? localStorage.getItem('mp_user') : null;
const storedNick = browser ? localStorage.getItem('mp_nick') : null; // Cache nick if wanted

export const user = writable(storedUser);
export const nick = writable(storedNick);

if (browser) {
    user.subscribe(value => {
        if (value) localStorage.setItem('mp_user', value);
        else localStorage.removeItem('mp_user');
    });
}
