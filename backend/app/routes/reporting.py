from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.reporting.report import Report
from app.models.reporting.audit_log import AuditLog
from app.models.auth.user import User
from datetime import datetime, timedelta
import uuid

reporting_bp = Blueprint('reporting', __name__)

@reporting_bp.route('/reports', methods=['GET'])
@jwt_required()
def get_reports():
    """Get reports for current user"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    reports = Report.query.filter_by(generated_by=current_user_id).order_by(Report.created_at.desc()).all()
    
    return jsonify({
        'reports': [report.to_dict() for report in reports]
    })

@reporting_bp.route('/reports', methods=['POST'])
@jwt_required()
def create_report():
    """Create new report"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('title') or not data.get('report_type'):
        return jsonify({'error': 'Title and report type are required'}), 400
    
    report = Report(
        title=data['title'],
        description=data.get('description'),
        report_type=data['report_type'],
        report_format=data.get('report_format', 'pdf'),
        parameters=data.get('parameters', {}),
        generated_by=current_user_id
    )
    
    db.session.add(report)
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='report_created',
        resource_type='report',
        resource_id=report.id,
        details=data,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Report created successfully',
        'report': report.to_dict()
    }), 201

@reporting_bp.route('/reports/<report_id>', methods=['GET'])
@jwt_required()
def get_report(report_id):
    """Get specific report"""
    current_user_id = get_jwt_identity()
    
    report = Report.query.get(report_id)
    if not report:
        return jsonify({'error': 'Report not found'}), 404
    
    # Check permissions
    user = User.query.get(current_user_id)
    if user.role.name not in ['admin', 'manager'] and report.generated_by != current_user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'report': report.to_dict()
    })

@reporting_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    """Get audit logs"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get query parameters
    user_id = request.args.get('user_id')
    action = request.args.get('action')
    resource_type = request.args.get('resource_type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    limit = int(request.args.get('limit', 100))
    
    query = AuditLog.query
    
    # Apply filters
    if user_id:
        query = query.filter_by(user_id=user_id)
    if action:
        query = query.filter_by(action=action)
    if resource_type:
        query = query.filter_by(resource_type=resource_type)
    if start_date:
        start_datetime = datetime.fromisoformat(start_date)
        query = query.filter(AuditLog.created_at >= start_datetime)
    if end_date:
        end_datetime = datetime.fromisoformat(end_date)
        query = query.filter(AuditLog.created_at <= end_datetime)
    
    audit_logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    
    return jsonify({
        'audit_logs': [log.to_dict() for log in audit_logs]
    })

@reporting_bp.route('/compliance', methods=['GET'])
@jwt_required()
def get_compliance_report():
    """Get compliance report"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name not in ['admin', 'manager']:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    # Get timesheet compliance
    from app.models.timesheet.timesheet import Timesheet
    total_timesheets = Timesheet.query.filter(
        Timesheet.created_at >= start_date,
        Timesheet.created_at <= end_date
    ).count()
    
    approved_timesheets = Timesheet.query.filter(
        Timesheet.created_at >= start_date,
        Timesheet.created_at <= end_date,
        Timesheet.status == 'approved'
    ).count()
    
    # Get task completion compliance
    from app.models.task.task_assignment import TaskAssignment
    total_assignments = TaskAssignment.query.filter(
        TaskAssignment.assigned_at >= start_date,
        TaskAssignment.assigned_at <= end_date
    ).count()
    
    completed_assignments = TaskAssignment.query.filter(
        TaskAssignment.assigned_at >= start_date,
        TaskAssignment.assigned_at <= end_date,
        TaskAssignment.status == 'completed'
    ).count()
    
    compliance_data = {
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        },
        'timesheet_compliance': {
            'total': total_timesheets,
            'approved': approved_timesheets,
            'compliance_rate': (approved_timesheets / total_timesheets * 100) if total_timesheets > 0 else 0
        },
        'task_compliance': {
            'total': total_assignments,
            'completed': completed_assignments,
            'completion_rate': (completed_assignments / total_assignments * 100) if total_assignments > 0 else 0
        }
    }
    
    return jsonify({
        'compliance_report': compliance_data
    })
