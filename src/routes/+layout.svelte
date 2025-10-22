<script lang="ts">
        import favicon from '$lib/assets/favicon.svg';

        let { children } = $props();
</script>

<svelte:head>
        <link rel="icon" href={favicon} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link
                href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap"
                rel="stylesheet"
        />
</svelte:head>

<div class="app">
        <header class="topbar">
                <div class="brand">
                        <a href="/">Dofus Toolkit</a>
                        <span class="subtitle">Gestion et analyse des équipements</span>
                </div>
                <nav class="menu">
                        <a href="/equipements">Équipements</a>
                        <a href="/sets">Sets</a>
                        <a href="/comparateur">Comparateur</a>
                        <a href="/outils">Matrices & priorités</a>
                </nav>
        </header>
        <main class="contenu">{@render children?.()}</main>
        <footer class="pied-page">
                <p>
                        Projet de technologie émergente – Prototype SvelteKit pour analyser les équipements de Dofus.
                </p>
        </footer>
</div>

<style>
        :global(body) {
                margin: 0;
                font-family: 'Nunito', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: linear-gradient(180deg, #0f172a, #1e293b 45%, #0f172a 100%);
                color: #f8fafc;
                min-height: 100vh;
        }

        a {
                color: inherit;
        }

        .app {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
        }

        .topbar {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                padding: 1.5rem clamp(1rem, 4vw, 3rem);
                background: rgba(15, 23, 42, 0.85);
                backdrop-filter: blur(12px);
                border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }

        .brand {
                display: flex;
                flex-direction: column;
                gap: 0.2rem;
        }

        .brand a {
                font-size: clamp(1.25rem, 2vw, 1.75rem);
                font-weight: 700;
                text-decoration: none;
        }

        .subtitle {
                font-size: clamp(0.8rem, 1.5vw, 1rem);
                color: rgba(226, 232, 240, 0.7);
        }

        .menu {
                display: flex;
                flex-wrap: wrap;
                gap: clamp(0.75rem, 2vw, 1.5rem);
        }

        .menu a {
                text-decoration: none;
                font-weight: 600;
                color: rgba(226, 232, 240, 0.9);
                padding: 0.35rem 0.65rem;
                border-radius: 0.5rem;
                transition: background 0.2s ease, transform 0.2s ease;
        }

        .menu a:hover {
                background: rgba(148, 163, 184, 0.2);
                transform: translateY(-1px);
        }

        .contenu {
                flex: 1;
                padding: clamp(1.5rem, 4vw, 3rem);
                width: min(1100px, 90vw);
                margin: 0 auto;
                display: flex;
                flex-direction: column;
                gap: 2.5rem;
        }

        .pied-page {
                text-align: center;
                padding: 1.5rem clamp(1rem, 4vw, 3rem);
                font-size: 0.85rem;
                color: rgba(226, 232, 240, 0.65);
                border-top: 1px solid rgba(148, 163, 184, 0.2);
                background: rgba(15, 23, 42, 0.85);
        }

        @media (max-width: 720px) {
                .topbar {
                        align-items: flex-start;
                        gap: 1rem;
                }

                .menu {
                        width: 100%;
                }
        }
</style>
