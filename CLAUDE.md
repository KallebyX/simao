# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

Whaticket is a WhatsApp ticketing system with a Node.js/TypeScript backend and React frontend, designed for customer service automation.

### System Structure
- **Backend**: Express.js + TypeScript + Sequelize ORM (`whaticket/backend/`)
- **Frontend**: React 16 + Material-UI (`whaticket/frontend/`)
- **Database**: PostgreSQL with Redis for caching and job queues
- **WebSocket**: Socket.io for real-time communication
- **Queue System**: Bull (Redis-based) for background job processing

### Key Services
- **WhatsApp Integration**: @whiskeysockets/baileys for multi-device connections
- **Real-time Communication**: Socket.io for live updates
- **Queue Processing**: Bull (Redis) for background jobs and message handling
- **Chatbot Flows**: Dialog-based automation with flow builder
- **Campaign Management**: Bulk messaging with scheduling
- **Multi-tenant Architecture**: Company-based isolation
- **Authentication**: JWT-based with refresh tokens
- **File Processing**: Multer + Jimp for media handling
- **Error Tracking**: Sentry integration for production monitoring

## Development Commands

### Quick Setup
```bash
# Complete development setup (recommended for first run)
./dev-setup.sh full

# Interactive menu
./dev-setup.sh

# Infrastructure only (Docker services)
./dev-setup.sh infra

# Application only
./dev-setup.sh app
```

### Backend Development
```bash
cd whaticket/backend

# Development server with hot reload (watch mode)
npm run dev

# Development server (using compiled files)
npm run dev:server

# Force development mode
npm run dev:force

# Build TypeScript
npm run build

# Watch mode for TypeScript compilation
npm run watch

# Start production server
npm start

# Database operations
npm run db:create
npm run db:migrate
npm run db:seed
npm run db:drop

# Testing
npm run test
npm run lint

# Single test file
npm run test -- path/to/test.spec.ts
```

### Frontend Development
```bash
cd whaticket/frontend

# Development server
npm start

# Build for production
npm run build

# Build for development (with source maps)
npm run builddev

# Testing
npm test
```

### Infrastructure Management
```bash
# Start all Docker services (PostgreSQL, Redis, MailHog)
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Status check
./dev-setup.sh status
```

## Database Architecture

The system uses Sequelize ORM with PostgreSQL. Key models include:
- **Companies**: Multi-tenant support
- **Users**: Authentication and role management
- **Contacts**: Customer contact information
- **Tickets**: Customer service tickets
- **Messages**: WhatsApp messages
- **Whatsapps**: WhatsApp connection instances
- **Queues**: Service departments/categories
- **Chatbots**: Automated response flows
- **Campaigns**: Bulk messaging campaigns

## Key Configuration Files

- `whaticket/backend/.env`: Backend environment variables
- `whaticket/frontend/.env`: Frontend environment variables
- `whaticket/frontend/src/config.js`: React configuration utilities
- `whaticket/frontend/config-overrides.js`: Webpack customizations
- `docker-compose.yml`: Infrastructure services (PostgreSQL/Redis/MailHog)
- `jest.config.js`: Backend test configuration
- Database migrations: `whaticket/backend/src/database/migrations/`
- TypeScript configs: `tsconfig.json` in both backend and frontend

## Server Architecture

### Startup Process
The backend server (`src/server.ts`) follows this initialization sequence:
1. Load environment configuration
2. Initialize database connections
3. Start all active WhatsApp sessions for each company
4. Initialize Redis-based queue processing
5. Setup Socket.io for real-time communication
6. Start HTTP/HTTPS server based on CERTIFICADOS environment variable

### Queue System
- **Message Queue**: Handles WhatsApp message processing
- **Scheduled Messages**: Manages campaign and scheduled message delivery  
- **Bull Board**: Web UI for queue monitoring at `/admin/queues` (if enabled)
- **Background Jobs**: File processing, message delivery, session management

### WhatsApp Session Management
- Multi-instance support with one session per company
- Automatic session restoration on server restart
- Session state stored in PostgreSQL with Baileys integration
- Real-time status updates via Socket.io

## Development Environment

- **Backend Port**: 8081
- **Frontend Port**: 3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MailHog Web UI**: localhost:8025

## Important Notes

- This is a development-optimized setup with private tokens removed
- Uses local Docker services instead of external dependencies
- SSL/HTTPS disabled for local development
- Email configured to use local MailHog for testing
- All payment gateway tokens are zeroed out for security

## Testing

### Backend Testing
Backend uses Jest with TypeScript support:
- **Test files**: Located in `**/__tests__/**/*.spec.ts`
- **Coverage**: Collects coverage from `src/services/**/*.ts`
- **Test cycle**:
  - `pretest`: Migrate and seed test database
  - `test`: Run Jest tests with coverage
  - `posttest`: Clean up test database
- **Configuration**: `jest.config.js` with ts-jest preset

### Frontend Testing
Frontend uses React Testing Library with Create React App:
- **Test runner**: `react-app-rewired test`
- **Framework**: Jest + React Testing Library
- **Watch mode**: Enabled by default in development

### Running Tests
```bash
# Backend tests
cd whaticket/backend
npm run test

# Frontend tests
cd whaticket/frontend
npm test

# Run specific test file
cd whaticket/backend
npm run test -- path/to/specific.spec.ts
```