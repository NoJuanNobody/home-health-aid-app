from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.task.task import Task
from app.models.task.task_assignment import TaskAssignment
from app.models.auth.user import User
from app.models.reporting.audit_log import AuditLog
from datetime import datetime
import uuid

task_bp = Blueprint('task', __name__)

@task_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    """Get tasks for current user or all tasks for managers"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Get query parameters
    status = request.args.get('status')
    priority = request.args.get('priority')
    client_id = request.args.get('client_id')
    
    query = Task.query
    
    # Filter by user role
    if user.role.name in ['admin', 'manager']:
        if client_id:
            query = query.filter_by(client_id=client_id)
    else:
        # For health aids, get assigned tasks
        assigned_tasks = TaskAssignment.query.filter_by(assigned_user_id=current_user_id).all()
        task_ids = [assignment.task_id for assignment in assigned_tasks]
        query = query.filter(Task.id.in_(task_ids))
    
    # Apply filters
    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)
    
    tasks = query.order_by(Task.scheduled_date.desc()).all()
    
    return jsonify({
        'tasks': [task.to_dict() for task in tasks]
    })

@task_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    """Create new task"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('title') or not data.get('client_id'):
        return jsonify({'error': 'Title and client ID are required'}), 400
    
    task = Task(
        title=data['title'],
        description=data.get('description'),
        task_type=data.get('task_type'),
        priority=data.get('priority', 'medium'),
        estimated_duration=data.get('estimated_duration'),
        care_plan_id=data.get('care_plan_id'),
        client_id=data['client_id'],
        scheduled_date=datetime.strptime(data['scheduled_date'], '%Y-%m-%d').date() if data.get('scheduled_date') else None,
        scheduled_time=datetime.strptime(data['scheduled_time'], '%H:%M').time() if data.get('scheduled_time') else None,
        is_recurring=data.get('is_recurring', False),
        recurrence_pattern=data.get('recurrence_pattern'),
        created_by=current_user_id
    )
    
    db.session.add(task)
    db.session.commit()
    
    # Assign to user if specified
    if data.get('assigned_user_id'):
        task.assign_to_user(data['assigned_user_id'], current_user_id)
        db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='task_created',
        resource_type='task',
        resource_id=task.id,
        details=data,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Task created successfully',
        'task': task.to_dict()
    }), 201

@task_bp.route('/<task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    """Get specific task"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    # Check permissions
    if user.role.name not in ['admin', 'manager']:
        assignment = TaskAssignment.query.filter_by(
            task_id=task_id,
            assigned_user_id=current_user_id
        ).first()
        if not assignment:
            return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'task': task.to_dict()
    })

@task_bp.route('/<task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    """Update task"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'task_type' in data:
        task.task_type = data['task_type']
    if 'priority' in data:
        task.priority = data['priority']
    if 'estimated_duration' in data:
        task.estimated_duration = data['estimated_duration']
    if 'scheduled_date' in data:
        task.scheduled_date = datetime.strptime(data['scheduled_date'], '%Y-%m-%d').date()
    if 'scheduled_time' in data:
        task.scheduled_time = datetime.strptime(data['scheduled_time'], '%H:%M').time()
    if 'is_recurring' in data:
        task.is_recurring = data['is_recurring']
    if 'recurrence_pattern' in data:
        task.recurrence_pattern = data['recurrence_pattern']
    if 'status' in data:
        task.status = data['status']
    
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='task_updated',
        resource_type='task',
        resource_id=task.id,
        details=data,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Task updated successfully',
        'task': task.to_dict()
    })

@task_bp.route('/<task_id>/assign', methods=['POST'])
@jwt_required()
def assign_task(task_id):
    """Assign task to user"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    if not data.get('assigned_user_id'):
        return jsonify({'error': 'Assigned user ID is required'}), 400
    
    assignment = task.assign_to_user(data['assigned_user_id'], current_user_id)
    db.session.commit()
    
    return jsonify({
        'message': 'Task assigned successfully',
        'assignment': assignment.to_dict()
    })

@task_bp.route('/<task_id>/start', methods=['POST'])
@jwt_required()
def start_task(task_id):
    """Start task"""
    current_user_id = get_jwt_identity()
    
    assignment = TaskAssignment.query.filter_by(
        task_id=task_id,
        assigned_user_id=current_user_id
    ).first()
    
    if not assignment:
        return jsonify({'error': 'Task assignment not found'}), 404
    
    assignment.start_task()
    db.session.commit()
    
    return jsonify({
        'message': 'Task started successfully',
        'assignment': assignment.to_dict()
    })

@task_bp.route('/<task_id>/complete', methods=['POST'])
@jwt_required()
def complete_task(task_id):
    """Complete task"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    assignment = TaskAssignment.query.filter_by(
        task_id=task_id,
        assigned_user_id=current_user_id
    ).first()
    
    if not assignment:
        return jsonify({'error': 'Task assignment not found'}), 404
    
    assignment.complete_task(data.get('notes'))
    db.session.commit()
    
    return jsonify({
        'message': 'Task completed successfully',
        'assignment': assignment.to_dict()
    })

@task_bp.route('/<task_id>/decline', methods=['POST'])
@jwt_required()
def decline_task(task_id):
    """Decline task assignment"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    assignment = TaskAssignment.query.filter_by(
        task_id=task_id,
        assigned_user_id=current_user_id
    ).first()
    
    if not assignment:
        return jsonify({'error': 'Task assignment not found'}), 404
    
    assignment.decline_task(data.get('reason'))
    db.session.commit()
    
    return jsonify({
        'message': 'Task declined successfully',
        'assignment': assignment.to_dict()
    })
