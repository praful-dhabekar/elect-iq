# Stage 1: Build the frontend
FROM node:20-slim AS build-frontend
WORKDIR /app/client

# Copy package files (handling both npm and yarn possibilities)
COPY client/package*.json ./

# Install dependencies (use install instead of ci for better flexibility in CI)
RUN npm install

# Copy client source code
COPY client/ ./

# Inject the GA Measurement ID
ARG VITE_GA_MEASUREMENT_ID
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID

# Run the build (add --verbose if you need to debug further)
RUN npm run build

# Stage 2: Final Image
FROM node:20-slim
WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy server source code
COPY server/ ./server/

# Copy the built frontend to the server's public directory
COPY --from=build-frontend /app/client/dist ./server/public

WORKDIR /app/server
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["npm", "start"]
