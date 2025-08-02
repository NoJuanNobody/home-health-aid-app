from app import db
from datetime import datetime
import uuid

class Report(db.Model):
    __tablename__ = 'reports'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    report_type = db.Column(db.String(50))  # timesheet, geolocation, task, client, compliance
    report_format = db.Column(db.String(20), default='pdf')  # pdf, excel, csv, json
    parameters = db.Column(db.JSON)  # Report parameters
    status = db.Column(db.String(20), default='pending')  # pending, processing, completed, failed
    file_url = db.Column(db.String(500))
    file_size = db.Column(db.Integer)
    generated_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    generated_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    generator = db.relationship('User', backref='generated_reports')
    
    def start_generation(self):
        """Mark report as processing"""
        self.status = 'processing'
    
    def complete_generation(self, file_url, file_size):
        """Mark report as completed"""
        self.status = 'completed'
        self.file_url = file_url
        self.file_size = file_size
        self.generated_at = datetime.utcnow()
    
    def fail_generation(self, error_message):
        """Mark report as failed"""
        self.status = 'failed'
        self.description = f"Generation failed: {error_message}"
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'report_type': self.report_type,
            'report_format': self.report_format,
            'parameters': self.parameters,
            'status': self.status,
            'file_url': self.file_url,
            'file_size': self.file_size,
            'generated_by': self.generated_by,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Report {self.title} - {self.report_type}>'
