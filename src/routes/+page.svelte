<script lang="ts">
        import { listerTousLesEffets } from '$lib/services/base-de-donnees';
        import { equipementsStore } from '$lib/stores/equipements';
        import { serversStore } from '$lib/stores/servers';

        const effets = listerTousLesEffets();

        $: totalEquipements = $equipementsStore.length;
        $: listeServeurs = $serversStore;
        $: equipementsAvecPrix = $equipementsStore.filter((eq) =>
                listeServeurs.some((serveur) => eq.prixParServeur?.[serveur] !== undefined)
        );
        $: tauxCouverturePrix = totalEquipements
                ? Math.round((equipementsAvecPrix.length / totalEquipements) * 100)
                : 0;
        $: statistiquesServeurs = listeServeurs.map((serveur) => {
                const prix = $equipementsStore
                        .map((eq) => eq.prixParServeur?.[serveur])
                        .filter((valeur): valeur is number => typeof valeur === 'number');
                const moyenne = prix.length
                        ? Math.round(prix.reduce((acc, valeur) => acc + valeur, 0) / prix.length)
                        : 0;
                return {
                        serveur,
                        moyenne,
                        couverture: prix.length
                };
        });
</script>

<section class="hero">
        <div>
                <h1>Tableau de bord Dofus</h1>
                <p>
                        Centralisez vos informations d'équipements, vos prix par serveur et vos outils d'aide à la décision.
                        Ce prototype SvelteKit accompagne le rapport de recherche et démontre la faisabilité du projet.
                </p>
                <div class="cta">
                        <a class="btn" href="/equipements">Gérer mon catalogue</a>
                        <a class="btn secondaire" href="/outils">Explorer les matrices</a>
                </div>
        </div>
        <div class="resume">
                <h2>Votre base locale</h2>
                <p><strong>{totalEquipements}</strong> équipements importés</p>
                <p><strong>{listeServeurs.length}</strong> serveurs suivis</p>
                <p><strong>{tauxCouverturePrix}%</strong> des objets ont un prix configuré</p>
                <ul>
                        {#each statistiquesServeurs as stats}
                                <li>
                                        {stats.serveur} — {stats.couverture} prix renseignés
                                        {#if stats.moyenne}
                                                (moyenne {stats.moyenne.toLocaleString('fr-FR')} K)
                                        {/if}
                                </li>
                        {/each}
                </ul>
        </div>
</section>

<section class="cartes">
        <article>
                <h3>Gestion des équipements</h3>
                <p>
                        Ajoutez ou importez vos équipements, maintenez des prix par serveur et accédez à une fiche détaillée
                        enrichie des recettes et panoplies associées.
                </p>
                <a href="/equipements">Accéder à la base d'équipements →</a>
        </article>
        <article>
                <h3>Construction de sets</h3>
                <p>
                        Assemblez des sets personnalisés, calculez leur coût total et conservez des notes sur vos objectifs
                        (PvM, PvP, farm...).
                </p>
                <a href="/sets">Créer un nouveau set →</a>
        </article>
        <article>
                <h3>Comparateur et exports</h3>
                <p>
                        Comparez plusieurs sets, exportez vos analyses en CSV ou PDF et identifiez instantanément la solution
                        la plus économique.
                </p>
                <a href="/comparateur">Comparer mes options →</a>
        </article>
        <article>
                <h3>Matrices d'aide à la décision</h3>
                <p>
                        Utilisez la matrice de décision pour pondérer vos critères et le quadrant d'Eisenhower pour hiérarchiser
                        vos actions.
                </p>
                <a href="/outils">Ouvrir les outils stratégiques →</a>
        </article>
</section>

<section class="stats">
        <h2>Effets disponibles dans la base</h2>
        <div class="tags">
                {#each effets as effet}
                        <span>{effet}</span>
                {/each}
        </div>
</section>

<style>
        .hero {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                gap: 2rem;
                align-items: stretch;
        }

        .hero h1 {
                font-size: clamp(2rem, 6vw, 3rem);
                margin-bottom: 0.5rem;
        }

        .hero p {
                margin: 0 0 1.5rem;
                line-height: 1.6;
                color: rgba(226, 232, 240, 0.85);
        }

        .resume ul {
                padding-left: 1.1rem;
                margin: 1rem 0 0;
                color: rgba(226, 232, 240, 0.7);
        }

        .cta {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
        }

        .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.75rem 1.5rem;
                border-radius: 999px;
                background: linear-gradient(120deg, #38bdf8, #6366f1);
                color: #0f172a;
                font-weight: 700;
                text-decoration: none;
                box-shadow: 0 10px 30px rgba(59, 130, 246, 0.25);
        }

        .btn.secondaire {
                background: rgba(148, 163, 184, 0.2);
                color: #e2e8f0;
                box-shadow: none;
        }

        .resume {
                background: rgba(15, 23, 42, 0.65);
                padding: 1.5rem;
                border-radius: 1rem;
                border: 1px solid rgba(148, 163, 184, 0.25);
                backdrop-filter: blur(8px);
        }

        .resume h2 {
                margin-top: 0;
                margin-bottom: 0.5rem;
        }

        .resume p {
                margin: 0.25rem 0;
                color: rgba(226, 232, 240, 0.8);
        }

        .cartes {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 1.5rem;
        }

        .cartes article {
                background: rgba(15, 23, 42, 0.65);
                border-radius: 1rem;
                padding: 1.5rem;
                border: 1px solid rgba(148, 163, 184, 0.25);
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                min-height: 220px;
        }

        .cartes h3 {
                margin: 0;
        }

        .cartes p {
                margin: 0;
                flex: 1;
                color: rgba(226, 232, 240, 0.8);
        }

        .cartes a {
                color: #38bdf8;
                text-decoration: none;
                font-weight: 600;
        }

        .cartes a:hover {
                text-decoration: underline;
        }

        .stats {
                background: rgba(15, 23, 42, 0.65);
                border-radius: 1rem;
                padding: 1.5rem;
                border: 1px solid rgba(148, 163, 184, 0.25);
        }

        .stats h2 {
                margin-top: 0;
                margin-bottom: 1rem;
        }

        .tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
        }

        .tags span {
                background: rgba(59, 130, 246, 0.15);
                color: #bae6fd;
                padding: 0.25rem 0.65rem;
                border-radius: 999px;
                font-size: 0.85rem;
        }
</style>
