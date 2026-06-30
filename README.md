# School Management System (SMS)

Enterprise-grade School Management System built with modern technologies.

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** with TypeScript
- **Tailwind CSS** with shadcn/ui components
- **Framer Motion** for animations
- **React Hook Form** + **Zod** validation
- **TanStack Query** for data fetching
- **Recharts** for analytics
- **Axios** HTTP client
- **next-themes** for dark/light mode

### Backend
- **Node.js** + **Express.js**
- **TypeScript** throughout
- **Prisma ORM** with PostgreSQL
- **JWT** authentication with refresh tokens
- **OTP** and **Two-Factor Authentication**
- **RBAC** with 13 roles
- **Multer** file uploads
- **Nodemailer** email service
- **Winston** logging
- **Helmet**, rate limiting, security middleware

### Architecture
- Monorepo with npm workspaces
- Clean Architecture (Controllers, Services, Repositories)
- DTOs, Validation, Error Handling
- Docker support

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (optional, for session management)
- npm 10+

## Quick Start

### 1. Clone and Install

```bash
git clone <repo-url>
cd sms
npm install
```

### 2. Environment Setup

```bash
cp .env.example backend/.env
# Edit backend/.env with your database credentials
```

### 3. Database Setup

```bash
# Ensure PostgreSQL is running, then:
npm run db:migrate
npm run db:seed
```

### 4. Run Development

```bash
npm run dev
```

Frontend: http://localhost:3000
Backend API: http://localhost:5000/api/v1

### Docker Deployment

```bash
docker-compose up -d
```

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@sms.com | Password123! |
| Principal | principal@excel.com | Password123! |
| Teacher | teacher1@excel.com | Password123! |
| Student | student1@excel.com | Password123! |
| Parent | parent@excel.com | Password123! |

## Features

### Authentication & Security
- JWT-based authentication with access/refresh tokens
- OTP verification
- Two-factor authentication (TOTP)
- Password reset flow
- Role-Based Access Control (13 roles)
- Session management
- Rate limiting, Helmet, CORS protection

### Dashboard
- Real-time analytics with beautiful charts
- Student statistics
- Attendance trends
- Revenue vs expenses
- Gender distribution
- Academic performance
- Recent activities feed
- Fee collection status

### Student Management
- Admission with auto-generated admission numbers
- Complete student profiles
- Class and arm assignment
- Document uploads
- Parent linkage
- Enrollment status tracking

### Staff Management
- Teacher and non-teaching staff profiles
- Attendance tracking
- Payroll management
- Leave request workflow

### Academic Module
- Classes, Arms, and Subjects management
- Timetable generation
- Lesson notes
- Homework with submissions
- CBT (Computer-Based Testing)
- Exam management
- Question bank
- Automatic result computation
- Grading system
- Report cards

### Finance
- Fee structure management
- Payment processing
- Expense tracking
- Payroll management
- Invoice generation
- Receipt generation
- Financial reports

### Additional Modules
- **Library**: Book management, borrowing, fines
- **Hostel**: Room allocation, bed management
- **Clinic**: Medical records, treatments
- **Transport**: Vehicle management, route allocation
- **Inventory**: Stock management, suppliers

### Communication
- In-app messaging
- Email notifications
- SMS-ready architecture
- WhatsApp-ready architecture
- Push notifications

### AI Features
- AI-generated report comments
- AI timetable suggestions
- AI attendance insights
- AI academic performance analysis
- AI homework generation
- AI exam question generation

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/verify-otp | Verify OTP |
| POST | /api/v1/auth/refresh-token | Refresh access token |
| POST | /api/v1/auth/logout | Logout |
| POST | /api/v1/auth/forgot-password | Request password reset |
| POST | /api/v1/auth/reset-password | Reset password |
| POST | /api/v1/auth/change-password | Change password |
| POST | /api/v1/auth/2fa/enable | Enable 2FA |
| POST | /api/v1/auth/2fa/disable | Disable 2FA |
| POST | /api/v1/auth/2fa/verify | Verify 2FA token |
| GET | /api/v1/auth/profile | Get user profile |

## Project Structure

```
sms/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Sample data
│   └── src/
│       ├── config/            # Configuration
│       ├── controllers/       # Route handlers
│       ├── middleware/        # Express middleware
│       ├── routes/            # API routes
│       ├── services/          # Business logic
│       ├── utils/             # Utilities
│       └── server.ts          # Entry point
├── frontend/
│   └── src/
│       ├── app/               # Next.js pages
│       ├── components/        # React components
│       ├── hooks/             # Custom hooks
│       ├── lib/               # Utilities
│       └── providers/         # Context providers
├── shared/
│   ├── constants/             # Shared constants
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Shared utilities
│   └── validators/            # Zod schemas
├── docker/                    # Docker configs
├── docs/                      # Documentation
└── docker-compose.yml
```

## Database Schema

The database includes 30+ models covering:
- Users, Students, Staff, Parents
- Classes, Arms, Subjects, Timetables
- Exams, Questions, Results, Grading
- Attendance, Fees, Payments, Expenses
- Books, Borrows, Hostels, Rooms
- Vehicles, Transport, Medical Records
- Inventory, Suppliers, Messages
- Notifications, Activity Logs, Audit Logs

## Security Features

- Helmet.js HTTP headers
- Rate limiting on auth endpoints
- JWT with refresh token rotation
- Password hashing with bcrypt (12 rounds)
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection
- CORS configuration
- Activity and audit logging
- Session management

## License

MIT
