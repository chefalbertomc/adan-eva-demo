window.SportIngestor = class {
    constructor() {
        // ESPN Public Endpoints (Hidden Gems 💎)
        this.baseUrl = "https://site.api.espn.com/apis/site/v2/sports";
    }

    // Helper: Mags ESPN Slug parts
    // soccer/mex.1
    // basketball/nba
    getEndpoint(type, id) {
        // Handle special cases
        if (type === 'racing') return `${this.baseUrl}/racing/f1/scoreboard`;
        if (type === 'mma') return `${this.baseUrl}/mma/ufc/scoreboard`;
        if (type === 'boxing') return `${this.baseUrl}/boxing/boxing/scoreboard`;

        // Basic routing
        if (id === 'nfl') return `${this.baseUrl}/football/nfl/scoreboard`;
        if (id === 'nba') return `${this.baseUrl}/basketball/nba/scoreboard`;
        if (id === 'mlb') return `${this.baseUrl}/baseball/mlb/scoreboard`;

        // Soccer routing
        if (type === 'soccer') {
            return `${this.baseUrl}/soccer/${id}/scoreboard`;
        }

        return null;
    }

    async fetchEspnLeague(leagueConfig) {
        const url = this.getEndpoint(leagueConfig.type, leagueConfig.id);
        if (!url) return [];

        try {
            console.log(`📡 ESPN Fetch: ${leagueConfig.name} (${url})`);
            const res = await fetch(url);
            if (!res.ok) throw new Error("ESPN Error " + res.status);
            const data = await res.json();

            return data.events || [];
        } catch (e) {
            console.warn(`⚠️ ESPN Fetch Failed for ${leagueConfig.name}:`, e);
            return [];
        }
    }

    async runIngest() {
        if (!window.db || !window.db.data) return console.error("Database not ready");

        const config = window.db.data.ingestionConfig || { leagues: [] };
        console.log('🚀 Starting ESPN Ingest (Full Coverage)...', config);

        let newGames = [];
        // CRITICAL FIX: Use LOCAL DATE string, not UTC
        // The user is in CST (-6), so UTC might be tomorrow.
        const todayLocal = new Date().toLocaleDateString('en-CA');
        console.log(`📅 Local Ingest Date: ${todayLocal}`);

        if (config.leagues) {
            for (const league of config.leagues) {
                if (!league.active) continue;

                const events = await this.fetchEspnLeague(league);
                console.log(`🔎 ESPN ${league.name}: Found ${events.length} raw events.`);

                events.forEach(e => {
                    // Start permissive: Accept 'pre' (scheduled), 'in' (live), 'post' (finished recently)
                    const status = e.status?.type?.state;

                    // ESPN Data Structure
                    const competition = e.competitions?.[0];
                    if (!competition) return;

                    const gameDate = new Date(e.date); // "2026-01-27T19:00:00Z" (UTC)
                    // Convert to Local Date String for storage
                    const dateStr = gameDate.toLocaleDateString('en-CA'); // YYYY-MM-DD local
                    const timeStr = gameDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

                    // 1. DATE FILTER: Allow Today AND Future (for upcoming games in list)
                    if (dateStr < todayLocal) {
                        // console.log(`⏩ Skipping old game: ${e.shortName} (${dateStr})`);
                        return;
                    }

                    const home = competition.competitors.find(c => c.homeAway === 'home');
                    const away = competition.competitors.find(c => c.homeAway === 'away');

                    // Fallbacks for sports like F1/Boxing where "home/away" concept differs
                    const homeName = home?.team?.displayName || e.name || 'Evento';
                    const awayName = away?.team?.displayName || '';
                    const homeLogo = home?.team?.logo || '';
                    const awayLogo = away?.team?.logo || '';

                    newGames.push({
                        id: `espn_${e.id}`,
                        league: league.name.toUpperCase(),
                        homeTeam: homeName,
                        awayTeam: awayName,
                        time: timeStr,
                        date: dateStr,
                        sport: league.type === 'soccer' ? 'Soccer' : 'General',
                        apiId: e.id,
                        // Extra Metadata
                        status: status,
                        logoHome: homeLogo,
                        logoAway: awayLogo
                    });
                });
            }
        }

        console.log(`✅ ESPN Found ${newGames.length} active/scheduled games.`);

        // Merge Logic
        const currentGames = window.db.getDailyInfo().games || [];

        // Remove only previous auto-ingested games (api_, af_, espn_, agent_)
        // BUT KEEP MANUAL ones
        const manualGames = currentGames.filter(g => {
            const id = g.id.toString();
            return !id.startsWith('api_') &&
                !id.startsWith('af_') &&
                !id.startsWith('espn_') &&
                !id.startsWith('agent_');
        });

        const finalGames = [...manualGames, ...newGames];

        // Sort
        finalGames.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
        });

        // Save
        const daily = window.db.getDailyInfo();
        daily.games = finalGames;
        window.db._save();

        if (window.dbFirestore && window.FB) {
            const { doc, setDoc } = window.FB;
            setDoc(doc(window.dbFirestore, 'config', 'daily'), { games: daily.games }, { merge: true })
                .catch(e => console.error('🔥 Sync ingest error', e));
        }

        // Update UI
        if (typeof renderManagerDashboard === 'function') renderManagerDashboard('games');
        window.dispatchEvent(new CustomEvent('db-daily-update', { detail: { type: 'games' } }));

        return newGames.length;
    }
};

window.ingestor = new window.SportIngestor();
