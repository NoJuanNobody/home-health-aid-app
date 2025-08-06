from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.auth.user import User
from app.models.auth.role import Role
from app.models.client.caregiver_assignment import CaregiverAssignment
from app.models.reporting.audit_log import AuditLog
from datetime import datetime
import uuid

caregiver_bp = Blueprint('caregiver', __name__)

@caregiver_bp.route('/', methods=['GET'])
@jwt_required()
def get_caregivers():
    """Get all caregivers (users with caregiver role)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get caregiver role
    caregiver_role = Role.query.filter_by(name='caregiver').first()
    if not caregiver_role:
        return jsonify({'error': 'Caregiver role not found'}), 404
    
    # Get all users with caregiver role
    caregivers = User.query.filter_by(role_id=caregiver_role.id).all()
    
    return jsonify({
        'caregivers': [caregiver.to_dict() for caregiver in caregivers]
    })

@caregiver_bp.route('/', methods=['POST'])
@jwt_required()
def create_caregiver():
    """Create new caregiver"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['first_name', 'last_name', 'email', 'phone']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field.replace("_", " ").title()} is required'}), 400
    
    # Check if email already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'Email already exists'}), 400
    
    # Get caregiver role
    caregiver_role = Role.query.filter_by(name='caregiver').first()
    if not caregiver_role:
        return jsonify({'error': 'Caregiver role not found'}), 404
    
    try:
        # Create new caregiver user
        caregiver = User(
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            phone=data['phone'],
            username=data['email'],  # Use email as username
            role_id=caregiver_role.id,
            is_active=True
        )
        
        # Set password (default password or from request)
        default_password = data.get('password', 'caregiver123')
        caregiver.set_password(default_password)
        
        db.session.add(caregiver)
        db.session.commit()
        
        # Log audit
        audit_log = AuditLog(
            user_id=current_user_id,
            action='caregiver_created',
            resource_type='user',
            resource_id=caregiver.id,
            details={
                'caregiver_email': caregiver.email,
                'caregiver_name': f"{caregiver.first_name} {caregiver.last_name}",
                'created_by': user.email
            },
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Caregiver created successfully',
            'caregiver': caregiver.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating caregiver: {str(e)}")
        return jsonify({'error': 'Failed to create caregiver'}), 500

@caregiver_bp.route('/<caregiver_id>', methods=['GET'])
@jwt_required()
def get_caregiver(caregiver_id):
    """Get specific caregiver details"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    caregiver = User.query.get(caregiver_id)
    if not caregiver:
        return jsonify({'error': 'Caregiver not found'}), 404
    
    # Check if user is actually a caregiver
    if caregiver.role.name != 'caregiver':
        return jsonify({'error': 'User is not a caregiver'}), 400
    
    # Get caregiver assignments
    assignments = CaregiverAssignment.query.filter_by(caregiver_id=caregiver_id).all()
    
    caregiver_data = caregiver.to_dict()
    caregiver_data['assignments'] = [assignment.to_dict() for assignment in assignments]
    
    return jsonify({
        'caregiver': caregiver_data
    })

@caregiver_bp.route('/<caregiver_id>', methods=['PUT'])
@jwt_required()
def update_caregiver(caregiver_id):
    """Update caregiver details"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    caregiver = User.query.get(caregiver_id)
    if not caregiver:
        return jsonify({'error': 'Caregiver not found'}), 404
    
    # Check if user is actually a caregiver
    if caregiver.role.name != 'caregiver':
        return jsonify({'error': 'User is not a caregiver'}), 400
    
    data = request.get_json()
    
    try:
        # Update fields
        if 'first_name' in data:
            caregiver.first_name = data['first_name']
        if 'last_name' in data:
            caregiver.last_name = data['last_name']
        if 'phone' in data:
            caregiver.phone = data['phone']
        if 'is_active' in data:
            caregiver.is_active = data['is_active']
        
        # Update password if provided
        if 'password' in data and data['password']:
            caregiver.set_password(data['password'])
        
        caregiver.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log audit
        audit_log = AuditLog(
            user_id=current_user_id,
            action='caregiver_updated',
            resource_type='user',
            resource_id=caregiver.id,
            details={
                'caregiver_email': caregiver.email,
                'caregiver_name': f"{caregiver.first_name} {caregiver.last_name}",
                'updated_by': user.email,
                'updated_fields': list(data.keys())
            },
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Caregiver updated successfully',
            'caregiver': caregiver.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating caregiver: {str(e)}")
        return jsonify({'error': 'Failed to update caregiver'}), 500

@caregiver_bp.route('/<caregiver_id>', methods=['DELETE'])
@jwt_required()
def delete_caregiver(caregiver_id):
    """Soft delete caregiver"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    caregiver = User.query.get(caregiver_id)
    if not caregiver:
        return jsonify({'error': 'Caregiver not found'}), 404
    
    # Check if user is actually a caregiver
    if caregiver.role.name != 'caregiver':
        return jsonify({'error': 'User is not a caregiver'}), 400
    
    try:
        # Soft delete - set is_active to False
        caregiver.is_active = False
        caregiver.updated_at = datetime.utcnow()
        
        # Also deactivate all assignments
        assignments = CaregiverAssignment.query.filter_by(caregiver_id=caregiver_id).all()
        for assignment in assignments:
            assignment.is_active = False
            assignment.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log audit
        audit_log = AuditLog(
            user_id=current_user_id,
            action='caregiver_deleted',
            resource_type='user',
            resource_id=caregiver.id,
            details={
                'caregiver_email': caregiver.email,
                'caregiver_name': f"{caregiver.first_name} {caregiver.last_name}",
                'deleted_by': user.email,
                'deactivated_assignments': len(assignments)
            },
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Caregiver deactivated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting caregiver: {str(e)}")
        return jsonify({'error': 'Failed to delete caregiver'}), 500

@caregiver_bp.route('/<caregiver_id>/assignments', methods=['GET'])
@jwt_required()
def get_caregiver_assignments(caregiver_id):
    """Get all assignments for a specific caregiver"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    caregiver = User.query.get(caregiver_id)
    if not caregiver:
        return jsonify({'error': 'Caregiver not found'}), 404
    
    # Check if user is actually a caregiver
    if caregiver.role.name != 'caregiver':
        return jsonify({'error': 'User is not a caregiver'}), 400
    
    assignments = CaregiverAssignment.query.filter_by(caregiver_id=caregiver_id).all()
    
    return jsonify({
        'assignments': [assignment.to_dict() for assignment in assignments]
    }) 