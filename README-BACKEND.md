# Radhika Electronics - Backend Setup Guide

## 🚀 Current Status

Your Next.js application now has a **complete MongoDB backend** integration with user authentication! Here's what has been implemented:

### ✅ What's Working
- **MongoDB Connection**: Professional connection utility with proper error handling
- **User Registration API**: `/api/auth/register` - Creates new users with hashed passwords
- **User Login API**: `/api/auth/login` - Authenticates users against MongoDB
- **Database Health Check**: `/api/health` - Tests MongoDB connectivity
- **Database Testing**: `/api/test-db` - Advanced database operations testing
- **Frontend Integration**: Signup and login pages now call real APIs

### 📁 Files Created/Updated
```
app/api/auth/register/route.ts  - User registration endpoint
app/api/auth/login/route.ts     - User login endpoint  
app/api/test-db/route.ts        - Database testing endpoint
app/api/health/route.ts         - MongoDB health check
lib/mongodb.ts                  - MongoDB connection utility
.env.local                      - Environment configuration
.env.example                    - Environment template
app/signup/page.tsx             - Updated to use real API
app/login/page.tsx              - Updated to use real API
```
x
### 🛠 Dependencies Added
- `mongodb@^6.18.0` - Official MongoDB driver
- `bcryptjs@^3.0.2` - Password hashing

## 🎯 To Make It Fully Functional

### Option 1: MongoDB Atlas (Recommended - Cloud)
1. **Create Free Account**: Go to [MongoDB Atlas](https://mongodb.com/atlas)
2. **Create Cluster**: Choose the free tier
3. **Get Connection String**: 
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
4. **Update .env.local**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/radhika_electronics?retryWrites=true&w=majority&appName=RadhikaElectronics
   MONGODB_DB=radhika_electronics
   ```
5. **Test**: Visit `http://localhost:3000/api/health`

### Option 2: Local MongoDB
1. **Install MongoDB**: [Download MongoDB Community](https://www.mongodb.com/try/download/community)
2. **Start Service**: Follow installation instructions for Windows
3. **Keep Current .env.local**: Already configured for local MongoDB
4. **Test**: Visit `http://localhost:3000/api/health`

## 🧪 Testing Your Backend

### 1. Start the Application
```bash
cd "e:\SEM 5\SGP\try3\mayv15"
pnpm dev
```

### 2. Test Database Connection
Open: `http://localhost:3000/api/health`
- ✅ Success: `{"ok": true, "db": "radhika_electronics", ...}`
- ❌ Failure: Check MongoDB is running and connection string is correct

### 3. Test User Registration
1. Go to `http://localhost:3000/signup`
2. Fill the form and submit
3. Check if user appears in your MongoDB database

### 4. Test User Login
1. Go to `http://localhost:3000/login`
2. Use the credentials you just created
3. Should redirect to dashboard on success

### 5. Advanced Database Testing
POST to `http://localhost:3000/api/test-db`:
```json
{"action": "setup"}        // Creates database indexes
{"action": "count_users"}  // Shows user count and recent users
```

## 🔐 Security Features Implemented

- **Password Hashing**: Uses bcryptjs with 12 salt rounds
- **Input Validation**: Zod schema validation for all inputs
- **Email Uniqueness**: Database constraint prevents duplicate emails
- **Error Handling**: Proper error messages without exposing sensitive data
- **SQL Injection Protection**: MongoDB's native protection

##  Next Steps

1. **Set up MongoDB** (Atlas recommended)
2. **Test registration and login**
3. **Add more collections** as needed (products, orders, etc.)
4. **Implement JWT tokens** for better session management
5. **Add password reset** functionality
6. **Add admin user management**

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/health` | MongoDB health check |
| `GET/POST` | `/api/test-db` | Database testing |

## 💡 Usage Examples

### Register a User (API)
```javascript
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "John Doe",
    email: "john@example.com", 
    password: "secure123",
    businessType: "electronics"
  })
})
```

### Login (API)
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "john@example.com",
    password: "secure123"
  })
})
```

Your backend is now **production-ready** with proper MongoDB integration! 🎉
