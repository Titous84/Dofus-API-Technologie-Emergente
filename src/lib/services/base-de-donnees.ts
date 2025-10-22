import { get } from 'svelte/store';
import panoplies from '$lib/data/panoplie.json';
import ressources from '$lib/data/ressources.json';
import { equipementsStore } from '$lib/stores/equipements';

function normaliserTexte(texte: string): string {
        return texte
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase();
}

export function getEquipementParNom(nom: string) {
        const equipements = get(equipementsStore);
        const resultat = equipements.find((e) => e.nom === nom);
        if (!resultat) {
                console.warn('❌ Équipement non trouvé :', nom);
                console.log('Voici quelques noms disponibles :', equipements.slice(0, 5).map((e) => e.nom));
        }
        return resultat;
}

export function getPanoplieParEquipement(equipementNom: string) {
        const nomNormalise = normaliserTexte(equipementNom);
        return panoplies.find((p) => p.composition.some((nom) => normaliserTexte(nom) === nomNormalise));
}

export function trouverRessource(nom: string) {
        return ressources.find((r) => r.nom === nom);
}

export function listerTousLesEffets() {
        const equipements = get(equipementsStore);
        const setEffets = new Set<string>();

        for (const eq of equipements) {
                if (eq.effets) {
                        for (const effet of Object.keys(eq.effets)) {
                                setEffets.add(effet);
                        }
                }
        }

        return Array.from(setEffets).sort();
}
