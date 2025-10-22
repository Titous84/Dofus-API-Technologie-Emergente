<script lang="ts">
        import { get } from 'svelte/store';
        import { equipementsStore } from '$lib/stores/equipements';
        import { setsStore } from '$lib/stores/sets';
        import { serversStore } from '$lib/stores/servers';
        import type { SelectionEquipement, SetEquipement } from '$lib/types';
        import { formatPrix } from '$lib/utils/format';

        const creerSelection = setsStore.creerSelection;
        const creerSet = setsStore.creerSet;

        let setActifId: string | null = null;
        let edition: SetEquipement | null = null;
        let message: string | null = null;

        $: listeEquipements = $equipementsStore;
        $: carteEquipements = new Map(listeEquipements.map((eq) => [eq.nom, eq]));
        $: listeServeurs = $serversStore;
        $: ensembles = $setsStore;
        $: resumeSets = ensembles.map((set) => {
                const total = calculerTotal(set);
                const manquants = set.selections.filter((selection) => {
                        const eq = carteEquipements.get(selection.nom);
                        if (!eq) return true;
                        const prix = eq.prixParServeur?.[set.serveur];
                        return prix === undefined || prix === null;
                }).length;
                return {
                        ...set,
                        total,
                        manquants
                };
        });
        $: totalEdition = edition ? calculerTotal(edition) : 0;

        $: if (!edition && !setActifId && ensembles.length) {
                setActifId = ensembles[0].id;
                edition = structuredClone(ensembles[0]);
        }

        function calculerTotal(set: SetEquipement) {
                return set.selections.reduce((acc, selection) => {
                        const eq = carteEquipements.get(selection.nom);
                        if (!eq) {
                                return acc;
                        }
                        const prix = eq.prixParServeur?.[set.serveur];
                        if (prix === undefined) {
                                return acc;
                        }
                        return acc + prix * (selection.quantite ?? 1);
                }, 0);
        }

        function creerNouveauSet() {
                edition = creerSet();
                edition.id = '';
                edition.serveur = listeServeurs[0] ?? '';
                setActifId = null;
        }

        function selectionnerSet(id: string) {
                const setTrouve = ensembles.find((set) => set.id === id);
                if (!setTrouve) return;
                setActifId = id;
                edition = structuredClone(setTrouve);
        }

        function dupliquerSet(id: string) {
                setsStore.dupliquer(id);
                const derniers = get(setsStore);
                const nouveau = derniers[derniers.length - 1];
                selectionnerSet(nouveau.id);
        }

        function supprimerSet(id: string) {
                if (!confirm('Supprimer ce set ?')) return;
                setsStore.supprimer(id);
                if (setActifId === id) {
                        setActifId = null;
                        edition = null;
                }
        }

        function ajouterSelection() {
                if (!edition) return;
                edition = {
                        ...edition,
                        selections: [...edition.selections, creerSelection()]
                };
        }

        function mettreAJourSelection(selection: SelectionEquipement, cle: keyof SelectionEquipement, valeur: string) {
                if (!edition) return;
                edition = {
                        ...edition,
                        selections: edition.selections.map((item) => {
                                if (item.id !== selection.id) {
                                        return item;
                                }
                                if (cle === 'quantite') {
                                        const quantite = Number(valeur);
                                        return {
                                                ...item,
                                                quantite: Number.isNaN(quantite) || quantite <= 0 ? 1 : quantite
                                        };
                                }
                                return {
                                        ...item,
                                        [cle]: valeur
                                };
                        })
                };
        }

        function retirerSelection(id: string) {
                if (!edition) return;
                if (edition.selections.length === 1) {
                        return;
                }
                edition = {
                        ...edition,
                        selections: edition.selections.filter((selection) => selection.id !== id)
                };
        }

        function sauvegarder() {
                if (!edition) return;
                if (!edition.nom.trim()) {
                        message = 'Veuillez nommer le set.';
                        return;
                }
                if (!edition.serveur.trim()) {
                        message = 'Sélectionnez un serveur.';
                        return;
                }

                if (setActifId) {
                        setsStore.mettreAJour(setActifId, {
                                ...edition,
                                id: setActifId
                        });
                } else {
                        setsStore.ajouter(edition);
                        const derniers = get(setsStore);
                        const nouveau = derniers[derniers.length - 1];
                        setActifId = nouveau.id;
                }

                edition = null;
                message = 'Set enregistré avec succès.';
        }

        function annuler() {
                if (!setActifId) {
                        edition = null;
                        return;
                }
                selectionnerSet(setActifId);
        }
</script>

<section class="intro">
        <div>
                <h1>Construction de sets</h1>
                <p>
                        Assemblez vos équipements, associez-les à un serveur et laissez le calculateur estimer le coût total.
                </p>
        </div>
        <div class="boutons">
                <button class="primaire" on:click={creerNouveauSet}>Nouveau set</button>
        </div>
</section>

<section class="layout">
        <aside>
                <h2>Sets enregistrés</h2>
                {#if resumeSets.length === 0}
                        <p>Aucun set pour le moment. Créez-en un nouveau pour commencer.</p>
                {:else}
                        <ul>
                                {#each resumeSets as set}
                                        <li class:set-actif={set.id === setActifId}>
                                                <button on:click={() => selectionnerSet(set.id)}>{set.nom || 'Set sans nom'}</button>
                                                <div class="details">
                                                        <span>{set.serveur || 'Serveur non défini'}</span>
                                                        <span>{formatPrix(set.total)}</span>
                                                        {#if set.manquants}
                                                                <span class="alerte">{set.manquants} prix manquants</span>
                                                        {/if}
                                                </div>
                                                <div class="actions">
                                                        <button on:click={() => dupliquerSet(set.id)}>Dupliquer</button>
                                                        <button class="danger" on:click={() => supprimerSet(set.id)}>Supprimer</button>
                                                </div>
                                        </li>
                                {/each}
                        </ul>
                {/if}
        </aside>
        <div class="edition">
                {#if !edition}
                        <p>Sélectionnez un set existant ou créez-en un nouveau pour commencer l'édition.</p>
                {:else}
                        <div class="entete">
                                <label>
                                        <span>Nom du set</span>
                                        <input bind:value={edition.nom} placeholder="Ex. Feu PvM" />
                                </label>
                                <label>
                                        <span>Serveur</span>
                                        <select bind:value={edition.serveur}>
                                                <option value="" disabled>Sélectionnez un serveur</option>
                                                {#each listeServeurs as serveur}
                                                        <option value={serveur}>{serveur}</option>
                                                {/each}
                                        </select>
                                </label>
                                <div class="total">
                                        <span>Coût estimé</span>
                                        <strong>{formatPrix(totalEdition)}</strong>
                                </div>
                        </div>

                        <div class="selections">
                                <h3>Équipements</h3>
                                {#each edition.selections as selection (selection.id)}
                                        <div class="ligne">
                                                <select
                                                        bind:value={selection.nom}
                                                        on:change={(event) =>
                                                                mettreAJourSelection(
                                                                        selection,
                                                                        'nom',
                                                                        (event.currentTarget as HTMLSelectElement).value
                                                                )
                                                        }
                                                >
                                                        <option value="">— Sélectionner —</option>
                                                        {#each listeEquipements as equipement}
                                                                <option value={equipement.nom}>{equipement.nom}</option>
                                                        {/each}
                                                </select>
                                                <input
                                                        type="number"
                                                        min="1"
                                                        bind:value={selection.quantite}
                                                        on:change={(event) =>
                                                                mettreAJourSelection(
                                                                        selection,
                                                                        'quantite',
                                                                        (event.currentTarget as HTMLInputElement).value
                                                                )
                                                        }
                                                />
                                                <span class="prix-unitaire">
                                                        {#if selection.nom}
                                                                {#if carteEquipements.get(selection.nom)?.prixParServeur?.[edition.serveur] !== undefined}
                                                                        {formatPrix(
                                                                                carteEquipements.get(selection.nom)?.prixParServeur?.[edition.serveur]
                                                                        )}
                                                                {:else}
                                                                        <em>Prix manquant</em>
                                                                {/if}
                                                        {:else}
                                                                <em>Choisissez un équipement</em>
                                                        {/if}
                                                </span>
                                                <button class="danger" on:click={() => retirerSelection(selection.id)}>
                                                        Retirer
                                                </button>
                                        </div>
                                {/each}
                                <button class="ajout" on:click={ajouterSelection}>Ajouter un équipement</button>
                        </div>

                        <label class="notes">
                                <span>Notes</span>
                                <textarea rows="3" bind:value={edition.notes} placeholder="Objectifs, variantes, etc."></textarea>
                        </label>

                        {#if message}
                                <div class="message">{message}</div>
                        {/if}

                        <div class="boutons">
                                <button class="primaire" on:click={sauvegarder}>Enregistrer</button>
                                <button on:click={annuler}>Annuler</button>
                        </div>
                {/if}
        </div>
</section>

<style>
        .intro {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 1rem;
                flex-wrap: wrap;
        }

        .boutons {
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

        .layout {
                display: grid;
                gap: 2rem;
                grid-template-columns: minmax(240px, 1fr) 2fr;
        }

        aside {
                background: rgba(15, 23, 42, 0.55);
                padding: 1.5rem;
                border-radius: 1rem;
                border: 1px solid rgba(148, 163, 184, 0.25);
                display: flex;
                flex-direction: column;
                gap: 1rem;
        }

        aside ul {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: 1rem;
        }

        aside li {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                padding: 1rem;
                border-radius: 0.75rem;
                background: rgba(15, 23, 42, 0.5);
                border: 1px solid transparent;
        }

        aside li.set-actif {
                border-color: rgba(56, 189, 248, 0.6);
        }

        aside li button {
                align-self: flex-start;
                background: none;
                padding: 0;
                font-weight: 700;
                cursor: pointer;
        }

        aside li .details {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                font-size: 0.85rem;
                color: rgba(226, 232, 240, 0.75);
        }

        aside li .actions {
                display: flex;
                gap: 0.5rem;
        }

        .alerte {
                background: rgba(248, 113, 113, 0.2);
                color: #fecaca;
                padding: 0.2rem 0.5rem;
                border-radius: 999px;
        }

        .edition {
                background: rgba(15, 23, 42, 0.6);
                padding: 1.5rem;
                border-radius: 1rem;
                border: 1px solid rgba(148, 163, 184, 0.25);
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
        }

        .entete {
                display: grid;
                gap: 1rem;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }

        label {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
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

        .total {
                background: rgba(15, 23, 42, 0.55);
                border-radius: 0.75rem;
                padding: 0.75rem 1rem;
                display: flex;
                flex-direction: column;
                justify-content: center;
        }

        .total strong {
                font-size: 1.4rem;
        }

        .selections {
                display: flex;
                flex-direction: column;
                gap: 1rem;
        }

        .ligne {
                display: grid;
                gap: 0.75rem;
                grid-template-columns: minmax(180px, 1fr) 100px 160px auto;
                align-items: center;
        }

        .prix-unitaire {
                color: rgba(226, 232, 240, 0.75);
        }

        .ajout {
                align-self: flex-start;
        }

        .notes {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
        }

        .message {
                background: rgba(59, 130, 246, 0.2);
                border: 1px solid rgba(96, 165, 250, 0.4);
                color: #bfdbfe;
                padding: 0.75rem 1rem;
                border-radius: 0.75rem;
        }

        @media (max-width: 900px) {
                .layout {
                        grid-template-columns: 1fr;
                }
        }
</style>
