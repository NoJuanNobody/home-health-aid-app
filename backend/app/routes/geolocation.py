from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.geolocation.location import Location
from app.models.geolocation.geofence import Geofence
from app.models.auth.user import User
from app.models.reporting.audit_log import AuditLog
from app.services.geolocation.geocoding_service import geocoding_service
from datetime import datetime, timedelta
import uuid

geolocation_bp = Blueprint('geolocation', __name__)

@geolocation_bp.route('/location', methods=['POST'])
@jwt_required()
def update_location():
    """Update user location"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not data.get('latitude') or not data.get('longitude'):
        return jsonify({'error': 'Latitude and longitude are required'}), 400
    
    # Deactivate previous active location
    Location.query.filter_by(user_id=current_user_id, is_active=True).update({'is_active': False})
    
    # Create new location
    location = Location(
        user_id=current_user_id,
        latitude=data['latitude'],
        longitude=data['longitude'],
        accuracy=data.get('accuracy'),
        altitude=data.get('altitude'),
        speed=data.get('speed'),
        heading=data.get('heading'),
        address=data.get('address')
    )
    
    db.session.add(location)
    db.session.commit()
    
    # Check geofences
    geofence_alerts = []
    geofences = Geofence.query.filter_by(is_active=True).all()
    
    for geofence in geofences:
        if geofence.is_point_inside(location.latitude, location.longitude):
            geofence_alerts.append({
                'geofence_id': geofence.id,
                'geofence_name': geofence.name,
                'client_id': geofence.client_id,
                'alert_type': 'entered'
            })
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='location_updated',
        resource_type='location',
        resource_id=location.id,
        details={
            'latitude': location.latitude,
            'longitude': location.longitude,
            'geofence_alerts': geofence_alerts
        },
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Location updated successfully',
        'location': location.to_dict(),
        'geofence_alerts': geofence_alerts
    })

@geolocation_bp.route('/location/current', methods=['GET'])
@jwt_required()
def get_current_location():
    """Get current user location"""
    current_user_id = get_jwt_identity()
    
    location = Location.query.filter_by(user_id=current_user_id, is_active=True).first()
    
    if not location:
        return jsonify({'error': 'No active location found'}), 404
    
    return jsonify({
        'location': location.to_dict()
    })

@geolocation_bp.route('/location/history', methods=['GET'])
@jwt_required()
def get_location_history():
    """Get location history for current user or all users for managers"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Get query parameters
    user_id = request.args.get('user_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    limit = int(request.args.get('limit', 100))
    
    query = Location.query
    
    # Filter by user role
    if user.role.name in ['admin', 'manager']:
        if user_id:
            query = query.filter_by(user_id=user_id)
    else:
        query = query.filter_by(user_id=current_user_id)
    
    # Apply date filters
    if start_date:
        start_datetime = datetime.fromisoformat(start_date)
        query = query.filter(Location.timestamp >= start_datetime)
    if end_date:
        end_datetime = datetime.fromisoformat(end_date)
        query = query.filter(Location.timestamp <= end_datetime)
    
    locations = query.order_by(Location.timestamp.desc()).limit(limit).all()
    
    return jsonify({
        'locations': [loc.to_dict() for loc in locations]
    })

@geolocation_bp.route('/geofences', methods=['GET'])
@jwt_required()
def get_geofences():
    """Get geofences based on user role"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name == 'admin':
        # Admins can see all geofences
        geofences = Geofence.query.filter_by(is_active=True).all()
    elif user.role.name == 'manager':
        # Managers can see all geofences
        geofences = Geofence.query.filter_by(is_active=True).all()
    elif user.role.name == 'caregiver':
        # Caregivers can only see geofences for their assigned clients
        from app.models.client.caregiver_assignment import CaregiverAssignment
        
        # Get current caregiver assignments
        assignments = CaregiverAssignment.query.filter_by(
            caregiver_id=current_user_id,
            is_active=True
        ).all()
        
        # Get client IDs that this caregiver is assigned to
        assigned_client_ids = [assignment.client_id for assignment in assignments if assignment.is_current()]
        
        if not assigned_client_ids:
            # No assignments, return empty list
            return jsonify({'geofences': []})
        
        # Get geofences for assigned clients only
        geofences = Geofence.query.filter(
            Geofence.is_active == True,
            Geofence.client_id.in_(assigned_client_ids)
        ).all()
    else:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'geofences': [gf.to_dict() for gf in geofences]
    })

@geolocation_bp.route('/geofences', methods=['POST'])
@jwt_required()
def create_geofence():
    """Create new geofence"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'client_id', 'center_latitude', 'center_longitude', 'radius_meters']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    geofence = Geofence(
        name=data['name'],
        description=data.get('description'),
        client_id=data['client_id'],
        center_latitude=data['center_latitude'],
        center_longitude=data['center_longitude'],
        radius_meters=data['radius_meters'],
        geofence_type=data.get('geofence_type', 'circle'),
        polygon_coordinates=data.get('polygon_coordinates'),
        created_by=current_user_id
    )
    
    db.session.add(geofence)
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='geofence_created',
        resource_type='geofence',
        resource_id=geofence.id,
        details=data,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Geofence created successfully',
        'geofence': geofence.to_dict()
    }), 201

@geolocation_bp.route('/geofences/<geofence_id>', methods=['GET'])
@jwt_required()
def get_geofence(geofence_id):
    """Get specific geofence"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    geofence = Geofence.query.get(geofence_id)
    if not geofence:
        return jsonify({'error': 'Geofence not found'}), 404
    
    return jsonify({
        'geofence': geofence.to_dict()
    })

@geolocation_bp.route('/geofences/<geofence_id>', methods=['PUT'])
@jwt_required()
def update_geofence(geofence_id):
    """Update geofence"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    geofence = Geofence.query.get(geofence_id)
    if not geofence:
        return jsonify({'error': 'Geofence not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    if 'name' in data:
        geofence.name = data['name']
    if 'description' in data:
        geofence.description = data['description']
    if 'center_latitude' in data:
        geofence.center_latitude = data['center_latitude']
    if 'center_longitude' in data:
        geofence.center_longitude = data['center_longitude']
    if 'radius_meters' in data:
        geofence.radius_meters = data['radius_meters']
    if 'polygon_coordinates' in data:
        geofence.polygon_coordinates = data['polygon_coordinates']
    if 'is_active' in data:
        geofence.is_active = data['is_active']
    
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='geofence_updated',
        resource_type='geofence',
        resource_id=geofence.id,
        details=data,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Geofence updated successfully',
        'geofence': geofence.to_dict()
    })

@geolocation_bp.route('/geofences/<geofence_id>', methods=['DELETE'])
@jwt_required()
def delete_geofence(geofence_id):
    """Delete geofence"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    geofence = Geofence.query.get(geofence_id)
    if not geofence:
        return jsonify({'error': 'Geofence not found'}), 404
    
    geofence.is_active = False
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='geofence_deleted',
        resource_type='geofence',
        resource_id=geofence.id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Geofence deleted successfully'
    })

@geolocation_bp.route('/tracking/active', methods=['GET'])
@jwt_required()
def get_active_tracking():
    """Get all users with active location tracking"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get users with active locations in the last 5 minutes
    five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
    active_locations = Location.query.filter(
        Location.timestamp >= five_minutes_ago,
        Location.is_active == True
    ).all()
    
    # Group by user
    user_locations = {}
    for location in active_locations:
        if location.user_id not in user_locations:
            user_locations[location.user_id] = []
        user_locations[location.user_id].append(location.to_dict())
    
    return jsonify({
        'active_tracking': user_locations
    })

@geolocation_bp.route('/geocode/address', methods=['POST'])
@jwt_required()
def geocode_address():
    """Convert address to coordinates"""
    data = request.get_json()
    
    if not data.get('address'):
        return jsonify({'error': 'Address is required'}), 400
    
    address = data['address']
    timeout = data.get('timeout', 10)
    max_retries = data.get('max_retries', 3)
    
    result = geocoding_service.address_to_coordinates(address, timeout, max_retries)
    
    if result:
        return jsonify({
            'success': True,
            'data': result
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Could not geocode the provided address'
        }), 400

@geolocation_bp.route('/geocode/coordinates', methods=['POST'])
@jwt_required()
def reverse_geocode():
    """Convert coordinates to address"""
    data = request.get_json()
    
    if not data.get('latitude') or not data.get('longitude'):
        return jsonify({'error': 'Latitude and longitude are required'}), 400
    
    latitude = data['latitude']
    longitude = data['longitude']
    timeout = data.get('timeout', 10)
    max_retries = data.get('max_retries', 3)
    
    # Validate coordinates
    if not geocoding_service.validate_coordinates(latitude, longitude):
        return jsonify({'error': 'Invalid coordinates provided'}), 400
    
    result = geocoding_service.coordinates_to_address(latitude, longitude, timeout, max_retries)
    
    if result:
        return jsonify({
            'success': True,
            'data': result
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Could not reverse geocode the provided coordinates'
        }), 400

@geolocation_bp.route('/geocode/distance', methods=['POST'])
@jwt_required()
def calculate_distance():
    """Calculate distance between two points"""
    data = request.get_json()
    
    required_fields = ['lat1', 'lon1', 'lat2', 'lon2']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    lat1 = data['lat1']
    lon1 = data['lon1']
    lat2 = data['lat2']
    lon2 = data['lon2']
    
    # Validate coordinates
    if not geocoding_service.validate_coordinates(lat1, lon1):
        return jsonify({'error': 'Invalid first point coordinates'}), 400
    
    if not geocoding_service.validate_coordinates(lat2, lon2):
        return jsonify({'error': 'Invalid second point coordinates'}), 400
    
    distance = geocoding_service.get_distance_between_points(lat1, lon1, lat2, lon2)
    
    if distance is not None:
        return jsonify({
            'success': True,
            'distance_meters': distance,
            'distance_km': distance / 1000
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Could not calculate distance between the provided points'
        }), 400
