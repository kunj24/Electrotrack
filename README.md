# Electrotrack

A modern e-commerce platform built with Next.js, TypeScript, and MongoDB.

## Highlights

- **Authentication**: Secure user and admin login flows
- **Product & Inventory**: Full CRUD via admin dashboard
- **Cart & Orders**: Persistent carts, order placement, tracking timeline
- **Payments**: Razorpay integration with server-side verification
- **Analytics**: Admin insights on transactions and orders
- **Responsive UI**: Tailwind CSS and shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Payments**: Razorpay
- **UI Library**: shadcn/ui

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay account (test or live keys)

### Setup

1. Clone and install:
```bash
git clone https://github.com/kunj24/Electrotrack.git
cd Electrotrack
npm install
```

2. Environment variables: create `.env.local` at repo root.
```env
# MongoDB
MONGODB_URI=[YOUR_MONGODB_CONNECTION_STRING]
DATABASE_NAME=electrotrack

# Razorpay
RAZORPAY_KEY_ID=[YOUR_RAZORPAY_KEY_ID]
RAZORPAY_KEY_SECRET=[YOUR_RAZORPAY_SECRET]
```

3. Run:
```bash
npm run dev
```
Open `http://localhost:3000`.

### Common Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm start` — run production build

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── admin/              # Admin dashboard
│   ├── cart/               # Cart page
│   ├── dashboard/          # User dashboard
│   └── ...                 # Other pages
├── components/             # Reusable UI components
├── lib/                    # Utilities, db, auth
├── public/                 # Static assets
└── styles/                 # Global styles
```

## Features in Detail

### User
- Browse products, add to cart, checkout
- Persisted cart and saved addresses
- View order status and tracking timeline

### Admin
- Manage products and inventory (CRUD)
- View, edit, and delete orders
- Transactions management and analytics

## Security & Secrets

- Environment files (`.env.local`) are **gitignored** and must not be committed.
- Do not include secrets in documentation or code samples.
- If a secret was ever committed, rotate the credential and remove it from history.

## Contribution Guide

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

## License

MIT License — see `LICENSE` for details.
