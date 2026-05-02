# Stage 1: Build the frontend
FROM node:20-slim AS build-frontend
WORKDIR /app/client

# Copy client package files and install dependencies
COPY client/package*.json ./
RUN npm install

# Copy client source code and build
COPY client/ ./
# Inject the GA Measurement ID during build time
ARG VITE_GA_MEASUREMENT_ID
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
RUN npm run build

# Stage 2: Final Image
FROM node:20-slim
WORKDIR /app

# Copy server package files and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy server source code
COPY server/ ./server/

# Copy the built frontend from Stage 1 to the server's public directory
COPY --from=build-frontend /app/client/dist ./server/public

# Set the working directory to the server for the final execution
WORKDIR /app/server

# Expose the port the app runs on
EXPOSE 8080
ENV PORT=8080

# Start the server
CMD ["npm", "start"]
