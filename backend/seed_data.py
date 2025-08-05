#!/usr/bin/env python3
"""
Development Data Seeding Script
Populates the database with sample data for development and testing.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.auth.user import User
from app.models.auth.role import Role
from app.models.client.client import Client
from app.models.geolocation.geofence import Geofence
from datetime import datetime

def create_roles():
    """Create basic roles"""
    roles = [
        {'name': 'admin', 'description': 'Administrator'},
        {'name': 'manager', 'description': 'Manager'},
        {'name': 'caregiver', 'description': 'Caregiver'},
        {'name': 'client', 'description': 'Client'}
    ]
    
    for role_data in roles:
        role = Role.query.filter_by(name=role_data['name']).first()
        if not role:
            role = Role(**role_data)
            db.session.add(role)
            print(f"Created role: {role.name}")
    
    db.session.commit()

def create_users():
    """Create sample users"""
    users_data = [
        {
            'email': 'admin@homehealth.com',
            'username': 'admin',
            'password': 'admin123',
            'first_name': 'Admin',
            'last_name': 'User',
            'phone': '+1 (555) 123-4567',
            'role_name': 'admin'
        },
        {
            'email': 'manager@homehealth.com',
            'username': 'manager',
            'password': 'manager123',
            'first_name': 'Sarah',
            'last_name': 'Johnson',
            'phone': '+1 (555) 234-5678',
            'role_name': 'manager'
        }
    ]
    
    for user_data in users_data:
        user = User.query.filter_by(email=user_data['email']).first()
        if not user:
            role = Role.query.filter_by(name=user_data['role_name']).first()
            user_data['role_id'] = role.id
            del user_data['role_name']
            
            user = User(**user_data)
            db.session.add(user)
            print(f"Created user: {user.username}")
    
    db.session.commit()

def create_clients():
    """Create sample clients"""
    # Get a manager user for created_by
    manager = User.query.filter_by(role_id=Role.query.filter_by(name='manager').first().id).first()
    
    clients_data = [
        {
            'first_name': 'Margaret',
            'last_name': 'Johnson',
            'date_of_birth': datetime(1945, 3, 15),
            'gender': 'Female',
            'phone': '+1 (555) 111-2222',
            'email': 'margaret.johnson@email.com',
            'address': '123 Main Street, New York, NY 10001',
            'latitude': 40.7128,
            'longitude': -74.0060,
            'emergency_contact_name': 'Robert Johnson',
            'emergency_contact_phone': '+1 (555) 111-3333',
            'emergency_contact_relationship': 'Son',
            'insurance_provider': 'Blue Cross Blue Shield',
            'insurance_policy_number': 'BCBS123456',
            'medical_conditions': 'Diabetes, Hypertension',
            'allergies': 'Penicillin',
            'medications': 'Metformin, Lisinopril',
            'special_instructions': 'Requires assistance with medication management and blood sugar monitoring'
        },
        {
            'first_name': 'Robert',
            'last_name': 'Smith',
            'date_of_birth': datetime(1938, 7, 22),
            'gender': 'Male',
            'phone': '+1 (555) 222-3333',
            'email': 'robert.smith@email.com',
            'address': '456 Oak Avenue, Brooklyn, NY 11201',
            'latitude': 40.7589,
            'longitude': -73.9851,
            'emergency_contact_name': 'Jennifer Smith',
            'emergency_contact_phone': '+1 (555) 222-4444',
            'emergency_contact_relationship': 'Daughter',
            'insurance_provider': 'Aetna',
            'insurance_policy_number': 'AET789012',
            'medical_conditions': 'Arthritis, Heart Disease',
            'allergies': 'None',
            'medications': 'Aspirin, Atorvastatin',
            'special_instructions': 'Needs assistance with mobility and meal preparation'
        },
        {
            'first_name': 'Helen',
            'last_name': 'Davis',
            'date_of_birth': datetime(1952, 11, 8),
            'gender': 'Female',
            'phone': '+1 (555) 333-4444',
            'email': 'helen.davis@email.com',
            'address': '789 Pine Road, Queens, NY 11375',
            'latitude': 40.7505,
            'longitude': -73.9934,
            'emergency_contact_name': 'Michael Davis',
            'emergency_contact_phone': '+1 (555) 333-5555',
            'emergency_contact_relationship': 'Son',
            'insurance_provider': 'UnitedHealth',
            'insurance_policy_number': 'UHC345678',
            'medical_conditions': 'Dementia, Diabetes',
            'allergies': 'Latex',
            'medications': 'Donepezil, Insulin',
            'special_instructions': 'Requires 24/7 supervision and assistance with daily activities'
        }
    ]
    
    for client_data in clients_data:
        client = Client.query.filter_by(email=client_data['email']).first()
        if not client:
            client_data['created_by'] = manager.id
            client = Client(**client_data)
            db.session.add(client)
            print(f"Created client: {client.full_name}")
    
    db.session.commit()

def create_geofences():
    """Create sample geofences"""
    # Get clients and a manager user
    clients = Client.query.all()
    manager = User.query.filter_by(role_id=Role.query.filter_by(name='manager').first().id).first()
    
    geofences_data = [
        {
            'name': 'Margaret Johnson Residence',
            'description': '123 Main Street, New York, NY 10001 - Margaret Johnson\'s home',
            'client_id': clients[0].id,
            'center_latitude': 40.7128,
            'center_longitude': -74.0060,
            'radius_meters': 100,
            'geofence_type': 'circle',
            'created_by': manager.id
        },
        {
            'name': 'Robert Smith Residence',
            'description': '456 Oak Avenue, Brooklyn, NY 11201 - Robert Smith\'s home',
            'client_id': clients[1].id,
            'center_latitude': 40.7589,
            'center_longitude': -73.9851,
            'radius_meters': 150,
            'geofence_type': 'circle',
            'created_by': manager.id
        },
        {
            'name': 'Helen Davis Residence',
            'description': '789 Pine Road, Queens, NY 11375 - Helen Davis\'s home',
            'client_id': clients[2].id,
            'center_latitude': 40.7505,
            'center_longitude': -73.9934,
            'radius_meters': 200,
            'geofence_type': 'circle',
            'created_by': manager.id
        }
    ]
    
    for geofence_data in geofences_data:
        geofence = Geofence.query.filter_by(name=geofence_data['name']).first()
        if not geofence:
            geofence = Geofence(**geofence_data)
            db.session.add(geofence)
            print(f"Created geofence: {geofence.name}")
    
    db.session.commit()

def main():
    """Main function to seed all data"""
    app = create_app()
    
    with app.app_context():
        print("Starting database seeding...")
        
        # Create roles first
        print("\n1. Creating roles...")
        create_roles()
        
        # Create users
        print("\n2. Creating users...")
        create_users()
        
        # Create clients
        print("\n3. Creating clients...")
        create_clients()
        
        # Create geofences
        print("\n4. Creating geofences...")
        create_geofences()
        
        print("\n✅ Database seeding completed successfully!")
        print("\n📋 Sample Data Created:")
        print("   - 2 Users (admin, manager)")
        print("   - 3 Clients (Margaret, Robert, Helen)")
        print("   - 3 Geofences (client residences)")
        print("\n🔑 Login Credentials:")
        print("   - Admin: admin@homehealth.com / admin123")
        print("   - Manager: manager@homehealth.com / manager123")

if __name__ == '__main__':
    main() 