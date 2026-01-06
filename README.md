<div align="center">

# ⚡ Electrotrack

### Premium Electronics E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.8-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**A modern, full-stack e-commerce solution for electronics retail built with cutting-edge technologies**

[Features](#-features) • [Quick Start](#-quick-start) • [Tech Stack](#️-tech-stack) • [Deployment](#-deployment) • [Contributing](#-contributing)


</div>

## 🎯 Overview

**Electrotrack** is a production-ready e-commerce platform designed specifically for electronics retail businesses. Built with Next.js 15 and TypeScript, it offers a complete solution for managing products, processing orders, and tracking business analytics with a beautiful, responsive user interface.

### ✨ Why Electrotrack?



## ✨ Features

<table>
<tr>
<td width="50%">

### 👥 Customer Features

  - Email/Password login
  - Google OAuth integration
  - Email verification

  - Advanced product search & filters
  - Category-based browsing
  - Detailed product pages with reviews
  - Real-time stock availability

  - Persistent cart across sessions
  - Multiple address management
  - Razorpay payment gateway
  - Order confirmation & receipts

  - Order history & tracking
  - Real-time status updates
  - Tracking timeline visualization
  - Order cancellation support

</td>
<td width="50%">

### 👨‍💼 Admin Features

  - Revenue & sales metrics
  - Order statistics
  - Customer insights
  - Visual charts & graphs

  - Product CRUD operations
  - Bulk inventory updates
  - Category management
  - Image upload & optimization

  - Order status management
  - Customer information access
  - Transaction tracking
  - Refund processing

  - Payment verification
  - Transaction history
  - Revenue reports
  - Payment reconciliation

</td>
</tr>
</table>


## 🛠️ Tech Stack

<table>
<tr>
<td>

**Frontend**

</td>
<td>

**Backend**

</td>
<td>

**Development**

</td>
</tr>
</table>


## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:


### Installation

1️⃣ **Clone the repository**

```bash
git clone https://github.com/kunj24/Electrotrack.git
cd Electrotrack
```

2️⃣ **Install dependencies**

```bash
pnpm install
# or
npm install
```

3️⃣ **Environment Setup**

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string
DATABASE_NAME=electrotrack

# Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Authentication (Optional)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Email Service (Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

4️⃣ **Initialize Database**

Visit `http://localhost:3000/api/setup-database` after starting the dev server to initialize sample data.

5️⃣ **Start Development Server**

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉


## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm build` | Create optimized production build |
| `pnpm start` | Run production server |
| `pnpm lint` | Run ESLint for code quality checks |


## 📁 Project Structure

```
Electrotrack/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── products/             # Product management
│   │   ├── orders/               # Order processing
│   │   ├── payment/              # Payment gateway
│   │   └── admin/                # Admin operations
│   ├── admin/                    # Admin dashboard pages
│   ├── dashboard/                # Customer dashboard
│   ├── cart/                     # Shopping cart
│   ├── profile/                  # User profile
│   └── ...                       # Other pages
├── components/                   # Reusable React components
│   ├── ui/                       # shadcn/ui components
│   ├── header.tsx                # Main navigation
│   ├── footer.tsx                # Site footer
│   └── ...                       # Feature components
├── lib/                          # Utility functions & services
│   ├── mongodb.ts                # Database connection
│   ├── user-auth.ts              # Authentication utilities
│   ├── cart-service.ts           # Cart management
│   └── ...                       # Other utilities
├── public/                       # Static assets
│   ├── images/                   # Image assets
│   └── uploads/                  # User uploaded files
├── hooks/                        # Custom React hooks
├── styles/                       # Global styles
└── types/                        # TypeScript type definitions
```


## 🔐 Security Best Practices


> **⚠️ Important:** Never commit API keys, secrets, or credentials to version control. If accidentally committed, rotate the credentials immediately.


## 🚀 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on every push to `main`

**Environment Variables Required:**

### Manual Deployment

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

Ensure your production environment has:


## 📸 Screenshots

<div align="center">

### Customer Experience
*Beautiful, intuitive shopping interface*

### Admin Dashboard
*Comprehensive business analytics and management*

### Mobile Responsive
*Seamless experience across all devices*

</div>


## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. 🍴 **Fork** the repository
2. 🌿 **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. 💻 **Commit** your changes
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. 📤 **Push** to your branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. 🎉 **Open** a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):



## 📋 Roadmap



## 📞 Support

Need help? We're here for you!



## 👨‍💻 Authors

**Radhika Electronics Team**


## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.


## 🙏 Acknowledgments



<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ using Next.js and TypeScript**

[Back to Top ↑](#-electrotrack)

</div>
