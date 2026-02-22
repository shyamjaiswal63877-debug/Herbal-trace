# HerbalTrace

A supply chain traceability platform for herbal products, built with React, TypeScript, and Supabase. HerbalTrace enables end-to-end tracking of herbal goods from collection through processing, quality testing, and final delivery — with blockchain-backed records and QR code scanning at every step.

## Features

- **Role-based dashboards** for aggregators, factory operators, lab technicians, and consumers
- **Blockchain records** — immutable transaction log with hash chaining for tamper-evident traceability
- **QR code generation & scanning** — generate QR codes for batches; scan them to retrieve full provenance
- **Authentication & authorization** via Supabase Auth with role enforcement
- **PDF export** — generate traceability reports using jsPDF and html2canvas
- **Data visualization** — charts powered by Recharts and Chart.js
- **Responsive UI** built with shadcn/ui, Radix UI primitives, and Tailwind CSS

## Roles

| Role | Access |
|------|--------|
| `aggregator` | Manage and register herbal batches from collectors |
| `factory` | Process and transform aggregated batches |
| `lab` | Submit quality test results for batches |
| `consumer` | Look up product provenance via QR code |
| `admin` | Full access across all dashboards |

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** shadcn/ui, Radix UI, Tailwind CSS, Lucide icons
- **Backend / Auth:** Supabase (PostgreSQL + Auth)
- **Forms:** React Hook Form + Zod
- **Data fetching:** TanStack Query (React Query v5)
- **QR codes:** qrcode, qrcode.react, @zxing/library
- **Charts:** Recharts, Chart.js
- **PDF:** jsPDF, html2canvas
- **Routing:** React Router v6
- **Package manager:** Bun

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/)
- A [Supabase](https://supabase.com/) project

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd HerbalTrace

# Install dependencies
bun install
# or
npm install
```

### Environment Setup

Create a `.env.local` file in the project root and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Migrations

Apply the included migrations to your Supabase project:

```bash
supabase db push
```

Migration files are located in `supabase/migrations/`.

### Development

```bash
bun run dev
# or
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
bun run build
# or
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── auth/           # Login / registration form
│   ├── hooks/          # Shared component hooks
│   ├── layout/         # Dashboard layout wrapper
│   ├── ui/             # shadcn/ui component library
│   └── QRCodeScanner.tsx
├── hooks/
│   ├── useAuth.tsx     # Authentication context & hook
│   └── use-toast.ts
├── integrations/
│   └── supabase/       # Supabase client & generated types
├── lib/
│   └── utils.ts
├── pages/
│   ├── Home.tsx
│   ├── AggregatorDashboard.tsx
│   ├── Factory.tsx
│   ├── lab.tsx
│   └── ConsumerPortal.tsx
├── types/
└── utils/
    └── blockchain.ts   # Blockchain record helpers & hash utilities
```

## Deployment

The project includes a `vercel.json` configuration for one-click deployment to [Vercel](https://vercel.com/). Set the same environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in your Vercel project settings before deploying.

## License

MIT
