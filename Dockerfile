# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV VITE_API_URL=
RUN npm run build

# Stage 2: Build the Python backend
FROM python:3.9-slim
WORKDIR /app

# Install system dependencies for OpenCV and other libs
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend files
COPY . /app

# Copy the built frontend from Stage 1
COPY --from=frontend-builder /app/dist /app/dist

# Create necessary directories
RUN mkdir -p uploads temp_frames

# Make port 7860 available to the world outside this container
EXPOSE 7860

# Define environment variable
ENV PORT 7860

# Run app.py when the container launches
CMD ["python", "app.py"]
