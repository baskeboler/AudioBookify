# PDF to Audiobook Converter

## Overview

This is a full-stack web application that converts PDF documents into audiobooks using AI-powered text-to-speech technology. Users can upload PDF files, which are processed to extract text, converted to audio using OpenAI's TTS service, and optionally rendered as MP4 videos. The application includes user authentication via Replit Auth, subscription management through Stripe, and a modern React frontend built with shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **File Processing**: Multer for file uploads, pdf-parse for PDF text extraction
- **Authentication**: Passport.js with OpenID Connect strategy for Replit Auth
- **Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple

### Database Schema
- **Users Table**: Stores user profiles with Stripe customer/subscription IDs
- **Audiobooks Table**: Contains PDF metadata, file paths, processing status, and audio/video output paths
- **Listening Progress Table**: Tracks user progress through audiobooks
- **Sessions Table**: Required for Replit Auth session persistence

### PDF Processing Pipeline
1. **Upload & Validation**: PDF files uploaded via multipart form data with size/type validation
2. **Text Extraction**: Uses pdf-parse library to extract text content and metadata
3. **Text Processing**: Cleans and formats text for optimal TTS conversion
4. **Audio Generation**: Converts text to speech using OpenAI's TTS API with chunking for large documents
5. **Video Creation**: Optionally combines audio chunks and creates MP4 files using FFmpeg

### Authentication & Authorization
- **Provider**: Replit's OpenID Connect authentication
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **User Management**: Automatic user creation/updates on successful authentication
- **Route Protection**: Middleware-based authentication checks for API endpoints

### Payment Processing
- **Provider**: Stripe for subscription billing
- **Integration**: React Stripe.js for frontend payment forms
- **Webhooks**: Server-side handling of Stripe events for subscription management
- **Customer Portal**: Integration with Stripe's hosted customer portal

### File Storage & Management
- **Upload Directory**: Local filesystem storage for uploaded PDFs
- **Audio Output**: Generated audio files stored in dedicated audio directory  
- **Video Output**: Optional MP4 files stored in video directory
- **File Cleanup**: Configurable retention policies for processed files

## External Dependencies

### Core Services
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Authentication**: Replit OpenID Connect service
- **AI/ML**: OpenAI API for text-to-speech conversion
- **Payments**: Stripe for subscription billing and payment processing

### Development Tools
- **Build System**: Vite with React plugin for frontend bundling
- **Type Checking**: TypeScript compiler with strict mode enabled
- **Database Migrations**: Drizzle Kit for schema migrations
- **Media Processing**: FFmpeg for audio/video manipulation

### Third-Party Libraries
- **UI Framework**: Radix UI primitives with shadcn/ui styling
- **HTTP Client**: Native fetch API with custom error handling
- **Form Validation**: Zod schema validation
- **Date Handling**: Native JavaScript Date objects
- **File Processing**: multer, pdf-parse for document handling
- **Session Management**: express-session with PostgreSQL store

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for TTS services
- `STRIPE_SECRET_KEY`: Stripe secret key for payment processing
- `VITE_STRIPE_PUBLIC_KEY`: Stripe publishable key for frontend
- `SESSION_SECRET`: Secret for session encryption
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OpenID Connect issuer URL