window.SportIngestor = class {
    constructor() {
        this.baseUrl = "https://www.thesportsdb.com/api/v1/json/1"; // Using test key '1'
    }

    // 1. Fetch Events for a League
    // Endpoint: eventsnextleague.php?id={id}
    async fetchNextLeagueEvents(id) {
        try {
            const res = await fetch(`${this.baseUrl}/eventsnextleague.php?id=${id}`);
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            return data.events || [];
        } catch (e) {
            console.error(`Error fetching league ${id}:`, e);
            return [];
        }
    }

    // 2. Fetch Next 5 Events for a Team
    // Endpoint: eventsnext.php?id={id}
    async fetchNextTeamEvents(id) {
        try {
            const res = await fetch(`${this.baseUrl}/eventsnext.php?id=${id}`);
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            return data.events || [];
        } catch (e) {
            console.error(`Error fetching team ${id}:`, e);
            return [];
        }
    }

    // 3. ETL Process
    async runIngest() {
        // Read config from store
        // Ensure store is ready
        if (!window.db || !window.db.data) {
            console.error("Database not ready");
            return 0;
        }

        const config = window.db.data.ingestionConfig || { leagues: [], teams: [] };

        console.log('🚀 Starting Sports Ingest...', config);

        let allEvents = [];

        // A. Process Leagues
        if (config.leagues) {
            for (const league of config.leagues) {
                if (!league.active) continue;
                console.log(`📥 Fetching League: ${league.name} (${league.id})`);
                const events = await this.fetchNextLeagueEvents(league.id);
                allEvents = [...allEvents, ...events];
            }
        }

        // B. Process Teams
        if (config.teams) {
            for (const team of config.teams) {
                if (!team.active) continue;
                console.log(`📥 Fetching Team: ${team.name} (${team.id})`);
                const events = await this.fetchNextTeamEvents(team.id);
                allEvents = [...allEvents, ...events];
            }
        }

        if (allEvents.length === 0) {
            console.warn("⚠️ API returned no events (Free Key Limit?). Using MOCK DATA for demo.");
            // MOCK DATA INJECTION FOR DEMO
            // Simula partidos de las ligas configuradas para HOY y MAÑANA
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

            allEvents = [
                { idEvent: 'mock1', strLeague: 'Liga MX', strHomeTeam: 'Querétaro', strAwayTeam: 'Cruz Azul', dateEvent: today, strTime: '19:00:00' },
                { idEvent: 'mock2', strLeague: 'Liga MX', strHomeTeam: 'Club América', strAwayTeam: 'Chivas', dateEvent: today, strTime: '21:00:00' },
                { idEvent: 'mock3', strLeague: 'Premier League', strHomeTeam: 'Manchester City', strAwayTeam: 'Arsenal', dateEvent: tomorrow, strTime: '14:00:00' },
                { idEvent: 'mock4', strLeague: 'La Liga', strHomeTeam: 'Real Madrid', strAwayTeam: 'FC Barcelona', dateEvent: tomorrow, strTime: '20:00:00' },
                { idEvent: 'mock5', strLeague: 'NFL', strHomeTeam: 'Kansas City Chiefs', strAwayTeam: 'SF 49ers', dateEvent: today, strTime: '17:30:00' }
            ];
        }

        // C. Normalization & Deduplication
        // We use idEvent as unique key
        const uniqueEvents = {};
        allEvents.forEach(e => {
            if (e && e.idEvent) {
                uniqueEvents[e.idEvent] = e;
            }
        });

        // D. Transform to App Format
        const today = new Date().toISOString().split('T')[0];

        // Mapeo simple de nombres de ligas para íconos
        const normalizeLeague = (str) => {
            if (!str) return 'General';
            if (str.includes('Premier League')) return 'LIGA INGLESA';
            if (str.includes('La Liga') || str.includes('Primera Division')) return 'LIGA ESPAÑOLA';
            if (str.includes('Serie A')) return 'LIGA ITALIANA';
            if (str.includes('Liga MX')) return 'LIGA MX';
            if (str.includes('NFL')) return 'NFL';
            if (str.includes('NBA')) return 'NBA';
            if (str.includes('MLB')) return 'MLB';
            return str;
        };

        const newGames = Object.values(uniqueEvents).map(e => {
            // Transform '2023-10-27' to 'YYYY-MM-DD' (TheSportsDB usually sends YYYY-MM-DD)
            // Time is usually HH:mm:ss, we want HH:mm
            const timeParts = (e.strTime || "00:00").split(':');
            const shortTime = `${timeParts[0]}:${timeParts[1]}`;

            return {
                id: `api_${e.idEvent}`,
                league: normalizeLeague(e.strLeague),
                homeTeam: e.strHomeTeam,
                awayTeam: e.strAwayTeam,
                time: shortTime,
                date: e.dateEvent, // YYYY-MM-DD
                sport: e.strSport || 'Soccer',
                apiId: e.idEvent
            };
        }).filter(g => true); // ALLOW ALL DATES FOR MATCHING (Since API Key '1' returns 2021 data sometimes)

        // If we want to see them as "Today", we can project them?
        // For now, let's just see if they download.

        console.log(`✅ Found ${newGames.length} upcoming games.`);

        // E. Merge with Existing Manual Games
        // We don't want to delete manual games (id starts with 'g')
        // But we can overwrite previous API games to update times/dates
        const currentGames = window.db.getDailyInfo().games || [];
        const manualGames = currentGames.filter(g => !g.id.toString().startsWith('api_'));

        // Combine Manual + New API Games
        const finalGames = [...manualGames, ...newGames];

        // Sort by Date then Time
        finalGames.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
        });

        // F. Save
        const daily = window.db.getDailyInfo();
        daily.games = finalGames;
        window.db._save();

        // Sync Firebase if available
        if (window.dbFirestore && window.FB) {
            const { doc, setDoc } = window.FB;
            setDoc(doc(window.dbFirestore, 'config', 'daily'), { games: daily.games }, { merge: true })
                .catch(e => console.error('🔥 Sync ingest error', e));
        }

        // Trigger UI update
        if (typeof renderManagerDashboard === 'function') renderManagerDashboard('games');
        window.dispatchEvent(new CustomEvent('db-daily-update', { detail: { type: 'games' } }));

        return newGames.length;
    }
};

// Initializer
window.ingestor = new window.SportIngestor();
