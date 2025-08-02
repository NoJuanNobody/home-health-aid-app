from app import db
from datetime import datetime
import uuid

class TaskAssignment(db.Model):
    __tablename__ = 'task_assignments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = db.Column(db.String(36), db.ForeignKey('tasks.id'), nullable=False)
    assigned_user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    assigned_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='assigned')  # assigned, started, completed, declined
    notes = db.Column(db.Text)
    
    # Relationships
    assigned_user = db.relationship('User', foreign_keys=[assigned_user_id], backref='task_assignments')
    assigner = db.relationship('User', foreign_keys=[assigned_by], backref='assigned_tasks')
    
    def start_task(self):
        """Mark task as started"""
        self.status = 'started'
        self.started_at = datetime.utcnow()
    
    def complete_task(self, notes=None):
        """Mark task as completed"""
        self.status = 'completed'
        self.completed_at = datetime.utcnow()
        if notes:
            self.notes = notes
    
    def decline_task(self, reason=None):
        """Decline task assignment"""
        self.status = 'declined'
        if reason:
            self.notes = f"Declined: {reason}"
    
    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'assigned_user_id': self.assigned_user_id,
            'assigned_by': self.assigned_by,
            'assigned_at': self.assigned_at.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'status': self.status,
            'notes': self.notes,
            'assigned_user': self.assigned_user.to_dict() if self.assigned_user else None,
            'assigner': self.assigner.to_dict() if self.assigner else None
        }
    
    def __repr__(self):
        return f'<TaskAssignment {self.task_id} - {self.assigned_user_id}>'
