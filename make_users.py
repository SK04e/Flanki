from app import app, db, bcrypt
from models import Player, UniversityChoice, FacultyChoice

TEST_USERS = [
    {"name": "Marek", "nick" : "mareczek" ,"email": "marek@test.pl", "pwd": "testtest", "uni": "PRZ", "fac": "WEII"},
    {"name": "Ania", "nick" : "aneczka" , "email": "ania@test.pl", "pwd": "testtest", "uni": "URZ", "fac": None},
    {"name": "Kamil", "nick" : "kamilek" , "email": "kamil@test.pl", "pwd": "testtest", "uni": "PRZ", "fac": "WBMiL"},
    {"name": "Zosia", "nick" : "zosiula" , "email": "zosia@test.pl", "pwd": "testtest", "uni": "Other", "fac": None}
]

with app.app_context():
    for u in TEST_USERS:
        if not Player.query.filter_by(email=u["email"]).first():
            hashed = bcrypt.generate_password_hash(u["pwd"]).decode('utf-8')
            player = Player(
                name=u["name"], 
                nick=u["nick"],
                email=u["email"], 
                password=hashed, 
                is_verified=True 
            )
            db.session.add(player)
    
    db.session.commit()
    print("✅ Utworzono 4 testowe konta. Hasło do wszystkich to: testtest")