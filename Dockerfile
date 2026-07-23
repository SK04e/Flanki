# --- ETAP 1: Budowanie frontendu (React + Vite) ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- ETAP 2: Środowisko Python (Flask + Backend) ---
FROM python:3.10-slim
WORKDIR /app

# Instalacja zależności Pythona
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Skopiowanie kodu backendu
COPY . .

# Skopiowanie zbudowanego frontendu z Etapu 1 do folderu static we Flasku
# (Upewnij się, że ścieżka do static_folder w app.py zgadza się z tym miejscem)
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Uruchomienie aplikacji
EXPOSE 5000
CMD sh -c "gunicorn app:app --bind 0.0.0.0:${PORT:-5000} --workers 1"