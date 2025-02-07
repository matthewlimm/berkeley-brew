# Berkeley Brew 

A hyperlocal coffee app designed for the UC Berkeley community, providing community-driven ratings, real-time updates, and personalized coffee recommendations.

## Features

- Golden Bear Score - Overall quality rating
- Grindability - Study-friendliness metrics
- Radical Score - Social justice and sustainability commitment
- Vibes - Aesthetic and ambiance ratings
- Real-time updates for crowd levels and Wi-Fi availability
- AI-powered personalized recommendations

## Tech Stack

### Frontend
- Next.js (React 19)
- TailwindCSS
- TypeScript

### Backend
- Node.js (Express.js)
- Supabase (PostgreSQL and Auth)
- Cloudinary

### Infrastructure
- Vercel (Web Deployment)
- Railway.app / Supabase (Backend)
- GitHub Actions (CI/CD)

## Project Structure

```
berkeley-brew/
├── packages/
│   ├── api/              # Backend API
│   │   └── src/
│   │       ├── routes/   # API endpoints
│   │       └── db/       # Database queries
│   │
│   └── web/             # Frontend
│       └── src/
│           ├── app/     # Next.js pages
│           └── components/ # React components
│
├── supabase/            # Database
│   └── migrations/      # Schema files
│
└── [config files]       # Root configuration
```

## Core Components

### 1. Database (Supabase)
- PostgreSQL database with Supabase
- Authentication and authorization
- Schema migrations in `supabase/migrations/`

### 2. Backend API
- Express.js server
- REST endpoints in `packages/api/src/routes/`
- Database queries in `packages/api/src/db/`

### 3. Frontend
- Next.js application
- React components
- Pages in `packages/web/src/app/`

## Getting Started

1. **Environment Setup**
   ```bash
   # Install dependencies
   pnpm install
   ```

2. **Database Setup**
   ```bash
   # Link Supabase project
   supabase link --project-ref <ref> --password <db_password>
   
   # Push schema
   supabase db push
   ```

3. **Run Development Servers**
   ```bash
   # Start API server
   pnpm --filter api dev
   
   # Start web application
   pnpm --filter web dev
   ```

## Development Workflow

1. **Database Changes**
   - Create migrations in `supabase/migrations/`
   - Push using `supabase db push`

2. **API Development**
   - Create routes in `packages/api/src/routes/`
   - Add database queries in `packages/api/src/db/`

3. **Frontend Development**
   - Add pages in `packages/web/src/app/`
   - Create components in `packages/web/src/components/`

## Environment Variables

Required variables in `.env`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Contributing

Please read our [Contributing Guidelines](./CONTRIBUTING.md) before submitting any pull requests.

## License

MIT
