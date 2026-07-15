from flask import Flask, request, jsonify
from models import db, Game, Player, Match, UniversityChoice, FacultyChoice, GameStatus, Team
import random
import os
from dotenv import load_dotenv
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token

app = Flask(__name__)
CORS(app) # To musi być tutaj, żeby frontend działał

load_dotenv()

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flanki.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-tajny-klucz-do-flanek-12345' 

db.init_app(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return "Serwer działa! Witamy we Flankach."

# --- REJESTRACJA I LOGOWANIE ---

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    university = data.get('university')
    faculty = data.get('faculty')
    
    if not name or not email or not password:
        return jsonify({"error": "Imię, email i hasło są wymagane!"}), 400
    
    if Player.query.filter_by(email=email).first():
        return jsonify({"error": "Email już istnieje"}), 409

    # Haszowanie hasła
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
    # Używamy player.password, bo tak masz w models.py
    if player and bcrypt.check_password_hash(player.password, password):
        token = create_access_token(identity=str(player.player_id))
        return jsonify({"access_token": token, "player": player.to_dict()}), 200
    return jsonify({"error": "Błędny email lub hasło"}), 401

# --- GRY ---

@app.route('/games', methods=['GET'])
def get_all_games():
    games = Game.query.filter_by(status=GameStatus.WAITING).all()
    results = []
    for g in games:
        count = Match.query.filter_by(game_id=g.game_id).count()
        results.append({"game_id": g.game_id, "host_id": g.host_id, "players_count": count})
    return jsonify(results), 200

@app.route('/games', methods=['POST'])
def create_game():
    data = request.get_json()
    creator_id = data.get('player_id')
    code = random.randint(1000,9999)
    try:
        new_game = Game(host_id=creator_id, code=code)
        db.session.add(new_game)
        db.session.flush()
        db.session.add(Match(game_id=new_game.game_id, player_id=creator_id))
        db.session.commit()
        return jsonify({"game_id": new_game.game_id, "code": code}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@app.route('/games/<int:game_id>', methods=['GET'])
def show_game(game_id):
    game = Game.query.get(game_id)
    if not game: return jsonify({"message": "Brak gry"}), 404
    matches = Match.query.filter_by(game_id=game_id).all()
    players = [ {**Player.query.get(m.player_id).to_dict(), "team": m.team.name if m.team else None} for m in matches]
    return jsonify({
        "game_id": game.game_id, "code": game.code, "status": game.status.name,
        "host_id": game.host_id, "players_count": len(players), "players": players
    }), 200

@app.route('/games/join/<int:game_id>', methods=['POST'])
def join_match(game_id):
    data = request.get_json()
    game = Game.query.get(game_id)
    if not game or str(data.get('code')) != str(game.code):
        return jsonify({"message": "Błędny kod lub brak gry"}), 403
    db.session.add(Match(game_id=game_id, player_id=data.get('player_id')))
    db.session.commit()
    return jsonify({"message": "Dołączono!"}), 201

@app.route('/players', methods=['GET'])
def get_players():
    players = Player.query.order_by(Player.games_won.desc()).all()
    return jsonify([p.to_dict() for p in players]), 200

if __name__ == '__main__':
    app.run(debug=True)