# Database Architecture

## Overview
Berkeley Brew uses Supabase as its database and authentication provider. The database schema is managed through migrations in the `supabase/migrations` directory.

## Database Schema Management

### Location
```
berkeley-brew/
└── supabase/
    └── migrations/        # Database migrations
        └── YYYYMMDDHHMMSS_initial_schema.sql  # Initial schema
```

### Migration Process
1. Create new migration files in `supabase/migrations/`
2. Name format: `YYYYMMDDHHMMSS_description.sql`
3. Push changes using Supabase CLI:
   ```bash
   supabase db push
   ```

## Core Tables

### Profiles
- Extends Supabase auth
- Stores user profile information
```sql
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
);
```

### Cafes
- Main entity for coffee shops
```sql
CREATE TABLE public.cafes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Reviews
- User reviews for cafes
```sql
CREATE TABLE public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cafe_id UUID REFERENCES public.cafes ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cafe_id, user_id)
);
```

## Security

### Row Level Security (RLS)
Each table has specific RLS policies:

#### Profiles
- Public read access
- Users can only modify their own profile

#### Cafes
- Public read access
- Only authenticated users can create

#### Reviews
- Public read access
- Authenticated users can create
- Users can only modify their own reviews

## API Integration

### Database Interaction
Database queries are organized in the API package:
```
packages/api/src/db/
├── queries/    # SQL queries
├── models/     # Database models
└── services/   # Database interaction logic
```

### Type Safety
Database types are shared across the application:
```
packages/types/db/   # Shared database types
```

## Development Workflow

1. Create new migration in `supabase/migrations/`
2. Test locally using Supabase CLI
3. Push changes to production
4. Update TypeScript types if schema changed

## Commands

```bash
# Link project
supabase link --project-ref <ref> --password <db_password>

# Push schema changes
supabase db push

# Pull current schema
supabase db pull

# Generate types
supabase gen types typescript --local > packages/types/db/index.ts
