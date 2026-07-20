const API_URL = ""; 

let token = localStorage.getItem('jwt_token') || null;
let currentUser = JSON.parse(localStorage.getItem('current_user')) || null;
let currentActiveLobbyId = localStorage.getItem('active_lobby_id') || null;
let autoKickInterval = null; 
let lobbyRefreshInterval = null; 

window.onload = () => {
    updateAuthUI();
    
    handleInviteLink();
    
    if(token) {
        if(!localStorage.getItem('pending_invite_game') && !currentActiveLobbyId) {
             switchView('view-profile');
        }
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

// ---- UNIWERSALNY SYSTEM ŁAPANIA BŁĘDÓW JWT I FLASKA ---- //
function handleApiError(res, data) {
    if (res.status === 401 || res.status === 422) {
        logout();
        showToast("Sesja wygasła. Zaloguj się ponownie.", "error");
        return;
    }
    const errorText = data.error || data.message || data.msg || `Nieznany błąd (${res.status})`;
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
            
            listContainer.innerHTML += `
                <details class="lobby-accordion" onclick="loadAccordionDetails(${game.game_id}, '${detailsId}')">
                    <summary class="lobby-summary">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="background: rgba(56, 189, 248, 0.2); border: 1px solid var(--accent-blue); color: var(--accent-blue); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;">#${game.game_id}</span>
                            <span>${lockIcon}${hostNameStr}</span>
                            <span style="font-size: 11px; background: var(--glass-bg); padding: 2px 6px; border-radius: 4px;">Tryb: ${modeText}</span>
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
    } else {
        emptyState.style.display = 'none';
        content.style.display = 'block';
        fetchLobby();
        
        if(lobbyRefreshInterval) clearInterval(lobbyRefreshInterval);
        lobbyRefreshInterval = setInterval(fetchLobby, 3000); 
    }
}

async function fetchLobby() {
    if(!currentActiveLobbyId) return updateLobbyUIState();

    try {
        const res = await fetch(`${API_URL}/games/${currentActiveLobbyId}`);
        const data = await res.json();

        if (res.ok) {
            const stat = String(data.status).toUpperCase();
            
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
            const hostDisplay = document.getElementById('lobbyHostDisplay');
            if(hostDisplay) hostDisplay.textContent = data.host_name || `Host #${data.host_id}`;
            
            // Nowoczesny podział pinu na 4 kafelki
            const codeDisplay = document.getElementById('lobbyCodeDisplay');
            if (codeDisplay) {
                codeDisplay.innerHTML = '';
                const codeStr = String(data.code || "----");
                for(let char of codeStr) {
                    codeDisplay.innerHTML += `<span class="flex h-16 w-12 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 font-mono text-4xl font-bold text-blue-400">${char}</span>`;
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

            // Aktualizacja Statusu
            if (statusBadge) {
                statusBadge.textContent = stat;
                statusBadge.className = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset";
                if(stat.includes('WAITING')) statusBadge.classList.add("bg-blue-500/15", "text-blue-400", "ring-blue-500/30");
                if(stat.includes('PENDING')) statusBadge.classList.add("bg-yellow-500/15", "text-yellow-500", "ring-yellow-500/30");
                if(stat.includes('FINISHED')) statusBadge.classList.add("bg-slate-700/50", "text-slate-400", "ring-slate-700");
                if(stat.includes('CANCELED')) statusBadge.classList.add("bg-red-500/15", "text-red-400", "ring-red-500/30");
            }

            if (modeBadge) {
                modeBadge.textContent = data.game_mode === 'SHUFFLE' ? "LOSOWY" : "WYBÓR";
                if(data.is_locked) {
                    modeBadge.textContent += " 🔒";
                    modeBadge.classList.replace("text-slate-200", "text-red-400");
                } else {
                    modeBadge.classList.replace("text-red-400", "text-slate-200");
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
                if (!autoKickInterval) {
                    let sec = 5;
                    if (matchAlert) {
                        matchAlert.className = `p-4 mb-4 rounded-xl text-center font-bold border ${stat === 'FINISHED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`;
                        matchAlert.innerHTML = `
                            ${stat === 'FINISHED' ? 'MECZ ZAKOŃCZONY' : 'MECZ ANULOWANY'} <br>
                            <span class="text-xs font-normal opacity-80 mt-1 block">Powrót do menu za <b id="kickCountdown">${sec}</b>s...</span>
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
                if (isHost) {
                    if (stat.includes('WAITING')) {
                        if (hostControls) hostControls.style.display = 'block';
                        if (startBtn) startBtn.style.display = 'block';
                        if (cancelBtn) cancelBtn.style.display = 'block';
                        
                        if (toggleLockBtn) toggleLockBtn.textContent = data.is_locked ? "🔓 Odblokuj" : "🔒 Zablokuj";
                        if (toggleModeBtn) toggleModeBtn.textContent = data.game_mode === 'SHUFFLE' ? "Tryb: Wybór" : "Tryb: Losowy";
                        if (shuffleBtn) shuffleBtn.style.display = data.game_mode === 'SHUFFLE' ? 'flex' : 'none';
                    } else if (stat.includes('PENDING')) {
                        if (finishControls) finishControls.style.display = 'block';
                    }
                } else {
                    if (leaveBtn) leaveBtn.style.display = 'block';
                    if (stat.includes('WAITING')) {
                        if (teamSelectionControls) teamSelectionControls.style.display = 'block';
                        if (data.game_mode === 'SHUFFLE') {
                            manualTeamButtons.style.display = 'none';
                            shuffleNotice.style.display = 'block';
                        } else {
                            manualTeamButtons.style.display = 'grid';
                            shuffleNotice.style.display = 'none';
                        }
                    }
                }
            }

            document.getElementById('lobbyCountDisplay').textContent = data.players_count;
            const listContainer = document.getElementById('playersListContainer');
            listContainer.innerHTML = ""; 

            if (data.players.length === 0) {
                listContainer.innerHTML = "<li class='text-center text-slate-500 py-4 text-sm'>Pusto.</li>";
            } else {
                data.players.forEach(player => {
                    let teamBadgeHtml = `<span class="inline-flex items-center rounded-full bg-slate-700/50 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-400 ring-1 ring-inset ring-slate-600">Oczekuje</span>`;
                    
                    if (player.team === 'A' || player.team === '1') {
                        teamBadgeHtml = `<span class="inline-flex items-center rounded-full bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-indigo-400 ring-1 ring-inset ring-indigo-500/30">Drużyna A</span>`;
                    } else if (player.team === 'B' || player.team === '2') {
                        teamBadgeHtml = `<span class="inline-flex items-center rounded-full bg-rose-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-rose-400 ring-1 ring-inset ring-rose-500/30">Drużyna B</span>`;
                    }

                    const isMe = (currentUser && player.player_id === currentUser.player_id) ? `<span class="text-slate-500 font-normal text-xs ml-1">(Ty)</span>` : "";
                    const isHostIcon = (player.player_id === data.host_id) ? `<span title="Host">👑</span>` : "";

                    let kickBtnHtml = "";
                    if (isHost && player.player_id !== currentUser.player_id && stat === 'WAITING') {
                        kickBtnHtml = `<button onclick="kickPlayer(${data.game_id}, ${player.player_id})" class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/15 hover:text-red-500" title="Wyrzuć">❌</button>`;
                    }
                    
                    listContainer.innerHTML += `
                        <li class="bg-slate-900/50 backdrop-blur-md flex items-center gap-3 rounded-2xl border border-slate-700/50 p-3 shadow-sm">
                            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xs font-bold uppercase text-slate-400 border border-slate-700/50">
                                ${player.name.substring(0, 2)}
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-1.5 mb-0.5">
                                    <p class="truncate text-sm font-bold text-slate-200">${player.name}${isMe}</p>
                                    <span class="text-xs">${isHostIcon}</span>
                                </div>
                                <p class="text-[10px] text-slate-500 uppercase tracking-widest">${player.university || 'N/A'}</p>
                            </div>
                            <div class="flex items-center gap-2">
                                ${teamBadgeHtml}
                                ${kickBtnHtml}
                            </div>
                        </li>
                    `;
                });
            }
        } else {
            currentActiveLobbyId = null;
            localStorage.removeItem('active_lobby_id');
            updateLobbyUIState();
            showToast("To lobby już nie istnieje", "error");
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


// ---- SYSTEM ZAPROSZEŃ Z LINKU ---- //

function copyInviteLink() {
    const gameId = document.getElementById('lobbyIdDisplay').textContent;
    const code = document.getElementById('lobbyCodeDisplay').textContent;
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
                
                // TU BYŁ BŁĄD! Baza wysyła cyfry, a nie litery!
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

// --- NOWE FUNKCJE DO LOBBY ---

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