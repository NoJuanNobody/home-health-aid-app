# Caregiver Management System

## Overview

The Caregiver Management System provides comprehensive functionality to create, edit, and manage caregivers, as well as assign them to multiple clients. This system enables administrators and managers to efficiently manage caregiver-client relationships.

## Features

### 1. **Caregiver Management**
- ✅ Create new caregivers with full profile information
- ✅ Edit existing caregiver details
- ✅ Soft delete caregivers (deactivate)
- ✅ View all caregivers with status indicators
- ✅ Password management for caregivers

### 2. **Client-Caregiver Assignment**
- ✅ Assign multiple caregivers to a single client
- ✅ Support for different assignment types (primary, backup)
- ✅ Remove assignments when needed
- ✅ View all assignments for a specific client
- ✅ Assignment history and notes

### 3. **Role-Based Access Control**
- ✅ Only admins and managers can manage caregivers
- ✅ Caregivers can view their own assignments
- ✅ Proper authentication and authorization

## Backend Implementation

### New Routes

#### Caregiver Management (`/api/caregiver`)
- `GET /` - Get all caregivers
- `POST /` - Create new caregiver
- `GET /<caregiver_id>` - Get specific caregiver details
- `PUT /<caregiver_id>` - Update caregiver
- `DELETE /<caregiver_id>` - Soft delete caregiver
- `GET /<caregiver_id>/assignments` - Get caregiver's assignments

#### Caregiver Assignment (`/api/caregiver-assignment`)
- `GET /` - Get all assignments (admin/manager only)
- `POST /` - Create new assignment
- `PUT /<assignment_id>` - Update assignment
- `DELETE /<assignment_id>` - Remove assignment
- `GET /my-assignments` - Get current caregiver's assignments
- `GET /client/<client_id>` - Get all assignments for a client

### Database Schema

#### CaregiverAssignment Model
```python
class CaregiverAssignment(db.Model):
    __tablename__ = 'caregiver_assignments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    caregiver_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    client_id = db.Column(db.String(36), db.ForeignKey('clients.id'), nullable=False)
    assignment_type = db.Column(db.String(50), default='primary')  # primary, backup, temporary
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)  # NULL means ongoing
    is_active = db.Column(db.Boolean, default=True)
    assigned_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

## Frontend Implementation

### New Pages

#### 1. **Caregivers Page** (`/caregivers`)
- **Location**: `frontend/web/src/pages/Caregivers.js`
- **Features**:
  - List all caregivers with status
  - Create new caregivers
  - Edit existing caregivers
  - Soft delete caregivers
  - View caregiver assignments

#### 2. **Enhanced Clients Page**
- **Location**: `frontend/web/src/pages/Clients.js`
- **New Features**:
  - Caregiver assignment section
  - Assignment modal for adding caregivers
  - View current assignments
  - Remove assignments

### Navigation
- Added "Caregivers" to main navigation
- Icon: `user-group` (multiple users icon)
- Accessible to admins and managers only

## Usage Guide

### Creating a Caregiver

1. **Navigate to Caregivers page**
   - Click "Caregivers" in the sidebar
   - Click "+ Add Caregiver" button

2. **Fill in caregiver details**
   - First Name (required)
   - Last Name (required)
   - Email (required, must be unique)
   - Phone (required)
   - Password (optional, defaults to "caregiver123")
   - Status (Active/Inactive)

3. **Save the caregiver**
   - Click "Create Caregiver"
   - Caregiver will be created with caregiver role

### Assigning Caregivers to Clients

1. **Navigate to Clients page**
   - Click "Clients" in the sidebar
   - Select a client from the list

2. **Access assignment section**
   - Scroll to "Caregiver Assignments" section
   - Click "+ Assign Caregiver" button

3. **Choose caregiver and type**
   - Select from available active caregivers
   - Choose assignment type:
     - **Primary**: Main caregiver for the client
     - **Backup**: Secondary caregiver for coverage

4. **Complete assignment**
   - Assignment will be created immediately
   - Caregiver will see client in their assignments

### Managing Assignments

#### View Assignments
- **For Admins/Managers**: See all assignments in Clients page
- **For Caregivers**: See their own assignments via API

#### Remove Assignments
1. In Clients page, select a client
2. Find the assignment in the "Caregiver Assignments" section
3. Click "Remove" button
4. Confirm the removal

#### Edit Caregiver Details
1. Go to Caregivers page
2. Click "Edit" next to a caregiver
3. Modify details as needed
4. Click "Update Caregiver"

#### Deactivate Caregiver
1. Go to Caregivers page
2. Click "Deactivate" next to a caregiver
3. Confirm the action
4. All assignments will also be deactivated

## API Endpoints Reference

### Caregiver Management

```bash
# Get all caregivers
GET /api/caregiver

# Create caregiver
POST /api/caregiver
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-123-4567",
  "password": "secure123",
  "is_active": true
}

# Update caregiver
PUT /api/caregiver/<caregiver_id>
{
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+1-555-987-6543",
  "is_active": true
}

# Delete caregiver (soft delete)
DELETE /api/caregiver/<caregiver_id>
```

### Assignment Management

```bash
# Create assignment
POST /api/caregiver-assignment
{
  "caregiver_id": "uuid",
  "client_id": "uuid",
  "assignment_type": "primary",
  "start_date": "2024-01-01",
  "notes": "Primary caregiver assignment"
}

# Get client assignments
GET /api/caregiver-assignment/client/<client_id>

# Get caregiver assignments
GET /api/caregiver-assignment/caregiver/<caregiver_id>

# Remove assignment
DELETE /api/caregiver-assignment/<assignment_id>
```

## Security Features

### Authentication
- All endpoints require JWT authentication
- Role-based access control implemented

### Authorization
- **Admin/Manager**: Full access to all caregiver management features
- **Caregiver**: Can only view their own assignments
- **Client**: No access to caregiver management

### Data Protection
- Soft delete for caregivers (preserves data)
- Assignment history maintained
- Audit logging for all operations

## Integration with Existing Systems

### Geofence Access Control
- Caregivers only see geofences for their assigned clients
- Automatic filtering based on assignments

### Timesheet System
- Caregivers can only clock in for assigned clients
- Assignment validation on timesheet creation

### Reporting
- Assignment data available for reporting
- Audit logs track all assignment changes

## Testing

### Backend Testing
```bash
# Test caregiver creation
curl -X POST http://localhost:5000/api/caregiver \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Caregiver",
    "email": "test@example.com",
    "phone": "555-123-4567"
  }'

# Test assignment creation
curl -X POST http://localhost:5000/api/caregiver-assignment \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "caregiver_id": "<caregiver_uuid>",
    "client_id": "<client_uuid>",
    "assignment_type": "primary"
  }'
```

### Frontend Testing
1. **Create Caregiver**: Navigate to Caregivers page and create a new caregiver
2. **Assign to Client**: Go to Clients page, select a client, and assign the caregiver
3. **Verify Assignment**: Check that the assignment appears in the client's assignment list
4. **Test Access Control**: Switch to caregiver user and verify they only see their assigned clients

## Benefits

1. **Efficient Management**: Centralized caregiver management with full CRUD operations
2. **Flexible Assignments**: Support for multiple caregivers per client with different roles
3. **Data Integrity**: Soft delete preserves assignment history and audit trails
4. **Security**: Role-based access ensures proper data protection
5. **Integration**: Seamlessly integrates with existing geofence and timesheet systems
6. **User Experience**: Intuitive UI for managing complex caregiver-client relationships

## Future Enhancements

1. **Assignment Scheduling**: Support for time-based assignments
2. **Coverage Management**: Automatic backup caregiver notifications
3. **Performance Metrics**: Track caregiver performance and client satisfaction
4. **Mobile Support**: Enhanced mobile interface for caregivers
5. **Notifications**: Real-time notifications for assignment changes 