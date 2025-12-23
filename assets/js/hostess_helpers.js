
// === NEW HOSTESS FUNCTIONS FOR REASON/GAME ===
window.generateGameOptions = function (selected) {
    if (!window.db) return '<option disabled>Error: DB no cargada</option>';

    // VISUAL DEBUG MODE
    const matches = window.db.getMatches() || [];

    if (matches.length === 0) {
        // Try to inspect raw data deeply
        const rawDaily = window.db.data ? window.db.data.dailyInfo : null;
        const rawGamesCount = (rawDaily && rawDaily.games) ? rawDaily.games.length : 'N/A';
        return `<option disabled>DEBUG: 0 Partidos (Raw: ${rawGamesCount})</option>`;
    }

    let html = `<option disabled style="background:#222;color:#aaa;font-size:10px;">-- DEBUG: ${matches.length} ENCONTRADOS --</option>`;

    html += matches.map(m => {
        // Handle both structure types (legacy vs new)
        const matchName = m.match || (m.homeTeam && m.awayTeam ? `${m.homeTeam} vs ${m.awayTeam}` : 'Partido Desconocido');
        const isSelected = matchName === selected;
        return `<option value="${matchName}" ${isSelected ? 'selected' : ''}>${matchName} (${m.time})</option>`;
    }).join('');

    return html;
};

window.updateHostessReason = function (visitId, selectEl) {
    const reason = selectEl.value;
    const gameDiv = document.getElementById(`hostess-game-select-${visitId}`);

    // Show/Hide game select
    if (reason === 'Partido') {
        if (gameDiv) gameDiv.classList.remove('hidden');
    } else {
        if (gameDiv) gameDiv.classList.add('hidden');
    }

    // Save immediately
    window.db.updateVisitDetails(visitId, { reason });
};

window.updateHostessGame = function (visitId, selectEl) {
    const selectedGame = selectEl.value;
    window.db.updateVisitDetails(visitId, { selectedGame });
};
