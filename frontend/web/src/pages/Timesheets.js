import React, { useState } from 'react';

const Timesheets = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = () => {
    setIsClockedIn(true);
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Timesheets</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Tracking</h2>
            <div className="text-center mb-6">
              <div className="text-4xl font-mono text-gray-900 mb-2">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-gray-600">
                {currentTime.toLocaleDateString()}
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              {!isClockedIn ? (
                <button
                  onClick={handleClockIn}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Clock In
                </button>
              ) : (
                <button
                  onClick={handleClockOut}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Clock Out
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Entries</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Morning Shift</p>
                  <p className="text-sm text-gray-600">8:00 AM - 12:00 PM</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">4h 0m</p>
                  <p className="text-sm text-green-600">Completed</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Afternoon Shift</p>
                  <p className="text-sm text-gray-600">1:00 PM - 5:00 PM</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">3h 45m</p>
                  <p className="text-sm text-blue-600">In Progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Monday</span>
                <span className="font-medium">8h 0m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tuesday</span>
                <span className="font-medium">7h 30m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wednesday</span>
                <span className="font-medium">8h 15m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thursday</span>
                <span className="font-medium">7h 45m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Friday</span>
                <span className="font-medium">6h 30m</span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>38h 0m</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Break Time</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Morning Break</span>
                <span className="font-medium">15m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lunch Break</span>
                <span className="font-medium">30m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Afternoon Break</span>
                <span className="font-medium">15m</span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between font-semibold">
                <span>Total Breaks</span>
                <span>1h 0m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timesheets; 