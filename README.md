# 🛣️ Toll Management System (TMS)

A full-stack, enterprise-grade **Toll Management System** built for modern highway infrastructure. Supports real-time toll processing, automated payments, vehicle tracking, and role-based access control across three user types — Admin, Operator, and User.

---

## 🌟 Live Features

### 🔐 Authentication & Authorization
- JWT-based authentication with role-based access control (RBAC)
- Three distinct roles: **Admin**, **Operator**, **User**
- Account lockout after 5 failed login attempts
- Email verification and password reset via Gmail OAuth2
- Remember me, show/hide password, strong password enforcement

### 👑 Admin Dashboard
- Real-time analytics with revenue charts, booth performance graphs, and traffic pattern analysis
- Complete user management — register, view, deactivate users and operators
- Full booth management — create, edit, delete, assign operators, manage toll rates
- Account management — freeze/unfreeze wallets, adjust balances manually
- Vehicle management — view all vehicles, manage RFID tags
- Blacklist management — blacklist vehicles, add reasons, resolve blacklists
- Transaction oversight — view all system transactions with filters

### 👷 Operator Dashboard
- Assigned booth overview with live stats (today's revenue, transactions, active lanes)
- Real-time toll processing — search by license plate or RFID tag
- Instant transaction feedback with balance before/after display
- Frequent traveler discount (10% after 50 trips) applied automatically
- Transaction history for their assigned booth

### 👤 User Dashboard
- Wallet management — create account, top-up balance, set low balance alerts
- Auto-recharge — automatically top up when balance falls below threshold
- Vehicle registration with full details (make, model, year, color, registration, insurance)
- RFID tag status and management
- Complete transaction history with filters and search
- Blacklist status visibility

### 💬 Real-Time Chat System
- Socket.IO powered messaging between all roles
- Typing indicators, online status, read receipts
- Unread message count with live badge updates
- Conversation list with last message preview
- Full message history

### 🔔 Notification System
- Real-time notification center
- Unread message badges on bell icon
- Mark all as read functionality
- Categorized unread vs earlier notifications

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| MongoDB + Mongoose | Database and ODM |
| JSON Web Tokens (JWT) | Authentication |
| Socket.IO | Real-time messaging |
| Nodemailer + Gmail OAuth2 | Transactional emails |
| bcryptjs | Password hashing |
| express-rate-limit | Rate limiting |
| helmet | Security headers |

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| ShadCN UI | Component library |
| Zustand | Global state management |
| TanStack Query | Server state and caching |
| React Hook Form + Zod | Form validation |
| Axios | HTTP client |
| Socket.IO Client | Real-time connection |
| Recharts | Analytics charts |
| Framer Motion | Animations |
| Lucide Icons | Icon library |
| next-themes | Dark/light mode |

---

# Toll Management System

## Project Structure

```text
toll-management-system/
│
├── backend/
│   ├── server.js
│   │
│   ├── src/
│   │   ├── app.js
│   │   │
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── vehicleController.js
│   │   │   ├── accountController.js
│   │   │   ├── boothController.js
│   │   │   ├── transactionController.js
│   │   │   ├── blacklistController.js
│   │   │   ├── reportController.js
│   │   │   └── messageController.js
│   │   │
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   │
│   │   ├── services/
│   │   │   ├── emailService.js
│   │   │   └── tollService.js
│   │   │
│   │   ├── socket/
│   │   │   └── socketHandler.js
│   │   │
│   │   └── utils/
│   │
│   └── .env
│
└── frontend/
    ├── app/
    │   ├── (auth)/
    │   └── dashboard/
    │       ├── admin/
    │       ├── operator/
    │       └── user/
    │
    ├── components/
    │   ├── layout/
    │   ├── dashboard/
    │   └── ui/
    │
    └── lib/
        ├── api/
        ├── hooks/
        ├── store/
        └── validations/
```

## Backend Structure

| Folder/File | Description |
|------------|-------------|
| `server.js` | Application entry point |
| `src/app.js` | Express application configuration |
| `config/db.js` | Database connection setup |
| `controllers/` | Business logic and request handlers |
| `models/` | Database schemas and models |
| `routes/` | API route definitions |
| `middleware/` | Authentication and custom middleware |
| `services/` | Reusable business services |
| `socket/` | Socket.IO configuration and handlers |
| `utils/` | Utility/helper functions |
| `.env` | Environment variables |

## Frontend Structure

| Folder | Description |
|----------|-------------|
| `app/(auth)` | Authentication pages (Login, Register, Forgot Password, etc.) |
| `app/dashboard/admin` | Admin dashboard pages |
| `app/dashboard/operator` | Operator dashboard pages |
| `app/dashboard/user` | User dashboard pages |
| `components/layout` | Shared layout components |
| `components/dashboard` | Dashboard-specific UI components |
| `components/ui` | Reusable UI components |
| `lib/api` | API client and service functions |
| `lib/hooks` | Custom React hooks |
| `lib/store` | State management |
| `lib/validations` | Form validation schemas |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Gmail account with OAuth2 credentials (for emails)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/toll-management-system.git
cd toll-management-system
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/toll-management-system
JWT_SECRET=your_64_byte_hex_secret
JWT_EXPIRE=7d

# Gmail OAuth2
GMAIL_USER=your@gmail.com
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
EMAIL_FROM=Toll Management System <your@gmail.com>

# Default admin account
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@tollsystem.com
ADMIN_PASSWORD=Admin@123456

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

Seed the admin account:

```bash
npm run seed
```

Start the backend:

```bash
node server.js
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

### 4. Open the app

Visit `http://localhost:3000`

Default admin credentials:

Email:    admin@tollsystem.com

Password: Admin@123456


---

## 🔑 API Routes

| Module | Base Route |
|---|---|
| Auth | `/api/v1/auth` |
| Vehicles | `/api/v1/vehicles` |
| Accounts | `/api/v1/accounts` |
| Booths | `/api/v1/booths` |
| Transactions | `/api/v1/transactions` |
| Blacklist | `/api/v1/blacklist` |
| Reports | `/api/v1/reports` |
| Messages | `/api/v1/messages` |

---

## 👥 Role Permissions

| Feature | Admin | Operator | User |
|---|---|---|---|
| View all users | ✅ | ❌ | ❌ |
| Manage booths | ✅ | ❌ | ❌ |
| Process toll | ✅ | ✅ | ❌ |
| Register vehicle | ✅ | ❌ | ✅ |
| View own transactions | ✅ | ✅ | ✅ |
| Manage blacklist | ✅ | ❌ | ❌ |
| View reports | ✅ | ❌ | ❌ |
| Top up wallet | ✅ | ❌ | ✅ |
| Chat with all roles | ✅ | ✅ | ✅ |

---

## 🗺️ Roadmap

- [ ] WebRTC voice and video calling between roles
- [ ] Mobile app (React Native)
- [ ] RFID hardware integration
- [ ] Advanced reporting with PDF export
- [ ] Multi-language support
- [ ] Stripe payment gateway integration
- [ ] Camera-based license plate recognition (ANPR)

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

[MIT](LICENSE)

---

## 👨‍💻 Author

Built with ❤️ by **Kafi Anam**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourusername)
