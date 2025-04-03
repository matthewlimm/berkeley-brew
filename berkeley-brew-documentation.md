# Berkeley Brew Project Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Backend (API)](#backend-api)
4. [Frontend (Web)](#frontend-web)
5. [Database (Supabase)](#database-supabase)
6. [Development Workflow](#development-workflow)
7. [Troubleshooting](#troubleshooting)

## Introduction

Berkeley Brew is a hyperlocal coffee app designed for the UC Berkeley community. It provides community-driven ratings, real-time updates, and personalized coffee recommendations for coffee shops around campus.

### Key Features
- Golden Bear Score - Overall quality rating
- Grindability - Study-friendliness metrics
- Radical Score - Social justice and sustainability commitment
- Vibes - Aesthetic and ambiance ratings
- Real-time updates for crowd levels and Wi-Fi availability
- AI-powered personalized recommendations

### Tech Stack
- **Frontend**: Next.js (React 19), TailwindCSS, TypeScript
- **Backend**: Node.js (Express.js), TypeScript
- **Database**: Supabase (PostgreSQL and Auth)
- **Infrastructure**: Vercel (Web), Railway.app/Supabase (Backend), GitHub Actions (CI/CD)

## Project Structure

The project follows a monorepo structure using pnpm workspaces:

```
berkeley-brew/
├── packages/
│   ├── api/              # Backend API
│   │   └── src/
│   │       ├── config/   # Environment configuration
│   │       ├── controllers/ # Business logic
│   │       ├── db/       # Database connection
│   │       ├── middleware/ # Express middleware
│   │       ├── routes/   # API endpoints
│   │       └── types/    # TypeScript type definitions
│   │
│   └── web/             # Frontend
│       └── src/
│           ├── app/     # Next.js pages
│           ├── components/ # React components
│           └── services/ # API service layer
│
├── supabase/            # Database
│   └── migrations/      # Schema files
│
└── [config files]       # Root configuration
```

### Root Configuration Files
- `package.json` - Root package configuration
- `pnpm-workspace.yaml` - Workspace configuration
- `.env` - Environment variables (not committed to git)
- `.gitignore` - Git ignore patterns

## Backend (API)

The backend is an Express.js API built with TypeScript, located in the `packages/api` directory.

### Directory Structure

```
packages/api/
└── src/
    ├── config/         # Environment configuration
    ├── controllers/    # Business logic
    ├── db/             # Database connection
    ├── middleware/     # Express middleware
    ├── routes/         # API endpoints
    ├── types/          # TypeScript type definitions
    ├── db.ts           # Supabase client initialization
    └── index.ts        # Entry point
```

### Key Components

#### Entry Point (`index.ts`)
The main server file that:
- Loads environment variables
- Sets up Express middleware (CORS, Helmet, Morgan)
- Registers routes
- Implements error handling
- Starts the server with port retry logic

```typescript
// Example of server startup with port retry logic
const startServer = async () => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(currentPort, () => {
          console.log(`🚀 API server running on port ${currentPort}`)
          resolve(true)
        })
        
        server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            // Try next port if current one is in use
            const nextPort = parseInt(currentPort as string) + 1
            console.log(`Port ${currentPort} is in use, trying ${nextPort}`)
            currentPort = nextPort.toString()
            server.close()
            reject(error)
          } else {
            reject(error)
          }
        })
      })
      return // Server started successfully
    } catch (error) {
      // Handle retry logic
    }
  }
}
```

#### Database Connection (`db/index.ts`)
Initializes the Supabase client and exports it for use throughout the application:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

// Initialize Supabase client - so our app can interact with the database
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Re-export the Database type - allows our app to import both the client and types from a single location
export type { Database }
```

#### TypeScript Types (`types/database.types.ts`)
Contains auto-generated TypeScript types that match the Supabase database schema:

```typescript
export type Database = {
  public: {
    Tables: {
      cafes: { /* ... */ },
      reviews: { /* ... */ },
      users: { /* ... */ },
      posts: { /* ... */ }
      // other tables...
    }
  }
}
```

#### Controllers (`controllers/`)
Handle business logic for different resources:

- `cafes.ts` - Manages cafe-related operations:
  - `getAllCafes` - Fetches all cafes with their average ratings
  - `getCafeById` - Gets a single cafe with its reviews and realtime data
  - `addCafeReview` - Adds a review to a cafe

- `posts.ts` - Manages coffee post operations:
  - `addPost` - Creates a new coffee post (recipe or guide)

Example controller pattern:
```typescript
const addPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body with zod
    const validation = postSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError('Invalid post data: ' + validation.error.message, 400))
    }

    // Extract validated data
    const { title, content, type, brew_method, difficulty_level, prep_time, ingredients } = validation.data
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return next(new AppError('Authentication required', 401))
    }

    // Insert data into database
    const { data: post, error: postError } = await supabase 
      .from('posts')
      .insert({
        title, 
        content, 
        type, 
        brew_method,
        difficulty_level, 
        prep_time, 
        ingredients: ingredients || null, 
        author_id: user.id
      })
      .select()
      .single()

    // Handle errors
    if (postError) {
      return next(new AppError('Failed to create post: ' + postError.message, 500))
    }

    // Return success response
    res.status(201).json({
      status: 'success',
      data: { post }
    })
  } catch (err) {
    next(new AppError('An error occurred while creating the post', 500))
  }
}
```

#### Routes (`routes/`)
Define API endpoints and connect them to controllers:

- `cafes.ts` - Cafe-related routes
- `posts.ts` - Post-related routes

Example route definition:
```typescript
import { Router } from 'express'
import { addPost } from '../controllers/posts'

const router = Router()

router.post('/', addPost)

export default router
```

#### Middleware (`middleware/`)
Contains Express middleware for cross-cutting concerns:

- `errorHandler.ts` - Global error handling middleware

#### Environment Configuration (`config/env.ts`)
Loads and validates environment variables.

## Frontend (Web)

The frontend is a Next.js application built with React, TailwindCSS, and TypeScript, located in the `packages/web` directory.

### Directory Structure

```
packages/web/
└── src/
    ├── app/           # Next.js pages and routing
    ├── components/    # React components
    └── services/      # API service layer
```

### Key Components

#### Pages (`app/`)
Contains Next.js pages and routing configuration based on the App Router pattern.

#### Components (`components/`)
Reusable React components organized by feature or purpose.

#### Services (`services/`)
API client code that communicates with the backend:

- API request functions
- Data transformation
- Error handling

## Database (Supabase)

The database is managed through Supabase, with schema migrations stored in the `supabase/migrations` directory.

### Key Components

#### Migrations (`supabase/migrations/`)
SQL files that define the database schema and its evolution over time:

- Table definitions
- Relationships
- Indexes
- Functions and triggers
- Row-level security policies

Example migration (user profile trigger):
```sql
-- Migration: Add automatic user profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,  -- Required: matches auth.users.id
    email  -- Optional: from auth.users.email
  )
  VALUES (
    NEW.id,  -- NEW refers to the newly created auth.users record
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Database Schema

The database includes the following main tables:

1. **cafes** - Coffee shops information
   - id (UUID)
   - name
   - address
   - created_at
   - updated_at

2. **reviews** - User reviews for cafes
   - id (UUID)
   - cafe_id (Foreign key to cafes)
   - user_id (Foreign key to users)
   - content
   - rating
   - created_at

3. **users** - User profiles
   - id (UUID, matches auth.users.id)
   - username
   - created_at

4. **posts** - Coffee posts (recipes and guides)
   - id (UUID)
   - title
   - content
   - type (recipe or guide)
   - author_id (Foreign key to users)
   - brew_method
   - difficulty_level
   - prep_time
   - ingredients
   - likes_count
   - comments_count
   - updated_at
   - created_at

## Development Workflow

### Setting Up the Project

1. **Clone the repository**
   ```bash
   git clone https://github.com/matthewlimm/berkeley-brew.git
   cd berkeley-brew
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with:
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Link Supabase project**
   ```bash
   supabase link --project-ref <ref> --password <db_password>
   ```

5. **Push database schema**
   ```bash
   supabase db push
   ```

### Running the Development Servers

1. **Start the API server**
   ```bash
   pnpm --filter api dev
   ```

2. **Start the web application**
   ```bash
   pnpm --filter web dev
   ```

### Making Database Changes

1. Create a new migration file in `supabase/migrations/`
2. Push the changes using `supabase db push`
3. Update TypeScript types if necessary

### Adding New Features

1. **Backend**:
   - Add routes in `packages/api/src/routes/`
   - Implement controllers in `packages/api/src/controllers/`
   - Update TypeScript types if needed

2. **Frontend**:
   - Add pages in `packages/web/src/app/`
   - Create components in `packages/web/src/components/`
   - Implement API services in `packages/web/src/services/`

## Troubleshooting

### Common TypeScript Errors

1. **Type Mismatch Errors**
   
   Example: `Argument of type 'number' is not assignable to parameter of type 'string'`
   
   Solution: Use type assertions or convert between types explicitly:
   ```typescript
   // Convert number to string
   app.listen(port.toString(), () => {})
   
   // Or use type assertion
   app.listen(port as unknown as string, () => {})
   ```

2. **Union Type Errors**
   
   Example: `Operator '+' cannot be applied to types 'string | number' and 'number'`
   
   Solution: Narrow the type before performing operations:
   ```typescript
   // For string variables that need numeric operations
   const nextPort = parseInt(currentPort as string) + 1
   currentPort = nextPort.toString()
   ```

3. **Missing Properties Errors**
   
   Example: `Property 'posts' does not exist on type...`
   
   Solution: Ensure your type definitions are up to date with the database schema.

### Database Connection Issues

1. Check that your `.env` file contains the correct Supabase credentials
2. Verify that your Supabase project is running
3. Check for network connectivity issues

### API Request Problems

1. Verify the API endpoint URL is correct
2. Check that authentication tokens are valid
3. Examine request and response payloads for format issues
4. Look for CORS configuration problems

---

This documentation provides a comprehensive overview of the Berkeley Brew project structure, components, and development workflow. As you explore the codebase, refer back to this guide to understand how different parts of the application work together.
