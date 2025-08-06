from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.timesheet.timesheet import Timesheet
from app.models.timesheet.break_time import BreakTime
from app.models.auth.user import User
from app.models.reporting.audit_log import AuditLog
from app.models.geolocation.geofence import Geofence
from app.models.client.client import Client
from datetime import datetime, date
import uuid

timesheet_bp = Blueprint('timesheet', __name__)

@timesheet_bp.route('/', methods=['GET'])
@jwt_required()
def get_timesheets():
    """Get timesheets for current user or all timesheets for managers"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    status = request.args.get('status')
    user_id = request.args.get('user_id')
    
    query = Timesheet.query
    
    # Filter by user role
    if user.role.name in ['admin', 'manager']:
        if user_id:
            query = query.filter_by(user_id=user_id)
    else:
        query = query.filter_by(user_id=current_user_id)
    
    # Apply filters
    if start_date:
        query = query.filter(Timesheet.date >= date.fromisoformat(start_date))
    if end_date:
        query = query.filter(Timesheet.date <= date.fromisoformat(end_date))
    if status:
        query = query.filter_by(status=status)
    
    timesheets = query.order_by(Timesheet.date.desc()).all()
    
    return jsonify({
        'timesheets': [ts.to_dict() for ts in timesheets]
    })

@timesheet_bp.route('/<timesheet_id>', methods=['GET'])
@jwt_required()
def get_timesheet(timesheet_id):
    """Get specific timesheet"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    timesheet = Timesheet.query.get(timesheet_id)
    if not timesheet:
        return jsonify({'error': 'Timesheet not found'}), 404
    
    # Check permissions
    if user.role.name not in ['admin', 'manager'] and timesheet.user_id != current_user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'timesheet': timesheet.to_dict()
    })

@timesheet_bp.route('/', methods=['POST'])
@jwt_required()
def create_timesheet():
    """Create new timesheet"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not data.get('client_id') or not data.get('date'):
        return jsonify({'error': 'Client ID and date are required'}), 400
    
    # Check if user is already clocked in for this client (has an active timesheet)
    active_timesheet = Timesheet.query.filter_by(
        user_id=current_user_id,
        client_id=data['client_id'],
        status='active'
    ).first()
    
    if active_timesheet:
        return jsonify({'error': 'You are already clocked in for this client. Please clock out first.'}), 400
    
    timesheet = Timesheet(
        user_id=current_user_id,
        client_id=data['client_id'],
        date=date.fromisoformat(data['date']),
        notes=data.get('notes')
    )
    
    db.session.add(timesheet)
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='timesheet_created',
        resource_type='timesheet',
        resource_id=timesheet.id,
        details=data,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Timesheet created successfully',
        'timesheet': timesheet.to_dict()
    }), 201

@timesheet_bp.route('/<timesheet_id>/clock-in', methods=['POST'])
@jwt_required()
def clock_in(timesheet_id):
    """Clock in for timesheet"""
    current_user_id = get_jwt_identity()
    
    timesheet = Timesheet.query.get(timesheet_id)
    if not timesheet:
        return jsonify({'error': 'Timesheet not found'}), 404
    
    if timesheet.user_id != current_user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    if timesheet.clock_in_time:
        return jsonify({'error': 'Already clocked in'}), 400
    
    data = request.get_json()
    location = data.get('location') if data else None
    
    # Validate geofence if location is provided
    if location and location.get('latitude') and location.get('longitude'):
        # Get client for this timesheet
        client = Client.query.get(timesheet.client_id)
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        # Check if user is inside any geofence for this client
        client_geofences = Geofence.query.filter_by(
            client_id=timesheet.client_id,
            is_active=True
        ).all()
        
        if not client_geofences:
            return jsonify({'error': 'No geofences found for this client'}), 400
        
        # Check if user is inside any of the client's geofences
        user_lat = location['latitude']
        user_lng = location['longitude']
        inside_geofence = False
        
        for geofence in client_geofences:
            # Calculate distance between user and geofence center
            from geopy.distance import geodesic
            user_coords = (user_lat, user_lng)
            geofence_coords = (geofence.center_latitude, geofence.center_longitude)
            distance = geodesic(user_coords, geofence_coords).meters
            
            if distance <= geofence.radius_meters:
                inside_geofence = True
                break
        
        if not inside_geofence:
            return jsonify({
                'error': 'You must be inside a client geofence to clock in',
                'distance_to_nearest': min([
                    geodesic((user_lat, user_lng), (g.center_latitude, g.center_longitude)).meters 
                    for g in client_geofences
                ])
            }), 400
    
    timesheet.clock_in(location)
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='clock_in',
        resource_type='timesheet',
        resource_id=timesheet.id,
        details={'location': location},
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Clocked in successfully',
        'timesheet': timesheet.to_dict()
    })

@timesheet_bp.route('/<timesheet_id>/clock-out', methods=['POST'])
@jwt_required()
def clock_out(timesheet_id):
    """Clock out for timesheet"""
    current_user_id = get_jwt_identity()
    
    timesheet = Timesheet.query.get(timesheet_id)
    if not timesheet:
        return jsonify({'error': 'Timesheet not found'}), 404
    
    if timesheet.user_id != current_user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    if not timesheet.clock_in_time:
        return jsonify({'error': 'Not clocked in'}), 400
    
    if timesheet.clock_out_time:
        return jsonify({'error': 'Already clocked out'}), 400
    
    data = request.get_json()
    location = data.get('location') if data else None
    
    timesheet.clock_out(location)
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='clock_out',
        resource_type='timesheet',
        resource_id=timesheet.id,
        details={'location': location},
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Clocked out successfully',
        'timesheet': timesheet.to_dict()
    })

@timesheet_bp.route('/<timesheet_id>/breaks', methods=['POST'])
@jwt_required()
def start_break(timesheet_id):
    """Start a break"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    timesheet = Timesheet.query.get(timesheet_id)
    if not timesheet:
        return jsonify({'error': 'Timesheet not found'}), 404
    
    if timesheet.user_id != current_user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    break_time = BreakTime(
        timesheet_id=timesheet_id,
        break_type=data.get('break_type', 'break'),
        notes=data.get('notes')
    )
    
    break_time.start_break()
    db.session.add(break_time)
    db.session.commit()
    
    return jsonify({
        'message': 'Break started successfully',
        'break_time': break_time.to_dict()
    })

@timesheet_bp.route('/<timesheet_id>/breaks/<break_id>/end', methods=['POST'])
@jwt_required()
def end_break(timesheet_id, break_id):
    """End a break"""
    current_user_id = get_jwt_identity()
    
    break_time = BreakTime.query.get(break_id)
    if not break_time or break_time.timesheet_id != timesheet_id:
        return jsonify({'error': 'Break not found'}), 404
    
    timesheet = Timesheet.query.get(timesheet_id)
    if timesheet.user_id != current_user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    break_time.end_break()
    db.session.commit()
    
    return jsonify({
        'message': 'Break ended successfully',
        'break_time': break_time.to_dict()
    })

@timesheet_bp.route('/<timesheet_id>/approve', methods=['POST'])
@jwt_required()
def approve_timesheet(timesheet_id):
    """Approve timesheet (managers only)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    timesheet = Timesheet.query.get(timesheet_id)
    if not timesheet:
        return jsonify({'error': 'Timesheet not found'}), 404
    
    data = request.get_json()
    timesheet.approve(current_user_id)
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='timesheet_approved',
        resource_type='timesheet',
        resource_id=timesheet.id,
        details=data,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Timesheet approved successfully',
        'timesheet': timesheet.to_dict()
    })

@timesheet_bp.route('/<timesheet_id>/reject', methods=['POST'])
@jwt_required()
def reject_timesheet(timesheet_id):
    """Reject timesheet (managers only)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    timesheet = Timesheet.query.get(timesheet_id)
    if not timesheet:
        return jsonify({'error': 'Timesheet not found'}), 404
    
    data = request.get_json()
    reason = data.get('reason')
    timesheet.reject(current_user_id, reason)
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='timesheet_rejected',
        resource_type='timesheet',
        resource_id=timesheet.id,
        details={'reason': reason},
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Timesheet rejected successfully',
        'timesheet': timesheet.to_dict()
    })
