# API Documentation

Base URL: `http://localhost:5000/api/v1`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

```json
{
  "success": true|false,
  "message": "Response message",
  "data": {},
  "errors": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| BAD_REQUEST | 400 | Invalid request |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| VALIDATION_ERROR | 422 | Validation failed |
| TOO_MANY_REQUESTS | 429 | Rate limit exceeded |

## Authentication Endpoints

### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass1!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PARENT"
}
```

Response: `201 Created`

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@sms.com",
  "password": "Password123!"
}
```

Response: `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "admin@sms.com",
      "firstName": "Super",
      "lastName": "Admin",
      "role": "SUPER_ADMIN",
      "isVerified": true,
      "isTwoFactorEnabled": false
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

### Refresh Token

```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

### Forgot Password

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Reset Password

```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "password": "NewPassword1!"
}
```

### Enable 2FA

```http
POST /auth/2fa/enable
Authorization: Bearer <token>
```

### Get Profile

```http
GET /auth/profile
Authorization: Bearer <token>
```

## Student Endpoints

### List Students

```http
GET /students?page=1&limit=20&search=john&classId=xxx
Authorization: Bearer <token>
```

### Get Student

```http
GET /students/:id
Authorization: Bearer <token>
```

### Create Student

```http
POST /students
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "classId": "clx...",
  "armId": "clx...",
  "gender": "FEMALE",
  "dateOfBirth": "2010-05-15"
}
```

## Staff Endpoints

### List Staff

```http
GET /staff?page=1&limit=20&department=Science
Authorization: Bearer <token>
```

### Get Staff

```http
GET /staff/:id
Authorization: Bearer <token>
```

## Academic Endpoints

### Classes

```http
GET /classes
POST /classes
GET /classes/:id
PUT /classes/:id
DELETE /classes/:id
```

### Subjects

```http
GET /subjects?classId=xxx
POST /subjects
```

### Timetable

```http
GET /timetable?classId=xxx&armId=xxx
POST /timetable
```

### Exams

```http
GET /exams?classId=xxx
POST /exams
GET /exams/:id/questions
POST /exams/:id/questions
POST /exams/:id/submit
```

## Attendance Endpoints

```http
GET /attendance?date=2024-09-01&classId=xxx
POST /attendance/bulk
POST /attendance/qr
```

## Finance Endpoints

### Fee Structures

```http
GET /finance/fees
POST /finance/fees
```

### Payments

```http
GET /finance/payments
POST /finance/payments
```

### Expenses

```http
GET /finance/expenses
POST /finance/expenses
```

### Payroll

```http
GET /finance/payroll
POST /finance/payroll
```

## Library Endpoints

```http
GET /library/books
POST /library/books
GET /library/borrows
POST /library/borrow
POST /library/return
```

## Hostel Endpoints

```http
GET /hostel
POST /hostel
GET /hostel/:id/rooms
POST /hostel/allocate
```

## Dashboard Endpoints

```http
GET /dashboard/stats
GET /dashboard/attendance-chart
GET /dashboard/revenue-chart
GET /dashboard/gender-distribution
GET /dashboard/recent-activities
```
