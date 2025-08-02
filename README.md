# Home Health Aid Management System

A comprehensive home health aid management application with real-time geolocation tracking, timesheet management, communication, and analytics.

## Features

### 🔐 Authentication & User Management
- Role-based authentication (Admin, Manager, Health Aid)
- User registration and profile management
- Password reset and account recovery
- Multi-factor authentication for security

### ⏰ Timesheet Management
- Clock in/out functionality with GPS verification
- Automatic time tracking with geolocation
- Manual time entry with manager approval
- Break time tracking
- Overtime calculation and alerts
- Timesheet submission and approval workflow

### 📍 Geolocation & Geofencing
- Real-time GPS tracking for health aids
- Geofence creation for client locations
- Automatic alerts when health aid enters/leaves designated areas
- Location history and route tracking
- Offline location caching for poor connectivity

### 💬 Communication System
- In-app messaging between managers and health aids
- Push notifications for urgent messages
- Voice and video calling capabilities
- File sharing (photos, documents, care notes)
- Message read receipts and delivery status

### 👥 Client Management
- Client profile creation and management
- Care plan documentation
- Visit scheduling and calendar integration
- Client location mapping
- Care notes and progress tracking

### 📊 Dashboard & Analytics
- Manager dashboard with real-time overview
- Team performance metrics
- Location heat maps
- Time tracking analytics
- Productivity reports

### ✅ Task Management
- Care task assignment and tracking
- Task completion verification
- Photo proof of task completion
- Task priority levels
- Recurring task scheduling

### 📋 Reporting & Compliance
- Automated report generation
- Compliance monitoring (HIPAA, labor laws)
- Audit trail for all activities
- Export capabilities (PDF, Excel)
- Custom report builder

## Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens
- **Real-time**: Socket.IO
- **File Storage**: AWS S3
- **Email**: SendGrid
- **SMS**: Twilio
- **Payments**: Stripe
- **Background Jobs**: Celery with Redis

### Frontend Web
- **Framework**: React 18
- **Routing**: React Router DOM
- **State Management**: React Query
- **UI**: Tailwind CSS + Headless UI
- **Maps**: Leaflet + React Leaflet
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

### Mobile App
- **Framework**: React Native
- **Navigation**: React Navigation
- **Maps**: React Native Maps
- **Location**: React Native Geolocation Service
- **Camera**: React Native Camera
- **Storage**: AsyncStorage + SQLite
- **Background Jobs**: React Native Background Job

## Project Structure

```
home-health-aid-app/
├── backend/                 # Flask API
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── config/             # Configuration
│   ├── migrations/         # Database migrations
│   └── tests/              # Unit tests
├── frontend/
│   ├── web/               # React web app
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   └── contexts/
│   │   └── public/
│   └── mobile/            # React Native app
│       ├── src/
│       │   ├── components/
│       │   ├── screens/
│       │   ├── services/
│       │   └── contexts/
│       └── android/
└── docs/                  # Documentation
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL
- Redis
- React Native development environment

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd home-health-aid-app
   ```

2. **Set up Python environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   flask db init
   flask db migrate
   flask db upgrade
   ```

5. **Run the backend**
   ```bash
   python run.py
   ```

### Frontend Web Setup

1. **Install dependencies**
   ```bash
   cd frontend/web
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

### Mobile App Setup

1. **Install dependencies**
   ```bash
   cd frontend/mobile
   npm install
   ```

2. **iOS setup**
   ```bash
   cd ios
   pod install
   cd ..
   npx react-native run-ios
   ```

3. **Android setup**
   ```bash
   npx react-native run-android
   ```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user

### Timesheet Endpoints
- `GET /api/timesheet/` - Get timesheets
- `POST /api/timesheet/` - Create timesheet
- `POST /api/timesheet/{id}/clock-in` - Clock in
- `POST /api/timesheet/{id}/clock-out` - Clock out
- `POST /api/timesheet/{id}/approve` - Approve timesheet
- `POST /api/timesheet/{id}/reject` - Reject timesheet

### Geolocation Endpoints
- `POST /api/geolocation/location` - Update location
- `GET /api/geolocation/location/current` - Get current location
- `GET /api/geolocation/location/history` - Get location history
- `GET /api/geolocation/geofences` - Get geofences
- `POST /api/geolocation/geofences` - Create geofence

### Communication Endpoints
- `GET /api/communication/conversations` - Get conversations
- `POST /api/communication/conversations` - Create conversation
- `GET /api/communication/conversations/{id}/messages` - Get messages
- `POST /api/communication/conversations/{id}/messages` - Send message

### Client Endpoints
- `GET /api/client/` - Get clients
- `POST /api/client/` - Create client
- `GET /api/client/{id}` - Get specific client
- `PUT /api/client/{id}` - Update client

### Task Endpoints
- `GET /api/task/` - Get tasks
- `POST /api/task/` - Create task
- `POST /api/task/{id}/assign` - Assign task
- `POST /api/task/{id}/start` - Start task
- `POST /api/task/{id}/complete` - Complete task

### Reporting Endpoints
- `GET /api/reporting/reports` - Get reports
- `POST /api/reporting/reports` - Create report
- `GET /api/reporting/audit-logs` - Get audit logs
- `GET /api/reporting/compliance` - Get compliance report

### Analytics Endpoints
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/timesheet-analytics` - Get timesheet analytics
- `GET /api/analytics/location-analytics` - Get location analytics
- `GET /api/analytics/task-analytics` - Get task analytics

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user roles
- **Audit Logging**: Complete audit trail for all actions
- **Data Encryption**: Sensitive data encrypted at rest and in transit
- **HIPAA Compliance**: Built-in compliance features for healthcare data
- **Geofencing**: Location-based security controls

## Deployment

### Backend Deployment
1. Set up production environment variables
2. Configure PostgreSQL and Redis
3. Set up Celery workers
4. Configure reverse proxy (Nginx)
5. Set up SSL certificates
6. Configure monitoring and logging

### Frontend Deployment
1. Build production version
2. Deploy to CDN or hosting service
3. Configure environment variables
4. Set up monitoring

### Mobile App Deployment
1. Configure app signing
2. Build for production
3. Submit to app stores
4. Configure push notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@homehealthaid.com or create an issue in the repository.
