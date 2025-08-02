from app import db
from datetime import datetime
import uuid

class BreakTime(db.Model):
    __tablename__ = 'break_times'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timesheet_id = db.Column(db.String(36), db.ForeignKey('timesheets.id'), nullable=False)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    break_type = db.Column(db.String(20), default='break')  # break, lunch, other
    duration_minutes = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def start_break(self):
        self.start_time = datetime.utcnow()
    
    def end_break(self):
        self.end_time = datetime.utcnow()
        if self.start_time:
            duration = self.end_time - self.start_time
            self.duration_minutes = int(duration.total_seconds() / 60)
    
    def to_dict(self):
        return {
            'id': self.id,
            'timesheet_id': self.timesheet_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'break_type': self.break_type,
            'duration_minutes': self.duration_minutes,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<BreakTime {self.id} - {self.break_type}>'
