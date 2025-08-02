from app import db
from datetime import datetime
import uuid
from shapely.geometry import Point, Polygon
import json

class Geofence(db.Model):
    __tablename__ = 'geofences'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    client_id = db.Column(db.String(36), db.ForeignKey('clients.id'), nullable=False)
    center_latitude = db.Column(db.Float, nullable=False)
    center_longitude = db.Column(db.Float, nullable=False)
    radius_meters = db.Column(db.Float, nullable=False)
    geofence_type = db.Column(db.String(20), default='circle')  # circle, polygon
    polygon_coordinates = db.Column(db.JSON)  # For polygon geofences
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    client = db.relationship('Client', backref='geofences')
    creator = db.relationship('User', backref='created_geofences')
    
    def __init__(self, **kwargs):
        super(Geofence, self).__init__(**kwargs)
        if self.geofence_type == 'polygon' and not self.polygon_coordinates:
            self.polygon_coordinates = []
    
    def is_point_inside(self, latitude, longitude):
        """Check if a point is inside the geofence"""
        if self.geofence_type == 'circle':
            return self._is_point_in_circle(latitude, longitude)
        elif self.geofence_type == 'polygon':
            return self._is_point_in_polygon(latitude, longitude)
        return False
    
    def _is_point_in_circle(self, latitude, longitude):
        """Check if point is within circle radius"""
        from geopy.distance import geodesic
        
        center = (self.center_latitude, self.center_longitude)
        point = (latitude, longitude)
        distance = geodesic(center, point).meters
        
        return distance <= self.radius_meters
    
    def _is_point_in_polygon(self, latitude, longitude):
        """Check if point is inside polygon"""
        if not self.polygon_coordinates:
            return False
        
        try:
            point = Point(longitude, latitude)  # Note: Point takes (x, y) which is (lng, lat)
            polygon_coords = [(coord['lng'], coord['lat']) for coord in self.polygon_coordinates]
            polygon = Polygon(polygon_coords)
            return polygon.contains(point)
        except Exception as e:
            print(f"Error checking polygon containment: {e}")
            return False
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'client_id': self.client_id,
            'center_latitude': self.center_latitude,
            'center_longitude': self.center_longitude,
            'radius_meters': self.radius_meters,
            'geofence_type': self.geofence_type,
            'polygon_coordinates': self.polygon_coordinates,
            'is_active': self.is_active,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Geofence {self.name} - {self.client_id}>'
