# VedaAI Assessment Creator

VedaAI is a full-stack AI assessment creator for teachers. It follows the provided Figma/UI references in `ui/` and implements the flow from assignment creation to background generation to a structured printable question paper.

Figma reference:

- https://www.figma.com/design/nB2HMm1BhTpmHcHrmEslGB/VedaAI---Hiring-Assignment?node-id=0-1&t=UjYQLgEek4u99AA4-1

## Architecture

- `apps/web`: Next.js + TypeScript frontend with Zustand state management and Socket.IO client updates.
- `apps/api`: Express + TypeScript backend with REST APIs, Socket.IO, MongoDB persistence, Redis/BullMQ jobs, OpenAI structured generation, and local fallbacks.
- `packages/shared`: Shared TypeScript contracts for assignments, generation progress, and generated papers.

The backend is designed around clean boundaries:

- Routes validate input and call application services.
- Repository stores assignments and generated papers in MongoDB when `MONGODB_URI` is present, otherwise memory for quick demos.
- Queue uses BullMQ when `REDIS_URL` is present, otherwise an in-process async worker.
- Generator uses OpenAI structured JSON when `OPENAI_API_KEY` is present, validates the response with Zod, and maps it into app-owned paper objects. It never renders raw model text.

## Features

- Assignment list and empty state based on the supplied desktop/mobile references.
- Create assignment form with file upload selection UI, due date, question type rows, count/marks steppers, source material, and validation.
- Real-time generation progress over WebSocket.
- Structured question paper output with student info lines, sections, instructions, difficulty tags, and marks.
- Backend PDF download endpoint powered by a BullMQ PDF job.
- Responsive desktop and mobile layouts.

## Setup

Install dependencies:

```bash
npm install
```

Start MongoDB and Redis for the complete backend flow:

```bash
docker compose up -d
```

Create `apps/api/.env`:

```bash
PORT=4000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/veda-ai
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Run the API:

```bash
npm run dev:api
```

Run the web app:

```bash
npm run dev:web
```

Open:

```text
http://localhost:3000
```

## Runtime Modes

Full assignment mode:

- MongoDB stores assignments and generated papers.
- Redis powers BullMQ queue state and short-lived assignment/paper response caching.
- BullMQ processes generation and PDF jobs in the background.
- Socket.IO sends real-time progress to the frontend.
- OpenAI returns structured JSON, which is validated and rendered as sections/questions.

Demo mode:

- If `MONGODB_URI`, `REDIS_URL`, or `OPENAI_API_KEY` are missing, the app still runs with memory storage, an in-process worker, and deterministic structured generation.

## Useful Commands

```bash
npm run typecheck
npm run build
npm run dev:api
npm run dev:web
```
