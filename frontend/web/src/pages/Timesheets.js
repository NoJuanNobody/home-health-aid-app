import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/apiService';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Component to update map view when location changes
const MapUpdater = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  
  return null;
};

const Timesheets = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 10
  });
  const [selectedClient, setSelectedClient] = useState(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [timesheetEntries, setTimesheetEntries] = useState([
    {
      id: 1,
      client: 'Margaret Johnson',
      location: '123 Main St, City',
      clockIn: '08:00',
      clockOut: '12:00',
      duration: '4h 0m',
      status: 'completed',
      geofence: 'Client A Residence',
      coordinates: { latitude: 40.7128, longitude: -74.0060 }
    },
    {
      id: 2,
      client: 'Robert Smith',
      location: '456 Oak Ave, City',
      clockIn: '13:00',
      clockOut: null,
      duration: '2h 45m',
      status: 'in-progress',
      geofence: 'Client B Residence',
      coordinates: { latitude: 40.7589, longitude: -73.9851 }
    }
  ]);
  const [geofences, setGeofences] = useState([]);
  const [loadingGeofences, setLoadingGeofences] = useState(true);
  const [geofenceError, setGeofenceError] = useState(null);

  const mapRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Start continuous location tracking
  useEffect(() => {
    let watchId = null;

    if (isTrackingLocation && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setCurrentLocation({
            latitude,
            longitude,
            accuracy: Math.round(accuracy)
          });
          setLocationError(null);
        },
        (error) => {
          console.error('Location tracking error:', error);
          setLocationError(getLocationErrorMessage(error));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTrackingLocation]);

  const getLocationErrorMessage = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access denied. Please enable location services.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information unavailable.';
      case error.TIMEOUT:
        return 'Location request timed out.';
      default:
        return 'An unknown error occurred while getting location.';
    }
  };

  const startLocationTracking = () => {
    setIsTrackingLocation(true);
    setLocationError(null);
  };

  const stopLocationTracking = () => {
    setIsTrackingLocation(false);
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const updatedLocation = {
            latitude,
            longitude,
            accuracy: Math.round(accuracy)
          };
          
          setCurrentLocation(updatedLocation);
          resolve(updatedLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to simulated location if GPS fails
          const newLat = currentLocation.latitude + (Math.random() - 0.5) * 0.01;
          const newLng = currentLocation.longitude + (Math.random() - 0.5) * 0.01;
          
          const fallbackLocation = {
            latitude: newLat,
            longitude: newLng,
            accuracy: Math.floor(Math.random() * 10) + 5
          };
          
          setCurrentLocation(fallbackLocation);
          resolve(fallbackLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleClockIn = () => {
    // Start location tracking if not already tracking
    if (!isTrackingLocation) {
      startLocationTracking();
    }
    
    // Get current location and proceed with clock in
    getCurrentLocation().then(location => {
      // Update geofence status based on new location
      const updatedGeofences = geofences.map(geofence => {
        const distance = calculateDistance(
          location.latitude, location.longitude,
          geofence.latitude, geofence.longitude
        );
        return {
          ...geofence,
          isInside: distance <= geofence.radius / 1000 // Convert to km
        };
      });
      
      setGeofences(updatedGeofences);
      
      // Check if user is inside any geofence
      const insideGeofence = updatedGeofences.find(g => g.isInside);
      if (!insideGeofence) {
        alert('You must be inside a client geofence to clock in.');
        return;
      }
      
      // Create new timesheet entry
      const newEntry = {
        id: Date.now(),
        client: insideGeofence.client,
        location: insideGeofence.address,
        clockIn: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clockOut: null,
        duration: '0h 0m',
        status: 'in-progress',
        geofence: insideGeofence.name,
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        accuracy: location.accuracy
      };
      
      setTimesheetEntries(prev => [...prev, newEntry]);
      setIsClockedIn(true);
      setSelectedClient(insideGeofence);
    }).catch(error => {
      console.error('Error getting location for clock in:', error);
      alert('Unable to get your location. Please ensure location services are enabled and try again.');
    });
  };

  const handleClockOut = () => {
    if (!selectedClient) return;
    
    // Stop location tracking when clocking out
    if (isTrackingLocation) {
      stopLocationTracking();
    }
    
    // Update the current entry with clock out time
    setTimesheetEntries(prev => prev.map(entry => {
      if (entry.status === 'in-progress') {
        const clockInTime = new Date(`2024-01-15 ${entry.clockIn}`);
        const clockOutTime = currentTime;
        const durationMs = clockOutTime - clockInTime;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
          ...entry,
          clockOut: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: `${hours}h ${minutes}m`,
          status: 'completed'
        };
      }
      return entry;
    }));
    
    setIsClockedIn(false);
    setSelectedClient(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch geofences from backend
  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        setLoadingGeofences(true);
        const response = await api.get('/geolocation/geofences');
        const fetchedGeofences = response.data.geofences.map(geofence => ({
          id: geofence.id,
          name: geofence.name,
          address: geofence.description || 'No address provided',
          latitude: geofence.center_latitude,
          longitude: geofence.center_longitude,
          radius: geofence.radius_meters,
          isInside: false, // Will be calculated based on current location
          client: geofence.client_id, // You might want to fetch client details separately
          geofence_type: geofence.geofence_type,
          is_active: geofence.is_active
        }));
        setGeofences(fetchedGeofences);
        setGeofenceError(null);
      } catch (error) {
        console.error('Error fetching geofences:', error);
        setGeofenceError('Failed to load geofences. Using fallback data.');
        // Fallback to some basic geofences if API fails
        setGeofences([
          {
            id: 'fallback-1',
            name: 'Client A Residence',
            address: '123 Main St, City',
            latitude: 40.7128,
            longitude: -74.0060,
            radius: 100,
            isInside: false,
            client: 'Margaret Johnson',
            geofence_type: 'circle',
            is_active: true
          },
          {
            id: 'fallback-2',
            name: 'Client B Residence',
            address: '456 Oak Ave, City',
            latitude: 40.7589,
            longitude: -73.9851,
            radius: 150,
            isInside: false,
            client: 'Robert Smith',
            geofence_type: 'circle',
            is_active: true
          }
        ]);
      } finally {
        setLoadingGeofences(false);
      }
    };

    fetchGeofences();
  }, []);

  // Update geofence inside status based on current location
  useEffect(() => {
    if (geofences.length > 0 && currentLocation.latitude && currentLocation.longitude) {
      const updatedGeofences = geofences.map(geofence => ({
        ...geofence,
        isInside: calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          geofence.latitude,
          geofence.longitude
        ) <= geofence.radius
      }));
      setGeofences(updatedGeofences);
    }
  }, [currentLocation.latitude, currentLocation.longitude, geofences.length]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Time Tracking & Location</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Time Tracking */}
        
        <div className="lg:col-span-2">
          {/* Map Section */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Location Map</h2>
        <div className="h-96 rounded-lg overflow-hidden">
          <MapContainer
            center={[currentLocation.latitude, currentLocation.longitude]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Current Location Marker */}
            <Marker
              position={[currentLocation.latitude, currentLocation.longitude]}
              icon={createCustomIcon('#3B82F6')}
            >
              <Popup>
                <div>
                  <h3 className="font-semibold">Current Location</h3>
                  <p className="text-sm text-gray-600">
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-500">Accuracy: {currentLocation.accuracy}m</p>
                </div>
              </Popup>
            </Marker>

            {/* Geofence Circles */}
            {geofences.filter(g => g.is_active).map((geofence) => (
              <Circle
                key={geofence.id}
                center={[geofence.latitude, geofence.longitude]}
                radius={geofence.radius}
                pathOptions={{
                  color: geofence.isInside ? '#10B981' : '#6B7280',
                  fillColor: geofence.isInside ? '#10B981' : '#6B7280',
                  fillOpacity: 0.2,
                  weight: 2
                }}
              >
                <Popup>
                  <div>
                    <h3 className="font-semibold">{geofence.name}</h3>
                    <p className="text-sm text-gray-600">{geofence.address}</p>
                    <p className="text-xs text-gray-500">Client ID: {geofence.client}</p>
                    <p className="text-xs text-gray-500">Radius: {geofence.radius}m</p>
                    <p className="text-xs text-gray-500">Type: {geofence.geofence_type}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded mt-1 ${
                      geofence.isInside
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {geofence.isInside ? 'Inside' : 'Outside'}
                    </span>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Timesheet Entry Markers */}
            {timesheetEntries.map((entry) => (
              <Marker
                key={entry.id}
                position={[entry.coordinates.latitude, entry.coordinates.longitude]}
                icon={createCustomIcon(entry.status === 'completed' ? '#10B981' : '#3B82F6')}
              >
                <Popup>
                  <div>
                    <h3 className="font-semibold">{entry.client}</h3>
                    <p className="text-sm text-gray-600">{entry.location}</p>
                    <p className="text-xs text-gray-500">
                      {entry.clockIn} - {entry.clockOut || 'Active'}
                    </p>
                    <p className="text-xs text-gray-500">Duration: {entry.duration}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded mt-1 ${
                      entry.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {entry.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}

            <MapUpdater center={[currentLocation.latitude, currentLocation.longitude]} />
          </MapContainer>
        </div>
      </div>
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
            
            {/* Location Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Current Location</h3>
              </div>
              
              {locationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{locationError}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Latitude:</span>
                  <span className="ml-2 font-medium">{currentLocation.latitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Longitude:</span>
                  <span className="ml-2 font-medium">{currentLocation.longitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="ml-2 font-medium">{currentLocation.accuracy}m</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                    isTrackingLocation ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isTrackingLocation ? 'Tracking' : 'Manual'}
                  </span>
                </div>
              </div>
              
              {isTrackingLocation && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-xs">
                    🔄 Location is being tracked in real-time. The map will update automatically.
                  </p>
                </div>
              )}
            </div>

            {/* Clock In/Out */}
            <div className="flex justify-center space-x-4">
              {!isClockedIn ? (
                <button
                  onClick={handleClockIn}
                  className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-medium"
                >
                  📍 Clock In
                </button>
              ) : (
                <button
                  onClick={handleClockOut}
                  className="px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-lg font-medium"
                >
                  ⏰ Clock Out & Stop Tracking
                </button>
              )}
            </div>

            {selectedClient && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✅ Clocked in at: {selectedClient.name}
                </p>
                <p className="text-green-600 text-sm">{selectedClient.address}</p>
                <p className="text-green-600 text-xs mt-1">
                  Location recorded: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Today's Entries */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Entries</h2>
            <div className="space-y-3">
              {timesheetEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-gray-900">{entry.client}</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(entry.status)}`}>
                        {entry.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{entry.location}</p>
                    <p className="text-xs text-gray-500">{entry.clockIn} - {entry.clockOut || 'Active'}</p>
                    <p className="text-xs text-blue-600">📍 {entry.geofence}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{entry.duration}</p>
                    <p className="text-xs text-gray-500">
                      {entry.coordinates.latitude.toFixed(4)}, {entry.coordinates.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Geofences and Summary */}
        <div className="space-y-6">
          {/* Geofences */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Geofences</h3>
            
            {loadingGeofences ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading geofences...</span>
              </div>
            ) : geofenceError ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">{geofenceError}</p>
              </div>
            ) : geofences.length === 0 ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-600 text-sm">No geofences found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {geofences.filter(g => g.is_active).map((geofence) => (
                  <div
                    key={geofence.id}
                    className={`p-3 rounded-lg border ${
                      geofence.isInside
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{geofence.name}</p>
                        <p className="text-sm text-gray-600">{geofence.address}</p>
                        <p className="text-xs text-gray-500">Client ID: {geofence.client}</p>
                        <p className="text-xs text-gray-500">Radius: {geofence.radius}m</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        geofence.isInside
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {geofence.isInside ? 'Inside' : 'Outside'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Summary */}
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

          {/* Break Time */}
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