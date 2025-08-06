# Timesheet Multiple Shifts Fix

## Problem
Health aid users were only able to clock in once per day per client due to a backend restriction that prevented multiple timesheets for the same user, client, and date combination.

## Root Cause
In `backend/app/routes/timesheet.py`, the `create_timesheet` function had this logic:

```python
# Check if timesheet already exists for this user, client, and date
existing_timesheet = Timesheet.query.filter_by(
    user_id=current_user_id,
    client_id=data['client_id'],
    date=date.fromisoformat(data['date'])
).first()

if existing_timesheet:
    return jsonify({'error': 'Timesheet already exists for this date and client'}), 400
```

This prevented health aids from working multiple shifts per day (morning, afternoon, evening, etc.) for the same client.

## Solution

### Backend Changes (`backend/app/routes/timesheet.py`)

**Before:**
```python
# Check if timesheet already exists for this user, client, and date
existing_timesheet = Timesheet.query.filter_by(
    user_id=current_user_id,
    client_id=data['client_id'],
    date=date.fromisoformat(data['date'])
).first()

if existing_timesheet:
    return jsonify({'error': 'Timesheet already exists for this date and client'}), 400
```

**After:**
```python
# Check if user is already clocked in for this client (has an active timesheet)
active_timesheet = Timesheet.query.filter_by(
    user_id=current_user_id,
    client_id=data['client_id'],
    status='active'
).first()

if active_timesheet:
    return jsonify({'error': 'You are already clocked in for this client. Please clock out first.'}), 400
```

### Frontend Changes (`frontend/web/src/pages/Timesheets.js`)

1. **Improved Error Handling**: Added specific handling for the "already clocked in" error message
2. **Better User Experience**: Added informative messages about multiple shifts capability
3. **Enhanced UI**: Added a summary section showing total hours for multiple shifts
4. **Helpful Guidance**: Added a blue info box explaining that users can work multiple shifts per day

## Key Benefits

1. **Multiple Shifts Per Day**: Health aids can now work morning, afternoon, and evening shifts for the same client
2. **Prevents Double Clock-In**: Users cannot clock in twice for the same client simultaneously
3. **Better User Experience**: Clear error messages and helpful guidance
4. **Accurate Time Tracking**: Each shift is tracked separately with proper clock-in/clock-out times
5. **Total Hours Calculation**: The system now shows total hours worked across multiple shifts

## Testing

The changes have been tested to ensure:
- ✅ First shift of the day works normally
- ✅ Second shift of the day (after clocking out) is now allowed
- ✅ Active shifts are properly blocked to prevent double clock-in
- ✅ Frontend handles multiple shifts gracefully
- ✅ Error messages are clear and helpful

## Migration Notes

This change is backward compatible. Existing timesheets will continue to work normally. The only change is that users can now create multiple timesheets per day for the same client, as long as they're not already clocked in for that client. 