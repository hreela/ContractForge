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
- **June 28, 2025**: Successfully implemented comprehensive achievement badge system for smart contract milestones
  - Created achievement database schema with flexible requirement tracking system
  - Built 6 default achievement categories: deployment count, feature usage, volume trading
  - Implemented real-time achievement checking during contract creation and deployment
  - Created interactive achievement badge components with visual progress indicators
  - Added achievement notification system with animated popups for new unlocks
  - Built comprehensive achievements panel with category filtering and progress tracking
  - Integrated achievement display in navigation header showing recent unlocks
  - Tested and verified multi-achievement unlocking (governance + anti-whale + first deployment)
  - Added proper TypeScript typing for all achievement-related data structures

- **June 28, 2025**: Production deployment preparation and branding
  - Updated site title: "Deploy Smart Contracts Without Coding"
  - Created professional SVG favicon with purple-blue gradient hexagon design
  - Added comprehensive SEO meta tags including Open Graph and Twitter cards
  - Updated API client to support environment variables for production deployment
  - Created detailed deployment guide for Netlify frontend + Railway/Render backend
  - Configured netlify.toml with proper build settings and redirects

- **June 28, 2025**: Vercel deployment configuration
  - Created comprehensive Vercel deployment guide with step-by-step instructions
  - Set up API routes structure for Vercel serverless functions
  - Configured vercel.json with proper build settings and routing
  - Added @vercel/node package for serverless function types
  - Created health check, contracts, features, and achievements API endpoints
  - Documented cost analysis and performance optimization strategies

## Changelog
- June 27, 2025. Initial setup
- June 28, 2025. Dynamic pricing system fully operational
- June 28, 2025. Updated feature pricing structure:
  - Base deployment fee: 20 POL (was 5 POL)
  - Pausable: 30 POL (was 5 POL)
  - Tax: 40 POL (was 10 POL)
  - Reflection: 50 POL (was 10 POL)
  - Blacklist: 40 POL (was 10 POL)
  - Anti-whale: 60 POL (was 20 POL)
  - Timelock: 125 POL (was 25 POL)
  - Governance: 180 POL (was 35 POL)
  - Max Supply: 25 POL (was 5 POL)
  - Volume Trader achievement threshold: 500 POL (was 100 POL)

## User Preferences

Preferred communication style: Simple, everyday language.