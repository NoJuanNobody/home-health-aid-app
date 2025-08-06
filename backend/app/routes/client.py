from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.client.client import Client
from app.models.client.care_plan import CarePlan
from app.models.auth.user import User
from app.models.reporting.audit_log import AuditLog
from app.models.geolocation.geofence import Geofence
from app.services.geolocation.geocoding_service import geocoding_service
from datetime import datetime
import uuid

client_bp = Blueprint('client', __name__)

def create_client_geofence(client, current_user_id):
    """Create a geofence for a client's home address"""
    try:
        # If client already has coordinates, use them
        if client.latitude and client.longitude:
            latitude = client.latitude
            longitude = client.longitude
        elif client.address:
            # Geocode the address to get coordinates
            geocode_result = geocoding_service.address_to_coordinates(client.address)
            if geocode_result:
                latitude = geocode_result['latitude']
                longitude = geocode_result['longitude']
                # Update client with geocoded coordinates
                client.latitude = latitude
                client.longitude = longitude
                db.session.commit()
            else:
                # If geocoding fails, skip geofence creation
                return None
        else:
            # No address or coordinates available
            return None
        
        # Create geofence for client's home
        geofence = Geofence(
            name=f"{client.first_name} {client.last_name} Residence",
            description=f"Home address: {client.address}",
            client_id=client.id,
            center_latitude=latitude,
            center_longitude=longitude,
            radius_meters=100,  # Default 100m radius
            geofence_type='circle',
            created_by=current_user_id
        )
        
        db.session.add(geofence)
        db.session.commit()
        
        # Log audit for geofence creation
        audit_log = AuditLog(
            user_id=current_user_id,
            action='geofence_created_for_client',
            resource_type='geofence',
            resource_id=geofence.id,
            details={
                'client_id': client.id,
                'client_name': f"{client.first_name} {client.last_name}",
                'address': client.address,
                'coordinates': f"{latitude}, {longitude}"
            },
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return geofence
        
    except Exception as e:
        print(f"Error creating geofence for client {client.id}: {str(e)}")
        return None

@client_bp.route('/', methods=['GET'])
@jwt_required()
def get_clients():
    """Get all clients"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    clients = Client.query.filter_by(is_active=True).all()
    
    return jsonify({
        'clients': [client.to_dict() for client in clients]
    })

@client_bp.route('/', methods=['POST'])
@jwt_required()
def create_client():
    """Create new client"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('first_name') or not data.get('last_name'):
        return jsonify({'error': 'First name and last name are required'}), 400
    
    client = Client(
        first_name=data['first_name'],
        last_name=data['last_name'],
        date_of_birth=datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date() if data.get('date_of_birth') else None,
        gender=data.get('gender'),
        phone=data.get('phone'),
        email=data.get('email'),
        address=data.get('address'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        emergency_contact_name=data.get('emergency_contact_name'),
        emergency_contact_phone=data.get('emergency_contact_phone'),
        emergency_contact_relationship=data.get('emergency_contact_relationship'),
        insurance_provider=data.get('insurance_provider'),
        insurance_policy_number=data.get('insurance_policy_number'),
        medical_conditions=data.get('medical_conditions'),
        allergies=data.get('allergies'),
        medications=data.get('medications'),
        special_instructions=data.get('special_instructions'),
        created_by=current_user_id
    )
    
    db.session.add(client)
    db.session.commit()
    
    # Create geofence for client's home address
    geofence = create_client_geofence(client, current_user_id)
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='client_created',
        resource_type='client',
        resource_id=client.id,
        details=data,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    response_data = {
        'message': 'Client created successfully',
        'client': client.to_dict()
    }
    
    if geofence:
        response_data['geofence_created'] = True
        response_data['geofence'] = geofence.to_dict()
        response_data['message'] += ' and home geofence created'
    else:
        response_data['geofence_created'] = False
        response_data['message'] += ' (no geofence created - address required)'
    
    return jsonify(response_data), 201

@client_bp.route('/<client_id>', methods=['GET'])
@jwt_required()
def get_client(client_id):
    """Get specific client"""
    current_user_id = get_jwt_identity()
    
    client = Client.query.get(client_id)
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    return jsonify({
        'client': client.to_dict()
    })

@client_bp.route('/<client_id>', methods=['PUT'])
@jwt_required()
def update_client(client_id):
    """Update client"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    client = Client.query.get(client_id)
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    if 'first_name' in data:
        client.first_name = data['first_name']
    if 'last_name' in data:
        client.last_name = data['last_name']
    if 'date_of_birth' in data:
        client.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
    if 'gender' in data:
        client.gender = data['gender']
    if 'phone' in data:
        client.phone = data['phone']
    if 'email' in data:
        client.email = data['email']
    if 'address' in data:
        client.address = data['address']
    if 'latitude' in data:
        client.latitude = data['latitude']
    if 'longitude' in data:
        client.longitude = data['longitude']
    if 'emergency_contact_name' in data:
        client.emergency_contact_name = data['emergency_contact_name']
    if 'emergency_contact_phone' in data:
        client.emergency_contact_phone = data['emergency_contact_phone']
    if 'emergency_contact_relationship' in data:
        client.emergency_contact_relationship = data['emergency_contact_relationship']
    if 'insurance_provider' in data:
        client.insurance_provider = data['insurance_provider']
    if 'insurance_policy_number' in data:
        client.insurance_policy_number = data['insurance_policy_number']
    if 'medical_conditions' in data:
        client.medical_conditions = data['medical_conditions']
    if 'allergies' in data:
        client.allergies = data['allergies']
    if 'medications' in data:
        client.medications = data['medications']
    if 'special_instructions' in data:
        client.special_instructions = data['special_instructions']
    if 'is_active' in data:
        client.is_active = data['is_active']
    
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='client_updated',
        resource_type='client',
        resource_id=client.id,
        details=data,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Client updated successfully',
        'client': client.to_dict()
    })

@client_bp.route('/<client_id>', methods=['DELETE'])
@jwt_required()
def delete_client(client_id):
    """Delete client (soft delete)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    client = Client.query.get(client_id)
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    # Soft delete - set is_active to False
    client.is_active = False
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='client_deleted',
        resource_type='client',
        resource_id=client.id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Client deleted successfully'
    })

@client_bp.route('/<client_id>/geofence', methods=['POST'])
@jwt_required()
def create_client_geofence_endpoint(client_id):
    """Create a geofence for an existing client"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    client = Client.query.get(client_id)
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    if not client.address:
        return jsonify({'error': 'Client must have an address to create a geofence'}), 400
    
    # Check if client already has a geofence
    existing_geofence = Geofence.query.filter_by(client_id=client_id, is_active=True).first()
    if existing_geofence:
        return jsonify({'error': 'Client already has an active geofence'}), 400
    
    # Create geofence for client
    geofence = create_client_geofence(client, current_user_id)
    
    if geofence:
        return jsonify({
            'success': True,
            'message': 'Home geofence created successfully',
            'geofence': geofence.to_dict()
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Failed to create geofence - could not geocode address'
        }), 400

@client_bp.route('/<client_id>/care-plans', methods=['GET'])
@jwt_required()
def get_client_care_plans(client_id):
    """Get care plans for client"""
    client = Client.query.get(client_id)
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    care_plans = CarePlan.query.filter_by(client_id=client_id, is_active=True).all()
    
    return jsonify({
        'care_plans': [cp.to_dict() for cp in care_plans]
    })

@client_bp.route('/<client_id>/care-plans', methods=['POST'])
@jwt_required()
def create_care_plan(client_id):
    """Create care plan for client"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    client = Client.query.get(client_id)
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('title') or not data.get('start_date'):
        return jsonify({'error': 'Title and start date are required'}), 400
    
    care_plan = CarePlan(
        client_id=client_id,
        title=data['title'],
        description=data.get('description'),
        care_type=data.get('care_type'),
        frequency=data.get('frequency'),
        start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
        end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None,
        created_by=current_user_id
    )
    
    db.session.add(care_plan)
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='care_plan_created',
        resource_type='care_plan',
        resource_id=care_plan.id,
        details=data,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Care plan created successfully',
        'care_plan': care_plan.to_dict()
    }), 201
