window.SportIngestor = class {
    constructor() {
        // 1. API-FOOTBALL CONFIG (Soccer)
        // ⚠️ USER: PLEASE PASTE YOUR RAPIDAPI KEY HERE
        this.apiFootballKey = "TU_API_KEY_AQUI";
        this.apiFootballHost = "v3.football.api-sports.io";
        this.apiFootballBase = "https://v3.football.api-sports.io";

        // 2. THESPORTSDB CONFIG (Others: NBA, NFL, etc.)
        this.legacyBaseUrl = "https://www.thesportsdb.com/api/v1/json/1";
    }

    // --- A. SOCCER: API-FOOTBALL ---
    async fetchSoccerFixtures(leagueId) {
        if (!this.apiFootballKey || this.apiFootballKey === "TU_API_KEY_AQUI") {
            console.warn("⚠️ Faltan credenciales de API-Football.");
            return [];
        }

        const today = new Date().toISOString().split('T')[0];
        // NOTE: European leagues usually start previous year. 
        // LIGA MX (262): Season 2025 covers Apertura 2025 / Clausura 2026
        // We will try '2025' as a safe default for current active season ID, or '2026' if explicitly requested.
        // User asked for 2026. Let's try 2026 for Mexico/MLS, but 2025 for Europe logic?
        // Let's stick to user request Season 2026, but if it fails we might need to fallback.

        let season = '2026';
        // Override for European Leagues which might still be '2025' in API logic until June
        if (['39', '140', '135', '2'].includes(leagueId)) season = '2025';

        const url = `${this.apiFootballBase}/fixtures?league=${leagueId}&season=${season}&date=${today}`;

        try {
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "x-rapidapi-host": this.apiFootballHost,
                    "x-rapidapi-key": this.apiFootballKey
                }
            });

            if (!res.ok) throw new Error("API-Football Error " + res.status);

            const data = await res.json();
            return data.response || [];
        } catch (e) {
            console.error(`⚽ Error fetching Soccer League ${leagueId}:`, e);
            return [];
        }
    }

    // --- B. OTHER SPORTS: THESPORTSDB (LEGACY) ---
    async fetchLegacyEvents(id) {
        try {
            const res = await fetch(`${this.legacyBaseUrl}/eventsnextleague.php?id=${id}`);
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            return data.events || [];
        } catch (e) {
            console.error(`🏀 Error fetching Legacy League ${id}:`, e);
            return [];
        }
    }

    // --- MAIN ETL ---
    async runIngest() {
        if (!window.db || !window.db.data) return console.error("Database not ready");

        const config = window.db.data.ingestionConfig || { leagues: [] };
        console.log('🚀 Starting Hybrid Sports Ingest...', config);

        let newGames = [];
        const today = new Date().toISOString().split('T')[0];

        // 1. Process configured leagues
        if (config.leagues) {
            for (const league of config.leagues) {
                if (!league.active) continue;

                if (league.type === 'soccer') {
                    // USE NEW API
                    console.log(`⚽ Fetching Soccer: ${league.name} (${league.id})`);
                    const fixtures = await this.fetchSoccerFixtures(league.id);

                    fixtures.forEach(f => {
                        // API-Football format normalization
                        const gameTime = new Date(f.fixture.date);
                        // Format HH:MM
                        const timeStr = gameTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                        newGames.push({
                            id: `af_${f.fixture.id}`, // af prefix for api-football
                            league: league.name.toUpperCase(),
                            homeTeam: f.teams.home.name,
                            awayTeam: f.teams.away.name,
                            time: timeStr,
                            date: today, // Ensure it's for today's list
                            sport: 'Soccer',
                            apiId: f.fixture.id,
                            // Extra Metadata if needed
                            logoHome: f.teams.home.logo,
                            logoAway: f.teams.away.logo
                        });
                    });

                } else {
                    // USE OLD API (NBA, NFL, MLB)
                    console.log(`🏀 Fetching Legacy: ${league.name} (${league.id})`);
                    const events = await this.fetchLegacyEvents(league.id);

                    events.forEach(e => {
                        // Strict filter: Only today or future
                        if (!e.dateEvent || e.dateEvent < today) return;

                        const timeParts = (e.strTime || "00:00").split(':');
                        const shortTime = `${timeParts[0]}:${timeParts[1]}`;

                        newGames.push({
                            id: `api_${e.idEvent}`,
                            league: league.name.toUpperCase(), // Use config name as standard
                            homeTeam: e.strHomeTeam,
                            awayTeam: e.strAwayTeam,
                            time: shortTime,
                            date: e.dateEvent,
                            sport: 'General',
                            apiId: e.idEvent
                        });
                    });
                }
            }
        }

        console.log(`✅ Found ${newGames.length} valid games via APIs.`);

        // 2. Merge Logic (Preserve Manual Games)
        const currentGames = window.db.getDailyInfo().games || [];
        const manualGames = currentGames.filter(g =>
            !g.id.toString().startsWith('api_') &&
            !g.id.toString().startsWith('af_') &&
            !g.id.toString().startsWith('agent_')
        );

        const finalGames = [...manualGames, ...newGames];

        // Sort
        finalGames.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
        });

        // 3. Save
        const daily = window.db.getDailyInfo();
        daily.games = finalGames;
        window.db._save();

        if (window.dbFirestore && window.FB) {
            const { doc, setDoc } = window.FB;
            setDoc(doc(window.dbFirestore, 'config', 'daily'), { games: daily.games }, { merge: true })
                .catch(e => console.error('🔥 Sync ingest error', e));
        }

        // 4. Update UI
        if (typeof renderManagerDashboard === 'function') renderManagerDashboard('games');
        window.dispatchEvent(new CustomEvent('db-daily-update', { detail: { type: 'games' } }));

        if (newGames.length === 0 && (!this.apiFootballKey || this.apiFootballKey === "TU_API_KEY_AQUI")) {
            alert("⚠️ OJO: No has puesto tu API KEY de API-Football.\nEdita assets/js/_ingest.js y ponla.");
        }

        return newGames.length;
    }
};

// Initializer
window.ingestor = new window.SportIngestor();
