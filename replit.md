# replit.md

## Overview

This is a smart contract generator web application that allows users to create, configure, and deploy ERC-20 tokens on the Polygon network. The application features a modern React frontend with TypeScript, a Node.js/Express backend, and uses Drizzle ORM for database operations. Users can select various token features, configure them, and deploy contracts through a web interface.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend, backend, and database layers:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Node.js with Express for API endpoints
- **Database**: PostgreSQL with Drizzle ORM (configured for Neon Database)
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Web3 Integration**: Ethers.js for blockchain interactions
- **Deployment Target**: Polygon network

## Key Components

### Frontend Architecture
- **React Router**: Uses Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Web3 Integration**: Ethers.js for wallet connection and contract deployment

### Backend Architecture
- **Express Server**: RESTful API with middleware for logging and error handling
- **Contract Generation**: Service-based architecture for generating Solidity code
- **PDF Generation**: Service for creating contract documentation
- **Storage Layer**: Abstracted storage interface with in-memory implementation

### Database Schema
- **contracts**: Stores contract metadata, deployment info, and pricing
- **contract_features**: Stores feature-specific configurations
- **Relationships**: One-to-many between contracts and features

## Data Flow

1. **User Authentication**: Wallet connection through MetaMask
2. **Contract Configuration**: Users input token details and select features
3. **Code Generation**: Backend generates Solidity contract code based on configuration
4. **Deployment**: Contract is deployed to Polygon network via Web3 provider
5. **Storage**: Contract details and deployment info are stored in database
6. **Documentation**: PDF documentation is generated for deployed contracts

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React 18 with TypeScript support
- **UI Libraries**: Radix UI primitives, Lucide React icons
- **Web3**: Ethers.js for blockchain interactions
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS, class-variance-authority

### Backend Dependencies
- **Runtime**: Node.js with Express framework
- **Database**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Validation**: Zod for schema validation
- **Build Tools**: ESBuild for production builds

### Development Tools
- **Build System**: Vite for frontend, TSX for backend development
- **TypeScript**: Full TypeScript support across the stack
- **Code Quality**: Path mapping for clean imports

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: TSX for TypeScript execution with auto-reload
- **Database**: Drizzle Kit for schema management and migrations

### Production Build
- **Frontend**: Vite build to static assets
- **Backend**: ESBuild compilation to single JavaScript file
- **Database**: PostgreSQL with connection pooling

### Environment Configuration
- **Database**: Requires DATABASE_URL environment variable
- **Network**: Configured for Polygon mainnet deployment
- **Build**: Separate build processes for frontend and backend

### Key Features
- **Contract Features**: Pausable, tax, reflection, anti-whale, blacklist, max supply, timelock, governance
- **Pricing Model**: Feature-based pricing with owner deployment exemptions
- **Web3 Integration**: MetaMask connection with automatic network switching
- **Documentation**: Automated PDF generation for deployed contracts

## Recent Changes
- **June 28, 2025**: Successfully implemented dynamic platform fee management system
  - Added database-driven feature pricing with admin panel control
  - Created comprehensive admin interface at `/admin` route with real-time pricing updates
  - Implemented owner wallet authentication for admin access (0xE29BD5797Bde889ab2a12A631E80821f30fB716a)
  - Integrated wallet context for proper state management across components
  - Added dynamic pricing calculation in contract generation with database fallback
  - Verified fee updates are immediately reflected in contract costs
  - Added audit trail tracking who updated pricing and when

## Changelog
- June 27, 2025. Initial setup
- June 28, 2025. Dynamic pricing system fully operational

## User Preferences

Preferred communication style: Simple, everyday language.