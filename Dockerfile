FROM python:3.14-slim

# Instalacja Node.js (potrzebnego do zbudowania frontendu Vite)
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Budowanie frontendu
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 2. Instalacja zależności Pythona
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Kopiowanie reszty kodu backendu
COPY . .

# 4. Przeniesienie zbudowanego frontendu do folderów Flaska (static/templates)
RUN mkdir -p static templates && \
    cp -r frontend/dist/assets static/ && \
    cp frontend/dist/index.html templates/

EXPOSE 5000

CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]