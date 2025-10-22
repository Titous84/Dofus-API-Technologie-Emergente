<script lang="ts">
        import { equipementsStore } from '$lib/stores/equipements';
        import { serversStore } from '$lib/stores/servers';
        import type { Equipement } from '$lib/types';
        import { telechargerCsv } from '$lib/services/export';
        import { formatPrix } from '$lib/utils/format';

        let recherche = '';
        let serveurSelectionne = '';
        let nouveauServeur = '';
        let enEdition: Equipement | null = null;
        let resultatImport: string | null = null;

        $: listeServeurs = $serversStore;
        $: listeEquipements = $equipementsStore
                .filter((equipement) => equipement.nom.toLowerCase().includes(recherche.toLowerCase()))
                .sort((a, b) => a.nom.localeCompare(b.nom));

        $: serveurSelectionne = serveurSelectionne || listeServeurs[0] || '';

        function demarrerCreation() {
                enEdition = {
                        nom: '',
                        niveau: 1,
                        Type: '',
                        description: '',
                        prixParServeur: {}
                };
        }

        function editer(equipement: Equipement) {
                enEdition = structuredClone(equipement);
        }

        function annulerEdition() {
                enEdition = null;
        }

        function sauvegarder() {
                if (!enEdition) return;

                equipementsStore.upsert({
                        ...enEdition,
                        prixParServeur: enEdition.prixParServeur ?? {}
                });
                enEdition = null;
        }

        function supprimer(equipement: Equipement) {
                if (confirm(`Supprimer ${equipement.nom} ?`)) {
                        equipementsStore.supprimer(equipement.nom);
                }
        }

        function mettreAJourPrix(serveur: string, valeur: string) {
                if (!enEdition) return;
                const prix = Number(valeur.replace(',', '.'));
                if (!enEdition.prixParServeur) {
                        enEdition.prixParServeur = {};
                }
                if (Number.isNaN(prix) || valeur === '') {
                        delete enEdition.prixParServeur[serveur];
                } else {
                        enEdition.prixParServeur[serveur] = prix;
                }
        }

        async function importerCsv(event: Event) {
                const input = event.currentTarget as HTMLInputElement;
                const fichier = input.files?.[0];
                if (!fichier) return;

                const texte = await fichier.text();
                const resume = equipementsStore.importerDepuisCsv(texte);
                resultatImport = `Import terminé : ${resume.ajoutes} nouveaux prix, ${resume.misAJour} mis à jour, ${resume.ignorés} lignes ignorées.`;
                if (resume.inconnus.size) {
                        resultatImport += ` Équipements introuvables : ${Array.from(resume.inconnus).join(', ')}.`;
                }
                input.value = '';
        }

        function ajouterServeur() {
                if (!nouveauServeur.trim()) return;
                serversStore.ajouter(nouveauServeur.trim());
                serveurSelectionne = nouveauServeur.trim();
                nouveauServeur = '';
        }

        function exporterListe() {
                const lignes = [
                        ['Nom', 'Niveau', 'Type', 'Description', 'Serveur', 'Prix']
                ];

                for (const equipement of listeEquipements) {
                        const prix = serveurSelectionne
                                ? equipement.prixParServeur?.[serveurSelectionne]
                                : undefined;
                        lignes.push([
                                equipement.nom,
                                equipement.niveau?.toString() ?? '',
                                equipement.Type ?? '',
                                equipement.description ?? '',
                                serveurSelectionne,
                                prix !== undefined ? prix.toString() : ''
                        ]);
                }

                telechargerCsv(
                        `equipements-${serveurSelectionne || 'tous'}-${new Date().toISOString().slice(0, 10)}.csv`,
                        lignes
                );
        }
</script>

<section class="header">
        <div>
                <h1>Gestion des équipements</h1>
                <p>
                        Recherchez, modifiez et enrichissez votre base locale. Ajoutez des prix par serveur pour alimenter les
                        calculs des sets et comparatifs.
                </p>
        </div>
        <div class="actions">
                <button class="primaire" on:click={demarrerCreation}>Ajouter un équipement</button>
                <button on:click={exporterListe}>Exporter la vue CSV</button>
        </div>
</section>

<section class="outils">
        <label>
                <span>Recherche</span>
                <input type="search" bind:value={recherche} placeholder="Nom d'équipement" />
        </label>
        <label>
                <span>Serveur suivi</span>
                <select bind:value={serveurSelectionne}>
                        {#each listeServeurs as serveur}
                                <option value={serveur}>{serveur}</option>
                        {/each}
                </select>
        </label>
        <label>
                <span>Ajouter un serveur</span>
                <div class="ajout-serveur">
                        <input
                                bind:value={nouveauServeur}
                                type="text"
                                placeholder="Nom du serveur"
                                on:keydown={(event) => event.key === 'Enter' && ajouterServeur()}
                        />
                        <button on:click={ajouterServeur}>Ajouter</button>
                </div>
        </label>
        <label class="import">
                <span>Import CSV (nom;serveur;prix)</span>
                <input type="file" accept=".csv,text/csv" on:change={importerCsv} />
        </label>
</section>

{#if resultatImport}
        <div class="alerte">{resultatImport}</div>
{/if}

<section class="liste">
        <table>
                <thead>
                        <tr>
                                <th>Nom</th>
                                <th>Niveau</th>
                                <th>Type</th>
                                <th>Prix {serveurSelectionne ? `(${serveurSelectionne})` : ''}</th>
                                <th></th>
                        </tr>
                </thead>
                <tbody>
                        {#each listeEquipements as equipement}
                                <tr>
                                        <td>
                                                <a href={`/equipements/${encodeURIComponent(equipement.nom)}`}>
                                                        {equipement.nom}
                                                </a>
                                        </td>
                                        <td>{equipement.niveau ?? '—'}</td>
                                        <td>{equipement.Type ?? '—'}</td>
                                        <td>{formatPrix(equipement.prixParServeur?.[serveurSelectionne])}</td>
                                        <td class="actions">
                                                <button on:click={() => editer(equipement)}>Modifier</button>
                                                <button class="danger" on:click={() => supprimer(equipement)}>
                                                        Supprimer
                                                </button>
                                        </td>
                                </tr>
                        {/each}
                </tbody>
        </table>
</section>

{#if enEdition}
        <section class="edition">
                <h2>{enEdition.nom ? `Modifier ${enEdition.nom}` : 'Nouvel équipement'}</h2>
                <div class="grille">
                        <label>
                                <span>Nom</span>
                                <input bind:value={enEdition.nom} required />
                        </label>
                        <label>
                                <span>Niveau</span>
                                <input type="number" min="1" bind:value={enEdition.niveau} />
                        </label>
                        <label>
                                <span>Type</span>
                                <input bind:value={enEdition.Type} />
                        </label>
                        <label class="full">
                                <span>Description</span>
                                <textarea rows="3" bind:value={enEdition.description}></textarea>
                        </label>
                        <div class="full">
                                <h3>Prix par serveur</h3>
                                <div class="prix">
                                        {#each listeServeurs as serveur}
                                                <label>
                                                        <span>{serveur}</span>
                                                        <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                value={enEdition.prixParServeur?.[serveur] ?? ''}
                                                                on:input={(event) =>
                                                                        mettreAJourPrix(
                                                                                serveur,
                                                                                (event.currentTarget as HTMLInputElement).value
                                                                        )
                                                                }
                                                        />
                                                </label>
                                        {/each}
                                </div>
                        </div>
                </div>
                <div class="boutons">
                        <button class="primaire" on:click={sauvegarder}>Enregistrer</button>
                        <button on:click={annulerEdition}>Annuler</button>
                </div>
        </section>
{/if}

<style>
        .header {
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: space-between;
                gap: 1rem;
        }

        .header h1 {
                margin: 0 0 0.5rem;
        }

        .actions {
                display: flex;
                gap: 0.75rem;
        }

        button {
                border: none;
                border-radius: 0.75rem;
                padding: 0.6rem 1rem;
                font-weight: 600;
                cursor: pointer;
                background: rgba(148, 163, 184, 0.2);
                color: #e2e8f0;
        }

        button.primaire {
                background: linear-gradient(120deg, #38bdf8, #6366f1);
                color: #0f172a;
        }

        button.danger {
                background: rgba(248, 113, 113, 0.2);
                color: #fecaca;
        }

        .outils {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 1rem;
                background: rgba(15, 23, 42, 0.55);
                padding: 1rem;
                border-radius: 1rem;
                border: 1px solid rgba(148, 163, 184, 0.25);
        }

        .outils label {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                font-size: 0.85rem;
        }

        input,
        select,
        textarea {
                border: 1px solid rgba(148, 163, 184, 0.3);
                background: rgba(15, 23, 42, 0.6);
                color: #e2e8f0;
                border-radius: 0.65rem;
                padding: 0.5rem 0.75rem;
                font-size: 1rem;
        }

        textarea {
                resize: vertical;
        }

        .ajout-serveur {
                display: flex;
                gap: 0.5rem;
        }

        .ajout-serveur input {
                flex: 1;
        }

        .alerte {
                background: rgba(59, 130, 246, 0.2);
                border: 1px solid rgba(96, 165, 250, 0.4);
                color: #bfdbfe;
                padding: 0.75rem 1rem;
                border-radius: 0.75rem;
        }

        .liste {
                overflow-x: auto;
                background: rgba(15, 23, 42, 0.55);
                border-radius: 1rem;
                border: 1px solid rgba(148, 163, 184, 0.25);
        }

        table {
                width: 100%;
                border-collapse: collapse;
        }

        th,
        td {
                padding: 0.75rem;
                border-bottom: 1px solid rgba(148, 163, 184, 0.15);
                text-align: left;
        }

        tbody tr:hover {
                background: rgba(148, 163, 184, 0.08);
        }

        td.actions {
                display: flex;
                gap: 0.5rem;
        }

        .edition {
                background: rgba(15, 23, 42, 0.65);
                border-radius: 1rem;
                border: 1px solid rgba(148, 163, 184, 0.25);
                padding: 1.5rem;
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
        }

        .edition h2 {
                margin: 0;
        }

        .grille {
                display: grid;
                gap: 1rem;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .grille label {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
        }

        .grille label.full {
                grid-column: 1 / -1;
        }

        .prix {
                display: grid;
                gap: 0.75rem;
                grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        }

        .prix label {
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
        }

        .boutons {
                display: flex;
                gap: 0.75rem;
        }
</style>
