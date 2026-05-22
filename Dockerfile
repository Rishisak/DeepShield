# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html vite.config.js eslint.config.js ./
COPY public ./public
COPY src ./src
ENV VITE_API_URL=
RUN npm run build

# Stage 2: Python backend
FROM python:3.11-slim
WORKDIR /app

# OpenCV system libs (bookworm package names)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# CPU-only PyTorch first (smaller image, fits Render free tier builds)
COPY requirements-docker.txt .
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements-docker.txt

# App code + built frontend
COPY . /app
COPY --from=frontend-builder /app/dist /app/dist

RUN mkdir -p uploads temp_frames /tmp/hf_cache

ENV PORT=10000
ENV FLASK_DEBUG=0
ENV VIT_ONLY=1
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV HF_HOME=/tmp/hf_cache
ENV TRANSFORMERS_CACHE=/tmp/hf_cache

EXPOSE 10000

CMD ["python", "app.py"]
