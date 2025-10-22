<script lang="ts">
        import { browser } from '$app/environment';
        import { onMount } from 'svelte';
        import { setsStore } from '$lib/stores/sets';
        import { telechargerCsv, imprimerSection } from '$lib/services/export';
        import type { DecisionCritere, DecisionOption, EisenhowerTask } from '$lib/types';

        const STOCKAGE_MATRICE = 'decision-matrix';
        const STOCKAGE_EISENHOWER = 'eisenhower-tasks';

        let criteres: DecisionCritere[] = [
                { id: crypto.randomUUID(), nom: 'Coût total', poids: 3 },
                { id: crypto.randomUUID(), nom: 'Disponibilité des prix', poids: 2 }
        ];
        let options: DecisionOption[] = [];
        let taches: EisenhowerTask[] = [];

        $: sets = $setsStore;

        onMount(() => {
                if (!browser) return;
                try {
                        const matrice = localStorage.getItem(STOCKAGE_MATRICE);
                        if (matrice) {
                                const { criteres: c, options: o } = JSON.parse(matrice);
                                criteres = c ?? criteres;
                                options = o ?? options;
                        }
                        const donneesTaches = localStorage.getItem(STOCKAGE_EISENHOWER);
                        if (donneesTaches) {
                                taches = JSON.parse(donneesTaches);
                        }
                } catch (error) {
                        console.warn('Impossible de charger les données locales', error);
                }
        });

        $: if (browser) {
                localStorage.setItem(STOCKAGE_MATRICE, JSON.stringify({ criteres, options }));
                localStorage.setItem(STOCKAGE_EISENHOWER, JSON.stringify(taches));
        }

        function ajouterCritere() {
                criteres = [...criteres, { id: crypto.randomUUID(), nom: 'Nouveau critère', poids: 1 }];
                options = options.map((option) => ({
                        ...option,
                        notes: { ...option.notes }
                }));
        }

        function supprimerCritere(id: string) {
                criteres = criteres.filter((critere) => critere.id !== id);
                options = options.map((option) => {
                        const notes = { ...option.notes };
                        delete notes[id];
                        return { ...option, notes };
                });
        }

        function ajouterOption() {
                options = [
                        ...options,
                        { id: crypto.randomUUID(), nom: 'Nouvelle option', notes: Object.fromEntries(criteres.map((critere) => [critere.id, 3])) }
                ];
        }

        function ajouterOptionDepuisSet(id: string) {
                const set = sets.find((item) => item.id === id);
                if (!set) return;
                options = [
                        ...options,
                        {
                                id: crypto.randomUUID(),
                                nom: set.nom,
                                notes: Object.fromEntries(criteres.map((critere) => [critere.id, 3]))
                        }
                ];
        }

        function supprimerOption(id: string) {
                options = options.filter((option) => option.id !== id);
        }

        function mettreAJourNomOption(optionId: string, valeur: string) {
                options = options.map((option) =>
                        option.id === optionId
                                ? {
                                          ...option,
                                          nom: valeur
                                  }
                                : option
                );
        }

        function mettreAJourNomCritere(id: string, valeur: string) {
                criteres = criteres.map((critere) =>
                        critere.id === id
                                ? {
                                          ...critere,
                                          nom: valeur
                                  }
                                : critere
                );
        }

        function mettreAJourPoidsCritere(id: string, valeur: string) {
                const poids = Number(valeur);
                const borne = Number.isNaN(poids) ? 1 : Math.min(5, Math.max(1, poids));
                criteres = criteres.map((critere) =>
                        critere.id === id
                                ? {
                                          ...critere,
                                          poids: borne
                                  }
                                : critere
                );
        }

        function mettreAJourNote(optionId: string, critereId: string, valeur: string) {
                const note = Number(valeur);
                options = options.map((option) => {
                        if (option.id !== optionId) return option;
                        return {
                                ...option,
                                notes: {
                                        ...option.notes,
                                        [critereId]: Number.isNaN(note) ? 0 : Math.min(5, Math.max(0, note))
                                }
                        };
                });
        }

        function calculerScore(option: DecisionOption) {
                return criteres.reduce((acc, critere) => {
                        const note = option.notes?.[critere.id] ?? 0;
                        return acc + note * critere.poids;
                }, 0);
        }

        function exporterMatrice() {
                if (options.length === 0) return;
                const enTete = ['Option', ...criteres.map((critere) => `${critere.nom} (poids ${critere.poids})`), 'Score'];
                const lignes = [enTete];

                for (const option of options) {
                        const score = calculerScore(option);
                        lignes.push([
                                option.nom,
                                ...criteres.map((critere) => (option.notes?.[critere.id] ?? 0).toString()),
                                score.toString()
                        ]);
                }

                telechargerCsv(`matrice-decision-${new Date().toISOString().slice(0, 10)}.csv`, lignes);
        }

        function imprimerMatrice() {
                imprimerSection('matrice-decision', 'Matrice de décision');
        }

        function ajouterTache() {
                taches = [
                        ...taches,
                        { id: crypto.randomUUID(), titre: 'Nouvelle tâche', urgent: false, important: false }
                ];
        }

        function mettreAJourTache(id: string, champ: keyof EisenhowerTask, valeur: string | boolean) {
                taches = taches.map((tache) => {
                        if (tache.id !== id) return tache;
                        return {
                                ...tache,
                                [champ]: valeur
                        };
                });
        }

        function supprimerTache(id: string) {
                taches = taches.filter((tache) => tache.id !== id);
        }

        function exporterTaches() {
                if (taches.length === 0) return;
                const lignes = [
                        ['Tâche', 'Urgent', 'Important', 'Notes']
                ];
                for (const tache of taches) {
                        lignes.push([
                                tache.titre,
                                tache.urgent ? 'Oui' : 'Non',
                                tache.important ? 'Oui' : 'Non',
                                tache.notes ?? ''
                        ]);
                }
                telechargerCsv(`eisenhower-${new Date().toISOString().slice(0, 10)}.csv`, lignes);
        }

        function imprimerEisenhower() {
                imprimerSection('eisenhower', 'Matrice d\'Eisenhower');
        }

        $: scoresOptions = options
                .map((option) => ({ id: option.id, score: calculerScore(option) }))
                .sort((a, b) => b.score - a.score);

        $: optionGagnante = scoresOptions[0]?.id ?? null;

        $: quadrants = {
                urgenteImportante: taches.filter((tache) => tache.urgent && tache.important),
                urgentePasImportante: taches.filter((tache) => tache.urgent && !tache.important),
                pasUrgenteImportante: taches.filter((tache) => !tache.urgent && tache.important),
                pasUrgentePasImportante: taches.filter((tache) => !tache.urgent && !tache.important)
        };
</script>

<section id="matrice-decision" class="section">
        <div class="entete">
                <div>
                        <h1>Matrice de décision</h1>
                        <p>
                                Comparez vos options selon plusieurs critères pondérés pour choisir le set le plus pertinent.
                        </p>
                </div>
                <div class="actions">
                        <button on:click={ajouterCritere}>Ajouter un critère</button>
                        <button on:click={ajouterOption}>Ajouter une option</button>
                        <select
                                on:change={(event) => {
                                        const select = event.currentTarget as HTMLSelectElement;
                                        if (select.value) {
                                                ajouterOptionDepuisSet(select.value);
                                                select.value = '';
                                        }
                                }}
                        >
                                <option value="">Importer un set...</option>
                                {#each sets as set}
                                        <option value={set.id}>{set.nom}</option>
                                {/each}
                        </select>
                        <button on:click={exporterMatrice}>Exporter CSV</button>
                        <button class="primaire" on:click={imprimerMatrice}>Exporter PDF</button>
                </div>
        </div>

        <div class="tableau">
                <div class="ligne entete">
                        <div class="cellule option">Option</div>
                        {#each criteres as critere}
                                <div class="cellule critere">
                                        <input
                                                value={critere.nom}
                                                on:input={(event) =>
                                                        mettreAJourNomCritere(
                                                                critere.id,
                                                                (event.currentTarget as HTMLInputElement).value
                                                        )
                                                }
                                        />
                                        <label>
                                                Poids
                                                <input
                                                        type="number"
                                                        min="1"
                                                        max="5"
                                                        value={critere.poids}
                                                        on:change={(event) =>
                                                                mettreAJourPoidsCritere(
                                                                        critere.id,
                                                                        (event.currentTarget as HTMLInputElement).value
                                                                )
                                                        }
                                                />
                                        </label>
                                        <button class="danger" on:click={() => supprimerCritere(critere.id)}>Supprimer</button>
                                </div>
                        {/each}
                        <div class="cellule score">Score</div>
                </div>

                {#each options as option}
                        <div class="ligne" class:gagnant={option.id === optionGagnante}>
                                <div class="cellule option">
                                        <input
                                                value={option.nom}
                                                on:input={(event) =>
                                                        mettreAJourNomOption(
                                                                option.id,
                                                                (event.currentTarget as HTMLInputElement).value
                                                        )
                                                }
                                        />
                                        <button class="danger" on:click={() => supprimerOption(option.id)}>Supprimer</button>
                                </div>
                                {#each criteres as critere}
                                        <div class="cellule">
                                                <input
                                                        type="number"
                                                        min="0"
                                                        max="5"
                                                        value={option.notes?.[critere.id] ?? 0}
                                                        on:change={(event) =>
                                                                mettreAJourNote(
                                                                        option.id,
                                                                        critere.id,
                                                                        (event.currentTarget as HTMLInputElement).value
                                                                )
                                                        }
                                                />
                                        </div>
                                {/each}
                                <div class="cellule score">{calculerScore(option)}</div>
                        </div>
                {/each}
        </div>
</section>

<section id="eisenhower" class="section">
        <div class="entete">
                <div>
                        <h2>Matrice d'Eisenhower</h2>
                        <p>Priorisez vos actions selon l'urgence et l'importance.</p>
                </div>
                <div class="actions">
                        <button on:click={ajouterTache}>Ajouter une tâche</button>
                        <button on:click={exporterTaches}>Exporter CSV</button>
                        <button class="primaire" on:click={imprimerEisenhower}>Exporter PDF</button>
                </div>
        </div>

        <div class="taches">
                <div class="formulaire">
                        <ul>
                                {#each taches as tache (tache.id)}
                                        <li>
                                                <input
                                                        value={tache.titre}
                                                        on:input={(event) =>
                                                                mettreAJourTache(tache.id, 'titre', (event.currentTarget as HTMLInputElement).value)
                                                        }
                                                />
                                                <label>
                                                        Urgent ?
                                                        <input
                                                                type="checkbox"
                                                                checked={tache.urgent}
                                                                on:change={(event) =>
                                                                        mettreAJourTache(tache.id, 'urgent', (event.currentTarget as HTMLInputElement).checked)
                                                                }
                                                        />
                                                </label>
                                                <label>
                                                        Important ?
                                                        <input
                                                                type="checkbox"
                                                                checked={tache.important}
                                                                on:change={(event) =>
                                                                        mettreAJourTache(tache.id, 'important', (event.currentTarget as HTMLInputElement).checked)
                                                                }
                                                        />
                                                </label>
                                                <textarea
                                                        rows="2"
                                                        placeholder="Notes"
                                                        bind:value={tache.notes}
                                                ></textarea>
                                                <button class="danger" on:click={() => supprimerTache(tache.id)}>Supprimer</button>
                                        </li>
                                {/each}
                        </ul>
                </div>

                <div class="grille">
                        <article>
                                <h3>Urgent & important</h3>
                                <ul>
                                        {#each quadrants.urgenteImportante as tache}
                                                <li>{tache.titre}</li>
                                        {/each}
                                </ul>
                        </article>
                        <article>
                                <h3>Urgent & peu important</h3>
                                <ul>
                                        {#each quadrants.urgentePasImportante as tache}
                                                <li>{tache.titre}</li>
                                        {/each}
                                </ul>
                        </article>
                        <article>
                                <h3>Important & pas urgent</h3>
                                <ul>
                                        {#each quadrants.pasUrgenteImportante as tache}
                                                <li>{tache.titre}</li>
                                        {/each}
                                </ul>
                        </article>
                        <article>
                                <h3>Ni urgent ni important</h3>
                                <ul>
                                        {#each quadrants.pasUrgentePasImportante as tache}
                                                <li>{tache.titre}</li>
                                        {/each}
                                </ul>
                        </article>
                </div>
        </div>
</section>

<style>
        .section {
                background: rgba(15, 23, 42, 0.6);
                border-radius: 1rem;
                border: 1px solid rgba(148, 163, 184, 0.25);
                padding: 1.5rem;
                margin-bottom: 2rem;
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
        }

        .entete {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
                flex-wrap: wrap;
        }

        .actions {
                display: flex;
                flex-wrap: wrap;
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

        input,
        select,
        textarea {
                border: 1px solid rgba(148, 163, 184, 0.3);
                background: rgba(15, 23, 42, 0.6);
                color: #e2e8f0;
                border-radius: 0.65rem;
                padding: 0.5rem 0.75rem;
        }

        .tableau {
                display: flex;
                flex-direction: column;
                gap: 1rem;
        }

        .ligne {
                display: grid;
                grid-template-columns: 200px repeat(auto-fit, minmax(140px, 1fr)) 100px;
                gap: 1rem;
                align-items: center;
                padding: 0.75rem;
                border-radius: 0.75rem;
                background: rgba(15, 23, 42, 0.55);
        }

        .ligne.entete {
                font-weight: 700;
                background: rgba(15, 23, 42, 0.7);
        }

        .ligne.gagnant {
                border: 1px solid rgba(56, 189, 248, 0.6);
        }

        .cellule {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
        }

        .cellule.option {
                min-width: 180px;
        }

        .cellule.score {
                align-items: center;
                font-weight: 700;
        }

        .taches {
                display: grid;
                grid-template-columns: minmax(260px, 1fr) minmax(260px, 1fr);
                gap: 1.5rem;
        }

        .taches ul {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
        }

        .formulaire li {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                padding: 0.75rem;
                background: rgba(15, 23, 42, 0.55);
                border-radius: 0.75rem;
        }

        .grille {
                display: grid;
                gap: 1rem;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }

        .grille article {
                background: rgba(15, 23, 42, 0.55);
                border-radius: 0.75rem;
                padding: 1rem;
                border: 1px solid rgba(148, 163, 184, 0.2);
        }

        @media (max-width: 900px) {
                .ligne {
                        grid-template-columns: 160px repeat(auto-fit, minmax(120px, 1fr)) 100px;
                }

                .taches {
                        grid-template-columns: 1fr;
                }
        }
</style>
