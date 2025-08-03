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
- WhatsApp integration via @whiskeysockets/baileys
- Chatbot flows and automation
- Campaign management and bulk messaging
- Multi-company/tenant support
- User management with role-based permissions
- File handling and media processing

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

# Development server with hot reload
npm run dev:server

# Build TypeScript
npm run build

# Database operations
npm run db:migrate
npm run db:seed

# Testing
npm run test
npm run lint
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
- `whaticket/frontend/src/config.js`: React configuration
- `docker-compose.yml`: Infrastructure services
- Database migrations: `whaticket/backend/src/database/migrations/`

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

Backend uses Jest with the following test cycle:
- `pretest`: Migrate and seed test database
- `test`: Run Jest tests
- `posttest`: Clean up test database

Frontend uses React Testing Library with `react-scripts test`.