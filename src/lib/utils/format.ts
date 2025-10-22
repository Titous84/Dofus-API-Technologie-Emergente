export function formatPrix(valeur: number | undefined, devise = 'K') {
        if (valeur === undefined || Number.isNaN(valeur)) {
                return '—';
        }

        const entier = Math.round(valeur);
        return `${entier.toLocaleString('fr-FR')} ${devise}`;
}

export function somme(values: number[]) {
        return values.reduce((acc, valeur) => acc + (Number.isFinite(valeur) ? valeur : 0), 0);
}
