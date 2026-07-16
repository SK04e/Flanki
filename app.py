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

app = Flask(__name__)

CORS(app)
load_dotenv()

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///flanki.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
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

    hashed = bcrypt.generate_password_hash(password).decode('utf-8')
    try:
        new_player = Player(name=name, email=email, password=hashed, university=university, faculty=faculty)
        db.session.add(new_player)
        db.session.commit()
        return jsonify({"message": "Zarejestrowano!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    player = Player.query.filter_by(email=email).first()
    if player and bcrypt.check_password_hash(player.password, password):
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
    games = Game.query.filter_by(status=GameStatus.WAITING).all()
    games_data = []
    for game in games:
        players_count = Match.query.filter_by(game_id=game.game_id).count()
        games_data.append({
            "game_id": game.game_id,
            "host_id": game.host_id,
            "players_count": players_count
        })
    return jsonify(games_data), 200

@app.route('/games', methods=['POST'])
def create_game():
    data = request.get_json()
    creator_id = data.get('player_id')

    active_match = Match.query.join(Game).filter(
        Match.player_id == creator_id,
        Game.status.in_([GameStatus.WAITING, GameStatus.PENDING])
    ).first()

    if active_match:
        return jsonify({'error': 'Jesteś już w grze!', 'game_id': active_match.game_id}), 400

    code = random.randint(1000,9999)

    try:
        new_game = Game(winning_team = None, host_id=creator_id, code = code)
        db.session.add(new_game)
        db.session.flush()

        new_match = Match(game_id = new_game.game_id, player_id = creator_id)
        db.session.add(new_match)
        db.session.commit()    

        return jsonify({"message": "Gra utworzona!", "code": code, "game_id": new_game.game_id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas zapisu: {str(e)}"}), 400

@app.route('/games/<int:game_id>', methods = ['DELETE'])
def cancel_game(game_id):
    data = request.get_json()
    requester_id = data.get('player_id')

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
def join_match(joining_game_id):
    data = request.get_json()
    code = data.get('code')
    player_id = data.get('player_id')

    active_match = Match.query.join(Game).filter(
        Match.player_id == player_id,
        Game.status.in_([GameStatus.WAITING, GameStatus.PENDING])
    ).first()

    if active_match:
        return jsonify({'error': 'Nie możesz dołączyć. Już jesteś w grze!', 'game_id': active_match.game_id}), 400

    game = Game.query.get(joining_game_id)

    if not game:
        return jsonify({"message" : "Lobby o takim ID nie istnieje"}), 404

    if game.status not in [GameStatus.WAITING, 'WAITING', 'waiting', 'GameStatus.WAITING']:
        return jsonify({"message" : "Ta gra już wystartowała lub została anulowana"}), 403

    if str(code) != str(game.code):
        return jsonify({"message" : "Błędny kod!"}), 403

    else:
        new_match = Match(game_id = joining_game_id, player_id = player_id)

        try:
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

    players_list = []
    match_info = Match.query.filter_by(game_id=game_id).all()

    for match in match_info:
        player_obj = Player.query.get(match.player_id)
        player_dict = player_obj.to_dict()
        player_dict["team"] = match.team.name if match.team else None
        players_list.append(player_dict)

    return jsonify({
        "game_id": game.game_id,
        "code": game.code,
        "status": game.status.name if game.status else None,
        "host_id": game.host_id,
        "players_count" : len(players_list),
        "players": players_list
    }), 200

@app.route('/players', methods=['GET'])
def get_players():
    players = Player.query.order_by(Player.games_won.desc()).all()
    fin_list = [player.to_dict() for player in players]
    return jsonify(fin_list), 200

@app.route('/games/<int:game_id>/leave', methods=['POST'])
def leave_game(game_id):
    data = request.get_json()
    player_id = data.get('player_id')

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
def start_game(game_id):
    data = request.get_json()
    player_id = data.get('player_id')

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

    random.shuffle(matches)
    
    half = len(matches) // 2
    team_a = matches[:half]
    team_b = matches[half:]

    for match in team_a:
        match.team = Team.A
    for match in team_b:
        match.team = Team.B

    game.status = GameStatus.PENDING
    
    try:
        db.session.commit()
        return jsonify({"message": "Gra wystartowała! Drużyny zostały wylosowane."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd bazy danych: {str(e)}"}), 500

@app.route('/games/<int:game_id>/finish', methods=['POST'])
def finish_route(game_id):
    data = request.get_json()
    player_id = data.get('player_id')
    winning_team = data.get('winning_team')

    game = Game.query.get(game_id)

    if not game:
        return jsonify({"error": "Gra nie istnieje"}), 404

    if player_id != game.host_id:
        return jsonify({"error" : "Tylko host może zakończyć grę!"}), 403

    if game.status not in [GameStatus.PENDING, 'PENDING', 'pending', 'GameStatus.PENDING']:
        return jsonify({"error" : "Gra nie jest w toku"}), 400

    game.status = GameStatus.FINISHED
    game.winning_team = Team(winning_team)

    for match in game.matches:
        player = match.player
        player.games_played += 1
        if player.team == game.winning_team:
            player.games_won += 1

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
        history_data.append(
            {   
                "ID gry" : game.game_id,
                "ID hosta" : game.host_id,
                "date": game.date.strftime("%Y-%m-%d"),
                "zwyciezcy" : game.winning_team.value if game.winning_team else None,
                "Twoja drużyna" : match.team.value if match.team else None,
                "Status gry" : game.status.value,
             }
        )

    return {"Gracz" : player.name, "Historia gry" : history_data}, 200
        
@app.route('/players/me', methods=['DELETE'])
@jwt_required()
def delete_account():
    pass

if __name__ == '__main__':
    app.run(debug=True)