import React, { useState } from 'react';

const Tasks = () => {
  const [selectedTask, setSelectedTask] = useState(null);

  const tasks = [
    {
      id: 1,
      title: 'Morning Care - Client A',
      client: 'Margaret Johnson',
      description: 'Assist with morning routine, medication administration',
      status: 'In Progress',
      priority: 'High',
      dueTime: '8:00 AM',
      estimatedDuration: '2 hours',
      location: '123 Main St, City'
    },
    {
      id: 2,
      title: 'Medication Management - Client B',
      client: 'Robert Smith',
      description: 'Administer prescribed medications and monitor effects',
      status: 'Pending',
      priority: 'Medium',
      dueTime: '2:00 PM',
      estimatedDuration: '1 hour',
      location: '456 Oak Ave, City'
    },
    {
      id: 3,
      title: 'Evening Care - Client C',
      client: 'Helen Davis',
      description: 'Evening routine, meal preparation, safety check',
      status: 'Completed',
      priority: 'Low',
      dueTime: '6:00 PM',
      estimatedDuration: '3 hours',
      location: '789 Pine Rd, City'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Create New Task
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Task List</h2>
            </div>
            <div className="overflow-y-auto max-h-96">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedTask?.id === task.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.client}</p>
                      <p className="text-sm text-gray-500 truncate">{task.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Due: {task.dueTime}</span>
                        <span>Duration: {task.estimatedDuration}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{task.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedTask ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
                <div className="flex space-x-2">
                  <button className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                    Edit
                  </button>
                  <button className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200">
                    Start
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <p className="text-gray-900">{selectedTask.title}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Client</label>
                  <p className="text-gray-900">{selectedTask.client}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-900">{selectedTask.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priority</label>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Due Time</label>
                    <p className="text-gray-900">{selectedTask.dueTime}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Duration</label>
                    <p className="text-gray-900">{selectedTask.estimatedDuration}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="text-gray-900">{selectedTask.location}</p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-2 bg-blue-50 hover:bg-blue-100 rounded text-center">
                      <svg className="w-5 h-5 text-blue-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs font-medium text-blue-900">Clock In</p>
                    </button>
                    <button className="p-2 bg-green-50 hover:bg-green-100 rounded text-center">
                      <svg className="w-5 h-5 text-green-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs font-medium text-green-900">Complete</p>
                    </button>
                    <button className="p-2 bg-purple-50 hover:bg-purple-100 rounded text-center">
                      <svg className="w-5 h-5 text-purple-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-xs font-medium text-purple-900">Message</p>
                    </button>
                    <button className="p-2 bg-orange-50 hover:bg-orange-100 rounded text-center">
                      <svg className="w-5 h-5 text-orange-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <p className="text-xs font-medium text-orange-900">Notes</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-gray-500">Select a task to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks; 