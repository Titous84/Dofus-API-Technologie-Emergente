import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { ecrireDansLocalStorage, lireDepuisLocalStorage } from '$lib/services/storage';
import type { SelectionEquipement, SetEquipement } from '$lib/types';

const STORAGE_KEY = 'dofus-sets';

function creerSelection(nom = ''): SelectionEquipement {
        return {
                id: crypto.randomUUID(),
                nom,
                quantite: 1
        };
}

function creerSet(): SetEquipement {
        return {
                id: crypto.randomUUID(),
                nom: '',
                serveur: '',
                selections: [creerSelection()],
                notes: ''
        };
}

function creerStore() {
        const initial = lireDepuisLocalStorage<SetEquipement[]>(STORAGE_KEY, []);
        const { subscribe, update, set } = writable<SetEquipement[]>(
                initial.map((setEquipement) => ({
                        ...setEquipement,
                        id: setEquipement.id ?? crypto.randomUUID(),
                        selections: setEquipement.selections.map((selection) => ({
                                ...selection,
                                id: selection.id ?? crypto.randomUUID(),
                                quantite: selection.quantite ?? 1
                        }))
                }))
        );

        subscribe((valeur) => ecrireDansLocalStorage(STORAGE_KEY, valeur));

        function ajouter(nouveauSet?: Partial<SetEquipement>) {
                update((sets) => {
                        const setAInserer: SetEquipement = {
                                ...creerSet(),
                                ...nouveauSet,
                                id: crypto.randomUUID(),
                                selections:
                                        nouveauSet?.selections?.length
                                                ? nouveauSet.selections.map((selection) => ({
                                                              ...selection,
                                                              id: crypto.randomUUID(),
                                                              quantite: selection.quantite ?? 1
                                                      }))
                                                : [creerSelection()]
                        };
                        return [...sets, setAInserer];
                });
        }

        function mettreAJour(id: string, donnees: Partial<SetEquipement>) {
                update((sets) =>
                        sets.map((setEquipement) => {
                                if (setEquipement.id !== id) {
                                        return setEquipement;
                                }
                                return {
                                        ...setEquipement,
                                        ...donnees,
                                        selections: donnees.selections
                                                ? donnees.selections.map((selection) => ({
                                                          ...selection,
                                                          id: selection.id ?? crypto.randomUUID(),
                                                          quantite: selection.quantite ?? 1
                                                  }))
                                                : setEquipement.selections
                                };
                        })
                );
        }

        function dupliquer(id: string) {
                update((sets) => {
                        const setExistant = sets.find((setEquipement) => setEquipement.id === id);
                        if (!setExistant) {
                                return sets;
                        }
                        const copie: SetEquipement = {
                                ...setExistant,
                                id: crypto.randomUUID(),
                                nom: `${setExistant.nom} (copie)`,
                                selections: setExistant.selections.map((selection) => ({
                                        ...selection,
                                        id: crypto.randomUUID()
                                }))
                        };
                        return [...sets, copie];
                });
        }

        function supprimer(id: string) {
                update((sets) => sets.filter((setEquipement) => setEquipement.id !== id));
        }

        function reinitialiser() {
                set([]);
                if (browser) {
                        localStorage.removeItem(STORAGE_KEY);
                }
        }

        return {
                subscribe,
                ajouter,
                mettreAJour,
                dupliquer,
                supprimer,
                reinitialiser,
                creerSelection,
                creerSet
        };
}

export const setsStore = creerStore();
