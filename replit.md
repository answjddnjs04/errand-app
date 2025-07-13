# replit.md - REST Express App Architecture

## Overview

This is a full-stack community errand matching service called "우리동네 심부름" (Our Neighborhood Errands). The application allows users to request small tasks/errands and enables others in the community to accept and complete these tasks for compensation. It follows a location-based matching system similar to Carrot Market.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application uses a modern full-stack TypeScript architecture with a clear separation between client and server components:

### Frontend Architecture
- **Framework**: React with Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: TailwindCSS with custom CSS variables for theming
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage

### Project Structure
```
├── client/          # Frontend React application
├── server/          # Backend Express server
├── shared/          # Shared types and schemas
└── attached_assets/ # Project documentation and guidelines
```

## Key Components

### Database Schema
- **Users**: Authentication and profile information with location settings
- **Errands**: Task requests with location, urgency levels, and pricing
- **Chat Rooms**: Communication channels between requesters and runners
- **Chat Messages**: Real-time messaging for coordination
- **Sessions**: Secure session storage for authentication

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication with secure cookie storage
- User profile management with location preferences

### Errand Management
- Three urgency levels: normal (gray), urgent (green), super-urgent (red)
- Dynamic pricing: Base 3,000원 + urgency bonus + optional tips
- Location-based filtering and distance calculations
- Status tracking: pending → matched → in-progress → completed

### Real-time Features
- Chat system for requester-runner communication
- Live errand list updates
- Status change notifications

## Data Flow

1. **User Registration/Login**: Replit Auth → Session creation → User profile setup
2. **Errand Creation**: Form submission → Validation → Database storage → Live list update
3. **Errand Matching**: Browse errands → Accept errand → Chat room creation → Task coordination
4. **Task Completion**: Status updates → Payment processing → Review system

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Replit environment
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/**: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **vite**: Fast build tool and dev server
- **typescript**: Type safety across the stack
- **zod**: Schema validation for forms and API
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

### Authentication
- **openid-client**: OpenID Connect implementation
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- Replit-native development with hot reloading
- Vite dev server for frontend with Express API proxy
- PostgreSQL database provisioned through Replit
- Environment variables for database and session secrets

### Production Considerations
- **Build Process**: Vite builds frontend to `dist/public`, esbuild bundles server
- **Static File Serving**: Express serves built frontend assets
- **Database**: Production PostgreSQL with connection pooling
- **Session Security**: Secure cookies with proper session configuration

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secure session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OpenID Connect issuer (defaults to Replit)

The application is designed for mobile-first usage with responsive design patterns and follows progressive web app principles for optimal user experience on mobile devices.