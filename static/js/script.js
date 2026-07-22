const API_URL = ""; 

// Ultra-bezpieczne czyszczenie "null" w LocalStorage
let token = localStorage.getItem('jwt_token');
if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    token = null;
    localStorage.removeItem('jwt_token');
}

let currentUser = null;
try {
    const userStr = localStorage.getItem('current_user');
    if (userStr && userStr !== 'null' && userStr !== 'undefined' && userStr.trim() !== '') {
        currentUser = JSON.parse(userStr);
    } else {
        localStorage.removeItem('current_user');
    }
} catch (e) { 
    currentUser = null; 
    localStorage.removeItem('current_user');
}

let currentActiveLobbyId = localStorage.getItem('active_lobby_id');
if (!currentActiveLobbyId || currentActiveLobbyId === 'null' || currentActiveLobbyId === 'undefined') {
    currentActiveLobbyId = null;
    localStorage.removeItem('active_lobby_id');
}

let autoKickInterval = null; 
let lobbyRefreshInterval = null; 
let liveTimerInterval = null;

const POLISH_CITIES = [
    "Rzeszów", "Warszawa", "Kraków", "Wrocław", 
    "Poznań", "Gdańsk", "Łódź", "Katowice", 
    "Lublin", "Szczecin", "Białystok", "Bydgoszcz", 
    "Gdynia", "Częstochowa", "Radom", "Toruń"
];

window.onload = () => {
    updateAuthUI();
    handleInviteLink();
    
    // Obsługa linku do resetowania hasła z e-maila
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset_token');
    
    if (resetToken) {
        document.getElementById('resetTokenHidden').value = resetToken;
        switchView('view-new-password');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }
    
    // Gwarancja braku zjawiska "wpierdala do login page po refreshu"
    if (token && currentUser) {
        if (currentActiveLobbyId) {
            switchView('view-lobby');
        } else if (localStorage.getItem('pending_invite_game')) {
            switchView('view-home');
        } else {
            switchView('view-profile');
        }
    } else {
        switchView('view-login');
    }
    
    updateFacultyOptions();
    renderModalCities();
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === "password" ? "text" : "password";
}

function switchView(viewId) {
    if (viewId === 'view-home' && currentActiveLobbyId) {
        viewId = 'view-lobby';
    }

    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const btnMap = { 
        'view-login': 'nav-login', 'view-register': 'nav-register', 
        'view-home': 'nav-home', 'view-lobby': 'nav-lobby', 
        'view-profile': 'nav-profile', 'view-leaderboard': 'nav-leaderboard',
        'view-rules': 'nav-rules', 'view-achievements': 'nav-achievements'
    };
    
    if(document.getElementById(btnMap[viewId])) {
        document.getElementById(btnMap[viewId]).classList.add('active');
    }
    
    if(viewId === 'view-leaderboard') fetchLeaderboard();
    if(viewId === 'view-profile') loadProfileData();
    if(viewId === 'view-home') fetchActiveGames(); 
    if(viewId === 'view-lobby') updateLobbyUIState();
}

function showToast(message, type = "success") {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `show ${type}`;
    setTimeout(() => toast.className = "", 3000);
}

function handleApiError(res, data) {
    if (res.status === 401 || res.status === 422) {
        logout();
        showToast("Sesja wygasła. Zaloguj się ponownie.", "error");
        return;
    }
    // Obsługa błędu unikalności nicku, jeśli baza wyrzuci 500 (lub zmienisz na 409 w apce)
    if (data?.error && data.error.includes("name") && data.error.includes("UNIQUE")) {
        showToast("Ten Nick (Imię) jest już zajęty! Wybierz inny.", "error");
        return;
    }
    
    const errorText = data?.error || data?.message || data?.msg || `Wystąpił błąd (${res.status})`;
    showToast(errorText, "error");
}

function updateAuthUI() {
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    const navAuth = document.getElementById('nav-auth');
    const navUnauth = document.getElementById('nav-unauth');
    
    if (token && currentUser) {
        userInfo.textContent = `Witaj, ${currentUser.name}`;
        userInfo.style.display = 'block';
        logoutBtn.style.display = 'block';
        navAuth.style.display = 'flex';
        navUnauth.style.display = 'none';
    } else {
        userInfo.style.display = 'none';
        logoutBtn.style.display = 'none';
        navAuth.style.display = 'none';
        navUnauth.style.display = 'flex';
    }
}

function loadProfileData() {
    if(!currentUser) return;
    document.getElementById('profId').textContent = currentUser.player_id;
    document.getElementById('profName').textContent = currentUser.name;
    document.getElementById('profEmail').textContent = currentUser.email;
    document.getElementById('profUni').textContent = currentUser.university || "Brak danych";
    document.getElementById('profFac').textContent = currentUser.faculty || "Brak danych";
    document.getElementById('profPlayed').textContent = currentUser.games_played;
    document.getElementById('profWon').textContent = currentUser.games_won;
    
    let played = parseInt(currentUser.games_played) || 0;
    let won = parseInt(currentUser.games_won) || 0;
    document.getElementById('profLost').textContent = Math.max(0, played - won);
    
    fetchPlayerHistory();
}

function viewPublicProfile(id, name, uni, played, won) {
    document.getElementById('pubProfId').textContent = id;
    document.getElementById('pubProfName').textContent = name;
    document.getElementById('pubProfUni').textContent = uni || "-";
    document.getElementById('pubProfPlayed').textContent = played;
    document.getElementById('pubProfWon').textContent = won;
    let ratio = played > 0 ? Math.round((won / played) * 100) + "%" : "0%";
    document.getElementById('pubProfRatio').textContent = ratio;
    switchView('view-public-profile');
}

async function fetchPlayerHistory() {
    if(!currentUser) return;
    const tbody = document.getElementById('profileHistoryBody');
    tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color: var(--text-muted);'>Ładowanie historii...</td></tr>";

    try {
        const res = await fetch(`${API_URL}/players/${currentUser.player_id}/history`);
        if (res.ok) {
            const data = await res.json();
            const history = data["Historia gry"]; 
            tbody.innerHTML = "";

            if (history.length === 0) {
                tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color: var(--text-muted);'>Brak rozegranych gier.</td></tr>";
                return;
            }

            history.forEach(game => {
                let teamStr = game["Twoja drużyna"] ? `Drużyna ${game["Twoja drużyna"]}` : '-';
                let winnerStr = game["zwyciezcy"] ? `Drużyna ${game["zwyciezcy"]}` : '-';
                let statusColor = "var(--text-muted)";
                if(game["Status gry"] === "finished") statusColor = "var(--accent-green)";
                if(game["Status gry"] === "canceled") statusColor = "var(--accent-red)";
                let winColor = (game["zwyciezcy"] && game["zwyciezcy"] === game["Twoja drużyna"]) ? "color: var(--accent-green); font-weight: bold;" : "color: var(--text-main);";

                tbody.innerHTML += `
                    <tr onclick="openGameDetails(${game["ID gry"]})" style="cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
                        <td style="font-weight: bold; color: var(--accent-blue);">#${game["ID gry"]}</td>
                        <td style="color: var(--text-muted); font-size: 13px;">${game["date"]}</td>
                        <td>${teamStr}</td>
                        <td style="${winColor}">${winnerStr}</td>
                        <td style="color: ${statusColor}; text-transform: uppercase; font-size: 12px; font-weight: bold; letter-spacing: 1px;">${game["Status gry"]}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color: var(--accent-red);'>Nie udało się załadować historii.</td></tr>";
        }
    } catch (err) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color: var(--accent-red);'>Błąd API.</td></tr>";
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) return showToast("Wypełnij oba pola!", "error");

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            token = data.access_token;
            currentUser = data.player;
            localStorage.setItem('jwt_token', token);
            localStorage.setItem('current_user', JSON.stringify(currentUser));
            
            if (data.active_game_id) {
                currentActiveLobbyId = data.active_game_id;
                localStorage.setItem('active_lobby_id', currentActiveLobbyId);
            }

            updateAuthUI();
            showToast("Zalogowano pomyślnie!", "success");
            switchView('view-profile');
            
            await processPendingInvite();
        } else {
            handleApiError(res, data);
        }
    } catch (err) { showToast("Błąd łączenia z serwerem.", "error"); }
}

function logout() {
    token = null;
    currentUser = null;
    currentActiveLobbyId = null;
    if(autoKickInterval) clearInterval(autoKickInterval);
    if(lobbyRefreshInterval) clearInterval(lobbyRefreshInterval);
    if(liveTimerInterval) clearInterval(liveTimerInterval);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('active_lobby_id');
    updateAuthUI();
    showToast("Wylogowano.", "success");
    switchView('view-login');
}

async function registerPlayer() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value; // Nowe pole powtórz hasło
    const uniElement = document.querySelector('input[name="regUni"]:checked');
    const uni = uniElement ? uniElement.value : null;
    const facElement = document.querySelector('input[name="regFac"]:checked');
    const faculty = facElement ? facElement.value : null;

    if (!name || !email || !password || !passwordConfirm) return showToast("Wypełnij wszystkie wymagane pola (*)", "error");
    if (password.length < 6) return showToast("Hasło jest za krótkie! (Min. 6 znaków)", "error");
    
    // Sprawdzenie czy hasła są takie same
    if (password !== passwordConfirm) {
        return showToast("Podane hasła się od siebie różnią!", "error");
    }

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, university: uni, faculty })
        });
        const data = await res.json();

        if (res.ok) {
            showToast("Zarejestrowano! Sprawdź email, aby aktywować konto.", "success");
            switchView('view-login'); 
        } else { handleApiError(res, data); }
    } catch (err) { showToast("Błąd łączenia z API.", "error"); }
}

function checkAuth() {
    if (!currentUser) {
        showToast("Musisz się zalogować, aby to zrobić!", "error");
        switchView('view-login');
        return false;
    }
    return true;
}

async function fetchActiveGames() {
    if (!checkAuth()) return;
    const listContainer = document.getElementById('gamesBrowserList');
    listContainer.innerHTML = "<div style='padding: 20px; text-align: center; color: var(--text-muted);'>Pobieranie listy gier...</div>";

    try {
        const res = await fetch(`${API_URL}/games`);
        const games = await res.json();
        listContainer.innerHTML = ""; 

        if (games.length === 0) {
            listContainer.innerHTML = "<div style='padding: 20px; text-align: center; color: var(--text-muted);'>Brak oczekujących gier.</div>";
            return;
        }

        games.forEach(game => {
            const hostNameStr = game.host_name ? game.host_name : `Host #${game.host_id}`;
            const detailsId = `details-${game.game_id}`;
            const lockIcon = game.is_locked ? "🔒 " : "🔓 ";
            const modeText = game.game_mode === 'SHUFFLE' ? "Losowy" : "Własny";
            
            let locationBadge = "";
            if (game.location) {
                const locIcon = game.is_location_exact ? "📍 GPS ✔️" : "✍️ Ręcznie";
                locationBadge = `<span style="font-size: 11px; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; margin-left: 5px; color: ${game.is_location_exact ? 'var(--accent-blue)' : 'var(--text-muted)'};">${locIcon}: ${game.location}</span>`;
            }

            listContainer.innerHTML += `
                <details class="lobby-accordion" onclick="loadAccordionDetails(${game.game_id}, '${detailsId}')">
                    <summary class="lobby-summary">
                        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                            <span style="background: rgba(56, 189, 248, 0.2); border: 1px solid var(--accent-blue); color: var(--accent-blue); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;">#${game.game_id}</span>
                            <span>${lockIcon}${hostNameStr}</span>
                            <span style="font-size: 11px; background: var(--glass-bg); padding: 2px 6px; border-radius: 4px;">Tryb: ${modeText}</span>
                            ${locationBadge}
                        </div>
                        <span style="color: var(--text-muted); font-size: 13px;">Gracze: <strong>${game.players_count}</strong></span>
                    </summary>
                    <div id="${detailsId}" class="lobby-details-content" style="padding: 15px; background: rgba(0,0,0,0.1);">
                        Ładowanie graczy...
                    </div>
                </details>
            `;
        }); 
    } catch (err) { showToast("Błąd pobierania listy gier.", "error"); }
}

async function loadAccordionDetails(gameId, containerId) {
    const container = document.getElementById(containerId);
    try {
        const res = await fetch(`${API_URL}/games/${gameId}`);
        const data = await res.json();
        if(res.ok) {
            container.innerHTML = `
                <p style="margin-bottom:10px;">Status: ${data.status}</p>
                <ul style="list-style: none; padding: 0;">
                    ${data.players.map(p => `<li style="padding: 3px 0; border-bottom: 1px solid #333;">${p.name} (${p.university || '?'})</li>`).join('')}
                </ul>
                <button class="btn" style="margin-top:10px; background: var(--accent-green);" onclick="joinGame(${gameId})">Wejdź do Lobby</button>
            `;
        } else {
            container.innerHTML = "Błąd ładowania szczegółów.";
        }
    } catch (e) {
        container.innerHTML = "Nie można pobrać danych.";
    }
}

async function joinGame(gameId) {
    if (!checkAuth()) return;
    const code = prompt(`Wpisz tajny 4-cyfrowy kod PIN dla Lobby #${gameId}:`);
    if (!code) return; 

    try {
        const res = await fetch(`${API_URL}/games/join/${gameId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ code: code })
        });
        const data = await res.json();

        if (res.ok) {
            showToast("Dołączono pomyślnie!", "success");
            currentActiveLobbyId = gameId; 
            localStorage.setItem('active_lobby_id', gameId);
            switchView('view-lobby');
        } else { 
            handleApiError(res, data); 
        }
    } catch (err) { showToast("Błąd łączenia z API", "error"); }
}

function renderModalCities() {
    const container = document.getElementById('modalCitiesContainer');
    if (!container) return;
    
    container.innerHTML = POLISH_CITIES.map((city, index) => `
        <label class="city-radio-label">
            <input type="radio" name="modalCity" value="${city}" ${index === 0 ? 'checked' : ''}>
            <span>${city}</span>
        </label>
    `).join('');
}

function openLocationModal() { document.getElementById('locationModal').classList.add('active'); }
function closeLocationModal() { document.getElementById('locationModal').classList.remove('active'); }

function confirmManualCity() {
    const checkedRadio = document.querySelector('input[name="modalCity"]:checked');
    if (!checkedRadio) return showToast("Wybierz miasto z listy!", "error");

    const selectedCity = checkedRadio.value;
    document.getElementById('lobbyLocation').value = selectedCity;
    document.getElementById('isLocExact').value = 'false';
    
    closeLocationModal();
    showToast(`Wybrano miasto: ${selectedCity}`, "success");
    sendCreateGameRequest();
}

function requestGPSFromModal() {
    if (!navigator.geolocation) {
        showToast("Twoja przeglądarka nie obsługuje GPS.", "error");
        return;
    }

    showToast("Pobieranie pozycji GPS...", "success");

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                const data = await res.json();
                
                const city = data.address.city || data.address.town || data.address.village || data.address.county || "Lokalizacja GPS";
                
                document.getElementById('lobbyLocation').value = city;
                document.getElementById('isLocExact').value = 'true';
                
                closeLocationModal();
                showToast("Zlokalizowano pomyślnie!", "success");
                sendCreateGameRequest();
            } catch (e) {
                showToast("Nie udało się zamienić GPS na nazwę miasta.", "error");
            }
        },
        (error) => {
            showToast("Brak uprawnień GPS. Wybierz miasto ręcznie z listy.", "error");
        },
        { timeout: 8000 }
    );
}

async function createGame() {
    if (!checkAuth()) return;
    
    const locInput = document.getElementById('lobbyLocation');

    if (locInput.value.trim() !== '') {
        sendCreateGameRequest();
        return;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const data = await res.json();
                    
                    const city = data.address.city || data.address.town || data.address.village || data.address.county || "Lokalizacja GPS";
                    
                    locInput.value = city;
                    document.getElementById('isLocExact').value = 'true';
                    sendCreateGameRequest();
                } catch (e) {
                    openLocationModal();
                }
            },
            () => { openLocationModal(); },
            { timeout: 4000 }
        );
    } else {
        openLocationModal();
    }
}

async function sendCreateGameRequest() {
    const locationVal = document.getElementById('lobbyLocation').value;
    const isExactVal = document.getElementById('isLocExact').value === 'true';

    try {
        const res = await fetch(`${API_URL}/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                location: locationVal,
                is_location_exact: isExactVal
            })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(`Lobby stworzone!`, "success");
            currentActiveLobbyId = data.game_id; 
            localStorage.setItem('active_lobby_id', data.game_id);
            switchView('view-lobby');
        } else { 
            handleApiError(res, data);
        }
    } catch (err) { showToast("Błąd łączenia z API", "error"); }
}

function updateLobbyUIState() {
    const emptyState = document.getElementById('lobbyEmptyState');
    const content = document.getElementById('lobbyContent');

    if (!currentActiveLobbyId) {
        emptyState.style.display = 'block';
        content.style.display = 'none';
        if(lobbyRefreshInterval) clearInterval(lobbyRefreshInterval); 
        if(liveTimerInterval) clearInterval(liveTimerInterval);
    } else {
        emptyState.style.display = 'none';
        content.style.display = 'block';
        fetchLobby();
        
        if(lobbyRefreshInterval) clearInterval(lobbyRefreshInterval);
        lobbyRefreshInterval = setInterval(fetchLobby, 3000); 
    }
}

function startLiveTimer(startTimeISO) {
    if (!startTimeISO) return;
    const timerEl = document.getElementById('lobbyLiveTimer');
    if (!timerEl) return;

    timerEl.style.display = 'inline-block';
    const startTime = new Date(startTimeISO).getTime();

    if (liveTimerInterval) clearInterval(liveTimerInterval);

    const updateTimer = () => {
        const now = new Date().getTime();
        const diffMs = now - startTime;

        if (diffMs < 0) {
            timerEl.textContent = "⏱️ 00:00";
            return;
        }

        const totalSec = Math.floor(diffMs / 1000);
        const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const secs = String(totalSec % 60).padStart(2, '0');
        timerEl.textContent = `⏱️ ${mins}:${secs}`;
    };

    updateTimer();
    liveTimerInterval = setInterval(updateTimer, 1000);
}

// ZABEZPIECZONA FUNKCJA FETCH LOBBY
async function fetchLobby() {
    if(!currentActiveLobbyId) return updateLobbyUIState();

    try {
        const res = await fetch(`${API_URL}/games/${currentActiveLobbyId}`);
        
        if (!res.ok) {
            currentActiveLobbyId = null;
            localStorage.removeItem('active_lobby_id');
            updateLobbyUIState();
            showToast("Gra nie istnieje lub uległa awarii.", "error");
            switchView('view-home');
            return; 
        }

        const data = await res.json();
        const stat = data.status ? String(data.status).toUpperCase() : 'WAITING';
        const playersList = Array.isArray(data.players) ? data.players : [];
        
        const amIStillInLobby = playersList.some(p => p.player_id === currentUser.player_id);
        if (!amIStillInLobby && stat === 'WAITING') {
            showToast("Zostałeś wyrzucony z lobby przez Hosta.", "error");
            currentActiveLobbyId = null;
            localStorage.removeItem('active_lobby_id');
            updateLobbyUIState();
            switchView('view-home');
            return;
        }

        document.getElementById('lobbyIdDisplay').textContent = data.game_id;
        
        const locContainer = document.getElementById('lobbyLocationBadge');
        if (locContainer) {
            if (data.location) {
                if (data.is_location_exact) {
                    locContainer.innerHTML = `<span style="background: rgba(56, 189, 248, 0.15); border: 1px solid var(--accent-blue); color: var(--accent-blue); padding: 4px 10px; border-radius: 20px; font-weight: bold; font-size: 11px;">📍 ${data.location} ✔️</span>`;
                } else {
                    locContainer.innerHTML = `<span style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); color: var(--text-muted); padding: 4px 10px; border-radius: 20px; font-size: 11px;">✍️ ${data.location}</span>`;
                }
            } else {
                locContainer.innerHTML = '';
            }
        }

        const timerEl = document.getElementById('lobbyLiveTimer');
        if (stat === 'PENDING') {
            if (data.start_time) {
                startLiveTimer(data.start_time);
            } else {
                if (timerEl) {
                    timerEl.style.display = 'inline-block';
                    if (!timerEl.textContent.includes(':')) timerEl.textContent = "⏱️ W toku";
                }
            }
        } else {
            if (liveTimerInterval) clearInterval(liveTimerInterval);
            if (timerEl) timerEl.style.display = 'none';
        }
        
        const codeDisplay = document.getElementById('lobbyCodeDisplay');
        if (codeDisplay) {
            codeDisplay.innerHTML = '';
            const codeStr = String(data.code || "----");
            for(let char of codeStr) {
                codeDisplay.innerHTML += `
                    <span style="display: flex; align-items: center; justify-content: center; width: 45px; height: 60px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; font-family: monospace; font-size: 32px; font-weight: bold; color: var(--accent-blue);">
                        ${char}
                    </span>`;
            }
        }
        
        const isHost = (currentUser && data.host_id === currentUser.player_id);

        const modeBadge = document.getElementById('lobbyModeBadge');
        const statusBadge = document.getElementById('lobbyStatusBadge'); 
        const hostControls = document.getElementById('hostControls');
        const teamSelectionControls = document.getElementById('teamSelectionControls');
        const toggleLockBtn = document.getElementById('toggleLockBtn');
        const toggleModeBtn = document.getElementById('toggleModeBtn');
        const shuffleBtn = document.getElementById('shuffleBtn');

        const cancelBtn = document.getElementById('cancelGameBtn');
        const leaveBtn = document.getElementById('leaveGameBtn');
        const startBtn = document.getElementById('startGameBtn');
        const finishControls = document.getElementById('activeGameControls');
        const matchAlert = document.getElementById('matchFinishAlert');
        const manualTeamButtons = document.getElementById('manualTeamButtons');
        const shuffleNotice = document.getElementById('shuffleNotice');

        if (statusBadge) {
            statusBadge.textContent = stat;
            statusBadge.style.cssText = "padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 11px; text-transform: uppercase; border: 1px solid;";
            
            if(stat.includes('WAITING')) {
                statusBadge.style.background = "rgba(56, 189, 248, 0.15)";
                statusBadge.style.color = "var(--accent-blue)";
                statusBadge.style.borderColor = "rgba(56, 189, 248, 0.3)";
            } else if(stat.includes('PENDING')) {
                statusBadge.style.background = "rgba(251, 191, 36, 0.15)";
                statusBadge.style.color = "#f59e0b";
                statusBadge.style.borderColor = "rgba(251, 191, 36, 0.3)";
            } else if(stat.includes('FINISHED')) {
                statusBadge.style.background = "rgba(255,255,255,0.1)";
                statusBadge.style.color = "var(--text-muted)";
                statusBadge.style.borderColor = "rgba(255,255,255,0.2)";
            } else {
                statusBadge.style.background = "rgba(244, 63, 94, 0.15)";
                statusBadge.style.color = "var(--accent-red)";
                statusBadge.style.borderColor = "rgba(244, 63, 94, 0.3)";
            }
        }

        const gameModeSafe = data.game_mode ? String(data.game_mode).toUpperCase() : 'MANUAL';

        if (modeBadge) {
            modeBadge.textContent = gameModeSafe === 'SHUFFLE' ? "TRYB: LOSOWY" : "TRYB: WYBÓR";
            modeBadge.style.cssText = "padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 11px; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border);";
            if(data.is_locked) {
                modeBadge.textContent += " 🔒";
                modeBadge.style.color = "var(--accent-red)";
            } else {
                modeBadge.style.color = "var(--text-main)";
            }
        }

        if (hostControls) hostControls.style.display = 'none';
        if (teamSelectionControls) teamSelectionControls.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
        if (leaveBtn) leaveBtn.style.display = 'none';
        if (startBtn) startBtn.style.display = 'none';
        if (finishControls) finishControls.style.display = 'none';
        if (matchAlert) matchAlert.style.display = 'none';

        if (stat === 'FINISHED' || stat === 'CANCELED') {
            if(lobbyRefreshInterval) clearInterval(lobbyRefreshInterval); 
            if(liveTimerInterval) clearInterval(liveTimerInterval);
            if (!autoKickInterval) {
                let sec = 5;
                if (matchAlert) {
                    matchAlert.style.cssText = "padding: 20px; margin-bottom: 20px; border-radius: 12px; text-align: center; border: 1px solid;";
                    if (stat === 'FINISHED') {
                        matchAlert.style.background = "rgba(16, 185, 129, 0.15)";
                        matchAlert.style.color = "#34d399";
                        matchAlert.style.borderColor = "rgba(16, 185, 129, 0.3)";
                    } else {
                        matchAlert.style.background = "rgba(244, 63, 94, 0.15)";
                        matchAlert.style.color = "var(--accent-red)";
                        matchAlert.style.borderColor = "rgba(244, 63, 94, 0.3)";
                    }
                    
                    matchAlert.innerHTML = `
                        <strong style="font-size: 18px;">${stat === 'FINISHED' ? 'MECZ ZAKOŃCZONY' : 'MECZ ANULOWANY'}</strong><br>
                        <span style="font-size: 13px; opacity: 0.8; margin-top: 5px; display: inline-block;">Powrót do menu za <b id="kickCountdown">${sec}</b>s...</span>
                    `;
                    matchAlert.style.display = 'block';
                }
                autoKickInterval = setInterval(() => {
                    sec--;
                    let kCount = document.getElementById('kickCountdown');
                    if(kCount) kCount.textContent = sec;
                    if (sec <= 0) {
                        clearInterval(autoKickInterval);
                        autoKickInterval = null;
                        currentActiveLobbyId = null;
                        localStorage.removeItem('active_lobby_id');
                        switchView('view-home');
                        showToast("Zakończono.", "success");
                    }
                }, 1000);
            }
        } else {
            if (stat.includes('WAITING')) {
                if (teamSelectionControls) teamSelectionControls.style.display = 'block';
                
                if (gameModeSafe === 'SHUFFLE') {
                    if (manualTeamButtons) manualTeamButtons.style.display = 'none';
                    if (shuffleNotice) shuffleNotice.style.display = 'block';
                } else {
                    if (manualTeamButtons) manualTeamButtons.style.display = 'block';
                    if (shuffleNotice) shuffleNotice.style.display = 'none';
                }
            }

            if (isHost) {
                if (stat.includes('WAITING')) {
                    if (hostControls) hostControls.style.display = 'block';
                    if (startBtn) startBtn.style.display = 'block';
                    if (cancelBtn) cancelBtn.style.display = 'block';
                    
                    if (toggleLockBtn) toggleLockBtn.textContent = data.is_locked ? "🔓 Odblokuj" : "🔒 Zablokuj";
                    if (toggleModeBtn) toggleModeBtn.textContent = gameModeSafe === 'SHUFFLE' ? "✍️ Tryb: Wybór" : "🎲 Tryb: Losowy";
                    if (shuffleBtn) shuffleBtn.style.display = gameModeSafe === 'SHUFFLE' ? 'inline-block' : 'none';
                    
                } else if (stat.includes('PENDING')) {
                    if (finishControls) finishControls.style.display = 'block';
                }
            } else {
                if (leaveBtn) leaveBtn.style.display = 'block';
            }
        }

        document.getElementById('lobbyCountDisplay').textContent = playersList.length;
        
        const unassignedList = document.getElementById('unassignedContainer');
        const teamAList = document.getElementById('teamAList');
        const teamBList = document.getElementById('teamBList');
        
        unassignedList.innerHTML = "";
        teamAList.innerHTML = "";
        teamBList.innerHTML = "";

        if (playersList.length === 0) {
            unassignedList.innerHTML = "<div style='text-align: center; color: var(--text-muted); padding: 10px;'>Brak graczy.</div>";
        } else {
            playersList.forEach(player => {
                let glowStyle = "background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border);";
                let targetContainer = unassignedList;

                if (player.team === 'A' || player.team === '1') {
                    glowStyle = "background: rgba(56, 189, 248, 0.1); border: 1px solid var(--accent-blue); box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);";
                    targetContainer = teamAList;
                } else if (player.team === 'B' || player.team === '2') {
                    glowStyle = "background: rgba(244, 63, 94, 0.1); border: 1px solid var(--accent-red); box-shadow: 0 0 15px rgba(244, 63, 94, 0.2);";
                    targetContainer = teamBList;
                }

                const isMe = (currentUser && player.player_id === currentUser.player_id) ? `<span style="font-size: 11px; font-weight: normal; color: var(--text-muted); margin-left: 5px;">(Ty)</span>` : "";
                const isHostIcon = (player.player_id === data.host_id) ? `<span title="Host" style="margin-left: 5px;">👑</span>` : "";
                
                const safeName = player.name.replace(/'/g, "\\'");
                const safeUni = player.university ? player.university.replace(/'/g, "\\'") : '';

                let kickBtnHtml = "";
                if (isHost && player.player_id !== currentUser.player_id && stat === 'WAITING') {
                    kickBtnHtml = `<button onclick="kickPlayer(${data.game_id}, ${player.player_id})" style="background: transparent; border: none; font-size: 15px; cursor: pointer; margin-left: auto; opacity: 0.6; transition: 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'" title="Wyrzuć">❌</button>`;
                }

                targetContainer.innerHTML += `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; ${glowStyle}">
                        <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); font-size: 11px; font-weight: bold; color: var(--text-muted); text-transform: uppercase; flex-shrink: 0;">
                            ${player.name.substring(0, 2)}
                        </div>
                        <div style="flex: 1; text-align: left; overflow: hidden; display: flex; flex-direction: column;">
                            <div style="display: flex; align-items: center;">
                                <span style="font-weight: bold; font-size: 14px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    <a class="clickable-profile" onclick="viewPublicProfile(${player.player_id}, '${safeName}', '${safeUni}', ${player.games_played}, ${player.games_won})" title="Zobacz profil gracza">${player.name}</a>
                                </span>
                                ${isMe}
                                ${isHostIcon}
                            </div>
                        </div>
                        ${kickBtnHtml}
                    </div>
                `;
            });
        }
    } catch (err) { console.error("Błąd odświeżania:", err); }
}

async function kickPlayer(gameId, playerId) {
    if(!confirm("Czy na pewno chcesz wyrzucić tego gracza z lobby?")) return;

    try {
        const res = await fetch(`${API_URL}/games/${gameId}/kick/${playerId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = await res.json();

        if (res.ok) {
            showToast("Wyrzucono gracza pomyślnie.", "success");
            fetchLobby(); 
        } else { handleApiError(res, data); }
    } catch (err) { showToast("Błąd komunikacji z serwerem.", "error"); }
}

async function startGame() {
    if (!checkAuth()) return;
    try {
        const res = await fetch(`${API_URL}/games/${currentActiveLobbyId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({})
        });
        const data = await res.json();
        if (res.ok) {
            showToast("Gra wystartowała! Drużyny zostały przydzielone.", "success");
            fetchLobby(); 
        } else { handleApiError(res, data); }
    } catch (err) { showToast("Błąd łączenia z API", "error"); }
}

async function finishGame(winningTeam) {
    if (!checkAuth()) return;
    if (!confirm(`Czy na pewno zgłaszasz, że wygrała Drużyna ${winningTeam}? Tej operacji nie można cofnąć!`)) return;

    try {
        const res = await fetch(`${API_URL}/games/${currentActiveLobbyId}/finish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ winning_team: winningTeam })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast("Wynik zapisany. Mecz zakończony!", "success");
            fetchLobby(); 
        } else { handleApiError(res, data); }
    } catch (err) { showToast("Błąd łączenia z API", "error"); }
}

async function cancelGame() {
    if (!checkAuth()) return;
    if (!currentActiveLobbyId) return showToast("Nie ma czego usunąć.", "error");
    if(!confirm("Czy na pewno chcesz zniszczyć to lobby? Wszystko przepadnie!")) return;

    try {
        const res = await fetch(`${API_URL}/games/${currentActiveLobbyId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({})
        });
        const data = await res.json();

        if (res.ok) {
            showToast("Lobby zniszczone.", "success");
            currentActiveLobbyId = null; 
            localStorage.removeItem('active_lobby_id');
            switchView('view-home'); 
        } else { handleApiError(res, data); }
    } catch (err) { showToast("Błąd łączenia z API", "error"); }
}

async function leaveGame() {
    if (!checkAuth()) return;
    if (!currentActiveLobbyId) return showToast("Nie jesteś w lobby.", "error");
    if(!confirm("Czy na pewno chcesz opuścić to lobby?")) return;

    try {
        const res = await fetch(`${API_URL}/games/${currentActiveLobbyId}/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({})
        });
        const data = await res.json();

        if (res.ok) {
            showToast("Opuszczono lobby.", "success");
            currentActiveLobbyId = null; 
            localStorage.removeItem('active_lobby_id');
            switchView('view-home');
        } else { handleApiError(res, data); }
    } catch (err) { showToast("Błąd łączenia z API", "error"); }
}

function onLeaderboardFilterChange() {
    const uni = document.getElementById('rankFilterUni').value;
    const facSelect = document.getElementById('rankFilterFac');
    
    facSelect.innerHTML = '<option value="ALL">Wszystkie Wydziały</option>';

    if (uni === "PRZ") {
        przFaculties.forEach(f => {
            facSelect.innerHTML += `<option value="${f.value}">${f.label}</option>`;
        });
    }

    fetchLeaderboard();
}

async function fetchLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding: 20px; color: var(--text-muted);'>Ładowanie rankingu...</td></tr>";

    const uni = document.getElementById('rankFilterUni') ? document.getElementById('rankFilterUni').value : 'ALL';
    const fac = document.getElementById('rankFilterFac') ? document.getElementById('rankFilterFac').value : 'ALL';

    try {
        const res = await fetch(`${API_URL}/players?university=${uni}&faculty=${fac}`);
        const players = await res.json();
        tbody.innerHTML = "";

        if (players.length === 0) {
            tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; color: var(--text-muted);'>Brak graczy.</td></tr>";
            return;
        }

        players.forEach((p, index) => {
            const isTop3 = index < 3;
            const rowStyle = isTop3 ? "background: rgba(255,255,255,0.05);" : "";
            const rankColor = index === 0 ? "color: #fbbf24; font-size: 18px;" : (index === 1 ? "color: #94a3b8; font-size: 16px;" : (index === 2 ? "color: #b45309; font-size: 16px;" : ""));
            const winRatio = p.games_played > 0 ? Math.round((p.games_won / p.games_played) * 100) + '%' : '0%';
            const safeName = p.name.replace(/'/g, "\\'");
            const safeUni = p.university ? p.university.replace(/'/g, "\\'") : '';

            tbody.innerHTML += `
                <tr style="${rowStyle}">
                    <td style="font-weight: bold; ${rankColor}">${index + 1}</td>
                    <td><a class="clickable-profile" onclick="viewPublicProfile(${p.player_id}, '${safeName}', '${safeUni}', ${p.games_played}, ${p.games_won})" title="Zobacz profil gracza">${p.name}</a></td>
                    <td style="color: var(--text-muted);">${p.university || '-'}</td>
                    <td style="font-weight: bold;">${p.games_played}</td>
                    <td style="color: var(--accent-green); font-weight: bold;">${p.games_won}</td>
                    <td style="color: var(--accent-blue); font-weight: bold;">${winRatio}</td>
                </tr>
            `;
        });
    } catch (err) {
        tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; color: var(--accent-red);'>Błąd łączenia z API</td></tr>";
    }
}

const przFaculties = [
    { value: "WEII", label: "WEiI" }, { value: "WC", label: "WCh" },
    { value: "WZ", label: "WZ" }, { value: "WMiFS", label: "WMiFS" },
    { value: "WBMiL", label: "WBMiL" }, { value: "WBIŚiA", label: "WBIŚiA" },
    { value: "WMT", label: "WMT" }
];

function updateFacultyOptions() {
    const uniElement = document.querySelector('input[name="regUni"]:checked');
    const facultyGroup = document.getElementById('facultyGroup');
    const facultyContainer = document.getElementById('facultyContainer');
    
    if (!uniElement) return;

    if (uniElement.value === "PRZ") {
        facultyGroup.style.display = 'flex';
        facultyContainer.innerHTML = przFaculties.map((fac, index) => `
            <label class="radio-label" style="font-weight: bold;">
                <input type="radio" name="regFac" value="${fac.value}" ${index === 0 ? 'checked' : ''}> ${fac.label}
            </label>
        `).join('');
    } else {
        facultyGroup.style.display = 'none';
        facultyContainer.innerHTML = ""; 
    }
}

function copyInviteLink() {
    const gameId = document.getElementById('lobbyIdDisplay').textContent;
    const codeSpan = document.getElementById('lobbyCodeDisplay').innerText;
    const code = codeSpan.replace(/\s/g, ''); 
    
    if(!gameId || !code || gameId === "?" || code === "----") return;

    const link = `${window.location.origin}/?game=${gameId}&code=${code}`;
    
    navigator.clipboard.writeText(link).then(() => {
        showToast("Link zaproszenia skopiowany do schowka!", "success");
    }).catch(() => {
        showToast("Nie udało się skopiować linku.", "error");
    });
}

function handleInviteLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteGame = urlParams.get('game');
    const inviteCode = urlParams.get('code');

    if (inviteGame && inviteCode) {
        localStorage.setItem('pending_invite_game', inviteGame);
        localStorage.setItem('pending_invite_code', inviteCode);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    processPendingInvite();
}

async function processPendingInvite() {
    const pendingGame = localStorage.getItem('pending_invite_game');
    const pendingCode = localStorage.getItem('pending_invite_code');

    if (pendingGame && pendingCode && token && currentUser) {
        localStorage.removeItem('pending_invite_game');
        localStorage.removeItem('pending_invite_code');
        
        try {
            const res = await fetch(`${API_URL}/games/join/${pendingGame}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ code: pendingCode })
            });
            const data = await res.json();
            
            if (res.ok) {
                showToast("Dołączono automatycznie z linku!", "success");
                currentActiveLobbyId = pendingGame;
                localStorage.setItem('active_lobby_id', pendingGame);
                switchView('view-lobby');
            } else if (data.error && data.error.includes('Jesteś już w grze')) {
                // Ciche zignorowanie
            } else {
                showToast(`Nie udało się dołączyć: ${data.error || data.message}`, "error");
            }
        } catch(e) {
            console.error("Błąd auto-dołączania", e);
        }
    }
}

async function openGameDetails(gameId) {
    const list1 = document.getElementById('team1List');
    const list2 = document.getElementById('team2List');
    
    document.getElementById('detGameId').textContent = gameId;
    list1.innerHTML = "";
    list2.innerHTML = "";

    try {
        const res = await fetch(`${API_URL}/games/details/${gameId}`, { method: 'POST' });
        const data = await res.json();
        
        if (res.ok) {
            document.getElementById('detDate').textContent = data.date;
            document.getElementById('detHost').textContent = data.host_name;
            document.getElementById('detStatus').textContent = data.status;
            document.getElementById('detWinner').textContent = data.winning_team ? `Drużyna ${data.winning_team}` : "Brak";

            data.players.forEach(p => {
                const li = document.createElement('li');
                li.style.padding = "5px 0";
                li.textContent = p.name;
                
                const team = p.team ? p.team.toString().toUpperCase() : null;

                if (team === 'A' || team === '1') {
                    list1.appendChild(li);
                } else if (team === 'B' || team === '2') {
                    list2.appendChild(li);
                } else {
                    li.textContent += " (Bez drużyny)";
                    li.style.color = "#ff4d4d";
                    list1.appendChild(li); 
                }
            });
            switchView('view-game-details');
        } else {
            showToast("Błąd: " + data.error, "error");
        }
    } catch (err) {
        showToast("Nie udało się pobrać szczegółów.", "error");
    }
}

async function joinTeam(teamName) {
    if (!checkAuth() || !currentActiveLobbyId) return;
    try {
        const res = await fetch(`${API_URL}/games/${currentActiveLobbyId}/join_team/${teamName}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message, "success");
            fetchLobby();
        } else {
            handleApiError(res, data);
        }
    } catch (err) { showToast("Błąd zmiany drużyny.", "error"); }
}

async function shuffleTeams() {
    if (!checkAuth() || !currentActiveLobbyId) return;
    try {
        const res = await fetch(`${API_URL}/games/${currentActiveLobbyId}/shuffle`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            showToast("Składy zostały wylosowane!", "success");
            fetchLobby();
        } else { handleApiError(res, data); }
    } catch (err) { showToast("Błąd losowania.", "error"); }
}

async function toggleLobbyLock() {
    if (!checkAuth() || !currentActiveLobbyId) return;
    try {
        const res = await fetch(`${API_URL}/games/${currentActiveLobbyId}/toggle_lock`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            showToast("Zmieniono status blokady lobby.", "success");
            fetchLobby();
        } else { handleApiError(res, data); }
    } catch (err) { showToast("Błąd blokowania lobby.", "error"); }
}

async function toggleLobbyMode() {
    if (!checkAuth() || !currentActiveLobbyId) return;
    try {
        const res = await fetch(`${API_URL}/games/${currentActiveLobbyId}/toggle_mode`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            showToast("Zmieniono tryb gry.", "success");
            fetchLobby();
        } else { handleApiError(res, data); }
    } catch (err) { showToast("Błąd zmiany trybu.", "error"); }
}

async function requestPasswordReset() {
    const email = document.getElementById('resetEmailInput').value;
    if (!email) return showToast("Podaj adres e-mail!", "error");

    try {
        const res = await fetch(`${API_URL}/auth/reset-password-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
            showToast("Wysłano link. Sprawdź skrzynkę e-mail.", "success");
            switchView('view-login');
        } else {
            showToast(data.error || "Błąd", "error");
        }
    } catch (err) { showToast("Błąd serwera", "error"); }
}

async function submitNewPassword() {
    const token = document.getElementById('resetTokenHidden').value;
    const password = document.getElementById('newPasswordInput').value;
    
    if (password.length < 6) return showToast("Hasło musi mieć min. 6 znaków", "error");

    try {
        const res = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast("Hasło zmienione pomyślnie!", "success");
            switchView('view-login');
        } else {
            showToast(data.error || "Błąd zmiany hasła", "error");
        }
    } catch (err) { showToast("Błąd serwera", "error"); }
}