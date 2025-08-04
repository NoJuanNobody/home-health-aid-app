import React, { useState } from 'react';

const Geolocation = () => {
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 10
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Geolocation</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Location</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Latitude:</span>
              <span className="font-medium">{currentLocation.latitude}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Longitude:</span>
              <span className="font-medium">{currentLocation.longitude}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Accuracy:</span>
              <span className="font-medium">{currentLocation.accuracy}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Active</span>
            </div>
          </div>
          <div className="mt-6">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Update Location
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Geofences</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Client A Residence</p>
                <p className="text-sm text-gray-600">123 Main St, City</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Inside</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Client B Residence</p>
                <p className="text-sm text-gray-600">456 Oak Ave, City</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Outside</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Office</p>
                <p className="text-sm text-gray-600">789 Business Blvd, City</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Outside</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Location History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2:30 PM</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">123 Main St, City</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Inside Geofence</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5m</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2:00 PM</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">456 Oak Ave, City</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Outside Geofence</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">8m</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1:30 PM</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">789 Business Blvd, City</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Outside Geofence</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">12m</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Geolocation; 