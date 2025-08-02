from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, socketio
from app.models.communication.conversation import Conversation
from app.models.communication.conversation_participant import ConversationParticipant
from app.models.communication.message import Message
from app.models.auth.user import User
from app.models.reporting.audit_log import AuditLog
from datetime import datetime
import uuid

communication_bp = Blueprint('communication', __name__)

@communication_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """Get conversations for current user"""
    current_user_id = get_jwt_identity()
    
    # Get conversations where user is a participant
    participant_conversations = ConversationParticipant.query.filter_by(
        user_id=current_user_id,
        is_active=True
    ).all()
    
    conversations = []
    for participant in participant_conversations:
        conversation = participant.conversation
        if conversation and conversation.is_active:
            conversations.append(conversation.to_dict())
    
    return jsonify({
        'conversations': conversations
    })

@communication_bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    """Create new conversation"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not data.get('name') or not data.get('participant_ids'):
        return jsonify({'error': 'Name and participant IDs are required'}), 400
    
    # Create conversation
    conversation = Conversation(
        name=data['name'],
        conversation_type=data.get('conversation_type', 'direct'),
        created_by=current_user_id
    )
    
    db.session.add(conversation)
    db.session.flush()  # Get the ID
    
    # Add participants
    participant_ids = data['participant_ids']
    if current_user_id not in participant_ids:
        participant_ids.append(current_user_id)
    
    for user_id in participant_ids:
        conversation.add_participant(user_id)
    
    db.session.commit()
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='conversation_created',
        resource_type='conversation',
        resource_id=conversation.id,
        details=data,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Conversation created successfully',
        'conversation': conversation.to_dict()
    }), 201

@communication_bp.route('/conversations/<conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation(conversation_id):
    """Get specific conversation"""
    current_user_id = get_jwt_identity()
    
    # Check if user is participant
    participant = ConversationParticipant.query.filter_by(
        conversation_id=conversation_id,
        user_id=current_user_id,
        is_active=True
    ).first()
    
    if not participant:
        return jsonify({'error': 'Access denied'}), 403
    
    conversation = participant.conversation
    if not conversation or not conversation.is_active:
        return jsonify({'error': 'Conversation not found'}), 404
    
    return jsonify({
        'conversation': conversation.to_dict()
    })

@communication_bp.route('/conversations/<conversation_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(conversation_id):
    """Get messages for conversation"""
    current_user_id = get_jwt_identity()
    
    # Check if user is participant
    participant = ConversationParticipant.query.filter_by(
        conversation_id=conversation_id,
        user_id=current_user_id,
        is_active=True
    ).first()
    
    if not participant:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get query parameters
    limit = int(request.args.get('limit', 50))
    before_id = request.args.get('before_id')
    
    query = Message.query.filter_by(conversation_id=conversation_id)
    
    if before_id:
        before_message = Message.query.get(before_id)
        if before_message:
            query = query.filter(Message.created_at < before_message.created_at)
    
    messages = query.order_by(Message.created_at.desc()).limit(limit).all()
    messages.reverse()  # Show oldest first
    
    return jsonify({
        'messages': [msg.to_dict() for msg in messages]
    })

@communication_bp.route('/conversations/<conversation_id>/messages', methods=['POST'])
@jwt_required()
def send_message(conversation_id):
    """Send message to conversation"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Check if user is participant
    participant = ConversationParticipant.query.filter_by(
        conversation_id=conversation_id,
        user_id=current_user_id,
        is_active=True
    ).first()
    
    if not participant:
        return jsonify({'error': 'Access denied'}), 403
    
    # Validate required fields
    if not data.get('content'):
        return jsonify({'error': 'Message content is required'}), 400
    
    # Create message
    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user_id,
        message_type=data.get('message_type', 'text'),
        content=data['content'],
        file_url=data.get('file_url'),
        file_name=data.get('file_name'),
        file_size=data.get('file_size'),
        is_urgent=data.get('is_urgent', False)
    )
    
    db.session.add(message)
    db.session.commit()
    
    # Emit to socket
    socketio.emit('new_message', {
        'message': message.to_dict(),
        'conversation_id': conversation_id
    }, room=conversation_id)
    
    # Log audit
    audit_log = AuditLog(
        user_id=current_user_id,
        action='message_sent',
        resource_type='message',
        resource_id=message.id,
        details={
            'conversation_id': conversation_id,
            'message_type': message.message_type,
            'is_urgent': message.is_urgent
        },
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Message sent successfully',
        'message_data': message.to_dict()
    }), 201

@communication_bp.route('/messages/<message_id>/read', methods=['POST'])
@jwt_required()
def mark_message_read(message_id):
    """Mark message as read"""
    current_user_id = get_jwt_identity()
    
    message = Message.query.get(message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    # Check if user is participant in conversation
    participant = ConversationParticipant.query.filter_by(
        conversation_id=message.conversation_id,
        user_id=current_user_id,
        is_active=True
    ).first()
    
    if not participant:
        return jsonify({'error': 'Access denied'}), 403
    
    message.mark_as_read()
    db.session.commit()
    
    return jsonify({
        'message': 'Message marked as read'
    })

@communication_bp.route('/conversations/<conversation_id>/participants', methods=['POST'])
@jwt_required()
def add_participant(conversation_id):
    """Add participant to conversation"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('user_id'):
        return jsonify({'error': 'User ID is required'}), 400
    
    # Check if current user is participant
    participant = ConversationParticipant.query.filter_by(
        conversation_id=conversation_id,
        user_id=current_user_id,
        is_active=True
    ).first()
    
    if not participant:
        return jsonify({'error': 'Access denied'}), 403
    
    # Add new participant
    conversation = participant.conversation
    new_participant = conversation.add_participant(data['user_id'])
    db.session.commit()
    
    return jsonify({
        'message': 'Participant added successfully',
        'participant': new_participant.to_dict()
    })

@communication_bp.route('/conversations/<conversation_id>/participants/<user_id>', methods=['DELETE'])
@jwt_required()
def remove_participant(conversation_id, user_id):
    """Remove participant from conversation"""
    current_user_id = get_jwt_identity()
    
    # Check if current user is participant
    participant = ConversationParticipant.query.filter_by(
        conversation_id=conversation_id,
        user_id=current_user_id,
        is_active=True
    ).first()
    
    if not participant:
        return jsonify({'error': 'Access denied'}), 403
    
    # Remove participant
    conversation = participant.conversation
    conversation.remove_participant(user_id)
    db.session.commit()
    
    return jsonify({
        'message': 'Participant removed successfully'
    })

@communication_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users for messaging"""
    current_user_id = get_jwt_identity()
    
    users = User.query.filter_by(is_active=True).all()
    
    return jsonify({
        'users': [user.to_dict() for user in users if user.id != current_user_id]
    })
