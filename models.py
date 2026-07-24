import enum
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class GameStatus(enum.Enum):
    WAITING = 'waiting'
    PENDING = 'pending'
    FINISHED = 'finished'
    CANCELED = 'canceled'

class Team(enum.Enum):
    A = '1'
    B = '2'

class UniversityChoice(enum.Enum):
    PRZ = "Prz"
    URZ = "Urz"
    Other = "Inna uczelnia"

class GameMode(enum.Enum):
    MANUAL = "Manual"
    SHUFFLE = 'Shuffle'

class FacultyChoice(enum.Enum):
    WEII = 'Wydział Elektrotechniki i Informatyki'
    WC = 'Wydział Chemiczny'
    WZ = 'Wydział Zarządzania'
    WMiFS = 'Wydział Matematyki i Fizyki Stosowanej'
    WBMiL = 'Wydział Budowy Maszyn i Lotnictwa'
    WBIŚiA = 'Wydział Budownictwa, Inżynierii Środowiska i Architektury'
    WMT = 'Wydział Mechaniczno-Technologiczny'
    OTHER = 'Inny Wydział'

class Game(db.Model):
    __tablename__ = 'games'

    game_id = db.Column(db.Integer, primary_key = True)
    status = db.Column(db.Enum(GameStatus), default = GameStatus.WAITING, nullable=False)
    winning_team = db.Column(db.Enum(Team))
    host_id = db.Column(db.Integer, db.ForeignKey('players.player_id'), nullable=False)
    code = db.Column(db.Integer, nullable=False)
    is_locked = db.Column(db.Boolean, default=False)
    game_mode = db.Column(db.String(20), default='MANUAL')
    matches = db.relationship('Match')
    date = db.Column(db.DateTime, default=datetime.now)
    ended_at = db.Column(db.DateTime, nullable=True)
    location = db.Column(db.String(50), nullable=True)
    is_location_exact = db.Column(db.Boolean, default=False)
    
class Player(db.Model):
    __tablename__ = 'players'
    
    player_id = db.Column(db.Integer, primary_key = True)
    nick = db.Column(db.String(50), nullable=False, unique=True)
    name = db.Column(db.String(50), nullable=False, unique=False)
    games_played = db.Column(db.Integer, nullable=False, default=0)
    games_won = db.Column(db.Integer, nullable=False, default=0)
    university = db.Column(db.Enum(UniversityChoice), nullable=True)
    faculty = db.Column(db.Enum(FacultyChoice), nullable=True)
    email = db.Column(db.String(50), unique = True, nullable = False)
    password = db.Column(db.String(128), nullable = False)
    is_verified = db.Column(db.Boolean, default=False)
    xp = db.Column(db.Integer, default = 0)
    join_date = db.Column(db.DateTime, default = datetime.now)
    matches = db.relationship('Match')
    
    def to_dict(self):
        uni_val = self.university.value if hasattr(self.university, 'value') else self.university
        uni_name = self.university.name if hasattr(self.university, 'name') else self.university
        
        fac_val = self.faculty.value if hasattr(self.faculty, 'value') else self.faculty
        fac_name = self.faculty.name if hasattr(self.faculty, 'name') else self.faculty
        
        safe_date = self.join_date.strftime("%Y-%m-%d") if self.join_date and hasattr(self.join_date, 'strftime') else None
        
        games_p = self.games_played or 0
        games_w = self.games_won or 0
        
        return {
            "player_id": self.player_id,
            "nick": self.nick,
            "name": self.name,
            "email": self.email,
            "games_played": games_p,
            "games_won": games_w,
            "games_lost": max(0, games_p - games_w),
            "university": uni_val,
            "university_value": uni_name,
            "faculty": fac_val,
            "faculty_value": fac_name,
            "join_date": safe_date,
            "xp": getattr(self, 'xp', 0), # Złapie poprawnie "xp" bez wywalania błędu
        }

class Match(db.Model):
    __tablename__ = 'matches'

    game_id = db.Column(db.Integer, db.ForeignKey('games.game_id'), primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('players.player_id'), primary_key=True)
    team = db.Column(db.Enum(Team), nullable=True)
    game = db.relationship('Game')
    player = db.relationship('Player')