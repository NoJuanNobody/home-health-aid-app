from app import db
from datetime import datetime
import uuid

class Conversation(db.Model):
    __tablename__ = 'conversations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100))
    conversation_type = db.Column(db.String(20), default='direct')  # direct, group
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    creator = db.relationship('User', backref='created_conversations')
    participants = db.relationship('ConversationParticipant', backref='conversation', lazy='dynamic', cascade='all, delete-orphan')
    messages = db.relationship('Message', backref='conversation', lazy='dynamic', cascade='all, delete-orphan')
    
    def add_participant(self, user_id):
        """Add a participant to the conversation"""
        from app.models.communication.conversation_participant import ConversationParticipant
        participant = ConversationParticipant(
            conversation_id=self.id,
            user_id=user_id
        )
        db.session.add(participant)
        return participant
    
    def remove_participant(self, user_id):
        """Remove a participant from the conversation"""
        participant = self.participants.filter_by(user_id=user_id).first()
        if participant:
            db.session.delete(participant)
    
    def get_participants(self):
        """Get all participants in the conversation"""
        return [p.user for p in self.participants]
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'conversation_type': self.conversation_type,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active,
            'participants': [p.to_dict() for p in self.participants],
            'last_message': self.messages.order_by(Message.created_at.desc()).first().to_dict() if self.messages.first() else None
        }
    
    def __repr__(self):
        return f'<Conversation {self.id} - {self.name}>'
