# ElectIQ - Election Education Assistant

![Cloud Run Deployment](https://img.shields.io/badge/Cloud%20Run-Deployed-success?logo=googlecloud)
![Node.js Version](https://img.shields.io/badge/node.js-%3E%3D20-blue?logo=nodedotjs)
![License](https://img.shields.io/badge/license-MIT-green)

ElectIQ is a modern, interactive web application designed to educate citizens about the election process. It provides factual, neutral information through a Gemini-powered chat interface, an interactive timeline, a voter readiness checklist, and a jargon buster.

## Architecture

```ascii
+-----------------------------------------------------------+
|                        FRONTEND                           |
|      (React + Vite + Tailwind CSS + Framer Motion)        |
+----------------------------+------------------------------+
                             |
                    HTTP POST /api/chat
                             |
+----------------------------v------------------------------+
|                        BACKEND                            |
|             (Node.js + Express Proxy Server)              |
|        - Securely manages Google Gemini API Key           |
+----------------------------+------------------------------+
                             |
                    Google AI SDK (gRPC/HTTPS)
                             |
+----------------------------v------------------------------+
|                     GOOGLE GEMINI AI                      |
|                  (gemini-2.0-flash)                       |
+-----------------------------------------------------------+
```

## Features

1.  **Election Chat**: Real-time interactive chat with Gemini for election-related queries.
2.  **Timeline**: Step-by-step interactive lifecycle of an election.
3.  **Voter Checklist**: LocalStorage-persisted readiness tracker.
4.  **Jargon Buster**: Interactive grid for learning common election terms.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Google Gemini API Key

### 1. Backend Setup
```bash
cd server
npm install
# Create a .env file based on env.example
cp env.example .env
# Edit .env and add your GEMINI_API_KEY
npm start
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

## Deployment
- **Frontend**: Can be built using `npm run build` and served via any static hosting or integrated into the Express server.
- **Backend**: Designed for GCP Cloud Run. Store `GEMINI_API_KEY` in GCP Secret Manager and inject as an environment variable.
