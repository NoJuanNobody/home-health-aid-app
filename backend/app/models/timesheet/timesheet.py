from app import db
from datetime import datetime
import uuid

class Timesheet(db.Model):
    __tablename__ = 'timesheets'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    client_id = db.Column(db.String(36), db.ForeignKey('clients.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    clock_in_time = db.Column(db.DateTime)
    clock_out_time = db.Column(db.DateTime)
    clock_in_location = db.Column(db.JSON)  # {lat, lng, address}
    clock_out_location = db.Column(db.JSON)  # {lat, lng, address}
    total_hours = db.Column(db.Float, default=0.0)
    overtime_hours = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    notes = db.Column(db.Text)
    approved_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    client = db.relationship('Client', backref='timesheets')
    approver = db.relationship('User', foreign_keys=[approved_by])
    break_times = db.relationship('BreakTime', backref='timesheet', lazy='dynamic', cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        super(Timesheet, self).__init__(**kwargs)
        if self.clock_in_time and self.clock_out_time:
            self.calculate_hours()
    
    def clock_in(self, location=None):
        self.clock_in_time = datetime.utcnow()
        if location:
            self.clock_in_location = location
        self.status = 'active'
    
    def clock_out(self, location=None):
        self.clock_out_time = datetime.utcnow()
        if location:
            self.clock_out_location = location
        self.calculate_hours()
        self.status = 'completed'
    
    def calculate_hours(self):
        if self.clock_in_time and self.clock_out_time:
            total_seconds = (self.clock_out_time - self.clock_in_time).total_seconds()
            break_seconds = sum((bt.end_time - bt.start_time).total_seconds() 
                              for bt in self.break_times if bt.start_time and bt.end_time)
            work_seconds = total_seconds - break_seconds
            self.total_hours = work_seconds / 3600.0
            
            # Calculate overtime (over 8 hours)
            if self.total_hours > 8.0:
                self.overtime_hours = self.total_hours - 8.0
            else:
                self.overtime_hours = 0.0
    
    def approve(self, approver_id):
        self.status = 'approved'
        self.approved_by = approver_id
        self.approved_at = datetime.utcnow()
    
    def reject(self, approver_id, reason=None):
        self.status = 'rejected'
        self.approved_by = approver_id
        self.approved_at = datetime.utcnow()
        if reason:
            self.notes = f"Rejected: {reason}"
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'client_id': self.client_id,
            'date': self.date.isoformat() if self.date else None,
            'clock_in_time': self.clock_in_time.isoformat() if self.clock_in_time else None,
            'clock_out_time': self.clock_out_time.isoformat() if self.clock_out_time else None,
            'clock_in_location': self.clock_in_location,
            'clock_out_location': self.clock_out_location,
            'total_hours': self.total_hours,
            'overtime_hours': self.overtime_hours,
            'status': self.status,
            'notes': self.notes,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'break_times': [bt.to_dict() for bt in self.break_times]
        }
    
    def __repr__(self):
        return f'<Timesheet {self.id} - {self.user_id} - {self.date}>'
