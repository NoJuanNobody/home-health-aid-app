from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_mail import Mail
from flask_bcrypt import Bcrypt
import os
from datetime import timedelta

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO()
mail = Mail()
bcrypt = Bcrypt()

def create_app(config_name='development'):
    app = Flask(__name__)
    app.url_map.strict_slashes = False
    
    # Configuration
    if config_name == 'development':
        app.config.from_object('config.DevelopmentConfig')
    elif config_name == 'production':
        app.config.from_object('config.ProductionConfig')
    elif config_name == 'testing':
        app.config.from_object('config.TestingConfig')
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")
    mail.init_app(app)
    bcrypt.init_app(app)
    CORS(app)
    
    # JWT configuration
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.timesheet import timesheet_bp
    from app.routes.geolocation import geolocation_bp
    from app.routes.communication import communication_bp
    from app.routes.client import client_bp
    from app.routes.caregiver_assignment import caregiver_assignment_bp
    from app.routes.caregiver import caregiver_bp
    from app.routes.task import task_bp
    from app.routes.reporting import reporting_bp
    from app.routes.analytics import analytics_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(timesheet_bp, url_prefix='/api/timesheet')
    app.register_blueprint(geolocation_bp, url_prefix='/api/geolocation')
    app.register_blueprint(communication_bp, url_prefix='/api/communication')
    app.register_blueprint(client_bp, url_prefix='/api/client')
    app.register_blueprint(caregiver_assignment_bp, url_prefix='/api/caregiver-assignment')
    app.register_blueprint(caregiver_bp, url_prefix='/api/caregiver')
    app.register_blueprint(task_bp, url_prefix='/api/task')
    app.register_blueprint(reporting_bp, url_prefix='/api/reporting')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    return app
