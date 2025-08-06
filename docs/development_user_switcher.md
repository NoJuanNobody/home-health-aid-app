# Development User Switcher

## Overview

The Development User Switcher is a feature that allows you to quickly switch between different user roles during development without having to log in and out repeatedly. This is only available in development mode.

## How to Use

### 1. Access the User Switcher

When running the application in development mode, you'll see a blue button in the top-left corner of the screen that shows the current user and their role.

### 2. Switch Users

Click on the user switcher button to open a dropdown menu with all available development users:

- **Admin User** (admin@homehealth.com) - Administrator role
- **Sarah Johnson** (manager@homehealth.com) - Manager role  
- **Maria Garcia** (caregiver1@homehealth.com) - Caregiver role
- **John Smith** (caregiver2@homehealth.com) - Caregiver role

### 3. User States

- **Current User**: Highlighted in blue with a checkmark
- **Available Users**: Gray background, click to switch
- **Role Indicators**: Color-coded badges (red for admin, yellow for manager, green for caregiver)

### 4. Keyboard Shortcut

- **Ctrl+Shift+U** (or Cmd+Shift+U on Mac): Toggle the user switcher
- This provides quick access without needing to click the button

## Features

### Persistent User State
- Your selected user persists across page refreshes
- User state is saved in localStorage
- Auto-login is disabled after manual user switching

### Role-Based Testing
- Test different user permissions and views
- Verify role-specific functionality
- Debug authorization issues

### Visual Indicators
- Current user is clearly marked
- Role badges are color-coded
- Development mode indicator
- Tooltip shows keyboard shortcut

## Available Users

| Name | Email | Username | Role | Phone |
|------|-------|----------|------|-------|
| Admin User | admin@homehealth.com | admin | admin | +1 (555) 123-4567 |
| Sarah Johnson | manager@homehealth.com | manager | manager | +1 (555) 234-5678 |
| Maria Garcia | caregiver1@homehealth.com | caregiver1 | caregiver | +1 (555) 345-6789 |
| John Smith | caregiver2@homehealth.com | caregiver2 | caregiver | +1 (555) 456-7890 |

## Development Mode Only

This feature is only available when:
- `NODE_ENV === 'development'`
- Running the frontend in development mode

In production, this switcher will not appear and normal authentication will be used.

## Technical Details

### Implementation
- Uses React Context for state management
- Persists user selection in localStorage
- Integrates with existing authentication flow
- Prevents auto-login after manual switching

### Files Modified
- `frontend/web/src/contexts/AuthContext.js` - Added user switching logic
- `frontend/web/src/components/DevUserSwitcher.js` - New component
- `frontend/web/src/App.js` - Added switcher to app layout

### API Integration
- Uses existing `authService.loginDev()` for initial setup
- Maintains JWT token compatibility
- Preserves existing authentication flow

## Troubleshooting

### User Switcher Not Appearing
- Ensure you're in development mode (`NODE_ENV=development`)
- Check browser console for any errors
- Verify the component is properly imported

### User State Not Persisting
- Check localStorage for `devUser` key
- Clear localStorage and refresh if needed
- Ensure no conflicting authentication logic

### Role Permissions Issues
- Verify the user has the correct role assigned
- Check backend role-based access control
- Test with different user roles to isolate issues 