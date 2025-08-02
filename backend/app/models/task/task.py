from app import db
from datetime import datetime
import uuid

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    task_type = db.Column(db.String(50))  # personal_care, medication, meal_prep, etc.
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, urgent
    estimated_duration = db.Column(db.Integer)  # in minutes
    care_plan_id = db.Column(db.String(36), db.ForeignKey('care_plans.id'))
    client_id = db.Column(db.String(36), db.ForeignKey('clients.id'), nullable=False)
    scheduled_date = db.Column(db.Date)
    scheduled_time = db.Column(db.Time)
    is_recurring = db.Column(db.Boolean, default=False)
    recurrence_pattern = db.Column(db.String(50))  # daily, weekly, monthly
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed, cancelled
    completion_notes = db.Column(db.Text)
    photo_proof_url = db.Column(db.String(500))
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_tasks')
    client = db.relationship('Client', backref='tasks')
    assignments = db.relationship('TaskAssignment', backref='task', lazy='dynamic', cascade='all, delete-orphan')
    
    def assign_to_user(self, user_id, assigned_by):
        """Assign task to a user"""
        from app.models.task.task_assignment import TaskAssignment
        assignment = TaskAssignment(
            task_id=self.id,
            assigned_user_id=user_id,
            assigned_by=assigned_by
        )
        db.session.add(assignment)
        return assignment
    
    def start_task(self):
        """Mark task as in progress"""
        self.status = 'in_progress'
    
    def complete_task(self, notes=None, photo_proof_url=None):
        """Mark task as completed"""
        self.status = 'completed'
        if notes:
            self.completion_notes = notes
        if photo_proof_url:
            self.photo_proof_url = photo_proof_url
    
    def cancel_task(self, reason=None):
        """Cancel task"""
        self.status = 'cancelled'
        if reason:
            self.completion_notes = f"Cancelled: {reason}"
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'task_type': self.task_type,
            'priority': self.priority,
            'estimated_duration': self.estimated_duration,
            'care_plan_id': self.care_plan_id,
            'client_id': self.client_id,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'is_recurring': self.is_recurring,
            'recurrence_pattern': self.recurrence_pattern,
            'status': self.status,
            'completion_notes': self.completion_notes,
            'photo_proof_url': self.photo_proof_url,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'assignments': [assignment.to_dict() for assignment in self.assignments]
        }
    
    def __repr__(self):
        return f'<Task {self.title} - {self.status}>'
