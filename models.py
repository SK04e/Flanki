import enum
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class GameStatus(enum.Enum):
    WAITING = 'waiting'
    PENDING = 'pending'
    FINISHED = 'finished'

class Team(enum.Enum):
    A = 'A'
    B = 'B'

class UniversityChoice(enum.Enum):
    PRZ = "Prz"
    URZ = "Urz"
    Other = "Inny"

class FacultyChoice(enum.Enum):
    WEII = 'Wydział Elektrotechniki i Informatyki'
    WC = 'Wydział Chemiczny'
    WZ = 'Wydział Zarządzania'
    WMiFS = 'Wydział Matematyki i Fizyki Stosowanej'
    WBMiL = 'Wydział Budowy Maszyn i Lotnictwa'
    WBIŚiA = 'Wydział Budownictwa, Inżynierii Środowiska i Architektury'
    WMT = 'Wydział Mechaniczno-Technologiczny'

class Game(db.Model):
    __tablename__ = 'Games'

    game_id = db.Column(db.Integer, primary_key = True)
    date = db.Column(db.DateTime, default=datetime.now)
    status = db.Column(db.Enum(GameStatus), default = GameStatus.WAITING, nullable=False)
    winning_team = db.Column(db.Enum(Team))
    
class Player(db.Model):
    __tablename__ = 'Players'
    
    player_id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(50), nullable=False)
    games_played = db.Column(db.Integer, nullable=False, default=0)
    games_won = db.Column(db.Integer, nullable=False, default=0)
    university = db.Column(db.Enum(UniversityChoice), nullable=False)
    faculty = db.Column(db.Enum(FacultyChoice), nullable=True) 

class Match(db.Model):
    __tablename__ = 'Matches'

    match_id = db.Column(db.Integer, primary_key = True)
    game_id = db.Column(db.Integer, db.ForeignKey('Games.game_id'), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('Players.player_id'), nullable=False)
    team = db.Column(db.Enum(Team), nullable=False)