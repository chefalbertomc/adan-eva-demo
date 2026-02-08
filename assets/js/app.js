// State
let STATE = {
  user: null, // { id, role, name }
  branch: null, // { id, name }
};

// DOM Elements
const appContainer = document.getElementById('app');

// Database of Standard Team Names for Autocomplete

// HELPER: Confirm Release Table
window.confirmAndRelease = function (visitId) {
  console.log('🛑 Requesting release for visit:', visitId);
  // Simple direct confirm
  if (confirm('¿CONFIRMAR: Finalizar visita y liberar mesa?')) {
    try {
      window.db.releaseTable(visitId);
      // Optional: force refresh if needed, but the listener should handle it
      if (window.showToast) window.showToast('✅ Mesa liberada correctamente', 'success');
    } catch (e) {
      console.error(e);
      alert('Error al liberar mesa: ' + e.message);
    }
  }
};
// AUTO-REFRESH LISTENER
window.addEventListener('db-daily-update', (event) => {
  console.log(`⚡ DB UPDATE EVENT RECEIVED: ${event.detail.type}`);

  // 1. REFRESH WAITER "Partidos" IF ACTIVE
  if (document.getElementById('waitercontent-partidos') && !document.getElementById('waitercontent-partidos').classList.contains('hidden')) {
    console.log('🔄 Auto-refreshing Waiter Games Tab');
    if (typeof window.renderWaiterDashboard === 'function') window.renderWaiterDashboard();
  }

  // 2. REFRESH MANAGER "Games" IF ACTIVE
  if (window.CURRENT_MANAGER_TAB === 'games' && document.getElementById('managertab-games') && document.getElementById('managertab-games').classList.contains('active')) {
    console.log('🔄 Auto-refreshing Manager Games Tab');
    if (typeof renderManagerGamesTab === 'function') {
      const container = document.getElementById('manager-content');
      if (container) renderManagerGamesTab(container);
    }
  }

  // 3. HOSTESS - SHOW TOAST INSTEAD OF RELOAD (To avoid input loss)
  if (document.getElementById('content-tables') && !document.getElementById('content-tables').classList.contains('hidden')) {
    if (window.showToast) window.showToast('📅 Información de Partidos Actualizada', 'success');
  }

  // 4. MANAGER NOTIFICATIONS (NEW REQUESTS & ASSIGNMENTS)
  // Check if we are the Manager
  if (STATE.user && (STATE.user.role === 'manager' || STATE.user.role === 'admin')) {

    // A. Check for NEW Custom Game Requests ("OTRO")
    const currentRequests = window.db.getDailyInfo().gameRequests || [];
    const prevRequestsCount = window.PREV_REQ_COUNT !== undefined ? window.PREV_REQ_COUNT : currentRequests.length;

    if (currentRequests.length > prevRequestsCount) {
      const newReq = currentRequests[currentRequests.length - 1]; // Grab last one
      if (window.showToast) window.showToast(`🔔 Solicitud de Hostess: ${newReq.gameName}`, 'info');
      // Refresh games tab if active to show it
      if (window.CURRENT_MANAGER_TAB === 'games') renderManagerDashboard('games');
    }
    window.PREV_REQ_COUNT = currentRequests.length;

    // B. Check for Game Assignments on Tables (Simple Check)
    // This is harder to track diffs without heavy state, but we can check if a "recent" change happened
    // For now, let's just log it. A full "Waiter requested X" requires dedicated event log in DB.
  }
});

window.KNOWN_TEAMS = [
  // LIGA MX (COMPLETA)
  "Club América", "Chivas Guadalajara", "Cruz Azul", "Pumas UNAM", "Tigres UANL", "Rayados Monterrey", "Toluca", "Santos Laguna", "Pachuca", "León", "Atlas", "Querétaro", "Puebla", "Atlético San Luis", "Mazatlán FC", "Necaxa", "Xolos Tijuana", "Juárez Bravos",

  // LIGA INGLESA (PREMIER LEAGUE)
  "Manchester City", "Arsenal", "Liverpool", "Aston Villa", "Tottenham Hotspur", "Manchester United", "Newcastle United", "West Ham United", "Chelsea", "Bournemouth", "Wolverhampton", "Brighton", "Fulham", "Crystal Palace", "Brentford", "Nottingham Forest", "Everton", "Luton Town", "Burnley", "Sheffield United", "Leicester City", "Leeds United", "Southampton",

  // LIGA ESPAÑOLA (LA LIGA)
  "Real Madrid", "Girona", "FC Barcelona", "Atlético Madrid", "Athletic Bilbao", "Real Sociedad", "Real Betis", "Valencia", "Las Palmas", "Getafe", "Osasuna", "Alavés", "Villarreal", "Rayo Vallecano", "Sevilla", "Mallorca", "Celta de Vigo", "Cádiz", "Granada", "Almería",

  // LIGA ITALIANA (SERIE A)
  "Inter Milan", "Juventus", "AC Milan", "Atalanta", "Bologna", "AS Roma", "Fiorentina", "Lazio", "Napoli", "Torino", "Monza", "Genoa", "Lecce", "Empoli", "Frosinone", "Udinese", "Sassuolo", "Verona", "Cagliari", "Salernitana",

  // UEFA CHAMPIONS LEAGUE (Top clubs de Europa)
  "Bayern Munich", "Paris Saint-Germain", "PSG", "Borussia Dortmund", "RB Leipzig", "Benfica", "Porto", "Sporting CP", "Ajax", "PSV Eindhoven", "Shakhtar Donetsk", "Celtic", "Club Brugge", "Red Star Belgrade", "Dinamo Zagreb", "Salzburg", "Copenhagen", "Galatasaray", "Fenerbahce",


  // NHL (HOCKEY)
  "Boston Bruins", "Colorado Avalanche", "Dallas Stars", "Florida Panthers", "New York Rangers", "Vancouver Canucks", "Winnipeg Jets", "Carolina Hurricanes", "Edmonton Oilers", "Vegas Golden Knights", "Los Angeles Kings", "Nashville Predators", "Philadelphia Flyers", "Tampa Bay Lightning", "Toronto Maple Leafs", "Detroit Red Wings", "New York Islanders", "Pittsburgh Penguins", "St. Louis Blues", "Washington Capitals", "Arizona Coyotes", "Buffalo Sabres", "Calgary Flames", "Chicago Blackhawks", "Columbus Blue Jackets", "Minnesota Wild", "Montréal Canadiens", "New Jersey Devils", "Ottawa Senators", "San Jose Sharks", "Seattle Kraken", "Anaheim Ducks",

  // NFL
  "Kansas City Chiefs", "San Francisco 49ers", "Dallas Cowboys", "Pittsburgh Steelers", "New England Patriots", "Philadelphia Eagles", "Baltimore Ravens", "Buffalo Bills", "Miami Dolphins", "New York Jets", "Cincinnati Bengals", "Cleveland Browns", "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Tennessee Titans", "Denver Broncos", "Las Vegas Raiders", "Los Angeles Chargers", "New York Giants", "Washington Commanders", "Green Bay Packers", "Detroit Lions", "Minnesota Vikings", "Chicago Bears", "Tampa Bay Buccaneers", "New Orleans Saints", "Atlanta Falcons", "Carolina Panthers", "Los Angeles Rams", "Seattle Seahawks", "Arizona Cardinals",

  // NBA
  "Los Angeles Lakers", "Golden State Warriors", "Boston Celtics", "Chicago Bulls", "Miami Heat", "New York Knicks", "Brooklyn Nets", "Philadelphia 76ers", "Toronto Raptors", "Milwaukee Bucks", "Detroit Pistons", "Indiana Pacers", "Cleveland Cavaliers", "Orlando Magic", "Charlotte Hornets", "Atlanta Hawks", "Washington Wizards", "Denver Nuggets", "Minnesota Timberwolves", "Oklahoma City Thunder", "Portland Trail Blazers", "Utah Jazz", "Phoenix Suns", "Los Angeles Clippers", "Sacramento Kings", "Dallas Mavericks", "Houston Rockets", "San Antonio Spurs", "Memphis Grizzlies", "New Orleans Pelicans",

  // MLB
  "New York Yankees", "Los Angeles Dodgers", "Boston Red Sox", "Chicago Cubs", "St. Louis Cardinals", "San Francisco Giants", "Atlanta Braves", "Houston Astros", "New York Mets", "Philadelphia Phillies", "Texas Rangers", "Toronto Blue Jays", "Seattle Mariners", "Baltimore Orioles", "Tampa Bay Rays", "Minnesota Twins", "Detroit Tigers", "Chicago White Sox", "Cleveland Guardians", "Kansas City Royals", "Los Angeles Angels", "Oakland Athletics", "San Diego Padres", "Arizona Diamondbacks", "Colorado Rockies", "Miami Marlins", "Washington Nationals", "Cincinnati Reds", "Pittsburgh Pirates", "Milwaukee Brewers"
].sort();

// Helper to refresh datalist from _store or initialization
window.updateTeamDatalist = function () {
  const dataList = document.getElementById('team-suggestions');
  if (!dataList) return;

  // Merge potential duplicates and sort
  const uniqueTeams = [...new Set(window.KNOWN_TEAMS)].sort();

  dataList.innerHTML = uniqueTeams.map(t => `<option value="${t}">`).join('');
  console.log('🔄 Team datalist updated. Count:', uniqueTeams.length);
};

// Router / Navigation
function navigateTo(view, params = {}) {
  appContainer.innerHTML = '';

  switch (view) {
    case 'login':
      renderLogin();
      break;
    case 'branch-select':
      renderBranchSelect();
      break;
    case 'hostess-dashboard':
      if (STATE.user?.role !== 'hostess') {
        alert('Acceso denegado: Se requiere rol Hostess');
        renderLogin();
        return;
      }
      renderHostessDashboard();
      break;
    case 'waiter-dashboard':
      // SECURITY CHECK: If Hostess tries to load Waiter Dashboard by mistake
      if (STATE.user?.role !== 'waiter') {
        console.error("⛔ Security Alert: User " + STATE.user?.username + " (Role: " + STATE.user?.role + ") tried to access Waiter Dashboard.");
        // If role is hostess, force redirect to hostess dashboard
        if (STATE.user?.role === 'hostess') {
          navigateTo('hostess-dashboard');
          return;
        }
        renderLogin();
        return;
      }
      renderWaiterDashboard();
      break;
    case 'waiter-detail':
      renderWaiterDetail(params.visitId);
      break;
    case 'manager-dashboard':
      renderManagerDashboard(); // Branch specific
      break;
    case 'regional-dashboard':
      renderRegionalDashboard(); // Global + Reports
      break;
    case 'super-admin-dashboard':
      renderSuperAdminDashboard(); // User Management
      break;
    case 'enrich-customer':
      renderEnrichCustomer(params);
      break;
    case 'view-customer':
      renderViewCustomer(params.customerId);
      break;
    case 'customer-detail':
      // Alias for view-customer
      renderViewCustomer(params.customerId);
      break;
    default:
      renderLogin();
  }
}

// Views
function renderLogin() {
  const div = document.createElement('div');
  div.className = 'login-screen';
  div.style.background = '#000000'; // PURE BLACK BACKGROUND
  div.style.minHeight = '100vh';
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.style.padding = '20px';

  div.innerHTML = `
    <div class="login-container" style="max-width: 450px; width: 100%; text-align: center;">
      
      <!-- LOGO SUPERIOR (ADAN & EVA) -->
      <div style="margin-bottom: 40px;">
          <img src="assets/img/duckos-logo.png" alt="ADAN & EVA" style="width: 500px; height: auto; display: block; margin: 0 auto;">
      </div>
      
      <!-- Inputs Lado a Lado -->
      <div style="display: flex; gap: 20px; margin-bottom: 30px;">
        <div style="flex: 1; text-align: center;">
            <label style="display: block; color: #FFFFFF; font-family: 'Inter', sans-serif; font-size: 12px; margin-bottom: 8px; font-weight: 500;">USUARIO</label>
            <input type="text" id="username" autocomplete="username" 
               style="width: 100%; background: transparent; border: 2px solid #FFD200; color: #FFFFFF; padding: 12px; font-size: 16px; outline: none; border-radius: 0; box-shadow: 0 0 15px rgba(255, 210, 0, 0.2); font-family: 'Inter', sans-serif; text-align: center;">
        </div>
        <div style="flex: 1; text-align: center;">
            <label style="display: block; color: #FFFFFF; font-family: 'Inter', sans-serif; font-size: 12px; margin-bottom: 8px; font-weight: 500;">CONTRASEÑA</label>
            <input type="password" id="password" autocomplete="current-password" 
               style="width: 100%; background: transparent; border: 2px solid #FFD200; color: #FFFFFF; padding: 12px; font-size: 16px; outline: none; border-radius: 0; box-shadow: 0 0 15px rgba(255, 210, 0, 0.2); font-family: 'Inter', sans-serif; text-align: center;">
        </div>
      </div>
      
      <!-- Botón Ingresar -->
      <button onclick="handleLogin()" 
              style="width: 100%; background-color: #FFD200; color: #000000; font-family: 'Oswald', sans-serif; font-size: 24px; font-weight: 700; padding: 15px; border: none; cursor: pointer; text-transform: uppercase; margin-bottom: 80px; letter-spacing: 1px; transition: transform 0.1s ease;">
        INGRESAR
      </button>
      
      <!-- LOGO INFERIOR (Buffalo Wild Wings) -->
      <div style="display: flex; justify-content: center; opacity: 1;">
         <img src="assets/img/bww-logo.png" alt="Buffalo Wild Wings" style="height: 200px; width: auto;" 
              onerror="this.style.display='none'; document.getElementById('bww-text-fallback').style.display='block';">
         
         <!-- Mensaje simple si falta el logo -->
         <p id="bww-text-fallback" style="display:none; color: #FFD200; font-family: 'Oswald', sans-serif;">(Guarda el logo como assets/img/bww-logo.png)</p>
      </div>

      <!-- VERSION TAG -->
      <div class="text-[10px] text-gray-600 mt-2">
        v22.39 (Fix: Undefined Variable)
        <br>
        <div class="flex gap-2 justify-center mt-2">
            <button onclick="window.location.reload(true)" style="background: #333; color: white; padding: 5px 10px; border: none; border-radius: 4px;">
                🔄 Recargar
            </button>
            <button onclick="emergencyCacheClear()" style="background: #d97706; color: white; padding: 5px 10px; border: none; border-radius: 4px;">
                🧹 Limpiar Caché
            </button>
            <button onclick="localStorage.removeItem('ADANYEVA_DATA_V3'); window.location.reload(true);" style="background: #ef4444; color: white; padding: 5px 10px; border: none; border-radius: 4px;">
               ⚠️ BORRAR DATOS Y RESYNC
            </button>
        </div>
      </div>

    </div>
  `;
  appContainer.appendChild(div);
}

function handleLogin() {
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  const user = window.db.login(u, p);

  if (user) {
    STATE.user = user;

    // Auto-assign branch if user has one
    if (user.branchId) {
      const b = window.db.getBranches().find(x => x.id === user.branchId);
      if (b) STATE.branch = { id: b.id, name: b.name };
    }

    // Save Session (REMOVED as requested)
    // localStorage.setItem('ADANYEVA_SESSION', JSON.stringify({ user, branch: STATE.branch }));

    // Redirect
    console.log('Login successful. Role:', user.role);

    // STRICT REDIRECTION BY ROLE
    switch (user.role) {
      case 'waiter':
        navigateTo('waiter-dashboard');
        break;
      case 'hostess':
        navigateTo('hostess-dashboard');
        break;
      case 'manager':
        navigateTo('manager-dashboard');
        break;
      case 'regional':
        navigateTo('regional-dashboard');
        break;
      case 'admin':
        navigateTo('super-admin-dashboard');
        break;
      default:
        alert('Rol desconocido: ' + user.role);
        renderLogin();
    }
  } else {
    alert('Credenciales inválidas');
  }
}

function handleLogout() {
  location.reload(); // Revert to simple reload behavior
}

function goBack() {
  // Smart back navigation based on role
  if (!STATE.user) { renderLogin(); return; }
  const r = STATE.user.role;
  if (r === 'admin') navigateTo('super-admin-dashboard');
  else if (r === 'regional') navigateTo('regional-dashboard');
  else if (r === 'manager') navigateTo('manager-dashboard');
  else if (r === 'hostess') navigateTo('hostess-dashboard');
  else if (r === 'waiter') navigateTo('waiter-dashboard');
  else renderLogin();
}

function renderBranchSelect() {
  const branches = window.db.getBranches();

  const div = document.createElement('div');
  div.className = 'flex flex-col items-center justify-center p-4';
  div.style.height = '100vh';

  let buttonsHtml = branches.map(b =>
    `<button onclick="selectBranch('${b.id}', '${b.name}')" class="btn-secondary w-full p-4 text-lg mb-2">${b.name}</button>`
  ).join('');

  div.innerHTML = `
    <div class="card flex flex-col items-center gap-md" style="max-width: 400px; width: 100%;">
      <h2 class="text-center">Seleccionar Sucursal</h2>
      ${buttonsHtml}
    </div>
  `;
  appContainer.appendChild(div);
}

function selectBranch(id, name) {
  STATE.branch = { id, name };
  if (STATE.user.role === 'hostess') navigateTo('hostess-dashboard');
  if (STATE.user.role === 'waiter') navigateTo('waiter-dashboard');
}

// ------ HOSTESS ------
function renderHostessDashboard() {
  appContainer.innerHTML = '';

  // FETCH DATA
  const waitlist = window.db.getWaitlist();
  const activeVisits = window.db.getVisits().filter(v => v.status === 'seated');
  // FIX: Define reservations variable to prevent crash
  const reservations = window.db.getReservations ? window.db.getReservations() : [];

  // Calculate stats
  // const totalCapacity = 40; 
  // Let's count capacity dynamically if possible or static
  const totalCapacity = 40;
  const currentCount = activeVisits.reduce((sum, v) => sum + parseInt(v.pax || 0), 0);

  const div = document.createElement('div');
  div.innerHTML = `
      <!--Header-->
    <header class="bg-black/50 p-4 border-b border-gray-800 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
      <div>
        <h1 class="text-2xl font-black text-yellow-500 italic tracking-tighter">RECEPCIÓN</h1>
        <div class="text-[10px] text-gray-400 font-mono tracking-widest">${STATE.branch ? STATE.branch.name.toUpperCase() : 'JURIQUILLA'}</div>
      </div>
      <button onclick="handleLogout()" class="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded border border-gray-700">CERRAR SESIÓN</button>
    </header>

    <!--Stat Bar-->
    <div class="grid grid-cols-4 gap-2 p-2">
       <div onclick="switchHostessTab('checkin')" class="bg-gray-900 border border-gray-800 p-2 rounded text-center cursor-pointer hover:bg-gray-800">
          <div class="text-lg font-black text-white">📋</div>
          <div class="text-[10px] text-gray-500 font-bold uppercase">Check-In</div>
       </div>
       <div onclick="switchHostessTab('tables')" class="bg-gray-900 border border-gray-800 p-2 rounded text-center cursor-pointer hover:bg-gray-800">
          <div class="text-lg font-black text-yellow-500">${activeVisits.length}</div>
          <div class="text-[10px] text-gray-500 font-bold uppercase">Mesas</div>
       </div>
       <div onclick="switchHostessTab('waitlist')" class="bg-gray-900 border border-gray-800 p-2 rounded text-center cursor-pointer hover:bg-gray-800">
          <div class="text-lg font-black text-blue-500">${waitlist.length}</div>
          <div class="text-[10px] text-gray-500 font-bold uppercase">Espera</div>
       </div>
       <div onclick="switchHostessTab('reservations')" class="bg-gray-900 border border-gray-800 p-2 rounded text-center cursor-pointer hover:bg-gray-800">
          <div class="text-lg font-black text-purple-500">${reservations.length}</div>
          <div class="text-[10px] text-gray-500 font-bold uppercase">Reservas</div>
       </div>
    </div>
    
    <!--Tab Content: Check - In(Default)-- >
      <div id="content-checkin" class="tab-content pb-24">
        <div class="card bg-gray-900/50 border border-yellow-500/30">
          <h2 class="text-xl font-black text-white mb-6 flex items-center gap-2">
            📋 NUEVO CHECK-IN
          </h2>

          <!-- Step 1: Customer Info -->
          <div class="space-y-4 mb-6">
            <label class="text-xs text-gray-500 mb-1 block uppercase font-bold tracking-widest">Paso 1: Datos del Cliente</label>

            <!-- Search Bar (New Client Flow) -->
            <div class="relative">
              <input type="text" id="customer-search"
                class="w-full bg-black border border-gray-700 rounded-lg p-4 text-white text-lg font-bold focus:border-yellow-500 outline-none"
                placeholder="🔍 Buscar Cliente (Nombre/Tel)" onkeyup="searchCustomer(this.value)">

                <div id="search-results" class="hidden absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-lg mt-1 z-50 max-h-60 overflow-y-auto shadow-2xl"></div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <input type="text" id="h-firstname" placeholder="NOMBRE" class="bg-gray-900 text-white border border-gray-700 rounded p-4 uppercase font-bold text-sm tracking-wide">
                <input type="text" id="h-lastname" placeholder="APELLIDO PATERNO" class="bg-gray-900 text-white border border-gray-700 rounded p-4 uppercase font-bold text-sm tracking-wide">
                </div>
                <input type="text" id="h-lastname2" placeholder="APELLIDO MATERNO (Opcional)" class="bg-gray-900 text-white border border-gray-700 rounded p-4 uppercase font-bold text-sm tracking-wide w-full">

                  <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-400 text-sm font-bold uppercase">PERSONAS:</span>
                      <div class="flex items-center gap-4">
                        <button onclick="adjustPax(-1)" class="w-10 h-10 rounded-full bg-gray-700 text-white font-bold hover:bg-gray-600">-</button>
                        <span id="h-pax" class="text-2xl font-black text-white">2</span>
                        <button onclick="adjustPax(1)" class="w-10 h-10 rounded-full bg-gray-700 text-white font-bold hover:bg-gray-600">+</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Step 2: Assign Table -->
                <div class="space-y-4">
                  <label class="text-xs text-gray-500 mb-1 block uppercase font-bold tracking-widest">Paso 2: Asignación</label>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="text-[10px] text-gray-500 mb-1 block uppercase">Mesa #</label>
                      <input type="number" id="h-table" class="w-full bg-gray-900 text-white border border-gray-700 rounded p-4 text-center font-bold text-xl focus:border-green-500 outline-none" placeholder="#">
                    </div>
                    <div>
                      <label class="text-[10px] text-gray-500 mb-1 block uppercase">Mesero</label>
                      <select id="h-waiter" class="w-full bg-gray-900 text-white border border-gray-700 rounded p-4 font-bold text-sm h-[62px]">
                        <option value="">Auto-Asignar</option>
                        ${waiters.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
                      </select>
                    </div>
                  </div>

                  <button onclick="processHostessCheckIn()" class="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-5 rounded-xl uppercase tracking-widest text-lg shadow-lg transform active:scale-95 transition mt-4">
                    ✅ INGRESAR MESA
                  </button>

                  <button onclick="addToWaitlist()" class="w-full bg-gray-800 border-2 border-gray-700 text-white font-bold py-3 rounded-lg uppercase tracking-widest text-sm hover:border-blue-500 transition mt-2">
                    ⏱️ Agregar a Lista de Espera
                  </button>
                </div>
            </div>
          </div>

          <!-- Tab Content: Tables (Active Visits) -->
          <div id="content-tables" class="tab-content hidden">
            <div class="card">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-black text-white italic tracking-tighter">MESAS HABILITADAS</h2>

                <div class="text-right">
                  <div class="text-yellow-500 font-bold text-xl leading-none">${currentCount} / ${totalCapacity}</div>
                  <div class="text-[10px] text-gray-400 uppercase tracking-widest">Ocupación</div>
                </div>
              </div>

              <!-- Filter -->
              <div class="mb-4">
                <select id="filter-waiter" onchange="filterTablesByWaiter()" class="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-white font-bold">
                  <option value="all">👁️ Ver Todas</option>
                  ${waiters.map(w => `<option value="${w.id}">Mesero: ${w.name}</option>`).join('')}
                </select>
              </div>

              ${activeVisits.length === 0 ? `
          <div class="text-center py-12 text-gray-500">
             <div class="text-6xl mb-4">🍽️</div>
             <p>No hay mesas activas</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${activeVisits.map(v => {
    const waiterName = waiters.find(w => w.id === v.waiterId)?.name || 'Sin Asignar';
    const timeSeated = new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
              <div class="table-card bg-gray-900 border-l-4 border-green-500 rounded-r-xl p-4 shadow-lg relative animate-fade-in" data-waiter-id="${v.waiterId}">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="text-3xl font-black text-white shadow-text">#${v.table}</span>
                        <div class="text-xs text-gray-400 font-mono mt-1">🕒 ${timeSeated}</div>
                    </div>
                    <div class="text-right">
                        <div class="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300 border border-gray-700 mb-1 inline-block">
                           👤 ${waiterName.split(' ')[0]}
                        </div>
                        <div class="text-xl font-bold text-white">${v.pax} <span class="text-sm font-normal text-gray-500">pax</span></div>
                    </div>
                </div>
                
                <div class="border-t border-gray-800 pt-3 mt-2">
                    <div class="font-bold text-white text-lg truncate mb-1">${v.customerName}</div>
                    ${v.vip ? `<div class="inline-block bg-yellow-600/20 text-yellow-500 text-[10px] px-2 py-0.5 rounded border border-yellow-600/50 mb-2 font-bold tracking-wider">VIP ${v.vip.toUpperCase()}</div>` : ''}
                    
                    <button onclick="document.getElementById('edit-visit-${v.id}').classList.toggle('hidden')" class="w-full text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 py-2 rounded mt-2 border border-gray-700 transition">
                       ⚡ GESTIONAR
                    </button>
                    
                    <!-- Hidden Editor -->
                    <div id="edit-visit-${v.id}" class="hidden mt-3 space-y-2 bg-black/20 p-2 rounded border border-gray-800">
                        <!-- Cambio Mesa -->
                        <div class="bg-black/40 p-3 rounded-lg border border-gray-800">
                            <div class="text-[10px] text-gray-500 uppercase font-bold mb-2">Cambiar Mesa</div>
                            <div class="flex gap-2">
                               <input type="number" id="new-table-${v.id}" placeholder="#" class="bg-gray-900 text-white border border-gray-700 rounded p-3 w-full text-center font-bold text-lg" min="1">
                               <button onclick="doChangeTable('${v.id}')" class="bg-blue-600 text-white rounded px-4 font-bold hover:bg-blue-500 text-xl">✓</button>
                            </div>
                        </div>
                        <!-- Cambio Mesero -->
                         <div class="bg-black/40 p-3 rounded-lg border border-gray-800">
                            <div class="text-[10px] text-gray-500 uppercase font-bold mb-2">Cambiar Mesero</div>
                            <div class="flex gap-2">
                               <select id="new-waiter-${v.id}" class="bg-gray-900 text-white border border-gray-700 rounded p-3 w-full text-sm font-bold truncate">
                                  ${waiters.map(w => `<option value="${w.id}" ${w.id === v.waiterId ? 'selected' : ''}>${w.name}</option>`).join('')}
                               </select>
                               <button onclick="doChangeWaiter('${v.id}')" class="bg-blue-600 text-white rounded px-4 font-bold hover:bg-blue-500 text-xl">✓</button>
                            </div>
                        </div>
                    </div>

                    <button onclick="window.confirmAndRelease('${v.id}')"
                        class="w-full bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-700/50 font-bold py-3 rounded-lg mb-4 uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                        🆓 FINALIZAR VISITA / LIBERAR MESA
                    </button>
                </div>
                
                <div id="table-status-${v.id}" class="hidden mt-2 p-3 rounded text-center text-lg font-bold animate-pulse text-yellow-400"></div>
              </div>
            `}).join('')}
          </div>
        `}
            </div>
          </div>

          <!-- Tab Content: Waitlist - TAB SEPARADO -->
          <div id="content-waitlist" class="tab-content hidden">
            <div class="card">
              <h3 class="text-xl mb-4">Cola de Espera (${waitlist.length})</h3>
              ${waitlist.length === 0 ? `
          <div class="text-center py-12">
            <div class="text-6xl mb-4">⏱️</div>
            <p class="text-xl text-secondary">No hay clientes en espera</p>
            <p class="text-sm text-secondary mt-2">Usa "Agregar a Lista de Espera" desde Check-In</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${waitlist.map((entry, idx) => `
              <div class="bg-yellow-900/20 border-2 border-yellow-500 p-4 rounded-lg hover:bg-yellow-900/30 transition">
                <div class="flex items-start gap-3 mb-3">
                  <span class="bg-yellow-500 text-black w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                    ${idx + 1}
                  </span>
                  <div class="flex-1">
                    <div class="font-bold text-xl mb-1">${entry.customerName}</div>
                    <div class="text-base text-gray-300">${entry.pax} personas</div>
                    <div class="text-sm text-gray-400">${entry.phone || 'Sin teléfono'}</div>
                    <div class="text-xs text-gray-500 mt-1">🕐 ${new Date(entry.addedAt).toLocaleTimeString()}</div>
                  </div>
                </div>
                <!-- ASIGNACIÓN INLINE -->
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <input type="number" id="wl-table-${entry.id}" placeholder="Mesa #" 
                         class="p-2 text-xl bg-gray-900 rounded font-bold text-center border border-green-600" 
                         style="min-width: 80px;" min="1">
                  <select id="wl-waiter-${entry.id}" class="p-2 text-sm bg-gray-900 rounded font-bold border border-green-600">
                    <option value="">Mesero</option>
                    ${window.db.data.users.filter(u => u.role === 'waiter' && (!u.branchId || u.branchId === STATE.branch.id)).map(w =>
      `<option value="${w.id}">${w.name}</option>`
    ).join('')}
                  </select>
                </div>
                <!-- BOTONES DE ACCIÓN -->
                <div class="flex gap-2">
                  <button onclick="doAssignFromWaitlist('${entry.id}')" 
                          class="btn-primary flex-1 text-base py-3 font-bold">
                    ✅ ASIGNAR
                  </button>
                  <button onclick="removeFromWaitlist('${entry.id}')" 
                          class="btn-secondary text-sm px-3 py-2 bg-red-900 hover:bg-red-800 whitespace-nowrap">
                    ❌
                  </button>
                </div>
                <!-- STATUS MESSAGE -->
                <div id="wl-status-${entry.id}" class="hidden mt-2 p-2 rounded text-center text-sm font-bold"></div>
              </div>
            `).join('')}
          </div>
        `}
            </div>
            <!-- Tab Content: Reservations (WITH ALERTS AND ASSIGNMENT) -->
            <div id="content-reservations" class="tab-content hidden">
              <div class="card">
                <div class="flex justify-between items-center mb-6">
                  <h3 class="text-xl font-bold text-white flex items-center gap-2">
                    📅 Reservaciones de Hoy
                    <span class="bg-gray-800 text-xs px-2 py-0.5 rounded text-gray-400 font-normal">Solo Lectura</span>
                  </h3>
                  <!-- Timer for refresh/alerts -->
                  <div id="res-timer" class="text-xs text-gray-500 font-mono">Actualizado: Justo ahora</div>
                </div>

                ${reservations.length === 0 ? `
                  <div class="text-center py-12 opacity-50">
                    <div class="text-6xl mb-4">📭</div>
                    <p class="text-xl text-gray-400">No hay reservaciones para hoy</p>
                  </div>
                ` : `
                  <div class="space-y-4">
                    ${reservations.map(r => {
      // ALERT LOGIC
      const now = new Date();
      const [hours, mins] = r.time.split(':');
      const resTime = new Date();
      resTime.setHours(parseInt(hours), parseInt(mins), 0, 0);

      const diffMins = (resTime - now) / 60000;
      let alertClass = "border-gray-600";
      let bgClass = "bg-gray-800";
      let statusBadge = "";

      // Late (> 15 mins past)
      if (diffMins < -15) {
        alertClass = "border-red-600 animate-pulse";
        bgClass = "bg-red-900/20";
        statusBadge = '<span class="text-red-500 font-bold text-xs uppercase">⚠️ RETRASADO</span>';
      }
      // Arriving Soon (< 15 mins before)
      else if (diffMins <= 15 && diffMins >= 0) {
        alertClass = "border-yellow-500";
        bgClass = "bg-yellow-900/20";
        statusBadge = '<span class="text-yellow-500 font-bold text-xs uppercase">🕒 PRÓXIMO</span>';
      }

      // VIP Styles
      if (r.vip === 'diamond') {
        alertClass = "border-blue-400";
        bgClass = "bg-blue-900/10";
      } else if (r.vip === 'blazin') {
        alertClass = "border-orange-500";
        bgClass = "bg-orange-900/10";
      }

      return `
                      <div class="p-4 rounded-xl border-l-4 ${alertClass} ${bgClass} shadow-lg relative group transition-all hover:bg-gray-800">
                        <div class="flex justify-between items-start">
                          <div class="flex-1">
                             <div class="flex items-center gap-2 mb-1">
                                <span class="text-2xl font-black text-white">${r.time}</span>
                                ${statusBadge}
                                ${r.vip === 'diamond' ? '<span class="bg-blue-900 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500">DIAMOND</span>' : r.vip === 'blazin' ? '<span class="bg-orange-900 text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-500">BLAZIN</span>' : ''}
                             </div>
                             <div class="font-bold text-white text-lg leading-tight mb-1">${r.customerName}</div>
                             <div class="text-sm text-gray-400 flex items-center gap-3">
                                <span>👥 ${r.pax} pax</span>
                                <span>📞 ${r.phone || 'N/A'}</span>
                             </div>
                             ${r.notes ? `<div class="mt-2 text-xs text-gray-400 italic bg-black/20 p-2 rounded border border-gray-700/50">📝 "${r.notes}"</div>` : ''}
                             ${r.game ? `<div class="mt-2 text-xs text-blue-300 font-bold flex items-center gap-1">📺 PARTIDO: ${r.game}</div>` : ''}
                          </div>

                          <!-- ACTIONS -->
                          <div class="flex flex-col gap-2">
                             <button onclick="
                                document.getElementById('h-firstname').value = '${r.customerName.split(' ')[0]}';
                                document.getElementById('h-lastname').value = '${r.customerName.split(' ').slice(1).join(' ') || ''}';
                                document.getElementById('h-pax').innerText = '${r.pax}';
                                switchHostessTab('checkin');
                                if(window.showToast) window.showToast('✅ Datos cargados. Asigna mesa ahora.', 'success');
                             " 
                             class="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-lg transform active:scale-95 transition flex items-center gap-1">
                                🛎️ CHECK-IN
                             </button>
                          </div>
                        </div>
                      </div>
                      `;
    }).join('')}
                  </div>
                `}
              </div>
            </div>

            <!-- BOTTOM NAVIGATION BAR -->
            <nav class="bottom-nav">
              <button onclick="switchHostessTab('checkin')" id="tab-checkin" class="bottom-nav-item active" style="position: relative;">
                <span class="bottom-nav-icon">📋</span>
                <span class="bottom-nav-label">Check-In</span>
              </button>
              <button onclick="switchHostessTab('tables')" id="tab-tables" class="bottom-nav-item" style="position: relative;">
                <span class="bottom-nav-icon">🍽️</span>
                <span class="bottom-nav-label">Mesas</span>
                ${activeVisits.length > 0 ? `<span class="bottom-nav-badge">${activeVisits.length}</span>` : ''}
              </button>
              <button onclick="switchHostessTab('waitlist')" id="tab-waitlist" class="bottom-nav-item" style="position: relative;">
                <span class="bottom-nav-icon">⏱️</span>
                <span class="bottom-nav-label">Espera</span>
                ${waitlist.length > 0 ? `<span class="bottom-nav-badge">${waitlist.length}</span>` : ''}
              </button>
              <button onclick="switchHostessTab('reservations')" id="tab-reservations" class="bottom-nav-item" style="position: relative;">
                <span class="bottom-nav-icon">📅</span>
                <span class="bottom-nav-label">Reservas</span>
                ${reservations.length > 0 ? `<span class="bottom-nav-badge">${reservations.length}</span>` : ''}
              </button>
            </nav>

            <!-- DuckOS Footer -->
            <div class="dashboard-footer">
              Powered by <span style="color: #F97316;">DuckOS</span> | Bar & Restaurant Solutions
            </div>
            `;

  // Add class for bottom nav padding
  div.className = 'p-4 max-w-6xl mx-auto has-bottom-nav';
  appContainer.appendChild(div);
}

function switchHostessTab(tabName) {
  // Hide all tab content
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));

  // Remove active from all bottom nav items
  document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));

  // Show selected tab content
  const contentEl = document.getElementById(`content-${tabName}`);
  if (contentEl) contentEl.classList.remove('hidden');

  // Activate bottom nav item
  const tabEl = document.getElementById(`tab-${tabName}`);
  if (tabEl) tabEl.classList.add('active');
}

// Filtrar mesas por mesero
function filterTablesByWaiter() {
  const filterValue = document.getElementById('filter-waiter').value;
  const tableCards = document.querySelectorAll('.table-card');

  tableCards.forEach(card => {
    const waiterId = card.getAttribute('data-waiter-id');
    if (filterValue === 'all' || waiterId === filterValue) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Hostess Logic
let selectedCustomer = null;

function searchCustomer(query) {
  const resultsDiv = document.getElementById('search-results');
  if (query.length < 2) {
    resultsDiv.classList.add('hidden');
    return;
  }

  const matches = window.db.searchCustomers(query);

  // Build results HTML
  let resultsHtml = '';

  if (matches.length > 0) {
    // Show matching customers
    resultsHtml = matches.map(c =>
      `<div onclick="selectCustomer('${c.id}')" 
            class="cursor-pointer border-b-2 border-gray-700 transition"
            style="padding: 16px; background: #000000; min-height: 70px;"
            onmouseover="this.style.background='#CA8A04'" 
            onmouseout="this.style.background='#000000'">
               <div class="text-lg font-bold" style="color: #FFFFFF;">${c.firstName} ${c.lastName} ${c.lastName2 || ''}</div>
               <div class="text-sm" style="color: #9CA3AF;">ID: ${c.id} | ${c.team || 'Sin Equipo'}</div>
             </div>`
    ).join('');

    // Add "NEW CLIENT" option at the bottom
    resultsHtml += `
            <div onclick="dismissSearchAndContinue()"
              class="cursor-pointer transition"
              style="padding: 16px; background: #14532D; min-height: 60px; border-top: 2px solid #22C55E;"
              onmouseover="this.style.background='#166534'"
              onmouseout="this.style.background='#14532D'">
              <div class="text-lg font-bold" style="color: #22C55E;">➕ Es CLIENTE NUEVO</div>
              <div class="text-sm" style="color: #86EFAC;">Cerrar lista y continuar con el registro</div>
            </div>`;
  } else {
    // No matches - show "new client" message
    resultsHtml = `
      <div onclick="dismissSearchAndContinue()" 
           class="cursor-pointer transition"
           style="padding: 16px; background: #14532D; min-height: 60px;"
           onmouseover="this.style.background='#166534'" 
           onmouseout="this.style.background='#14532D'">
             <div class="text-lg font-bold" style="color: #22C55E;">✅ Cliente no encontrado</div>
             <div class="text-sm" style="color: #86EFAC;">Se creará un nuevo registro</div>
           </div>`;
  }

  // Add close button at top
  resultsHtml = `
            <div style="padding: 8px 16px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333;">
              <span style="color: #9CA3AF; font-size: 12px;">${matches.length} resultado(s) encontrado(s)</span>
              <button onclick="dismissSearchResults()" style="background: none; border: none; color: #EF4444; font-size: 20px; cursor: pointer; padding: 4px 8px;">✕</button>
            </div>
            ` + resultsHtml;

  resultsDiv.innerHTML = resultsHtml;
  resultsDiv.classList.remove('hidden');
}

// Close search results
function dismissSearchResults() {
  const resultsDiv = document.getElementById('search-results');
  if (resultsDiv) {
    resultsDiv.classList.add('hidden');
  }
}

// Close and continue with new client
function dismissSearchAndContinue() {
  dismissSearchResults();
  selectedCustomer = null; // Clear any previous selection
  // Focus on the last name field to continue registration
  const lastnameField = document.getElementById('h-lastname');
  if (lastnameField) {
    lastnameField.focus();
  }
}

// Manager Logic: Customer Search
function searchCustomerForManager(query) {
  const resultsDiv = document.getElementById('res-search-results');
  if (!resultsDiv) return;

  if (query.length < 2) {
    resultsDiv.classList.add('hidden');
    return;
  }

  const matches = window.db.searchCustomers(query);
  let resultsHtml = '';

  if (matches.length > 0) {
    resultsHtml = matches.map(c =>
      `<div onclick="selectManagerCustomer('${c.id}', '${c.firstName} ${c.lastName}', '${c.vip || ''}')" 
            class="cursor-pointer border-b border-gray-700 p-3 hover:bg-yellow-900/20 transition flex justify-between items-center group">
               <div>
                 <div class="font-bold text-white group-hover:text-yellow-500">${c.firstName} ${c.lastName}</div>
                 <div class="text-xs text-gray-500">ID: ${c.id}</div>
               </div>
               ${c.vip ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-500 text-yellow-500 uppercase">${c.vip}</span>` : ''}
             </div>`
    ).join('');
  } else {
    resultsHtml = `
      <div class="p-4 text-center cursor-pointer hover:bg-gray-800" onclick="dismissManagerSearch()">
         <div class="text-sm font-bold text-green-500">➕ Nuevo Cliente</div>
         <div class="text-xs text-gray-400">Continuar llenando datos manuales</div>
      </div>`;
  }

  // Close button
  resultsHtml = `
            <div style="padding: 4px 8px; background: #111; display: flex; justify-content: flex-end; border-bottom: 1px solid #333;">
              <button onclick="dismissManagerSearch()" class="text-red-500 hover:text-red-400 text-xs font-bold uppercase">Cerrar ✕</button>
            </div>
            ` + resultsHtml;

  resultsDiv.innerHTML = resultsHtml;
  resultsDiv.classList.remove('hidden');
}

function selectManagerCustomer(id, name, vip) {
  document.getElementById('res-name').value = name;

  // Auto-select VIP
  // Reset all first
  document.querySelectorAll('.res-vip-btn').forEach(b => {
    b.classList.remove('selected', 'border-orange-500', 'border-blue-400', 'text-orange-500', 'text-blue-400');
    b.classList.add('border-gray-600', 'text-gray-400');
  });

  const vipInput = document.getElementById('res-vip');
  vipInput.value = vip || ''; // Empty if no VIP

  const display = document.getElementById('res-vip-display');
  if (display) {
    if (vip === 'blazin') {
      display.textContent = '🔥 BLAZIN';
      display.className = 'text-orange-500 font-bold';
    } else if (vip === 'diamond') {
      display.textContent = '💎 DIAMOND';
      display.className = 'text-blue-400 font-bold';
    } else {
      display.textContent = 'Normal';
      display.className = 'text-gray-400 font-bold';
    }
  }

  // Auto-fill Phone if available in DB
  const customers = window.db.getCustomers() || [];
  const customer = customers.find(c => c.id === id);
  if (customer && customer.phone) {
    const phoneInput = document.getElementById('res-phone');
    if (phoneInput) phoneInput.value = customer.phone;
  }

  dismissManagerSearch();
}

function dismissManagerSearch() {
  const resultsDiv = document.getElementById('res-search-results');
  if (resultsDiv) resultsDiv.classList.add('hidden');
}

function selectCustomer(id) {
  const c = window.db.data.customers.find(x => x.id === id);
  if (c) {
    document.getElementById('h-firstname').value = c.firstName;
    document.getElementById('h-lastname').value = c.lastName;
    document.getElementById('h-lastname2').value = c.lastName2 || '';
    selectedCustomer = c;
    document.getElementById('search-results').classList.add('hidden');
    alert(`Cliente seleccionado: ${c.firstName} ${c.lastName} ${c.lastName2 || ''}`);
  }
}

// === NUEVO FLUJO: CHECK-IN SIN PROMPTS ===
function doCheckIn() {
  // SAFETY CHECK: Ensure we are NOT in Waitlist Mode
  const checkinBtn = document.getElementById('btn-checkin');
  if (checkinBtn && checkinBtn.classList.contains('hidden')) {
    console.warn('Prevented doCheckIn while in Waitlist Mode (possible double-trigger).');
    return;
  }

  try {
    const fname = document.getElementById('h-firstname').value.trim();
    const lname = document.getElementById('h-lastname').value.trim();
    const lname2 = document.getElementById('h-lastname2').value.trim();
    const pax = document.getElementById('h-pax').value;
    const table = document.getElementById('h-table').value;
    const waiterId = document.getElementById('h-waiter').value;

    // Validaciones
    if (!fname) {
      showCheckinStatus('⚠️ Escribe el NOMBRE del cliente', 'warning');
      return;
    }
    if (!lname) {
      showCheckinStatus('⚠️ Escribe el APELLIDO del cliente', 'warning');
      return;
    }
    if (!pax || pax < 1) {
      showCheckinStatus('⚠️ Indica el número de PERSONAS', 'warning');
      return;
    }
    if (!table) {
      showCheckinStatus('⚠️ Selecciona una MESA', 'warning');
      return;
    }
    if (!waiterId) {
      showCheckinStatus('⚠️ Selecciona un MESERO', 'warning');
      return;
    }

    // CHECK IF TABLE IS OCCUPIED (New Safety Check)
    if (window.db.isTableOccupied(table, STATE.branch.id)) {
      showCheckinStatus(`⛔ La Mesa ${table} ya está ocupada.`, 'error');
      // Reset button state just in case
      /* (Not strictly needed here as we return early, but good practice if button logic was above) */
      return;
    }

    // LOCK BUTTON TO PREVENT DUPLICATES
    if (checkinBtn.getAttribute('data-processing') === 'true') return;
    checkinBtn.setAttribute('data-processing', 'true');
    checkinBtn.innerHTML = '⏳ PROCESANDO...';
    checkinBtn.style.opacity = '0.7';
    let customer = selectedCustomer;
    if (!customer || customer.firstName !== fname || customer.lastName !== lname) {
      customer = window.db.createCustomer({
        firstName: fname,
        lastName: lname,
        lastName2: lname2
      });
    }

    // Crear visita
    window.db.createVisit({
      branchId: STATE.branch.id,
      customerId: customer.id,
      date: new Date().toISOString(),
      pax: parseInt(pax),
      table: table,
      waiterId: waiterId
    });

    // Mostrar éxito
    const waiterName = window.db.data.users.find(u => u.id === waiterId)?.name || waiterId;
    showCheckinStatus(`✅ CHECK-IN EXITOSO<br>Mesa ${table} | ${customer.firstName} ${customer.lastName}<br>Mesero: ${waiterName}`, 'success');

    selectedCustomer = null;

    // Limpiar y recargar después de 2 segundos
    setTimeout(() => {
      navigateTo('hostess-dashboard');
    }, 2000);

  } catch (error) {
    console.error('Error en check-in:', error);
    showCheckinStatus('❌ Error en check-in. Ver consola.', 'error');
    if (checkinBtn) {
      checkinBtn.removeAttribute('data-processing');
      checkinBtn.innerHTML = 'ASIGNAR MESA';
      checkinBtn.style.opacity = '1';
    }
  }
}

// === CAMBIAR A MODO LISTA DE ESPERA ===
function toggleWaitlistMode() {
  // Ocultar sección de mesa/mesero
  document.getElementById('section-mesa-mesero').classList.add('hidden');
  // Mostrar sección de teléfono
  document.getElementById('section-waitlist-phone').classList.remove('hidden');
  // Cambiar botones
  document.getElementById('btn-checkin').classList.add('hidden');
  document.getElementById('btn-waitlist-toggle').classList.add('hidden');
  document.getElementById('btn-waitlist-confirm').classList.remove('hidden');
  document.getElementById('btn-waitlist-cancel').classList.remove('hidden');
}

// === CANCELAR MODO LISTA DE ESPERA ===
function cancelWaitlistMode() {
  // Mostrar sección de mesa/mesero
  document.getElementById('section-mesa-mesero').classList.remove('hidden');
  // Ocultar sección de teléfono
  document.getElementById('section-waitlist-phone').classList.add('hidden');
  // Restaurar botones
  document.getElementById('btn-checkin').classList.remove('hidden');
  document.getElementById('btn-waitlist-toggle').classList.remove('hidden');
  document.getElementById('btn-waitlist-confirm').classList.add('hidden');
  document.getElementById('btn-waitlist-cancel').classList.add('hidden');
  // Limpiar teléfono
  document.getElementById('h-phone').value = '';
}

// === AGREGAR A LISTA DE ESPERA SIN PROMPTS ===
function doAddToWaitlist() {
  try {
    const fname = document.getElementById('h-firstname').value.trim();
    const lname = document.getElementById('h-lastname').value.trim();
    const pax = document.getElementById('h-pax').value;
    const phone = document.getElementById('h-phone').value.trim();

    // Validaciones
    if (!fname) {
      showCheckinStatus('⚠️ Escribe el NOMBRE del cliente', 'warning');
      return;
    }
    if (!pax || pax < 1) {
      showCheckinStatus('⚠️ Indica el número de PERSONAS', 'warning');
      return;
    }

    const customerName = `${fname} ${lname}`.trim();

    window.db.addToWaitlist({
      branchId: STATE.branch.id,
      customerName,
      pax: parseInt(pax),
      phone: phone || '',
      estimatedWait: 15
    });

    showCheckinStatus(`✅ AGREGADO A LISTA DE ESPERA<br>${customerName} | ${pax} personas${phone ? '<br>📱 ' + phone : ''}`, 'success');

    // Recargar y cambiar a tab de lista
    setTimeout(() => {
      navigateTo('hostess-dashboard');
      setTimeout(() => switchHostessTab('waitlist'), 100);
    }, 1500);

  } catch (error) {
    console.error('Error en lista de espera:', error);
    showCheckinStatus('❌ Error. Ver consola.', 'error');
  }
}

// === MOSTRAR MENSAJE DE ESTADO ===
function showCheckinStatus(message, type) {
  const statusDiv = document.getElementById('checkin-status');
  if (!statusDiv) return;

  statusDiv.innerHTML = message;
  statusDiv.classList.remove('hidden');

  // Estilos según tipo
  if (type === 'success') {
    statusDiv.style.background = 'rgba(34, 197, 94, 0.2)';
    statusDiv.style.border = '2px solid #22C55E';
    statusDiv.style.color = '#86EFAC';
  } else if (type === 'warning') {
    statusDiv.style.background = 'rgba(234, 179, 8, 0.2)';
    statusDiv.style.border = '2px solid #EAB308';
    statusDiv.style.color = '#FCD34D';
    // Auto-ocultar warnings
    setTimeout(() => statusDiv.classList.add('hidden'), 3000);
  } else if (type === 'error') {
    statusDiv.style.background = 'rgba(239, 68, 68, 0.2)';
    statusDiv.style.border = '2px solid #EF4444';
    statusDiv.style.color = '#FCA5A5';
  }
}

// === FUNCIONES LEGACY (mantener por compatibilidad) ===
function promptCheckIn() { doCheckIn(); }
function promptWaitlist() { toggleWaitlistMode(); }

function handleCheckIn() {
  try {
    const fname = document.getElementById('h-firstname').value;
    const lname = document.getElementById('h-lastname').value;
    const lname2 = document.getElementById('h-lastname2').value;
    const pax = document.getElementById('h-pax').value;
    const waiterId = document.getElementById('h-waiter').value;
    const table = document.getElementById('h-table').value;

    console.log('Check-in data:', { fname, lname, lname2, pax, waiterId, table });

    if (!fname || !lname || !pax || !waiterId || !table) {
      alert('Faltan campos obligatorios (Nombre, Apellido, Pax, Mesero, Mesa)');
      return;
    }

    // Validate Table
    if (window.db.isTableOccupied(table, STATE.branch.id)) {
      alert(`⛔ LA MESA ${table} YA ESTÁ OCUPADA. Por favor verifica.`);
      return;
    }

    // Validate waiter can use this table (BARRA restriction)
    const waiter = window.db.data.users.find(u => u.id === waiterId);
    if (waiter && !window.db.isValidTable(table, STATE.branch.id, waiter.position)) {
      alert(`⛔ MESA INVÁLIDA: Las mesas 300 son exclusivas de BARRA. El mesero ${waiter.name} es ${waiter.position}.`);
      return;
    }

    // Find or Create Customer
    let customer = selectedCustomer;
    if (customer) {
      if (customer.firstName !== fname || customer.lastName !== lname) {
        if (confirm("Has cambiado el nombre del cliente seleccionado. ¿Deseas crear un NUEVO cliente con estos datos?")) {
          customer = null;
        }
      }
    }

    if (!customer) {
      customer = window.db.createCustomer({
        firstName: fname,
        lastName: lname,
        lastName2: lname2
      });
      console.log('New customer created:', customer);
    }

    // Create Visit
    const visitData = {
      branchId: STATE.branch.id,
      customerId: customer.id,
      date: new Date().toISOString(),
      pax: parseInt(pax),
      table: table,
      waiterId: waiterId
    };

    console.log('Creating visit:', visitData);
    window.db.createVisit(visitData);

    alert(`✅ Check-in Exitoso.\nMesa: ${table}\nCliente: ${customer.firstName} ${customer.lastName}`);
    selectedCustomer = null;
    navigateTo('hostess-dashboard');
  } catch (error) {
    console.error('Error en check-in:', error);
    alert('Error al hacer check-in. Revisa la consola (F12) para más detalles.');
  }
}

function handleAddToWaitlist() {
  try {
    const fname = document.getElementById('h-firstname').value;
    const lname = document.getElementById('h-lastname').value;
    const pax = document.getElementById('h-pax').value;

    if (!fname || !pax) {
      alert('Necesitas al menos Nombre y Pax para agregar a lista de espera.');
      return;
    }

    // Pedir teléfono con prompt
    const phone = prompt(`Agregar a lista de espera:\n${fname} ${lname || ''}\n\nIngresa número de teléfono para contacto:`);

    if (!phone) {
      if (!confirm('¿Agregar sin teléfono? (No recomendado - no podrás contactar al cliente)')) {
        return;
      }
    }

    const customerName = `${fname} ${lname || ''}`.trim();

    window.db.addToWaitlist({
      branchId: STATE.branch.id,
      customerName,
      pax: parseInt(pax),
      phone: phone || '',
      estimatedWait: 15
    });

    alert(`✅ ${customerName} agregado a lista de espera.${phone ? '\nTeléfono: ' + phone : ''}`);
    navigateTo('hostess-dashboard');
    setTimeout(() => switchHostessTab('waitlist'), 100);
  } catch (error) {
    console.error('Error al agregar a lista de espera:', error);
    alert('Error al agregar a lista de espera. Revisa la consola (F12).');
  }
}

// === ASIGNAR MESA DESDE LISTA DE ESPERA (SIN PROMPTS) ===
function doAssignFromWaitlist(waitlistId) {
  const entry = window.db.data.waitlist.find(w => w.id === waitlistId);
  if (!entry) {
    showWaitlistStatus(waitlistId, '❌ Entrada no encontrada', 'error');
    return;
  }

  // Obtener valores de los dropdowns
  const tableSelect = document.getElementById(`wl-table-${waitlistId}`);
  const waiterSelect = document.getElementById(`wl-waiter-${waitlistId}`);

  const table = tableSelect ? tableSelect.value : '';
  const waiterId = waiterSelect ? waiterSelect.value : '';

  // Validaciones
  if (!table) {
    showWaitlistStatus(waitlistId, '⚠️ Selecciona una MESA', 'warning');
    return;
  }
  if (!waiterId) {
    showWaitlistStatus(waitlistId, '⚠️ Selecciona un MESERO', 'warning');
    return;
  }

  // Validar mesa no ocupada
  if (window.db.isTableOccupied(table, STATE.branch.id)) {
    showWaitlistStatus(waitlistId, `⛔ Mesa ${table} ocupada`, 'error');
    return;
  }

  // Buscar o crear cliente
  let customer = window.db.searchCustomers(entry.customerName.split(' ')[0])[0];

  if (!customer) {
    const nameParts = entry.customerName.split(' ');
    customer = window.db.createCustomer({
      firstName: nameParts[0] || entry.customerName,
      lastName: nameParts[1] || '',
      lastName2: nameParts[2] || '',
      phone: entry.phone || ''
    });
  }

  // Crear visita
  window.db.createVisit({
    branchId: STATE.branch.id,
    customerId: customer.id,
    date: new Date().toISOString(),
    pax: entry.pax,
    table: table,
    waiterId: waiterId
  });

  // Remover de waitlist
  window.db.removeFromWaitlist(waitlistId);

  const waiterName = window.db.data.users.find(u => u.id === waiterId)?.name || waiterId;
  showWaitlistStatus(waitlistId, `✅ ${entry.customerName} → Mesa ${table}`, 'success');

  // Recargar
  setTimeout(() => navigateTo('hostess-dashboard'), 1500);
}

// === MOSTRAR ESTADO EN TARJETA DE WAITLIST ===
function showWaitlistStatus(waitlistId, message, type) {
  const statusDiv = document.getElementById(`wl-status-${waitlistId}`);
  if (!statusDiv) return;

  statusDiv.textContent = message;
  statusDiv.classList.remove('hidden');

  if (type === 'success') {
    statusDiv.style.background = 'rgba(34, 197, 94, 0.3)';
    statusDiv.style.color = '#86EFAC';
  } else if (type === 'warning') {
    statusDiv.style.background = 'rgba(234, 179, 8, 0.3)';
    statusDiv.style.color = '#FCD34D';
    setTimeout(() => statusDiv.classList.add('hidden'), 2500);
  } else if (type === 'error') {
    statusDiv.style.background = 'rgba(239, 68, 68, 0.3)';
    statusDiv.style.color = '#FCA5A5';
  }
}

// === FUNCIÓN LEGACY (compatibilidad) ===
function assignTableFromWaitlist(waitlistId) {
  // Fallback to new function
  doAssignFromWaitlist(waitlistId);
}

function notifyWaitlistCustomer(id) {
  const entry = window.db.notifyNextInWaitlist(STATE.branch.id);
  if (entry) {
    alert(`📱 Se notificó a ${entry.customerName}. Ahora procede con el check-in.`);
    navigateTo('hostess-dashboard');
  }
}

function removeFromWaitlist(id) {
  // Remover directamente (sin confirm, ya que el botón es pequeño y separado)
  showWaitlistStatus(id, '🗑️ Removido de la lista', 'warning');
  setTimeout(() => {
    window.db.removeFromWaitlist(id);
    navigateTo('hostess-dashboard');
    setTimeout(() => switchHostessTab('waitlist'), 100);
  }, 500);
}

function handleCreateReservation() {
  const name = document.getElementById('r-name').value;
  const phone = document.getElementById('r-phone').value;
  const date = document.getElementById('r-date').value;
  const time = document.getElementById('r-time').value;
  const pax = document.getElementById('r-pax').value;
  const notes = document.getElementById('r-notes').value;

  if (!name || !phone || !date || !time || !pax) {
    alert('Completa todos los campos obligatorios.');
    return;
  }

  window.db.createReservation({
    branchId: STATE.branch.id,
    customerName: name,
    phone,
    date,
    time,
    pax,
    notes
  });

  alert(`✅ Reservación creada para ${name} el ${date} a las ${time}.`);
  navigateTo('hostess-dashboard');
  setTimeout(() => switchHostessTab('reservations'), 100);
}

function confirmReservation(id) {
  window.db.confirmReservation(id);
  alert('✅ Reservación confirmada.');
  navigateTo('hostess-dashboard');
  setTimeout(() => switchHostessTab('reservations'), 100);
}

function cancelReservation(id) {
  if (confirm('¿Cancelar esta reservación?')) {
    window.db.cancelReservation(id);
    navigateTo('hostess-dashboard');
    setTimeout(() => switchHostessTab('reservations'), 100);
  }
}

// === GESTIONAR MESAS SIN POPUPS ===
function doChangeTable(visitId) {
  const inputEl = document.getElementById(`new-table-${visitId}`);
  const newTable = inputEl ? inputEl.value.trim() : '';

  if (!newTable) {
    showTableStatus(visitId, '⚠️ Ingresa # de mesa', 'warning');
    return;
  }

  // Validar que no esté ocupada
  if (window.db.isTableOccupied(newTable, STATE.branch.id)) {
    showTableStatus(visitId, `⛔ Mesa ${newTable} ocupada`, 'error');
    return;
  }

  window.db.updateVisitDetails(visitId, { table: newTable });
  showTableStatus(visitId, `✅ Cambiado a Mesa ${newTable}`, 'success');

  setTimeout(() => navigateTo('hostess-dashboard'), 1500);
}

function doReleaseTable(visitId) {
  window.db.releaseTable(visitId);
  showTableStatus(visitId, '✅ Mesa liberada', 'success');

  setTimeout(() => navigateTo('hostess-dashboard'), 1000);
}

function doChangeWaiter(visitId) {
  const selectEl = document.getElementById(`new-waiter-${visitId}`);
  const newWaiterId = selectEl ? selectEl.value : '';

  if (!newWaiterId) {
    showTableStatus(visitId, '⚠️ Selecciona un mesero', 'warning');
    return;
  }

  window.db.updateVisitDetails(visitId, { waiterId: newWaiterId });
  const waiterName = window.db.data.users.find(u => u.id === newWaiterId)?.name || newWaiterId;
  showTableStatus(visitId, `✅ Mesero: ${waiterName}`, 'success');

  setTimeout(() => navigateTo('hostess-dashboard'), 1500);
}

// === NEW HOSTESS FUNCTIONS FOR REASON/GAME ===
window.getSportIcon = function (league) {
  if (!league) return '📺';
  const l = league.toLowerCase();
  if (l.includes('nfl') || l.includes('americano')) return '🏈';
  if (l.includes('nba') || l.includes('basquet') || l.includes('basket')) return '🏀';
  if (l.includes('mlb') || l.includes('beisbol') || l.includes('baseball')) return '⚾️';
  if (l.includes('soccer') || l.includes('mx') || l.includes('liga') || l.includes('copa') || l.includes('futbol') || l.includes('champions')) return '⚽️';
  if (l.includes('f1') || l.includes('formula')) return '🏎️';
  if (l.includes('ufc') || l.includes('box') || l.includes('pelea')) return '🥊';
  if (l.includes('tenis') || l.includes('atp')) return '🎾';
  return '📺';
};

window.generateGameOptions = function (selected) {
  // Get all matches
  const allMatches = window.db.getMatches() || [];
  // Use en-CA for YYYY-MM-DD format in local time
  const today = new Date().toLocaleDateString('en-CA');

  // SHOW FUTURE GAMES (Requested by Manager)
  // Filter: Date must be today or future
  let matches = allMatches.filter(m => m.date >= today);

  // Sort by Date then Time then League
  matches.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.time !== b.time) return a.time.localeCompare(b.time);
    return (a.league || '').localeCompare(b.league || '');
  });

  console.log(`Dropdown Filter: Found ${matches.length} upcoming games`);

  let html = matches.map(m => {
    const matchName = m.match || `${m.homeTeam} vs ${m.awayTeam}`;
    // Fallback if matchName is undefined/null
    const val = matchName || 'Evento Sin Nombre';
    // Format: "YYYY-MM-DD HH:mm | LEAGUE | Team vs Team"
    // User request: "fecha hora deporte y equipos"
    return `<option value="${val}" ${val === selected ? 'selected' : ''}>${m.date} ${m.time} • ${m.league || 'General'} • ${val}</option>`;
  }).join('');

  // If the currently selected game is NOT in the list (past game or validation error), show it with warning
  if (selected && selected !== 'OTRO' && !matches.find(m => (m.match || `${m.homeTeam} vs ${m.awayTeam}`) === selected)) {
    html += `<option value="${selected}" selected>${selected} (⚠️ Pasado / No listado)</option>`;
  }

  // Add Other Option
  const isCustom = selected === 'OTRO';
  html += `<option value="OTRO" ${isCustom ? 'selected' : ''}>⚠️ OTRO / NO EN LISTA</option>`;

  return html;
};

window.updateHostessReason = function (visitId, selectEl) {
  const reason = selectEl.value;
  const gameDiv = document.getElementById(`hostess-game-select-${visitId}`);

  if (reason === 'Partido') {
    if (gameDiv) gameDiv.classList.remove('hidden');
  } else {
    if (gameDiv) gameDiv.classList.add('hidden');
    // Clear game if not watching game
    window.db.updateVisitDetails(visitId, { selectedGame: '' });
  }

  // Save immediately
  window.db.updateVisitDetails(visitId, { reason });
};

window.toggleFavoriteTeamSection = function (visitId, checkbox) {
  const teamSelectDiv = document.getElementById(`team-select-${visitId}`);
  if (checkbox.checked) {
    if (teamSelectDiv) teamSelectDiv.classList.remove('hidden');
    window.db.updateVisitDetails(visitId, { isFavoriteTeamMatch: true });
  } else {
    if (teamSelectDiv) teamSelectDiv.classList.add('hidden');
    window.db.updateVisitDetails(visitId, { isFavoriteTeamMatch: false });
  }
};

// Helper for Split Custom Game Input
window.saveCustomGameSplit = function (visitId) {
  const homeInput = document.getElementById(`custom-home-${visitId}`);
  const awayInput = document.getElementById(`custom-away-${visitId}`);

  if (homeInput && awayInput) {
    const home = homeInput.value.trim();
    const away = awayInput.value.trim();

    if (home && away) {
      const combinedName = `${home} vs ${away}`;
      // 1. Save locally to visit
      window.db.updateVisitDetails(visitId, { selectedGame: combinedName });

      // 2. Check if this is a NEW game (not in official schedule)
      const officialGames = window.db.getMatches();
      // Normalize comparison
      const exists = officialGames.find(g => {
        const gName = g.match || `${g.homeTeam} vs ${g.awayTeam}`;
        return gName.toLowerCase() === combinedName.toLowerCase();
      });

      if (!exists) {
        // It's a custom game -> Request approval from Manager
        console.log('Sending request to Manager for:', combinedName);
        window.db.requestGame(combinedName);
        alert(`⚠️ Partido Nuevo Detectado: "${combinedName}"\n\n✅ Se ha enviado una SOLICITUD a la pestaña "JUEGOS" del Gerente para agregarlo a la programación oficial.`);
      } else {
        // If it exists but was entered manually
        // alert('✅ Partido asignado Correctamente');
      }

    } else if (home || away) {
      alert('Por favor ingresa AMBOS equipos (Local y Visita)');
    }
  }
};

// Helper for Manager Add Game Form
window.addGameFromManager = function () {
  const league = document.getElementById('new-league').value;
  const date = document.getElementById('new-date').value; // Now reads the actual date field
  const time = document.getElementById('new-time').value;
  const home = document.getElementById('new-home').value.trim();
  const away = document.getElementById('new-away').value.trim();

  // DEBUG: Log what we're getting
  console.log('📅 Date from form:', date);
  console.log('⏰ Time from form:', time);

  // Individual sports (no home/away concept)
  const individualSports = ['UFC', 'F1', 'Tenis', 'Boxeo'];
  const isIndividual = individualSports.includes(league);

  if (!league || !time || !date) {
    alert('Por favor completa Liga, Fecha y Hora');
    return;
  }

  if (!isIndividual && (!home || !away)) {
    alert('Por favor completa Equipo Local y Visitante');
    return;
  }

  if (isIndividual && !home) {
    alert('Por favor escribe el nombre del evento (ej: "Hamilton vs Verstappen", "Canelo vs GGG")');
    return;
  }

  // Build game object - EXPLICITLY include date
  const gameData = {
    league,
    date: date, // CRITICAL: Explicitly pass date from form
    time
  };

  console.log('💾 Saving game with date:', gameData.date);

  if (isIndividual) {
    // For individual sports, use "match" field instead of homeTeam/awayTeam
    gameData.match = home; // E.g. "Hamilton vs Verstappen"
    gameData.sport = league;
  } else {
    gameData.homeTeam = home;
    gameData.awayTeam = away;
  }

  window.db.addGame(gameData);

  // Clear and refresh
  if (document.getElementById('new-home')) document.getElementById('new-home').value = '';
  if (document.getElementById('new-away')) document.getElementById('new-away').value = '';
  // Optional: Hide form
  if (document.getElementById('add-game-form')) {
    document.getElementById('add-game-form').classList.add('hidden');
  }

  renderManagerDashboard('games');
};

window.saveFavoriteTeam = function (visitId, customerId, teamName) {
  if (teamName) {
    // Save to customer (permanent data)
    window.db.updateCustomer(customerId, { team: teamName });
    console.log(`✅ Equipo favorito guardado: ${teamName} para cliente ${customerId}`);
  }
};

window.saveVisitInfo = function (visitId) {
  // This function is called when the user clicks "GUARDAR INFO VISITA"
  // All data should already be saved via onChange handlers, but we confirm here
  const visit = window.db.data.visits.find(v => v.id === visitId);
  if (visit) {
    alert(`✅ Información guardada correctamente\n\nMotivo: ${visit.reason || 'No especificado'}\nPartido: ${visit.selectedGame || 'N/A'}\nEquipo Favorito: ${visit.isFavoriteTeamMatch ? 'Sí' : 'No'}`);
    // Force save to ensure persistence
    window.db._save();
    // Refresh the view
    navigateTo('hostess-dashboard');
  }
};

window.updateHostessGame = function (visitId, selectEl) {
  const selectedGame = selectEl.value;
  const customDiv = document.getElementById(`hostess-custom-game-${visitId}`);
  const teamSelect = document.getElementById(`favorite-team-${visitId}`);

  if (selectedGame === 'OTRO') {
    if (customDiv) {
      customDiv.classList.remove('hidden');
      const input = customDiv.querySelector('input');
      if (input) input.focus();
    }
    // Clear team select if custom
    if (teamSelect) teamSelect.innerHTML = '<option value="">Escribe el partido primero</option>';
  } else {
    if (customDiv) customDiv.classList.add('hidden');
    window.db.updateVisitDetails(visitId, { selectedGame });

    // Update Team Select Options
    if (teamSelect && selectedGame) {
      const game = window.db.getMatches().find(m => (m.match || (m.homeTeam + ' vs ' + m.awayTeam)) === selectedGame);
      if (game && game.homeTeam && game.awayTeam) {
        teamSelect.innerHTML = `
                <option value="">-- ¿A quién apoya? --</option>
                <option value="${game.homeTeam}">${game.homeTeam}</option>
                <option value="${game.awayTeam}">${game.awayTeam}</option>
             `;
      } else {
        teamSelect.innerHTML = '<option value="">Datos de equipos no disponibles</option>';
      }
    } else if (teamSelect) {
      teamSelect.innerHTML = '<option value="">Primero selecciona un partido</option>';
    }
  }
};


window.approveGameRequest = function (reqId, name) {
  // Try to guess teams
  const teams = name.split(/ vs | VS | Vs /);
  const home = teams[0] ? teams[0].trim() : name;
  const away = teams[1] ? teams[1].trim() : 'Visitante';

  const league = prompt(`Aprobando: ${name}\n\nLiga (NFL, NBA...):`, 'General');
  if (!league) return;
  const finalHome = prompt('Equipo Local:', home);
  const finalAway = prompt('Equipo Visitante:', away);
  const time = prompt('Hora (HH:MM):', '19:00');

  if (league && finalHome && finalAway && time) {
    window.db.addGame({ league, homeTeam: finalHome, awayTeam: finalAway, time });
    window.db.removeGameRequest(reqId);
    renderManagerDashboard(); // Refresh UI
    alert('✅ Partido agregado exitosamente.');
  }
};

window.saveCustomGame = function (visitId, inputEl) {
  const val = inputEl.value;
  window.db.updateVisitDetails(visitId, { selectedGame: val });
};

window.requestGameToManager = function (visitId) {
  const div = document.getElementById(`hostess-custom-game-${visitId}`);
  const input = div.querySelector('input');
  const gameName = input.value.trim();
  if (gameName) {
    window.db.addGameRequest(gameName);
    alert(`✅ Solicitud enviada al Gerente para: "${gameName}"\n\nEl partido quedará registrado provisionalmente en esta mesa.`);
  } else {
    alert('Escribe el nombre del partido primero.');
  }
};

function showTableStatus(visitId, message, type) {
  const statusDiv = document.getElementById(`table-status-${visitId}`);
  if (!statusDiv) return;

  statusDiv.textContent = message;
  statusDiv.classList.remove('hidden');

  if (type === 'success') {
    statusDiv.style.background = 'rgba(34, 197, 94, 0.3)';
    statusDiv.style.color = '#86EFAC';
  } else if (type === 'warning') {
    statusDiv.style.background = 'rgba(234, 179, 8, 0.3)';
    statusDiv.style.color = '#FCD34D';
    setTimeout(() => statusDiv.classList.add('hidden'), 2500);
  } else if (type === 'error') {
    statusDiv.style.background = 'rgba(239, 68, 68, 0.3)';
    statusDiv.style.color = '#FCA5A5';
    setTimeout(() => statusDiv.classList.add('hidden'), 3000);
  }
}

// Legacy function (compatibilidad)
function manageVisit(visitId) {
  // No hacer nada - ahora usamos botones inline
}

// ------ WAITER ------

function renderWaiterDashboard() {
  try {
    appContainer.innerHTML = '';
    // SAFETY CHECK
    if (!STATE.user || !STATE.user.id) {
      console.warn("Waiter dashboard accessed without user.");
      renderLogin();
      return;
    }

    // Subscribe to updates for real-time reactivity
    if (!window.waiterSubscription) {
      window.waiterSubscription = window.db.addListener(() => {
        if (STATE.view === 'waiter-dashboard') {
          const currentScroll = window.scrollY; // Preserve scroll
          renderWaiterDashboard();
          window.scrollTo(0, currentScroll);
        }
      });
    }

    const visits = window.db ? window.db.getActiveVisits(STATE.user.id) : []; // Guard against db issues
    const dailyInfo = window.db ? window.db.getDailyInfo() : {};

    const div = document.createElement('div');
    div.className = 'p-4 max-w-4xl mx-auto pb-20';

    let mesasHtml = visits.length === 0
      ? `<div class="text-center py-12">
                  <div class="text-6xl mb-4">🍽️</div>
                  <p class="text-xl text-secondary">No tienes mesas activas</p>
                  <p class="text-sm text-gray-400 mt-2">Espera a que Hostess te asigne mesas</p>
                </div>`
      : visits.map(v => {
        const classification = window.db.getCustomerClassification(v.customerId);
        const badge = window.ClientClassifier ? window.ClientClassifier.getBadgeHTML(classification) : '';

        // Time Calculation
        const startTime = new Date(v.date);
        const now = new Date();
        const diffMs = now - startTime;
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        const timeElapsed = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
        const timeColor = diffMins > 120 ? '#EF4444' : diffMins > 60 ? '#F59E0B' : '#22C55E';

        // Determine Sport Icon
        let sportIcon = '📺';
        if (v.reason === 'Partido' && v.selectedGame) {
          const game = window.db.getMatches().find(m => (m.match || (m.homeTeam + ' vs ' + m.awayTeam)) === v.selectedGame);
          if (game && game.league) sportIcon = window.getSportIcon(game.league);
        }

        const reasonDisplay = v.reason === 'Partido'
          ? `<div class="flex items-start gap-3">
                  <div class="text-4xl filter drop-shadow-md">${sportIcon}</div>
                  <div class="flex-1">
                    <div class="text-sm text-green-400 font-bold uppercase tracking-widest mb-1">PARTIDO</div>
                    <div class="text-2xl font-black text-white leading-tight">
                      ${v.selectedGame || 'Sin partido asig.'}
                    </div>
                    ${v.isFavoriteTeamMatch ? '<div class="mt-2 inline-block bg-yellow-500 text-black text-xs font-black px-2 py-1 rounded shadow-lg animate-pulse">🌟 EQUIPO FAVORITO</div>' : ''}
                  </div>
                </div>`
          : (v.reason === 'Cumpleaños' ? '🎂 CUMPLEAÑOS' : (v.reason === 'Negocios' ? '💼 NEGOCIOS' : (v.reason || '🍽️ COMER')));

        return `
                <div class="card border-l-8 border-yellow-500 p-5 mb-5 shadow-2xl bg-gray-900/80">
                  <!-- HEADER -->
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <div class="text-5xl font-black text-white mb-2 leading-none tracking-tighter shadow-black drop-shadow-lg">MESA ${v.table}</div>
                      <div class="text-2xl font-bold text-gray-300">${v.customer.firstName} ${v.customer.lastName}</div>
                    </div>
                    <div class="text-right flex flex-col items-end">
                      <div class="transform scale-110 origin-top-right mb-2">${badge}</div>
                      <div class="bg-black/40 px-3 py-1 rounded-lg">
                        <div class="text-xs text-gray-400 font-bold uppercase tracking-widest">Tiempo</div>
                        <div class="text-3xl font-black" style="color: ${timeColor};">${timeElapsed}</div>
                      </div>
                    </div>
                  </div>

                  <!-- INFO GRID -->
                  <div class="grid grid-cols-2 gap-3 text-sm mt-4 mb-4">
                    <!-- MOTIVO (NUEVO) -->
                    <div class="bg-white/10 p-3 rounded-lg border border-white/10 col-span-2">
                      <span class="text-gray-400 text-xs font-bold uppercase tracking-widest block mb-1">🎯 Motivo de Visita</span>
                      <div class="font-black text-2xl text-green-400 uppercase">${reasonDisplay}</div>
                    </div>

                    <div class="bg-white/5 p-3 rounded-lg">
                      <span class="text-gray-400 text-xs font-bold uppercase">👥 Personas</span>
                      <div class="font-bold text-2xl text-white">${v.pax}</div>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg">
                      <span class="text-gray-400 text-xs font-bold uppercase">🕐 Check-in</span>
                      <div class="font-bold text-2xl text-white">${new Date(v.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>

                  <!-- ACTION -->
                  <div class="mt-4">
                    <button onclick="navigateTo('waiter-detail', {visitId: '${v.id}'})" class="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-2xl py-6 rounded-xl shadow-lg border-2 border-blue-400/30 transform active:scale-95 transition-all flex items-center justify-center gap-3">
                      <span>💰</span> CAPTURAR CONSUMO
                    </button>
                  </div>
                </div>
      `}).join('');

    div.innerHTML = `
                <header class="flex justify-between items-center mb-6">
                  <div>
                    <h2 class="text-accent text-xl md:text-2xl">Mesero | ${STATE.user.name}</h2>
                  </div>
                  <button onclick="handleLogout()" class="btn-secondary text-sm px-3 py-2">Salir</button>
                </header>

                <!-- TAB CONTENT: MIS MESAS -->
                <div id="waitercontent-mesas" class="waiter-tab-content active">
                  ${mesasHtml}
                </div>

                <!-- TAB CONTENT: PARTIDOS -->
                <div id="waitercontent-partidos" class="waiter-tab-content hidden">
                  <div class="card bg-blue-900/20 border-2 border-blue-500">
                    <h3 class="text-xl font-bold mb-4 text-blue-300">🏈 Partidos de Hoy</h3>
                    ${(() => {
        const today = new Date().toISOString().split('T')[0];
        const games = (dailyInfo.games || []).filter(g => g.date === today); // Strict filter: only today
        if (games.length === 0) return '<p class="text-gray-400 italic">Sin partidos programados para hoy.</p>';

        // Group by sport
        const grouped = {};
        games.forEach(game => {
          const sport = game.sport || 'Otros';
          if (!grouped[sport]) grouped[sport] = [];
          grouped[sport].push(game);
        });

        // Sort each group by time
        Object.keys(grouped).forEach(sport => {
          grouped[sport].sort((a, b) => {
            const timeA = a.time ? a.time.replace(':', '') : '9999';
            const timeB = b.time ? b.time.replace(':', '') : '9999';
            return timeA.localeCompare(timeB);
          });
        });

        // Render grouped
        // Icon mapping based on sport names
        const getSportIcon = (sport) => {
          const s = sport.toLowerCase();
          if (s.includes('football') || s.includes('americano')) return '🏈';
          if (s.includes('basket')) return '🏀';
          if (s.includes('soccer') || s.includes('futbol') || s.includes('fútbol')) return '⚽';
          if (s.includes('baseball') || s.includes('beisbol')) return '⚾';
          if (s.includes('hockey')) return '🏒';
          if (s.includes('tennis') || s.includes('tenis')) return '🎾';
          if (s.includes('golf')) return '⛳';
          if (s.includes('box')) return '🥊';
          if (s.includes('mma') || s.includes('ufc')) return '🥋';
          if (s.includes('f1') || s.includes('formula') || s.includes('nascar')) return '🏎️';
          return '🏆';
        };

        return Object.keys(grouped).map(sport => `
            <div class="mb-6 last:mb-0">
              <div class="flex items-center gap-2 mb-3 border-b border-blue-500/30 pb-2">
                <span class="text-2xl">${getSportIcon(sport)}</span>
                <span class="text-lg font-bold text-blue-200">${sport}</span>
                <span class="text-xs text-gray-400">(${grouped[sport].length} partidos)</span>
              </div>
              <div class="space-y-2">
                ${grouped[sport].map(game => `
                  <div class="bg-black/50 p-3 rounded-lg border border-blue-400/50 flex flex-col gap-2">
                    <div class="flex justify-between items-start">
                        <div class="flex items-center gap-2">
                           ${(() => {
            const l1 = window.getTeamLogo(game.homeTeam);
            const l2 = window.getTeamLogo(game.awayTeam);
            if (l1 || l2) {
              return `
                                    <div class="flex flex-col items-center justify-center w-10">
                                        ${l1 ? `<img src="${l1}" class="w-8 h-8 object-contain mx-auto" style="max-width: 32px; max-height: 32px;">` : `<span class="text-xs">🏠</span>`}
                                    </div>
                                    <div class="text-[10px] text-gray-400 px-1">vs</div>
                                    <div class="flex flex-col items-center justify-center w-10">
                                        ${l2 ? `<img src="${l2}" class="w-8 h-8 object-contain mx-auto" style="max-width: 32px; max-height: 32px;">` : `<span class="text-xs">✈️</span>`}
                                    </div>
                                    <div class="ml-2 flex-1">
                                        <div class="text-[10px] text-blue-300 font-bold uppercase tracking-wider">${game.league || ''}</div>
                                        <div class="text-lg font-black text-white leading-tight">${game.homeTeam} <span class="text-gray-500 text-xs font-normal">vs</span> ${game.awayTeam}</div>
                                    </div>`;
            } else {
              return `
                                    <div>
                                      <div class="text-[10px] text-blue-300 font-bold uppercase tracking-wider">${game.league || ''}</div>
                                      <div class="text-lg font-black text-white leading-tight">${game.homeTeam} <span class="text-gray-500 text-xs font-normal">vs</span> ${game.awayTeam}</div>
                                    </div>`;
            }
          })()}
                        </div>
                        <div class="text-xl font-black text-yellow-400 py-1 px-2 bg-yellow-900/20 rounded">${game.time}</div>
                    </div>
                    
                    <!-- INFO EXTENDIDA (TVs y Audio) -->
                    <div class="flex gap-2 text-[10px] font-bold mt-1 border-t border-white/5 pt-2">
                        ${game.tvs ? `<div class="bg-gray-800 text-yellow-500 px-2 py-1 rounded flex items-center gap-1 flex-1">📺 TVs: ${game.tvs}</div>` : ''}
                        
                        ${game.audio?.salon ? `<div class="bg-green-900/50 text-green-400 px-2 py-1 rounded flex items-center gap-1 border border-green-700/50">🔊 SALÓN</div>` : ''}
                        ${game.audio?.terraza ? `<div class="bg-green-900/50 text-green-400 px-2 py-1 rounded flex items-center gap-1 border border-green-700/50">🔊 TERRAZA</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('');
      })()}
                  </div>
                </div>

                <!-- TAB CONTENT: PROMOS -->
                <div id="waitercontent-promos" class="waiter-tab-content hidden">
                  <div class="card bg-green-900/20 border-2 border-green-500">
                    <h3 class="text-xl font-bold mb-4 text-green-300">🎁 Promociones del Día</h3>
                    ${(() => {
        const activePromos = window.db.getActivePromos();
        if (activePromos.length === 0) return '<p class="text-gray-400 italic">Sin promociones activas.</p>';
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${activePromos.map(promo => `
                <div class="bg-black/50 p-4 rounded-lg border border-green-400">
                  <div class="text-xl font-bold text-yellow-400 mb-2">${promo.title}</div>
                  <div class="text-gray-300">${promo.description}</div>
                </div>
              `).join('')}
            </div>
          `;
      })()}
                  </div>
                </div>

                <!-- TAB CONTENT: DINÁMICAS -->
                <div id="waitercontent-dinamicas" class="waiter-tab-content hidden">
                  <div class="card bg-purple-900/20 border-2 border-purple-500">
                    <h3 class="text-xl font-bold mb-4 text-purple-300">🎯 Dinámica del Día</h3>
                    ${(() => {
        const dynamic = window.db.getActiveDynamic();
        if (!dynamic) return '<p class="text-gray-400 italic">Sin dinámicas activas hoy.</p>';
        return `
            <div class="bg-black/50 p-4 rounded-lg border border-purple-400 mb-6">
              <div class="text-2xl font-black text-yellow-400 mb-2">${dynamic.title}</div>
              <div class="text-lg text-gray-300">${dynamic.description}</div>
            </div>
            
            <h4 class="text-lg font-bold mb-3 text-purple-300">🏆 Tabla de Posiciones</h4>
            ${(dynamic.scores || []).length === 0 ? '<p class="text-gray-400 italic text-sm">Aún no hay puntuaciones.</p>' : `
              <div class="space-y-2">
                ${dynamic.scores.map((entry, idx) => {
          const medals = ['🥇', '🥈', '🥉'];
          const medal = medals[idx] || (idx + 1) + '.';
          const bgColors = ['bg-yellow-600/30', 'bg-gray-500/30', 'bg-orange-600/30'];
          const bgColor = bgColors[idx] || 'bg-gray-800/30';
          const isMe = entry.odoo_id === STATE.user.odoo_id || entry.odoo_id === STATE.user.id;

          return `
                    <div class="${bgColor} p-3 rounded-lg border ${idx === 0 ? 'border-yellow-400' : 'border-gray-600'} ${isMe ? 'ring-2 ring-green-500' : ''} flex justify-between items-center">
                      <div class="flex items-center gap-3">
                        <span class="text-2xl">${medal}</span>
                        <div>
                          <div class="font-bold text-lg">${entry.waiterName} ${isMe ? '(TÚ)' : ''}</div>
                        </div>
                      </div>
                      <div class="text-3xl font-black text-yellow-400">${entry.score}</div>
                    </div>
                  `;
        }).join('')}
              </div>
            `}
          `;
      })()}
                  </div>
                </div>

                <!-- TAB CONTENT: PRODUCTOS (86/85/PUSH) -->
                <div id="waitercontent-productos86" class="waiter-tab-content hidden">
                  <div class="card bg-red-900/20 border-2 border-red-500">
                    <h3 class="text-xl font-bold mb-4 text-red-300">📦 Productos (86 / 85 / Push)</h3>

                    ${(() => {
        const prods = dailyInfo.products || { outOfStock86: [], lowStock85: [], push: [] };
        const barraProds = {
          p86: (prods.outOfStock86 || []).filter(p => p.category === 'barra'),
          p85: (prods.lowStock85 || []).filter(p => p.category === 'barra'),
          push: (prods.push || []).filter(p => p.category === 'barra')
        };

        const hasAny = barraProds.p86.length > 0 || barraProds.p85.length > 0 || barraProds.push.length > 0;

        if (!hasAny) {
          return '<p class="text-green-400 font-bold text-center py-6">¡Todo disponible hoy! 🎉</p>';
        }

        return `
            <div class="space-y-4">
              ${barraProds.p86.length > 0 ? `
                <div>
                  <div class="text-sm font-bold text-red-400 mb-2">🚫 86 - AGOTADOS (NO ofrecer)</div>
                  <div class="grid grid-cols-2 gap-2">
                    ${barraProds.p86.map(p => `
                      <div class="bg-red-900/50 p-3 rounded border border-red-500 flex items-center gap-2">
                        <span class="text-xl">🚫</span>
                        <span class="font-bold">${p.name}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${barraProds.p85.length > 0 ? `
                <div>
                  <div class="text-sm font-bold text-yellow-400 mb-2">⚠️ 85 - Por Agotarse (Vender con cuidado)</div>
                  <div class="grid grid-cols-2 gap-2">
                    ${barraProds.p85.map(p => `
                      <div class="bg-yellow-900/50 p-3 rounded border border-yellow-500 flex items-center gap-2">
                        <span class="text-xl">⚠️</span>
                        <span class="font-bold">${p.name}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${barraProds.push.length > 0 ? `
                <div>
                  <div class="text-sm font-bold text-green-400 mb-2">🚀 PUSH - ¡Impulsa la venta!</div>
                  <div class="grid grid-cols-2 gap-2">
                    ${barraProds.push.map(p => `
                      <div class="bg-green-900/50 p-3 rounded border border-green-500 flex items-center gap-2">
                        <span class="text-xl">🚀</span>
                        <span class="font-bold">${p.name}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `;
      })()}
                  </div>
                </div>

                <!-- BOTTOM NAVIGATION BAR - MESERO -->
                <nav class="bottom-nav">
                  <button onclick="switchWaiterTab('mesas')" id="waitertab-mesas" class="bottom-nav-item active" style="position: relative; min-width: 60px;">
                    <span class="bottom-nav-icon">🍽️</span>
                    <span class="bottom-nav-label">Mesas</span>
                    ${visits.length > 0 ? `<span class="bottom-nav-badge">${visits.length}</span>` : ''}
                  </button>
                  <button onclick="switchWaiterTab('partidos')" id="waitertab-partidos" class="bottom-nav-item" style="position: relative;">
                    <span class="bottom-nav-icon">🏈</span>
                    <span class="bottom-nav-label">Partidos</span>
                  </button>
                  <button onclick="switchWaiterTab('promos')" id="waitertab-promos" class="bottom-nav-item" style="position: relative;">
                    <span class="bottom-nav-icon">🎁</span>
                    <span class="bottom-nav-label">Promos</span>
                  </button>
                  <button onclick="switchWaiterTab('dinamicas')" id="waitertab-dinamicas" class="bottom-nav-item" style="position: relative;">
                    <span class="bottom-nav-icon">🎯</span>
                    <span class="bottom-nav-label">Dinámica</span>
                  </button>
                  <button onclick="switchWaiterTab('productos86')" id="waitertab-productos86" class="bottom-nav-item" style="position: relative;">
                    <span class="bottom-nav-icon">⚠️</span>
                    <span class="bottom-nav-label">86/85</span>
                  </button>
                  <button onclick="switchWaiterTab('info')" id="waitertab-info" class="bottom-nav-item" style="position: relative;">
                    <span class="bottom-nav-icon">👤</span>
                    <span class="bottom-nav-label">Mi Info</span>
                  </button>
                  <button onclick="showQRReviews()" class="bottom-nav-item" style="position: relative;">
                    <span class="bottom-nav-icon">⭐</span>
                    <span class="bottom-nav-label">QR</span>
                  </button>
                </nav>

                <!-- DuckOS Footer -->
                <div class="dashboard-footer">
                  Powered by <span style="color: #F97316;">DuckOS</span> | Bar & Restaurant Solutions
                </div>
                `;

    // Add class for bottom nav padding
    div.className = 'p-4 max-w-4xl mx-auto has-bottom-nav';
    appContainer.appendChild(div);
  } catch (error) {
    console.error("🔥 Error rendering Waiter Dashboard:", error);
    appContainer.innerHTML = `<div class="p-10 text-center text-red-500">
                  <h1 class="text-4xl">⚠️ Error</h1>
                  <p>${error.message}</p>
                  <p class="text-sm mt-4">${error.stack}</p>
                  <button onclick="window.location.reload()" class="mt-8 bg-yellow-500 text-black px-6 py-3 rounded font-bold">RECARGAR</button>
                </div>`;
  }
}

function switchWaiterTab(tabName) {
  // Hide all tab content
  document.querySelectorAll('.waiter-tab-content').forEach(el => el.classList.add('hidden'));

  // Remove active from all bottom nav items
  document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));

  // Show selected content
  const contentEl = document.getElementById(`waitercontent-${tabName}`);
  if (contentEl) contentEl.classList.remove('hidden');

  // Activate bottom nav item
  const tabEl = document.getElementById(`waitertab-${tabName}`);
  if (tabEl) tabEl.classList.add('active');
}

function renderWaiterDetail(visitId) {
  // If user is manager, get all visits from branch. If waiter, get only their visits.
  const visits = STATE.user.role === 'manager'
    ? window.db.getActiveVisitsByBranch(STATE.branch.id)
    : window.db.getActiveVisits(STATE.user.id);

  const visit = visits.find(v => v.id === visitId);

  if (!visit) {
    alert("Visita no encontrada");
    // Return to appropriate dashboard based on role
    if (STATE.user.role === 'manager') {
      navigateTo('manager-dashboard');
    } else {
      navigateTo('waiter-dashboard');
    }
    return;
  }

  const customer = visit.customer;
  const classification = window.db.getCustomerClassification(customer.id);
  const badge = window.ClientClassifier ? window.ClientClassifier.getBadgeHTML(classification) : '';

  // INITIALIZE SEAT STATE for this visit - RESTORE FROM DB IF EXISTS
  window.CURRENT_SEAT = 0;

  if (visit.seatOrders && Array.isArray(visit.seatOrders) && visit.seatOrders.length > 0) {
    // Restore persisted order state
    window.SEAT_ORDERS = JSON.parse(JSON.stringify(visit.seatOrders));
  } else {
    // Validar si estamos recargando la MISMA visita o cambiando de mesa
    // Por seguridad, si la visita no tiene órdenes guardadas, iniciamos LIMPIO
    // para evitar que aparezcan órdenes de la mesa anterior.
    window.SEAT_ORDERS = [];
  }

  // Restore Manual Notes
  window.ORDER_NOTES = visit.manualNotes || '';

  // Ensure slots exist for all current pax
  for (let i = 0; i < visit.pax; i++) {
    if (!window.SEAT_ORDERS[i]) window.SEAT_ORDERS[i] = {};
  }

  const div = document.createElement('div');
  // Only add bottom nav padding if user is a waiter
  div.className = STATE.user.role === 'waiter'
    ? 'p-4 max-w-4xl mx-auto has-bottom-nav'
    : 'p-4 max-w-4xl mx-auto pb-8';

  div.innerHTML = `
                <button onclick="savePartialData('${visitId}'); setTimeout(() => goBack(), 500)" class="text-secondary text-lg mb-4 hover:text-white transition flex items-center gap-2">
                  <span>←</span> Volver (Auto-Guardar)
                </button>

                <!--HEADER: Cliente Info-- >
                <div class="card mb-4 bg-gradient-to-r from-gray-900 to-black border-2 border-yellow-500">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <div class="text-3xl md:text-4xl font-black text-yellow-400 mb-1">MESA ${visit.table}</div>
                      <h1 class="text-2xl md:text-3xl font-bold">${customer.firstName} ${customer.lastName}</h1>
                      ${badge}
                    </div>
                    <div class="text-right">
                      <div class="text-5xl">🏈</div>
                      <div class="text-xs text-secondary">${customer.team || 'Sin Equipo'}</div>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="bg-white/5 p-2 rounded">
                      <span class="text-secondary block text-xs">Visitas Totales</span>
                      <div class="font-bold text-lg">${customer.visits || 1}</div>
                    </div>
                    <div class="bg-white/5 p-2 rounded">
                      <span class="text-secondary block text-xs">👥 Personas Hoy</span>
                      <div class="font-bold text-lg">${visit.pax}</div>
                    </div>
                  </div>

                  <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div class="bg-blue-900/30 p-2 rounded border border-blue-500">
                      <span class="text-blue-300 block text-xs">🍺 TOP BEBIDAS</span>
                      <div class="text-xs">${customer.topDrinks && customer.topDrinks.length ? customer.topDrinks.join(', ') : 'Sin datos'}</div>
                    </div>
                    <div class="bg-orange-900/30 p-2 rounded border border-orange-500">
                      <span class="text-orange-300 block text-xs">🍗 TOP COMIDA</span>
                      <div class="text-xs">${customer.topFood && customer.topFood.length ? customer.topFood.join(', ') : 'Sin datos'}</div>
                    </div>
                  </div>
                </div>

                <!--SUGERENCIA IA PERSONALIZADA-- >
                <div class="card border border-yellow-500/50 bg-yellow-900/20 mb-4">
                  <h4 class="text-yellow-400 mb-2 font-bold flex items-center gap-2">
                    💡 Sugerencia IA para este Cliente
                  </h4>
                  <p class="text-sm italic text-gray-300">"${window.db.generateAISuggestion(customer.id)}"</p>
                </div>

                <!--COMANDERO POR ASIENTOS-- >
                <div class="card mb-4 bg-green-900/10 border-2 border-green-600">
                  <h4 class="text-green-400 mb-3 font-bold">📝 COMANDERO - Por Asientos</h4>

                  <!-- Tabs de Asientos -->
                  <div class="flex gap-2 mb-4 overflow-x-auto">
                    ${Array.from({ length: visit.pax }, (_, i) => `
          <button onclick="switchSeat(${i})" id="seat-tab-${i}" class="${i === 0 ? 'bg-yellow-600 text-black' : 'bg-gray-700'} px-4 py-2 rounded font-bold text-sm whitespace-nowrap">
            ${i === 0 ? '👑 Anfitrión' : 'Asiento ' + (i + 1)}
          </button>
        `).join('')}
                  </div>

                  <!-- Contenido por Asiento -->
                  ${Array.from({ length: visit.pax }, (_, i) => `
        <div id="seat-content-${i}" class="${i === 0 ? '' : 'hidden'}">
          <div class="grid grid-cols-2 gap-3 mb-4">
            <button onclick="openMenuFor(${i}, 'entrada')" class="p-4 bg-gray-800 border-2 border-green-600 rounded-lg hover:border-green-400 text-left relative overflow-hidden group">
              <div class="relative z-10">
                <div class="text-2xl mb-1">🥟</div>
                <div class="font-bold text-sm">Entrada</div>
                <div id="seat-${i}-entrada" class="text-xs text-yellow-400 mt-1">-</div>
              </div>
              <div class="absolute inset-0 bg-green-900/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
            
            <button onclick="openMenuFor(${i}, 'platillo')" class="p-4 bg-gray-800 border-2 border-orange-600 rounded-lg hover:border-orange-400 text-left relative overflow-hidden group">
              <div class="relative z-10">
                <div class="text-2xl mb-1">🍗</div>
                <div class="font-bold text-sm">Platillo</div>
                <div id="seat-${i}-platillo" class="text-xs text-yellow-400 mt-1">-</div>
              </div>
              <div class="absolute inset-0 bg-orange-900/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
            
            <button onclick="openMenuFor(${i}, 'postre')" class="p-4 bg-gray-800 border-2 border-pink-600 rounded-lg hover:border-pink-400 text-left relative overflow-hidden group">
              <div class="relative z-10">
                <div class="text-2xl mb-1">🍰</div>
                <div class="font-bold text-sm">Postre</div>
                <div id="seat-${i}-postre" class="text-xs text-yellow-400 mt-1">-</div>
              </div>
              <div class="absolute inset-0 bg-pink-900/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
            
            <button onclick="openMenuFor(${i}, 'bebida')" class="p-4 bg-gray-800 border-2 border-blue-600 rounded-lg hover:border-blue-400 text-left relative overflow-hidden group">
              <div class="relative z-10">
                <div class="text-2xl mb-1">🍺</div>
                <div class="font-bold text-sm">Bebida</div>
                <div id="seat-${i}-bebida" class="text-xs text-yellow-400 mt-1">-</div>
              </div>
              <div class="absolute inset-0 bg-blue-900/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </div>

          <!-- CONTENEDOR DE MENÚ INLINE (ACORDEÓN) -->
          <div id="inline-menu-container-${i}" class="hidden bg-gray-900 border-2 border-yellow-500 rounded-lg p-4 mb-4 shadow-2xl animate-fade-in-down">
            <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
              <h3 id="inline-menu-title-${i}" class="text-xl font-bold text-yellow-400">SELECCIONA PRODUCTO</h3>
              <button onclick="closeInlineMenu(${i})" class="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">CERRAR ✕</button>
            </div>
            
            <!-- Barra de Búsqueda -->
            <div class="mb-4">
               <input type="text" id="inline-search-${i}" oninput="filterInlineMenu(this.value, ${i})" placeholder="🔍 Buscar aquí..." class="w-full bg-black text-white p-3 rounded-lg border border-gray-600 focus:border-yellow-500 font-bold">
            </div>

            <div id="inline-menu-content-${i}" class="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <!-- AQUÍ SE INYECTAN LOS PRODUCTOS -->
            </div>
          </div>

        </div>
      `).join('')}

                  <!-- Modal Eliminado/Oculto (Legacy Support si algo lo llama) -->
                  <div id="menu-modal" class="hidden"></div>

                  <!-- Resumen Final (readonly) -->
                  <div class="flex justify-between items-center mb-2 mt-4">
                    <label class="text-sm text-gray-400">📋 Resumen Completo:</label>
                    <button onclick="openFullscreenSummary()" class="text-xs font-bold bg-yellow-600 text-black px-3 py-1 rounded hover:bg-yellow-500 transition flex items-center gap-1">
                      🔍 VER PANTALLA COMPLETA
                    </button>
                  </div>
                  <textarea id="w-comandero" readonly class="w-full bg-black text-green-400 font-mono text-sm p-4 rounded-lg border-2 border-gray-700 focus:border-yellow-500 outline-none resize-none mb-2 shadow-inner" rows="6"></textarea>


                </div>



                <!--ZONA DE ACCIONES DE ORDEN-->
                <div class="mb-4">
                  <!-- BOTÓN GUARDAR -->
                  <button onclick="savePartialData('${visitId}')" class="w-full bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold py-4 rounded-xl shadow-lg mb-3 flex items-center justify-center gap-2">
                    💾 GUARDAR COMANDA
                  </button>
                </div>

                <!--BOTÓN GUARDAR SIN CERRAR-- >
                <button onclick="savePartialData('${visitId}')" class="btn-secondary w-full text-base py-4 mb-4 border-dashed border-2 font-bold">
                  💾 GUARDAR DATOS (Sin cerrar mesa)
                </button>

                <!--CIERRE DE MESA - Collapsible-- >
                <div class="mb-4" style="position: relative; z-index: 1;">
                  <!-- Toggle Button -->
                  <button onclick="toggleCerrarMesa()" id="btn-toggle-cerrar" class="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xl py-5 rounded-xl transition flex items-center justify-center gap-3">
                    🔴 CERRAR MESA
                  </button>

                  <!-- Expandable Form (hidden by default) -->
                  <div id="cerrar-mesa-form" class="hidden mt-3 card bg-red-900/20 border-2 border-red-600">
                    <label class="text-sm text-gray-400 block mb-1">Número de Cuenta / Folio del Ticket</label>
                    <input type="text" id="w-folio" placeholder="Ej. A1234" class="w-full mb-3 text-lg p-3 text-center font-bold bg-black border border-gray-600 rounded" style="min-height: 50px;">

                      <label class="text-sm text-gray-400 block mb-1">Total del Ticket ($)</label>
                      <input type="number" id="w-ticket" placeholder="$" class="w-full mb-4 text-2xl p-4 text-center font-black text-green-400 bg-black border border-gray-600 rounded" style="min-height: 60px;">

                        <div class="grid grid-cols-2 gap-3">
                          <button onclick="toggleCerrarMesa()" class="btn-secondary py-4 font-bold">
                            ← Cancelar
                          </button>
                          <button onclick="saveConsumption('${visitId}')" class="bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl transition">
                            ✅ CONFIRMAR
                          </button>
                        </div>
                      </div>
                  </div>

                  <!-- MENÚ DEBUG -->
                  <button onclick="forceMenuRefresh()" class="w-full mt-4 mb-2 p-2 text-xs text-gray-500 uppercase border border-gray-700 rounded hover:bg-gray-800 hover:text-white transition-colors">
                    🛠️ ¿Falta Menú? Actualizar Datos
                  </button>

                  <!-- MARCAR PROSPECTO -->
                  <button onclick="markProspect('${visitId}')" class="btn-secondary w-full border-dashed border-2 p-4 text-center font-bold text-base">
                    ⭐ MARCAR COMO PROSPECTO
                  </button>

                  <!-- BOTTOM NAV PERSISTENTE -->
                  ${renderWaiterBottomNav('mesas', visits.length)}
                  `;
  appContainer.appendChild(div);

  // Set defaults and load saved data
  document.getElementById('w-reason').value = visit.reason || customer.lastReason || 'Comer';
  toggleSportField(document.getElementById('w-reason'));

  // Load saved visit data if it exists
  // Load saved visit data if it exists
  if (visit.team) document.getElementById('w-team').value = visit.team;
  if (visit.league) document.getElementById('w-league').value = visit.league;
  if (visit.folio) document.getElementById('w-folio').value = visit.folio;
  if (visit.folio) document.getElementById('w-folio').value = visit.folio;

  // Refresh UI from loaded state
  updateComanderoSummary();
}

// Toast Notification System
window.showToast = function (message, type = 'success') {
  const toast = document.createElement('div');
  const bg = type === 'error' ? 'bg-red-600' : 'bg-green-600';
  toast.className = `fixed top-4 right-4 z-[9999] ${bg} text-white px-6 py-4 rounded-lg shadow-2xl font-bold flex items-center gap-3 transform transition-all duration-300 translate-y-[-100%] border-2 border-white/20`;
  toast.innerHTML = `<span class="text-2xl">${type === 'error' ? '⚠️' : '✅'}</span> <span>${message}</span>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.remove('translate-y-[-100%]'));
  setTimeout(() => {
    toast.classList.add('translate-y-[-100%]', 'opacity-0');
    setTimeout(() => toast.remove(), 500);
  }, 3000);
};

window.savePartialData = function (visitId) {
  try {
    console.log('💾 Intentando guardar datos parciales para visita:', visitId);

    // 1. Safe DOM Access
    const reasonEl = document.getElementById('w-reason');
    const reason = reasonEl ? reasonEl.value : (visitId ? 'Comer' : '');

    const selectedGame = document.getElementById('w-selected-game')?.value || '';
    const watchedTeam = document.getElementById('w-watched-team')?.value || '';
    const league = document.getElementById('w-league')?.value || '';

    // 2. Legacy Report Fields (Compatibilidad con reportes que leen del Host)
    let entry = '', food = '', drink = '';

    if (window.SEAT_ORDERS && window.SEAT_ORDERS[0]) {
      const host = window.SEAT_ORDERS[0];
      const entryArr = Array.isArray(host.entrada) ? host.entrada : (host.entrada ? [host.entrada] : []);
      const platilloArr = Array.isArray(host.platillo) ? host.platillo : (host.platillo ? [host.platillo] : []);
      const drinkArr = Array.isArray(host.bebida) ? host.bebida : (host.bebida ? [host.bebida] : []);

      entry = entryArr.join(', ');
      food = platilloArr.join(', ');
      drink = drinkArr.join(', ');
    }

    // 3. Comandero Summary & Notes
    let comandero = document.getElementById('w-comandero') ? document.getElementById('w-comandero').value : '';
    const manualNotes = document.getElementById('w-manual-notes') ? document.getElementById('w-manual-notes').value : '';

    if (manualNotes.trim()) {
      comandero += `\n\n📝 NOTAS MANUALES:\n${manualNotes.trim()}`;
    }

    // 4. PERFORM SAVE
    const updatedVisit = window.db.updateVisitDetails(visitId, {
      reason,
      selectedGame,
      watchedTeam,
      league,
      entry,
      food,
      drink,
      comandero,
      manualNotes: manualNotes,
      seatOrders: window.SEAT_ORDERS || [], // CRITICAL: Save order state
      lastUpdated: new Date().toISOString()
    });

    // 5. Feedback & Sync
    if (updatedVisit) {
      console.log('✅ Guardado confirmado:', updatedVisit);
      // Sync local
      if (updatedVisit.seatOrders) {
        window.SEAT_ORDERS = JSON.parse(JSON.stringify(updatedVisit.seatOrders));
      }
      showToast('✅ COMANDA GUARDADA CORRECTAMENTE', 'success');
    } else {
      console.warn('⚠️ Guardado ejecutado, pero sin retorno de objeto visit.');
      // Fallback for visual confirmation
      showToast('✅ Datos guardados.', 'success');
    }

  } catch (error) {
    console.error('❌ Error CRÍTICO en savePartialData:', error);
    alert('Error al guardar: ' + error.message);
  }
};
// Alias for backwards compatibility if needed
function savePartialData(visitId) { window.savePartialData(visitId); }


function renderWaiterBottomNav(activeTab = '', visitsCount = 0) {
  return `
                  <nav class="bottom-nav" style="z-index: 50;">
                    <button onclick="navigateTo('waiter-dashboard'); setTimeout(() => switchWaiterTab('mesas'), 100)" class="bottom-nav-item ${activeTab === 'mesas' ? 'active' : ''}" style="position: relative; min-width: 60px;">
                      <span class="bottom-nav-icon">🍽️</span>
                      <span class="bottom-nav-label">Mesas</span>
                      ${visitsCount > 0 ? `<span class="bottom-nav-badge">${visitsCount}</span>` : ''}
                    </button>
                    <button onclick="navigateTo('waiter-dashboard'); setTimeout(() => switchWaiterTab('partidos'), 100)" class="bottom-nav-item" style="position: relative;">
                      <span class="bottom-nav-icon">🏈</span>
                      <span class="bottom-nav-label">Partidos</span>
                    </button>
                    <button onclick="navigateTo('waiter-dashboard'); setTimeout(() => switchWaiterTab('promos'), 100)" class="bottom-nav-item" style="position: relative;">
                      <span class="bottom-nav-icon">🎁</span>
                      <span class="bottom-nav-label">Promos</span>
                    </button>
                    <button onclick="navigateTo('waiter-dashboard'); setTimeout(() => switchWaiterTab('dinamicas'), 100)" class="bottom-nav-item" style="position: relative;">
                      <span class="bottom-nav-icon">🎯</span>
                      <span class="bottom-nav-label">Dinámica</span>
                    </button>
                    <button onclick="navigateTo('waiter-dashboard'); setTimeout(() => switchWaiterTab('productos86'), 100)" class="bottom-nav-item" style="position: relative;">
                      <span class="bottom-nav-icon">⚠️</span>
                      <span class="bottom-nav-label">86/85</span>
                    </button>
                    <button onclick="navigateTo('waiter-dashboard'); setTimeout(() => switchWaiterTab('info'), 100)" class="bottom-nav-item" style="position: relative;">
                      <span class="bottom-nav-icon">👤</span>
                      <span class="bottom-nav-label">Mi Info</span>
                    </button>
                    <button onclick="showQRReviews()" class="bottom-nav-item" style="position: relative;">
                      <span class="bottom-nav-icon">⭐</span>
                      <span class="bottom-nav-label">QR</span>
                    </button>
                  </nav>
                  `;
}

// Toggle Cerrar Mesa form
function toggleCerrarMesa() {
  const form = document.getElementById('cerrar-mesa-form');
  const btn = document.getElementById('btn-toggle-cerrar');

  if (form.classList.contains('hidden')) {
    form.classList.remove('hidden');
    btn.classList.add('hidden');
    // Focus on folio input
    document.getElementById('w-folio')?.focus();
  } else {
    form.classList.add('hidden');
    btn.classList.remove('hidden');
  }
}

// COMANDERO MENU FUNCTIONS
function renderComanderoMenuItems(type) {
  const menu = window.db.getMenu();
  const items = type === 'alimentos' ? menu.alimentos : menu.bebidas;

  const byCategory = {};
  items.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  let html = '<div class="max-h-60 overflow-y-auto">';
  Object.keys(byCategory).forEach(category => {
    html += `
      <div class="mb-3">
        <h5 class="text-yellow-400 font-bold text-xs mb-2 uppercase">${category}</h5>
        <div class="grid grid-cols-3 gap-2">
          ${byCategory[category].map(item => `
            <button 
              onclick="addToComandero('${item.name.replace(/'/g, "\\'")}')" 
              class="p-2 bg-gray-800 border ${item.available ? 'border-gray-600 hover:border-yellow-500' : 'border-red-500 opacity-50'} rounded text-xs font-semibold ${!item.available ? 'line-through' : ''}"
              ${!item.available ? 'disabled' : ''}>
              ${item.name}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}

function switchComanderoTab(tab) {
  const alimentosTab = document.getElementById('comandero-tab-alimentos');
  const bebidasTab = document.getElementById('comandero-tab-bebidas');
  const alimentosContent = document.getElementById('comandero-content-alimentos');
  const bebidasContent = document.getElementById('comandero-content-bebidas');

  if (tab === 'alimentos') {
    alimentosTab.className = 'flex-1 p-2 bg-yellow-600 rounded font-bold text-black text-sm';
    bebidasTab.className = 'flex-1 p-2 bg-gray-700 rounded font-bold text-sm';
    alimentosContent.classList.remove('hidden');
    bebidasContent.classList.add('hidden');
  } else {
    alimentosTab.className = 'flex-1 p-2 bg-gray-700 rounded font-bold text-sm';
    bebidasTab.className = 'flex-1 p-2 bg-yellow-600 rounded font-bold text-black text-sm';
    alimentosContent.classList.add('hidden');
    bebidasContent.classList.remove('hidden');
  }
}

function addToComandero(itemName) {
  const textarea = document.getElementById('w-comandero');
  const currentValue = textarea.value.trim();

  if (currentValue) {
    textarea.value = currentValue + ', ' + itemName;
  } else {
    textarea.value = itemName;
  }
}

// SEAT-BASED SYSTEM
window.SEAT_ORDERS = [];
window.CURRENT_SEAT = 0;
window.CURRENT_COURSE = '';

function switchSeat(seatIndex) {
  // Update Global State
  window.CURRENT_SEAT = seatIndex;

  // Visual Updates
  document.querySelectorAll('[id^="seat-content-"]').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('[id^="seat-tab-"]').forEach(el => {
    el.className = 'bg-gray-800 text-gray-400 px-4 py-2 rounded font-bold text-sm whitespace-nowrap border border-transparent transition-all duration-200';
  });

  const contentEl = document.getElementById(`seat-content-${seatIndex}`);
  const tabEl = document.getElementById(`seat-tab-${seatIndex}`);

  if (contentEl) {
    contentEl.classList.remove('hidden');

    // Inject or update feedback banner
    let banner = contentEl.querySelector('.seat-feedback-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'seat-feedback-banner bg-yellow-900/40 text-yellow-400 p-2 mb-4 text-center text-xs uppercase font-bold tracking-widest border border-yellow-600/50 rounded animate-pulse';
      contentEl.insertBefore(banner, contentEl.firstChild);
    }
    banner.textContent = `📝 EDITANDO: ${seatIndex === 0 ? 'ANFITRIÓN' : 'ASIENTO ' + (seatIndex + 1)}`;
  }

  if (tabEl) {
    // High contrast active state
    tabEl.className = 'bg-yellow-500 text-black px-6 py-2 rounded-t-lg font-black text-sm whitespace-nowrap border-2 border-white shadow-[0_0_15px_rgba(234,179,8,0.5)] transform scale-105 z-10';
  }
}

function openMenuFor(seatIndex, course) {
  window.CURRENT_SEAT = seatIndex;
  window.CURRENT_COURSE = course;
  const menu = window.db.getMenu();
  let items = course === 'bebida' ? menu.bebidas : menu.alimentos;

  // Specific Filter for Desserts
  if (course === 'postre') {
    items = items.filter(i => i.category.toLowerCase().includes('postre') || i.category.toLowerCase().includes('dessert'));
  }

  // Agrupar por categoría
  const byCategory = {};
  items.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  let html = '<div class="pb-24">';

  if (course === 'bebida') {
    const groups = {
      '🍺 CERVEZAS': ['Cerveza Barril', 'Cerveza Botella'],
      '🌶️ MICHELADOS': ['Michelados', 'Mezclas'],
      '🥃 DESTILADOS': ['Ron', 'Tequila', 'Mezcal', 'Ginebra', 'Brandy', 'Whiskey', 'Vodka', 'Digestivos'],
      '🥤 SIN ALCOHOL': ['REFILL', 'REFRESCOS', 'LIMONADAS SABORES']
    };

    // 1. Render mapped groups
    const mappedCategories = new Set();
    const VIRTUAL_CATS = ['REFILL', 'REFRESCOS', 'LIMONADAS SABORES'];

    Object.keys(groups).forEach(grpTitle => {
      const catsInGroup = groups[grpTitle];
      const hasContent = catsInGroup.some(cat => byCategory[cat] || VIRTUAL_CATS.includes(cat));

      if (hasContent) {
        html += `<h3 class="text-yellow-500 font-bold mb-2 mt-4 uppercase border-b border-gray-700 pb-1 text-sm tracking-wider pl-1">${grpTitle}</h3>`;
        html += `<div class="grid grid-cols-2 gap-3">`;
        catsInGroup.forEach(cat => {
          if (byCategory[cat] || VIRTUAL_CATS.includes(cat)) {
            mappedCategories.add(cat); // Mark as used
            html += `<button onclick="showCategoryItems('${cat}')" class="p-4 bg-gray-800 border-2 border-yellow-600 rounded-lg hover:border-yellow-400 text-left"><div class="font-bold uppercase text-sm">${cat}</div></button>`;

            if (byCategory[cat]) delete byCategory[cat];
          }
        });
        html += `</div>`;
      }
    });

    // 2. Render remaining 
    // 2. Render remaining 
    const HIDDEN_CATS = ['Jarra Cerveza', 'Caguamas', 'Refrescos', 'Limonadas', 'Naranjadas', 'Café', 'Agua', 'Otros'];
    const remaining = Object.keys(byCategory).filter(c => !HIDDEN_CATS.includes(c));

    if (remaining.length > 0) {
      html += `<h3 class="text-yellow-500 font-bold mb-2 mt-4 uppercase border-b border-gray-700 pb-1 text-sm tracking-wider pl-1">OTROS</h3>`;
      html += `<div class="grid grid-cols-2 gap-3">`;
      remaining.forEach(cat => {
        html += `<button onclick="showCategoryItems('${cat}')" class="p-4 bg-gray-800 border-2 border-yellow-600 rounded-lg hover:border-yellow-400 text-left"><div class="font-bold uppercase text-sm">${cat}</div></button>`;
      });
      html += `</div>`;
    }

  } else {
    // Default (Alimentos)
    html += `<div class="grid grid-cols-2 gap-3">`;
    Object.keys(byCategory).forEach(category => {
      html += `<button onclick="showCategoryItems('${category}')" class="p-4 bg-gray-800 border-2 border-yellow-600 rounded-lg hover:border-yellow-400 text-left"><div class="font-bold uppercase">${category}</div></button>`;
    });
    html += `</div>`;
  }

  html += '</div>';

  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');
  const modal = document.getElementById('menu-modal');

  if (modalTitle) modalTitle.textContent = `Selecciona ${course.toUpperCase()} (Asiento ${seatIndex === 0 ? 'Anfitrión' : seatIndex + 1})`;
  if (modalContent) modalContent.innerHTML = html;
  if (modal) modal.classList.remove('hidden');
}

// === BEER SUB-MENU LOGIC ===
window.DRAFT_SIZE_SELECTION = null;

function selectDraftSize(size) {
  window.DRAFT_SIZE_SELECTION = size;
  showCategoryItems('Cerveza Barril', true);
}

window.selectAndExecute = function (btn, action) {
  // Visual Feedback: Turn button yellow and pop
  btn.classList.remove('bg-gray-800', 'border-yellow-600', 'hover:bg-yellow-900/40');
  btn.classList.add('bg-yellow-500', 'border-white', 'text-black', 'scale-105', 'shadow-[0_0_20px_rgba(234,179,8,0.6)]', 'z-50');

  const span = btn.querySelector('span');
  if (span) {
    span.classList.remove('text-white', 'group-hover:text-yellow-300');
    span.classList.add('text-black');
  }

  setTimeout(() => {
    // Execute action
    const fn = new Function(action);
    fn();
  }, 150);
}

function renderSubMenuOptions({ title, options, backAction }) {
  let html = `
                <div class="flex justify-between items-center mb-4 sticky top-0 bg-gray-900 z-10 py-2 border-b border-gray-800">
                  <button onclick="${backAction}" class="text-yellow-400 font-bold flex items-center gap-2 text-sm">← ATRAS</button>
                </div>
                <div class="p-4 text-center">
                  <h3 class="text-2xl text-yellow-400 font-black mb-6 uppercase">${title}</h3>
                  <div class="grid grid-cols-1 gap-4 max-w-xs mx-auto">
                    ${options.map(opt => `
                <button onclick="selectAndExecute(this, '${opt.action.replace(/'/g, "\\'")}')" class="p-6 bg-gray-800 border-2 border-yellow-600 hover:bg-yellow-900/40 hover:border-yellow-400 rounded-xl transition-all transform active:scale-95 shadow-lg group">
                    <span class="text-xl font-bold text-white group-hover:text-yellow-300">${opt.label}</span>
                </button>
            `).join('')}
                  </div>
                </div>
                `;
  const content = document.getElementById('modal-content');
  if (content) content.innerHTML = html;
}

window.IS_REFILL_ACTIVE = false;

function showCategoryItems(category, skipInterception = false) {
  // INTERCEPTION FOR SUB-MENUS
  if (!skipInterception) {
    if (category === 'Cerveza Barril') {
      renderSubMenuOptions({
        title: 'TAMAÑO DE BARRIL',
        options: [
          { label: '🍺 REGULAR', action: "selectDraftSize('Regular')" },
          { label: '🍺 TALL', action: "selectDraftSize('Tall')" },
          { label: '🍺 JARRA', action: "showCategoryItems('Jarra Cerveza', true)" }
        ],
        backAction: `openMenuFor(${window.CURRENT_SEAT}, 'bebida')`
      });
      return;
    }
    if (category === 'Cerveza Botella') {
      renderSubMenuOptions({
        title: 'TIPO DE BOTELLA',
        options: [
          { label: '🍾 BOTELLA (355ml)', action: "showCategoryItems('Cerveza Botella', true)" },
          { label: '🍾 CAGUAMA (1.18L)', action: "showCategoryItems('Caguamas', true)" }
        ],
        backAction: `openMenuFor(${window.CURRENT_SEAT}, 'bebida')`
      });
      return;
    }
    if (category === 'REFILL') {
      renderSubMenuOptions({
        title: 'BEBIDAS CON REFILL',
        options: [
          { label: '🥤 VASO / MÁQUINA', action: "showCategoryItems('Vaso Refill List', true)" },
          { label: '🔄 REFILL (RELLENO)', action: "showCategoryItems('Refill List', true)" }
        ],
        backAction: `openMenuFor(${window.CURRENT_SEAT}, 'bebida')`
      });
      return;
    }
  }

  window.CURRENT_CATEGORY_VIEW = category;

  // LOGIC FOR ITEMS
  let categoryItems = [];
  window.IS_REFILL_ACTIVE = false;
  window.IS_CAN_VIEW = false; // New flag
  let backBtnAction = `openMenuFor(${window.CURRENT_SEAT}, '${window.CURRENT_COURSE}')`;

  // HELPER: Ensure items exist (fixing stale localStorage issues)
  const getItemsByName = (namesList, fallbackCat) => {
    const menu = window.db.getMenu();
    const all = [...(menu.bebidas || []), ...(menu.alimentos || [])];
    return namesList.map(name => {
      const item = all.find(i => i.name === name);
      if (item) return item;
      return { name: name, category: fallbackCat, available: true, id: 'tmp_' + name.replace(/\s/g, '') };
    });
  };

  if (category === 'Vaso Refill List' || category === 'Refill List') {
    backBtnAction = "showCategoryItems('REFILL', true)";
    const machineDrks = ['Coca-Cola', 'Coca-Cola Light', 'Coca-Cola Sin Azúcar', 'Sprite', 'Fanta', 'Sidral Mundet', 'Manzana', 'Fuzetea'];
    const basics = ['Limonada', 'Naranjada'];

    const machineItems = getItemsByName(machineDrks, 'Refrescos');
    const basicItems = getItemsByName(basics, 'Limonadas');

    categoryItems = [...machineItems, ...basicItems];
    if (category === 'Refill List') window.IS_REFILL_ACTIVE = true;

  } else if (category === 'REFRESCOS') {
    const canAndCoffeeList = [
      'Coca-Cola', 'Coca-Cola Sin Azúcar', 'Coca-Cola Light',
      'Sidral Mundet', 'Manzana', 'Sprite', 'Fresca', 'Fanta', 'Ginger Ale', 'Agua Quina',
      'Agua Mineral Ciel', 'Agua Natural Ciel',
      'Café Americano', 'Café Expresso', 'Café Capuccino'
    ];
    categoryItems = getItemsByName(canAndCoffeeList, 'Refrescos');
    window.IS_CAN_VIEW = true;

  } else if (category === 'LIMONADAS SABORES') {
    const flavors = ['Limonada Mango', 'Limonada Fresa', 'Limonada Menta', 'Limonada Frutos Rojos'];
    categoryItems = getItemsByName(flavors, 'Limonadas');

  } else {
    // Standard
    const menu = window.db.getMenu();
    const items = window.CURRENT_COURSE === 'bebida' ? menu.bebidas : menu.alimentos;
    categoryItems = items.filter(i => i.category === category);
  }

  // RENDER
  let html = `
                <div class="flex justify-between items-center mb-4 sticky top-0 bg-gray-900 z-10 py-2 border-b border-gray-800">
                  <button onclick="${backBtnAction}" class="bg-gray-800 hover:bg-gray-700 text-yellow-400 font-bold py-2 px-4 rounded-lg flex items-center gap-2 text-sm shadow-sm border border-gray-600 transition-colors">
                    <span>←</span> ATRÁS
                  </button>

                </div>
                `;

  const currentSeatOrders = window.SEAT_ORDERS[window.CURRENT_SEAT];
  const activeItems = (currentSeatOrders && currentSeatOrders[window.CURRENT_COURSE]) || [];

  html += `<div class="grid grid-cols-2 gap-3 pb-24">`;

  // Render buttons
  categoryItems.forEach(item => {
    let displayName = item.name;
    let logicName = item.name;

    if (window.IS_REFILL_ACTIVE) {
      displayName = `Refill ${item.name}`;
      logicName = `Refill ${item.name}`;
    } else if (window.IS_CAN_VIEW) {
      if (!item.name.startsWith('Café') && !item.name.startsWith('Agua Natural')) {
        displayName = `Lata ${item.name}`;
        logicName = `Lata ${item.name}`;
      }
    }

    const safeName = logicName.replace(/'/g, "\\'");
    const qty = activeItems.filter(ord => ord === logicName || ord.startsWith(logicName + ' [')).length;

    html += `
                  <div class="flex items-stretch h-16 bg-gray-800 border ${item.available ? 'border-gray-600' : 'border-red-900 opacity-50'} rounded-lg overflow-hidden shadow-sm group">

                    <!-- MINUS -->
                    <button onclick="event.stopPropagation(); removeLastInstance('${safeName}', '${category}')"
                      class="w-14 bg-black/20 hover:bg-red-900/40 text-gray-500 hover:text-red-400 font-bold text-2xl border-r border-gray-700/50 flex items-center justify-center transition-all active:bg-red-900/60 ${qty === 0 ? 'opacity-0 pointer-events-none' : ''}"
                      aria-label="Disminuir cantidad">
                      −
                    </button>

                    <!-- CENTER -->
                    <button onclick="processMenuItemSelection('${safeName}', this)"
                      class="flex-1 px-2 flex flex-col items-center justify-center group-hover:bg-gray-700/50 transition-colors active:bg-gray-700"
                      ${!item.available ? 'disabled' : ''}>
                      <span class="text-sm font-bold text-center leading-tight ${item.available ? 'text-gray-200' : 'line-through text-gray-500'}">${displayName}</span>
                      ${qty > 0 ? `<div class="text-yellow-500 text-xs font-black mt-1 tracking-wider">${qty} PEDIDO${qty > 1 ? 'S' : ''}</div>` : ''}
                    </button>

                    <!-- PLUS -->
                    <button onclick="event.stopPropagation(); processMenuItemSelection('${safeName}', this)"
                      class="w-14 bg-black/20 hover:bg-green-900/40 text-green-500 hover:text-green-300 font-bold text-2xl border-l border-gray-700/50 flex items-center justify-center transition-all active:bg-green-900/60"
                      ${!item.available ? 'disabled' : ''}
                      aria-label="Aumentar cantidad">
                      +
                    </button>
                  </div>`;
  });
  html += '</div>';

  const modalContent = document.getElementById('modal-content');
  if (modalContent) modalContent.innerHTML = html;
}

window.removeLastInstance = function (itemName, category) {
  if (window.SEAT_ORDERS[window.CURRENT_SEAT] && window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE]) {
    const items = window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE];
    let foundIndex = -1;
    // Find last occurrence to remove LIFO
    for (let i = items.length - 1; i >= 0; i--) {
      // STRICT MATCH FIX: Ensure we don't match substrings like "XX Ambar" inside "XX Ambar (Barril)"
      if (items[i] === itemName || items[i].startsWith(itemName + ' [')) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex !== -1) {
      items.splice(foundIndex, 1);
      if (window.showToast) showToast(`Se eliminó 1 ${itemName}`, 'success');

      updateComanderoSummary();
      showCategoryItems(category); // Re-render logic

      // Update Main Button Label Logic 
      const itemLabel = document.getElementById(`seat-${window.CURRENT_SEAT}-${window.CURRENT_COURSE}`);
      if (itemLabel) {
        if (items.length > 0) {
          itemLabel.textContent = items.length > 1 ? `${items[items.length - 1]} (+${items.length - 1})` : items[0];
          itemLabel.classList.add('text-green-400');
        } else {
          itemLabel.textContent = '-';
          itemLabel.classList.remove('text-green-400');
        }
      }
    }
  }
}

// Legacy removal function kept but unused
function removeSeatItem_LEGACY(itemIndex, currentCategory) {
  if (window.SEAT_ORDERS[window.CURRENT_SEAT] && window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE]) {
    window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE].splice(itemIndex, 1);

    // Update summary and label immediately
    updateComanderoSummary();

    // Update Label
    const itemLabel = document.getElementById(`seat-${window.CURRENT_SEAT}-${window.CURRENT_COURSE}`);
    const items = window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE];
    if (itemLabel) {
      if (items.length > 0) {
        itemLabel.textContent = items.length > 1 ? `${items[items.length - 1]} (+${items.length - 1})` : items[0];
        itemLabel.classList.add('text-green-400');
      } else {
        itemLabel.textContent = '-';
        itemLabel.classList.remove('text-green-400');
      }
    }

    // Re-render the category view to update the list
    showCategoryItems(currentCategory);
  }
}



window.addGeneralObservation = function () {
  try {
    const text = prompt("📝 Escribe la observación para cocina:\n(Se agregará al pedido actual)");
    if (text && text.trim().length > 0) {
      const obs = `📝 NOTA: ${text.trim().toUpperCase()}`;

      // Ensure structure exists
      if (!window.SEAT_ORDERS[window.CURRENT_SEAT]) window.SEAT_ORDERS[window.CURRENT_SEAT] = {};
      if (!window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE]) window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE] = [];

      let items = window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE];
      // Fix potential non-array legacy data
      if (!Array.isArray(items)) {
        items = items ? [items] : [];
        window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE] = items;
      }

      items.push(obs);

      console.log('Observation Added:', obs);
      updateComanderoSummary();

      // Refresh current view if possible
      if (window.CURRENT_CATEGORY_VIEW) {
        showCategoryItems(window.CURRENT_CATEGORY_VIEW);
      }

      // Update Label (Visual feedback on the main screen button)
      const labelId = `seat-${window.CURRENT_SEAT}-${window.CURRENT_COURSE}`;
      const lbl = document.getElementById(labelId);
      if (lbl) {
        if (items.length > 1) {
          lbl.textContent = `${items[items.length - 1]} (+${items.length - 1})`;
        } else {
          lbl.textContent = "📝 Nota";
        }
        lbl.classList.add('text-green-400');
      }
    }
  } catch (e) {
    console.error('Error adding observation:', e);
    alert('Error al agregar nota.');
  }
}

// Alias to reuse existing pencil button safely
window.editItemNote = function (index, category) {
  window.addGeneralObservation();
}

function selectMenuItem(itemName, btnElement) {
  let finalItemName = itemName;

  // Initialize seat object if needed
  if (!window.SEAT_ORDERS[window.CURRENT_SEAT]) {
    window.SEAT_ORDERS[window.CURRENT_SEAT] = {};
  }

  // Initialize course array if needed
  if (!window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE]) {
    window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE] = [];
  } else if (!Array.isArray(window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE])) {
    window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE] = [window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE]];
  }

  // Add new item
  window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE].push(finalItemName);

  // Update UI for the specific item label (Main Screen)
  const itemLabel = document.getElementById(`seat-${window.CURRENT_SEAT}-${window.CURRENT_COURSE}`);
  const items = window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE];
  if (itemLabel) {
    if (items.length > 1) {
      itemLabel.textContent = `${items[items.length - 1]} (+${items.length - 1})`;
    } else {
      itemLabel.textContent = finalItemName.length > 20 ? finalItemName.substring(0, 18) + '...' : finalItemName;
    }
    itemLabel.classList.add('text-green-400');
  }

  updateComanderoSummary();

  // REFRESH VIEW TO UPDATE COUNTERS CLEANLY
  if (window.CURRENT_CATEGORY_VIEW) {
    showCategoryItems(window.CURRENT_CATEGORY_VIEW);
  }

  if (itemName.includes('|')) {
    closeMenuModal();
  }
}


function closeMenuModal() {
  const modal = document.getElementById('menu-modal');
  if (modal) modal.classList.add('hidden');
}

// ==========================================
// SISTEMA DE MODIFICADORES (WIZARD)
// ==========================================

let WIZARD_STATE = {
  itemName: '',
  rules: [],
  currentStep: 0,
  selections: [],
  btnElement: null
};

function getModifierRules(itemName) {
  const menu = window.db.getMenu();
  const getNames = (cat) => menu.alimentos.filter(i => i.category === cat).map(i => i.name).sort();
  const getSalsas = () => menu.alimentos.filter(i => i.category === 'Salsas').map(i => i.name).sort();
  const getSaz = () => menu.alimentos.filter(i => i.category === 'Sazonadores').map(i => i.name).sort();
  const getSalsasAndSaz = () => [...getSalsas(), ...getSaz()].sort();
  const getAderezos = () => menu.alimentos.filter(i => i.category === 'Aderezos').map(i => i.name).sort();

  const rules = [];

  // ALITAS & BONELESS
  if (itemName.includes('Alitas Small') || itemName.includes('Boneless Small')) {
    rules.push({ title: 'Selecciona hasta 2 Salsas', type: 'multi', max: 2, options: getSalsasAndSaz() });
    rules.push({ title: 'Selecciona 1 Aderezo', type: 'single', options: getAderezos() });
  }
  else if (itemName.includes('Alitas Medium') || itemName.includes('Boneless Medium') || itemName.includes('Wings Platter')) {
    rules.push({ title: 'Selecciona hasta 3 Salsas', type: 'multi', max: 3, options: getSalsasAndSaz() });
    rules.push({ title: 'Selecciona hasta 2 Aderezos', type: 'multi', max: 2, options: getAderezos() });
  }
  else if (itemName.includes('Alitas Large') || itemName.includes('Boneless Large')) {
    rules.push({ title: 'Selecciona hasta 4 Salsas', type: 'multi', max: 4, options: getSalsasAndSaz() });
    rules.push({ title: 'Selecciona hasta 2 Aderezos', type: 'multi', max: 2, options: getAderezos() });
  }
  else if (itemName.includes('Corn Riblets')) {
    rules.push({ title: 'Elige Sazonador o Salsa', type: 'single', options: getSalsasAndSaz() });
  }
  else if (itemName.includes('Potato Wedges') || itemName.includes('French Fries Basket')) {
    rules.push({ title: '¿Agregar Extras?', type: 'multi', max: 2, options: ['Queso', 'Tocino'] });
  }
  else if (itemName.includes('Sampler') || itemName.includes('All Sports Pack')) {
    rules.push({ title: 'Salsa para Boneless', type: 'single', options: getSalsasAndSaz() });
    if (itemName.includes('All Sports Pack')) {
      rules.push({ title: 'Salsa para Tenders', type: 'single', options: getSalsasAndSaz() });
    }
    rules.push({ title: 'Elige Aderezo', type: 'single', options: getAderezos() });
  }
  else if (itemName.includes('Tenders') || itemName.includes('Boneless Kids')) {
    rules.push({ title: 'Elige Salsa o Sazonador', type: 'single', options: getSalsasAndSaz() });
  }
  else if (itemName.includes('(Barril)') || itemName.includes('Cerveza Barril')) {
    // Only ask size if NOT already selected (not in name)
    if (!itemName.includes('REGULAR') && !itemName.includes('TALL')) {
      rules.push({ title: 'Selecciona Tamaño', type: 'single', options: ['Regular', 'Tall', 'Jarra'] });
    }
    rules.push({ title: 'Selecciona Preparación', type: 'single', options: ['Natural', 'Chelado', 'Michelado', 'Ojo Rojo', 'Clamato'] });
  }
  else if (itemName.includes('Cerveza Botella') || itemName.includes('Bohemia') || itemName.includes('XX') || itemName.includes('Tecate') || itemName.includes('Indio') || itemName.includes('Heineken') || itemName.includes('Miller') || itemName.includes('Amstel')) {
    // CAGUAMA CHECK
    if ((itemName.includes('Tecate') || itemName.includes('Indio') || itemName.includes('XX') || itemName.includes('Carta Blanca'))
      && !itemName.includes('Caguama') && !itemName.includes('355ml')) {
      rules.push({ title: 'Presentación', type: 'single', options: ['355ml', 'Caguama (940ml)'] });
    }
    rules.push({ title: 'Selecciona Preparación', type: 'single', options: ['Natural', 'Chelado', 'Michelado', 'Ojo Rojo', 'Clamato'] });
  }
  else if (itemName.includes('Chicken Salad') && !itemName.includes('Side')) {
    rules.push({ title: 'Salsa para el Pollo', type: 'single', options: getSalsasAndSaz() });
    rules.push({ title: 'Elige Aderezo', type: 'single', options: getAderezos() });
  }
  else if (itemName.includes('Limonada') || itemName.includes('Naranjada') ||
    itemName.includes('Fresa') || itemName.includes('Mango') ||
    itemName.includes('Menta') || itemName.includes('Frutos') ||
    itemName.includes('Pepino') || itemName.includes('Maracuya')) {
    rules.push({ title: 'Preparación', type: 'single', options: ['Agua Natural', 'Agua Mineral'] });
  }

  return rules;
}

// --- LEGACY WIZARD CODE REMOVED ---

// --- LEGACY WIZARD FUNCTIONS REMOVED (NOW USING INLINE SYSTEM) ---

// DEBUG TOOL
window.forceMenuRefresh = function () {
  if (confirm('¿Recargar el menú para ver los nuevos platillos (Alitas, Boneless)?')) {
    // Borrar la estructura de menú actual para forzar regeneración
    if (window.db && window.db.data) {
      delete window.db.data.menu;
      window.db._save();
      console.log('Menú eliminado, recargando...');
      location.reload();
    }
  }
}
// === CRITICAL FUNCTION RESTORED ===
function addItemToSeatOrder(itemName) {
  // Ensure we have valid context
  if (typeof window.CURRENT_SEAT === 'undefined' || !window.CURRENT_COURSE) {
    console.error("Missing context for adding item", window.CURRENT_SEAT, window.CURRENT_COURSE);
    showToast("Error: No se ha seleccionado asiento o tiempo.", "error");
    return;
  }

  // Handle Wizard Result (modifiers)
  const finalItemName = itemName;

  // Initialize seat object if needed
  if (!window.SEAT_ORDERS[window.CURRENT_SEAT]) {
    window.SEAT_ORDERS[window.CURRENT_SEAT] = {};
  }

  // Initialize course array if needed
  if (!window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE]) {
    window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE] = [];
  } else if (!Array.isArray(window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE])) {
    // Convert old string format to array if needed
    window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE] = [window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE]];
  }

  // Add new item
  window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE].push(finalItemName);

  // Update UI for the specific item label (Main Screen)
  const itemLabel = document.getElementById(`seat-${window.CURRENT_SEAT}-${window.CURRENT_COURSE}`);
  const items = window.SEAT_ORDERS[window.CURRENT_SEAT][window.CURRENT_COURSE];

  if (itemLabel) {
    if (items.length > 1) {
      itemLabel.textContent = `${items[items.length - 1]} (+${items.length - 1})`;
    } else {
      itemLabel.textContent = finalItemName.length > 25 ? finalItemName.substring(0, 23) + '...' : finalItemName;
    }
    itemLabel.classList.remove('text-yellow-400');
    itemLabel.classList.add('text-green-400', 'font-black'); // Highlight active

    // Add pop animation to parent button
    const btn = itemLabel.parentElement.parentElement; // div -> button
    if (btn) {
      btn.classList.add('scale-105', 'border-yellow-400');
      setTimeout(() => btn.classList.remove('scale-105', 'border-yellow-400'), 200);
    }
  }

  updateComanderoSummary();
  showToast(`✅ Agregado: ${finalItemName}`);
}
window.addItemToSeatOrder = addItemToSeatOrder;

function updateComanderoSummary() {
  let summary = '';
  // Iterar de seguro sobre los indices conocidos
  for (let index = 0; index < 20; index++) {
    const seat = window.SEAT_ORDERS[index];
    if (seat && Object.keys(seat).length > 0) {
      summary += `${index === 0 ? '👑 Anfitrión' : `Asiento ${index + 1}`}:\n`;

      const courses = ['entrada', 'platillo', 'alimentos', 'bebida', 'postre']; // Standardize keys
      courses.forEach(course => {
        if (seat[course]) {
          const items = Array.isArray(seat[course]) ? seat[course] : [seat[course]];
          const label = course.charAt(0).toUpperCase() + course.slice(1);
          summary += `  ${label}:\n`;
          items.forEach(it => summary += `    • ${it}\n`);
        }
      });

      summary += '\n'; // Espacio entre asientos
    }
  }

  /* Manual notes (ORDER_NOTES) are now in separate input, BUT user wants to see them merged on demand */
  if (window.ORDER_NOTES && window.ORDER_NOTES.trim().length > 0) {
    summary += `\n========== NOTAS DE COCINA ==========\n${window.ORDER_NOTES.trim()}\n=====================================\n`;
  }

  const textarea = document.getElementById('w-comandero');
  if (textarea) textarea.value = summary.trim();
}

window.ORDER_NOTES = "";

window.editGeneralNotes = function () {
  const current = window.ORDER_NOTES;
  const manual = prompt("📝 Observaciones Generales:\n(Ej: Todo sin hielo, Alergia nueces...)", current);
  if (manual !== null) {
    window.ORDER_NOTES = manual.trim();
    updateComanderoSummary();
  }
}

function openFullscreenSummary() {
  const textarea = document.getElementById('w-comandero');
  if (!textarea) return;

  let content = textarea.value;
  const notesArea = document.getElementById('w-manual-notes');

  // Logic to prevent duplication: Only append if NOT already in content
  if (notesArea && notesArea.value.trim()) {
    const noteText = notesArea.value.trim();
    if (!content.includes(noteText)) {
      content += `\n\n📝 NOTAS MANUALES:\n${noteText}`;
    }
  }

  if (!content.trim()) {
    showToast('⚠️ El resumen está vacío.', 'error');
    return;
  }

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:black; z-index:9999; display:flex; flex-direction:column; padding:10px; box-sizing:border-box;';

  modal.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom: 1px solid #333; padding-bottom: 10px;">
                  <h2 class="text-yellow-400 text-xl font-bold flex items-center gap-2">📝 PARA POS</h2>
                  <button onclick="this.parentElement.parentElement.remove()" class="bg-red-600 active:bg-red-800 text-white px-4 py-2 rounded-lg font-bold text-sm uppercase">✕ CERRAR</button>
                </div>
                <div style="flex:1; background:#111; border:1px solid #CA8A04; border-radius:8px; padding:15px; overflow-y:auto; overflow-x:hidden;">
                  <pre class="text-gray-100 text-base md:text-xl lg:text-2xl font-mono whitespace-pre-wrap break-words leading-relaxed select-text">${content}</pre>
                </div>
                `;

  document.body.appendChild(modal);
}

// Make functions globally accessible
// Make functions globally accessible
// Make functions globally accessible
window.switchSeat = switchSeat;

// === INLINE MENU SYSTEM (RESTORATION COMPLETE) ===

const FOOD_CATEGORIES_ORDER = [
  'Para Compartir', 'Samplers', 'Alitas', 'Boneless', 'Platillos',
  'Burgers', 'Sandwiches', 'Ensaladas', 'Kids', 'Postres',
  'Salsas', 'Aderezos', 'Sazonadores'
];

const DRINK_CATEGORIES_ORDER = [
  'Cerveza Barril', 'Cerveza Botella',
  'Tequila', 'Whiskey', 'Ron', 'Vodka', 'Mezcal', 'Ginebra', 'Brandy',
  'Digestivos', 'Coctelería',
  'Refrescos', 'Refrescos Refill', 'Refrescos de Lata', 'Limonadas', 'Cafetería', 'Café'
];

window.openMenuFor = function (seatIndex, type) {
  // 1. Close others
  for (let i = 0; i < 20; i++) {
    const other = document.getElementById(`inline-menu-container-${i}`);
    if (other && i !== seatIndex) other.classList.add('hidden');
  }

  // 2. Set State
  window.CURRENT_SEAT = seatIndex;
  window.CURRENT_COURSE = type; // 'entrada', 'platillo', etc.

  // 3. Get UI
  const container = document.getElementById(`inline-menu-container-${seatIndex}`);
  const title = document.getElementById(`inline-menu-title-${seatIndex}`);
  const content = document.getElementById(`inline-menu-content-${seatIndex}`);

  if (!container || !content) return;

  // 4. Render CATEGORIES first (Level 1)
  const isFood = (type === 'entrada' || type === 'platillo' || type === 'postre');

  if (type === 'postre') {
    container.classList.remove('hidden');
    window.selectInlineCategory('Postres', seatIndex);
    setTimeout(() => container.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    return;
  }

  renderInlineCategories(seatIndex, isFood ? 'alimentos' : 'bebidas');

  // 5. Update Title
  const icon = type === 'entrada' ? '🥟' : type === 'platillo' ? '🍗' : type === 'postre' ? '🍰' : '🍺';
  title.innerHTML = `${icon} CATEGORÍAS`;

  // 6. Show & Scroll
  container.classList.remove('hidden');
  setTimeout(() => container.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
};

window.renderInlineCategories = function (seatIndex, type) {
  const content = document.getElementById(`inline-menu-content-${seatIndex}`);
  const menu = window.db.getMenu();
  let items = type === 'alimentos' ? menu.alimentos : menu.bebidas;
  let orderList = [];

  if (type === 'alimentos') {
    orderList = FOOD_CATEGORIES_ORDER;
  } else {
    // STRICT WHITELIST FOR DRINKS
    orderList = [
      'Cerveza Barril', 'Cerveza Botella',
      'Destilados',
      'Coctelería', 'Refill', 'Limonadas', 'Refrescos (Lata)', 'Café', 'Digestivos'
    ];

    // Map Items to Virtual Categories for Display Check & grouping
    items = items.map(i => {
      // Destilados
      if (['Tequila', 'Whiskey', 'Ron', 'Vodka', 'Mezcal', 'Ginebra', 'Brandy', 'Cognac'].includes(i.category)) {
        return { ...i, category: 'Destilados' };
      }
      // Café
      if (['Cafetería'].includes(i.category)) {
        return { ...i, category: 'Café' };
      }
      // Caguamas merged to 'Cerveza Botella' for top navigation
      if (i.name.includes('Caguama') || i.category === 'Caguamas') {
        return { ...i, category: 'Cerveza Botella' };
      }

      // Limonadas / Naranjadas Logic
      if (['Limonadas', 'Naranjadas'].includes(i.category)) {
        const n = i.name.toLowerCase();
        // Flavored -> Limonadas Button
        if (n.includes('fresa') || n.includes('mango') || n.includes('frutos') || n.includes('pepino') || n.includes('menta') || n.includes('kiwi') || n.includes('maracuya')) {
          return { ...i, category: 'Limonadas' };
        }
        // Natural/Mineral -> Refill Button
        return { ...i, category: 'Refill' };
      }

      if (i.category === 'Refrescos') {
        if (i.name.toLowerCase().includes('refill')) return { ...i, category: 'Refill' };
        return { ...i, category: 'Refrescos (Lata)' };
      }
      return i;
    });
  }

  // Extract unique categories present in items
  const availableCats = [...new Set(items.map(i => i.category))];

  // Filter: Show only categories that are in our Whitelist AND have items
  const categoriesToShow = orderList.filter(c => availableCats.includes(c));

  let html = `<div class="grid grid-cols-2 gap-3 pb-4">`;

  categoriesToShow.forEach(cat => {
    html += `
      <button onclick="selectInlineCategory('${cat}', ${seatIndex})" 
        class="p-6 bg-gray-800 border-2 border-gray-600 rounded-lg hover:border-yellow-500 hover:bg-gray-700 transition flex flex-col items-center justify-center text-center">
        <span class="text-xl font-bold text-white uppercase">${cat}</span>
        <span class="text-xs text-gray-400 mt-2">Ver Productos ➔</span>
      </button>
    `;
  });

  html += `</div>`;
  content.innerHTML = html;

  // Hide search bar in category view
  const searchInput = document.getElementById(`inline-search-${seatIndex}`);
  if (searchInput) searchInput.parentElement.classList.add('hidden');
};

window.selectInlineCategory = function (category, seatIndex) {
  const content = document.getElementById(`inline-menu-content-${seatIndex}`);
  const title = document.getElementById(`inline-menu-title-${seatIndex}`);
  const searchInput = document.getElementById(`inline-search-${seatIndex}`);

  // LEVEL 2 NAVIGATION CHECK
  if (category === 'Cerveza Botella') {
    renderSubCategories(seatIndex, category, ['Cerveza 355ml', 'Caguama']);
    return;
  }
  if (category === 'Refill') {
    renderSubCategories(seatIndex, category, ['Vaso', 'Refill']);
    return;
  }

  // Update Title
  title.innerHTML = `<button onclick="openMenuFor(${seatIndex}, window.CURRENT_COURSE)" class="text-sm bg-gray-700 px-2 py-1 rounded mr-2">⬅</button> ${category.toUpperCase()}`;

  // Show Search
  if (searchInput) {
    searchInput.parentElement.classList.remove('hidden');
    searchInput.value = ''; // Reset search
    searchInput.setAttribute('placeholder', `🔍 Buscar en ${category}...`);
  }

  // Get Items
  const menu = window.db.getMenu();
  const allItems = [...(menu.alimentos || []), ...(menu.bebidas || [])];

  // Logic for Virtual Categories
  let categoryItems = [];

  if (category === 'Destilados') {
    const spirits = ['Tequila', 'Whiskey', 'Ron', 'Vodka', 'Mezcal', 'Ginebra', 'Brandy', 'Cognac'];
    categoryItems = allItems.filter(i => spirits.includes(i.category));
  } else if (category === 'Café') {
    categoryItems = allItems.filter(i => i.category === 'Café' || i.category === 'Cafetería');
  } else if (category === 'Refrescos (Lata)') {
    categoryItems = allItems.filter(i => i.category === 'Refrescos' && !i.name.toLowerCase().includes('refill'));
  } else if (category === 'Limonadas') {
    const rawItems = allItems.filter(i => {
      if (!['Limonadas', 'Naranjadas'].includes(i.category)) return false;
      const n = i.name.toLowerCase();
      return (n.includes('fresa') || n.includes('mango') || n.includes('frutos') || n.includes('pepino') || n.includes('menta') || n.includes('kiwi') || n.includes('maracuya'));
    });

    // DEDUPLICATE BY FLAVOR
    const seenFlavors = new Set();
    categoryItems = rawItems.filter(i => {
      const n = i.name.toLowerCase();
      let flavor = '';
      if (n.includes('fresa')) flavor = 'fresa';
      else if (n.includes('mango')) flavor = 'mango';
      else if (n.includes('frutos')) flavor = 'frutos';
      else if (n.includes('pepino')) flavor = 'pepino';
      else if (n.includes('menta')) flavor = 'menta';
      else if (n.includes('kiwi')) flavor = 'kiwi';
      else if (n.includes('maracuya')) flavor = 'maracuya';

      if (flavor && !seenFlavors.has(flavor)) {
        seenFlavors.add(flavor);
        return true;
      }
      return false;
    });
  } else {
    categoryItems = allItems.filter(i => i.category === category);
  }

  let html = `<div class="grid grid-cols-2 gap-3 pb-4 animate-fade-in">`;

  if (categoryItems.length === 0) {
    html += `<p class="col-span-2 text-center text-gray-500 py-4">No hay productos disponibles.</p>`;
  } else {
    categoryItems.forEach(item => {
      let paramName = item.name;
      // Add Extra prefixes for specific categories
      if (category === 'Salsas') paramName = 'Salsa Extra ' + item.name;
      else if (category === 'Aderezos') paramName = 'Aderezo Extra ' + item.name;
      else if (category === 'Sazonadores') paramName = 'Sazonador Extra ' + item.name;

      const safeName = paramName.replace(/'/g, "\\'");

      html += `
        <button onclick="selectMenuItem('${safeName}')" 
          class="p-4 bg-gray-800 border-2 ${item.available ? 'border-gray-600 hover:border-yellow-500 hover:bg-gray-700' : 'border-red-500 opacity-50'} rounded-lg font-semibold transition text-left relative overflow-hidden group ${!item.available ? 'cursor-not-allowed' : ''}"
          ${!item.available ? 'disabled' : ''}>
          <div class="relative z-10">
            <div class="text-white font-bold leading-tight">${item.name}</div>
            <div class="text-yellow-500 text-sm mt-1">$${item.price}</div>
          </div>
          ${!item.available ? '<div class="absolute inset-0 flex items-center justify-center bg-black/60 text-red-500 font-bold rotate-12 text-2xl border-2 border-red-500">AGOTADO</div>' : ''}
        </button>
      `;
    });
  }

  html += `</div>`;
  content.innerHTML = html;
};

window.closeInlineMenu = function (seatIndex) {
  const container = document.getElementById(`inline-menu-container-${seatIndex}`);
  if (container) container.classList.add('hidden');
};

window.filterInlineMenu = function (term, seatIndex) {
  const content = document.getElementById(`inline-menu-content-${seatIndex}`);
  if (!content) return;

  const buttons = content.querySelectorAll('button');
  const lowerTerm = term.toLowerCase();

  buttons.forEach(btn => {
    // Skip back button or categories if needed, but categories are usually replaced now
    if (btn.textContent.includes('Volver') || btn.textContent.includes('➔')) return;

    if (btn.textContent.toLowerCase().includes(lowerTerm)) {
      btn.style.display = 'block';
    } else {
      btn.style.display = 'none';
    }
  });
};

window.selectMenuItem = function (itemName) {
  try {
    // ALWAYS USE WIZARD FOR NOTES
    startWizardInline(itemName);
  } catch (error) {

    console.error('Error en selectMenuItem:', error);
    alert('Error al seleccionar producto: ' + error.message);
  }
};

// Inline Wizard Functions
function startWizardInline(itemName) {
  try {
    const rules = getModifierRules(itemName);
    WIZARD_STATE = {
      itemName: itemName,
      rules: rules,
      currentStep: 0,
      selections: []
    };

    if (rules.length === 0) {
      renderWizardNotes(window.CURRENT_SEAT);
    } else {
      renderWizardInline();
    }
  } catch (e) {
    console.error('Error starting wizard:', e);
    alert('Error iniciando wizard: ' + e.message);
  }
}


window.renderSubCategories = function (seatIndex, parentCat, options) {
  const content = document.getElementById(`inline-menu-content-${seatIndex}`);
  const title = document.getElementById(`inline-menu-title-${seatIndex}`);

  // Title update with Back button to Categories
  title.innerHTML = `<button onclick="window.renderInlineCategories(${seatIndex}, window.CURRENT_COURSE === 'platillo' ? 'alimentos' : 'bebidas')" class="text-sm bg-gray-700 px-2 py-1 rounded mr-2">⬅</button> ${parentCat.toUpperCase()}`;

  let html = `<div class="grid grid-cols-2 gap-3 pb-4 animate-fade-in">`;
  options.forEach(opt => {
    // Clean display name
    const displayName = opt.replace(' (1.18L)', '');
    html += `
                  <button onclick="selectInlineSubCategory('${parentCat}', '${opt}', ${seatIndex})"
                    class="p-6 bg-gray-800 border-2 border-gray-600 rounded-lg hover:border-yellow-500 hover:bg-gray-700 transition flex flex-col items-center justify-center text-center">
                    <span class="text-xl font-bold text-white uppercase">${displayName}</span>
                  </button>
                  `;
  });
  html += `</div>`;
  content.innerHTML = html;
};

window.selectInlineSubCategory = function (parentCat, subCat, seatIndex) {
  const content = document.getElementById(`inline-menu-content-${seatIndex}`);
  const menu = window.db.getMenu();
  const allItems = [...(menu.alimentos || []), ...(menu.bebidas || [])];

  let items = [];
  let suffix = ''; // Suffix to append to item name for ticket clarity

  if (parentCat === 'Cerveza Botella') {
    if (subCat.includes('355')) { // 355ml
      items = allItems.filter(i =>
        (i.category === 'Cerveza Botella' || i.name.includes('Cerveza') || i.name.includes('Bohemia') || i.name.includes('XX') || i.name.includes('Tecate') || i.name.includes('Indio') || i.name.includes('Heineken') || i.name.includes('Amstel'))
        && !i.name.includes('Caguama') && i.category !== 'Caguamas'
      );
      // No suffix needed if item name is standard, or maybe [355ml]? 
      // Let's leave standard names for 355ml as they are default.
    } else { // Caguamas
      items = allItems.filter(i => i.name.includes('Caguama') || i.category === 'Caguamas');
      // Force suffix to ensure size question is skipped
      suffix = ' [Caguama]';
    }
  }

  if (parentCat === 'Refill') {
    suffix = ` [${subCat}]`; // e.g. "Coca-Cola [Vaso]"
    items = allItems.filter(i => {
      // 1. Basic Sodas
      if (i.category === 'Refrescos' && (i.name.includes('Coca') || i.name.includes('Sprite') || i.name.includes('Fanta') || i.name.toLowerCase().includes('refill'))) return true;

      // 2. Limonadas/Naranjadas (NO FLAVORS)
      if (['Limonadas', 'Naranjadas'].includes(i.category)) {
        const n = i.name.toLowerCase();
        if (n.includes('fresa') || n.includes('mango') || n.includes('frutos') || n.includes('pepino') || n.includes('menta') || n.includes('kiwi')) return false;
        return true;
      }
      return false;
    });
  }

  // Render Items
  let html = `<div class="grid grid-cols-2 gap-3 pb-4 animate-fade-in">`;
  if (items.length === 0) {
    html += `<p class="col-span-2 text-center text-gray-500">No hay productos disponibles.</p>`;
  } else {
    items.forEach(item => {
      // Use suffix in onclick
      const finalName = item.name + suffix;
      html += `
            <button onclick="selectMenuItem('${finalName}')" 
              class="p-4 bg-gray-800 border-2 ${item.available ? 'border-gray-600 hover:border-yellow-500 hover:bg-gray-700' : 'border-red-500 opacity-50'} rounded-lg font-semibold transition text-left relative overflow-hidden group">
              <div class="text-white font-bold">${item.name}</div>
              <div class="text-yellow-400 text-sm">$${item.price}</div>
            </button>`;
    });
  }
  html += `</div>`;
  content.innerHTML = html;
};

function renderWizardInline() {
  const seatIndex = window.CURRENT_SEAT;
  const content = document.getElementById(`inline-menu-content-${seatIndex}`);
  const title = document.getElementById(`inline-menu-title-${seatIndex}`);

  if (!content) return;

  const rule = WIZARD_STATE.rules[WIZARD_STATE.currentStep];

  title.innerText = `🛠️ ${WIZARD_STATE.itemName} - Paso ${WIZARD_STATE.currentStep + 1}/${WIZARD_STATE.rules.length}`;

  let html = `
                <div class="p-4">
                  <h4 class="text-yellow-400 font-bold text-lg mb-4">${rule.title}</h4>
                  <div class="grid grid-cols-2 gap-3 mb-6">
                    ${rule.options.map(opt => `
          <button onclick="handleWizardOptionClick(this, '${opt.replace(/'/g, "\\'")}')" class="wizard-opt-btn p-4 bg-gray-800 border-2 border-gray-600 rounded-lg text-left font-bold hover:border-yellow-500 transition">
            ${opt}
          </button>
        `).join('')}
                  </div>
                  <button onclick="nextWizardStepInline()" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-lg shadow-lg">
                    SIGUIENTE ➡️
                  </button>
                </div>
                `;

  content.innerHTML = html;
}

window.handleWizardOptionClick = function (btn, value) {
  console.log('Wizard Option Clicked:', value);
  const rule = WIZARD_STATE.rules[WIZARD_STATE.currentStep];

  if (rule.type === 'single') {
    btn.parentElement.querySelectorAll('.wizard-opt-btn').forEach(b => {
      b.classList.remove('bg-yellow-600', 'text-black', 'selected');
      b.classList.add('bg-gray-800');
    });
    btn.classList.remove('bg-gray-800');
    btn.classList.add('bg-yellow-600', 'text-black', 'selected');

    // Auto-advance after selection
    setTimeout(() => {
      window.nextWizardStepInline();
    }, 300);
  } else {
    if (btn.classList.contains('selected')) {
      btn.classList.remove('bg-yellow-600', 'text-black', 'selected');
      btn.classList.add('bg-gray-800');
    } else {
      const currentSelected = btn.parentElement.querySelectorAll('.selected').length;
      if (rule.max && currentSelected >= rule.max) {
        alert(`Máximo ${rule.max} opciones`);
        return;
      }
      btn.classList.remove('bg-gray-800');
      btn.classList.add('bg-yellow-600', 'text-black', 'selected');

      // Auto-advance if max reached
      if (rule.max && (currentSelected + 1) >= rule.max) {
        setTimeout(() => {
          window.nextWizardStepInline();
        }, 400);
      }
    }
  }
};

window.nextWizardStepInline = function () {
  const seatIndex = window.CURRENT_SEAT;
  const content = document.getElementById(`inline-menu-content-${seatIndex}`);
  const selectedBtns = content.querySelectorAll('.selected');
  const values = Array.from(selectedBtns).map(b => b.innerText);

  const rule = WIZARD_STATE.rules[WIZARD_STATE.currentStep];
  if (values.length === 0 && !(rule.title || '').toLowerCase().includes('extra')) {
    if (!confirm('¿No seleccionar nada?')) return;
  }

  WIZARD_STATE.selections.push(values.join(', '));
  WIZARD_STATE.currentStep++;

  if (WIZARD_STATE.currentStep < WIZARD_STATE.rules.length) {
    renderWizardInline();
  } else {
    // Show Notes Step instead of auto adding
    renderWizardNotes(seatIndex);
  }
};

window.renderWizardNotes = function (seatIndex) {
  const content = document.getElementById(`inline-menu-content-${seatIndex}`);
  const title = document.getElementById(`inline-menu-title-${seatIndex}`);

  title.innerText = `📝 Notas`;

  content.innerHTML = `
                <div class="p-4 animate-fade-in">
                  <h4 class="text-yellow-400 font-bold text-lg mb-4">¿Alguna indicación especial?</h4>
                  <textarea id="wizard-notes-input" class="w-full h-24 p-3 rounded-lg bg-gray-700 border-2 border-gray-600 text-white mb-4 focus:border-yellow-500 outline-none" placeholder="Ej: Sin hielo, Salsa aparte, Bien cocido..."></textarea>

                  <button onclick="finishWizardWithNotes(${seatIndex})" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                    ✅ AGREGAR A COMANDA
                  </button>
                </div>
                `;
};

window.finishWizardWithNotes = function (seatIndex) {
  const notesInput = document.getElementById('wizard-notes-input');
  const notes = notesInput ? notesInput.value.trim() : '';
  let finalItem = `${WIZARD_STATE.itemName}`;

  // Add selections if any
  const specs = WIZARD_STATE.selections.filter(s => s && s.length > 0).join(' + ');
  if (specs) finalItem += ` (${specs})`;

  // Add notes
  if (notes) finalItem += ` 📝 ${notes}`;

  addItemToSeatOrder(finalItem);

  // Close menu
  if (typeof window.closeInlineMenu === 'function') {
    window.closeInlineMenu(seatIndex);
  }
};

window.closeMenuModal = function () { }; // Disable old modal close logic
window.showCategoryItems = showCategoryItems; // Re-export if needed

// Helper for renderMenuByType to be reusable
window.renderMenuByType = function (type) {
  // Use existing renderMenuByType logic if available or reimplement simply here
  const menu = window.db.getMenu();
  const items = type === 'bebida' ? menu.bebidas : menu.alimentos; // Simplified logic, can be improved

  const byCategory = {};
  items.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  let html = '';
  Object.keys(byCategory).forEach(category => {
    html += `
      <div class="mb-6">
        <h3 class="text-yellow-400 font-bold text-lg mb-3 uppercase">${category}</h3>
        <div class="grid grid-cols-2 gap-3">
          ${byCategory[category].map(item => `
            <button 
              onclick="window.selectMenuItem('${item.name}')" 
              class="p-4 bg-gray-800 border-2 ${item.available ? 'border-gray-600 hover:border-yellow-500 hover:bg-gray-700' : 'border-red-500 opacity-50'} rounded-lg font-semibold transition ${!item.available ? 'line-through' : ''}"
              ${!item.available ? 'disabled' : ''}>
              ${item.name}
              ${!item.available ? '<div class="text-xs text-red-500 mt-1">86</div>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  });
  return html;
}




// === GAME TRACKING SYSTEM ===
window.SELECTED_GAME_DATA = null;

function handleReasonChange(selectElement, customerId, customerFavoriteTeam) {
  const reason = selectElement.value;
  const gameFlow = document.getElementById('game-selection-flow');

  if (reason === 'Partido') {
    gameFlow.classList.remove('hidden');
    loadTodaysGames(customerId, customerFavoriteTeam);
  } else {
    gameFlow.classList.add('hidden');
    // Reset hidden fields
    document.getElementById('w-selected-game').value = '';
    document.getElementById('w-watched-team').value = '';
    document.getElementById('w-league').value = '';
  }
}

function loadTodaysGames(customerId, customerFavoriteTeam) {
  const gamesContainer = document.getElementById('games-container');
  const dailyInfo = window.db.getDailyInfo();
  const allGames = dailyInfo.games || [];

  // FILTER FOR TODAY (YYYY-MM-DD)
  const today = new Date().toLocaleDateString('en-CA');
  const games = allGames.filter(g => g.date === today);

  if (games.length === 0) {
    gamesContainer.innerHTML = `
      <div class="text-center text-gray-400 py-4">
        <p class="mb-2">📭 No hay partidos registrados para hoy</p>
        <p class="text-xs">Use el botón de abajo para solicitar registro al gerente</p>
      </div>
    `;
    return;
  }

  // FILTER & SORT GAMES
  // 1. Filter for Favorite Team (if provided) logic is handled during render, but let's sort first.

  games.sort((a, b) => {
    // 1. Time (HH:MM)
    const timeA = a.time || '23:59';
    const timeB = b.time || '23:59';
    if (timeA !== timeB) return timeA.localeCompare(timeB);
    // 2. League
    return (a.league || '').localeCompare(b.league || '');
  });

  let html = '';
  let lastTime = '';

  games.forEach((game, index) => {
    const isFavoriteTeamPlaying = customerFavoriteTeam &&
      (game.homeTeam.toLowerCase().includes(customerFavoriteTeam.toLowerCase()) ||
        game.awayTeam.toLowerCase().includes(customerFavoriteTeam.toLowerCase()));

    // Time Header
    if (game.time !== lastTime) {
      html += `<div class="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4 mb-2 pl-1 border-b border-gray-700 pb-1">⏰ ${game.time}</div>`;
      lastTime = game.time;
    }

    html += `
                <button onclick="handleGameSelection(${index}, '${customerId}', '${customerFavoriteTeam}')"
                  class="w-full p-3 bg-gray-800 border-2 ${isFavoriteTeamPlaying ? 'border-yellow-500 ring-2 ring-yellow-500/50' : 'border-gray-600'} hover:border-blue-400 rounded-lg text-left transition group mb-2">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="font-bold text-white group-hover:text-blue-300 transition text-sm">
                        <span class="text-blue-400 font-normal text-xs">[${game.league}]</span> ${game.awayTeam} vs ${game.homeTeam}
                      </div>
                    </div>
                    ${isFavoriteTeamPlaying ? '<span class="text-xl">⭐</span>' : ''}
                  </div>
                </button>
                `;
  });

  gamesContainer.innerHTML = html;
}

function handleGameSelection(gameIndex, customerId, customerFavoriteTeam) {
  const dailyInfo = window.db.getDailyInfo();
  const game = dailyInfo.games[gameIndex];

  if (!game) return;

  // Store selected game
  window.SELECTED_GAME_DATA = game;
  document.getElementById('w-selected-game').value = `${game.awayTeam} @ ${game.homeTeam}`;
  document.getElementById('w-league').value = game.league;

  // Show game in confirmation
  document.getElementById('selected-game-display').textContent = `${game.awayTeam} @ ${game.homeTeam}`;

  // Check if customer's favorite team is playing
  const isFavoriteTeamPlaying = customerFavoriteTeam &&
    (game.homeTeam.toLowerCase().includes(customerFavoriteTeam.toLowerCase()) ||
      game.awayTeam.toLowerCase().includes(customerFavoriteTeam.toLowerCase()));

  // Hide game list, show favorite team check
  document.getElementById('game-list-section').classList.add('hidden');
  document.getElementById('favorite-team-check').classList.remove('hidden');

  // If favorite team is playing, pre-highlight it
  if (isFavoriteTeamPlaying) {
    showToast(`⭐ ¡Su equipo favorito (${customerFavoriteTeam}) está jugando!`, 'success');
  }
}

function handleFavoriteTeamResponse(isWatchingFavorite, customerId) {
  const favoriteCheck = document.getElementById('favorite-team-check');
  const teamSelection = document.getElementById('team-selection');

  if (isWatchingFavorite) {
    // Show team selection buttons
    const game = window.SELECTED_GAME_DATA;
    const teamButtons = document.getElementById('team-buttons-container');

    teamButtons.innerHTML = `
                <button onclick="selectWatchedTeam('${game.homeTeam}', '${customerId}')"
                  class="p-4 bg-gray-800 border-2 border-gray-600 hover:border-green-400 rounded-lg font-bold transition">
                  🏠 ${game.homeTeam}
                </button>
                <button onclick="selectWatchedTeam('${game.awayTeam}', '${customerId}')"
                  class="p-4 bg-gray-800 border-2 border-gray-600 hover:border-green-400 rounded-lg font-bold transition">
                  ✈️ ${game.awayTeam}
                </button>
                `;

    favoriteCheck.classList.add('hidden');
    teamSelection.classList.remove('hidden');
  } else {
    // Just watching the game, not their favorite team
    document.getElementById('w-watched-team').value = '';
    favoriteCheck.classList.add('hidden');
    showToast('✅ Partido registrado', 'success');
  }
}

function selectWatchedTeam(teamName, customerId) {
  document.getElementById('w-watched-team').value = teamName;
  document.getElementById('team-selection').classList.add('hidden');

  // Update customer's followed teams
  const customer = window.db.getCustomerById(customerId);
  if (customer) {
    if (!customer.followedTeams) customer.followedTeams = [];
    if (!customer.followedTeams.includes(teamName)) {
      customer.followedTeams.push(teamName);
      window.db.updateCustomer(customerId, { followedTeams: customer.followedTeams });
    }
  }

  showToast(`⭐ Registrado: Vino a ver a ${teamName}`, 'success');
}

function requestManagerGameRegistration(visitId, customerId) {
  const manualGame = prompt('📝 Describe el partido que no está en la lista:\n\nEjemplo: Cowboys vs Eagles (NFL)');

  if (!manualGame || !manualGame.trim()) return;

  // Create a pending game registration request
  const request = {
    id: 'req_' + Date.now(),
    visitId: visitId,
    customerId: customerId,
    requestedGame: manualGame.trim(),
    requestedBy: window.CURRENT_USER?.name || 'Mesero',
    timestamp: new Date().toISOString(),
    status: 'pending'
  };

  // Store in pending requests (you can add this to your Store class)
  let pendingRequests = JSON.parse(localStorage.getItem('pendingGameRequests') || '[]');
  pendingRequests.push(request);
  localStorage.setItem('pendingGameRequests', JSON.stringify(pendingRequests));

  showToast('📨 Solicitud enviada al gerente. Puedes continuar con la orden.', 'success');

  // Temporarily store the manual game info
  document.getElementById('w-selected-game').value = manualGame.trim();
  document.getElementById('w-league').value = 'Pendiente';
  document.getElementById('game-list-section').classList.add('hidden');
}

function toggleSportField(select) {
  const sportDiv = document.getElementById('sport-options');
  if (!sportDiv) return; // Safety check

  if (select.value === 'Evento Deportivo') {
    sportDiv.classList.remove('hidden');
  } else {
    sportDiv.classList.add('hidden');
  }
}

// === BÚSQUEDA DE PLATILLOS CON AUTOCOMPLETADO ===
// --- LEGACY SEARCH CODE REMOVED ---

function saveConsumption(visitId) {
  console.log('💾 Saving consumption for visit:', visitId);

  // SAFETY: Check if we're in the waiter view
  const reasonEl = document.getElementById('w-reason');
  const folioEl = document.getElementById('w-folio');
  const amountEl = document.getElementById('w-ticket'); // Also check for amount element

  if (!reasonEl || !folioEl || !amountEl) {
    console.warn('⚠️ Waiter form not found. Skipping consumption save.');
    // If called from Manager, just close the visit without updating consumption
    if (confirm('¿Cerrar esta mesa?')) {
      window.db.closeVisit(visitId);
      if (window.renderManagerDashboard) {
        window.renderManagerDashboard('tables');
      }
    }
    return;
  }

  const amount = amountEl.value;
  const folio = folioEl.value;

  if (!amount) {
    alert('⚠️ Ingresa el total del ticket para cerrar la mesa');
    return;
  }

  if (!folio) {
    if (!confirm('¿Cerrar sin número de folio/cuenta?\n(Recomendado ingresarlo para el reporte)')) {
      return;
    }
  }

  if (!confirm(`¿Cerrar mesa y liberar?\n\nFolio: ${folio || 'Sin folio'}\nTotal: $${amount}`)) {
    return;
  }

  try {
    // Save all remaining data before closing
    const reason = document.getElementById('w-reason').value;
    const team = document.getElementById('w-team').value;
    const league = document.getElementById('w-league').value;

    // LOGIC UPDATE: Get Food/Drink from HOST (Seat 0) primarily
    let entry = '', food = '', drink = '';

    if (window.SEAT_ORDERS && window.SEAT_ORDERS[0]) {
      const host = window.SEAT_ORDERS[0];
      const entryArr = Array.isArray(host.entrada) ? host.entrada : (host.entrada ? [host.entrada] : []);
      const platilloArr = Array.isArray(host.platillo) ? host.platillo : (host.platillo ? [host.platillo] : []);
      const drinkArr = Array.isArray(host.bebida) ? host.bebida : (host.bebida ? [host.bebida] : []);

      entry = entryArr.join(', ');
      food = platilloArr.join(', ');
      drink = drinkArr.join(', ');
    } else {
      // Fallback to hidden inputs
      entry = document.getElementById('w-entry').value;
      food = document.getElementById('w-food').value;
      drink = document.getElementById('w-drink').value;
    }

    const comandero = document.getElementById('w-comandero').value;

    // Update with all final data
    window.db.updateVisitDetails(visitId, {
      reason,
      team,
      league,
      entry,
      food,
      drink,
      comandero,
      folio,
      totalAmount: amount
    });

    // Close the visit
    window.db.closeVisit(visitId, amount);

    alert(`✅ MESA CERRADA EXITOSAMENTE\n\nFolio: ${folio || 'N/A'}\nTotal: $${amount}\n\nDatos de visita guardados en la BD.`);
    navigateTo('waiter-dashboard');
  } catch (error) {
    console.error('Error cerrando mesa:', error);
    alert('Error al cerrar mesa. Revisa consola (F12).');
  }
}

function markProspect(visitId) {
  if (confirm('¿Marcar este cliente como PROSPECTO?\n\n(Se guardará para seguimiento del gerente)')) {
    window.db.markProspect(visitId);
    alert("⭐ Cliente marcado como PROSPECTO.\n\nPuedes continuar atendiendo normalmente.");
  }
}

// === DAILY INFO MODAL FOR WAITERS ===
function openDailyInfoModal() {
  const dailyInfo = window.db.getDailyInfo();
  const activePromos = window.db.getActivePromos();
  const activeDynamic = window.db.getActiveDynamic();

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'daily-info-modal';
  modal.className = 'fixed inset-0 bg-black/90 z-50 overflow-y-auto p-4';
  modal.onclick = (e) => { if (e.target === modal) closeDailyInfoModal(); };

  modal.innerHTML = `
                <div class="max-w-4xl mx-auto mt-8 mb-20">
                  <div class="flex justify-between items-center mb-6">
                    <h2 class="text-3xl font-black text-yellow-400">📢 Información del Día</h2>
                    <button onclick="closeDailyInfoModal()" class="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold">
                      ✕ Cerrar
                    </button>
                  </div>

                  <!--TABS -->
                  <div class="flex gap-2 mb-6 border-b-2 border-gray-700 overflow-x-auto">
                    <button onclick="switchDailyTab('games')" id="dailytab-games" class="daily-tab active px-4 py-3 font-bold whitespace-nowrap">
                      🏈 Partidos (${(dailyInfo.games || []).length})
                    </button>
                    <button onclick="switchDailyTab('promos')" id="dailytab-promos" class="daily-tab px-4 py-3 font-bold whitespace-nowrap">
                      🎁 Promociones (${activePromos.length})
                    </button>
                    <button onclick="switchDailyTab('dynamics')" id="dailytab-dynamics" class="daily-tab px-4 py-3 font-bold whitespace-nowrap">
                      🎯 Dinámicas
                    </button>
                    <button onclick="switchDailyTab('products86')" id="dailytab-products86" class="daily-tab px-4 py-3 font-bold whitespace-nowrap">
                      ⚠️ Productos (${(dailyInfo.products?.outOfStock86 || []).length})
                    </button>
                  </div>

                  <!--TAB CONTENT: GAMES-- >
                  <div id="dailycontent-games" class="daily-tab-content active">
                    <div class="card bg-blue-900/20 border-2 border-blue-500">
                      <h3 class="text-xl font-bold mb-4 text-blue-300">🏈 Partidos de Hoy</h3>
                      ${(dailyInfo.games || []).length === 0 ? '<p class="text-gray-400 italic">Sin partidos programados para hoy.</p>' : `
            <div class="space-y-3">
              ${(dailyInfo.games || []).map(game => `
                <div class="bg-black/50 p-4 rounded-lg border border-blue-400">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="text-sm text-blue-300 font-bold">${game.sport || ''} - ${game.league}</div>
                      <div class="text-xl font-bold text-white mt-1">${game.teams}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-2xl font-black text-yellow-400">${game.time}</div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
                    </div>
                  </div>

                  <!--TAB CONTENT: PROMOS-- >
                  <div id="dailycontent-promos" class="daily-tab-content hidden">
                    <div class="card bg-green-900/20 border-2 border-green-500">
                      <h3 class="text-xl font-bold mb-4 text-green-300">🎁 Promociones Activas</h3>
                      ${activePromos.length === 0 ? '<p class="text-gray-400 italic">Sin promociones activas.</p>' : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${activePromos.map(promo => `
                <div class="bg-black/50 p-4 rounded-lg border border-green-400 hover:bg-black/70 transition">
                  <div class="text-xl font-bold text-yellow-400 mb-2">${promo.title}</div>
                  <div class="text-gray-300">${promo.description}</div>
                </div>
              `).join('')}
            </div>
          `}
                    </div>
                  </div>

                  <!--TAB CONTENT: DYNAMICS-- >
                  <div id="dailycontent-dynamics" class="daily-tab-content hidden">
                    <div class="card bg-purple-900/20 border-2 border-purple-500">
                      <h3 class="text-xl font-bold mb-4 text-purple-300">🎯 Dinámica Activa</h3>
                      ${!activeDynamic ? '<p class="text-gray-400 italic">Sin dinámicas activas hoy.</p>' : `
            <div class="bg-black/50 p-4 rounded-lg border border-purple-400 mb-6">
              <div class="text-2xl font-black text-yellow-400 mb-2">${activeDynamic.title}</div>
              <div class="text-lg text-gray-300 mb-3">${activeDynamic.description}</div>
            </div>
            
            <h4 class="text-lg font-bold mb-3 text-purple-300">🏆 Tabla de Posiciones</h4>
            ${(activeDynamic.scores || []).length === 0 ? '<p class="text-gray-400 italic text-sm">Aún no hay puntuaciones.</p>' : `
              <div class="space-y-2">
                ${activeDynamic.scores.map((entry, idx) => {
    const medals = ['🥇', '🥈', '🥉'];
    const medal = medals[idx] || (idx + 1) + '.';
    const bgColors = ['bg-yellow-600/30', 'bg-gray-500/30', 'bg-orange-600/30'];
    const bgColor = bgColors[idx] || 'bg-gray-800/30';
    return `
                    <div class="${bgColor} p-3 rounded-lg border ${idx === 0 ? 'border-yellow-400' : 'border-gray-600'} flex justify-between items-center">
                      <div class="flex items-center gap-3">
                        <span class="text-2xl">${medal}</span>
                        <div class="font-bold text-lg">${entry.waiterName}</div>
                      </div>
                      <div class="text-3xl font-black text-yellow-400">${entry.score}</div>
                    </div>
                  `;
  }).join('')}
              </div>
            `}
          `}
                    </div>
                  </div>

                  <!--TAB CONTENT: PRODUCTS86-- >
                  <div id="dailycontent-products86" class="daily-tab-content hidden">
                    <div class="card bg-red-900/20 border-2 border-red-500">
                      <h3 class="text-xl font-bold mb-4 text-red-300">⚠️ Productos Agotados (86)</h3>
                      <p class="text-sm text-gray-400 mb-4">NO ofrezcas estos productos a los clientes. Sin stock hoy.</p>
                      ${(dailyInfo.products?.outOfStock86 || []).length === 0 ? '<p class="text-green-400 font-bold">¡Todo disponible hoy! 🎉</p>' : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${(dailyInfo.products?.outOfStock86 || []).map(product => `
                <div class="bg-black/50 p-3 rounded-lg border border-red-400 flex items-center gap-3">
                  <div class="text-3xl">🚫</div>
                  <div>
                    <div class="font-bold text-white">${product.name}</div>
                    <div class="text-xs text-gray-400">${product.category}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
                    </div>
                  </div>
                </div >
                `;

  document.body.appendChild(modal);
}

function closeDailyInfoModal() {
  const modal = document.getElementById('daily-info-modal');
  if (modal) modal.remove();
}

function switchDailyTab(tabName) {
  // Hide all content
  document.querySelectorAll('.daily-tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.daily-tab').forEach(el => el.classList.remove('active'));

  // Show selected
  document.getElementById(`dailycontent - ${tabName} `).classList.remove('hidden');
  document.getElementById(`dailytab - ${tabName} `).classList.add('active');
}


// ------ DIGITAL ORDER INTERFACE (Comandero Digital) ------
let CURRENT_ORDER_CART = [];
let CURRENT_ORDER_VISIT = null;

function renderDigitalOrder(visitId) {
  const visit = window.db.data.visits.find(v => v.id === visitId);
  if (!visit) {
    alert('Mesa no encontrada');
    return navigateTo('waiter');
  }

  CURRENT_ORDER_VISIT = visit;
  CURRENT_ORDER_CART = [];

  const menu = window.db.getMenu();
  const customer = window.db.data.customers.find(c => c.id === visit.customerId);

  const div = document.createElement('div');
  div.className = 'min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 pb-32';

  div.innerHTML = `
                <div class="max-w-4xl mx-auto">
                  <!-- Header -->
                  <div class="flex justify-between items-center mb-4">
                    <button onclick="navigateTo('waiter')" class="text-yellow-400 font-bold flex items-center gap-2">
                      <span>←</span> Volver
                    </button>
                    <div class="text-right">
                      <div class="text-xl font-bold">Mesa ${visit.table}</div>
                      <div class="text-sm text-gray-400">${customer ? customer.firstName + ' ' + customer.lastName : 'Cliente'}</div>
                    </div>
                  </div>

                  <!-- Tabs -->
                  <div class="flex gap-2 mb-6">
                    <button onclick="switchOrderTab('alimentos')" id="order-tab-alimentos" class="flex-1 p-3 bg-yellow-600 rounded-lg font-bold text-black">
                      🍔 Alimentos
                    </button>
                    <button onclick="switchOrderTab('bebidas')" id="order-tab-bebidas" class="flex-1 p-3 bg-gray-700 rounded-lg font-bold">
                      🍺 Bebidas
                    </button>
                  </div>

                  <!-- Content Alimentos -->
                  <div id="order-content-alimentos" class="order-tab-content">
                    ${renderMenuByType('alimentos', menu.alimentos)}
                  </div>

                  <!-- Content Bebidas -->
                  <div id="order-content-bebidas" class="order-tab-content hidden">
                    ${renderMenuByType('bebidas', menu.bebidas)}
                  </div>
                </div>

                <!-- Fixed Cart Footer -->
                <div id="cart-footer" class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t-4 border-yellow-500 p-4 shadow-2xl">
                  <div id="cart-items-display" class="mb-3 max-h-32 overflow-y-auto"></div>
                  <button onclick="submitOrder()" id="submit-order-btn" class="w-full bg-green-600 hover:bg-green-500 p-4 rounded-lg font-bold text-lg disabled:opacity-50" disabled>
                    Enviar Orden (0 items)
                  </button>
                </div>
                `;

  appContainer.innerHTML = '';
  appContainer.appendChild(div);

  updateCartDisplay();
}

function renderMenuByType(type, items) {
  const byCategory = {};
  items.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  let html = '';
  Object.keys(byCategory).forEach(category => {
    html += `
      <div class="mb-6">
        <h3 class="text-yellow-400 font-bold text-lg mb-3 uppercase">${category}</h3>
        <div class="grid grid-cols-2 gap-3">
          ${byCategory[category].map(item => `
            <button 
              onclick="window.addItemToCart('${item.id}')" 
              class="p-4 bg-gray-800 border-2 ${item.available ? 'border-gray-600 hover:border-yellow-500 hover:bg-gray-700' : 'border-red-500 opacity-50'} rounded-lg font-semibold transition ${!item.available ? 'line-through' : ''}"
              ${!item.available ? 'disabled' : ''}>
              ${item.name}
              ${!item.available ? '<div class="text-xs text-red-500 mt-1">86</div>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  });

  return html || '<p class="text-gray-400 text-center py-8">No hay items disponibles</p>';
}

function switchOrderTab(tab) {
  document.getElementById('order-tab-alimentos').className = tab === 'alimentos'
    ? 'flex-1 p-3 bg-yellow-600 rounded-lg font-bold text-black'
    : 'flex-1 p-3 bg-gray-700 rounded-lg font-bold';
  document.getElementById('order-tab-bebidas').className = tab === 'bebidas'
    ? 'flex-1 p-3 bg-yellow-600 rounded-lg font-bold text-black'
    : 'flex-1 p-3 bg-gray-700 rounded-lg font-bold';
  document.getElementById('order-content-alimentos').className = tab === 'alimentos'
    ? 'order-tab-content'
    : 'order-tab-content hidden';
  document.getElementById('order-content-bebidas').className = tab === 'bebidas'
    ? 'order-tab-content'
    : 'order-tab-content hidden';
}

function addItemToCart(itemId) {
  const menu = window.db.getMenu();
  const item = [...menu.alimentos, ...menu.bebidas].find(i => i.id === itemId);

  if (!item || !item.available) return;

  const existingIndex = CURRENT_ORDER_CART.findIndex(i => i.itemId === itemId && !i.observations);

  if (existingIndex >= 0) {
    CURRENT_ORDER_CART[existingIndex].quantity += 1;
  } else {
    CURRENT_ORDER_CART.push({
      itemId: item.id,
      name: item.name,
      category: item.category,
      quantity: 1,
      observations: ''
    });
  }

  updateCartDisplay();
}

function updateCartDisplay() {
  const cartDisplay = document.getElementById('cart-items-display');
  const submitBtn = document.getElementById('submit-order-btn');

  if (CURRENT_ORDER_CART.length === 0) {
    cartDisplay.innerHTML = '<p class="text-gray-400 text-sm text-center">Carrito vacío</p>';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviar Orden (0 items)';
    return;
  }

  const totalItems = CURRENT_ORDER_CART.reduce((sum, item) => sum + item.quantity, 0);

  cartDisplay.innerHTML = CURRENT_ORDER_CART.map((item, index) => `
                <div class="flex justify-between items-center bg-gray-700 p-2 rounded mb-2">
                  <div class="flex-1">
                    <span class="font-bold">${item.quantity}x</span> ${item.name}
                    ${item.observations ? `<div class="text-xs text-yellow-300">Obs: ${item.observations}</div>` : ''}
                  </div>
                  <div class="flex gap-2">
                    <button onclick="removeFromCart(${index})" class="bg-red-600 px-2 py-1 rounded text-xs">✕</button>
                  </div>
                </div>
                `).join('');

  submitBtn.disabled = false;
  submitBtn.textContent = `Enviar Orden (${totalItems} items)`;
}

function removeFromCart(index) {
  CURRENT_ORDER_CART.splice(index, 1);
  updateCartDisplay();
}

function submitOrder() {
  if (CURRENT_ORDER_CART.length === 0) return;

  const orderData = {
    visitId: CURRENT_ORDER_VISIT.id,
    items: CURRENT_ORDER_CART
  };

  window.db.createOrder(orderData);

  alert(`✅ Orden enviada con éxito!\n${CURRENT_ORDER_CART.length} items agregados a Mesa ${CURRENT_ORDER_VISIT.table}`);
  // Reset Cart
  CURRENT_ORDER_CART = [];
  // Refresh view
  if (typeof navigateTo === 'function') {
    navigateTo('waiter-detail', { visitId: CURRENT_ORDER_VISIT.id });
  }
}

// ------ MANAGER DASHBOARD (TABBED UI - v9.6) ------

window.renderManagerDashboard = function (activeTab = 'tables') {
  appContainer.innerHTML = '';
  console.log('Rendering Manager Dashboard, Tab:', activeTab);
  const branchId = STATE.branch?.id;
  if (!branchId) { alert('Selecciona sucursal'); renderLogin(); return; }

  // Get active visits for badge count
  // Get active visits for badge count
  const activeVisits = window.db.getActiveVisitsByBranch(branchId);
  window.CURRENT_MANAGER_TAB = activeTab;

  // RENDER UI FIRST to prevent black screen
  const div = document.createElement('div');
  div.className = 'bg-gray-900 min-h-screen pb-24'; // Padding for bottom nav

  // AUTO-REPAIR: DISABLED - Was causing Firebase errors with undefined values
  // TODO: Re-enable after proper Firebase integration (Phase 1)
  /*
  if (window.dbFirestore && window.FB) {
    const { doc, getDoc, setDoc } = window.FB;
    const gamesRef = doc(window.dbFirestore, 'config', 'allGames');
    getDoc(gamesRef).then(snap => {
      if (!snap.exists()) {
        const info = window.db.getDailyInfo();
        setDoc(gamesRef, JSON.parse(JSON.stringify(info)))
          .then(() => console.log("✅ REPAIR SUCCESS: config/allGames created!"))
          .catch(e => console.error("❌ REPAIR FAILED:", e));
      } else {
        console.log("✅ Config Check: config/allGames valid.");
      }
    });
  }
  */

  // HEADER FIXED
  div.innerHTML = `
                <header class="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg safe-area-pt">
                  <div>
                    <h1 class="text-xl font-black text-yellow-500 tracking-tighter flex items-center gap-1">
                      GERENTE <span class="text-white text-xs bg-gray-700 px-1 rounded ml-1">v22.20</span>
                    </h1>
                    <p class="text-[10px] text-gray-400 font-mono">${STATE.branch.name} • ${STATE.user.name}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button onclick="window.db._syncLocalReservationsToFirebase(); alert('☁️ Intentando subir reservaciones... revisa la consola.');" class="text-xs bg-blue-900/80 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-700 transition-colors uppercase font-bold flex items-center gap-1 mr-2">
                      ☁️ Forzar Sync
                    </button>
                    <button onclick="renderManagerDashboard(window.CURRENT_MANAGER_TAB || 'tables')" class="text-xs bg-gray-700 hover:bg-yellow-600 hover:text-black text-yellow-500 px-3 py-1 rounded border border-yellow-600/50 transition-colors uppercase font-bold flex items-center gap-1">
                      🔄 Actualizar
                    </button>
                    <div class="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-800 font-mono">
                      ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </header>

                <main id="manager-content" class="p-3 animate-fade-in"></main>

                <!-- BOTTOM NAVIGATION - GERENTE -->
                <nav class="bottom-nav">
                  <button onclick="renderManagerDashboard('tables')" id="managertab-tables" class="bottom-nav-item ${activeTab === 'tables' ? 'active' : ''}" style="position: relative; min-width: 60px;">
                    <span class="bottom-nav-icon">🍽️</span>
                    <span class="bottom-nav-label">Mesas</span>
                    ${activeTab === 'tables' ? '<span class="bottom-nav-badge">' + activeVisits.length + '</span>' : ''}
                  </button>
                  <button onclick="renderManagerDashboard('games')" id="managertab-games" class="bottom-nav-item ${activeTab === 'games' ? 'active' : ''}" style="position: relative;">
                    <span class="bottom-nav-icon">📺</span>
                    <span class="bottom-nav-label">Partidos</span>
                    ${(window.db.getDailyInfo().gameRequests || []).length > 0 ? '<span class="bottom-nav-badge">' + (window.db.getDailyInfo().gameRequests || []).length + '</span>' : ''}
                  </button>

                  <!-- NEW: Reservations Tab -->
                  <button onclick="renderManagerDashboard('reservations')" id="managertab-reservations" class="bottom-nav-item ${activeTab === 'reservations' ? 'active' : ''}" style="position: relative;">
                    <span class="bottom-nav-icon">🎟️</span>
                    <span class="bottom-nav-label">Reservas</span>
                  </button>

                  <button onclick="renderManagerDashboard('reports')" id="managertab-reports" class="bottom-nav-item ${activeTab === 'reports' ? 'active' : ''}" style="position: relative;">
                    <span class="bottom-nav-icon">📊</span>
                    <span class="bottom-nav-label">Reportes</span>
                  </button>
                  <button onclick="handleLogout()" class="bottom-nav-item" style="position: relative;">
                    <span class="bottom-nav-icon">🚪</span>
                    <span class="bottom-nav-label">Salir</span>
                  </button>
                </nav>
                `;

  document.getElementById('app').innerHTML = '';
  document.getElementById('app').appendChild(div);

  // RENDER TAB CONTENT
  const content = div.querySelector('#manager-content');

  if (activeTab === 'tables') renderManagerTablesTab(content);
  else if (activeTab === 'games') renderManagerGamesTab(content);
  else if (activeTab === 'reservations') renderManagerReservationsTab(content); // NEW TAB
  else if (activeTab === 'reports') renderManagerReportsTab(content);
};

// NEW: Render Reservations

// --- MANAGER TABS IMPLEMENTATION ---

function renderManagerGameRequests(container) {
  const requests = window.db.getDailyInfo().gameRequests || [];
  if (requests.length === 0) return;

  const div = document.createElement('div');
  div.innerHTML = `
                <div class="card mb-4 bg-orange-900/20 border border-orange-500/50 shadow-lg animate-pulse-slow">
                  <div class="flex justify-between items-center mb-3">
                    <h2 class="text-lg font-bold text-orange-400 flex items-center gap-2">🔔 Solicitudes Hostess (<span class="text-white">${requests.length}</span>)</h2>
                  </div>
                  <div class="space-y-2">
                    ${requests.map(r => `
               <div class="bg-black/40 p-3 rounded border border-orange-500/30 flex flex-col gap-2">
                   <div class="flex items-center gap-3">
                       <span class="text-2xl">🙋‍♀️</span>
                       <div>
                           <div class="font-bold text-white text-base leading-tight">"${r.name}"</div>
                           <div class="text-[10px] text-gray-400">Solicitado: ${new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                       </div>
                   </div>
                   <div class="grid grid-cols-2 gap-2 mt-1">
                       <button onclick="window.approveGameRequest('${r.id}', '${r.name}')" class="bg-green-600 text-white p-2 rounded font-bold text-[10px] hover:bg-green-500 shadow border-b-2 border-green-800 active:border-b-0 active:translate-y-1 transition-all">✅ APROBAR</button>
                       <button onclick="window.db.removeGameRequest('${r.id}'); renderManagerDashboard('games');" class="bg-red-900/50 text-red-300 p-2 rounded font-bold text-[10px] border border-red-800 hover:bg-red-900">❌ RECHAZAR</button>
                   </div>
               </div>
            `).join('')}
                  </div>
                </div>
                `;
  container.appendChild(div);

  // NEW: Render requests if container exists (Dynamic Injection)
  const reqContainer = div.querySelector('#manager-requests-container');
  if (reqContainer) {
    renderManagerGameRequests(reqContainer);
  }
}

function renderManagerTablesTab(container) {
  const branchId = STATE.branch?.id;
  console.log(`🍽️ MANAGER: Rendering Tables for BranchID: "${branchId}"`);
  // Sort by table number if possible, or naturally
  const activeVisits = window.db.getActiveVisitsByBranch(branchId)
    .sort((a, b) => {
      const tA = a.table.toString();
      const tB = b.table.toString();
      return tA.localeCompare(tB, undefined, { numeric: true, sensitivity: 'base' });
    });

  const prospects = window.db.getProspects();

  // Summary Chips
  const totalPax = activeVisits.reduce((sum, v) => sum + parseInt(v.pax || 0), 0);
  const prospectCount = prospects.length;

  const summaryDiv = document.createElement('div');
  summaryDiv.innerHTML = `
                <div class="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                  <div class="bg-gray-800 px-4 py-2 rounded-full border border-gray-700 whitespace-nowrap">
                    <span class="text-gray-400 text-xs uppercase font-bold">Total Mesas</span>
                    <span class="text-white font-bold ml-1">${activeVisits.length}</span>
                  </div>
                  <div class="bg-gray-800 px-4 py-2 rounded-full border border-gray-700 whitespace-nowrap">
                    <span class="text-gray-400 text-xs uppercase font-bold">Comensales</span>
                    <span class="text-white font-bold ml-1">${totalPax}</span>
                  </div>
                  <div class="bg-gray-800 px-4 py-2 rounded-full border border-gray-700 whitespace-nowrap">
                    <span class="text-purple-400 text-xs uppercase font-bold">Prospectos</span>
                    <span class="text-white font-bold ml-1">${prospectCount}</span>
                  </div>
                </div>
                `;
  container.appendChild(summaryDiv);

  // WAITER FILTER
  const waiters = window.db.data.users.filter(u => u.role === 'waiter' && u.branchId === branchId);
  const filterDiv = document.createElement('div');
  filterDiv.className = 'mb-4';
  filterDiv.innerHTML = `
                <div class="bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <label class="text-gray-400 text-xs uppercase font-bold block mb-2">🔍 Filtrar por Mesero</label>
                  <select id="waiter-filter" onchange="window.filterManagerTables(this.value)"
                    class="w-full bg-gray-900 text-white border border-gray-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="all">👥 Todos los Meseros (${activeVisits.length} mesas)</option>
                    ${waiters.map(w => {
    const waiterTables = activeVisits.filter(v => v.waiterId === w.id).length;
    return `<option value="${w.id}">${w.name} (${waiterTables} mesas)</option>`;
  }).join('')}
                  </select>
                </div>
                `;
  container.appendChild(filterDiv);

  if (activeVisits.length === 0) {
    container.innerHTML += '<div class="text-center text-gray-500 py-20 flex flex-col items-center gap-4"><span class="text-6xl grayscale opacity-50">🍽️</span><p>No hay mesas activas</p></div>';
    return;
  }

  const gridDiv = document.createElement('div');
  gridDiv.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3";

  gridDiv.innerHTML = activeVisits.map(v => {
    // Is Prospect? Check if visitId is in prospects list OR customer is new
    const isProspect = prospects.find(p => p.customerId === v.customerId); // Logic: prospect record exists
    const customer = v.customer; // Customer is already included in the visit object
    const waiter = window.db.data.users.find(u => u.id === v.waiterId);

    // Time
    const startTime = new Date(v.date);
    const diffMins = Math.floor((new Date() - startTime) / 60000);
    const timeElapsed = diffMins > 60 ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m` : `${diffMins}m`;

    // DEBUG: Log visit data to see what fields are available
    console.log('Visit data for table', v.table, ':', {
      reason: v.reason,
      selectedGame: v.selectedGame,
      isFavoriteTeamMatch: v.isFavoriteTeamMatch
    });

    // Prepare visit reason display
    let reasonDisplay = '';
    if (v.reason) {
      if (v.reason === 'Partido' || v.selectedGame) { // Trust selectedGame even if reason isn't explicitly 'Partido' yet
        let sportIcon = '📺';
        // Try to find more info, but don't block display if not found
        if (v.selectedGame) {
          const game = window.db.getMatches().find(m => (m.match || (m.homeTeam + ' vs ' + m.awayTeam)) === v.selectedGame);
          if (game && game.league) sportIcon = window.getSportIcon(game.league);
        }

        reasonDisplay = `
                <div class="mt-3 bg-white/5 p-3 rounded-lg border border-white/10">
                  <div class="flex items-start gap-2">
                    <div class="flex items-center gap-1">
                      ${(() => {
            if (!v.selectedGame) return `<div class="text-2xl">${sportIcon}</div>`;
            const game = window.db.getMatches().find(m => (m.match || (m.homeTeam + ' vs ' + m.awayTeam)) === v.selectedGame);
            if (game) {
              const l1 = window.getTeamLogo(game.homeTeam);
              const l2 = window.getTeamLogo(game.awayTeam);
              if (l1 || l2) {
                return `
                                    <img src="${l1 || ''}" class="w-6 h-6 object-contain ${!l1 ? 'hidden' : ''}" style="max-width: 24px;">
                                    <span class="text-[10px] text-gray-500">vs</span>
                                    <img src="${l2 || ''}" class="w-6 h-6 object-contain ${!l2 ? 'hidden' : ''}" style="max-width: 24px;">
                                 `;
              }
            }
            return `<div class="text-2xl filter drop-shadow-md">${sportIcon}</div>`;
          })()}
                    </div>
                    <div class="flex-1">
                      <div class="text-[10px] text-green-400 font-bold uppercase tracking-widest">PARTIDO</div>
                      <div class="text-sm font-black text-white leading-tight mt-0.5">
                        ${v.selectedGame || 'Seleccionar Partido...'}
                      </div>
                      ${v.isFavoriteTeamMatch ? '<div class="mt-1 inline-block bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow animate-pulse">🌟 EQUIPO FAVORITO</div>' : ''}
                    </div>
                  </div>
                </div>
                `;
      } else {
        const emoji = v.reason === 'Cumpleaños' ? '🎂' : (v.reason === 'Negocios' ? '💼' : '🍽️');
        reasonDisplay = `
                <div class="mt-3 bg-white/5 p-3 rounded-lg border border-white/10">
                  <div class="text-sm font-bold text-white">${emoji} ${v.reason.toUpperCase()}</div>
                </div>
                `;
      }
    }

    return `
                <div class="bg-gray-800 rounded-xl overflow-hidden shadow-lg border-l-4 ${isProspect ? 'border-purple-500' : 'border-green-500'} relative group" data-waiter-id="${v.waiterId}">
                  <div class="p-4">
                    <div class="flex justify-between items-start">
                      <div>
                        <div class="flex items-center gap-2">
                          <h3 class="text-3xl font-black text-white leading-none">Mesa ${v.table}</h3>
                          ${isProspect ? '<span class="text-lg animate-pulse" title="Cliente Prospecto">⭐</span>' : ''}
                        </div>
                        <div class="flex items-center gap-2">
                          <div class="text-gray-300 font-bold text-lg truncate">${customer ? customer.firstName + ' ' + customer.lastName : 'Cliente'}</div>
                          <button onclick="event.stopPropagation(); navigateTo('enrich-customer', {customerId: '${v.customerId}', visitId: '${v.id}'})"
                            class="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition shadow"
                            title="Editar información del cliente">
                            📝 Editar
                          </button>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-xs font-mono text-gray-400 bg-black/30 px-2 py-1 rounded inline-block">⏱ ${timeElapsed}</div>
                        <div class="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">${waiter?.name || 'S/A'}</div>
                      </div>
                    </div>

                    <!-- VISIT DETAILS -->
                    ${reasonDisplay}

                    <!-- ACTION BUTTON -->
                    <div class="mt-4">
                      <button onclick="navigateTo('waiter-detail', {visitId: '${v.id}'})"
                        class="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1">
                        <span class="text-2xl">🍽️</span>
                        <span>VER MESA / COMANDAR</span>
                      </button>
                    </div>
                  </div>
                </div>
                `;
  }).join('');

  container.appendChild(gridDiv);
}

// Filter tables by waiter
window.filterManagerTables = function (waiterId) {
  const allCards = document.querySelectorAll('[data-waiter-id]');

  allCards.forEach(card => {
    if (waiterId === 'all') {
      card.style.display = '';
    } else {
      if (card.getAttribute('data-waiter-id') === waiterId) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    }
  });
};

// --- LOGO DATABASE ---
window.TEAM_LOGOS = {
  // LIGA MX
  "Club América": "https://a.espncdn.com/i/teamlogos/soccer/500/227.png",
  "America": "https://a.espncdn.com/i/teamlogos/soccer/500/227.png",
  "Chivas Guadalajara": "https://a.espncdn.com/i/teamlogos/soccer/500/232.png",
  "Chivas": "https://a.espncdn.com/i/teamlogos/soccer/500/232.png",
  "Cruz Azul": "https://a.espncdn.com/i/teamlogos/soccer/500/229.png",
  "Pumas UNAM": "https://a.espncdn.com/i/teamlogos/soccer/500/231.png",
  "Pumas": "https://a.espncdn.com/i/teamlogos/soccer/500/231.png",
  "Tigres UANL": "https://a.espncdn.com/i/teamlogos/soccer/500/226.png",
  "Tigres": "https://a.espncdn.com/i/teamlogos/soccer/500/226.png",
  "Rayados Monterrey": "https://a.espncdn.com/i/teamlogos/soccer/500/228.png",
  "Monterrey": "https://a.espncdn.com/i/teamlogos/soccer/500/228.png",
  "Toluca": "https://a.espncdn.com/i/teamlogos/soccer/500/236.png",
  "Santos Laguna": "https://a.espncdn.com/i/teamlogos/soccer/500/234.png",
  "Santos": "https://a.espncdn.com/i/teamlogos/soccer/500/234.png",
  "Pachuca": "https://a.espncdn.com/i/teamlogos/soccer/500/230.png",
  "León": "https://a.espncdn.com/i/teamlogos/soccer/500/238.png",
  "Leon": "https://a.espncdn.com/i/teamlogos/soccer/500/238.png",
  "Atlas": "https://a.espncdn.com/i/teamlogos/soccer/500/224.png",
  "Querétaro": "https://a.espncdn.com/i/teamlogos/soccer/500/10951.png",
  "Queretaro": "https://a.espncdn.com/i/teamlogos/soccer/500/10951.png",
  "Puebla": "https://a.espncdn.com/i/teamlogos/soccer/500/237.png",
  "Atlético San Luis": "https://a.espncdn.com/i/teamlogos/soccer/500/18848.png",
  "San Luis": "https://a.espncdn.com/i/teamlogos/soccer/500/18848.png",
  "Mazatlán FC": "https://a.espncdn.com/i/teamlogos/soccer/500/20658.png",
  "Mazatlan": "https://a.espncdn.com/i/teamlogos/soccer/500/20658.png",
  "Necaxa": "https://a.espncdn.com/i/teamlogos/soccer/500/225.png",
  "Xolos Tijuana": "https://a.espncdn.com/i/teamlogos/soccer/500/10938.png",
  "Tijuana": "https://a.espncdn.com/i/teamlogos/soccer/500/10938.png",
  "Juárez Bravos": "https://a.espncdn.com/i/teamlogos/soccer/500/17926.png",
  "Juarez": "https://a.espncdn.com/i/teamlogos/soccer/500/17926.png",

  // LOCALES QUERÉTARO (LMB/LFA)
  "Conspiradores": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Conspiradores_de_Quer%C3%A9taro_logo.svg/1200px-Conspiradores_de_Quer%C3%A9taro_logo.svg.png",
  "Gallos Negros": "https://upload.wikimedia.org/wikipedia/commons/e/e6/LFA_Gallos_Negros_Logo_2022.png",

  // ESPAÑA
  "Real Madrid": "https://a.espncdn.com/i/teamlogos/soccer/500/86.png",
  "FC Barcelona": "https://a.espncdn.com/i/teamlogos/soccer/500/83.png",
  "Barcelona": "https://a.espncdn.com/i/teamlogos/soccer/500/83.png",
  "Atlético Madrid": "https://a.espncdn.com/i/teamlogos/soccer/500/1068.png",
  "Atleti": "https://a.espncdn.com/i/teamlogos/soccer/500/1068.png",

  // INGLATERRA
  "Manchester City": "https://a.espncdn.com/i/teamlogos/soccer/500/382.png",
  "Man City": "https://a.espncdn.com/i/teamlogos/soccer/500/382.png",
  "Liverpool": "https://a.espncdn.com/i/teamlogos/soccer/500/364.png",
  "Arsenal": "https://a.espncdn.com/i/teamlogos/soccer/500/359.png",
  "Manchester United": "https://a.espncdn.com/i/teamlogos/soccer/500/360.png",
  "Man Utd": "https://a.espncdn.com/i/teamlogos/soccer/500/360.png",

  // NFL
  "Kansas City Chiefs": "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
  "San Francisco 49ers": "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png",
  "SF 49ers": "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png",
  "Dallas Cowboys": "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
  "Cowboys": "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
  "Pittsburgh Steelers": "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png",
  "Steelers": "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png",
  "New England Patriots": "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png",
  "Patriots": "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png",

  // NBA
  "Los Angeles Lakers": "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
  "Lakers": "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
  "Golden State Warriors": "https://a.espncdn.com/i/teamlogos/nba/500/gs.png",
  "Warriors": "https://a.espncdn.com/i/teamlogos/nba/500/gs.png",
  "Boston Celtics": "https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
  "Celtics": "https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
  "Chicago Bulls": "https://a.espncdn.com/i/teamlogos/nba/500/chi.png",
  "Bulls": "https://a.espncdn.com/i/teamlogos/nba/500/chi.png",
  "Miami Heat": "https://a.espncdn.com/i/teamlogos/nba/500/mia.png",

  // MLB
  "New York Yankees": "https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png",
  "Yankees": "https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png",
  "Los Angeles Dodgers": "https://a.espncdn.com/i/teamlogos/mlb/500/lad.png",
  "Dodgers": "https://a.espncdn.com/i/teamlogos/mlb/500/lad.png",
  "Boston Red Sox": "https://a.espncdn.com/i/teamlogos/mlb/500/bos.png",
  "Red Sox": "https://a.espncdn.com/i/teamlogos/mlb/500/bos.png"
};

window.getTeamLogo = function (teamName) {
  if (!teamName) return null;
  const lower = teamName.toLowerCase().trim();

  // 1. Direct or Case Insensitive Match
  const foundKey = Object.keys(window.TEAM_LOGOS).find(k => k.toLowerCase() === lower);
  if (foundKey) return window.TEAM_LOGOS[foundKey];

  // 2. Partial Match Strategy (Manual Overrides for common aliases)
  if (lower.includes('america') && lower.includes('club')) return window.TEAM_LOGOS["Club América"];
  if (lower === 'america') return window.TEAM_LOGOS["Club América"];
  if (lower.includes('guadalajara') || lower === 'chivas') return window.TEAM_LOGOS["Chivas Guadalajara"];
  if (lower.includes('cruz azul') || lower === 'cruzazul') return window.TEAM_LOGOS["Cruz Azul"];
  if (lower.includes('pumas') || lower === 'unam') return window.TEAM_LOGOS["Pumas UNAM"];
  if (lower.includes('tigres')) return window.TEAM_LOGOS["Tigres UANL"];
  if (lower.includes('monterrey') || lower === 'rayados') return window.TEAM_LOGOS["Rayados Monterrey"];
  if (lower.includes('santos')) return window.TEAM_LOGOS["Santos Laguna"];
  if (lower.includes('leon')) return window.TEAM_LOGOS["León"];
  if (lower.includes('pachuca')) return window.TEAM_LOGOS["Pachuca"];
  if (lower.includes('toluca')) return window.TEAM_LOGOS["Toluca"];
  if (lower.includes('atlas')) return window.TEAM_LOGOS["Atlas"];
  if (lower.includes('queretaro') || lower.includes('gallos')) return window.TEAM_LOGOS["Querétaro"];
  if (lower.includes('necaxa')) return window.TEAM_LOGOS["Necaxa"];
  if (lower.includes('mazatlan')) return window.TEAM_LOGOS["Mazatlán FC"];
  if (lower.includes('tijuana') || lower.includes('xolos')) return window.TEAM_LOGOS["Xolos Tijuana"];
  if (lower.includes('juarez') || lower.includes('bravos')) return window.TEAM_LOGOS["Juárez Bravos"];
  if (lower.includes('san luis')) return window.TEAM_LOGOS["Atlético San Luis"];
  if (lower.includes('puebla')) return window.TEAM_LOGOS["Puebla"];

  return null;
};


// --- MANAGER TABS IMPLEMENTATION ---

function renderManagerGamesTab(container) {
  const games = window.db.getMatches();
  // CRITICAL: Use Local Date to match Ingestor
  const today = new Date().toLocaleDateString('en-CA');

  console.log(`Render Games Tab. Today (Local): ${today}. Total Games in DB: ${games.length}`);

  // Sort games chronologically
  games.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  // Filter games
  const todaysGames = games.filter(g => g.date === today);
  const futureGames = games.filter(g => g.date > today);

  // DEBUG: If no games found, show alert in console
  if (games.length > 0 && todaysGames.length === 0) {
    console.warn("⚠️ Games exist but none match today's date:", today);
    console.log("Sample Game Date:", games[0].date);
    console.log("All Game Dates:", games.map(g => `${g.league}: ${g.date}`));
  }

  console.log(`📊 Today's Games: ${todaysGames.length}, Future: ${futureGames.length}`);

  // CRITICAL FIX: Clear duplicate content before rendering
  container.innerHTML = '';

  const div = document.createElement('div');
  div.innerHTML = `
                <!-- MAIN CONTAINER -->
                <div class="space-y-6 mb-24">

                  <!-- QUICK ACTIONS BAR -->
                  <div class="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-4 rounded-xl border border-blue-500/30 flex justify-between items-center">
                    <div>
                      <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        ⚡ Gestión Rápida
                      </h3>
                      <p class="text-[10px] text-blue-300">Programación manual de eventos deportivos</p>
                    </div>
                    <div class="flex gap-2">
                      <button onclick="if(confirm('¿Eliminar TODOS los partidos de hoy?')) { 
                    window.db.clearTodayGames(); 
                    renderManagerDashboard('games'); 
                    window.showToast('🗑️ Partidos eliminados', 'info');
                }" class="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 transition">
                        🗑️ Limpiar Hoy
                      </button>
                    </div>
                  </div>

                  <!-- 1. SOLICITUDES HOSTESS -->
                  ${(window.db.getDailyInfo().gameRequests || []).length > 0 ? '<div id="manager-requests-container"></div>' : ''}

                  <!-- 2. PROGRAMAR EVENTOS (INDEPENDIENTE) -->
                  <div class="card bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-2 border-purple-500/50 shadow-2xl">
                    <div class="flex justify-between items-center mb-4">
                      <div>
                        <h2 class="text-xl font-black text-white flex items-center gap-2">
                          ➕ PROGRAMAR EVENTOS
                        </h2>
                        <p class="text-xs text-purple-300">Agrega partidos para cualquier fecha (hoy, mañana, futuro)</p>
                      </div>
                      <button onclick="const form = document.getElementById('inline-add-game-form'); form.classList.toggle('hidden'); if(!form.classList.contains('hidden')) form.scrollIntoView({behavior: 'smooth', block: 'center'});"
                        class="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition">
                        <span>+</span> NUEVO EVENTO
                      </button>
                    </div>

                    <!-- INLINE ADD GAME FORM (Desplegable) -->
                    <div id="inline-add-game-form" class="hidden bg-gray-800/80 p-4 rounded-xl border border-purple-500/30 mb-6 shadow-inner animate-fade-in-down">
                      <h3 class="text-sm font-bold text-purple-300 uppercase mb-3 border-b border-purple-500/20 pb-1">Programación Manual</h3>

                      <!-- FECHA PRIMERO - MUY VISIBLE -->
                      <div class="bg-blue-900/30 border-2 border-blue-500 rounded-lg p-3 mb-4">
                        <label class="text-xs uppercase font-black text-blue-300 block mb-2">📅 FECHA DEL EVENTO</label>
                        <input type="date" id="new-date" class="w-full bg-black text-white rounded-lg p-3 text-base font-bold border-2 border-blue-400 focus:border-blue-300" value="${today}">
                      </div>

                      <!-- Resto de campos -->
                      <div class="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label class="text-[10px] uppercase font-bold text-gray-400">Liga / Deporte</label>
                          <select id="new-league" class="w-full bg-black text-white rounded p-2 text-sm border border-gray-600">
                            <option value="LIGA MX">🇲🇽 LIGA MX</option>
                            <option value="LIGA INGLESA">🇬🇧 PREMIER</option>
                            <option value="LIGA ESPAÑOLA">🇪🇸 LA LIGA</option>
                            <option value="CHAMPIONS">⭐ CHAMPIONS</option>
                            <option value="NFL">🏈 NFL</option>
                            <option value="NBA">🏀 NBA</option>
                            <option value="MLB">⚾ MLB</option>
                            <option value="UFC">🥊 UFC</option>
                            <option value="F1">🏎️ F1</option>
                            <option value="Tenis">🎾 TENIS</option>
                            <option value="Boxeo">🥊 BOXEO</option>
                          </select>
                        </div>
                        <div>
                          <label class="text-[10px] uppercase font-bold text-gray-400">Hora</label>
                          <input type="time" id="new-time" class="w-full bg-black text-white rounded p-2 text-sm border border-gray-600" value="19:00">
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <input list="team-suggestions" id="new-home" placeholder="Equipo Local" class="w-full bg-black text-white rounded p-2 text-sm border border-gray-600 focus:border-blue-500">
                        </div>
                        <div>
                          <input list="team-suggestions" id="new-away" placeholder="Equipo Visitante" class="w-full bg-black text-white rounded p-2 text-sm border border-gray-600 focus:border-blue-500">
                        </div>
                      </div>

                      <div class="flex justify-end gap-2">
                        <button onclick="document.getElementById('inline-add-game-form').classList.add('hidden')" class="px-3 py-2 text-gray-400 hover:text-white text-xs font-bold">CANCELAR</button>
                        <button onclick="window.addGameFromManager()" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition">
                          💾 GUARDAR
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- 3. PARTIDOS DE HOY (LIVE CONTROL) -->
                  <div class="card bg-gray-900 border-2 border-blue-600 shadow-2xl relative">
                    <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                      <div>
                        <h2 class="text-xl font-black text-white flex items-center gap-2">
                          <span class="text-red-500 animate-pulse">●</span> EN VIVO / HOY <span class="text-[10px] text-gray-500 ml-2">(${today})</span>
                        </h2>
                      </div>
                    </div>

                    <!-- Datalist Injection -->
                    <datalist id="team-suggestions">
                      ${window.KNOWN_TEAMS.map(t => `<option value="${t}">`).join('')}
                    </datalist>

                    ${todaysGames.length === 0
      ? '<div class="text-center py-8 opacity-50"><p class="text-sm">Sin partidos.</p></div>'
      : `<div class="grid grid-cols-1 gap-4">
                    ${todaysGames.map(g => renderGameControlCard(g)).join('')}
                   </div>`
    }
                  </div>

                  <!-- 3. PRÓXIMOS EVENTOS (Agrupados por Mes) -->
                  <div class="card bg-gray-800/50 border border-gray-700">
                    <h3 class="text-lg font-bold text-gray-400 mb-4 uppercase tracking-wider">📅 Próximos Eventos</h3>
                    ${futureGames.length === 0
      ? '<p class="text-gray-500 text-sm">No hay partidos a futuro.</p>'
      : (() => {
        // 1. GROUP BY MONTH
        const groupedByMonth = {};
        futureGames.forEach(g => {
          const dateObj = new Date(g.date + 'T12:00:00');
          const monthKey = dateObj.toLocaleString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase();
          if (!groupedByMonth[monthKey]) groupedByMonth[monthKey] = [];
          groupedByMonth[monthKey].push(g);
        });

        return Object.keys(groupedByMonth).map(month => {
          const gamesInMonth = groupedByMonth[month];

          // 2. GROUP BY LEAGUE (Nested)
          const groupedByLeague = {};
          gamesInMonth.forEach(g => {
            const leagueKey = g.league || 'OTROS';
            if (!groupedByLeague[leagueKey]) groupedByLeague[leagueKey] = [];
            groupedByLeague[leagueKey].push(g);
          });

          // Render Leagues
          const leaguesHtml = Object.keys(groupedByLeague).sort().map(league => `
                <div class="mb-4 pl-2">
                    <div class="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-1 bg-blue-900/20 w-fit px-2 py-1 rounded">
                       ${window.getSportIcon ? window.getSportIcon(league) : '🏆'} ${league}
                    </div>
                    <div class="space-y-2">
                        ${groupedByLeague[league].map(g => `
                            <div class="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-gray-700/50 hover:border-gray-500 transition">
                                <div class="flex items-center gap-3">
                                    <!-- FECHA (Día) -->
                                    <div class="flex flex-col items-center bg-gray-800 p-1.5 rounded border border-gray-700 min-w-[45px]">
                                        <span class="text-[10px] text-red-400 font-bold uppercase">${new Date(g.date + 'T12:00:00').toLocaleString('es-MX', { weekday: 'short' }).replace('.', '')}</span>
                                        <span class="text-xl font-black text-white leading-none">${g.date.split('-')[2]}</span>
                                    </div>
                                    <!-- INFO -->
                                    <div>
                                        <div class="text-[10px] font-bold text-gray-500 flex items-center gap-1 mb-0.5">
                                            ⏰ ${g.time}
                                        </div>
                                        <div class="text-sm font-bold text-white leading-tight flex items-center gap-1">
                                            ${window.getTeamLogo(g.homeTeam) ? `<img src="${window.getTeamLogo(g.homeTeam)}" class="inline-block object-contain" style="width: 20px; height: 20px; max-width: 20px; max-height: 20px;">` : ''}
                                            <span>${g.match || `${g.homeTeam} vs ${g.awayTeam}`}</span>
                                            ${window.getTeamLogo(g.awayTeam) ? `<img src="${window.getTeamLogo(g.awayTeam)}" class="inline-block object-contain" style="width: 20px; height: 20px; max-width: 20px; max-height: 20px;">` : ''}
                                        </div>
                                    </div>
                                </div>
                                <button onclick="try { if(confirm('¿Borrar evento futuro?')) { window.db.removeGame('${g.id}'); renderManagerDashboard('games'); } } catch(e) { alert('Error: ' + e.message); console.error(e); }" 
                                        class="text-gray-600 hover:text-red-500 hover:bg-red-900/10 p-2 rounded transition">
                                    🗑️
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');

          return `
              <div class="mb-8 last:mb-0">
                  <h4 class="text-yellow-500 font-black text-base uppercase tracking-widest border-b border-gray-700 pb-2 mb-4">
                      ${month}
                  </h4>
                  ${leaguesHtml}
              </div>
            `;
        }).join('');
      })()
    }
                  </div>

                </div>
                `;

  container.appendChild(div);

  // Render Requests if any
  const reqContainer = div.querySelector('#manager-requests-container');
  if (reqContainer) renderManagerGameRequests(reqContainer);
}

// Helper to render individual game card with controls
function renderGameControlCard(game) {
  const isSalonAudio = game.audio?.salon || false;
  const isTerrazaAudio = game.audio?.terraza || false;

  // Logos
  const logoHome = window.getTeamLogo(game.homeTeam);
  const logoAway = window.getTeamLogo(game.awayTeam);

  // Logo HTML or fallback to generic sport icon if neither has logo
  const sportIcon = window.getSportIcon(game.league);

  let visualsHTML = '';
  if (logoHome || logoAway) {
    visualsHTML = `
            <div class="flex items-center gap-3">
               ${logoHome ? `<img src="${logoHome}" class="w-10 h-10 object-contain mx-auto" style="max-width: 40px; max-height: 40px;">` : `<span class="text-2xl">${sportIcon}</span>`}
               <span class="text-sm font-bold text-gray-500">vs</span>
               ${logoAway ? `<img src="${logoAway}" class="w-10 h-10 object-contain mx-auto" style="max-width: 40px; max-height: 40px;">` : `<span class="text-2xl">${sportIcon}</span>`}
            </div>
        `;
  } else {
    visualsHTML = `<div class="text-4xl filter drop-shadow-md">${sportIcon}</div>`;
  }

  return `
                <div class="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg flex flex-col gap-4 transition hover:border-blue-500/50">
                  <!-- HEADER INFO -->
                  <div class="flex justify-between items-start">
                    <div class="flex items-center gap-4">
                      ${visualsHTML}
                      <div>
                        <div class="text-[10px] text-blue-400 font-bold uppercase tracking-widest bg-blue-900/20 px-2 py-0.5 rounded inline-block mb-1">
                          ${game.league} • ${game.time}
                        </div>
                        <div class="text-xl font-black text-white leading-none">
                          ${game.homeTeam} vs ${game.awayTeam}
                        </div>
                      </div>
                    </div>
                    <button onclick="try { if(confirm('¿Borrar este partido?')) { window.db.removeGame('${game.id}'); renderManagerDashboard('games'); } } catch(e) { alert('Error: ' + e.message); console.error(e); }" class="text-gray-600 hover:text-red-500 p-2">
                      🗑️
                    </button>
                  </div>

                  <!-- CONTROLS ROW -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-3 rounded-lg">
                    <!-- TV ASSIGNMENT -->
                    <div>
                      <label class="text-[10px] text-gray-500 font-bold uppercase block mb-1">📺 Asignar Pantallas</label>
                      <input type="text"
                        value="${game.tvs || ''}"
                        placeholder="Ej: 1, 3, Bar"
                        onchange="window.db.updateGameTVs('${game.id}', this.value)"
                        class="w-full bg-gray-900 text-yellow-400 font-mono text-sm border border-gray-600 rounded px-2 py-1.5 focus:border-yellow-500 outline-none placeholder-gray-700">
                    </div>

                    <!-- AUDIO CONTROL -->
                    <div>
                      <label class="text-[10px] text-gray-500 font-bold uppercase block mb-1">🔈 Audio (Zona)</label>
                      <div class="flex gap-2">
                        <button onclick="window.db.setGameAudio('${game.id}', 'salon', ${!isSalonAudio}); renderManagerDashboard('games');"
                          class="flex-1 px-2 py-1.5 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${isSalonAudio ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}">
                          ${isSalonAudio ? '🔊' : '🔈'} SALÓN
                        </button>
                        <button onclick="window.db.setGameAudio('${game.id}', 'terraza', ${!isTerrazaAudio}); renderManagerDashboard('games');"
                          class="flex-1 px-2 py-1.5 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${isTerrazaAudio ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}">
                          ${isTerrazaAudio ? '🔊' : '🔈'} TERRAZA
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                `;
}

// Helper to pre-fill form
window.fillGameForm = function (league, homeTeam) {
  document.getElementById('new-league').value = league;
  document.getElementById('new-home').value = homeTeam;
  document.getElementById('new-away').value = '';
  document.getElementById('new-away').focus();

  // Auto set sport icon if needed or special cases
  if (league === 'F1' || league === 'UFC' || league === 'BOX') {
    document.getElementById('new-home').value = homeTeam;
    document.getElementById('new-away').value = 'Evento';
  }
};

window.submitNewGame = function () {
  const date = document.getElementById('new-date').value || new Date().toISOString().split('T')[0];
  const time = document.getElementById('new-time').value;
  const league = document.getElementById('new-league').value;
  const home = document.getElementById('new-home').value;
  const away = document.getElementById('new-away').value;

  if (!home || !away) {
    alert('Por favor ingresa los nombres de los equipos.');
    return;
  }

  // Determine Sport from League map
  let sport = 'General';
  if (league.includes('NFL')) sport = 'Americano';
  else if (league.includes('NBA')) sport = 'Basquet';
  else if (league.includes('MLB')) sport = 'Beisbol';
  else if (league.includes('NHL')) sport = 'Hockey';
  else if (league.includes('LIGA') || league.includes('CHAMPIONS')) sport = 'Futbol';
  else if (league.includes('UFC') || league.includes('BOX')) sport = 'Peleas';
  else if (league.includes('F1')) sport = 'Automovilismo';

  window.db.addGame({
    date, time, league, sport, homeTeam: home, awayTeam: away
  });

  document.getElementById('add-game-modal').classList.add('hidden');
  renderManagerDashboard('games');
};

function renderManagerReportsTab(container) {
  container.innerHTML = `
       <div class="grid grid-cols-2 gap-4 mt-4">
          <button onclick="renderInventoryView()" class="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center gap-3 hover:border-purple-500 transition active:scale-95 group">
             <span class="text-4xl group-hover:scale-110 transition">📦</span>
             <span class="font-bold text-white text-sm">Inventario 86</span>
          </button>
          
          <button onclick="renderMenuAdminView()" class="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center gap-3 hover:border-yellow-500 transition active:scale-95 group">
             <span class="text-4xl group-hover:scale-110 transition">🍔</span>
             <span class="font-bold text-white text-sm">Editar Menú</span>
          </button>

          <button onclick="renderReviewsQR()" class="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center gap-3 hover:border-green-500 transition active:scale-95 group">
             <span class="text-4xl group-hover:scale-110 transition">⭐</span>
             <span class="font-bold text-white text-sm">QR Reseñas</span>
          </button>

          <button onclick="navigateTo('regional-dashboard')" class="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center gap-3 hover:border-blue-500 transition active:scale-95 group">
             <span class="text-4xl group-hover:scale-110 transition">📈</span>
             <span class="font-bold text-white text-sm">Analytics</span>
          </button>
       </div>
    `;
}

// ------ OLD MANAGER DASHBOARD (DISABLED) ------

function OLD_renderManagerDashboard() {
  console.log('🎯 Rendering FULL Manager Dashboard...');

  const branchId = STATE.branch?.id;
  if (!branchId) {
    alert('Error: No se ha seleccionado sucursal');
    return;
  }

  // Get active visits for this branch
  const activeVisits = window.db.getActiveVisits().filter(v => v.branchId === branchId);

  // Get prospects for this branch
  const prospects = window.db.getProspects().filter(p => p.branchId === branchId);

  const div = document.createElement('div');
  div.className = 'p-4 max-w-6xl mx-auto pb-20';

  div.innerHTML = `
                <header class="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                  <div>
                    <h1 class="text-3xl font-black text-yellow-500">GERENTE <span class="text-white">HUB</span></h1>
                    <p class="text-sm text-gray-400">${STATE.branch?.name || ''} • ${STATE.user?.name || ''}</p>
                  </div>
                  <button onclick="handleLogout()" class="bg-red-900/30 text-red-400 px-4 py-2 rounded font-bold hover:bg-red-900/50">Salir</button>
                </header>

                <!-- SOLICITUDES DE PARTIDOS (HOSTESS) -->
                ${(window.db.getDailyInfo().gameRequests || []).length > 0 ? `
      <div class="card mb-6 bg-orange-900/20 border-2 border-orange-500 shadow-2xl animate-pulse-slow">
         <div class="flex justify-between items-center mb-4">
             <h2 class="text-2xl font-bold text-orange-400 flex items-center gap-2">🔔 Solicitudes de Hostess (${(window.db.getDailyInfo().gameRequests || []).length})</h2>
             <span class="text-xs bg-orange-600 text-white px-2 py-1 rounded-full animate-bounce">NUEVO</span>
         </div>
         <div class="space-y-3">
            ${(window.db.getDailyInfo().gameRequests || []).map(r => `
               <div class="bg-black/60 p-4 rounded-lg border border-orange-500/50 flex flex-col md:flex-row justify-between items-center gap-3">
                   <div class="flex items-center gap-3">
                       <span class="text-2xl">🙋‍♀️</span>
                       <div>
                           <div class="font-bold text-white text-xl">"${r.name}"</div>
                           <div class="text-xs text-gray-400">Solicitado hace unos momentos</div>
                       </div>
                   </div>
                   <div class="flex gap-2 w-full md:w-auto">
                       <button onclick="window.approveGameRequest('${r.id}', '${r.name}')" class="flex-1 md:flex-none bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-green-500/50 transition transform active:scale-95 flex items-center justify-center gap-2">
                          <span>✅</span> APROBAR
                       </button>
                       <button onclick="window.db.removeGameRequest('${r.id}'); renderManagerDashboard();" class="flex-1 md:flex-none bg-red-900/40 hover:bg-red-900/60 text-red-400 border border-red-800 px-4 py-2 rounded-lg font-bold transition">
                          DESCARTAR
                       </button>
                   </div>
               </div>
            `).join('')}
         </div>
      </div>
    ` : ''}

                <!-- GESTIÓN DE PARTIDOS -->
                <div class="card mb-6 bg-blue-900/10 border-2 border-blue-600 shadow-xl">
                  <div class="flex justify-between items-center mb-4 border-b border-blue-800 pb-2">
                    <h2 class="text-2xl font-bold text-blue-400 flex items-center gap-2"><span>📺</span> Partidos Programados</h2>
                    <button onclick="
              const league = prompt('Liga (NFL, NBA, Liga MX...):', 'General');
              if(!league) return;
              const home = prompt('Equipo Local (ej. Cowboys):');
              if(!home) return;
              const away = prompt('Equipo Visitante (ej. Eagles):');
              if(!away) return;
              const time = prompt('Hora (HH:MM):', '19:00');
              if(home && away && time) {
                 window.db.addGame({league, homeTeam: home, awayTeam: away, time});
                 renderManagerDashboard(); // Refresh
              }
          " class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-blue-500/50 transition transform active:scale-95">
                      <span>+</span> AGREGAR PARTIDO
                    </button>
                  </div>

                  ${window.db.getMatches().length === 0 ? '<p class="text-gray-400 text-center py-4">No hay partidos programados hoy. Agrega uno arriba.</p>' : `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
         ${window.db.getMatches().map(g => `
            <div class="flex justify-between items-center bg-gray-900 p-3 rounded border border-gray-700 hover:border-blue-500 transition relative group">
                <div>
                   <div class="font-bold text-white text-lg leading-tight mb-1">${g.homeTeam || '?'} <span class="text-gray-500 text-sm">vs</span> ${g.awayTeam || '?'}</div>
                   <div class="text-xs text-blue-300 font-bold uppercase tracking-wider bg-blue-900/30 inline-block px-2 py-1 rounded">${g.league} • ⏰ ${g.time}</div>
                </div>
                <button onclick="try { if(confirm('¿Borrar partido?')) { window.db.removeGame('${g.id}'); renderManagerDashboard(); } } catch(e) { alert('Error: ' + e.message); console.error(e); }" class="text-red-500 hover:text-red-400 bg-red-900/20 p-2 rounded hover:bg-red-900/40 transition">🗑️</button>
            </div>
         `).join('')}
      </div>
      `}
                </div>

                <!-- MESAS ACTIVAS -->
                <div class="card mb-6 bg-green-900/10 border-2 border-green-600">
                  <h2 class="text-2xl font-bold text-green-400 mb-4">🍽️ Mesas Activas (${activeVisits.length})</h2>
                  ${activeVisits.length === 0 ? `
        <p class="text-gray-400 text-center py-8">No hay mesas activas en este momento</p>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${activeVisits.map(v => {
    const customer = window.db.getCustomerById(v.customerId);
    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Cliente';
    const waiter = window.db.data.users.find(u => u.id === v.waiterId);
    const waiterName = waiter?.name || 'Sin asignar';

    return `
              <div onclick="navigateTo('view-customer', { customerId: '${v.customerId}' })" class="bg-gray-800 p-4 rounded-lg border border-green-600 hover:border-green-400 cursor-pointer transition">
                <div class="text-xl font-bold text-yellow-400">Mesa ${v.table}</div>
                <div class="text-white font-semibold">${customerName}</div>
                <div class="text-sm text-gray-400 mt-2">
                  <div>👤 ${waiterName}</div>
                  <div>👥 ${v.pax} personas</div>
                </div>
              </div>
            `;
  }).join('')}
        </div>
      `}
                </div>

                <!-- PROSPECTOS POR REVISAR -->
                <div class="card mb-6 bg-purple-900/10 border-2 border-purple-600">
                  <h2 class="text-2xl font-bold text-purple-400 mb-4">⭐ Prospectos por Revisar (${prospects.length})</h2>
                  ${prospects.length === 0 ? `
        <p class="text-gray-400 text-center py-8">No hay prospectos pendientes</p>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${prospects.slice(0, 6).map(p => {
    const customer = window.db.getCustomerById(p.customerId);
    if (!customer) return '';

    return `
              <div onclick="navigateTo('enrich-customer', { customerId: '${p.customerId}', visitId: '${p.visitId}' })" class="bg-gray-800 p-4 rounded-lg border border-purple-600 hover:border-purple-400 cursor-pointer transition">
                <div class="text-lg font-bold text-white">${customer.firstName} ${customer.lastName}</div>
                <div class="text-sm text-gray-400">
                  <div>📅 ${new Date(p.createdAt).toLocaleDateString()}</div>
                  <div>🍽️ Mesa ${p.table || 'N/A'}</div>
                </div>
              </div>
            `;
  }).join('')}
        </div>
        ${prospects.length > 6 ? `<p class="text-center text-gray-400 mt-3">+ ${prospects.length - 6} más...</p>` : ''}
      `}
                </div>

                <!-- MÓDULOS PRINCIPALES -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  <!-- Enriquecer Cliente -->
                  <div onclick="alert('Selecciona un prospecto de la lista de arriba')" class="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-purple-500 cursor-pointer transition group">
                    <div class="text-4xl mb-4 group-hover:scale-110 transition">👤</div>
                    <h2 class="text-xl font-bold text-white mb-2">Enriquecer Cliente</h2>
                    <p class="text-gray-400 text-sm">Captura datos detallados de prospectos</p>
                  </div>

                  <!-- Reportes -->
                  <div onclick="navigateTo('regional-dashboard')" class="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 cursor-pointer transition group">
                    <div class="text-4xl mb-4 group-hover:scale-110 transition">📊</div>
                    <h2 class="text-xl font-bold text-white mb-2">Reportes</h2>
                    <p class="text-gray-400 text-sm">Ver reportes y analytics de la sucursal</p>
                  </div>

                  <!-- Marketing & Fidelización -->
                  <div onclick="alert('Módulo de Marketing - Próximamente')" class="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-pink-500 cursor-pointer transition group">
                    <div class="text-4xl mb-4 group-hover:scale-110 transition">📢</div>
                    <h2 class="text-xl font-bold text-white mb-2">Marketing & Fidelización</h2>
                    <p class="text-gray-400 text-sm">Campañas y segmentación de clientes</p>
                  </div>

                  <!-- Dinámicas -->
                  <div onclick="alert('Módulo de Dinámicas - Próximamente')" class="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-orange-500 cursor-pointer transition group">
                    <div class="text-4xl mb-4 group-hover:scale-110 transition">🎯</div>
                    <h2 class="text-xl font-bold text-white mb-2">Dinámicas</h2>
                    <p class="text-gray-400 text-sm">Gestionar concursos y dinámicas del día</p>
                  </div>

                  <!-- Módulo 86 -->
                  <div onclick="renderInventoryView()" class="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-red-500 cursor-pointer transition group">
                    <div class="text-4xl mb-4 group-hover:scale-110 transition">🚫</div>
                    <h2 class="text-xl font-bold text-white mb-2">Gestión 86 (Disponibilidad)</h2>
                    <p class="text-gray-400 text-sm">Marca productos como agotados</p>
                  </div>

                  <!-- Admin Menú -->
                  <div onclick="renderMenuAdminView()" class="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-yellow-500 cursor-pointer transition group">
                    <div class="text-4xl mb-4 group-hover:scale-110 transition">➕</div>
                    <h2 class="text-xl font-bold text-white mb-2">Administrador de Menú</h2>
                    <p class="text-gray-400 text-sm">Agrega nuevos platillos o bebidas</p>
                  </div>

                  <!-- QR Reseñas -->
                  <div onclick="renderReviewsQR()" class="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 cursor-pointer transition group">
                    <div class="text-4xl mb-4 group-hover:scale-110 transition">⭐</div>
                    <h2 class="text-xl font-bold text-white mb-2">Código QR Reseñas</h2>
                    <p class="text-gray-400 text-sm">Mostrar código para feedback de clientes</p>
                  </div>
                </div>
                `;

  appContainer.innerHTML = '';
  appContainer.appendChild(div);
  console.log('✅ FULL Manager Dashboard rendered successfully');
}

// === VIEW: INVENTORY 86 ===
function renderInventoryView() {
  const menu = window.db.getMenu();
  const allItems = [
    ...(menu.alimentos || []).map(i => ({ ...i, type: 'Alimento' })),
    ...(menu.bebidas || []).map(i => ({ ...i, type: 'Bebida' }))
  ];

  const div = document.createElement('div');
  div.className = 'p-4 max-w-4xl mx-auto pb-20';

  div.innerHTML = `
                <header class="flex justify-between items-center mb-6 sticky top-0 bg-black z-10 py-4 border-b border-gray-800">
                  <h2 class="text-2xl text-red-500 font-bold flex items-center gap-2">🚫 GESTIÓN 86 <span class="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">Control de Stock</span></h2>
                  <button onclick="renderManagerDashboard()" class="text-gray-400 font-bold hover:text-white">← Volver</button>
                </header>

                <div class="mb-6">
                  <input type="text" id="inv-search" oninput="filterInventory(this.value)" placeholder="🔍 Buscar producto..." class="w-full p-4 bg-gray-900 rounded-lg border border-gray-700 text-white text-lg font-bold">
                </div>

                <div id="inv-list" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  ${_renderInventoryItemsHTML(allItems)}
                </div>
                `;

  appContainer.innerHTML = '';
  appContainer.appendChild(div);

  // Store items globally for filtering
  window.TEMP_INVENTORY = allItems;
}

function _renderInventoryItemsHTML(items) {
  return items.map(item => `
                <div class="inv-item bg-gray-800 p-4 rounded-lg flex justify-between items-center border ${item.available ? 'border-green-900/30' : 'border-red-600'} transition-all">
                  <div>
                    <div class="font-bold text-white text-lg">${item.name}</div>
                    <div class="text-xs text-gray-400 flex items-center gap-2">
                      <span class="uppercase tracking-wider font-bold text-[10px] ${item.type === 'Alimento' ? 'text-orange-400' : 'text-blue-400'}">${item.type}</span>
                      <span>•</span>
                      <span class="capitalize">${item.category}</span>
                    </div>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" onchange="window.handleAvailabilityToggle('${item.id}', this)" ${item.available ? 'checked' : ''}>
                      <div class="w-14 h-7 bg-red-900/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white"></div>
                      <span class="ml-3 text-sm font-bold w-16 text-right ${item.available ? 'text-green-400' : 'text-red-500'}">${item.available ? 'DISP.' : 'AGOTADO'}</span>
                  </label>
                </div>
                `).join('');
}

window.filterInventory = function (query) {
  const term = query.toLowerCase();
  const filtered = window.TEMP_INVENTORY.filter(i => i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term));
  document.getElementById('inv-list').innerHTML = _renderInventoryItemsHTML(filtered);
}

window.handleAvailabilityToggle = function (id, checkbox) {
  const success = window.db.toggleItemAvailability(id);
  if (success) {
    // UI Feedback
    const container = checkbox.closest('.inv-item');
    const label = checkbox.parentElement.querySelector('span');
    const isAvailable = checkbox.checked;

    label.textContent = isAvailable ? 'DISP.' : 'AGOTADO';
    label.className = `ml-3 text-sm font-bold w-16 text-right ${isAvailable ? 'text-green-400' : 'text-red-500'}`;

    container.classList.remove('border-green-900/30', 'border-red-600');
    container.classList.add(isAvailable ? 'border-green-900/30' : 'border-red-600');
  }
}

// === VIEW: MENU ADMIN ===
function renderMenuAdminView() {
  const div = document.createElement('div');
  div.className = 'p-6 max-w-lg mx-auto bg-gray-900 min-h-screen';

  div.innerHTML = `
                <header class="flex justify-between items-center mb-8 sticky top-0 bg-gray-900 pt-4 pb-4 border-b border-gray-800 z-10">
                  <h2 class="text-2xl text-yellow-500 font-black">➕ NUEVO PRODUCTO</h2>
                  <button onclick="renderManagerDashboard()" class="text-gray-400 font-bold hover:text-white">← Volver</button>
                </header>

                <form onsubmit="handleNewProductSubmit(event)" class="space-y-6 bg-black p-6 rounded-xl border border-gray-800 shadow-2xl">
                  <div>
                    <label class="block text-gray-400 text-xs font-bold uppercase mb-2">Nombre del Producto</label>
                    <input name="name" required type="text" placeholder="Ej: Hamburguesa Especial" class="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white font-bold text-lg focus:border-yellow-500 outline-none transition">
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-gray-400 text-xs font-bold uppercase mb-2">Precio ($)</label>
                      <input name="price" required type="number" step="0.5" placeholder="0.00" class="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white font-bold text-lg focus:border-yellow-500 outline-none transition">
                    </div>
                    <div>
                      <label class="block text-gray-400 text-xs font-bold uppercase mb-2">Tipo</label>
                      <select name="type" required class="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white font-bold appearance-none focus:border-yellow-500 outline-none transition">
                        <option value="alimentos">🍔 Alimento</option>
                        <option value="bebidas">🍺 Bebida</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label class="block text-gray-400 text-xs font-bold uppercase mb-2">Categoría</label>
                    <select name="category" required class="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white font-bold appearance-none focus:border-yellow-500 outline-none transition">
                      <optgroup label="Alimentos">
                        <option value="Entradas">Entradas</option>
                        <option value="Platillos">Platillos</option>
                        <option value="Postres">Postres</option>
                        <option value="Hamburguesas">Hamburguesas</option>
                        <option value="Boneless">Boneless / Alitas</option>
                      </optgroup>
                      <optgroup label="Bebidas">
                        <option value="Cerveza Barril">Cerveza Barril</option>
                        <option value="Cerveza Botella">Cerveza Botella</option>
                        <option value="Michelados">Michelados</option>
                        <option value="Refrescos">Refrescos</option>
                        <option value="Limonadas">Limonadas</option>
                        <option value="Destilados">Destilados</option>
                        <option value="Coctelería">Coctelería</option>
                        <option value="Café">Café</option>
                      </optgroup>
                    </select>
                  </div>

                  <button type="submit" class="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-4 rounded-lg mt-8 text-lg shadow-lg transform active:scale-95 transition-all">
                    GUARDAR PRODUCTO
                  </button>
                </form>
                `;

  appContainer.innerHTML = '';
  appContainer.appendChild(div);
}

window.handleNewProductSubmit = function (e) {
  e.preventDefault();
  const data = new FormData(e.target);
  const result = window.db.addNewProduct(
    data.get('name'),
    data.get('category'),
    data.get('price'),
    data.get('type')
  );
  if (result) {
    if (confirm('✅ Producto agregado correctamente.\n¿Deseas agregar otro?')) {
      e.target.reset();
    } else {
      renderManagerDashboard();
    }
  } else {
    alert('❌ Error al agregar producto. Intenta de nuevo.');
  }
}

// === VIEW: QR REVIEWS ===
function renderReviewsQR() {
  const div = document.createElement('div');
  div.className = 'min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden';

  // Get user name safely
  const userName = (STATE.user && STATE.user.name) ? STATE.user.name : 'Tu Mesero';
  const roleTitle = (STATE.user && STATE.user.role === 'manager') ? 'Gerente' : 'Te atiende';

  // Google Review Link
  const reviewLink = "https://www.google.com/maps/search/?api=1&query=Buffalo+Wild+Wings+Juriquilla";

  div.innerHTML = `
                <!-- Background styling -->
                <div class="absolute inset-0 bg-gradient-to-br from-yellow-900/10 to-black pointer-events-none"></div>

                <div class="relative z-10 w-full max-w-md bg-[#111] rounded-3xl overflow-hidden shadow-2xl border md:border-2 border-[#FFC600] flex flex-col items-center transform transition-all duration-500 scale-100">

                  <!-- HEADER: Waiter Name -->
                  <div class="w-full bg-[#FFC600] p-6 pb-8 text-center relative clip-path-slant">
                    <div class="absolute inset-0 bg-white/5 skew-y-3 pointer-events-none"></div>

                    <p class="text-black/80 font-bold text-sm uppercase tracking-widest mb-1 shadow-sm">${roleTitle}</p>
                    <h1 class="text-black text-3xl md:text-4xl font-extrabold uppercase leading-none drop-shadow-md">
                      ${userName}
                    </h1>
                  </div>

                  <!-- BODY: Message & QR -->
                  <div class="w-full px-8 pt-8 pb-10 flex flex-col items-center bg-[#111] relative -mt-4 rounded-t-3xl z-20">

                    <p class="text-white text-lg md:text-xl text-center font-medium mb-6 italic">
                      "Agradezco mucho tu reseña" ⭐
                    </p>

                    <!-- QR Container with Glow -->
                    <div class="relative group mb-8">
                      <div class="absolute -inset-2 bg-gradient-to-tr from-[#FFC600] to-yellow-600 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition duration-700"></div>

                      <div class="relative bg-white p-3 rounded-xl shadow-inner">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=000000&bgcolor=FFFFFF&data=${encodeURIComponent(reviewLink)}"
                          alt="QR Code"
                          class="w-64 h-64 object-contain mix-blend-multiply">
                      </div>
                    </div>

                    <!-- CALL TO ACTION: ESCANÉAME -->
                    <div class="animate-pulse">
                      <div class="bg-[#FFC600] text-black font-black text-2xl px-10 py-3 rounded-full shadow-[0_0_20px_rgba(255,198,0,0.4)] uppercase tracking-widest flex items-center justify-center gap-3 transform hover:scale-105 transition cursor-none">
                        <span class="text-3xl">📷</span>
                        <span>Escanéame</span>
                      </div>
                    </div>

                    <!-- LOCATION SUBTITLE -->
                    <div class="mt-8 text-center opacity-50">
                      <h3 class="text-sm font-bold text-white uppercase tracking-[0.2em]">Buffalo Wild Wings</h3>
                      <h4 class="text-xs text-white uppercase tracking-widest mt-1">Juriquilla</h4>
                    </div>
                  </div>
                </div>

                <!-- Back Button -->
                <div class="mt-8 z-10">
                  <button onclick="goBack()" class="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 border border-gray-700 text-gray-300 font-bold hover:bg-gray-800 hover:text-white transition group">
                    <span class="group-hover:-translate-x-1 transition">←</span>
                    <span>Volver</span>
                  </button>
                </div>
                `;

  appContainer.innerHTML = '';
  appContainer.appendChild(div);
}

// Alias for Waiter Dashboard compatibility (Case Insensitive Safety)
window.showQRreviews = renderReviewsQR;
window.showQRReviews = renderReviewsQR;

// === VIEW: ENRICH CUSTOMER ===
function renderEnrichCustomer(params) {
  const { customerId, visitId } = params;
  const customer = window.db.getCustomerById(customerId);

  if (!customer) {
    alert('Cliente no encontrado');
    renderManagerDashboard();
    return;
  }

  const div = document.createElement('div');
  div.className = 'p-4 max-w-2xl mx-auto pb-20';

  div.innerHTML = `
                <header class="flex justify-between items-center mb-6 sticky top-0 bg-black z-10 py-4 border-b border-gray-800">
                  <h2 class="text-2xl text-purple-400 font-bold flex items-center gap-2">💎 ENRIQUECER PERFIL</h2>
                  <button onclick="renderManagerDashboard()" class="text-gray-400 font-bold hover:text-white">← Volver</button>
                </header>

                <form onsubmit="handleEnrichSubmit(event, '${customerId}', '${visitId}')" class="space-y-6 bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-2xl">

                  <!-- Personal Info -->
                  <div>
                    <h3 class="text-white font-bold mb-4 border-b border-gray-700 pb-2">Información Personal</h3>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-gray-400 text-xs font-bold uppercase mb-2">Nombre</label>
                        <input name="firstName" required value="${customer.firstName || ''}" type="text" class="w-full p-3 bg-black border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none">
                      </div>
                      <div>
                        <label class="block text-gray-400 text-xs font-bold uppercase mb-2">Apellido</label>
                        <input name="lastName" value="${customer.lastName || ''}" type="text" class="w-full p-3 bg-black border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none">
                      </div>
                    </div>
                  </div>

                  <!-- Contact Info -->
                  <div>
                    <h3 class="text-white font-bold mb-4 border-b border-gray-700 pb-2">Contacto & Demografía</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-gray-400 text-xs font-bold uppercase mb-2">Teléfono</label>
                        <input name="phone" value="${customer.phone || ''}" type="tel" class="w-full p-3 bg-black border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none">
                      </div>
                      <div>
                        <label class="block text-gray-400 text-xs font-bold uppercase mb-2">Email</label>
                        <input name="email" value="${customer.email || ''}" type="email" class="w-full p-3 bg-black border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none">
                      </div>
                      <div>
                        <label class="block text-gray-400 text-xs font-bold uppercase mb-2">Cumpleaños</label>
                        <input name="birthday" value="${customer.birthday || ''}" type="date" class="w-full p-3 bg-black border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none">
                      </div>
                      <div>
                        <label class="block text-gray-400 text-xs font-bold uppercase mb-2">Ciudad</label>
                        <input name="city" value="${customer.city || ''}" type="text" class="w-full p-3 bg-black border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none">
                      </div>
                    </div>
                  </div>

                  <!-- Preferences -->
                  <div>
                    <h3 class="text-white font-bold mb-4 border-b border-gray-700 pb-2">Preferencias</h3>
                    <div>
                      <label class="block text-gray-400 text-xs font-bold uppercase mb-2">Equipo Favorito</label>
                      <input name="team" value="${customer.team || ''}" list="team-suggestions" type="text" class="w-full p-3 bg-black border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none" placeholder="Ej: Dallas Cowboys">
                    </div>
                    <div class="mt-4">
                      <label class="block text-gray-400 text-xs font-bold uppercase mb-2">Notas / Comentarios</label>
                      <textarea name="notes" rows="3" class="w-full p-3 bg-black border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none">${customer.notes || ''}</textarea>
                    </div>
                  </div>

                  <button type="submit" class="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-lg mt-8 text-lg shadow-lg transform active:scale-95 transition-all">
                    💾 GUARDAR CAMBIOS
                  </button>
                </form>
                `;

  appContainer.innerHTML = '';
  appContainer.appendChild(div);

  // Ensure datalist exists
  if (window.updateTeamDatalist) window.updateTeamDatalist();
}

window.handleEnrichSubmit = function (e, customerId, visitId) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const updates = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    birthday: formData.get('birthday'),
    city: formData.get('city'),
    team: formData.get('team'),
    notes: formData.get('notes')
  };

  const success = window.db.updateCustomer(customerId, updates);

  if (success) {
    if (visitId && visitId !== 'undefined') {
      window.db.markProspectAsReviewed(visitId);
    }
    showToast('✅ Cliente actualizado correctamente', 'success');
    renderManagerDashboard(); // Go back to dashboard
  } else {
    alert('Error al actualizar cliente');
  }
};

// === VIEW: CUSTOMER PROFILE ===
function renderViewCustomer(customerId) {
  const customer = window.db.getCustomerById(customerId);
  if (!customer) {
    alert('Cliente no encontrado');
    renderManagerDashboard();
    return;
  }

  const classification = window.db.getCustomerClassification(customerId);
  const badgeHTML = window.ClientClassifier ? window.ClientClassifier.getBadgeHTML(classification) : classification.toUpperCase();
  const desc = window.ClientClassifier ? window.ClientClassifier.getDescription(classification) : '';
  const visits = window.db.data.visits.filter(v => v.customerId === customerId).sort((a, b) => new Date(b.date) - new Date(a.date));

  const div = document.createElement('div');
  div.className = 'p-4 max-w-2xl mx-auto pb-20';

  div.innerHTML = `
                <header class="flex justify-between items-center mb-6 sticky top-0 bg-black z-10 py-4 border-b border-gray-800">
                  <h2 class="text-2xl text-white font-bold">PERFIL</h2>
                  <button onclick="renderManagerDashboard()" class="text-gray-400 font-bold hover:text-white">← Volver</button>
                </header>

                <!-- Header Card -->
                <div class="bg-gray-900 rounded-xl p-6 border border-gray-700 mb-6 flex items-center justify-between">
                  <div>
                    <h1 class="text-3xl font-black text-white mb-2">${customer.firstName} ${customer.lastName}</h1>
                    <div class="flex items-center gap-3">
                      ${badgeHTML}
                      <span class="text-gray-400 text-sm">${customer.city || 'Ciudad desconocida'}</span>
                    </div>
                  </div>
                  <button onclick="navigateTo('enrich-customer', { customerId: '${customerId}' })" class="bg-gray-800 hover:bg-gray-700 p-3 rounded-full border border-gray-600 transition">
                    ✏️
                  </button>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div class="text-gray-400 text-xs uppercase font-bold">Visitas Totales</div>
                    <div class="text-2xl font-black text-white">${visits.length}</div>
                  </div>
                  <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div class="text-gray-400 text-xs uppercase font-bold">Equipo</div>
                    <div class="text-xl font-bold text-yellow-500">${customer.team || 'N/A'}</div>
                  </div>
                </div>

                <!-- Info Section -->
                <div class="bg-gray-900 rounded-xl p-6 border border-gray-700 mb-6 space-y-3">
                  <h3 class="text-gray-500 font-bold text-sm uppercase mb-2">Datos de Contacto</h3>
                  <div class="flex justify-between border-b border-gray-800 pb-2">
                    <span class="text-gray-400">Teléfono</span>
                    <span class="text-white font-mono">${customer.phone || '-'}</span>
                  </div>
                  <div class="flex justify-between border-b border-gray-800 pb-2">
                    <span class="text-gray-400">Email</span>
                    <span class="text-white text-sm">${customer.email || '-'}</span>
                  </div>
                  <div class="flex justify-between pt-2">
                    <span class="text-gray-400">Cumpleaños</span>
                    <span class="text-white">${customer.birthday || '-'}</span>
                  </div>
                </div>

                <!-- Recent History -->
                <div>
                  <h3 class="text-white font-bold mb-4">Historial de Visitas</h3>
                  <div class="space-y-3">
                    ${visits.slice(0, 5).map(v => {
    const date = new Date(v.date).toLocaleDateString();
    return `
                    <div class="bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-700">
                        <div>
                            <div class="text-white font-bold">${date}</div>
                            <div class="text-xs text-gray-400">Mesa ${v.table} • consumo $${v.totalAmount || 0}</div>
                        </div>
                        <div class="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
                            ${v.status === 'active' ? '🟢 Activo' : '🔴 Cerrado'}
                        </div>
                    </div>
                `;
  }).join('')}
                    ${visits.length === 0 ? '<p class="text-gray-500 text-center italic">Sin historial reciente</p>' : ''}
                  </div>
                </div>
                `;

  appContainer.innerHTML = '';
  appContainer.appendChild(div);
}


// --- INITIALIZATION ---
function initApp() {
  if (localStorage.getItem('ADANYEVA_SESSION') && window.db) {
    renderLogin();
  } else {
    renderLogin();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}


// --- INGESTION HELPERS ---

window.renderIngestionConfig = function (type) {
  if (!window.db || !window.db.data.ingestionConfig) return '';
  const items = window.db.data.ingestionConfig[type] || [];
  if (items.length === 0) return '<span class="text-xs text-gray-500 italic">Nada configurado</span>';

  return items.map(item => `
                <span onclick="window.removeIngestItem('${type}', '${item.id}')"
                  class="cursor-pointer bg-${item.active ? 'green' : 'gray'}-900 border border-${item.active ? 'green' : 'gray'}-700 text-${item.active ? 'green' : 'gray'}-300 px-2 py-1 rounded text-[10px] font-bold hover:bg-red-900 hover:text-red-300 hover:border-red-700 transition" title="Clic para eliminar">
                  ${item.active ? '🟢' : '⚪'} ${item.name} (${item.id})
                </span>
                `).join('');
};

window.addIngestItem = function (type) {
  const idInput = document.getElementById(type === 'leagues' ? 'new-league-id' : 'new-team-id');
  const nameInput = document.getElementById(type === 'leagues' ? 'new-league-name' : 'new-team-name');

  const id = idInput.value.trim();
  const name = nameInput.value.trim();

  if (!id || !name) {
    if (window.showToast) window.showToast('❌ Faltan datos (ID y Nombre)', 'error');
    return;
  }

  if (!window.db.data.ingestionConfig[type]) window.db.data.ingestionConfig[type] = [];

  // Check duplicate
  if (window.db.data.ingestionConfig[type].find(i => i.id === id)) {
    if (window.showToast) window.showToast('⚠️ Ese ID ya está registrado', 'warning');
    return;
  }

  window.db.data.ingestionConfig[type].push({ id, name, active: true });
  window.db._save();

  // Re-render
  if (typeof renderManagerDashboard === 'function') renderManagerDashboard('games');
};

window.removeIngestItem = function (type, id) {
  if (!confirm(`¿Dejar de seguir ${type === 'leagues' ? 'esta liga' : 'este equipo'}?`)) return;

  if (!window.db.data.ingestionConfig[type]) return;
  window.db.data.ingestionConfig[type] = window.db.data.ingestionConfig[type].filter(i => i.id !== id);
  window.db._save();

  if (typeof renderManagerDashboard === 'function') renderManagerDashboard('games');
};

// Simplified wrapper to just call Ingestor
window.runSportsIngest = async function () {
  if (!window.ingestor) window.ingestor = new window.SportIngestor();

  try {
    const count = await window.ingestor.runIngest();
    console.log("RunSportsIngest Result:", count);
    if (window.showToast) window.showToast(`✅ ${count} partidos sincronizados.`, 'success');
    return count; // Return value for UI feedback
  } catch (e) {
    console.error("Ingest Error:", e);
    if (window.showToast) window.showToast(`❌ Error al sincronizar.`, 'error');
    throw e;
  }
};

// RENDER HOSTESS REQUESTS (With Dismiss Logic)
function renderManagerGameRequests(container) {
  const requests = window.db.getDailyInfo().gameRequests || [];
  if (requests.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
                <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4 animate-fade-in">
                  <h4 class="text-blue-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    🔔 Solicitudes Recientes (${requests.length})
                  </h4>
                  <div class="space-y-2">
                    ${requests.map(req => `
                    <div class="flex justify-between items-center bg-black/40 p-2 rounded border border-blue-500/20">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">📺</span>
                            <div>
                                <div class="text-white font-bold text-sm leading-none">${req.gameName || req.name}</div>
                                <div class="text-[10px] text-gray-500">${new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.db.removeGameRequest('${req.id}'); renderManagerDashboard('games');" 
                                    class="text-gray-500 hover:text-white hover:bg-white/10 p-1.5 rounded transition" title="Descartar">
                                ✕
                            </button>
                            ${!(window.db.getMatches().find(m => m.match === (req.gameName || req.name))) ?
      `<button onclick="document.getElementById('new-home').value = '${req.gameName || req.name}'; document.getElementById('new-league').value='UFC'; document.getElementById('new-league').focus();" 
                                         class="text-blue-400 hover:text-blue-300 text-xs border border-blue-500/50 px-2 py-1 rounded">
                                    + Agregar
                                </button>` : ''}
                        </div>
                    </div>
                `).join('')}
                  </div>
                </div>
                `;
}

// === HOSTESS RESERVATION UI ===

window.showReservationModal = function () {
  // Simple prompt-based flow for now, or inject a modal if preferred.
  // Let's inject a modal for better UX as requested "Professional"

  // Check if modal exists
  let modal = document.getElementById('reservation-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'reservation-modal';
    // FIX: Fully OPAQUE background (bg-black) to prevent bleed-through. High z-index.
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center bg-black animate-fade-in hidden sm:p-4';
    modal.innerHTML = `
                <!-- Modal Content: Solid gray background, no transparency -->
                <div class="bg-gray-900 border border-yellow-500/50 sm:rounded-xl w-full h-full sm:h-auto sm:max-w-md relative shadow-2xl flex flex-col sm:max-h-[90vh]">
                  <div class="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <button onclick="document.getElementById('reservation-modal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl z-20 bg-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-gray-700">✕</button>

                    <h3 class="text-2xl font-black text-yellow-500 mb-8 flex items-center gap-2 sticky top-0 bg-gray-900 z-10 py-2 border-b border-gray-800">
                      🎟️ NUEVA RESERVACIÓN
                    </h3>

                  <div class="space-y-4">
                    <div>
                      <label class="block text-xs uppercase text-gray-400 font-bold mb-1">Nombre Cliente</label>
                      <input type="text" id="res-name" class="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" placeholder="Ej. Juan Pérez">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs uppercase text-gray-400 font-bold mb-1">Pax</label>
                        <input type="number" id="res-pax" class="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white outline-none" value="2">
                      </div>
                      <div>
                        <label class="block text-xs uppercase text-gray-400 font-bold mb-1">Hora</label>
                        <input type="time" id="res-time" class="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white outline-none">
                      </div>
                    </div>

                    <div>
                      <label class="block text-xs uppercase text-gray-400 font-bold mb-1">Categoría VIP</label>
                      <div class="flex gap-2">
                        <button onclick="selectResVip(this, '')" class="res-vip-btn flex-1 p-2 rounded border border-gray-600 bg-gray-800 text-gray-400 text-sm selected">Normal</button>
                        <button onclick="selectResVip(this, 'blazin')" class="res-vip-btn flex-1 p-2 rounded border border-orange-500/50 bg-gray-800 text-orange-500 text-sm">🔥 Blazin</button>
                        <button onclick="selectResVip(this, 'diamond')" class="res-vip-btn flex-1 p-2 rounded border border-blue-400/50 bg-gray-800 text-blue-400 text-sm">💎 Diamond</button>
                      </div>
                      <input type="hidden" id="res-vip" value="">
                    </div>

                    <div>
                      <label class="block text-xs uppercase text-gray-400 font-bold mb-1">Motivo / Partido</label>
                      <select id="res-reason" class="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white mb-2" onchange="toggleResGameDisplay(this)">
                        <option value="Casual">Casual / Comida</option>
                        <option value="Partido">Ver Partido</option>
                        <option value="Cumpleaños">Cumpleaños</option>
                        <option value="Negocios">Negocios</option>
                      </select>

                      <div id="res-game-container" class="hidden">
                        <select id="res-game" class="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white text-sm">
                          <!-- Populated dynamically -->
                        </select>
                      </div>
                    </div>

                    <button onclick="submitReservation()" class="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-4 rounded-lg mt-4 shadow-lg transform active:scale-95 transition">
                      💾 GUARDAR RESERVACIÓN
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
    document.body.appendChild(modal);
  }

  // Reset and Show
  document.getElementById('res-name').value = '';
  document.getElementById('res-pax').value = '2';
  document.getElementById('res-time').value = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // Populate Games
  const gameSelect = document.getElementById('res-game');
  if (window.generateGameOptions) {
    gameSelect.innerHTML = window.generateGameOptions('');
  }

  document.getElementById('reservation-modal').classList.remove('hidden');
};

window.selectResVip = function (btn, val) {
  document.querySelectorAll('.res-vip-btn').forEach(b => {
    b.classList.remove('bg-gray-700', 'ring-2', 'ring-yellow-500');
    b.classList.add('bg-gray-800');
  });
  btn.classList.remove('bg-gray-800');
  btn.classList.add('bg-gray-700', 'ring-2', 'ring-yellow-500');
  document.getElementById('res-vip').value = val;
};

window.toggleResGameDisplay = function (sel) {
  const cont = document.getElementById('res-game-container');
  if (sel.value === 'Partido') cont.classList.remove('hidden');
  else cont.classList.add('hidden');
};

window.submitReservation = function () {
  const name = document.getElementById('res-name').value;
  if (!name) return alert('Nombre requerido');

  const data = {
    customerName: name,
    pax: document.getElementById('res-pax').value,
    time: document.getElementById('res-time').value,
    vip: document.getElementById('res-vip').value,
    reason: document.getElementById('res-reason').value,
    game: document.getElementById('res-reason').value === 'Partido' ? document.getElementById('res-game').value : '',
    date: new Date().toLocaleDateString('en-CA') // Today
  };
  window.db.addReservation(data);
  document.getElementById('reservation-modal').classList.add('hidden');
};

// ==========================================
// MANAGER RESERVATIONS TAB (FULL CRUD)
// ==========================================
function renderManagerReservationsTab(container) {
  // Default Date: Today
  const todayStr = new Date().toLocaleDateString('en-CA');
  // Check if a date is already stored in a global/temp state or use today
  // For now, we'll just re-read the input if it exists, or default
  let currentDate = todayStr;
  const existingInput = document.getElementById('manager-date-filter');
  if (existingInput) currentDate = existingInput.value;

  container.innerHTML = `
      <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-black text-white italic tracking-tighter">ADMINISTRAR RESERVACIONES</h2>
          <button onclick="toggleReservationForm()" class="bg-yellow-600 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-black shadow-lg flex items-center gap-2 transform active:scale-95 transition">
            🎟️ CREAR RESERVACIÓN
          </button>
      </div>

      <!-- DATE FILTER FOR MANAGER -->
      <div class="bg-gray-800 p-4 rounded-xl mb-6 shadow-lg border border-gray-700">
        <label class="text-gray-400 text-xs font-bold uppercase mb-2 block">📅 Filtrar por Fecha:</label>
        <input type="date" id="manager-date-filter" 
               class="w-full bg-black border border-gray-600 rounded p-3 text-white font-bold focus:border-yellow-500 outline-none" 
               value="${currentDate}" 
               onchange="renderManagerReservationsTab(document.getElementById('manager-content'))">
      </div>

      <!-- INLINE RESERVATION FORM (ACCORDION STYLE) -->
      <div id="reservation-form-container" class="hidden bg-gray-900 border border-yellow-500/30 rounded-xl p-4 mb-6 shadow-2xl animate-fade-in relative">
          <div class="absolute top-0 left-0 w-1 h-full bg-yellow-500 rounded-l-xl"></div>
          <h3 class="text-lg font-black text-yellow-500 mb-4 flex items-center gap-2">
            📝 NUEVA RESERVACIÓN
          </h3>

          <div class="space-y-4">
              <div>
                <label class="block text-xs uppercase text-gray-400 font-bold mb-1">Nombre Cliente</label>
                <div class="relative">
                  <input type="text" id="res-name" 
                         class="w-full bg-black/50 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none font-bold placeholder-gray-600" 
                         placeholder="🔍 Buscar Cliente..." 
                         autocomplete="off"
                         onkeyup="searchCustomerForManager(this.value)">
                  
                  <!-- Search Results Container: RELATIVE to push content down, not absolute overlay -->
                  <div id="res-search-results" class="hidden w-full bg-black border border-yellow-500/50 rounded-lg mt-2 mb-4 overflow-hidden relative shadow-md"></div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs uppercase text-gray-400 font-bold mb-1">Fecha</label>
                  <input type="date" id="res-date" class="w-full bg-black/50 border border-gray-700 rounded p-3 text-white outline-none">
                </div>
                <div>
                  <label class="block text-xs uppercase text-gray-400 font-bold mb-1">Hora</label>
                  <input type="time" id="res-time" class="w-full bg-black/50 border border-gray-700 rounded p-3 text-white outline-none">
                </div>
              </div>

               <div class="grid grid-cols-2 gap-4">
                 <div>
                    <label class="block text-xs uppercase text-gray-400 font-bold mb-1">Pax</label>
                    <input type="number" id="res-pax" class="w-full bg-black/50 border border-gray-700 rounded p-3 text-white outline-none" value="2">
                 </div>
                 <div>
                    <label class="block text-xs uppercase text-gray-400 font-bold mb-1">Teléfono (10 dígitos)</label>
                    <input type="tel" id="res-phone" class="w-full bg-black/50 border border-gray-700 rounded p-3 text-white outline-none" placeholder="##########" maxlength="10">
                 </div>
              </div>

              <div>
                <label class="block text-xs uppercase text-gray-400 font-bold mb-1">Observaciones (Opcional)</label>
                <textarea id="res-notes" rows="2" maxlength="50" class="w-full bg-black/50 border border-gray-700 rounded p-3 text-white outline-none resize-none" placeholder="Ej. Mesa en terraza, cumpleaños... (Max 50)"></textarea>
              </div>

              <div>
                <label class="block text-xs uppercase text-gray-400 font-bold mb-1 flex justify-between">
                    Categoría VIP (Auto)
                    <span id="res-vip-display" class="text-yellow-500">Normal</span>
                </label>
                <!-- VIP BUTTONS REMOVED AS REQUESTED -->
                <input type="hidden" id="res-vip" value="">
                <p class="text-[10px] text-gray-500 mt-1 italic">* La categoría se asigna automáticamente al buscar el cliente.</p>
              </div>

              <div>
                <label class="block text-xs uppercase text-gray-400 font-bold mb-1">Motivo / Partido</label>
                <select id="res-reason" class="w-full bg-black/50 border border-gray-700 rounded p-3 text-white mb-2" onchange="toggleResGameDisplay(this)">
                  <option value="Casual">Casual / Comida</option>
                  <option value="Partido">Ver Partido</option>
                  <option value="Cumpleaños">Cumpleaños</option>
                  <option value="Negocios">Negocios</option>
                </select>

                <div id="res-game-container" class="hidden">
                  <select id="res-game" class="w-full bg-black/50 border border-gray-700 rounded p-3 text-white text-sm">
                    <!-- Populated dynamically -->
                  </select>
                </div>
              </div>

              <div class="flex gap-3 mt-4">
                 <button onclick="toggleReservationForm()" class="flex-1 bg-gray-800 text-gray-400 font-bold py-3 rounded-lg hover:bg-gray-700">CANCELAR</button>
                 <button onclick="submitManagerReservation()" class="flex-[2] bg-yellow-600 hover:bg-yellow-500 text-black font-black py-3 rounded-lg shadow-lg transform active:scale-95 transition">
                    💾 GUARDAR
                 </button>
              </div>
          </div>
      </div>

      <div id="manager-reservations-list" class="space-y-4 pb-24 overflow-y-auto" style="max-height: calc(100vh - 280px);">
        <!-- List injected via renderManagerReservations() logic but customized for full page -->
      </div>
    `;

  // Generate Game Options
  const gameSelect = container.querySelector('#res-game');
  if (window.generateGameOptions && gameSelect) {
    gameSelect.innerHTML = window.generateGameOptions('');
  }

  // Re-use the list renderer but point to our new container
  const listContainer = container.querySelector('#manager-reservations-list');

  const branchId = STATE.branch?.id;
  // Show ALL future reservations for the tab (or filter by date if we added that feature)
  // For now, Manager sees all, but let's sort by date/time
  let reservations = (window.db.getReservations && branchId)
    ? window.db.getReservations(branchId)
    : [];

  // FILTER BY SELECTED DATE from Input
  if (reservations.length > 0) {
    // Use the input value we captured at the start
    reservations = reservations.filter(r => r.date === currentDate);
  }

  if (reservations.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-12 opacity-50">
                <div class="text-6xl mb-4">📭</div>
                <p class="text-xl text-gray-400">No hay reservaciones para:<br><span class="text-yellow-500 font-bold">${currentDate}</span></p>
            </div>
      `;
  } else {
    // Sort: Date then Time
    reservations.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeVal = currentHours * 60 + currentMinutes;
    // Use the SELECTED DATE for "Today" comparison logic
    // If selected date != real today, we shouldn't show "late" status based on current time,
    // but for simplicity we kept the logic. Ideally we check if date === realToday.
    const realToday = new Date().toLocaleDateString('en-CA');

    listContainer.innerHTML = reservations.map(r => {
      // Traffic Light Logic (Same as Hostess)
      const [resH, resM] = r.time.split(':').map(Number);
      const resTimeVal = resH * 60 + resM;
      const diff = currentTimeVal - resTimeVal;

      let statusColor = 'border-green-500';
      let statusIcon = '🟢';
      let statusText = 'A Tiempo';

      // Only apply traffic light if looking at TODAY's reservations
      if (r.date === realToday) {
        if (diff > 30) {
          statusColor = 'border-red-600';
          statusIcon = '🔴';
          statusText = 'Vencida (>30min)';
        } else if (diff > 0) {
          statusColor = 'border-yellow-500';
          statusIcon = '🟡';
          statusText = 'Retraso Permitido';
        }
      } else if (r.date < realToday) {
        statusColor = 'border-red-900';
        statusIcon = '⚫';
        statusText = 'Fecha Pasada';
      }

      return `
      <div class="bg-gray-800 p-4 rounded-xl border-l-4 ${statusColor} shadow-lg relative animate-fade-in group">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-black text-xl uppercase tracking-tight text-white">${r.customerName}</span>
                            ${r.vip === 'diamond' ? '<span class="bg-blue-900 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500">DIAMOND</span>' : r.vip === 'blazin' ? '<span class="bg-orange-900 text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-500">BLAZIN</span>' : ''}
                        </div>

                        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-2">
                        <div class="flex items-center gap-1"><span class="text-white">📅</span> ${r.date} ${r.time}</div>
                        <div class="flex items-center gap-1"><span class="text-white">👥</span> ${r.pax} pax</div>
                        ${r.phone ? `<div class="flex items-center gap-1 text-blue-300"><span class="text-white">📞</span> ${r.phone}</div>` : ''}
                        </div>
                    </div>
                    
                     <div class="text-right">
                        <div class="text-xs font-bold text-gray-400 mb-1">${statusIcon} ${statusText}</div>
                        
                        <!-- MANAGER EXCLUSIVE: DELETE BUTTON -->
                        <button onclick="window.deleteReservation('${r.id}')" class="bg-red-900/20 text-red-500 p-2 rounded hover:bg-red-900/40 transition mt-1" title="Eliminar Reservación">
                            🗑️
                        </button>
                    </div>
                  </div>

                  <div class="text-sm text-gray-500 italic truncate max-w-[300px] mb-2">${r.game || r.reason || 'Sin motivo'}</div>
                  ${r.notes ? `<div class="bg-black/30 p-2 rounded text-xs text-yellow-200 mb-3 border border-yellow-900/30">📝 ${r.notes}</div>` : ''}
                  
                   <button onclick="checkInReservation('${r.id}')" class="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-2 rounded-lg shadow-md uppercase tracking-wide text-sm flex items-center justify-center gap-2 mt-2">
                        ✅ Check-In / Asignar Mesa
                   </button>
      </div>
    `}).join('');
  }
};

// NEW: Render Hostess Reservation List
window.renderHostessReservationList = function (dateFilter) {
  const listContainer = document.getElementById('hostess-reservations-list');
  if (!listContainer) return;

  // Default to today if no date provided
  if (!dateFilter) {
    dateFilter = new Date().toLocaleDateString('en-CA');
    const input = document.getElementById('hostess-date-filter');
    if (input) input.value = dateFilter;
  }

  const branchId = STATE.branch?.id;
  let reservations = (window.db.getReservations && branchId)
    ? window.db.getReservations(branchId)
    : [];

  if (reservations.length > 0) {
    reservations = reservations.filter(r => r.date === dateFilter);
  }

  if (reservations.length === 0) {
    listContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <div class="text-4xl mb-2">📅</div>
                <p>No hay reservaciones para: ${dateFilter}</p>
            </div>
        `;
    return;
  }

  reservations.sort((a, b) => a.time.localeCompare(b.time));
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeVal = currentHours * 60 + currentMinutes;
  const realToday = new Date().toLocaleDateString('en-CA');

  listContainer.innerHTML = reservations.map(r => {
    const [resH, resM] = r.time.split(':').map(Number);
    const resTimeVal = resH * 60 + resM;
    const diff = currentTimeVal - resTimeVal;

    let statusColor = 'border-green-500';
    let statusIcon = '🟢';
    let statusText = 'A Tiempo';

    if (r.date === realToday) {
      if (diff > 30) {
        statusColor = 'border-red-600';
        statusIcon = '🔴';
        statusText = 'Vencida (>30min)';
      } else if (diff > 0) {
        statusColor = 'border-yellow-500';
        statusIcon = '🟡';
        statusText = 'Retraso Permitido';
      }
    } else if (r.date < realToday) {
      statusColor = 'border-red-900';
      statusIcon = '⚫';
      statusText = 'Fecha Pasada';
    }

    return `
        <div class="bg-gray-800 p-4 rounded-xl border-l-4 ${statusColor} shadow-lg relative animate-fade-in group">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="flex items-center gap-2">
                         <span class="font-black text-lg text-white uppercase">${r.customerName}</span>
                         ${r.vip ? `<span class="bg-yellow-900 text-yellow-500 text-[10px] px-2 rounded border border-yellow-600 font-bold">${r.vip.toUpperCase()}</span>` : ''}
                    </div>
                    <div class="text-sm text-gray-400 mt-1 flex flex-wrap items-center gap-3">
                        <span>🕒 ${r.time}</span>
                        <span>👥 ${r.pax} pax</span>
                        ${r.phone ? `<span>📞 ${r.phone}</span>` : ''}
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xs font-bold text-gray-400 mb-1">${statusIcon} ${statusText}</div>
                    ${diff > 30 && r.date === realToday ? '<span class="text-[10px] text-red-400 font-bold">CANCELAR?</span>' : ''}
                </div>
            </div>

            ${r.notes ? `<div class="bg-black/30 p-2 rounded text-xs text-yellow-200 mb-3 border border-yellow-900/30">📝 ${r.notes}</div>` : ''}

            <button onclick="checkInReservation('${r.id}')" class="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-2 rounded-lg shadow-md uppercase tracking-wide text-sm flex items-center justify-center gap-2">
                ✅ Check-In / Asignar Mesa
            </button>
        </div>
        `;
  }).join('');
};

// Toggle Helper
window.toggleReservationForm = function () {
  const form = document.getElementById('reservation-form-container');
  form.classList.toggle('hidden');

  if (!form.classList.contains('hidden')) {
    // Reset form when opening
    document.getElementById('res-name').value = '';
    document.getElementById('res-date').value = new Date().toLocaleDateString('en-CA'); // Default Today
    document.getElementById('res-pax').value = '2';
    document.getElementById('res-time').value = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('res-phone').value = '';
    document.getElementById('res-notes').value = '';

    // Populate games
    const gameSelect = document.getElementById('res-game');
    if (window.generateGameOptions) {
      gameSelect.innerHTML = window.generateGameOptions('');
    }
  }
};

// ------ HOSTESS DASHBOARD (TABBED UI) ------
window.renderHostessDashboard = function () {
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = '';

  // FETCH DATA
  const waitlist = window.db.getWaitlist();
  const activeVisits = window.db.getVisits().filter(v => v.status === 'seated');
  const reservations = window.db.getReservations ? window.db.getReservations() : [];

  // Calculate stats
  const totalCapacity = 40;
  const currentCount = activeVisits.reduce((sum, v) => sum + parseInt(v.pax || 0), 0);

  const div = document.createElement('div');
  div.innerHTML = `
                <header class="bg-black/50 p-4 border-b border-gray-800 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
                  <div>
                    <h1 class="text-2xl font-black text-yellow-500 italic tracking-tighter">RECEPCIÓN</h1>
                    <div class="text-[10px] text-gray-400 font-mono tracking-widest">${STATE.branch ? STATE.branch.name.toUpperCase() : 'JURIQUILLA'}</div>
                  </div>
                  <div class="flex gap-2">
                    <button onclick="clearAppCache()" class="text-xs bg-orange-900 text-orange-200 px-3 py-1 rounded border border-orange-700 hover:bg-orange-800">🧹 Limpiar</button>
                    <button onclick="handleLogout()" class="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded border border-gray-700">CERRAR SESIÓN</button>
                  </div>
                </header>

                <!-- Stat Bar -->
                <div class="grid grid-cols-3 gap-2 p-2">
                  <div onclick="switchHostessTab('checkin')" class="bg-gray-900 border border-gray-800 p-2 rounded text-center cursor-pointer hover:bg-gray-800">
                    <div class="text-lg font-black text-white">📋</div>
                    <div class="text-[10px] text-gray-500 font-bold uppercase">Check-In</div>
                  </div>
                  <div onclick="switchHostessTab('tables')" class="bg-gray-900 border border-gray-800 p-2 rounded text-center cursor-pointer hover:bg-gray-800">
                    <div class="text-lg font-black text-yellow-500">${activeVisits.length}</div>
                    <div class="text-[10px] text-gray-500 font-bold uppercase">Mesas</div>
                  </div>
                  <div onclick="switchHostessTab('waitlist')" class="bg-gray-900 border border-gray-800 p-2 rounded text-center cursor-pointer hover:bg-gray-800">
                    <div class="text-lg font-black text-blue-500">${waitlist.length}</div>
                    <div class="text-[10px] text-gray-500 font-bold uppercase">Espera</div>
                  </div>
                </div>

                <!-- Tab Content: Check-In (Default) -->
  <div id="content-checkin" class="tab-content">
    <div class="card bg-gray-900/50 border border-yellow-500/30">
      <h2 class="text-xl font-black text-white mb-6 flex items-center gap-2">
        📋 NUEVO CHECK-IN
      </h2>

      <!-- Step 1: Customer Info -->
      <div class="space-y-4 mb-6">
        <label class="text-xs text-gray-500 mb-1 block uppercase font-bold tracking-widest">Paso 1: Datos del Cliente</label>

        <!-- Search Bar (New Client Flow) -->
        <div class="relative">
          <input type="text" id="customer-search"
            class="w-full bg-black border border-gray-700 rounded-lg p-4 text-white text-lg font-bold focus:border-yellow-500 outline-none"
            placeholder="🔍 Buscar Cliente (Nombre/Tel)" onkeyup="searchCustomer(this.value)">

            <div id="search-results" class="hidden absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-lg mt-1 z-50 max-h-60 overflow-y-auto shadow-2xl"></div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <input type="text" id="h-firstname" placeholder="NOMBRE" class="bg-gray-900 text-white border border-gray-700 rounded p-4 uppercase font-bold text-sm tracking-wide">
            <input type="text" id="h-lastname" placeholder="APELLIDO PATERNO" class="bg-gray-900 text-white border border-gray-700 rounded p-4 uppercase font-bold text-sm tracking-wide">
            </div>
            <input type="text" id="h-lastname2" placeholder="APELLIDO MATERNO (Opcional)" class="bg-gray-900 text-white border border-gray-700 rounded p-4 uppercase font-bold text-sm tracking-wide w-full">

              <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div class="flex justify-between items-center">
                  <span class="text-gray-400 text-sm font-bold uppercase">PERSONAS:</span>
                  <div class="flex items-center gap-4">
                    <button onclick="adjustPax(-1)" class="w-10 h-10 rounded-full bg-gray-700 text-white font-bold hover:bg-gray-600">-</button>
                    <span id="h-pax" class="text-2xl font-black text-white">2</span>
                    <button onclick="adjustPax(1)" class="w-10 h-10 rounded-full bg-gray-700 text-white font-bold hover:bg-gray-600">+</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 2: Assign Table -->
            <div class="space-y-4">
              <label class="text-xs text-gray-500 mb-1 block uppercase font-bold tracking-widest">Paso 2: Asignación</label>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-[10px] text-gray-500 mb-1 block uppercase">Mesa #</label>
                  <input type="number" id="h-table" class="w-full bg-gray-900 text-white border border-gray-700 rounded p-4 text-center font-bold text-xl focus:border-green-500 outline-none" placeholder="#">
                </div>
                <div>
                  <label class="text-[10px] text-gray-500 mb-1 block uppercase">Mesero</label>
                  <select id="h-waiter" class="w-full bg-gray-900 text-white border border-gray-700 rounded p-4 font-bold text-sm h-[62px]">
                    <option value="">Auto-Asignar</option>
                    ${window.db.data.users.filter(u => u.role === 'waiter' && (!u.branchId || u.branchId === STATE.branch.id)).map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
                  </select>
                </div>
              </div>

              <button onclick="processHostessCheckIn()" class="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-5 rounded-xl uppercase tracking-widest text-lg shadow-lg transform active:scale-95 transition mt-4">
                ✅ INGRESAR MESA
              </button>

              <button onclick="addToWaitlist()" class="w-full bg-gray-800 border-2 border-gray-700 text-white font-bold py-3 rounded-lg uppercase tracking-widest text-sm hover:border-blue-500 transition mt-2">
                ⏱️ Agregar a Lista de Espera
              </button>
            </div>
        </div>
      </div>

      <!-- Tab Content: Tables (Active Visits) -->
      <div id="content-tables" class="tab-content hidden pb-24">
        <div class="card">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-black text-white italic tracking-tighter">MESAS HABILITADAS</h2>

            <div class="text-right">
              <div class="text-yellow-500 font-bold text-xl leading-none">${currentCount} / ${totalCapacity}</div>
              <div class="text-[10px] text-gray-400 uppercase tracking-widest">Ocupación</div>
            </div>
          </div>

          <!-- Filter -->
          <div class="mb-4">
            <select id="filter-waiter" onchange="filterTablesByWaiter()" class="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-white font-bold">
              <option value="all">👁️ Ver Todas</option>
              ${window.db.data.users.filter(u => u.role === 'waiter' && (!u.branchId || u.branchId === STATE.branch.id)).map(w => `<option value="${w.id}">Mesero: ${w.name}</option>`).join('')}
            </select>
          </div>

          ${activeVisits.length === 0 ? `
          <div class="text-center py-12 text-gray-500">
             <div class="text-6xl mb-4">🍽️</div>
             <p>No hay mesas activas</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${activeVisits.map(v => {
    const waiterName = window.db.data.users.find(w => w.id === v.waiterId)?.name || 'Sin Asignar';
    const timeSeated = new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
              <div class="table-card bg-gray-900 border-l-4 border-green-500 rounded-r-xl p-4 shadow-lg relative animate-fade-in" data-waiter-id="${v.waiterId}">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="text-3xl font-black text-white shadow-text">#${v.table}</span>
                        <div class="text-xs text-gray-400 font-mono mt-1">🕒 ${timeSeated}</div>
                    </div>
                    <div class="text-right">
                        <div class="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300 border border-gray-700 mb-1 inline-block">
                           👤 ${waiterName.split(' ')[0]}
                        </div>
                        <div class="text-xl font-bold text-white">${v.pax} <span class="text-sm font-normal text-gray-500">pax</span></div>
                    </div>
                </div>
                
                <div class="border-t border-gray-800 pt-3 mt-2">
                    <div class="font-bold text-white text-lg truncate mb-1">${v.customerName}</div>
                    ${v.vip ? `<div class="inline-block bg-yellow-600/20 text-yellow-500 text-[10px] px-2 py-0.5 rounded border border-yellow-600/50 mb-2 font-bold tracking-wider">VIP ${v.vip.toUpperCase()}</div>` : ''}
                    
                    <button onclick="document.getElementById('edit-visit-${v.id}').classList.toggle('hidden')" class="w-full text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 py-2 rounded mt-2 border border-gray-700 transition">
                       ⚡ GESTIONAR
                    </button>
                    
                    <!-- Hidden Editor -->
                    <div id="edit-visit-${v.id}" class="hidden mt-3 space-y-2 bg-black/20 p-2 rounded border border-gray-800">
                        <!-- Cambio Mesa -->
                        <div class="bg-black/40 p-3 rounded-lg border border-gray-800">
                            <div class="text-[10px] text-gray-500 uppercase font-bold mb-2">Cambiar Mesa</div>
                            <div class="flex gap-2">
                               <input type="number" id="new-table-${v.id}" placeholder="#" class="bg-gray-900 text-white border border-gray-700 rounded p-3 w-full text-center font-bold text-lg" min="1">
                               <button onclick="doChangeTable('${v.id}')" class="bg-blue-600 text-white rounded px-4 font-bold hover:bg-blue-500 text-xl">✓</button>
                            </div>
                        </div>
                        <!-- Cambio Mesero -->
                         <div class="bg-black/40 p-3 rounded-lg border border-gray-800">
                            <div class="text-[10px] text-gray-500 uppercase font-bold mb-2">Cambiar Mesero</div>
                            <div class="flex gap-2">
                               <select id="new-waiter-${v.id}" class="bg-gray-900 text-white border border-gray-700 rounded p-3 w-full text-sm font-bold truncate">
                                  ${window.db.data.users.filter(u => u.role === 'waiter' && (!u.branchId || u.branchId === STATE.branch.id)).map(w => `<option value="${w.id}" ${w.id === v.waiterId ? 'selected' : ''}>${w.name}</option>`).join('')}
                               </select>
                               <button onclick="doChangeWaiter('${v.id}')" class="bg-blue-600 text-white rounded px-4 font-bold hover:bg-blue-500 text-xl">✓</button>
                            </div>
                        </div>
                    </div>

                    <button onclick="window.confirmAndRelease('${v.id}')"
                        class="w-full bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-700/50 font-bold py-3 rounded-lg mb-4 uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                        🆓 FINALIZAR VISITA / LIBERAR MESA
                    </button>
                </div>
                
                <div id="table-status-${v.id}" class="hidden mt-2 p-3 rounded text-center text-lg font-bold animate-pulse text-yellow-400"></div>
              </div>
            `}).join('')}
          </div>
        `}
        </div>
      </div>

      <!-- Tab Content: Waitlist - TAB SEPARADO -->
      <div id="content-waitlist" class="tab-content hidden">
        <div class="card">
          <h3 class="text-xl mb-4">Cola de Espera (${waitlist.length})</h3>
          ${waitlist.length === 0 ? `
          <div class="text-center py-12">
            <div class="text-6xl mb-4">⏱️</div>
            <p class="text-xl text-secondary">No hay clientes en espera</p>
            <p class="text-sm text-secondary mt-2">Usa "Agregar a Lista de Espera" desde Check-In</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${waitlist.map((entry, idx) => `
              <div class="bg-yellow-900/20 border-2 border-yellow-500 p-4 rounded-lg hover:bg-yellow-900/30 transition">
                <div class="flex items-start gap-3 mb-3">
                  <span class="bg-yellow-500 text-black w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                    ${idx + 1}
                  </span>
                  <div class="flex-1">
                    <div class="font-bold text-xl mb-1">${entry.customerName}</div>
                    <div class="text-base text-gray-300">${entry.pax} personas</div>
                    <div class="text-sm text-gray-400">${entry.phone || 'Sin teléfono'}</div>
                    <div class="text-xs text-gray-500 mt-1">🕐 ${new Date(entry.addedAt).toLocaleTimeString()}</div>
                  </div>
                </div>
                <!-- ASIGNACIÓN INLINE -->
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <input type="number" id="wl-table-${entry.id}" placeholder="Mesa #" 
                         class="p-2 text-xl bg-gray-900 rounded font-bold text-center border border-green-600" 
                         style="min-width: 80px;" min="1">
                  <select id="wl-waiter-${entry.id}" class="p-2 text-sm bg-gray-900 rounded font-bold border border-green-600">
                    <option value="">Mesero</option>
                    ${window.db.data.users.filter(u => u.role === 'waiter' && (!u.branchId || u.branchId === STATE.branch.id)).map(w =>
      `<option value="${w.id}">${w.name}</option>`
    ).join('')}
                  </select>
                </div>
                <!-- BOTONES DE ACCIÓN -->
                <div class="flex gap-2">
                  <button onclick="doAssignFromWaitlist('${entry.id}')" 
                          class="btn-primary flex-1 text-base py-3 font-bold">
                    ✅ ASIGNAR
                  </button>
                  <button onclick="removeFromWaitlist('${entry.id}')" 
                          class="btn-secondary text-sm px-3 py-2 bg-red-900 hover:bg-red-800 whitespace-nowrap">
                    ❌
                  </button>
                </div>
                <!-- STATUS MESSAGE -->
                <div id="wl-status-${entry.id}" class="hidden mt-2 p-2 rounded text-center text-sm font-bold"></div>
              </div>
            `).join('')}
          </div>
        `}
        </div>
      </div>

      <!-- Tab Content: Reservations -->
      <div id="content-reservations" class="tab-content hidden pb-24">
        <div class="card">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-white">Reservaciones</h3>
                <input type="date" id="hostess-date-filter" class="bg-gray-800 text-white border border-gray-700 rounded p-2 text-sm font-bold" value="${new Date().toLocaleDateString('en-CA')}" onchange="renderHostessReservationList(this.value)">
            </div>
            
            <div id="hostess-reservations-list" class="space-y-3">
                <!-- Injected via renderHostessReservationList -->
            </div>
        </div>
      </div>

      <!-- BOTTOM NAVIGATION BAR -->
      <nav class="bottom-nav">
        <button onclick="switchHostessTab('checkin')" id="tab-checkin" class="bottom-nav-item active" style="position: relative;">
          <span class="bottom-nav-icon">📋</span>
          <span class="bottom-nav-label">Check-In</span>
        </button>
        <button onclick="switchHostessTab('tables')" id="tab-tables" class="bottom-nav-item" style="position: relative;">
          <span class="bottom-nav-icon">🍽️</span>
          <span class="bottom-nav-label">Mesas</span>
          ${activeVisits.length > 0 ? `<span class="bottom-nav-badge">${activeVisits.length}</span>` : ''}
        </button>
        <button onclick="switchHostessTab('waitlist')" id="tab-waitlist" class="bottom-nav-item" style="position: relative;">
          <span class="bottom-nav-icon">⏱️</span>
          <span class="bottom-nav-label">Espera</span>
          ${waitlist.length > 0 ? `<span class="bottom-nav-badge">${waitlist.length}</span>` : ''}
        </button>
        <button onclick="switchHostessTab('reservations')" id="tab-reservations" class="bottom-nav-item" style="position: relative;">
          <span class="bottom-nav-icon">📅</span>
          <span class="bottom-nav-label">Reservas</span>
          ${reservations.length > 0 ? `<span class="bottom-nav-badge">${reservations.length}</span>` : ''}
        </button>
      </nav>

      <!-- DuckOS Footer -->
      <div class="dashboard-footer">
        Powered by <span style="color: #F97316;">DuckOS</span> | Bar & Restaurant Solutions
      </div>
      `;

  // Add class for bottom nav padding
  div.className = 'p-4 max-w-6xl mx-auto has-bottom-nav';
  appContainer.appendChild(div);
}

// ==========================================
// ==========================================
// VERSION CHECK & AUTO-RELOAD
// ==========================================
const CURRENT_VERSION = '22.39';
const storedVersion = localStorage.getItem('app_version');

if (storedVersion && storedVersion !== CURRENT_VERSION) {
  console.log(`🔄 Version mismatch: ${storedVersion} → ${CURRENT_VERSION}. Clearing cache...`);

  // Clear localStorage except auth
  const authData = localStorage.getItem('adanEvaAuth');
  localStorage.clear();
  if (authData) localStorage.setItem('adanEvaAuth', authData);

  // Set new version
  localStorage.setItem('app_version', CURRENT_VERSION);

  // Force reload
  window.location.reload(true);
}

// Set version on first load
if (!storedVersion) {
  localStorage.setItem('app_version', CURRENT_VERSION);
}

// ==========================================
// EMERGENCY CACHE CLEAR (AVAILABLE IMMEDIATELY)
// ==========================================
window.emergencyCacheClear = function () {
  console.log('🚨 EMERGENCY CACHE CLEAR');

  // Save auth
  const authData = localStorage.getItem('adanEvaAuth');

  // Nuclear option: clear everything
  localStorage.clear();
  sessionStorage.clear();

  // Restore auth
  if (authData) {
    localStorage.setItem('adanEvaAuth', authData);
  }
  localStorage.setItem('app_version', '22.31');

  // Clear IndexedDB
  if (window.indexedDB) {
    indexedDB.databases().then(dbs => {
      dbs.forEach(db => {
        indexedDB.deleteDatabase(db.name);
        console.log('🗑️ Deleted:', db.name);
      });
    }).catch(e => console.warn('IndexedDB error:', e));
  }

  alert('✅ Caché eliminado completamente.\n\nRecargando...');
  setTimeout(() => window.location.reload(true), 500);
};

// ==========================================
// INITIALIZATION
// ==========================================
window.initApp = async function () {
  console.log('🚀 Initializing App...');

  // 1. Initialize DB
  if (!window.db) {
    console.error('❌ Database not found!');
    appContainer.innerHTML = '<div class="text-white p-10">Error critic: Base de datos no encontrada.</div>';
    return;
  }

  // 2. Auth Listener
  window.db.auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log('👤 User Authenticated:', user.uid);
      // Check existing user in local DB or fetch
      const dbUser = window.db.data.users.find(u => u.id === user.uid);
      if (dbUser) {
        STATE.user = dbUser;
        STATE.branch = window.db.data.branches.find(b => b.id === dbUser.branchId);
        console.log('🏢 Branch:', STATE.branch);

        // Render Dashboard based on Role
        if (STATE.user.role === 'hostess') {
          // START LISTENER FOR VISITS
          window.db.subscribeToVisits((visits) => {
            if (typeof renderHostessDashboard === 'function') renderHostessDashboard();
          });
          renderHostessDashboard();
        } else if (STATE.user.role === 'manager' || STATE.user.role === 'admin') {
          if (typeof renderManagerDashboard === 'function') renderManagerDashboard('home');
        } else if (STATE.user.role === 'waiter') {
          if (typeof renderWaiterDashboard === 'function') renderWaiterDashboard();
        } else {
          appContainer.innerHTML = '<div class="text-white">Rol desconocido</div>';
        }
      } else {
        console.error('User not found in local DB data');
        if (typeof renderLogin === 'function') renderLogin();
      }
    } else {
      console.log('👤 No User. Rendering Login.');
      if (typeof renderLogin === 'function') renderLogin();
    }
  });
};

// Start
document.addEventListener('DOMContentLoaded', window.initApp);

// NEW: Render Game Requests
function renderManagerGameRequests(container) {
  if (!container) return;

  const requests = window.db.getDailyInfo().gameRequests || [];

  if (requests.length === 0) {
    container.innerHTML = '<p class="text-gray-600 text-xs italic text-center py-4">No hay solicitudes activas.</p>';
    return;
  }

  container.innerHTML = requests.map((r) => `
      <div class="bg-gray-800 p-3 rounded-lg border-l-4 border-blue-500 mb-2 flex justify-between items-center animate-fade-in">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-blue-400 font-bold text-[10px] uppercase tracking-wider">SOLICITUD DE PARTIDO</span>
            <span class="text-xs text-gray-500">• ${r.time}</span>
          </div>
          <div class="font-bold text-white text-base">
            ${r.gameName}
          </div>
          <div class="text-xs text-secondary mt-1">
            Mesa ${r.tableName} (${r.waiterName})
          </div>
        </div>
        <div>
          <button onclick="window.db.removeGameRequest('${r.id}')" class="bg-red-900/30 hover:bg-red-900/50 text-red-400 p-2 rounded-full transition-colors">
            ✕
          </button>
        </div>
      </div>
      `).join('');
}

// NEW: Render Reservations (Real Data)
function renderManagerReservations(container) {
  if (!container) return;

  const branchId = STATE.branch?.id;
  const today = new Date().toISOString().split('T')[0];
  const reservations = (window.db.getReservations && branchId)
    ? window.db.getReservations(branchId, today)
    : [];

  if (reservations.length === 0) {
    container.innerHTML = '<p class="text-gray-600 text-xs italic text-center py-4">No hay reservaciones para hoy.</p>';
    return;
  }

  container.innerHTML = reservations.map(r => `
      <div class="bg-gray-800 p-3 rounded-lg border-l-4 ${r.vip ? 'border-yellow-500' : 'border-gray-600'} flex justify-between items-center mb-2">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-white text-base">${r.customerName || 'Cliente'}</span>
            ${r.vip === 'diamond' ? '💎' : r.vip === 'blazin' ? '🔥' : ''}
          </div>
          <div class="text-xs text-gray-400">
            ${r.date || 'Hoy'} • ${r.time || '--:--'} • ${r.pax || 2} Pax
          </div>
          <div class="text-xs text-blue-300 mt-1">
            🎯 ${r.notes || '---'}
          </div>
        </div>
      </div>
      `).join('');
}

// ==========================================
// CACHE CLEAR FUNCTION (FOR MOBILE)
// ==========================================
window.clearAppCache = function () {
  if (!confirm('🧹 ¿Limpiar caché y datos locales?\n\nEsto borrará:\n- Datos en caché\n- Configuración local\n\nTu sesión se mantendrá activa.')) {
    return;
  }

  console.log('🧹 Clearing app cache...');

  // Save auth data
  const authData = localStorage.getItem('adanEvaAuth');

  // Clear localStorage
  localStorage.clear();
  console.log('✅ localStorage cleared');

  // Restore auth
  if (authData) {
    localStorage.setItem('adanEvaAuth', authData);
    localStorage.setItem('app_version', '22.30');
  }

  // Clear sessionStorage
  sessionStorage.clear();
  console.log('✅ sessionStorage cleared');

  // Clear IndexedDB (Firebase offline data)
  if (window.indexedDB) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        if (db.name.includes('firestore') || db.name.includes('firebase')) {
          indexedDB.deleteDatabase(db.name);
          console.log('✅ Deleted IndexedDB:', db.name);
        }
      });
    }).catch(e => console.warn('IndexedDB clear failed:', e));
  }

  alert('✅ Caché limpiado.\n\nLa página se recargará ahora.');

  // Force reload
  window.location.reload(true);
};

// ==========================================
// MANAGER RESERVATION LOGIC (v22.4)
// ==========================================
window.submitManagerReservation = function () {
  const name = document.getElementById('res-name').value;
  const date = document.getElementById('res-date').value; // NEW
  const time = document.getElementById('res-time').value;
  const pax = document.getElementById('res-pax').value;
  const phone = document.getElementById('res-phone').value; // NEW
  const notes = document.getElementById('res-notes').value; // NEW
  const vip = document.getElementById('res-vip').value;
  const reason = document.getElementById('res-reason').value;
  const game = document.getElementById('res-game').value;

  if (!name || !date || !time) {
    alert('Por favor complete nombre, fecha y hora.');
    return;
  }

  // AUTH GATE FOR NON-VIP
  if (!vip) {
    const password = prompt("⚠️ Cliente SIN Categoría VIP.\n\nPara autorizar excepcionalmente esta reservación, ingrese su CONTRASEÑA DE GERENTE:");

    // Check against current user's password
    if (password !== STATE.user.password) {
      alert("⛔ CONTRASEÑA INCORRECTA. No se puede crear la reservación.");
      return;
    }
  }

  const data = {
    id: Date.now().toString(),
    customerName: name,
    pax: pax,
    phone: phone, // NEW
    time: time,
    date: date, // NEW (Overrides 'today' default)
    notes: notes, // NEW
    vip: vip,
    reason: reason,
    game: reason === 'Partido' ? game : '',
    status: 'active',
    branchId: STATE.branch ? STATE.branch.id : 'branch-1'
  };

  if (window.db && window.db.addReservation) {
    window.db.addReservation(data);
    alert("✅ Reservación creada exitosamente.");
    toggleReservationForm();

    // Simplified Refresh
    if (typeof window.renderManagerDashboard === 'function') {
      window.renderManagerDashboard('reservations');
    } else {
      window.location.reload();
    }
  } else {
    alert("Error de DB");
  }
};

// NEW: Render Hostess Reservation List
window.renderHostessReservationList = function (dateFilter) {
  const listContainer = document.getElementById('hostess-reservations-list');
  if (!listContainer) return;

  // Default to today if no date provided
  if (!dateFilter) {
    // Use local date string matching Manager's format
    dateFilter = new Date().toLocaleDateString('en-CA');

    // Update input if exists
    const input = document.getElementById('hostess-date-filter');
    if (input) input.value = dateFilter;
  }

  const branchId = STATE.branch?.id;
  // Get ALL reservations (don't filter by branch yet, reservations don't have branchId)
  let reservations = window.db.getReservations ? window.db.getReservations() : [];

  // Filter by date and exclude completed/cancelled
  reservations = reservations.filter(r =>
    r.date === dateFilter &&
    r.status !== 'completed' &&
    r.status !== 'cancelled'
  );

  if (reservations.length === 0) {
    listContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <div class="text-4xl mb-2">📅</div>
                <p>No hay reservaciones para esta fecha</p>
            </div>
        `;
    return;
  }

  // Sort by time
  reservations.sort((a, b) => a.time.localeCompare(b.time));

  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeVal = currentHours * 60 + currentMinutes;

  listContainer.innerHTML = reservations.map(r => {
    // Traffic Light Logic
    // Parse reservation time "HH:MM"
    const [resH, resM] = r.time.split(':').map(Number);
    const resTimeVal = resH * 60 + resM;
    const diff = currentTimeVal - resTimeVal; // Positive if late

    let statusColor = 'border-green-500'; // Default Green (On Time / Future)
    let statusIcon = '🟢';
    let statusText = 'A Tiempo';

    // Logic: 
    // If diff > 30 mins -> RED (Expired)
    // If diff > 0 and <= 30 mins -> YELLOW (Delayed but valid)
    // If diff <= 0 -> GREEN (On Time)

    // Only apply if looking at TODAY
    const isToday = dateFilter === new Date().toLocaleDateString('en-CA');

    if (isToday) {
      if (diff > 30) {
        statusColor = 'border-red-600';
        statusIcon = '🔴';
        statusText = 'Vencida (>30min)';
      } else if (diff > 0) {
        statusColor = 'border-yellow-500';
        statusIcon = '🟡';
        statusText = 'Retraso Permitido';
      }
    }

    return `
        <div class="bg-gray-800 p-4 rounded-xl border-l-4 ${statusColor} shadow-lg relative animate-fade-in group">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="flex items-center gap-2">
                         <span class="font-black text-lg text-white uppercase">${r.customerName}</span>
                         ${r.vip ? `<span class="bg-yellow-900 text-yellow-500 text-[10px] px-2 rounded border border-yellow-600 font-bold">${r.vip.toUpperCase()}</span>` : ''}
                    </div>
                    <div class="text-sm text-gray-400 mt-1 flex flex-wrap items-center gap-3">
                        <span>🕒 ${r.time}</span>
                        <span>👥 ${r.pax} pax</span>
                        ${r.phone ? `<span>📞 ${r.phone}</span>` : ''}
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xs font-bold text-gray-400 mb-1">${statusIcon} ${statusText}</div>
                    ${diff > 30 && isToday ? '<span class="text-[10px] text-red-400 font-bold">CANCELAR?</span>' : ''}
                </div>
            </div>

            ${r.notes ? `<div class="bg-black/30 p-2 rounded text-xs text-yellow-200 mb-3 border border-yellow-900/30">📝 ${r.notes}</div>` : ''}

            <button onclick="checkInReservation('${r.id}')" class="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-2 rounded-lg shadow-md uppercase tracking-wide text-sm flex items-center justify-center gap-2">
                ✅ Check-In / Asignar Mesa
            </button>
        </div>
        `;
  }).join('');
};

// Check-In Reservation (Populate Hostess Form)
window.checkInReservation = function (resId) {
  const branchId = STATE.branch?.id;
  // Get ALL reservations to find by ID
  const allRes = window.db.getReservations(branchId);
  const res = allRes.find(r => r.id === resId);

  if (!res) return alert("Error: Reservación no encontrada");

  // Switch to Check-In Tab
  switchHostessTab('checkin');

  // Pre-fill Form (with null checks)
  const firstNameInput = document.getElementById('h-firstname');
  const lastNameInput = document.getElementById('h-lastname');

  if (!firstNameInput || !lastNameInput) {
    console.error('❌ Hostess form not found. Are you in Hostess view?');
    return alert('Error: Esta función solo está disponible en el dashboard de Hostess');
  }

  firstNameInput.value = res.customerName.split(' ')[0] || '';
  lastNameInput.value = res.customerName.split(' ')[1] || '';

  // Fill Pax
  const paxDisplay = document.getElementById('h-pax');
  if (paxDisplay) paxDisplay.innerText = res.pax;

  // Fill Search Input as visual cue
  const searchInput = document.getElementById('customer-search');
  if (searchInput) searchInput.value = res.customerName;

  // Toast
  if (window.showToast) window.showToast(`✅ Datos de ${res.customerName} cargados`, 'success');
};

// Start Hostess Tab Switcher
window.switchHostessTab = function (tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));

  const target = document.getElementById('content-' + tabName);
  const navItem = document.getElementById('tab-' + tabName);

  if (target) target.classList.remove('hidden');
  if (navItem) navItem.classList.add('active');

  // Init Logic
  if (tabName === 'reservations') {
    renderHostessReservationList();
  }
};

// ==========================================
// HOSTESS CHECK-IN PROCESS (FIX: READ FROM DOM + MATERNAL SURNAME)
// ==========================================
window.processHostessCheckIn = function (tableNumberArg, waiterIdArg) {
  // 1. Get Values (Argument OR DOM)
  const tableNumber = tableNumberArg || document.getElementById('h-table').value;
  const waiterId = waiterIdArg || document.getElementById('h-waiter').value;

  // 2. Validate Inputs
  if (!tableNumber || !waiterId) {
    alert("Por favor selecciona una Mesa y un Mesero.");
    return;
  }

  const branchId = STATE.branch?.id;
  // Check if table is occupied
  if (window.db.isTableOccupied(tableNumber, branchId)) {
    alert(`❌ La Mesa ${tableNumber} ya está ocupada.`);
    return;
  }

  // 3. Gather Data from Hostess Form
  const firstName = document.getElementById('h-firstname').value.toUpperCase();
  const lastName1 = document.getElementById('h-lastname').value.toUpperCase();
  const lastName2 = document.getElementById('h-lastname2') ? document.getElementById('h-lastname2').value.toUpperCase() : '';

  // Combine Last Names
  const fullLastName = `${lastName1} ${lastName2}`.trim();

  const pax = parseInt(document.getElementById('h-pax').innerText) || 2;

  if (!firstName) {
    alert("Falta el nombre del cliente.");
    return;
  }

  // 4. Find or Create Customer
  // Check by full name composition
  const fullNameQuery = `${firstName} ${fullLastName}`.trim();

  let customer = window.db.data.customers.find(c =>
    (c.firstName + ' ' + c.lastName).toLowerCase() === fullNameQuery.toLowerCase()
  );

  if (!customer) {
    customer = window.db.createCustomer({
      firstName,
      lastName: fullLastName,
      phone: '',
      email: '',
      branchId
    });
  } else {
    // Update existing if needed (optional, maybe just update last visit)
  }

  // 5. Create Visit
  const visitData = {
    branchId,
    table: tableNumber,
    waiterId,
    customerId: customer.id,
    pax,
    startTime: new Date().toISOString(),
    date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
    orders: [],
    totalAmount: 0
  };

  const newVisit = window.db.createVisit(visitData);

  // 6. If this came from a Reservation, MARK IT AS COMPLETED
  const todayStr = new Date().toLocaleDateString('en-CA');
  const pendingRes = window.db.getReservations().find(r =>
    r.customerName.toLowerCase() === fullNameQuery.toLowerCase() &&
    r.date === todayStr &&
    r.status !== 'completed' &&
    r.status !== 'cancelled'
  );

  if (pendingRes) {
    // Update reservation status to completed
    window.db.updateReservation(pendingRes.id, { status: 'completed', completedAt: new Date().toISOString() });
    console.log('✅ Reservation marked as completed:', pendingRes.id);

    // Refresh reservation list immediately
    if (window.renderHostessReservationList) {
      setTimeout(() => {
        window.renderHostessReservationList();
      }, 100);
    }
  }

  // 7. Clear Form
  document.getElementById('h-firstname').value = '';
  document.getElementById('h-lastname').value = '';
  if (document.getElementById('h-maternal')) document.getElementById('h-maternal').value = '';
  document.getElementById('h-table').value = '';
  document.getElementById('h-waiter').value = '';
  document.getElementById('h-pax').innerText = '1';

  // 8. Switch to Tables Tab
  switchHostessTab('tables');

  alert(`✅ Mesa ${tableNumber} asignada a ${fullNameQuery}`);
};
