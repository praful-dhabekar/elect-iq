# Stage 1: Build the frontend
FROM node:20-slim AS build-frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
ARG VITE_GA_MEASUREMENT_ID
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

RUN npm run build

# Stage 2: Final Image
FROM node:20-slim
WORKDIR /app

# Copy server files to the root of /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./

# Copy the built frontend to a folder named 'public' in the root of /app
# This matches path.join(__dirname, 'public') in index.js
COPY --from=build-frontend /app/client/dist ./public

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Start from /app
CMD ["node", "index.js"]
