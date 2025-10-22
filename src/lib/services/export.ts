import { browser } from '$app/environment';

function echapperValeur(valeur: string) {
        if (/[";,\n]/.test(valeur)) {
                return `"${valeur.replace(/"/g, '""')}"`;
        }
        return valeur;
}

export function telechargerCsv(nomFichier: string, lignes: string[][]) {
        if (!browser) {
                return;
        }

        const contenu = lignes
                .map((ligne) => ligne.map((cellule) => echapperValeur(cellule)).join(';'))
                .join('\n');
        const blob = new Blob([contenu], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const lien = document.createElement('a');
        lien.href = url;
        lien.download = nomFichier;
        document.body.appendChild(lien);
        lien.click();
        document.body.removeChild(lien);
        URL.revokeObjectURL(url);
}

export function imprimerSection(elementId: string, titre = 'Export PDF') {
        if (!browser) {
                return;
        }

        const element = document.getElementById(elementId);
        if (!element) {
                console.warn(`Section ${elementId} introuvable pour l'impression.`);
                return;
        }

        const fenetre = window.open('', '_blank');
        if (!fenetre) {
                return;
        }

        fenetre.document.write(`<!DOCTYPE html><html><head><title>${titre}</title>`);
        fenetre.document.write('<meta charset="utf-8" />');
        fenetre.document.write('<style>body{font-family:Arial,Helvetica,sans-serif;padding:24px;}</style>');
        fenetre.document.write('</head><body>');
        fenetre.document.write(element.innerHTML);
        fenetre.document.write('</body></html>');
        fenetre.document.close();
        fenetre.focus();
        fenetre.print();
        fenetre.close();
}
