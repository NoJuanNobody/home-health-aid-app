import React, { useState } from 'react';

const Communication = () => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [message, setMessage] = useState('');

  const contacts = [
    { id: 1, name: 'Sarah Johnson', role: 'Supervisor', lastMessage: 'How is the client doing today?', time: '2:30 PM', unread: 2 },
    { id: 2, name: 'Dr. Michael Chen', role: 'Physician', lastMessage: 'Please update the medication schedule', time: '1:45 PM', unread: 0 },
    { id: 3, name: 'Client A Family', role: 'Family Member', lastMessage: 'Thank you for the care today', time: '12:20 PM', unread: 1 },
    { id: 4, name: 'Office Admin', role: 'Administration', lastMessage: 'Schedule update for tomorrow', time: '11:15 AM', unread: 0 },
  ];

  const messages = [
    { id: 1, sender: 'Sarah Johnson', message: 'How is the client doing today?', time: '2:30 PM', isOwn: false },
    { id: 2, sender: 'You', message: 'Client is doing well. Completed all scheduled tasks.', time: '2:32 PM', isOwn: true },
    { id: 3, sender: 'Sarah Johnson', message: 'Great! Any concerns to report?', time: '2:35 PM', isOwn: false },
    { id: 4, sender: 'You', message: 'No concerns. Everything is on schedule.', time: '2:37 PM', isOwn: true },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Here you would typically send the message to the backend
      setMessage('');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Communication</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
          </div>
          <div className="overflow-y-auto h-80">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedContact?.id === contact.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{contact.name}</h3>
                      {contact.unread > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{contact.role}</p>
                    <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                  </div>
                  <div className="text-xs text-gray-400 ml-2">{contact.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">
          {selectedContact ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedContact.name}</h2>
                    <p className="text-sm text-gray-600">{selectedContact.role}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.isOwn 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500">Select a contact to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Communication; 