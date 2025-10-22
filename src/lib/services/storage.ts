import { browser } from '$app/environment';

export function lireDepuisLocalStorage<T>(cle: string, fallback: T): T {
        if (!browser) {
                return fallback;
        }

        const donnees = localStorage.getItem(cle);
        if (!donnees) {
                return fallback;
        }

        try {
                return JSON.parse(donnees) as T;
        } catch (error) {
                console.warn(`Impossible de lire la clé "${cle}" depuis le localStorage`, error);
                return fallback;
        }
}

export function ecrireDansLocalStorage<T>(cle: string, valeur: T) {
        if (!browser) {
                return;
        }

        try {
                localStorage.setItem(cle, JSON.stringify(valeur));
        } catch (error) {
                console.warn(`Impossible d'écrire la clé "${cle}" dans le localStorage`, error);
        }
}
