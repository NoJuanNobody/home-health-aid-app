import React, { useState } from 'react';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('timesheet');

  const reports = [
    { id: 'timesheet', name: 'Timesheet Report', icon: 'clock' },
    { id: 'client', name: 'Client Activity', icon: 'user' },
    { id: 'task', name: 'Task Completion', icon: 'check' },
    { id: 'location', name: 'Location Tracking', icon: 'map' },
    { id: 'performance', name: 'Performance Metrics', icon: 'chart' }
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Types</h2>
            <div className="space-y-2">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${
                    selectedReport === report.id
                      ? 'bg-blue-50 text-blue-900 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {report.icon === 'clock' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                      {report.icon === 'user' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      )}
                      {report.icon === 'check' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                      {report.icon === 'map' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      )}
                      {report.icon === 'chart' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      )}
                    </svg>
                    <span className="text-sm font-medium">{report.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {reports.find(r => r.id === selectedReport)?.name}
              </h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                  Export PDF
                </button>
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                  Export Excel
                </button>
              </div>
            </div>

            {selectedReport === 'timesheet' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900">Total Hours</h3>
                    <p className="text-2xl font-bold text-blue-900">38.5</p>
                    <p className="text-xs text-blue-600">This week</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-900">Average Daily</h3>
                    <p className="text-2xl font-bold text-green-900">7.7</p>
                    <p className="text-xs text-green-600">Hours per day</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-900">Overtime</h3>
                    <p className="text-2xl font-bold text-purple-900">2.5</p>
                    <p className="text-xs text-purple-600">Hours this week</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breaks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Monday</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">8:00 AM</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5:00 PM</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">9.0</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1.0</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">8.0</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Tuesday</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">8:30 AM</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">4:30 PM</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">8.0</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0.5</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">7.5</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Wednesday</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">8:00 AM</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5:15 PM</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">9.25</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1.0</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">8.25</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedReport === 'client' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900">Active Clients</h3>
                    <p className="text-2xl font-bold text-blue-900">8</p>
                    <p className="text-xs text-blue-600">Currently assigned</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-900">Visits This Week</h3>
                    <p className="text-2xl font-bold text-green-900">24</p>
                    <p className="text-xs text-green-600">Completed visits</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-900">Avg. Visit Duration</h3>
                    <p className="text-2xl font-bold text-purple-900">2.3</p>
                    <p className="text-xs text-purple-600">Hours per visit</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visits</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Margaret Johnson</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">12.5</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Today</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Active</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Robert Smith</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">7.5</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Yesterday</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Active</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedReport === 'task' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900">Total Tasks</h3>
                    <p className="text-2xl font-bold text-blue-900">45</p>
                    <p className="text-xs text-blue-600">This month</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-900">Completed</h3>
                    <p className="text-2xl font-bold text-green-900">42</p>
                    <p className="text-xs text-green-600">93% completion rate</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-yellow-900">Pending</h3>
                    <p className="text-2xl font-bold text-yellow-900">3</p>
                    <p className="text-xs text-yellow-600">Due this week</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Morning Care</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Margaret Johnson</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Completed</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Today</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2h 15m</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Medication</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Robert Smith</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">In Progress</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Today</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">45m</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 