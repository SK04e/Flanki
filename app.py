from flask import Flask, request, jsonify, render_template
from models import db, Game, Player, Match, UniversityChoice, FacultyChoice, GameStatus, Team
import random
import os
import re
from dotenv import load_dotenv
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from itsdangerous import URLSafeTimedSerializer
from threading import Thread
import logging
import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_game_dict(game):
    players_list = []
    for match in game.matches:
        p_dict = match.player.to_dict()
        p_dict["team"] = match.team.name if match.team else None
        players_list.append(p_dict)
        
    host = Player.query.get(game.host_id)
    
    return {
        "game_id": game.game_id,
        "code": game.code,
        "status": game.status.name if game.status else None,
        "host_id": game.host_id,
        "host_name": host.name if host else "Nieznany Host",
        "players_count": len(players_list),
        "players": players_list,
        "is_locked": game.is_locked,
        "game_mode": game.game_mode,
        "location": game.location,
        "is_location_exact": game.is_location_exact,
        "start_time": game.date.isoformat() if game.date else None,
        "end_time": game.ended_at.isoformat() if game.ended_at else None,
        "winning_team": game.winning_team.name if game.winning_team else None
    }

def send_async_email(email_to, name, confirm_url):
    api_key = os.getenv('BREVO_API_KEY')
    url = "https://api.brevo.com/v3/smtp/email"
    
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }
    
    payload = {
        "sender": {"name": "Flanki Hub", "email": "flankihub@gmail.com"},
        "to": [{"email": email_to}],
        "subject": "Potwierdź swój adres e-mail we Flanki Hub!",
        "htmlContent": f"<p>Witaj {name}!</p><p>Aby aktywować konto, kliknij w poniższy link:</p><p><a href='{confirm_url}'>Aktywuj konto</a></p>"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [200, 201]:
            logging.info(f"SUKCES: Mail do {email_to} wysłany przez API Brevo!")
        else:
            logging.error(f"BŁĄD BREVO API: {response.text}")
    except Exception as e:
        logging.error(f"KRYTYCZNY BŁĄD REQUESTS W TLE: {str(e)}")

def send_reset_email(email_to, name, reset_url):
    api_key = os.getenv('BREVO_API_KEY')
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {"accept": "application/json", "api-key": api_key, "content-type": "application/json"}
    payload = {
        "sender": {"name": "Flanki Hub", "email": "flankihub@gmail.com"},
        "to": [{"email": email_to}],
        "subject": "Resetowanie hasła - Flanki Hub",
        "htmlContent": f"<p>Witaj {name}!</p><p>Aby ustawić nowe hasło, kliknij w poniższy link:</p><p><a href='{reset_url}'>Zresetuj hasło</a></p><p>Link wygasa po godzinie.</p>"
    }
    try:
        requests.post(url, json=payload, headers=headers)
    except Exception as e:
        logging.error(f"BŁĄD BREVO (RESET): {str(e)}")

app = Flask(__name__)

CORS(app)
load_dotenv()

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///flanki.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=2)

serializer = URLSafeTimedSerializer(app.config['JWT_SECRET_KEY'])

db.init_app(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    university = data.get('university')
    faculty = data.get('faculty')
    
    if not name or not email or not password:
        return jsonify({"error" : "Imię, email i hasło są wymagane!"}), 400
    if len(password) < 6:
        return jsonify({"error": "Hasło musi mieć minimum 6 znaków!"}), 400
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"error": "Niepoprawny format adresu email!"}), 400
    if Player.query.filter_by(email=email).first():
        return jsonify({"error" : "Email już istnieje"}), 409
    if Player.query.filter_by(name=name).first():
        return jsonify({"error" : "Nick już jest zajęty"}), 409

    hashed = bcrypt.generate_password_hash(password).decode('utf-8')
    try:
        new_player = Player(name=name, email=email, password=hashed, university=university, faculty=faculty, is_verified=False)
        db.session.add(new_player)
        db.session.commit()
        
        token = serializer.dumps(email, salt='email-confirm')
        base_url = os.getenv('APP_URL', 'http://127.0.0.1:5000')
        confirm_url = f"{base_url}/auth/confirm/{token}"
        
        logging.info(f"Rozpoczynam wysyłkę przez API do {email}...")
        thr = Thread(target=send_async_email, args=[email, name, confirm_url])
        thr.start()
        
        return jsonify({"message": "Zarejestrowano pomyślnie! Sprawdź skrzynkę e-mail."}), 201

    except Exception as e:
        db.session.rollback()
        logging.error(f"BŁĄD ZAPISU DO BAZY PODCZAS REJESTRACJI: {str(e)}") 
        return jsonify({"error": f"Błąd serwera: {str(e)}"}), 500

@app.route('/auth/confirm/<token>', methods=['GET'])
def confirm_email(token):
    try:
        email = serializer.loads(token, salt='email-confirm', max_age=3600)
    except Exception:
        return "Token jest nieważny lub wygasł.", 400

    player = Player.query.filter_by(email=email).first()
    if not player:
        return "Nie znaleziono użytkownika.", 404
        
    if player.is_verified:
        return "Konto już jest zweryfikowane. Możesz się zalogować.", 200
        
    player.is_verified = True
    db.session.commit()
    
    return "Twoje konto zostało pomyślnie aktywowane! Możesz zamknąć tę kartę i wejść do aplikacji.", 200

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    player = Player.query.filter_by(email=email).first()
    if player and bcrypt.check_password_hash(player.password, password):
        if not player.is_verified:
            return jsonify({"error": "Musisz najpierw zweryfikować swój adres e-mail!"}), 403

        token = create_access_token(identity=str(player.player_id))
        
        active_match = Match.query.join(Game).filter(
            Match.player_id == player.player_id,
            Game.status.in_([GameStatus.WAITING, GameStatus.PENDING])
        ).first()
        active_game_id = active_match.game_id if active_match else None

        return jsonify({
            "access_token": token, 
            "player": player.to_dict(),
            "active_game_id": active_game_id
        }), 200
    return jsonify({"error": "Błędny email lub hasło"}), 401

@app.route('/games', methods=['GET'])
def get_all_games():
    games = Game.query.filter(Game.status == GameStatus.WAITING).all()
    games_data = []

    for game in games:
        players_count = Match.query.filter_by(game_id=game.game_id).count()
        host = Player.query.get(game.host_id)
        host_name = host.name if host else "Nieznany Host"

        games_data.append({
            "game_id": game.game_id,
            "host_id": game.host_id,
            "host_name": host_name,
            "players_count": players_count,
            "location": game.location,
            "is_location_exact": game.is_location_exact,
            "is_locked": game.is_locked,
            "game_mode": game.game_mode
        })
    return jsonify(games_data), 200

@app.route('/games', methods=['POST'])
@jwt_required()
def create_game():
    creator_id = int(get_jwt_identity())
    
    data = request.get_json() or {}
    location = data.get('location', None)
    is_location_exact = data.get('is_location_exact', False)

    active_match = Match.query.join(Game).filter(
        Match.player_id == creator_id,
        Game.status.in_([GameStatus.WAITING, GameStatus.PENDING])
    ).first()

    if active_match:
        return jsonify({'error': 'Jesteś już w grze!', 'game_id': active_match.game_id}), 400

    code = random.randint(1000,9999)

    try:
        new_game = Game(winning_team=None, host_id=creator_id, code=code, is_locked=False, game_mode='MANUAL', location=location, is_location_exact=is_location_exact)
        db.session.add(new_game)
        db.session.flush()

        new_match = Match(game_id=new_game.game_id, player_id=creator_id)
        db.session.add(new_match)
        db.session.commit()    

        return jsonify({"message": "Gra utworzona!", "code": code, "game_id": new_game.game_id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas zapisu: {str(e)}"}), 400

@app.route('/games/<int:game_id>', methods = ['DELETE'])
@jwt_required()
def cancel_game(game_id):
    requester_id = int(get_jwt_identity())
    game = Game.query.get(game_id)

    if not game:
        return jsonify({"error": "Gra nie istnieje"}), 404
    if game.host_id != requester_id:
        return jsonify({"error": "Brak uprawnień. Tylko host może usunąć grę!"}), 403

    try:
        game.status = GameStatus.CANCELED
        db.session.commit()
        return jsonify({"message": "Lobby zostało pomyślnie anulowane"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas usuwania: {str(e)}"}), 500


@app.route('/games/join/<int:joining_game_id>', methods = ['POST'])
@jwt_required()
def join_match(joining_game_id):
    data = request.get_json()
    code = data.get('code')
    player_id = int(get_jwt_identity())

    active_match = Match.query.join(Game).filter(
        Match.player_id == player_id,
        Game.status.in_([GameStatus.WAITING, GameStatus.PENDING])
    ).first()

    if active_match:
        return jsonify({'error': 'Nie możesz dołączyć. Już jesteś w grze!', 'game_id': active_match.game_id}), 400

    game = Game.query.get(joining_game_id)
    if not game:
        return jsonify({"message" : "Lobby o takim ID nie istnieje"}), 404

    if game.status not in [GameStatus.WAITING]:
        return jsonify({"message" : "Ta gra już wystartowała lub została anulowana"}), 403

    if str(code) != str(game.code):
        return jsonify({"message" : "Błędny kod!"}), 403
    
    if game.is_locked:
        return jsonify({"error" : "Host zablokował dołączanie do gry w ustawieniach"}), 403

    if len(game.matches) >= 30:
        return jsonify({"error" : "Maksymalna ilość graczy w lobby to 30"}), 403


    try:
        new_match = Match(game_id = joining_game_id, player_id = player_id)
        db.session.add(new_match)
        db.session.commit()
        return jsonify({"message": "Zostałeś dodany do meczu!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas zapisu: {str(e)}"}), 400


@app.route('/games/<int:game_id>', methods=['GET'])
def show_game(game_id):
    game = Game.query.get(game_id)
    if not game:
        return jsonify({"message" : "Mecz o takim ID nie istnieje"}), 404

    return jsonify(get_game_dict(game)), 200

@app.route('/players', methods=['GET'])
def get_players():
    uni = request.args.get('university')
    fac = request.args.get('faculty')

    query = Player.query

    if uni and uni != "ALL":
        try:
            query = query.filter(Player.university == UniversityChoice[uni])
        except KeyError:
            pass

    if fac and fac != "ALL":
        try:
            query = query.filter(Player.faculty == FacultyChoice[fac])
        except KeyError:
            pass

    players = query.order_by(Player.games_won.desc()).limit(50).all()
    return jsonify([player.to_dict() for player in players]), 200

@app.route('/games/<int:game_id>/leave', methods=['POST'])
@jwt_required()
def leave_game(game_id):
    player_id = int(get_jwt_identity())

    game = Game.query.get(game_id)
    if not game:
        return jsonify({"error": "Gra nie istnieje"}), 404

    if game.host_id == player_id:
        return jsonify({"error": "Jesteś hostem! Aby wyjść, musisz zniszczyć lobby."}), 403

    match_to_delete = Match.query.filter_by(game_id=game_id, player_id=player_id).first()
    if not match_to_delete:
        return jsonify({"error": "Nie jesteś w tym lobby"}), 400

    try:
        db.session.delete(match_to_delete)
        db.session.commit()
        return jsonify({"message": "Pomyślnie opuszczono lobby"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas wychodzenia: {str(e)}"}), 500

@app.route('/games/<int:game_id>/start', methods=['POST'])
@jwt_required()
def start_game(game_id):
    player_id = int(get_jwt_identity())

    game = Game.query.get(game_id)
    if not game:
        return jsonify({"error": "Gra nie istnieje"}), 404
        
    if game.host_id != player_id:
        return jsonify({"error": "Tylko host może wystartować grę!"}), 403
        
    if game.status != GameStatus.WAITING:
        return jsonify({"error": "Ta gra już wystartowała lub jest anulowana!"}), 400
    
    matches = Match.query.filter_by(game_id=game_id).all()
    
    if len(matches) < 4:
        return jsonify({"error": "Potrzeba minimum 4 graczy, aby zacząć grę!"}), 400
    
    choosing = team_A = team_B = 0

    for match in matches:
        if match.team == Team.A:
            team_A+=1
        elif match.team == Team.B:
            team_B+=1
        else:
            choosing+=1

    if choosing > 0 and game.game_mode == 'MANUAL':
        return jsonify({"error" : "Każdy gracz musi wybrać drużynę aby zacząć grę!"}), 400

    if abs(team_A - team_B) > 1:
        return jsonify({"error" : "Różnica osób w drużynach może być maksymalnie większa o 1!"}), 403 

    game.status = GameStatus.PENDING
    game.date = datetime.now()

    try:
        db.session.commit()
        return jsonify({"message": "Gra wystartowała!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd bazy danych: {str(e)}"}), 500

@app.route('/games/<int:game_id>/shuffle', methods = ['POST'])
@jwt_required()
def shuffle(game_id):
    player_id = int(get_jwt_identity())

    game = Game.query.get(game_id)
    if not game:
        return jsonify({"error": "Gra nie istnieje"}), 404
        
    if game.host_id != player_id:
        return jsonify({"error": "Tylko host może losować drużyny!"}), 403
        
    if game.status != GameStatus.WAITING:
        return jsonify({"error": "Ta gra już wystartowała lub jest anulowana!"}), 400

    matches = Match.query.filter_by(game_id=game_id).all()

    random.shuffle(matches)
    
    half = len(matches) // 2
    team_a = matches[:half]
    team_b = matches[half:]

    for match in team_a:
        match.team = Team.A
    for match in team_b:
        match.team = Team.B

    try:
        db.session.commit()
        return jsonify({"message": "Drużyny zostało rozlosowane!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd bazy danych: {str(e)}"}), 500

@app.route('/games/<int:game_id>/finish', methods=['POST'])
@jwt_required()
def finish_route(game_id):
    data = request.get_json()
    player_id = int(get_jwt_identity())
    winning_team = data.get('winning_team')

    game = Game.query.get(game_id)

    if not game:
        return jsonify({"error": "Gra nie istnieje"}), 404

    if player_id != game.host_id:
        return jsonify({"error" : "Tylko host może zakończyć grę!"}), 403

    if game.status not in [GameStatus.PENDING, 'PENDING', 'pending', 'GameStatus.PENDING']:
        return jsonify({"error" : "Gra nie jest w toku"}), 400

    game.status = GameStatus.FINISHED

    if winning_team in ['A', 'B']:
        game.winning_team = Team[winning_team]
    elif winning_team in ['1', '2']:
        game.winning_team = Team(winning_team)
    else:
        game.winning_team = None

    for match in game.matches:
        player = match.player
        player.games_played += 1
        if match.team == game.winning_team:
            player.games_won += 1

    game.ended_at = datetime.now()

    try:
        db.session.commit()
        return jsonify({"message": "Gra zakończona! Statystyki zaktualizowane."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd bazy danych: {str(e)}"}), 500


@app.route('/players/<int:player_id>/history', methods=['GET'])
def get_history(player_id):
    player = Player.query.get_or_404(player_id)

    history_data = []
    for match in player.matches:
        game = match.game
        history_data.append({   
            "ID gry" : game.game_id,
            "ID hosta" : game.host_id,
            "date": game.date.strftime("%Y-%m-%d %H:%M") if game.date else None,
            "zwyciezcy" : game.winning_team.name if game.winning_team else None,
            "Twoja drużyna" : match.team.name if match.team else None,
            "Status gry" : game.status.name,
        })

    return {"Gracz" : player.name, "Historia gry" : history_data}, 200
        
@app.route('/players/me', methods=['DELETE'])
@jwt_required()
def delete_account():
    pass

@app.route('/games/<int:game_id>/kick/<int:player_id>', methods=['DELETE'])
@jwt_required()
def kick_player(game_id, player_id):
    host_id = int(get_jwt_identity())

    if host_id == player_id:
        return jsonify({"error": "Nie możesz wyrzucić samego siebie z lobby!"}), 400

    game = Game.query.filter(Game.game_id==game_id, Game.host_id == host_id, Game.status == GameStatus.WAITING).first()
    if not game:
        return jsonify({"error" : "Gra nie istnieje lub nie jesteś hostem"}), 403
    
    player_to_kick = Match.query.filter(Match.player_id==player_id, Match.game_id == game_id ).first()
    if not player_to_kick:
        return jsonify({"error" : "Nie ma gracza o tym ID w tym lobby"})
    
    try:
        db.session.delete(player_to_kick)
        db.session.commit()
        return jsonify({"message": "Gracz został wyrzucony z lobby."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas usuwania: {str(e)}"}), 500

@app.route('/games/details/<int:game_id>', methods=['POST'])
def get_game_details(game_id):
    game = Game.query.get(game_id)
    if not game:
        return jsonify({"error" : f"Nie znaleziono gry o id {game_id}"}), 404

    return jsonify(get_game_dict(game)), 200
        
@app.route('/games/<int:game_id>/join_team/<string:team_name>', methods=['POST'])
@jwt_required()
def join_team(team_name, game_id):
    player_id = int(get_jwt_identity())

    team_name = team_name.upper()
    if team_name not in ['A', 'B', '1', '2']:
        return jsonify({"error": "Nieprawidłowa nazwa drużyny!"}), 400

    game = Game.query.get(game_id)

    if not game:
        return jsonify({"error" : "Nie ma gry o takim ID"}), 404
    
    if game.game_mode != 'MANUAL':
        return jsonify({"error" : "Nie można zmienić drużyny w trybie shuffle!"}), 400

    if game.status not in [GameStatus.WAITING]:
        return jsonify({"error" : "Gra nie jest w toku"}), 400
    
    match = Match.query.filter_by(game_id = game_id, player_id = player_id).first()

    if not match:
        return jsonify({"error" : f"Nie jesteś w lobby o id {game_id}"}), 403

    try:
        if team_name in ['A', '1']:
            match.team = Team.A 
        else:
            match.team = Team.B
            
        db.session.commit()
        return jsonify({"message": f"Dołączono do drużyny {team_name}!"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Błąd bazy danych"}), 500

@app.route('/games/<int:game_id>/toggle_lock', methods = ['POST'])
@jwt_required()
def toggle_lock(game_id):
    host_id = int(get_jwt_identity())
    game = Game.query.filter_by(game_id= game_id).first()

    if not game:
        return jsonify({"error" : "Nie ma gry o danym ID"}), 404
    
    if game.host_id != host_id:
        return jsonify({"error" : "Tylko host może zmienić ustawienia lobby"}), 403

    try:
        game.is_locked = not game.is_locked
        db.session.commit()
        return jsonify({"message": f"Zmieniono blokadę gry na {game.is_locked}!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Błąd bazy danych"}), 500

@app.route('/games/<int:game_id>/toggle_mode', methods = ['POST'])
@jwt_required()
def toggle_mode(game_id):
    host_id = int(get_jwt_identity())
    game = Game.query.filter_by(game_id= game_id).first()

    if not game:
        return jsonify({"error" : "Nie ma gry o danym ID"}), 404
    
    if game.host_id != host_id:
        return jsonify({"error" : "Tylko host może zmienić ustawienia lobby"}), 403

    try:
        matches = Match.query.filter_by(game_id=game_id).all()

        for match in matches: 
            match.team = None

        if game.game_mode == 'SHUFFLE':
            game.game_mode = 'MANUAL'
        else:
            game.game_mode = 'SHUFFLE'
    
        db.session.commit()
        return jsonify({"message": f"Zmieniono tryb gry na {game.game_mode}!"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Błąd bazy danych"}), 500

@app.route('/system/cleanup', methods = ['GET'])
def cancel_old_games():
    limit = datetime.now() - timedelta(minutes=15)
    games = Game.query.filter(
            Game.status.in_([GameStatus.WAITING, GameStatus.PENDING]), 
            Game.date < limit
        ).all()
    
    for game in games:
        game.status = GameStatus.CANCELED
    
    try:
        db.session.commit()
        return jsonify({"message" : f"Usunięto {len(games)} starych lobby"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Błąd bazy danych"}), 500

@app.route('/stats', methods=['GET'])
def get_global_stats():
    total_players = Player.query.count()
    total_games = Game.query.filter(Game.status == GameStatus.FINISHED).count()

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    games_today = Game.query.filter(Game.date >= today, Game.status == GameStatus.FINISHED).count()
    
    return jsonify({
        "total_players": total_players,
        "total_games_played": total_games,
        "games_today": games_today
    }), 200

@app.route('/auth/reset-password-request', methods=['POST'])
def reset_password_request():
    email = request.get_json().get('email')
    if not email:
        return jsonify({"error": "Podaj adres e-mail"}), 400
        
    player = Player.query.filter_by(email=email).first()
    if player:
        token = serializer.dumps(email, salt='password-reset')
        base_url = os.getenv('APP_URL', 'http://127.0.0.1:5000')
        reset_url = f"{base_url}/?reset_token={token}"
        Thread(target=send_reset_email, args=[email, player.name, reset_url]).start()
        
    return jsonify({"message": "Jeśli e-mail istnieje w bazie, wysłano link."}), 200

@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password or len(new_password) < 6:
        return jsonify({"error": "Błędne dane lub za krótkie hasło"}), 400
        
    try:
        email = serializer.loads(token, salt='password-reset', max_age=3600)
    except Exception:
        return jsonify({"error": "Link wygasł lub jest nieprawidłowy."}), 400
        
    player = Player.query.filter_by(email=email).first()
    if not player:
        return jsonify({"error": "Nie znaleziono konta."}), 404
        
    player.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    db.session.commit()
    return jsonify({"message": "Hasło zostało pomyślnie zmienione! Możesz się zalogować."}), 200


if __name__ == '__main__':
    app.run(debug=True)