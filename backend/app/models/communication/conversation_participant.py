from app import db
from datetime import datetime
import uuid

class ConversationParticipant(db.Model):
    __tablename__ = 'conversation_participants'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(db.String(36), db.ForeignKey('conversations.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    left_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    user = db.relationship('User', backref='conversation_participations')
    
    def leave_conversation(self):
        """Mark participant as left"""
        self.left_at = datetime.utcnow()
        self.is_active = False
    
    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'user_id': self.user_id,
            'joined_at': self.joined_at.isoformat(),
            'left_at': self.left_at.isoformat() if self.left_at else None,
            'is_active': self.is_active,
            'user': self.user.to_dict() if self.user else None
        }
    
    def __repr__(self):
        return f'<ConversationParticipant {self.conversation_id} - {self.user_id}>'
