# Berkeley Brew Project Structure

## Directory Overview

```
berkeley-brew/
├── docs/                    # Project documentation
│   ├── api/                # API documentation
│   └── architecture/       # System design docs
│
├── packages/               # Shared packages
│   ├── api/               # Backend API
│   │   └── src/
│   │       ├── config/    # App configuration
│   │       ├── controllers/ # Request handlers
│   │       ├── db/        # Database interaction code
│   │       ├── middleware/ # Express middleware
│   │       ├── routes/    # API routes
│   │       ├── services/  # Business logic
│   │       ├── types/    # API-specific types
│   │       └── utils/    # Helper functions
│   │
│   ├── types/            # Shared TypeScript types
│   │   ├── db/          # Database types
│   │   ├── api/         # API interfaces
│   │   └── common/      # Shared types
│   │
│   └── ui/              # Shared UI components
│       ├── components/  # React components
│       ├── hooks/       # React hooks
│       ├── styles/      # Shared styles
│       └── utils/       # UI utilities
│
├── supabase/             # Supabase configuration
│   └── migrations/       # Database migrations
│
├── scripts/              # Development scripts
│   ├── db/              # Database scripts
│   └── deploy/          # Deployment scripts
│
└── web/                 # Next.js frontend
    ├── src/
    │   ├── app/        # Next.js app router
    │   ├── components/ # App-specific components
    │   ├── hooks/      # App-specific hooks
    │   ├── lib/        # Frontend utilities
    │   ├── services/   # API integration
    │   └── styles/     # App-specific styles
    └── public/         # Static assets
```

## Directory Purposes

### Root Level
- `.env`: Environment variables
- `.env.example`: Template for environment variables
- `.gitignore`: Git ignore patterns
- `package.json`: Project dependencies and scripts
- `pnpm-workspace.yaml`: Monorepo workspace configuration

### Packages
#### API (`/packages/api/`)
- `config/`: Configuration files and environment variables
- `controllers/`: HTTP request handlers and response formatting
- `db/`: Database queries, models, and services
- `middleware/`: Express middleware (auth, validation)
- `routes/`: API endpoint definitions
- `services/`: Business logic implementation
- `types/`: API-specific TypeScript types
- `utils/`: Helper functions and utilities

#### Types (`/packages/types/`)
- `db/`: Database schema types
- `api/`: API request/response types
- `common/`: Shared utility types

#### UI (`/packages/ui/`)
- `components/`: Reusable React components
- `hooks/`: Shared React hooks
- `styles/`: Global styles and themes
- `utils/`: UI utility functions

### Supabase (`/supabase/`)
- `migrations/`: Database schema changes and migrations
- Configuration for Supabase services

### Web Application (`/web/`)
- `app/`: Next.js pages and routing
- `components/`: Page-specific components
- `hooks/`: Application-specific hooks
- `lib/`: Frontend utilities
- `services/`: API integration
- `styles/`: Page-specific styles
- `public/`: Static assets

## Best Practices
1. Keep packages modular and focused
2. Share code through the types package
3. Document architectural decisions
4. Follow consistent coding patterns
5. Write tests alongside implementation
