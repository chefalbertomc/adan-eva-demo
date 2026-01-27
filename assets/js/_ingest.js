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
        let sport = type; // 'soccer', 'football', 'basketball', 'baseball'
        let league = id;  // 'mex.1', 'nfl', 'nba'

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
        console.log('🚀 Starting ESPN Ingest...', config);

        let newGames = [];
        const todayStr = new Date().toISOString().split('T')[0];

        if (config.leagues) {
            for (const league of config.leagues) {
                if (!league.active) continue;

                const events = await this.fetchEspnLeague(league);

                events.forEach(e => {
                    // ESPN Data Structure
                    const competition = e.competitions[0];
                    const gameDate = new Date(e.date); // "2026-01-27T19:00:00Z"
                    const dateStr = gameDate.toISOString().split('T')[0];

                    // Filter: Only Today or Future
                    // (Optional: ESPN usually returns current "scoreboard" window, often just today/tomorrow)
                    if (dateStr < todayStr) return;

                    const timeStr = gameDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

                    const home = competition.competitors.find(c => c.homeAway === 'home');
                    const away = competition.competitors.find(c => c.homeAway === 'away');

                    newGames.push({
                        id: `espn_${e.id}`,
                        league: league.name.toUpperCase(),
                        homeTeam: home.team.displayName,
                        awayTeam: away.team.displayName,
                        time: timeStr,
                        date: dateStr,
                        sport: league.type === 'soccer' ? 'Soccer' : 'General',
                        apiId: e.id,
                        // Extra Metadata
                        status: e.status.type.state, // 'pre', 'in', 'post'
                        logoHome: home.team.logo,
                        logoAway: away.team.logo
                    });
                });
            }
        }

        console.log(`✅ ESPN Found ${newGames.length} games.`);

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
