export interface Effets {
        [effet: string]: number | [number, number];
}

export interface Recette {
        [ressource: string]: number;
}

export interface PrixParServeur {
        [serveur: string]: number | undefined;
}

export interface Equipement {
        nom: string;
        niveau?: number;
        Type?: string;
        description?: string;
        illustration_url?: string;
        url?: string;
        effets?: Effets;
        recette?: Recette;
        prixParServeur?: PrixParServeur;
}

export interface SelectionEquipement {
        id: string;
        nom: string;
        quantite: number;
}

export interface SetEquipement {
        id: string;
        nom: string;
        serveur: string;
        selections: SelectionEquipement[];
        notes?: string;
}

export interface DecisionCritere {
        id: string;
        nom: string;
        poids: number;
}

export interface DecisionOption {
        id: string;
        nom: string;
        notes: Record<string, number>;
}

export interface EisenhowerTask {
        id: string;
        titre: string;
        urgent: boolean;
        important: boolean;
        notes?: string;
}
