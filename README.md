# Electrotrack

A modern e-commerce platform built with Next.js, TypeScript, and MongoDB.

## Features

- **User Authentication**: Secure user registration and login system
- **Product Management**: Admin dashboard for managing products and inventory
- **Shopping Cart**: Persistent cart functionality with user sessions
- **Order Management**: Complete order processing and tracking system
- **Payment Integration**: Razorpay payment gateway integration
- **Admin Dashboard**: Comprehensive admin panel with analytics and management tools
- **Responsive Design**: Mobile-first responsive design using Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: Custom authentication system
- **Payment**: Razorpay integration
- **UI Components**: Shadcn/ui components

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database (local or MongoDB Atlas)
- Razorpay account for payments

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kunj24/Electrotrack.git
cd Electrotrack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=[YOUR_MONGODB_CONNECTION_STRING]
DATABASE_NAME=electrotrack
RAZORPAY_KEY_ID=[YOUR_RAZORPAY_KEY_ID]
RAZORPAY_KEY_SECRET=[YOUR_RAZORPAY_SECRET]
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard pages
│   ├── cart/              # Shopping cart page
│   ├── dashboard/         # User dashboard
│   └── ...               # Other pages
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
├── public/                # Static assets
└── styles/               # Global styles
```

## Key Features

### User Features
- Product browsing and search
- Shopping cart management
- Order placement and tracking
- User profile management
- Address management

### Admin Features
- Product inventory management
- Order management with CRUD operations
- Transaction tracking and analytics
- User management
- Dashboard with real-time data

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.