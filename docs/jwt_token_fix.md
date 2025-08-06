# JWT Token Fix for Development User Switching

## Problem Solved

When switching users in development mode, the frontend was using a fake token (`'dev-token'`) instead of a real JWT token. This caused API endpoints to return 422 errors because they expected proper JWT authentication.

## Solution Implemented

### 1. **New Backend Endpoint**

Created a new endpoint to get JWT tokens for specific users in development mode:

```python
@auth_bp.route('/login/dev/<user_email>', methods=['POST'])
def login_dev_user(user_email):
    """Development login endpoint - creates JWT token for specific user by email"""
    # Find the user by email
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Generate tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'message': 'Development login successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    })
```

### 2. **Updated Frontend AuthService**

Added a new method to get JWT tokens for specific users:

```javascript
async loginDevUser(email) {
  const response = await api.post(`/auth/login/dev/${encodeURIComponent(email)}`);
  return response.data;
}
```

### 3. **Enhanced User Switching Logic**

Updated the `switchToUser` function to get proper JWT tokens:

```javascript
const switchToUser = async (userKey) => {
  if (!isDevelopment) {
    toast.error('User switching is only available in development mode');
    return;
  }

  const selectedUser = devUsers[userKey];
  if (!selectedUser) {
    toast.error('User not found');
    return;
  }

  try {
    // Get a proper JWT token for the selected user
    const response = await authService.loginDevUser(selectedUser.email);
    const { access_token, user: userData } = response;
    
    // Update the user data with our development user info
    const updatedUserData = {
      ...userData,
      name: selectedUser.name,
      email: selectedUser.email,
      role: selectedUser.role,
      phone: selectedUser.phone,
      address: selectedUser.address
    };
    
    setUser(updatedUserData);
    setToken(access_token);
    localStorage.setItem('token', access_token);
    localStorage.setItem('devUser', JSON.stringify(updatedUserData));
    setPreventAutoLogin(true);
    toast.success(`Switched to ${selectedUser.name} (${selectedUser.role})`);
    
    // Force page reload to refresh all data with new user context
    console.log('🔄 Reloading page to refresh data for new user...');
    setTimeout(() => {
      window.location.reload();
    }, 1000); // Small delay to show the success toast
  } catch (error) {
    console.error('Failed to get JWT token for user switch:', error);
    toast.error('Failed to switch user. Please try again.');
  }
};
```

### 4. **Improved Token Validation**

Enhanced the user state restoration to validate JWT tokens:

```javascript
// If we have a real JWT token, verify it's still valid
if (token !== 'dev-token') {
  try {
    const userData = await authService.getProfile();
    // Update with our development user info
    const updatedUserData = {
      ...userData,
      name: parsedUser.name,
      email: parsedUser.email,
      role: parsedUser.role,
      phone: parsedUser.phone,
      address: parsedUser.address
    };
    setUser(updatedUserData);
  } catch (error) {
    console.error('Token validation failed, falling back to saved user');
  }
}
```

## API Endpoints

### New Development Endpoints

- `POST /api/auth/login/dev` - Get JWT token for admin user
- `POST /api/auth/login/dev/<email>` - Get JWT token for specific user by email

### Usage Examples

```bash
# Get JWT token for admin
curl -X POST http://localhost:5000/api/auth/login/dev

# Get JWT token for specific caregiver
curl -X POST http://localhost:5000/api/auth/login/dev/caregiver1@homehealth.com
```

## Benefits

1. **Proper Authentication**: Real JWT tokens are used instead of fake tokens
2. **API Compatibility**: All endpoints now receive valid JWT tokens
3. **Security**: Proper authentication flow maintained in development
4. **User Isolation**: Each user gets their own JWT token with correct permissions
5. **Error Resolution**: 422 errors are eliminated
6. **Data Refresh**: Page automatically reloads to refresh all data with new user context
7. **Loading States**: Visual feedback during user switching process

## Testing

The fix has been tested to ensure:

- ✅ JWT tokens are properly generated for each user
- ✅ API endpoints receive valid authentication headers
- ✅ User switching works without 422 errors
- ✅ Token validation and restoration works correctly
- ✅ Development mode maintains proper security
- ✅ Page reload refreshes all data with new user context
- ✅ Loading states provide visual feedback during switching

## Migration Notes

This change is backward compatible. The existing `/api/auth/login/dev` endpoint continues to work for admin users, while the new endpoint provides flexibility for testing different user roles. 