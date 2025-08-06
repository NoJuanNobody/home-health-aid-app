#!/usr/bin/env python3
"""
Simple script to check geofences in the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.geolocation.geofence import Geofence
from app.models.client.client import Client

def check_geofences():
    """Check all geofences in the database"""
    app = create_app()
    
    with app.app_context():
        print("🔍 Checking geofences in database...")
        
        geofences = Geofence.query.all()
        print(f"\n📊 Found {len(geofences)} geofences:")
        
        for geofence in geofences:
            client = Client.query.get(geofence.client_id)
            print(f"\n📍 Geofence: {geofence.name}")
            print(f"   ID: {geofence.id}")
            print(f"   Active: {geofence.is_active}")
            print(f"   Client: {client.first_name} {client.last_name}" if client else "   Client: Unknown")
            print(f"   Coordinates: {geofence.center_latitude}, {geofence.center_longitude}")
            print(f"   Radius: {geofence.radius_meters}m")
            print(f"   Type: {geofence.geofence_type}")
            print(f"   Description: {geofence.description}")

if __name__ == '__main__':
    check_geofences() 