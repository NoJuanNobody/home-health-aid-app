import React, { useState, useEffect } from 'react';
import api from '../services/apiService';
import toast from 'react-hot-toast';

const Caregivers = () => {
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState(null);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [showAssignments, setShowAssignments] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    is_active: true
  });

  useEffect(() => {
    fetchCaregivers();
  }, []);

  const fetchCaregivers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/caregiver');
      setCaregivers(response.data.caregivers);
    } catch (error) {
      console.error('Error fetching caregivers:', error);
      toast.error('Failed to load caregivers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const caregiverData = {
        ...formData,
        password: formData.password || 'caregiver123' // Default password if not provided
      };

      if (editingCaregiver) {
        await api.put(`/caregiver/${editingCaregiver.id}`, caregiverData);
        toast.success('Caregiver updated successfully!');
      } else {
        await api.post('/caregiver', caregiverData);
        toast.success('Caregiver created successfully!');
      }

      setShowCreateForm(false);
      setEditingCaregiver(null);
      resetForm();
      fetchCaregivers();
    } catch (error) {
      console.error('Error saving caregiver:', error);
      toast.error(error.response?.data?.error || 'Failed to save caregiver');
    }
  };

  const handleEdit = (caregiver) => {
    setEditingCaregiver(caregiver);
    setFormData({
      first_name: caregiver.first_name || '',
      last_name: caregiver.last_name || '',
      email: caregiver.email || '',
      phone: caregiver.phone || '',
      password: '', // Don't populate password for security
      is_active: caregiver.is_active
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (caregiverId) => {
    if (!window.confirm('Are you sure you want to deactivate this caregiver? This will also deactivate all their assignments.')) {
      return;
    }

    try {
      await api.delete(`/caregiver/${caregiverId}`);
      toast.success('Caregiver deactivated successfully!');
      fetchCaregivers();
    } catch (error) {
      console.error('Error deleting caregiver:', error);
      toast.error(error.response?.data?.error || 'Failed to deactivate caregiver');
    }
  };

  const handleViewAssignments = async (caregiver) => {
    setSelectedCaregiver(caregiver);
    setShowAssignments(true);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      is_active: true
    });
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingCaregiver(null);
    resetForm();
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Caregiver Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Caregiver
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingCaregiver ? 'Edit Caregiver' : 'Create New Caregiver'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {!editingCaregiver && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave blank for default password"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: caregiver123</p>
                </div>
              )}
              
              {editingCaregiver && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingCaregiver ? 'Update' : 'Create'} Caregiver
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Caregivers List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            All Caregivers ({caregivers.length})
          </h2>
        </div>
        
        {caregivers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No caregivers found. Create your first caregiver to get started.
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
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {caregivers.map((caregiver) => (
                  <tr key={caregiver.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {caregiver.first_name} {caregiver.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {caregiver.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {caregiver.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(caregiver.is_active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(caregiver.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewAssignments(caregiver)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Assignments
                        </button>
                        <button
                          onClick={() => handleEdit(caregiver)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(caregiver.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignments Modal */}
      {showAssignments && selectedCaregiver && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assignments for {selectedCaregiver.first_name} {selectedCaregiver.last_name}
              </h3>
              
              <div className="text-sm text-gray-600 mb-4">
                <p>Email: {selectedCaregiver.email}</p>
                <p>Phone: {selectedCaregiver.phone || 'N/A'}</p>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>This caregiver's assignments can be managed from the Clients page.</p>
                <p className="mt-2">Go to Clients → Select a client → Assign Caregivers</p>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAssignments(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Caregivers; 