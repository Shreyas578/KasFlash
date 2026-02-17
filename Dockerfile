FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy specific workspace package files to their structure
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/

# Install dependencies for all workspaces
RUN npm ci

# Copy source code for backend and shared
COPY backend ./backend
COPY shared ./shared

# Build shared first
RUN npm run build --workspace=shared

# Build backend
RUN npm run build --workspace=backend

# Expose the port the app runs on
EXPOSE 3001

# Start the backend
CMD ["npm", "start", "--workspace=backend"]
