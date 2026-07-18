const API_URL = ""; 

let token = localStorage.getItem('jwt_token') || null;
let currentUser = JSON.parse(localStorage.getItem('current_user')) || null;
let currentActiveLobbyId = localStorage.getItem('active_lobby_id') || null;
let autoKickInterval = null; 
let lobbyRefreshInterval = null; // Zmienna do auto-odświeżania lobby

window.onload = () => {
    updateAuthUI();
    if(token) {
        switchView('view-profile');
        if(currentActiveLobbyId) updateLobbyUIState();
    }
    updateFacultyOptions();
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
        'view-rules': 'nav-rules'
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
                    <tr>
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
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color: var(--accent-red);'>Błąd API podczas pobierania historii.</td></tr>";
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
        } else {
            showToast(data.error || "Błąd logowania", "error");
        }
    } catch (err) { showToast("Brak połączenia z serwerem.", "error"); }
}

function logout() {
    token = null;
    currentUser = null;
    currentActiveLobbyId = null;
    if(autoKickInterval) clearInterval(autoKickInterval);
    if(lobbyRefreshInterval) clearInterval(lobbyRefreshInterval);
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
    const uniElement = document.querySelector('input[name="regUni"]:checked');
    const uni = uniElement ? uniElement.value : null;
    const facElement = document.querySelector('input[name="regFac"]:checked');
    const faculty = facElement ? facElement.value : null;

    if (!name || !email || !password) return showToast("Wypełnij wymagane pola (*)", "error");
    if (password.length < 6) return showToast("Hasło jest za krótkie!", "error");

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
        } else { showToast(data.error || data.message, "error"); }
    } catch (err) { showToast("Brak połączenia z API.", "error"); }
}

function checkAuth() {
    if (!currentUser) {
        showToast("Musisz się zalogować, aby to zrobić!", "error");
        switchView('view-login');
        return false;
    }
    return true;
}

// ---- POPRAWIONA LISTA GIER ---- //
async function fetchActiveGames() {
    if (!checkAuth()) return;
    const listContainer = document.getElementById('gamesBrowserList');
    listContainer.innerHTML = "<div style='padding: 20px; text-align: center; color: var(--text-muted);'>Pobieranie listy gier...</div>";

    try {
        const res = await fetch(`${API_URL}/games`);
        const games = await res.json();
        listContainer.innerHTML = ""; 

        if (games.length === 0) {
            listContainer.innerHTML = "<div style='padding: 20px; text-align: center; color: var(--text-muted);'>Brak oczekujących gier. Stwórz nową!</div>";
            return;
        }

        games.forEach(game => {
            const hostNameStr = game.host_name ? game.host_name : `Host #${game.host_id}`;
            listContainer.innerHTML += `
                <details class="lobby-accordion">
                    <summary class="lobby-summary">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="background: rgba(56, 189, 248, 0.2); border: 1px solid var(--accent-blue); color: var(--accent-blue); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;">#${game.game_id}</span>
                            <span>${hostNameStr}</span>
                        </div>
                        <span style="color: var(--text-muted); font-size: 13px; font-weight: normal;">Gracze: <strong style="color: var(--text-main);">${game.players_count}</strong></span>
                    </summary>
                    <div class="lobby-details-content">
                        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 15px;">Gra w trybie standardowym. Dołącz, aby zobaczyć przydział do drużyny.</p>
                        <button class="btn" style="width: auto; padding: 10px 20px; margin-top: 0; font-size: 14px;" onclick="joinGame(${game.game_id})">Wejdź do Lobby 🔒</button>
                    </div>
                </details>
            `;
        });
    } catch (err) { showToast("Błąd podczas pobierania listy gier.", "error"); }
}

// ---- POPRAWIONE DOŁĄCZANIE (Z POST) ---- //
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
            body: JSON.stringify({ code: code }) // Wysyłamy kod w JSON do API
        });
        const data = await res.json();

        if (res.ok) {
            showToast("Dołączono pomyślnie!", "success");
            currentActiveLobbyId = gameId; 
            localStorage.setItem('active_lobby_id', gameId);
            switchView('view-lobby');
        } else { 
            showToast(data.error || data.message, "error"); 
        }
    } catch (err) { showToast("Błąd łączenia z API", "error"); }
}

async function createGame() {
    if (!checkAuth()) return;
    try {
        const res = await fetch(`${API_URL}/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({})
        });
        const data = await res.json();
        if (res.ok) {
            showToast(`Lobby stworzone!`, "success");
            currentActiveLobbyId = data.game_id; 
            localStorage.setItem('active_lobby_id', data.game_id);
            switchView('view-lobby');
        } else { 
            showToast(data.error || data.message, "error"); 
        }
    } catch (err) { showToast("Błąd łączenia z API", "error"); }
}

// ---- ZARZĄDZANIE EKRANEM LOBBY (Auto-Odświeżanie) ---- //
function updateLobbyUIState() {
    const emptyState = document.getElementById('lobbyEmptyState');
    const content = document.getElementById('lobbyContent');

    if (!currentActiveLobbyId) {
        emptyState.style.display = 'block';
        content.style.display = 'none';
        if(lobbyRefreshInterval) clearInterval(lobbyRefreshInterval); // Zatrzymaj odświeżanie
    } else {
        emptyState.style.display = 'none';
        content.style.display = 'block';
        fetchLobby();
        
        // Zabezpieczenie przed wielokrotnym odpalaniem interwału
        if(lobbyRefreshInterval) clearInterval(lobbyRefreshInterval);
        lobbyRefreshInterval = setInterval(fetchLobby, 3000); // Polling co 3 sekundy
    }
}

// ---- POBIERANIE I RYSOWANIE LOBBY Z PRZYCISKIEM KICK ---- //
async function fetchLobby() {
    if(!currentActiveLobbyId) return updateLobbyUIState();

    try {
        const res = await fetch(`${API_URL}/games/${currentActiveLobbyId}`);
        const data = await res.json();

        if (res.ok) {
            const stat = String(data.status).toUpperCase();
            
            // LOGIKA WYRZUCENIA: Sprawdź, czy gracz nadal jest na liście w trwającej grze
            const amIStillInLobby = data.players.some(p => p.player_id === currentUser.player_id);
            if (!amIStillInLobby && stat === 'WAITING') {
                showToast("Zostałeś wyrzucony z lobby przez Hosta.", "error");
                currentActiveLobbyId = null;
                localStorage.removeItem('active_lobby_id');
                updateLobbyUIState();
                switchView('view-home');
                return;
            }

            document.getElementById('lobbyIdDisplay').textContent = data.game_id;
            
            // Status wizualny
            const badge = document.getElementById('lobbyStatusBadge');
            badge.textContent = stat;
            badge.style.color = "#fff";
            if(stat.includes('WAITING')) badge.style.background = "var(--accent-blue)";
            if(stat.includes('PENDING')) badge.style.background = "var(--accent-green)";
            if(stat.includes('FINISHED')) badge.style.background = "var(--glass-border)";
            if(stat.includes('CANCELED')) badge.style.background = "var(--accent-red)";

            document.getElementById('lobbyCodeDisplay').textContent = data.code;
            
            const cancelBtn = document.getElementById('cancelGameBtn');
            const leaveBtn = document.getElementById('leaveGameBtn');
            const startBtn = document.getElementById('startGameBtn');
            const finishControls = document.getElementById('activeGameControls');
            const matchAlert = document.getElementById('matchFinishAlert');

            const isHost = (currentUser && data.host_id === currentUser.player_id);

            // Reset
            cancelBtn.style.display = 'none';
            leaveBtn.style.display = 'none';
            startBtn.style.display = 'none';
            finishControls.style.display = 'none';
            matchAlert.style.display = 'none';

            // LOGIKA AUTO-KICK DLA ZAKOŃCZONEJ GRY
            if (stat === 'FINISHED' || stat === 'CANCELED') {
                if(lobbyRefreshInterval) clearInterval(lobbyRefreshInterval); // Zatrzymaj polling

                if (!autoKickInterval) {
                    let sec = 5;
                    matchAlert.className = stat === 'FINISHED' ? 'match-alert win' : 'match-alert loss';
                    matchAlert.innerHTML = `
                        ${stat === 'FINISHED' ? 'MECZ ZAKOŃCZONY' : 'MECZ ANULOWANY'} <br>
                        <span style="font-size: 14px; font-weight: normal; color: var(--text-main);">Auto-wyjście do menu za <b id="kickCountdown">${sec}</b> sekund...</span>
                    `;
                    matchAlert.style.display = 'block';
                    document.getElementById('lobbyContent').style.borderColor = stat === 'FINISHED' ? 'var(--accent-green)' : 'var(--accent-red)';

                    autoKickInterval = setInterval(() => {
                        sec--;
                        let kCount = document.getElementById('kickCountdown');
                        if(kCount) kCount.textContent = sec;
                        if (sec <= 0) {
                            clearInterval(autoKickInterval);
                            autoKickInterval = null;
                            currentActiveLobbyId = null;
                            localStorage.removeItem('active_lobby_id');
                            document.getElementById('lobbyContent').style.borderColor = 'var(--glass-border)'; // reset
                            switchView('view-home');
                            showToast("Pomyślnie opuszczono zakończony mecz.", "success");
                        }
                    }, 1000);
                }
            } else {
                if (isHost) {
                    if (stat.includes('WAITING')) {
                        startBtn.style.display = 'block';
                        cancelBtn.style.display = 'block';
                    } else if (stat.includes('PENDING')) {
                        finishControls.style.display = 'block';
                    }
                } else {
                    leaveBtn.style.display = 'block';
                }
            }

            document.getElementById('lobbyCountDisplay').textContent = data.players_count;
            const listContainer = document.getElementById('playersListContainer');
            listContainer.innerHTML = ""; 

            if (data.players.length === 0) {
                listContainer.innerHTML = "<li class='player-item' style='justify-content:center; border:none; color:var(--text-muted);'>Lobby jest puste.</li>";
            } else {
                data.players.forEach(player => {
                    const teamText = player.team ? `Drużyna ${player.team}` : "Oczekuje...";
                    const isMe = (currentUser && player.player_id === currentUser.player_id) ? " <span style='color:var(--accent-green); font-size: 12px; border: 1px solid var(--accent-green); padding: 1px 4px; border-radius: 4px;'>TY</span>" : "";
                    const uniText = player.university ? player.university : "?";
                    const isHostIcon = (player.player_id === data.host_id) ? " 👑" : "";

                    // GENEROWANIE PRZYCISKU WYRZUĆ TYLKO DLA HOSTA
                    let kickBtnHtml = "";
                    if (isHost && player.player_id !== currentUser.player_id && stat === 'WAITING') {
                        kickBtnHtml = `<button class="btn danger" style="padding: 4px 8px; font-size: 12px; margin-left: 10px; width: auto; background: transparent; border: 1px solid var(--accent-red); color: var(--accent-red);" onclick="kickPlayer(${data.game_id}, ${player.player_id})">Wyrzuć</button>`;
                    }
                    
                    listContainer.innerHTML += `
                        <li class="player-item">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <strong style="color: var(--accent-blue); background: rgba(56, 189, 248, 0.1); padding: 4px 8px; border-radius: 6px;">#${player.player_id}</strong> 
                                <span style="font-weight: 600; font-size: 16px;">${player.name}</span> ${isMe} ${isHostIcon}
                                <span style="color: var(--text-muted); font-size: 13px; margin-left: 5px;">[${uniText}]</span>
                                ${kickBtnHtml}
                            </div>
                            <span style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: bold; color: ${player.team ? 'var(--text-main)' : 'var(--text-muted)'};">${teamText}</span>
                        </li>
                    `;
                });
            }
        } else {
            // Lobby usunięte z bazy
            currentActiveLobbyId = null;
            localStorage.removeItem('active_lobby_id');
            updateLobbyUIState();
            showToast("To lobby już nie istnieje", "error");
        }
    } catch (err) { 
        console.error("Błąd odświeżania:", err); 
    }
}

// ---- FUNKCJA WYRZUCANIA GRACZA ---- //
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
            fetchLobby(); // Natychmiastowe odświeżenie po wyrzuceniu
        } else {
            showToast(data.error || "Błąd podczas wyrzucania.", "error");
        }
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
        } else { showToast(data.error || data.message, "error"); }
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
        } else { showToast(data.error || data.message, "error"); }
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
        } else { showToast(data.error || data.message, "error"); }
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
        } else { showToast(data.error || data.message, "error"); }
    } catch (err) { showToast("Błąd łączenia z API", "error"); }
}

async function fetchLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding: 20px; color: var(--text-muted);'>Ładowanie rankingu...</td></tr>";

    try {
        const res = await fetch(`${API_URL}/players`);
        const players = await res.json();
        tbody.innerHTML = "";

        if (players.length === 0) {
            tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; color: var(--text-muted);'>Brak graczy w rankingu.</td></tr>";
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
                    <td><a class="clickable-profile" onclick="viewPublicProfile(${p.player_id}, '${safeName}', '${safeUni}', ${p.games_played}, ${p.games_won})">${p.name}</a></td>
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