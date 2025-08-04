# Whaticket Multi-Instance - AI Coding Instructions

## Architecture Overview

This is a **Whaticket** WhatsApp ticketing system with multi-tenant support. The system consists of:

- **Backend**: Node.js/TypeScript with Express, Sequelize ORM, Socket.io
- **Frontend**: React 16 with Material-UI (@mui/material v5.x)
- **Database**: PostgreSQL with Redis for caching and Bull queues
- **WhatsApp Integration**: @whiskeysockets/baileys library
- **Real-time**: Socket.io for live updates

### Key Directory Structure
```
whaticket/backend/src/     # TypeScript backend code
whaticket/frontend/src/    # React frontend code
lib/                       # Shared shell scripts for system operations
utils/                     # Utility scripts and banners
variables/                 # Environment and configuration scripts
```

## Development Workflow

### Quick Start Commands
```bash
# Complete setup (first time)
./dev-setup.sh full

# Interactive development menu
./dev-setup.sh

# Infrastructure only (Docker services)
./dev-setup.sh infra

# Backend development with hot reload
cd whaticket/backend && npm run dev

# Frontend development
cd whaticket/frontend && npm start
```

### Critical Environment Setup
- Use `--legacy-peer-deps` for all npm installs due to React 16/Material-UI compatibility
- Backend runs on port 8081, Frontend on port 3000
- Database name defaults to "whaticket" or "unkbot" for local development
- Always use `server-crack.js` for backend (not `server.js`)

## Code Patterns & Conventions

### Backend Architecture
- **Controllers**: Handle HTTP requests (`src/controllers/`)
- **Services**: Business logic layer (`src/services/`)
- **Models**: Sequelize ORM models (`src/models/`)
- **Routes**: API endpoint definitions (`src/routes/`)
- **Jobs**: Background queue processing (`src/jobs/`)
- **WebSocket**: Real-time events in `src/libs/socket.ts`

### Multi-tenant Pattern
Every entity relates to a `companyId`. Always include company context in queries:
```typescript
// Example from backend
const tickets = await Ticket.findAll({
  where: { companyId: req.user.companyId }
});
```

### Frontend State Management
- Uses Context API with hooks (`src/context/`)
- Socket.io integration in `src/hooks/useSocket.js`
- Material-UI themes in `src/layout/`
- API calls centralized in `src/services/api.js`

### Database Migrations
Always use Sequelize CLI for schema changes:
```bash
cd whaticket/backend
npx sequelize-cli migration:generate --name descriptive-name
npm run db:migrate
```

## Integration Points

### WhatsApp Connection
- Uses Baileys library with QR code authentication
- Connection instances stored in `Whatsapp` model
- Message handling in `src/services/WbotServices/`

### Queue System
- Bull queues with Redis backend
- Queue dashboard available at `/admin/queues`
- Job definitions in `src/jobs/`

### Real-time Communication
- Socket.io events defined in `src/libs/socket.ts`
- Frontend listeners in `src/context/SocketContext.js`
- Room-based updates for multi-tenant isolation

## Development Environment

### Docker Infrastructure
```bash
# Start PostgreSQL, Redis, MailHog
docker-compose up -d

# Check service status
./dev-setup.sh status
```

### Local Services
- **PostgreSQL**: localhost:5432 (username: whaticket, password: whaticket123)
- **Redis**: localhost:6379
- **MailHog**: localhost:8025 (email testing)
- **Bull Dashboard**: http://localhost:8081/admin/queues

## Common Issues & Solutions

### Node.js Compatibility
- Use Node.js v20.19.4+ with `--legacy-peer-deps`
- Frontend uses `config-overrides.js` for Webpack polyfills

### Material-UI Version Conflicts
- Project uses MUI v5 with legacy v4 styles compatibility
- Import from `@mui/material` not `@material-ui/core`

### Database Connection
- Default database is "whaticket" in Docker, "unkbot" for local
- Use `createdb unkbot` for local PostgreSQL setup

### CORS Configuration
Backend CORS is configured for localhost:3000 in development mode.

## Testing

### Backend Tests
```bash
cd whaticket/backend
npm run test  # Runs Jest with automatic DB migration/seeding
```

### Frontend Tests
```bash
cd whaticket/frontend
npm test     # React Testing Library
```

Test database automatically migrates and seeds before each test run.
