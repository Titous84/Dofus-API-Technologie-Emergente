import { writable } from 'svelte/store';
import { ecrireDansLocalStorage, lireDepuisLocalStorage } from '$lib/services/storage';

const STORAGE_KEY = 'dofus-serveurs';
const SERVEURS_DEFAUT = ['Echo', 'Ilyzaelle', 'Ombre'];

function creerStore() {
        const initial = lireDepuisLocalStorage<string[]>(STORAGE_KEY, SERVEURS_DEFAUT);
        const { subscribe, set, update } = writable<string[]>([...new Set(initial)]);

        subscribe((valeur) => ecrireDansLocalStorage(STORAGE_KEY, valeur));

        function ajouter(serveur: string) {
                if (!serveur.trim()) {
                        return;
                }
                update((liste) => {
                        if (liste.includes(serveur)) {
                                return liste;
                        }
                        return [...liste, serveur];
                });
        }

        function supprimer(serveur: string) {
                update((liste) => liste.filter((item) => item !== serveur));
        }

        function reordonner(nouvelleListe: string[]) {
                set([...nouvelleListe]);
        }

        return { subscribe, ajouter, supprimer, reordonner };
}

export const serversStore = creerStore();
