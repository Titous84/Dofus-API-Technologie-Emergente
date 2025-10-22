<script lang="ts">
        import { page } from '$app/stores';
        import { equipementsStore } from '$lib/stores/equipements';
        import { serversStore } from '$lib/stores/servers';
        import { getPanoplieParEquipement, trouverRessource } from '$lib/services/base-de-donnees';
        import { formatPrix } from '$lib/utils/format';
        import type { Equipement } from '$lib/types';

        let equipement: Equipement | undefined;
        let panoplie: any = null;

        // 🔍 Synchronise la page avec le paramètre d'URL encodé
        $: nomRecherche = decodeURIComponent($page.params.nom ?? '');
        $: equipement = $equipementsStore.find((item) => item.nom === nomRecherche);
        $: panoplie = equipement ? getPanoplieParEquipement(equipement.nom) : null;

        function effetToImageUrl(effet: string): string {
                const mapping: Record<string, string> = {
                        Vitalité: 'pv',
                        Force: 'terre',
                        Intelligence: 'feu',
                        Chance: 'eau',
                        Agilité: 'air',
                        Sagesse: 'sagesse',
                        Tacle: 'tacle',
                        Fuite: 'fuite',
                        Portée: 'po',
                        PA: 'pa',
                        PM: 'pm',
                        Prospection: 'pp',
                        Puissance: 'puissance',
                        'Retrait PA': 'retraitPA',
                        'Retrait PM': 'retraitPM',
                        'Esquive PA': 'esquivePA',
                        'Esquive PM': 'esquivePM',
                        '% Critique': 'cc',
                        'Dommage(s)': 'dommages',
                        Initiative: 'initiative',
                        '% Résistance Neutre': 'resNeutre',
                        '% Résistance Terre': 'resTerre',
                        '% Résistance Feu': 'resFeu',
                        '% Résistance Eau': 'resEau',
                        '% Résistance Air': 'resAir',
                        '% Résistance Critiques': 'resCrit',
                        '% Résistance Poussée': 'resPoussee'
                };

                const filename = mapping[effet] || effet.toLowerCase().replace(/\s|\(|\)|%/g, '');
                return `https://dofusdb.fr/icons/effects/${filename}.png`;
        }

        function mettreAJourPrix(serveur: string, valeur: string) {
                // 💾 Enregistre immédiatement la valeur saisie manuellement pour ce serveur
                if (!equipement) return;
                const prix = Number(valeur.replace(',', '.'));
                equipementsStore.definirPrix(
                        equipement.nom,
                        serveur,
                        Number.isNaN(prix) || valeur === '' ? undefined : prix
                );
        }
</script>

{#if !equipement}
        <p>Équipement non trouvé.</p>
{:else}
        <a class="retour" href="/equipements">← Retour à la liste</a>
        <header class="entete">
                <div>
                        <h1>{equipement.nom}</h1>
                        <p class="meta">
                                <strong>Niveau :</strong> {equipement.niveau ?? '—'} · <strong>Type :</strong>
                                {equipement.Type ?? '—'}
                        </p>
                        {#if equipement.description}
                                <p class="description">{equipement.description}</p>
                        {/if}
                </div>
                {#if equipement.illustration_url}
                        <img src={equipement.illustration_url} alt={`Illustration de ${equipement.nom}`} />
                {/if}
        </header>

        <section class="prix">
                <h2>Prix par serveur</h2>
                {#if $serversStore.length === 0}
                        <p class="info">Ajoutez un serveur depuis la liste des équipements pour pouvoir saisir un prix.</p>
                {:else}
                        <div class="grille">
                                {#each $serversStore as serveur}
                                        <label>
                                                <span>{serveur}</span>
                                                <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={equipement.prixParServeur?.[serveur] ?? ''}
                                                        on:change={(event) =>
                                                                mettreAJourPrix(
                                                                        serveur,
                                                                        (event.currentTarget as HTMLInputElement).value
                                                                )
                                                        }
                                                />
                                                <small>{formatPrix(equipement.prixParServeur?.[serveur])}</small>
                                        </label>
                                {/each}
                        </div>
                {/if}
        </section>

        {#if equipement.effets}
                <section class="effets">
                        <h2>Effets</h2>
                        <ul>
                                {#each Object.entries(equipement.effets) as [effet, valeur]}
                                        <li>
                                                <img
                                                        src={effetToImageUrl(effet)}
                                                        alt={effet}
                                                        on:error={(event) => ((event.currentTarget as HTMLImageElement).style.display = 'none')}
                                                />
                                                <span>
                                                        {effet} :
                                                        {#if Array.isArray(valeur)}
                                                                {valeur[0]} à {valeur[1]}
                                                        {:else}
                                                                {valeur}
                                                        {/if}
                                                </span>
                                        </li>
                                {/each}
                        </ul>
                </section>
        {/if}

        {#if equipement.recette}
                <section class="recette">
                        <h2>Recette</h2>
                        <ul>
                                {#each Object.entries(equipement.recette) as [nomIngredient, quantite]}
                                        {@const ressource = trouverRessource(nomIngredient)}
                                        <li>
                                                {#if ressource}
                                                        <img src={ressource.illustration_url} alt={ressource.nom} />
                                                        <span>{quantite} × {ressource.nom}</span>
                                                {:else}
                                                        <span>{quantite} × {nomIngredient}</span>
                                                {/if}
                                        </li>
                                {/each}
                        </ul>
                </section>
        {/if}

        {#if panoplie}
                <section class="panoplie">
                        <h2>Panoplie : {panoplie.nom}</h2>
                        <ul>
                                {#each panoplie.composition as nom}
                                        <li>
                                                {#if nom === equipement.nom}
                                                        <strong>{nom}</strong>
                                                {:else}
                                                        <a href={`/equipements/${encodeURIComponent(nom)}`}>{nom}</a>
                                                {/if}
                                        </li>
                                {/each}
                        </ul>
                </section>
        {/if}
{/if}

<style>
        .retour {
                display: inline-flex;
                margin-bottom: 1rem;
                color: #38bdf8;
                text-decoration: none;
        }

        .entete {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                gap: 1.5rem;
                background: rgba(15, 23, 42, 0.65);
                padding: 1.5rem;
                border-radius: 1rem;
                border: 1px solid rgba(148, 163, 184, 0.25);
        }

        .entete img {
                max-height: 140px;
        }

        .meta {
                color: rgba(226, 232, 240, 0.75);
        }

        .description {
                color: rgba(226, 232, 240, 0.85);
        }

        section {
                background: rgba(15, 23, 42, 0.55);
                padding: 1.5rem;
                border-radius: 1rem;
                border: 1px solid rgba(148, 163, 184, 0.2);
                margin-top: 1.5rem;
        }

        .grille {
                display: grid;
                gap: 1rem;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }

        .grille label {
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
        }

        .info {
                color: rgba(226, 232, 240, 0.75);
                margin: 0;
        }

        .grille input {
                border-radius: 0.65rem;
                border: 1px solid rgba(148, 163, 184, 0.3);
                padding: 0.5rem 0.75rem;
                background: rgba(15, 23, 42, 0.65);
                color: #e2e8f0;
        }

        .grille small {
                color: rgba(226, 232, 240, 0.6);
        }

        .effets ul,
        .recette ul,
        .panoplie ul {
                list-style: none;
                padding: 0;
                margin: 0;
                display: grid;
                gap: 0.5rem;
        }

        .effets li,
        .recette li,
        .panoplie li {
                display: flex;
                align-items: center;
                gap: 0.75rem;
        }

        .effets img,
        .recette img {
                height: 32px;
        }

        .panoplie a {
                color: #38bdf8;
                text-decoration: none;
        }

        .panoplie a:hover {
                text-decoration: underline;
        }
</style>
