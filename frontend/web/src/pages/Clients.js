import React, { useState } from 'react';

const Clients = () => {
  const [selectedClient, setSelectedClient] = useState(null);

  const clients = [
    {
      id: 1,
      name: 'Margaret Johnson',
      address: '123 Main St, City, State',
      phone: '(555) 123-4567',
      status: 'Active',
      carePlan: 'Morning care, medication management',
      lastVisit: '2024-01-15',
      nextVisit: '2024-01-16'
    },
    {
      id: 2,
      name: 'Robert Smith',
      address: '456 Oak Ave, City, State',
      phone: '(555) 234-5678',
      status: 'Active',
      carePlan: 'Evening care, meal preparation',
      lastVisit: '2024-01-14',
      nextVisit: '2024-01-16'
    },
    {
      id: 3,
      name: 'Helen Davis',
      address: '789 Pine Rd, City, State',
      phone: '(555) 345-6789',
      status: 'Inactive',
      carePlan: 'Weekly check-in',
      lastVisit: '2024-01-10',
      nextVisit: '2024-01-17'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Add New Client
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Client List</h2>
            </div>
            <div className="overflow-y-auto max-h-96">
              {clients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedClient?.id === client.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{client.name}</h3>
                      <p className="text-sm text-gray-600">{client.address}</p>
                      <div className="flex items-center mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          client.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {client.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Next: {client.nextVisit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedClient ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                  <p className="text-gray-600">{selectedClient.address}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                    Edit
                  </button>
                  <button className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200">
                    Schedule Visit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900">{selectedClient.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        selectedClient.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedClient.status}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Visit</label>
                      <p className="text-gray-900">{selectedClient.lastVisit}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Next Visit</label>
                      <p className="text-gray-900">{selectedClient.nextVisit}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Care Plan</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900">{selectedClient.carePlan}</p>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-center">
                      <svg className="w-6 h-6 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-blue-900">Clock In</p>
                    </button>
                    <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center">
                      <svg className="w-6 h-6 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-green-900">Complete Task</p>
                    </button>
                    <button className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-center">
                      <svg className="w-6 h-6 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-sm font-medium text-purple-900">Message</p>
                    </button>
                    <button className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-center">
                      <svg className="w-6 h-6 text-orange-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-sm font-medium text-orange-900">Reports</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500">Select a client to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients; 