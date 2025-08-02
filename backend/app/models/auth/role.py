from app import db
from datetime import datetime
import uuid

class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    permissions = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, **kwargs):
        super(Role, self).__init__(**kwargs)
        if 'permissions' not in kwargs:
            self.permissions = self.get_default_permissions()
    
    def get_default_permissions(self):
        if self.name == 'admin':
            return {
                'users': ['create', 'read', 'update', 'delete'],
                'timesheets': ['create', 'read', 'update', 'delete'],
                'geolocation': ['create', 'read', 'update', 'delete'],
                'communication': ['create', 'read', 'update', 'delete'],
                'clients': ['create', 'read', 'update', 'delete'],
                'tasks': ['create', 'read', 'update', 'delete'],
                'reports': ['create', 'read', 'update', 'delete'],
                'analytics': ['read']
            }
        elif self.name == 'manager':
            return {
                'users': ['read', 'update'],
                'timesheets': ['create', 'read', 'update', 'approve'],
                'geolocation': ['read'],
                'communication': ['create', 'read', 'update'],
                'clients': ['create', 'read', 'update'],
                'tasks': ['create', 'read', 'update', 'assign'],
                'reports': ['create', 'read'],
                'analytics': ['read']
            }
        elif self.name == 'health_aid':
            return {
                'users': ['read'],
                'timesheets': ['create', 'read', 'update'],
                'geolocation': ['create', 'read'],
                'communication': ['create', 'read'],
                'clients': ['read'],
                'tasks': ['read', 'update'],
                'reports': ['read'],
                'analytics': ['read']
            }
        else:
            return {}
    
    def has_permission(self, resource, action):
        if not self.permissions:
            return False
        return action in self.permissions.get(resource, [])
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'permissions': self.permissions,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Role {self.name}>'
