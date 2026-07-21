from app import app, db, bcrypt
from models import Player, UniversityChoice, FacultyChoice

TEST_USERS = [
    {"name": "Marek", "email": "marek@test.pl", "pwd": "test", "uni": "PRZ", "fac": "WEII"},
    {"name": "Ania", "email": "ania@test.pl", "pwd": "test", "uni": "URZ", "fac": None},
    {"name": "Kamil", "email": "kamil@test.pl", "pwd": "test", "uni": "PRZ", "fac": "WBMiL"},
    {"name": "Zosia", "email": "zosia@test.pl", "pwd": "test", "uni": "Other", "fac": None}
]

with app.app_context():
    for u in TEST_USERS:
        if not Player.query.filter_by(email=u["email"]).first():
            hashed = bcrypt.generate_password_hash(u["pwd"]).decode('utf-8')
            player = Player(
                name=u["name"], 
                email=u["email"], 
                password=hashed, 
                is_verified=True 
            )
            db.session.add(player)
    
    db.session.commit()
    print("✅ Utworzono 4 testowe konta. Hasło do wszystkich to: test")