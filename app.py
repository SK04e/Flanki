from flask import Flask, request, jsonify
from models import db, Game, Player, Match, UniversityChoice, FacultyChoice, GameStatus, Team
import random

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flanki.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return "Serwer działa! Witamy we Flankach."

@app.route('/players', methods=['POST'])
def create_player():
    data = request.get_json()
    name = data.get('name')
    faculty = data.get('faculty')
    university = data.get('university')
    
    if not name:
        return jsonify({"error" : "Imię jest wymagane!"}), 400
    
    try:
        new_player = Player(name=name, university=university, faculty=faculty)
        
        db.session.add(new_player)
        db.session.commit()

        return jsonify({"message" : "Gracz dodany do bazy danych!", "player_id" : new_player.player_id}), 201

    except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Błąd podczas zapisu: {str(e)}"}), 400

@app.route('/games', methods=['POST'])
def create_game():
    data = request.get_json()
    creator_id = data.get('player_id')

    active_match = Match.query.join(Game).filter(
        Match.player_id == creator_id,
        Game.status.in_([GameStatus.WAITING, GameStatus.PENDING])
    ).first()

    if active_match:
        return jsonify({'error': 'Jesteś już w grze!'}), 400

    code = random.randint(1000,9999)

    try:
        new_game = Game(winning_team = None, host_id=creator_id, code = code)
        db.session.add(new_game)
        db.session.flush()

        new_match = Match(game_id = new_game.game_id, player_id = creator_id)
        db.session.add(new_match)
        db.session.commit()    

        return jsonify({"message" : "Gra utworzona!",
                         "code: " : code,
                         "game_id" : new_game.game_id
                         }), 201

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
        return jsonify({'error': 'Nie możesz dołączyć. Już jesteś w grze!'}), 400

    game = Game.query.get(joining_game_id)

    if not game:
        return jsonify({"message" : "Lobby o takim ID nie istnieje"}), 404

    print(f"DEBUG: Status to '{game.status}' a jego typ to {type(game.status)}")

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

if __name__ == '__main__':
    app.run(debug=True)

