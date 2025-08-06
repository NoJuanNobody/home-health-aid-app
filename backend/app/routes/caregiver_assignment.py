from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.client.caregiver_assignment import CaregiverAssignment
from app.models.auth.user import User
from app.models.client.client import Client
from app.models.reporting.audit_log import AuditLog
from datetime import datetime
import uuid

caregiver_assignment_bp = Blueprint('caregiver_assignment', __name__)

@caregiver_assignment_bp.route('/', methods=['GET'])
@jwt_required()
def get_caregiver_assignments():
    """Get caregiver assignments"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Get query parameters
    caregiver_id = request.args.get('caregiver_id')
    client_id = request.args.get('client_id')
    is_active = request.args.get('is_active', 'true').lower() == 'true'
    
    query = CaregiverAssignment.query
    
    # Filter by user role
    if user.role.name in ['admin', 'manager']:
        if caregiver_id:
            query = query.filter_by(caregiver_id=caregiver_id)
        if client_id:
            query = query.filter_by(client_id=client_id)
    elif user.role.name == 'caregiver':
        # Caregivers can only see their own assignments
        query = query.filter_by(caregiver_id=current_user_id)
        if client_id:
            query = query.filter_by(client_id=client_id)
    else:
        return jsonify({'error': 'Access denied'}), 403
    
    if is_active:
        query = query.filter_by(is_active=True)
    
    assignments = query.order_by(CaregiverAssignment.created_at.desc()).all()
    
    return jsonify({
        'assignments': [assignment.to_dict() for assignment in assignments]
    })

@caregiver_assignment_bp.route('/', methods=['POST'])
@jwt_required()
def create_caregiver_assignment():
    """Create new caregiver assignment"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['caregiver_id', 'client_id', 'start_date']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate that caregiver exists and has caregiver role
    caregiver = User.query.get(data['caregiver_id'])
    if not caregiver:
        return jsonify({'error': 'Caregiver not found'}), 404
    
    if caregiver.role.name != 'caregiver':
        return jsonify({'error': 'User must have caregiver role'}), 400
    
    # Validate that client exists
    client = Client.query.get(data['client_id'])
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    # Check for existing active assignment
    existing_assignment = CaregiverAssignment.query.filter_by(
        caregiver_id=data['caregiver_id'],
        client_id=data['client_id'],
        is_active=True
    ).first()
    
    if existing_assignment:
        return jsonify({'error': 'Active assignment already exists for this caregiver and client'}), 400
    
    assignment = CaregiverAssignment(
        caregiver_id=data['caregiver_id'],
        client_id=data['client_id'],
        assignment_type=data.get('assignment_type', 'primary'),
        start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
        end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None,
        notes=data.get('notes'),
        assigned_by=current_user_id
    )
    
    db.session.add(assignment)
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='caregiver_assignment_created',
        resource_type='caregiver_assignment',
        resource_id=assignment.id,
        details=data,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Caregiver assignment created successfully',
        'assignment': assignment.to_dict()
    }), 201

@caregiver_assignment_bp.route('/<assignment_id>', methods=['PUT'])
@jwt_required()
def update_caregiver_assignment(assignment_id):
    """Update caregiver assignment"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    assignment = CaregiverAssignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    if 'assignment_type' in data:
        assignment.assignment_type = data['assignment_type']
    if 'start_date' in data:
        assignment.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
    if 'end_date' in data:
        assignment.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data['end_date'] else None
    if 'is_active' in data:
        assignment.is_active = data['is_active']
    if 'notes' in data:
        assignment.notes = data['notes']
    
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='caregiver_assignment_updated',
        resource_type='caregiver_assignment',
        resource_id=assignment.id,
        details=data,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Caregiver assignment updated successfully',
        'assignment': assignment.to_dict()
    })

@caregiver_assignment_bp.route('/<assignment_id>', methods=['DELETE'])
@jwt_required()
def delete_caregiver_assignment(assignment_id):
    """Delete caregiver assignment"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    assignment = CaregiverAssignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
    
    assignment.is_active = False
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='caregiver_assignment_deleted',
        resource_type='caregiver_assignment',
        resource_id=assignment.id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Caregiver assignment deleted successfully'
    })

@caregiver_assignment_bp.route('/my-assignments', methods=['GET'])
@jwt_required()
def get_my_assignments():
    """Get current user's caregiver assignments"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name != 'caregiver':
        return jsonify({'error': 'Access denied'}), 403
    
    assignments = CaregiverAssignment.query.filter_by(
        caregiver_id=current_user_id,
        is_active=True
    ).all()
    
    # Filter to only current assignments
    current_assignments = [assignment for assignment in assignments if assignment.is_current()]
    
    return jsonify({
        'assignments': [assignment.to_dict() for assignment in current_assignments]
    }) 