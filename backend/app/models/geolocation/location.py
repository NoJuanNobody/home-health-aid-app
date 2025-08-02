from app import db
from datetime import datetime
import uuid

class Location(db.Model):
    __tablename__ = 'locations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    accuracy = db.Column(db.Float)
    altitude = db.Column(db.Float)
    speed = db.Column(db.Float)
    heading = db.Column(db.Float)
    address = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, **kwargs):
        super(Location, self).__init__(**kwargs)
        if 'latitude' in kwargs and 'longitude' in kwargs:
            self.update_address()
    
    def update_address(self):
        """Update address based on coordinates using reverse geocoding"""
        try:
            from geopy.geocoders import Nominatim
            geolocator = Nominatim(user_agent="home_health_aid_app")
            location = geolocator.reverse(f"{self.latitude}, {self.longitude}")
            if location:
                self.address = location.address
        except Exception as e:
            # Log error but don't fail
            print(f"Error updating address: {e}")
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'accuracy': self.accuracy,
            'altitude': self.altitude,
            'speed': self.speed,
            'heading': self.heading,
            'address': self.address,
            'timestamp': self.timestamp.isoformat(),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Location {self.id} - {self.latitude}, {self.longitude}>'
