# Caregiver Geofence Access Control

## Problem Solved

Previously, caregivers could see all geofences in the system, which was a security and functionality issue. Caregivers should only see geofences for clients they are assigned to.

## Solution Implemented

### 1. **Caregiver-Client Assignment System**

Created a new `CaregiverAssignment` model to establish relationships between caregivers and clients:

```python
class CaregiverAssignment(db.Model):
    __tablename__ = 'caregiver_assignments'
    
    id = db.Column(db.String(36), primary_key=True)
    caregiver_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    client_id = db.Column(db.String(36), db.ForeignKey('clients.id'))
    assignment_type = db.Column(db.String(50), default='primary')  # primary, backup, temporary
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)  # NULL means ongoing
    is_active = db.Column(db.Boolean, default=True)
    assigned_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    notes = db.Column(db.Text)
```

### 2. **Modified Geofence Access Logic**

Updated the `/api/geolocation/geofences` endpoint to filter based on user role:

- **Admin/Manager**: Can see all geofences
- **Caregiver**: Can only see geofences for their assigned clients

```python
@geolocation_bp.route('/geofences', methods=['GET'])
@jwt_required()
def get_geofences():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role.name == 'caregiver':
        # Get caregiver's assigned clients
        assignments = CaregiverAssignment.query.filter_by(
            caregiver_id=current_user_id,
            is_active=True
        ).all()
        
        assigned_client_ids = [a.client_id for a in assignments if a.is_current()]
        
        # Filter geofences to only assigned clients
        geofences = Geofence.query.filter(
            Geofence.is_active == True,
            Geofence.client_id.in_(assigned_client_ids)
        ).all()
    else:
        # Admin/Manager see all geofences
        geofences = Geofence.query.filter_by(is_active=True).all()
    
    return jsonify({'geofences': [gf.to_dict() for gf in geofences]})
```

### 3. **Caregiver Assignment Management**

Created new API endpoints for managing caregiver assignments:

- `GET /api/caregiver-assignment/` - List assignments
- `POST /api/caregiver-assignment/` - Create assignment
- `PUT /api/caregiver-assignment/<id>` - Update assignment
- `DELETE /api/caregiver-assignment/<id>` - Delete assignment
- `GET /api/caregiver-assignment/my-assignments` - Get current user's assignments

## Database Schema

### New Table: `caregiver_assignments`

| Column | Type | Description |
|--------|------|-------------|
| id | String(36) | Primary key |
| caregiver_id | String(36) | Foreign key to users table |
| client_id | String(36) | Foreign key to clients table |
| assignment_type | String(50) | primary, backup, temporary |
| start_date | Date | Assignment start date |
| end_date | Date | Assignment end date (NULL = ongoing) |
| is_active | Boolean | Whether assignment is active |
| assigned_by | String(36) | Who created the assignment |
| notes | Text | Assignment notes |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

## Sample Data

### Caregiver Assignments Created:

1. **Maria Garcia** → **Margaret Johnson** (Primary)
2. **Maria Garcia** → **Robert Smith** (Primary)  
3. **John Smith** → **Helen Davis** (Primary)

### Access Control Results:

- **Maria Garcia** can see geofences for:
  - Margaret Johnson Residence
  - Robert Smith Residence
  - Home Health Office (Margaret Johnson)

- **John Smith** can see geofences for:
  - Helen Davis Residence

- **Maria Garcia** cannot see:
  - Helen Davis Residence
  - alex londono Residence

- **John Smith** cannot see:
  - Margaret Johnson Residence
  - Robert Smith Residence
  - Home Health Office
  - alex londono Residence

## API Usage

### For Caregivers

Caregivers can check their assignments:

```bash
GET /api/caregiver-assignment/my-assignments
Authorization: Bearer <token>
```

Response:
```json
{
  "assignments": [
    {
      "id": "uuid",
      "caregiver_id": "caregiver-uuid",
      "client_id": "client-uuid",
      "assignment_type": "primary",
      "start_date": "2024-01-01",
      "end_date": null,
      "is_active": true,
      "is_current": true,
      "caregiver": {
        "id": "caregiver-uuid",
        "name": "Maria Garcia",
        "email": "caregiver1@homehealth.com"
      },
      "client": {
        "id": "client-uuid", 
        "name": "Margaret Johnson",
        "email": "margaret.johnson@email.com"
      }
    }
  ]
}
```

### For Managers/Admins

Managers can create assignments:

```bash
POST /api/caregiver-assignment/
Authorization: Bearer <token>
Content-Type: application/json

{
  "caregiver_id": "caregiver-uuid",
  "client_id": "client-uuid", 
  "assignment_type": "primary",
  "start_date": "2024-01-01",
  "notes": "Primary caregiver assignment"
}
```

## Security Benefits

1. **Data Isolation**: Caregivers only see data for their assigned clients
2. **Privacy Protection**: Client information is restricted to assigned caregivers
3. **Audit Trail**: All assignments are logged with who created them
4. **Flexible Assignment**: Support for primary, backup, and temporary assignments
5. **Time-based Access**: Assignments can have start/end dates

## Testing

The system has been tested to ensure:

- ✅ Caregivers only see geofences for their assigned clients
- ✅ Admin/Manager can see all geofences
- ✅ Assignment creation and management works correctly
- ✅ Time-based assignments function properly
- ✅ No data leakage between caregivers

## Migration Notes

This change is backward compatible. Existing functionality continues to work, but now with proper access controls in place. 