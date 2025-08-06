import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DevUserSwitcher = () => {
  const { isDevelopment, getAvailableUsers, switchToUser, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Keyboard shortcut to toggle user switcher (Ctrl/Cmd + Shift + U)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'U') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    if (isDevelopment) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isDevelopment]);

  if (!isDevelopment) {
    return null;
  }

  const availableUsers = getAvailableUsers();

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="relative">
        {/* Current User Display */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center space-x-2 group ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          title="Development User Switcher (Ctrl+Shift+U)"
        >
          <span className="text-sm font-medium">
            {isLoading ? '⏳' : '🔧'} {user?.name || 'Dev Mode'}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            isLoading ? 'bg-gray-500' : 'bg-blue-500'
          }`}>
            {user?.role || 'unknown'}
          </span>
          <span className="text-xs">{isLoading ? '⋯' : '▼'}</span>
        </button>

        {/* User Switcher Dropdown */}
        {isOpen && (
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🔧 Development User Switcher
              </h3>
              
              <div className="space-y-2">
                {availableUsers.map((devUser) => (
                  <div
                    key={devUser.key}
                    className={`w-full p-3 rounded-lg border transition-colors ${
                      isLoading 
                        ? 'cursor-not-allowed opacity-50' 
                        : 'cursor-pointer'
                    } ${
                      user?.email === devUser.email
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsLoading(true);
                      try {
                        await switchToUser(devUser.key);
                        setIsOpen(false);
                      } catch (error) {
                        console.error('Failed to switch user:', error);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{devUser.name}</div>
                        <div className="text-sm text-gray-600">{devUser.email}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          devUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                          devUser.role === 'manager' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {devUser.role}
                        </span>
                        {user?.email === devUser.email && (
                          <span className="text-blue-600">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                {isLoading && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 flex items-center">
                      <span className="mr-2">⏳</span>
                      Switching user and refreshing page...
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  💡 This switcher is only available in development mode.
                  <br />
                  Use it to test different user roles and permissions.
                  <br />
                  <span className="text-blue-600 font-medium">💡 Tip: Press Ctrl+Shift+U to toggle</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DevUserSwitcher; 