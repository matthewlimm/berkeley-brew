# Berkeley Brew 🐻☕️

A hyperlocal coffee app designed for the UC Berkeley community, providing community-driven ratings, real-time updates, and personalized coffee recommendations.

## Features

- 🐻 Golden Bear Score - Overall quality rating
- 📖 Grindability - Study-friendliness metrics
- ✊ Radical Score - Social justice and sustainability commitment
- 🎨 Vibes - Aesthetic and ambiance ratings
- 🔥 Real-time updates for crowd levels and Wi-Fi availability
- 🤖 AI-powered personalized recommendations

## Tech Stack

### Frontend
- Next.js (React 19)
- TailwindCSS
- TypeScript

### Backend
- Node.js (Express.js)
- PostgreSQL (Supabase)
- Firebase Auth
- Cloudinary

### Infrastructure
- Vercel (Web Deployment)
- Railway.app / Supabase (Backend)
- GitHub Actions (CI/CD)

## Project Structure

```
berkeley-brew/
├── web/                   # Next.js web application
├── packages/              # Shared packages
│   ├── api/              # Express.js backend
│   ├── ui/               # Shared UI components
│   └── types/            # Shared TypeScript types
├── docs/                 # Documentation
└── scripts/             # Development scripts
```

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start development servers:
   ```bash
   # Web development
   pnpm dev
   
   # Backend development
   pnpm dev:api
   ```

## Contributing

Please read our [Contributing Guidelines](./CONTRIBUTING.md) before submitting any pull requests.

## License

MIT
