# Home Health Aid Backend

Flask-based REST API for the Home Health Aid application.

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- PostgreSQL (for production)
- Redis (for task queue)

### Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Initialize the database:**
   ```bash
   source setup_env.sh
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

4. **Run the application:**
   ```bash
   flask run
   ```

## 📁 Project Structure

```
backend/
├── app/                    # Application package
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Utilities
├── config/                # Configuration
├── migrations/            # Database migrations
├── tests/                 # Test files
├── run.py                 # Application entry point
├── requirements.txt       # Python dependencies
└── .env                  # Environment variables
```

## 🔧 Configuration

The application uses different configurations for different environments:

- **Development**: `config.DevelopmentConfig`
- **Production**: `config.ProductionConfig`
- **Testing**: `config.TestingConfig`

Set the configuration using the `FLASK_ENV` environment variable.

## 🗄️ Database

The application uses SQLAlchemy with Flask-Migrate for database management.

### Commands:
- `flask db init` - Initialize migrations
- `flask db migrate` - Create a new migration
- `flask db upgrade` - Apply migrations
- `flask db downgrade` - Rollback migrations

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Timesheet Management
- `POST /api/timesheet/` - Create timesheet
- `GET /api/timesheet/` - Get timesheets
- `POST /api/timesheet/<id>/clock-in` - Clock in
- `POST /api/timesheet/<id>/clock-out` - Clock out

### Geolocation
- `POST /api/geolocation/location` - Update location
- `GET /api/geolocation/location/current` - Get current location
- `GET /api/geolocation/location/history` - Get location history

### Communication
- `POST /api/communication/conversations` - Create conversation
- `GET /api/communication/conversations` - Get conversations
- `POST /api/communication/conversations/<id>/messages` - Send message

### Tasks
- `POST /api/task/` - Create task
- `GET /api/task/` - Get tasks
- `POST /api/task/<id>/assign` - Assign task
- `POST /api/task/<id>/complete` - Complete task

### Clients
- `POST /api/client/` - Create client
- `GET /api/client/` - Get clients
- `PUT /api/client/<id>` - Update client

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/location-analytics` - Location analytics
- `GET /api/analytics/task-analytics` - Task analytics

## 🧪 Testing

Run tests with pytest:
```bash
pytest
```

## 📊 Monitoring

The application includes:
- Audit logging
- Performance monitoring
- Error tracking
- Analytics endpoints

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Rate limiting
- Input validation

## 🚀 Deployment

For production deployment:

1. Set `FLASK_ENV=production`
2. Use PostgreSQL database
3. Configure Redis for task queue
4. Set up proper logging
5. Use HTTPS
6. Configure monitoring

## 📝 Environment Variables

Key environment variables (see `.env.example` for complete list):

- `SECRET_KEY` - Flask secret key
- `DATABASE_URL` - Database connection string
- `REDIS_URL` - Redis connection string
- `MAIL_SERVER` - SMTP server
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `STRIPE_SECRET_KEY` - Stripe API key
- `TWILIO_ACCOUNT_SID` - Twilio credentials

## 🤝 Contributing

1. Follow PEP 8 style guide
2. Write tests for new features
3. Update documentation
4. Use meaningful commit messages 