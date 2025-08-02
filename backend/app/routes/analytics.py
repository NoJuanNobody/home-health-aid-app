from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.auth.user import User
from app.models.timesheet.timesheet import Timesheet
from app.models.geolocation.location import Location
from app.models.task.task_assignment import TaskAssignment
from app.models.client.client import Client
from datetime import datetime, timedelta
from sqlalchemy import func

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_analytics():
    """Get dashboard analytics"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    # User statistics
    total_users = User.query.filter_by(is_active=True).count()
    total_clients = Client.query.filter_by(is_active=True).count()
    
    # Timesheet statistics
    total_timesheets = Timesheet.query.filter(
        Timesheet.created_at >= start_date,
        Timesheet.created_at <= end_date
    ).count()
    
    approved_timesheets = Timesheet.query.filter(
        Timesheet.created_at >= start_date,
        Timesheet.created_at <= end_date,
        Timesheet.status == 'approved'
    ).count()
    
    total_hours = db.session.query(func.sum(Timesheet.total_hours)).filter(
        Timesheet.created_at >= start_date,
        Timesheet.created_at <= end_date,
        Timesheet.status == 'approved'
    ).scalar() or 0
    
    # Task statistics
    total_tasks = TaskAssignment.query.filter(
        TaskAssignment.assigned_at >= start_date,
        TaskAssignment.assigned_at <= end_date
    ).count()
    
    completed_tasks = TaskAssignment.query.filter(
        TaskAssignment.assigned_at >= start_date,
        TaskAssignment.assigned_at <= end_date,
        TaskAssignment.status == 'completed'
    ).count()
    
    # Location tracking statistics
    active_locations = Location.query.filter(
        Location.timestamp >= end_date - timedelta(minutes=5),
        Location.is_active == True
    ).count()
    
    dashboard_data = {
        'users': {
            'total': total_users,
            'total_clients': total_clients
        },
        'timesheets': {
            'total': total_timesheets,
            'approved': approved_timesheets,
            'approval_rate': (approved_timesheets / total_timesheets * 100) if total_timesheets > 0 else 0,
            'total_hours': total_hours
        },
        'tasks': {
            'total': total_tasks,
            'completed': completed_tasks,
            'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        },
        'tracking': {
            'active_locations': active_locations
        }
    }
    
    return jsonify({
        'dashboard_analytics': dashboard_data
    })

@analytics_bp.route('/timesheet-analytics', methods=['GET'])
@jwt_required()
def get_timesheet_analytics():
    """Get timesheet analytics"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    # Daily timesheet counts
    daily_timesheets = db.session.query(
        func.date(Timesheet.date).label('date'),
        func.count(Timesheet.id).label('count')
    ).filter(
        Timesheet.created_at >= start_date,
        Timesheet.created_at <= end_date
    ).group_by(func.date(Timesheet.date)).all()
    
    # Hours by user
    hours_by_user = db.session.query(
        User.first_name,
        User.last_name,
        func.sum(Timesheet.total_hours).label('total_hours')
    ).join(Timesheet, User.id == Timesheet.user_id).filter(
        Timesheet.created_at >= start_date,
        Timesheet.created_at <= end_date,
        Timesheet.status == 'approved'
    ).group_by(User.id, User.first_name, User.last_name).all()
    
    # Overtime analysis
    overtime_data = db.session.query(
        func.sum(Timesheet.overtime_hours).label('total_overtime'),
        func.count(Timesheet.id).label('overtime_entries')
    ).filter(
        Timesheet.created_at >= start_date,
        Timesheet.created_at <= end_date,
        Timesheet.overtime_hours > 0
    ).first()
    
    analytics_data = {
        'daily_timesheets': [
            {'date': str(day.date), 'count': day.count} 
            for day in daily_timesheets
        ],
        'hours_by_user': [
            {
                'user': f"{user.first_name} {user.last_name}",
                'total_hours': float(user.total_hours) if user.total_hours else 0
            }
            for user in hours_by_user
        ],
        'overtime': {
            'total_overtime_hours': float(overtime_data.total_overtime) if overtime_data.total_overtime else 0,
            'overtime_entries': overtime_data.overtime_entries if overtime_data.overtime_entries else 0
        }
    }
    
    return jsonify({
        'timesheet_analytics': analytics_data
    })

@analytics_bp.route('/location-analytics', methods=['GET'])
@jwt_required()
def get_location_analytics():
    """Get location analytics"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=7)
    
    # Location activity by hour
    hourly_activity = db.session.query(
        func.extract('hour', Location.timestamp).label('hour'),
        func.count(Location.id).label('count')
    ).filter(
        Location.timestamp >= start_date,
        Location.timestamp <= end_date
    ).group_by(func.extract('hour', Location.timestamp)).all()
    
    # Active users
    active_users = db.session.query(
        User.first_name,
        User.last_name,
        func.count(Location.id).label('location_updates')
    ).join(Location, User.id == Location.user_id).filter(
        Location.timestamp >= end_date - timedelta(hours=24)
    ).group_by(User.id, User.first_name, User.last_name).all()
    
    # Geofence activity
    from app.models.geolocation.geofence import Geofence
    total_geofences = Geofence.query.filter_by(is_active=True).count()
    
    analytics_data = {
        'hourly_activity': [
            {'hour': int(hour.hour), 'count': hour.count}
            for hour in hourly_activity
        ],
        'active_users': [
            {
                'user': f"{user.first_name} {user.last_name}",
                'location_updates': user.location_updates
            }
            for user in active_users
        ],
        'geofences': {
            'total_active': total_geofences
        }
    }
    
    return jsonify({
        'location_analytics': analytics_data
    })

@analytics_bp.route('/task-analytics', methods=['GET'])
@jwt_required()
def get_task_analytics():
    """Get task analytics"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    # Task completion by type
    from app.models.task.task import Task
    task_completion_by_type = db.session.query(
        Task.task_type,
        func.count(Task.id).label('total'),
        func.sum(func.case([(Task.status == 'completed', 1)], else_=0)).label('completed')
    ).filter(
        Task.created_at >= start_date,
        Task.created_at <= end_date
    ).group_by(Task.task_type).all()
    
    # Task completion by priority
    task_completion_by_priority = db.session.query(
        Task.priority,
        func.count(Task.id).label('total'),
        func.sum(func.case([(Task.status == 'completed', 1)], else_=0)).label('completed')
    ).filter(
        Task.created_at >= start_date,
        Task.created_at <= end_date
    ).group_by(Task.priority).all()
    
    # Average completion time
    completion_times = db.session.query(
        func.avg(func.extract('epoch', TaskAssignment.completed_at - TaskAssignment.assigned_at) / 3600)
    ).filter(
        TaskAssignment.status == 'completed',
        TaskAssignment.completed_at >= start_date,
        TaskAssignment.completed_at <= end_date
    ).scalar()
    
    analytics_data = {
        'completion_by_type': [
            {
                'task_type': task.task_type or 'Unknown',
                'total': task.total,
                'completed': task.completed,
                'completion_rate': (task.completed / task.total * 100) if task.total > 0 else 0
            }
            for task in task_completion_by_type
        ],
        'completion_by_priority': [
            {
                'priority': task.priority,
                'total': task.total,
                'completed': task.completed,
                'completion_rate': (task.completed / task.total * 100) if task.total > 0 else 0
            }
            for task in task_completion_by_priority
        ],
        'average_completion_time_hours': float(completion_times) if completion_times else 0
    }
    
    return jsonify({
        'task_analytics': analytics_data
    })
