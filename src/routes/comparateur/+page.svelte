<script lang="ts">
        import { equipementsStore } from '$lib/stores/equipements';
        import { setsStore } from '$lib/stores/sets';
        import { telechargerCsv, imprimerSection } from '$lib/services/export';
        import { formatPrix } from '$lib/utils/format';
        import type { SetEquipement } from '$lib/types';

        let selection = new Set<string>();

        $: sets = $setsStore;
        $: carteEquipements = new Map($equipementsStore.map((eq) => [eq.nom, eq]));
        $: selectionIds = Array.from(selection);
        $: comparaisons = selectionIds
                .map((id) => sets.find((set) => set.id === id))
                .filter((set): set is SetEquipement => Boolean(set))
                .map((set) => {
                        const total = calculerTotal(set);
                        const manquants = set.selections.filter((selection) => {
                                const eq = carteEquipements.get(selection.nom);
                                if (!eq) return true;
                                const prix = eq.prixParServeur?.[set.serveur];
                                return prix === undefined;
                        }).length;
                        return { set, total, manquants };
                });
        $: meilleurPrix = comparaisons.length
                ? Math.min(...comparaisons.map((comparaison) => comparaison.total))
                : 0;

        function calculerTotal(set: SetEquipement) {
                return set.selections.reduce((acc, selection) => {
                        const eq = carteEquipements.get(selection.nom);
                        if (!eq) return acc;
                        const prix = eq.prixParServeur?.[set.serveur];
                        if (prix === undefined) return acc;
                        return acc + prix * (selection.quantite ?? 1);
                }, 0);
        }

        function basculerSelection(id: string) {
                const copie = new Set(selection);
                if (copie.has(id)) {
                        copie.delete(id);
                } else {
                        copie.add(id);
                }
                selection = copie;
        }

        function toutSelectionner() {
                selection = new Set(sets.map((set) => set.id));
        }

        function reinitialiserSelection() {
                selection = new Set();
        }

        function exporterCsv() {
                if (comparaisons.length === 0) return;
                const lignes = [
                        ['Nom du set', 'Serveur', 'Nombre d\'items', 'Prix manquants', 'Total (K)', 'Écart vs meilleur']
                ];
                for (const { set, total, manquants } of comparaisons) {
                        const ecart = meilleurPrix ? total - meilleurPrix : 0;
                        lignes.push([
                                set.nom,
                                set.serveur,
                                set.selections.length.toString(),
                                manquants.toString(),
                                Math.round(total).toString(),
                                ecart === 0 ? '0' : Math.round(ecart).toString()
                        ]);
                }
                telechargerCsv(
                        `comparaison-sets-${new Date().toISOString().slice(0, 10)}.csv`,
                        lignes
                );
        }

        function imprimer() {
                imprimerSection('resultats-comparaison', 'Comparateur de sets Dofus');
        }
</script>

<section class="intro">
        <div>
                <h1>Comparateur de sets</h1>
                <p>
                        Sélectionnez plusieurs sets pour comparer leur coût total, identifier les prix manquants et exporter
                        vos analyses.
                </p>
        </div>
        <div class="boutons">
                <button on:click={toutSelectionner}>Tout sélectionner</button>
                <button on:click={reinitialiserSelection}>Réinitialiser</button>
                <button on:click={exporterCsv}>Exporter CSV</button>
                <button class="primaire" on:click={imprimer}>Exporter PDF</button>
        </div>
</section>

<section class="liste-sets">
        {#if sets.length === 0}
                <p>Aucun set enregistré pour le moment.</p>
        {:else}
                <ul>
                        {#each sets as set}
                                <li>
                                        <label>
                                                <input
                                                        type="checkbox"
                                                        checked={selection.has(set.id)}
                                                        on:change={() => basculerSelection(set.id)}
                                                />
                                                <div>
                                                        <strong>{set.nom || 'Set sans nom'}</strong>
                                                        <span>{set.serveur}</span>
                                                </div>
                                        </label>
                                        <span class="prix-estime">{formatPrix(calculerTotal(set))}</span>
                                </li>
                        {/each}
                </ul>
        {/if}
</section>

<section id="resultats-comparaison" class="resultats">
        <h2>Analyse</h2>
        {#if comparaisons.length === 0}
                <p>Sélectionnez au moins deux sets pour lancer la comparaison.</p>
        {:else}
                <table>
                        <thead>
                                <tr>
                                        <th>Set</th>
                                        <th>Serveur</th>
                                        <th>Équipements</th>
                                        <th>Prix manquants</th>
                                        <th>Total estimé</th>
                                        <th>Écart</th>
                                </tr>
                        </thead>
                        <tbody>
                                {#each comparaisons as { set, total, manquants }}
                                        <tr class:meilleur={total === meilleurPrix}>
                                                <td>{set.nom}</td>
                                                <td>{set.serveur}</td>
                                                <td>{set.selections.length}</td>
                                                <td>{manquants}</td>
                                                <td>{formatPrix(total)}</td>
                                                <td>
                                                        {#if meilleurPrix}
                                                                {total === meilleurPrix
                                                                        ? 'Option la moins chère'
                                                                        : `+${Math.round(total - meilleurPrix)} K`}
                                                        {/if}
                                                </td>
                                        </tr>
                                {/each}
                        </tbody>
                </table>

                <div class="details">
                        {#each comparaisons as { set }}
                                <article>
                                        <h3>{set.nom}</h3>
                                        <ul>
                                                {#each set.selections as selection}
                                                        {@const eq = carteEquipements.get(selection.nom)}
                                                        <li>
                                                                <strong>{selection.quantite}×</strong>
                                                                <span>{selection.nom || 'Équipement à définir'}</span>
                                                                <span class="cout">
                                                                        {#if eq?.prixParServeur?.[set.serveur] !== undefined}
                                                                                {formatPrix(
                                                                                        (eq?.prixParServeur?.[set.serveur] ?? 0) *
                                                                                                (selection.quantite ?? 1)
                                                                                )}
                                                                        {:else}
                                                                                <em>Prix manquant</em>
                                                                        {/if}
                                                                </span>
                                                        </li>
                                                {/each}
                                        </ul>
                                </article>
                        {/each}
                </div>
        {/if}
</section>

<style>
        .intro {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
                flex-wrap: wrap;
        }

        .boutons {
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

        .liste-sets {
                background: rgba(15, 23, 42, 0.55);
                padding: 1.5rem;
                border-radius: 1rem;
                border: 1px solid rgba(148, 163, 184, 0.25);
        }

        .liste-sets ul {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
        }

        .liste-sets li {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                padding: 0.75rem 1rem;
                background: rgba(15, 23, 42, 0.5);
                border-radius: 0.75rem;
        }

        .liste-sets label {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                cursor: pointer;
        }

        .liste-sets strong {
                display: block;
        }

        .liste-sets span {
                display: block;
                font-size: 0.9rem;
                color: rgba(226, 232, 240, 0.75);
        }

        .prix-estime {
                color: rgba(226, 232, 240, 0.85);
                font-weight: 600;
        }

        .resultats {
                background: rgba(15, 23, 42, 0.6);
                padding: 1.5rem;
                border-radius: 1rem;
                border: 1px solid rgba(148, 163, 184, 0.25);
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
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

        tr.meilleur {
                background: rgba(56, 189, 248, 0.15);
        }

        .details {
                display: grid;
                gap: 1rem;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .details article {
                background: rgba(15, 23, 42, 0.55);
                border-radius: 1rem;
                padding: 1rem;
                border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .details ul {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
        }

        .details li {
                display: flex;
                justify-content: space-between;
                gap: 0.5rem;
        }

        .cout {
                color: rgba(226, 232, 240, 0.75);
        }
</style>
