# PaySwitch Credit Scoring Platform

An AI-powered credit scoring and risk assessment platform for financial institutions in Ghana. This frontend application provides an enterprise-grade interface for managing credit requests, organizations, and scoring models.

## 🚀 Key Features

### Organization Portal

- **Dashboard**: Real-time overview of scoring requests and risk distribution.
- **Score Requests**: Single and Bulk (CSV/Excel) upload capabilities.
- **Reports**: Interactive analytics with exportable data (CSV/PDF).
- **Developers**: API Key management, Webhook configuration, and IP Whitelisting.
- **Team**: Role-based access control and user management.

### Admin Portal

- **System Overview**: Platform-wide health and usage metrics.
- **Organization Management**: Onboard and manage financial institutions.
- **Model Registry**: Champion/Challenger model comparison and fairness reports.
- **Compliance**: Audit logs and data retention policies.

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI)
- **Charts**: Recharts
- **State Management**: React Context + TanStack Query
- **Forms**: React Hook Form + Zod

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/payswitch/credit-scoring-frontend.git
   cd credit-scoring-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Environment:
   Create a `.env.local` file in the root directory:

   ```env
   # Backend API URL (default to localhost for dev)
   NEXT_PUBLIC_API_URL=http://localhost:3000/api

   # Enable Mock Authentication (set to 'true' for standalone frontend dev)
   NEXT_PUBLIC_MOCK_AUTH=true
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Authentication (Dev Mode)

By default, the application runs in **Mock Auth Mode** (`NEXT_PUBLIC_MOCK_AUTH=true`).
This allows you to verify the UI without a running backend.

- **Admin Portal**: Login with any email containing "admin" (e.g., `admin@payswitch.com`).
- **Org Portal**: Login with any other email (e.g., `user@ecobank.com`).
- **Password**: Any value (e.g., `password`).
- **2FA**: If email contains "2fa", the UI will simulate a 2FA challenge.

To disable this and connect to a real backend, set `NEXT_PUBLIC_MOCK_AUTH=false`.

## 📦 Deployment

### Production Build

To build the application for production locally:

```bash
npm run build
npm start
```

## 📂 Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/           # Authentication routes (login, reset)
│   ├── (admin)/          # Admin Portal routes (/admin/...)
│   ├── (org)/            # Organization Portal routes (dashboard, requests...)
│   └── api/              # API routes (if any mock handlers used)
├── components/
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   └── ...               # Feature-specific components
├── lib/                  # Utilities, API client, helpers
├── contexts/             # React Context Providers (Auth, Theme)
└── types/                # TypeScript definitions
```

## 🤝 Contribution

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request
