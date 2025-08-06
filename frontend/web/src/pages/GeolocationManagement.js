import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/apiService';
import toast from 'react-hot-toast';

const GeolocationManagement = () => {
  const { user } = useAuth();
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_id: '',
    center_latitude: '',
    center_longitude: '',
    radius_meters: '',
    geofence_type: 'circle',
    is_active: true
  });

  // Address lookup state
  const [addressLookup, setAddressLookup] = useState('');
  const [isLookingUpAddress, setIsLookingUpAddress] = useState(false);

  // Location state
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Check if user is manager or admin
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    if (isManager) {
      fetchGeofences();
      fetchClients();
    }
  }, [isManager]);

  const fetchGeofences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/geolocation/geofences');
      console.log('Fetched geofences:', response.data);
      setGeofences(response.data.geofences);
    } catch (error) {
      console.error('Error fetching geofences:', error);
      toast.error('Failed to load geofences');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/client');
      setClients(response.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const geofenceData = {
        ...formData,
        center_latitude: parseFloat(formData.center_latitude),
        center_longitude: parseFloat(formData.center_longitude),
        radius_meters: parseFloat(formData.radius_meters)
      };

      if (editingGeofence) {
        const response = await api.put(`/geolocation/geofences/${editingGeofence.id}`, geofenceData);
        console.log('Geofence updated:', response.data);
        toast.success('Geofence updated successfully!');
      } else {
        const response = await api.post('/geolocation/geofences', geofenceData);
        console.log('Geofence created:', response.data);
        toast.success('Geofence created successfully!');
      }

      setShowCreateForm(false);
      setEditingGeofence(null);
      resetForm();
      fetchGeofences();
    } catch (error) {
      console.error('Error saving geofence:', error);
      toast.error(error.response?.data?.error || 'Failed to save geofence');
    }
  };

  const handleEdit = (geofence) => {
    setEditingGeofence(geofence);
    setFormData({
      name: geofence.name,
      description: geofence.description || '',
      client_id: geofence.client_id,
      center_latitude: geofence.center_latitude.toString(),
      center_longitude: geofence.center_longitude.toString(),
      radius_meters: geofence.radius_meters.toString(),
      geofence_type: geofence.geofence_type,
      is_active: geofence.is_active
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (geofenceId) => {
    if (window.confirm('Are you sure you want to delete this geofence?')) {
      try {
        await api.delete(`/geolocation/geofences/${geofenceId}`);
        toast.success('Geofence deleted successfully!');
        fetchGeofences();
      } catch (error) {
        console.error('Error deleting geofence:', error);
        toast.error('Failed to delete geofence');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      client_id: '',
      center_latitude: '',
      center_longitude: '',
      radius_meters: '',
      geofence_type: 'circle',
      is_active: true
    });
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingGeofence(null);
    resetForm();
  };

  const handleAddressLookup = async () => {
    if (!addressLookup.trim()) {
      toast.error('Please enter an address to lookup');
      return;
    }

    setIsLookingUpAddress(true);
    try {
      const response = await api.post('/geolocation/geocode/address', {
        address: addressLookup,
        max_retries: 3,
        timeout: 15
      });

      if (response.data.success) {
        const { latitude, longitude, formatted_address, provider } = response.data.data;
        setFormData({
          ...formData,
          center_latitude: latitude.toString(),
          center_longitude: longitude.toString(),
          description: formatted_address
        });
        toast.success(`Address coordinates found! (Provider: ${provider || 'unknown'})`);
      } else {
        toast.error('Could not find coordinates for this address. Try a different format.');
      }
    } catch (error) {
      console.error('Error looking up address:', error);
      const errorMessage = error.response?.data?.error || 'Failed to lookup address. Please try again or check the address format.';
      toast.error(errorMessage);
    } finally {
      setIsLookingUpAddress(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData({
          ...formData,
          center_latitude: latitude.toFixed(6),
          center_longitude: longitude.toFixed(6)
        });
        setIsGettingLocation(false);
        toast.success('Location captured successfully!');
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = 'Failed to get location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
        }
        
        setLocationError(errorMessage);
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  if (!isManager) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Geofence Management</h1>
          <p className="text-gray-600">Create and manage geofences for client locations</p>
        </div>

        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Create New Geofence
          </button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingGeofence ? 'Edit Geofence' : 'Create New Geofence'}
              </h2>
              {editingGeofence && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  Editing: {editingGeofence.name}
                </span>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geofence Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Client A Residence"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a client</option>
                    {clients && clients.length > 0 ? (
                      clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No clients available</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 123 Main Street, New York, NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Lookup
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={addressLookup}
                      onChange={(e) => setAddressLookup(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter address to get coordinates"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddressLookup()}
                    />
                    <button
                      type="button"
                      onClick={handleAddressLookup}
                      disabled={isLookingUpAddress}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLookingUpAddress ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        '🔍'
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter an address to automatically get coordinates
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geofence Type
                  </label>
                  <select
                    value={formData.geofence_type}
                    onChange={(e) => setFormData({...formData, geofence_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="circle">Circle</option>
                    <option value="polygon">Polygon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.center_latitude}
                      onChange={(e) => setFormData({...formData, center_latitude: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="40.7128"
                    />
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Use current GPS location"
                    >
                      {isGettingLocation ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        '📍'
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.center_longitude}
                    onChange={(e) => setFormData({...formData, center_longitude: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="-74.0060"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Radius (meters) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.radius_meters}
                    onChange={(e) => setFormData({...formData, radius_meters: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>
              </div>

              {locationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{locationError}</p>
                </div>
              )}

              <div className="flex items-center space-x-4 pt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active Geofence
                  </label>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingGeofence ? 'Update Geofence' : 'Create Geofence'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Geofences List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Existing Geofences</h3>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading geofences...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Radius
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {geofences.map((geofence) => (
                    <tr key={geofence.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{geofence.name}</div>
                        <div className="text-sm text-gray-500">{geofence.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(() => {
                            const client = clients.find(c => c.id === geofence.client_id);
                            return client ? `${client.first_name} ${client.last_name}` : `Client ID: ${geofence.client_id}`;
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {geofence.center_latitude.toFixed(6)}, {geofence.center_longitude.toFixed(6)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{geofence.radius_meters}m</div>
                        <div className="text-sm text-gray-500">{geofence.geofence_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            geofence.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {geofence.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                await api.put(`/geolocation/geofences/${geofence.id}`, {
                                  ...geofence,
                                  is_active: !geofence.is_active
                                });
                                toast.success(`Geofence ${!geofence.is_active ? 'activated' : 'deactivated'} successfully!`);
                                fetchGeofences();
                              } catch (error) {
                                console.error('Error toggling geofence status:', error);
                                toast.error('Failed to update geofence status');
                              }
                            }}
                            className={`text-xs px-2 py-1 rounded ${
                              geofence.is_active
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                            title={geofence.is_active ? 'Deactivate geofence' : 'Activate geofence'}
                          >
                            {geofence.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(geofence)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                          title="Edit geofence details"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(geofence.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete geofence"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {geofences.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No geofences found. Create your first geofence above.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeolocationManagement; 