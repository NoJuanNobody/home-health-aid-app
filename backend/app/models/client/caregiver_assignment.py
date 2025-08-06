from app import db
from datetime import datetime
import uuid

class CaregiverAssignment(db.Model):
    __tablename__ = 'caregiver_assignments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    caregiver_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    client_id = db.Column(db.String(36), db.ForeignKey('clients.id'), nullable=False)
    assignment_type = db.Column(db.String(50), default='primary')  # primary, backup, temporary
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)  # NULL means ongoing
    is_active = db.Column(db.Boolean, default=True)
    assigned_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    caregiver = db.relationship('User', foreign_keys=[caregiver_id])
    client = db.relationship('Client')
    assigner = db.relationship('User', foreign_keys=[assigned_by])
    
    def __init__(self, **kwargs):
        super(CaregiverAssignment, self).__init__(**kwargs)
        if not self.start_date:
            self.start_date = datetime.utcnow().date()
    
    def is_current(self):
        """Check if assignment is currently active"""
        today = datetime.utcnow().date()
        return (
            self.is_active and
            self.start_date <= today and
            (self.end_date is None or self.end_date >= today)
        )
    
    def to_dict(self):
        return {
            'id': self.id,
            'caregiver_id': self.caregiver_id,
            'client_id': self.client_id,
            'assignment_type': self.assignment_type,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_active': self.is_active,
            'assigned_by': self.assigned_by,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_current': self.is_current(),
            'caregiver': {
                'id': self.caregiver.id,
                'name': f"{self.caregiver.first_name} {self.caregiver.last_name}",
                'email': self.caregiver.email
            } if self.caregiver else None,
            'client': {
                'id': self.client.id,
                'name': f"{self.client.first_name} {self.client.last_name}",
                'email': self.client.email
            } if self.client else None
        }
    
    def __repr__(self):
        return f'<CaregiverAssignment {self.caregiver_id} - {self.client_id}>' 