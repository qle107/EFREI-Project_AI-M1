# CineMatch — Frontend

Modern movie recommendation UI built with Next.js, Tailwind CSS, and Framer Motion.

## Features

- **Login** — JWT-based authentication
- **Home** — Hero banner, recommended carousels, movie modal
- **Recommend** — Submit preferences and get AI-powered movie suggestions

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from the example:

   ```bash
   cp .env.local.example .env.local
   ```

3. Set your API URL in `.env.local`:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

4. Run the backend API (from the project root) before starting the frontend.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Demo credentials

- Username: `admin`
- Password: `admin`
