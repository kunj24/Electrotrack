# Electrotrack System Architecture - Medium

## Balanced E-commerce Architecture

---

## 1. System Overview

### PlantUML - Compact Architecture
**Paste this code in: https://www.plantuml.com/plantuml/uml/**

```plantuml
@startuml Electrotrack_Compact_Architecture

!theme plain
skinparam backgroundColor White

title Electrotrack System Architecture

' Users
actor "Customer" as customer
actor "Admin" as admin

' Frontend
package "Next.js Frontend" {
    rectangle "User Interface" {
        component "Pages (Home, Cart, Payment)"
        component "Components (UI, Forms)"
    }
}

' Backend
package "API Layer" {
    rectangle "Authentication" {
        component "Login & JWT"
    }
    rectangle "Business Logic" {
        component "Orders & Products"
        component "Payment Processing"
    }
    rectangle "Admin Services" {
        component "Analytics & Management"
    }
}

' Data
database "MongoDB" as db {
    component "Users"
    component "Orders"
    component "Transactions"
}

' External
cloud "Razorpay" as razorpay
cloud "Google Maps" as maps
cloud "Email Service" as email

' Connections
customer --> "User Interface"
admin --> "User Interface"
"User Interface" --> "Authentication"
"User Interface" --> "Business Logic"
"User Interface" --> "Admin Services"
"Authentication" --> db
"Business Logic" --> db
"Admin Services" --> db
"Business Logic" --> razorpay
"Business Logic" --> maps
"Authentication" --> email

@enduml
```

## 2. Component Architecture

### Mermaid - Compact Component View

```mermaid
graph TB
    %% Users
    Customer[👤 Customer]
    Admin[👨‍💼 Admin]
    
    %% Frontend
    subgraph "Next.js App"
        HomePage[🏠 Home]
        AuthPage[🔐 Login]
        CartPage[🛒 Cart]
        PaymentPage[💳 Payment]
        AdminPanel[⚙️ Admin]
        
        Components[🎨 Components]
        StateHooks[🔄 State & Hooks]
    end
    
    %% Backend
    subgraph "API Routes"
        AuthAPI[🔐 Auth API]
        BusinessAPI[📦 Business API]
        PaymentAPI[💳 Payment API]
        AdminAPI[⚙️ Admin API]
    end
    
    %% Database
    subgraph "MongoDB"
        UsersDB[(👥 Users)]
        OrdersDB[(📋 Orders)]
        TransactionsDB[(💰 Transactions)]
    end
    
    %% External
    Razorpay[💳 Razorpay]
    GoogleMaps[🗺️ Maps]
    Email[📧 Email]
    
    %% Connections
    Customer --> HomePage
    Customer --> AuthPage
    Customer --> CartPage
    Customer --> PaymentPage
    Admin --> AdminPanel
    
    HomePage --> Components
    AuthPage --> StateHooks
    CartPage --> Components
    
    AuthPage --> AuthAPI
    CartPage --> BusinessAPI
    PaymentPage --> PaymentAPI
    AdminPanel --> AdminAPI
    
    AuthAPI --> UsersDB
    BusinessAPI --> OrdersDB
    PaymentAPI --> TransactionsDB
    AdminAPI --> TransactionsDB
    
    PaymentAPI --> Razorpay
    BusinessAPI --> GoogleMaps
    AuthAPI --> Email
    
    %% Styling
    classDef frontend fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef api fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef database fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef external fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    
    class HomePage,AuthPage,CartPage,PaymentPage,AdminPanel,Components,StateHooks frontend
    class AuthAPI,BusinessAPI,PaymentAPI,AdminAPI api
    class UsersDB,OrdersDB,TransactionsDB database
    class Razorpay,GoogleMaps,Email external
```

## 3. Data Flow

### PlantUML - Simple Data Flow

```plantuml
@startuml Simple_Data_Flow

!theme plain
title Electrotrack Data Flow

participant Customer
participant Frontend
participant API
participant MongoDB
participant Razorpay

' Authentication
group Login
    Customer -> Frontend: Login Request
    Frontend -> API: POST /api/auth
    API -> MongoDB: Verify User
    MongoDB -> API: User Data
    API -> Frontend: JWT Token
    Frontend -> Customer: Login Success
end

' Shopping
group Shopping
    Customer -> Frontend: Browse Products
    Frontend -> API: GET /api/products
    API -> MongoDB: Product Query
    MongoDB -> API: Products
    API -> Frontend: Product List
    
    Customer -> Frontend: Add to Cart
    Frontend -> API: POST /api/cart
    API -> MongoDB: Save Cart
end

' Payment
group Payment
    Customer -> Frontend: Checkout
    Frontend -> API: POST /api/payment
    API -> Razorpay: Process Payment
    Razorpay -> API: Payment Status
    API -> MongoDB: Save Transaction
    MongoDB -> API: Order Saved
    API -> Frontend: Payment Result
    Frontend -> Customer: Order Confirmation
end

@enduml
```

## 4. Technology Stack

### Mermaid - Simple Tech Stack

```mermaid
graph LR
    subgraph "Frontend"
        NextJS[Next.js 15.2.4]
        React[React + TypeScript]
        Tailwind[Tailwind CSS]
    end
    
    subgraph "Backend"
        API[API Routes]
        JWT[JWT Auth]
    end
    
    subgraph "Database"
        MongoDB[(MongoDB)]
    end
    
    subgraph "External"
        Razorpay[💳 Razorpay]
        Maps[🗺️ Google Maps]
        Email[📧 Email]
    end
    
    %% Connections
    NextJS --> API
    API --> MongoDB
    API --> Razorpay
    React --> Maps
    JWT --> Email
    
    %% Styling
    classDef frontend fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef backend fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef database fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef external fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    
    class NextJS,React,Tailwind frontend
    class API,JWT backend
    class MongoDB database
    class Razorpay,Maps,Email external
```

---

## Architecture Summary

### 🏗️ **Core Stack**
- **Frontend**: Next.js 15.2.4, React, TypeScript, Tailwind CSS
- **Backend**: API Routes, JWT Authentication
- **Database**: MongoDB (Users, Orders, Transactions)
- **External**: Razorpay (Payments), Google Maps (Location), Email (Notifications)

### 🔧 **Key Features**
- User authentication & profiles
- Shopping cart & checkout
- Payment processing (Razorpay + COD)
- Admin dashboard & analytics
- Order management & tracking

### 🛡️ **Security**
- JWT authentication
- Input validation
- Secure API endpoints

This compact architecture shows the essential components of your Electrotrack e-commerce system - perfect for quick presentations! 🎯
