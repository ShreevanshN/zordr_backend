# Zordr Backend API Documentation

> **Node.js/Express REST API** - Backend service for the Zordr food ordering ecosystem

---

## 📋 Overview

The Zordr Backend is a RESTful API server built with **Node.js**, **Express.js**, and **Prisma ORM** (PostgreSQL database). It powers the entire Zordr ecosystem, serving three client applications:

1. **Mobile App** (React Native) - Consumer-facing food ordering app
2. **Partner Portal** (React Web) - Restaurant outlet management
3. **Admin Portal** (React Web) - System-wide administration

---

## 🏗️ Architecture

### Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 14+ via Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: CORS, Helmet, bcrypt password hashing
- **Environment Management**: dotenv

### Project Structure

```
zordr-backend--main/
├── routes/              # API route handlers (12 modules)
│   ├── auth.js          # Authentication & OTP
│   ├── menu.js          # Menu items & categories
│   ├── cart.js          # Shopping cart operations
│   ├── orders.js        # Order management
│   ├── user.js          # User profiles & stats
│   ├── favorites.js     # Favorite items
│   ├── notifications.js # Push notifications
│   ├── outlets.js       # Outlet management
│   ├── offers.js        # Promotional deals
│   ├── analytics.js     # Business analytics
│   ├── team.js          # Staff management
│   └── support.js       # Support tickets
├── middleware/          # Express middleware
│   └── auth.js          # JWT verification
├── prisma/              # Database layer
│   ├── schema.prisma    # Database models
│   ├── migrations/      # Schema migrations
│   └── seed.js          # Sample data seeder
├── utils/               # Helper utilities
├── server.js            # Express app configuration
├── .env                 # Environment variables
└── package.json         # Dependencies
```

---

## 🗄️ Database Schema (Prisma)

### Key Models

#### **User** - Consumer, Partner, and Admin accounts

```prisma
model User {
  id            String   @id @default(uuid())
  phone         String   @unique
  email         String?  @unique
  name          String?
  role          Role     @default(USER)

  // Consumer Profile
  dietary       String?  // "veg", "non-veg"
  allergies     String[]
  campus        String?  // KITSW, SRU, etc.
  zCoins        Int      @default(0)
  rank          String   @default("Starter")
  streak        Int      @default(0)
  lastOrderDate DateTime?
  pushToken     String?

  // Partner Profile
  outletId      String?
  outlet        Outlet?  @relation(fields: [outletId], references: [id])

  // Relations
  orders        Order[]
  cart          Cart?
  favorites     Favorite[]
  notifications Notification[]
  tickets       SupportTicket[]
}
```

#### **Outlet** - Restaurant locations

```prisma
model Outlet {
  id             String   @id @default(uuid())
  name           String
  campus         String   @default("KITSW")
  image          String
  location       String
  contactPhone   String
  isOpen         Boolean  @default(true)
  rating         Float    @default(0)
  prepTime       String
  operatingHours Json?
  autoConfirm    Boolean  @default(false)

  managers       User[]
  menu           MenuItem[]
  orders         Order[]
  settlements    Settlement[]
  offers         Offer[]
}
```

#### **MenuItem** - Food products

```prisma
model MenuItem {
  id          String  @id @default(uuid())
  outletId    String
  outlet      Outlet  @relation(fields: [outletId], references: [id])
  name        String
  description String
  price       Float
  image       String
  category    String
  dietary     String?
  isAvailable Boolean @default(true)
  isVeg       Boolean @default(true)
  isDeal      Boolean @default(false)
  discount    String?

  orderItems  OrderItem[]
  cartItems   CartItem[]
  favorites   Favorite[]
}
```

#### **Order** - Purchase orders

```prisma
model Order {
  id          String      @id @default(uuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  outletId    String
  outlet      Outlet      @relation(fields: [outletId], references: [id])
  status      OrderStatus @default(pending)
  total       Float
  zCoinsUsed  Int         @default(0)
  zCoinsEarned Int        @default(0)
  pickupTime  String?
  specialInstructions String?

  items       OrderItem[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum OrderStatus {
  pending
  confirmed
  preparing
  ready
  picked_up
  cancelled
}
```

#### **Cart** - Shopping cart

```prisma
model Cart {
  id         String     @id @default(uuid())
  userId     String     @unique
  user       User       @relation(fields: [userId], references: [id])
  items      CartItem[]
  updatedAt  DateTime   @updatedAt
}

model CartItem {
  id       String   @id @default(uuid())
  cartId   String
  cart     Cart     @relation(fields: [cartId], references: [id])
  itemId   String
  item     MenuItem @relation(fields: [itemId], references: [id])
  quantity Int
}
```

#### **Other Models**

- **Favorite** - User's saved menu items
- **Notification** - Push notifications
- **Offer** - Promotional deals
- **SupportTicket** - Customer support
- **Settlement** - Partner payouts
- **TimeSlot** - Pickup time availability

---

## 🔐 Authentication

### Flow

1. **Send OTP**: `POST /api/auth/send-otp` with phone number
2. **Verify OTP**: `POST /api/auth/login` (User) or `/api/auth/partner/login` (Partner)
3. **Receive JWT**: Token returned in response
4. **Subsequent Requests**: Include `Authorization: Bearer <token>` header

### Roles

- `USER` - Mobile app consumers
- `PARTNER_MANAGER` - Outlet managers
- `PARTNER_STAFF` - Outlet cashiers/staff
- `ADMIN` - Campus administrators
- `SUPER_ADMIN` - System administrators

---

## 📡 API Endpoints

### Base URL

```
http://localhost:3000/api
```

---

### 🔓 Auth Routes (`/api/auth`)

| Method | Endpoint         | Description                    | Auth Required |
| ------ | ---------------- | ------------------------------ | ------------- |
| POST   | `/send-otp`      | Send OTP to phone number       | ❌            |
| POST   | `/login`         | User login with phone + OTP    | ❌            |
| POST   | `/partner/login` | Partner login with phone + OTP | ❌            |
| GET    | `/me`            | Get current user profile       | ✅            |
| POST   | `/refresh`       | Refresh JWT token              | ✅            |

**Example: Send OTP**

```json
POST /api/auth/send-otp
{
  "phone": "9876543210"
}
```

**Example: User Login**

```json
POST /api/auth/login
{
  "phone": "9876543210",
  "otp": "123456"
}
Response: { "token": "...", "user": {...} }
```

---

### 🍔 Menu Routes (`/api/menu`)

| Method | Endpoint            | Description                       | Auth Required |
| ------ | ------------------- | --------------------------------- | ------------- |
| GET    | `/items`            | Get all menu items (with filters) | ❌            |
| GET    | `/items/:id`        | Get single menu item              | ❌            |
| GET    | `/outlet/:outletId` | Get menu for specific outlet      | ❌            |
| GET    | `/categories`       | Get all categories                | ❌            |
| GET    | `/deals`            | Get all active deals              | ❌            |
| POST   | `/items`            | Create new menu item (Partner)    | ✅            |
| PATCH  | `/items/:id`        | Update menu item (Partner)        | ✅            |
| DELETE | `/items/:id`        | Delete menu item (Partner)        | ✅            |

**Query Parameters for `/items`:**

- `category` - Filter by category
- `search` - Search by name
- `outletId` - Filter by outlet
- `limit` - Results per page (default: 20)
- `offset` - Pagination offset

---

### 🛒 Cart Routes (`/api/cart`)

| Method | Endpoint          | Description           | Auth Required |
| ------ | ----------------- | --------------------- | ------------- |
| GET    | `/`               | Get user's cart       | ✅            |
| POST   | `/add`            | Add item to cart      | ✅            |
| PATCH  | `/update/:itemId` | Update item quantity  | ✅            |
| DELETE | `/remove/:itemId` | Remove item from cart | ✅            |
| DELETE | `/clear`          | Clear entire cart     | ✅            |

**Example: Add to Cart**

```json
POST /api/cart/add
{
  "itemId": "uuid-here",
  "quantity": 2
}
```

---

### 📦 Order Routes (`/api/orders`)

| Method | Endpoint            | Description                   | Auth Required |
| ------ | ------------------- | ----------------------------- | ------------- |
| GET    | `/`                 | Get user's orders             | ✅            |
| GET    | `/:id`              | Get single order details      | ✅            |
| GET    | `/outlet/:outletId` | Get outlet's orders (Partner) | ✅            |
| POST   | `/`                 | Create new order              | ✅            |
| PATCH  | `/:id/status`       | Update order status (Partner) | ✅            |
| PATCH  | `/:id/cancel`       | Cancel order                  | ✅            |

**Example: Create Order**

```json
POST /api/orders
{
  "items": [
    { "id": "item-uuid", "quantity": 2 }
  ],
  "outletId": "outlet-uuid",
  "pickupTime": "14:30",
  "useZCoins": 50,
  "specialInstructions": "No onions"
}
```

**Order Status Flow:**

1. `pending` - Order placed, awaiting acceptance
2. `confirmed` - Outlet accepted order
3. `preparing` - Food being prepared
4. `ready` - Ready for pickup
5. `picked_up` - Order completed
6. `cancelled` - Order cancelled

---

### 👤 User Routes (`/api/user`)

| Method | Endpoint         | Description                           | Auth Required |
| ------ | ---------------- | ------------------------------------- | ------------- |
| GET    | `/profile`       | Get user profile                      | ✅            |
| PATCH  | `/profile`       | Update profile                        | ✅            |
| GET    | `/stats`         | Get user stats (orders, zCoins, rank) | ✅            |
| GET    | `/order-history` | Get order history                     | ✅            |

---

### ❤️ Favorites Routes (`/api/favorites`)

| Method | Endpoint         | Description                | Auth Required |
| ------ | ---------------- | -------------------------- | ------------- |
| GET    | `/`              | Get user's favorites       | ✅            |
| POST   | `/`              | Add item to favorites      | ✅            |
| DELETE | `/:itemId`       | Remove from favorites      | ✅            |
| GET    | `/check/:itemId` | Check if item is favorited | ✅            |

---

### 🏪 Outlet Routes (`/api/outlets`)

| Method | Endpoint      | Description                     | Auth Required |
| ------ | ------------- | ------------------------------- | ------------- |
| GET    | `/`           | Get all outlets                 | ❌            |
| GET    | `/:id`        | Get outlet details              | ❌            |
| GET    | `/:id/slots`  | Get available pickup time slots | ❌            |
| PATCH  | `/:id`        | Update outlet (Partner)         | ✅            |
| PATCH  | `/:id/status` | Toggle open/closed (Partner)    | ✅            |

---

### 🏷️ Offers Routes (`/api/offers`)

| Method | Endpoint | Description            | Auth Required |
| ------ | -------- | ---------------------- | ------------- |
| GET    | `/`      | Get all active offers  | ❌            |
| GET    | `/:id`   | Get single offer       | ❌            |
| POST   | `/`      | Create offer (Partner) | ✅            |
| PATCH  | `/:id`   | Update offer (Partner) | ✅            |
| DELETE | `/:id`   | Delete offer (Partner) | ✅            |

---

### 📊 Analytics Routes (`/api/analytics`)

| Method | Endpoint | Description                      | Auth Required |
| ------ | -------- | -------------------------------- | ------------- |
| GET    | `/stats` | Get outlet statistics (Partner)  | ✅            |
| GET    | `/chart` | Get chart data (revenue, orders) | ✅            |

**Response Example:**

```json
{
  "stats": {
    "totalOrders": 150,
    "totalRevenue": 45000,
    "avgOrderValue": 300,
    "totalCustomers": 80
  },
  "chart": {
    "revenueByDay": [...],
    "ordersByCategory": [...]
  }
}
```

---

### 👥 Team Routes (`/api/team`)

| Method | Endpoint | Description                          | Auth Required |
| ------ | -------- | ------------------------------------ | ------------- |
| GET    | `/`      | Get team members (Partner)           | ✅            |
| POST   | `/`      | Add team member (Partner Manager)    | ✅            |
| DELETE | `/:id`   | Remove team member (Partner Manager) | ✅            |

---

### 🔔 Notification Routes (`/api/notifications`)

| Method | Endpoint    | Description            | Auth Required |
| ------ | ----------- | ---------------------- | ------------- |
| GET    | `/`         | Get user notifications | ✅            |
| PATCH  | `/:id/read` | Mark as read           | ✅            |
| DELETE | `/:id`      | Delete notification    | ✅            |

---

### 🎫 Support Routes (`/api/support`)

| Method | Endpoint       | Description           | Auth Required |
| ------ | -------------- | --------------------- | ------------- |
| GET    | `/tickets`     | Get user's tickets    | ✅            |
| POST   | `/tickets`     | Create support ticket | ✅            |
| GET    | `/tickets/:id` | Get ticket details    | ✅            |

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=3000

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/zordr?schema=public"

# JWT Authentication
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:8081,http://localhost:5173

# Twilio (for OTP - Optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# 1. Navigate to backend directory
cd zordr-backend--main

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp env.example .env
# Edit .env with your configuration

# 4. Set up database
npx prisma migrate dev --name init
npx prisma db seed

# 5. Start development server
npm run dev
```

### Production Deployment

```bash
# Build and start
npm start

# Or with PM2
pm2 start server.js --name zordr-backend
```

---

## 🧪 Testing the API

### Health Check

```bash
curl http://localhost:3000/health
```

### Test Script

Run the included test script:

```bash
node test-api.js
```

---

## 🔒 Security Features

- ✅ JWT token-based authentication
- ✅ bcrypt password hashing
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation
- ✅ SQL injection prevention (Prisma)
- ✅ Rate limiting (planned)

---

## 📊 Database Management

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed database
npx prisma db seed

# Open Prisma Studio (Database GUI)
npx prisma studio
```

---

## 🐛 Debugging

### Enable Logging

Set `DEBUG=*` in `.env` for verbose logging

### Database Queries

Prisma logs all queries when `log: ['query']` is enabled in `PrismaClient`

### Utility Scripts

- `node list_outlets.js` - List all outlets
- `node check_deals.js` - Verify deals configuration
- `node debug-outlet.js` - Debug specific outlet

---

## 📝 Response Format

All endpoints follow a consistent response structure:

**Success:**

```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev only)"
}
```

---

## 🤝 Contributing

When adding new features:

1. Create a new route file in `/routes`
2. Define Prisma models in `schema.prisma`
3. Run `npx prisma migrate dev`
4. Update this documentation
5. Add JSDoc comments to all functions

---

## 📚 Additional Documentation

- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
- **Backend Setup**: See `backend_setup.md`
- **Work Report**: See `WORK_REPORT.md`

---

_Last Updated: 2025-11-29_  
_API Version: 2.0.0_  
_Prisma Schema Version: Latest_
