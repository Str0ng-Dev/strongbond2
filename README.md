# StrongBond Organization Platform

A streamlined organization onboarding and dashboard platform for spiritual communities.

## Features

- **Organization Onboarding**: Complete setup flow for creating organizations
- **Admin Dashboard**: Professional dashboard for organization management
- **Authentication**: Secure user authentication with Supabase
- **Responsive Design**: Mobile-first design with modern UI

## Tech Stack

- React 18 with TypeScript
- Tailwind CSS for styling
- Supabase for backend and authentication
- Vite for development and building
- Lucide React for icons

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── orgOnboarding/     # Organization onboarding steps
│   ├── OrgDashboard.tsx   # Main dashboard component
│   └── OrgOnboardingFlow.tsx
├── utils/
│   └── orgOnboarding.ts   # Organization utilities
├── lib/
│   └── supabase.ts        # Supabase client
└── App.tsx                # Main app component
```

## Build

```bash
npm run build
```