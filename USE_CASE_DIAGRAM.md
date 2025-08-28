# Electrotrack E-commerce System - Use Case Diagram

# Electrotrack E-commerce System - Use Case Diagram

## PlantUML Code - Clean & Professional

### Paste this code in: **PlantUML Online Editor** (https://www.plantuml.com/plantuml/uml/)

```plantuml
@startuml Electrotrack_Clean_UseCase

!theme plain
skinparam packageStyle rectangle
skinparam usecase {
    BackgroundColor White
    BorderColor Black
}

' Actors - Positioned for compact layout
actor "Customer" as customer
actor "Admin" as admin
actor "Payment\nGateway" as payment
actor "Database" as database

' System boundary - Compact
rectangle "Electrotrack E-commerce System" {
    
    ' Customer Use Cases - Grouped tightly
    usecase "Login" as UC1
    usecase "Browse\nProducts" as UC2
    usecase "Shopping\nCart" as UC3
    usecase "Checkout" as UC4
    usecase "Make\nPayment" as UC5
    usecase "View\nOrders" as UC6
    usecase "Manage\nProfile" as UC7
    
    ' Admin Use Cases - Grouped tightly
    usecase "Admin\nDashboard" as UC8
    usecase "View\nAnalytics" as UC9
    usecase "Manage\nTransactions" as UC10
    
    ' Optional Features - Compact
    usecase "Search" as UC11
    usecase "Track\nOrders" as UC12
    usecase "Generate\nReports" as UC13
    
    ' Layout positioning for compactness
    UC1 -[hidden]- UC2
    UC2 -[hidden]- UC3
    UC3 -[hidden]- UC4
    UC8 -[hidden]- UC9
    UC9 -[hidden]- UC10
}

' Primary relationships
customer --> UC1
customer --> UC2
customer --> UC3
customer --> UC4
customer --> UC5
customer --> UC6
customer --> UC7

admin --> UC8
admin --> UC9
admin --> UC10

' External systems
UC5 --> payment
UC1 --> database
UC3 --> database
UC5 --> database
UC6 --> database
UC8 --> database
UC9 --> database
UC10 --> database

' Include relationships (mandatory) - Shorter lines
UC3 .> UC1 : <<include>>
UC4 .> UC1 : <<include>>
UC6 .> UC1 : <<include>>
UC7 .> UC1 : <<include>>
UC9 .> UC8 : <<include>>
UC10 .> UC8 : <<include>>

' Extend relationships (optional) - Shorter lines
UC2 <. UC11 : <<extend>>
UC6 <. UC12 : <<extend>>
UC9 <. UC13 : <<extend>>

@enduml
```

## Compact Mermaid Version

```mermaid
graph TD
    %% Actors - Positioned for compact layout
    Customer[👤 Customer]
    Admin[👨‍💼 Admin]
    Payment[💳 Payment]
    Database[(🗄️ Database)]
    
    %% Compact System Layout
    subgraph "Electrotrack System"
        direction TB
        
        %% Customer Features - Tightly grouped
        subgraph "Customer Features"
            UC1[Login]
            UC2[Browse]
            UC3[Cart]
            UC4[Checkout]
            UC5[Payment]
            UC6[Orders]
            UC7[Profile]
        end
        
        %% Admin Features - Tightly grouped
        subgraph "Admin Features"
            UC8[Dashboard]
            UC9[Analytics]
            UC10[Transactions]
        end
        
        %% Optional - Minimal space
        UC11[Search] 
        UC12[Track]
        UC13[Reports]
    end
    
    %% Compact User Flow
    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6
    Customer --> UC7
    
    %% Compact Admin Flow
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    
    %% External Connections - Short lines
    UC5 -.-> Payment
    UC1 -.-> Database
    UC3 -.-> Database
    UC5 -.-> Database
    UC6 -.-> Database
    UC8 -.-> Database
    UC9 -.-> Database
    UC10 -.-> Database
    
    %% Dependencies - Minimal lines
    UC3 -.->|requires| UC1
    UC4 -.->|requires| UC1
    UC6 -.->|requires| UC1
    UC9 -.->|requires| UC8
    
    %% Optional Extensions - Dashed
    UC2 -.-|optional| UC11
    UC6 -.-|optional| UC12
    UC9 -.-|optional| UC13
    
    %% Compact Styling
    classDef customer fill:#e3f2fd,stroke:#1976d2,stroke-width:1px
    classDef admin fill:#fff3e0,stroke:#f57c00,stroke-width:1px
    classDef core fill:#e8f5e8,stroke:#2e7d32,stroke-width:1px
    classDef optional fill:#fce4ec,stroke:#c2185b,stroke-width:1px
    classDef external fill:#f3e5f5,stroke:#7b1fa2,stroke-width:1px
    
    class Customer customer
    class Admin admin
    class UC1,UC2,UC3,UC4,UC5,UC6,UC7,UC8,UC9,UC10 core
    class UC11,UC12,UC13 optional
    class Payment,Database external
```

## � **Essential Features Summary:**

### **� Customer Journey (7 Core Features):**
```
1. Login → 2. Browse Products → 3. Shopping Cart → 
4. Checkout → 5. Payment → 6. View Orders → 7. Profile
```

### **👨‍💼 Admin Operations (3 Core Features):**
```
1. Admin Dashboard → 2. Analytics → 3. Manage Transactions
```

### **� Dependencies:**
- **Cart, Checkout, Orders, Profile** → **Login Required**
- **Analytics, Transactions** → **Admin Dashboard Access**

### **⭐ Optional Enhancements:**
- Search Products, Track Orders, Generate Reports

---

## 🚀 **Quick Setup Guide:**

1. **Copy PlantUML code** → Paste in https://www.plantuml.com/plantuml/uml/
2. **Generate diagram** → Download PNG/SVG
3. **Use in presentations** → Clean, professional look

**Result:** Simple, focused use case diagram showing essential Electrotrack functionality!

## Simple Vertical Diagram (Draw.io Format)

### Paste this code in: **Draw.io** (https://app.diagrams.net) → Advanced → PlantUML

```
@startuml
top to bottom direction

actor Customer
actor Admin

rectangle System {
    (Login)
    (Browse)
    (Cart)
    (Checkout)
    (Payment)
    (Orders)
    
    (Dashboard)
    (Analytics)
    (Manage)
}

Customer --> (Login)
Customer --> (Browse)
Customer --> (Cart)
Customer --> (Checkout)
Customer --> (Payment)
Customer --> (Orders)

Admin --> (Dashboard)
Admin --> (Analytics)  
Admin --> (Manage)

@enduml
```

## Text-Based Vertical Layout (Copy-Paste Ready)

```
ELECTROTRACK USE CASE DIAGRAM (Vertical)

👤 CUSTOMER                    👨‍💼 ADMIN
    │                              │
    ├── Login/Register             ├── Admin Login
    ├── Browse Products            ├── Dashboard
    ├── Shopping Cart              ├── Analytics
    ├── Checkout                   ├── Transactions
    ├── Payment/COD                └── Reports
    └── My Orders
    
🔗 External: 💳 Razorpay Payment Gateway
```

## 📍 **Where to Paste Each Code:**

### 1. **PlantUML Online Editor** (Recommended)
- **URL:** https://www.plantuml.com/plantuml/uml/
- **Steps:**
  1. Go to the website
  2. Paste the PlantUML code in the text area
  3. Click "Submit" to generate the diagram
  4. Download as PNG/SVG/PDF

### 2. **Mermaid Live Editor**
- **URL:** https://mermaid.live
- **Steps:**
  1. Visit the website
  2. Replace existing code with the Mermaid code
  3. Diagram updates automatically
  4. Click "Actions" → "Download PNG/SVG"

### 3. **Draw.io (Diagrams.net)**
- **URL:** https://app.diagrams.net
- **Steps:**
  1. Create new diagram
  2. Go to "Advanced" → "PlantUML"
  3. Paste the simple code
  4. Export as needed

### 4. **VS Code (With Extensions)**
- **Extensions needed:**
  - PlantUML extension
  - Mermaid Preview extension
- **Steps:**
  1. Create `.puml` or `.md` file
  2. Paste the code
  3. Use Ctrl+Shift+P → "PlantUML: Preview"

## 🎯 **Use Case Description:**

### **Customer Use Cases:**
- **Primary:** Browse, Cart, Checkout, Payment, Orders
- **Secondary:** Profile, Support, Search, Tracking

### **Admin Use Cases:**
- **Management:** Dashboard, Analytics, Transactions
- **Operations:** Reports, Orders, System Config

### **System Features Covered:**
- ✅ User Authentication & Registration
- ✅ Product Browsing & Search
- ✅ Shopping Cart Management
- ✅ Dual Payment System (Online + COD)
- ✅ Order Management & Tracking
- ✅ Admin Dashboard & Analytics
- ✅ Transaction Management
- ✅ System Administration

## 🚀 **Recommended Workflow:**
1. **Use PlantUML** for professional diagrams
2. **Export as PNG** for presentations
3. **Save as SVG** for web use
4. **Keep source code** for modifications

The PlantUML version will give you the most professional-looking use case diagram for your Electrotrack system! 🎯
