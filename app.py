from flask import Flask, request, jsonify
from models import db, Game, Player, Match, UniversityChoice, FacultyChoice
import random

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flanki.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

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
        return jsonify({"error" : "The name is required"}), 400
    
    try:
        new_player = Player(name=name, university=university, faculty=faculty)
        
        db.session.add(new_player)
        db.session.commit()

        return jsonify({"message" : "Player has been added to the database", "player_id" : new_player.player_id}), 201

    except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Błąd podczas zapisu: {str(e)}"}), 400

@app.route('/games', methods=['POST'])
def create_game():
    data = request.get_json()
    creator_id = data.get('player_id')

    active_match = Match.query.join(Game).filter(
        Match.player_id == creator_id,
        Game.status == 'waiting' or Game.status == 'pending'
    )

    if active_match:
        return jsonify({'error': 'You are already in a game'}), 400

    code = random.randint(0,9999)

    try:
        new_game = Game(winning_team = None)
        db.session.add(new_game)
        db.session.commit()
        return jsonify({"message" : "The game has been created"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas zapisu: {str(e)}"}), 400

if __name__ == '__main__':
    app.run(debug=True)

