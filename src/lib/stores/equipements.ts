import { writable } from 'svelte/store';
import type { Equipement, PrixParServeur } from '$lib/types';
import donneesEquipements from '$lib/data/equipements.json';
import { ecrireDansLocalStorage, lireDepuisLocalStorage } from '$lib/services/storage';

const STORAGE_KEY = 'dofus-equipements-utilisateur';

type ResumeImport = {
        ajoutes: number;
        misAJour: number;
        ignores: number;
        inconnus: Set<string>;
};

function normaliserEquipement(equipement: Equipement): Equipement {
        return {
                ...equipement,
                prixParServeur: equipement.prixParServeur ?? {}
        };
}

const donneesInitiales = (donneesEquipements as Equipement[]).map(normaliserEquipement);

function creerStore() {
        const initial = lireDepuisLocalStorage<Equipement[]>(STORAGE_KEY, donneesInitiales);
        const { subscribe, set, update } = writable<Equipement[]>(initial.map(normaliserEquipement));

        subscribe((valeur) => {
                ecrireDansLocalStorage(STORAGE_KEY, valeur);
        });

        function upsert(equipement: Equipement) {
                if (!equipement.nom.trim()) {
                        return;
                }

                update((liste) => {
                        const sansDoublon = liste.filter((item) => item.nom !== equipement.nom);
                        return [...sansDoublon, normaliserEquipement(equipement)].sort((a, b) =>
                                a.nom.localeCompare(b.nom)
                        );
                });
        }

        function supprimer(nom: string) {
                update((liste) => liste.filter((item) => item.nom !== nom));
        }

        function definirPrix(nom: string, serveur: string, valeur?: number) {
                update((liste) =>
                        liste.map((item) => {
                                if (item.nom !== nom) {
                                        return item;
                                }

                                const prixParServeur: PrixParServeur = {
                                        ...item.prixParServeur
                                };

                                if (valeur === undefined || Number.isNaN(valeur)) {
                                        delete prixParServeur[serveur];
                                } else {
                                        prixParServeur[serveur] = valeur;
                                }

                                return normaliserEquipement({ ...item, prixParServeur });
                        })
                );
        }

        function importerDepuisCsv(contenu: string): ResumeImport {
                const lignes = contenu
                        .split(/\r?\n/)
                        .map((ligne) => ligne.trim())
                        .filter(Boolean);

                if (lignes.length === 0) {
                        return { ajoutes: 0, misAJour: 0, ignores: 0, inconnus: new Set() };
                }

                const separateur = lignes[0].includes(';') ? ';' : ',';
                let ajoutes = 0;
                let misAJour = 0;
                let ignores = 0;
                const inconnus = new Set<string>();

                const enTete = lignes[0].toLowerCase();
                const debutDonnees = enTete.includes('nom') && enTete.includes('serveur') ? 1 : 0;

                update((liste) => {
                        const map = new Map(liste.map((item) => [item.nom, normaliserEquipement(item)]));

                        for (let i = debutDonnees; i < lignes.length; i += 1) {
                                const morceaux = lignes[i].split(separateur).map((m) => m.trim());
                                if (morceaux.length < 3) {
                                        ignores += 1;
                                        continue;
                                }

                                const [nom, serveur, prixTexte] = morceaux;
                                const prix = Number.parseFloat(prixTexte.replace(',', '.'));

                                const equipement = map.get(nom);
                                if (!equipement) {
                                        inconnus.add(nom);
                                        continue;
                                }

                                const ancienPrix = equipement.prixParServeur?.[serveur];
                                if (Number.isNaN(prix)) {
                                        ignores += 1;
                                        continue;
                                }

                                if (ancienPrix === undefined) {
                                        ajoutes += 1;
                                } else {
                                        misAJour += 1;
                                }

                                equipement.prixParServeur = {
                                        ...equipement.prixParServeur,
                                        [serveur]: prix
                                };

                                map.set(nom, normaliserEquipement(equipement));
                        }

                        return Array.from(map.values());
                });

                return { ajoutes, misAJour, ignores, inconnus };
        }

        return {
                subscribe,
                set,
                upsert,
                supprimer,
                definirPrix,
                importerDepuisCsv
        };
}

export const equipementsStore = creerStore();
