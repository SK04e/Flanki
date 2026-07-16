# 🎯 Flanki

A web application for managing and tracking **Flanki** games in real time.

The application allows players to create game rooms, join matches using a unique code, assign teams, track scores, and maintain player statistics.

> This project was created as a portfolio project to practice full-stack web development using Flask and JavaScript.

---

## ✨ Features

- 👤 User registration and login
- 🔐 JWT authentication
- 🎮 Create game rooms
- 🔑 Join a game using a room code
- 👥 Automatic player management
- 🔴 Team assignment
- 🏆 Live score tracking
- 📊 Player statistics
- 🥇 Ranking system
- 📱 Responsive interface

---

## 🛠 Tech Stack

### Backend

- Python
- Flask
- Flask-JWT-Extended
- SQLAlchemy

### Frontend

- HTML5
- CSS3
- JavaScript (Vanilla)

### Deployment

- Render
- GitHub
- Neon

---

## 📂 Project Structure

```
Flanki/
│
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── database.py
│   └── ...
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── requirements.txt
└── README.md
```

---

## 🔑 Main API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | /register | Register user |
| POST | /login | Login |
| POST | /games | Create game |
| POST | /join | Join game |
| POST | /leave | Leave game |
| GET | /games | List games |
| POST | /score | Add score |
| GET | /ranking | Player ranking |

---

## 📈 Future Improvements

- Docker support
- PostgreSQL
- WebSockets for live updates
- Match history
- Detailed statistics
- Team balancing
- Friends system
- Tournament mode
- Mobile application

---

## 📄 License

This project is intended for educational and portfolio purposes.