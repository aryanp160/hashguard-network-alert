# Operata File Verification System

## Overview

Operata is a blockchain-based file verification and network management system built on Solana. The application allows users to upload files to IPFS via Pinata, verify file integrity using cryptographic hashing, and manage trusted networks for collaborative file verification. The system uses Firebase for real-time data storage and includes an ELO-based reputation system for network members.

## Recent Changes (July 26, 2025)

✅ **Complete Mobile Responsiveness**: All components now fully responsive for mobile and tablet
- Dashboard header with stacked layout on mobile
- File cards with column layout for small screens
- Network manager with mobile-optimized buttons and forms
- Network members with flexible layout and proper text sizing
- File upload component with responsive drag-and-drop area

✅ **Custom Scrollbar Implementation**: Applied cyan-themed scrollbars throughout
- NetworkMembers, NetworkFilesList, FileRecords components
- Enhanced visibility with smooth transitions
- Consistent with application color scheme

✅ **UI Standardization**: Consistent button styling and interface cleanup
- Cyan theme for action buttons, gray for cancel buttons
- Removed duplicate search bars and refresh buttons
- Standardized spacing and typography across components

✅ **Network Leave Functionality**: Added secure network departure feature
- Double confirmation dialogs for leaving networks
- Admin protection (cannot leave own network)
- Proper member removal from Firebase collections
- NetworkSettings component integrated in Dashboard

✅ **Browser Extension Conversion**: Complete extension architecture created
- Manifest V3 configuration with proper permissions
- Popup interface (400x600px) with tabbed navigation
- Background service worker for persistent operations
- Content script for website integration
- Context menu for right-click file verification
- Firebase and Solana integration maintained
- Build system with Webpack and dependency bundling

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom design tokens and animations
- **State Management**: TanStack React Query for server state, local state with React hooks
- **Routing**: Wouter for client-side routing
- **Charts**: Chart.js with react-chartjs-2 for analytics visualization

### Backend Architecture
- **Server**: Express.js with TypeScript running on Node.js
- **Database**: PostgreSQL with Drizzle ORM (configured but using Neon Database)
- **Real-time Database**: Firebase Firestore for user data and network management
- **File Storage**: IPFS via Pinata for decentralized file storage
- **Blockchain**: Solana integration using @solana/web3.js and Anchor framework

### Build System
- **Development**: Vite dev server with HMR and custom error handling
- **Production**: esbuild for server bundling, Vite for client bundling
- **TypeScript**: Strict mode with path mapping for clean imports

## Key Components

### File Management System
- **File Upload**: Drag-and-drop interface with Pinata IPFS integration
- **Verification**: SHA-256 hashing for file integrity checks
- **Storage**: Metadata stored in Firebase, files on IPFS
- **Analytics**: Storage usage tracking and file statistics

### Network Management
- **Trusted Networks**: Create and join verification networks with unique join keys
- **Role-Based Access**: Admin and member roles with different permissions
- **Member Management**: ELO-based reputation system for network participants
- **Real-time Updates**: Firebase listeners for live network data

### Wallet Integration
- **Solana Wallets**: Phantom, Solflare, Backpack, and Glow wallet support
- **Authentication**: Wallet-based user identification
- **Blockchain Operations**: File metadata storage on Solana using custom program

### Alert System
- **Duplicate Detection**: Real-time alerts for file duplications across networks
- **Network Notifications**: Member join/leave and file sharing alerts
- **Status Management**: Read/unread alert tracking

## Data Flow

1. **User Authentication**: Users connect Solana wallets for identity verification
2. **File Upload Process**:
   - Files uploaded to Pinata IPFS
   - SHA-256 hash generated for verification
   - Metadata stored in Firebase
   - Optional blockchain storage using Solana program
3. **Network Operations**:
   - Networks created with unique join keys
   - Files shared within trusted networks
   - Real-time updates via Firebase listeners
4. **Verification Process**:
   - Cross-network duplicate detection
   - ELO score updates for network contributions
   - Alert generation for stakeholders

## External Dependencies

### Core Services
- **Pinata**: IPFS file storage and retrieval
- **Firebase**: Real-time database, authentication, and cloud functions
- **Neon Database**: PostgreSQL database hosting
- **Solana RPC**: Blockchain interaction on devnet

### Development Tools
- **Replit**: Development environment with live preview
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety and developer experience

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Sonner**: Toast notifications

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server on port 5173
- **Hot Module Replacement**: Real-time code updates
- **Error Overlay**: Development error handling with Replit integration

### Production Build
- **Client Build**: Static assets generated by Vite to `dist/public`
- **Server Build**: Express server bundled with esbuild to `dist/index.js`
- **Environment Variables**: Database URLs and API keys via environment

### Database Migrations
- **Drizzle Kit**: Database schema management and migrations
- **Schema Location**: `shared/schema.ts` for type-safe database operations
- **Migration Files**: Generated in `./migrations` directory

### Configuration Management
- **TypeScript**: Centralized config with path mapping
- **Tailwind**: Custom design system with CSS variables
- **PostCSS**: CSS processing with autoprefixer
- **Components**: shadcn/ui configuration for consistent styling