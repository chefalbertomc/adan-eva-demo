
// === NEW HOSTESS FUNCTIONS FOR REASON/GAME ===
window.generateGameOptions = function (selected) {
    const matches = window.db.getMatches() || [];
    if (matches.length === 0) return '<option disabled>Sin partidos registrados hoy</option>';
    return matches.map(m =>
        `<option value="${m.match}" ${m.match === selected ? 'selected' : ''}>${m.match} (${m.time})</option>`
    ).join('');
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
