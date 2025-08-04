import React, { useState } from 'react';

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Hours Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Hours</span>
              <span className="font-semibold text-gray-900">38.5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Target: 40h</span>
              <span>96%</span>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Daily</span>
              <span className="font-semibold text-gray-900">7.7h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Overtime</span>
              <span className="font-semibold text-red-600">2.5h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Break Time</span>
              <span className="font-semibold text-gray-900">5.5h</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Clients</span>
              <span className="font-semibold text-gray-900">8</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '80%' }}></div>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Visits</span>
                <span className="font-semibold text-gray-900">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg. Visit Duration</span>
                <span className="font-semibold text-gray-900">2.3h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold text-green-600">95%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">42</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">In Progress</span>
              <span className="font-semibold text-blue-600">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">2</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-semibold text-green-600">93%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Tracking</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Geofence Entries</span>
              <span className="font-semibold text-gray-900">15</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Accuracy</span>
              <span className="font-semibold text-green-600">98%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Coverage</span>
              <span className="font-semibold text-blue-600">100%</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg. Response Time</span>
                <span className="font-semibold text-gray-900">2.3s</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Messages Sent</span>
              <span className="font-semibold text-gray-900">28</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Messages Received</span>
              <span className="font-semibold text-gray-900">32</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Response Rate</span>
              <span className="font-semibold text-green-600">87%</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg. Response Time</span>
                <span className="font-semibold text-gray-900">5.2m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trends</h3>
          <div className="space-y-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => (
              <div key={day} className="flex items-center justify-between">
                <span className="text-gray-600">{day}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${70 + (index * 5)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {7.5 + (index * 0.5)}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients</h3>
          <div className="space-y-4">
            {[
              { name: 'Margaret Johnson', hours: 12.5, visits: 5 },
              { name: 'Robert Smith', hours: 7.5, visits: 3 },
              { name: 'Helen Davis', hours: 6.0, visits: 2 }
            ].map((client, index) => (
              <div key={client.name} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-sm text-gray-600">{client.visits} visits</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{client.hours}h</p>
                  <p className="text-xs text-gray-500">
                    {Math.round((client.hours / 26) * 100)}% of total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 