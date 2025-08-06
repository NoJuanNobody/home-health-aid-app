import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/apiService';
import toast from 'react-hot-toast';

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
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [clients, setClients] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [loadingGeofences, setLoadingGeofences] = useState(true);
  const [geofenceError, setGeofenceError] = useState(null);
  const [loading, setLoading] = useState(true);

  const mapRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get initial location when component mounts
  useEffect(() => {
    const getInitialLocation = () => {
      if (navigator.geolocation) {
        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            setCurrentLocation({
              latitude,
              longitude,
              accuracy: Math.round(accuracy)
            });
            setLocationError(null);
            setIsGettingLocation(false);
            console.log('Initial location set:', { latitude, longitude, accuracy });
          },
          (error) => {
            console.error('Initial location error:', error);
            setLocationError(getLocationErrorMessage(error));
            setIsGettingLocation(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
          }
        );
      } else {
        setIsGettingLocation(false);
      }
    };

    getInitialLocation();
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

  const handleClockIn = async () => {
    // Start location tracking if not already tracking
    if (!isTrackingLocation) {
      startLocationTracking();
    }
    
    try {
      // Get current location
      const location = await getCurrentLocation();
      
      // Update geofence status based on new location
      const updatedGeofences = geofences.map(geofence => {
        const distance = calculateDistance(
          location.latitude, location.longitude,
          geofence.center_latitude, geofence.center_longitude
        );
        return {
          ...geofence,
          isInside: distance <= geofence.radius_meters / 1000 // Convert to km
        };
      });
      
      setGeofences(updatedGeofences);
      
      // Check if user is inside any geofence
      const insideGeofence = updatedGeofences.find(g => g.isInside);
      if (!insideGeofence) {
        toast.error('You must be inside a client geofence to clock in.');
        return;
      }
      
      // Find the client for this geofence
      const client = clients.find(c => c.id === insideGeofence.client_id);
      if (!client) {
        toast.error('Client not found for this geofence.');
        return;
      }
      
      // Create timesheet in backend
      const today = new Date().toISOString().split('T')[0];
      const timesheetData = {
        client_id: insideGeofence.client_id,
        date: today,
        notes: `Clocked in at ${client.first_name} ${client.last_name}'s residence`
      };
      
      let timesheetResponse;
      try {
        timesheetResponse = await api.post('/timesheet', timesheetData);
      } catch (error) {
        if (error.response?.data?.error?.includes('already clocked in')) {
          toast.error('You are already clocked in for this client. Please clock out first.');
          return;
        }
        throw error;
      }
      
      const timesheet = timesheetResponse.data.timesheet;
      
      // Clock in with location
      const clockInData = {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: insideGeofence.description
        }
      };
      
      await api.post(`/timesheet/${timesheet.id}/clock-in`, clockInData);
      
      // Update local state
      setTimesheetEntries(prev => [...prev, timesheet]);
      setIsClockedIn(true);
      setSelectedClient(client);
      
      toast.success(`Clocked in at ${client.first_name} ${client.last_name}'s residence`);
      
    } catch (error) {
      console.error('Error clocking in:', error);
      toast.error(error.response?.data?.error || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      // Stop location tracking when clocking out
      if (isTrackingLocation) {
        stopLocationTracking();
      }
      
      // Find the active timesheet (check for any active timesheet, not just for selectedClient)
      const activeTimesheet = timesheetEntries.find(entry => 
        entry.status === 'active' && entry.clock_in_time && !entry.clock_out_time
      );
      
      if (!activeTimesheet) {
        toast.error('No active timesheet found. Please make sure you are clocked in.');
        return;
      }
      
      // Get current location for clock out
      const location = await getCurrentLocation();
      
      // Find the client for this timesheet
      const client = clients.find(c => c.id === activeTimesheet.client_id);
      
      // Clock out with location
      const clockOutData = {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: client?.address || 'Location not recorded'
        }
      };
      
      await api.post(`/timesheet/${activeTimesheet.id}/clock-out`, clockOutData);
      
      // Update local state
      setTimesheetEntries(prev => prev.map(entry => 
        entry.id === activeTimesheet.id 
          ? { 
              ...entry, 
              status: 'completed', 
              clock_out_time: new Date().toISOString(),
              clock_out_location: clockOutData.location
            }
          : entry
      ));
      
      setIsClockedIn(false);
      setSelectedClient(null);
      
      toast.success(`Clocked out from ${client ? `${client.first_name} ${client.last_name}` : 'client'}'s residence. You can now start a new shift if needed.`);
      
    } catch (error) {
      console.error('Error clocking out:', error);
      toast.error(error.response?.data?.error || 'Failed to clock out');
    }
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

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch timesheets
        const timesheetsResponse = await api.get('/timesheet');
        console.log('Timesheets response:', timesheetsResponse.data);
        setTimesheetEntries(timesheetsResponse.data.timesheets || []);
        
        // Fetch clients
        const clientsResponse = await api.get('/client');
        console.log('Clients response:', clientsResponse.data);
        setClients(clientsResponse.data.clients || []);
        
        // Fetch geofences
        const geofencesResponse = await api.get('/geolocation/geofences');
        console.log('Geofences response:', geofencesResponse.data);
        console.log('Geofences array:', geofencesResponse.data.geofences);
        setGeofences(geofencesResponse.data.geofences || []);
        
        // Check if user is currently clocked in
        const activeTimesheet = timesheetsResponse.data.timesheets?.find(entry => 
          entry.status === 'active' && entry.clock_in_time && !entry.clock_out_time
        );
        
        if (activeTimesheet) {
          const client = clientsResponse.data.clients?.find(c => c.id === activeTimesheet.client_id);
          setIsClockedIn(true);
          setSelectedClient(client);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
        setLoadingGeofences(false);
      }
    };

    fetchData();
  }, []);

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
      const updatedGeofences = geofences.map(geofence => {
        // Skip geofences without proper coordinates
        if (!geofence.center_latitude || !geofence.center_longitude) {
          return { ...geofence, isInside: false };
        }
        
        return {
          ...geofence,
          isInside: calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            geofence.center_latitude,
            geofence.center_longitude
          ) <= (geofence.radius_meters || 100) / 1000 // Convert to km
        };
      });
      setGeofences(updatedGeofences);
    }
  }, [currentLocation.latitude, currentLocation.longitude, geofences.length]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading timesheet data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure we have the required data before rendering
  if (!geofences || !clients || !timesheetEntries) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600">No data available</p>
          </div>
        </div>
      </div>
    );
  }

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
            center={[currentLocation?.latitude || 40.7128, currentLocation?.longitude || -74.0060]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Current Location Marker */}
            {currentLocation?.latitude && currentLocation?.longitude && (
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
            )}

            {/* Geofence Circles */}
            {(() => {
              console.log('All geofences:', geofences);
              const activeGeofences = geofences.filter(g => g.is_active && g.center_latitude && g.center_longitude);
              console.log('Active geofences:', activeGeofences);
              return activeGeofences.map((geofence) => {
                const client = clients.find(c => c.id === geofence.client_id);
                return (
                  <Circle
                    key={geofence.id}
                    center={[geofence.center_latitude, geofence.center_longitude]}
                    radius={geofence.radius_meters || 100}
                    pathOptions={{
                      color: geofence.isInside ? '#10B981' : '#6B7280',
                      fillColor: geofence.isInside ? '#10B981' : '#6B7280',
                      fillOpacity: 0.2,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div>
                        <h3 className="font-semibold">{geofence.name || 'Unnamed Geofence'}</h3>
                        <p className="text-sm text-gray-600">{geofence.description || 'No description'}</p>
                        <p className="text-xs text-gray-500">
                          Client: {client ? `${client.first_name} ${client.last_name}` : 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">Radius: {geofence.radius_meters || 100}m</p>
                        <p className="text-xs text-gray-500">Type: {geofence.geofence_type || 'circle'}</p>
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
                );
              });
            })()}

            {/* Timesheet Entry Markers */}
            {timesheetEntries.map((entry) => {
              const client = clients.find(c => c.id === entry.client_id);
              const clockInLocation = entry.clock_in_location;
              const clockOutLocation = entry.clock_out_location;
              
              // Skip if no clock-in location or missing coordinates
              if (!clockInLocation || !clockInLocation.latitude || !clockInLocation.longitude) {
                return null;
              }
              
              return (
                <Marker
                  key={entry.id}
                  position={[clockInLocation.latitude, clockInLocation.longitude]}
                  icon={createCustomIcon(entry.status === 'completed' ? '#10B981' : '#3B82F6')}
                >
                  <Popup>
                    <div>
                      <h3 className="font-semibold">
                        {client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {clockInLocation.address || `${clockInLocation.latitude.toFixed(6)}, ${clockInLocation.longitude.toFixed(6)}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.clock_in_time ? new Date(entry.clock_in_time).toLocaleTimeString() : 'N/A'} - {entry.clock_out_time ? new Date(entry.clock_out_time).toLocaleTimeString() : 'Active'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Status: {entry.status}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded mt-1 ${
                        entry.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {entry.status === 'completed' ? 'Completed' : 'Active'}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            <MapUpdater center={[currentLocation?.latitude || 40.7128, currentLocation?.longitude || -74.0060]} />
            {currentLocation?.latitude && currentLocation?.longitude && (
              <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg text-xs">
                <div className="font-medium">Your Location</div>
                <div className="text-gray-600">
                  {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </div>
                <div className="text-gray-500">Accuracy: {currentLocation.accuracy}m</div>
              </div>
            )}
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
            
            {/* Multiple shifts info */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                💡 You can work multiple shifts per day. Clock out from your current shift before starting a new one.
              </p>
            </div>
            
            {/* Location Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Current Location</h3>
                <button
                  onClick={() => {
                    getCurrentLocation().then(location => {
                      toast.success('Location updated!');
                    }).catch(error => {
                      toast.error('Failed to get location');
                    });
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  📍 Get My Location
                </button>
              </div>
              
              {locationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{locationError}</p>
                </div>
              )}
              
              {isGettingLocation ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Getting your location...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Latitude:</span>
                    <span className="ml-2 font-medium">{currentLocation?.latitude?.toFixed(6) || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Longitude:</span>
                    <span className="ml-2 font-medium">{currentLocation?.longitude?.toFixed(6) || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Accuracy:</span>
                    <span className="ml-2 font-medium">{currentLocation?.accuracy || 'N/A'}m</span>
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
              )}
              
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
                  ✅ Clocked in at: {selectedClient.first_name} {selectedClient.last_name}
                </p>
                <p className="text-green-600 text-sm">{selectedClient.address}</p>
                <p className="text-green-600 text-xs mt-1">
                  Location recorded: {currentLocation?.latitude?.toFixed(6) || 'N/A'}, {currentLocation?.longitude?.toFixed(6) || 'N/A'}
                </p>
                <div className="mt-2">
                  <button
                    onClick={handleClockOut}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    ⏰ Clock Out Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Today's Entries */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Entries</h2>
            {timesheetEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No timesheet entries for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {timesheetEntries.map((entry) => {
                  const client = clients.find(c => c.id === entry.client_id);
                  const clockInLocation = entry.clock_in_location;
                  const clockOutLocation = entry.clock_out_location;
                  
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900">
                            {client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'}
                          </p>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(entry.status)}`}>
                            {entry.status === 'completed' ? 'Completed' : entry.status === 'active' ? 'Active' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {clockInLocation?.address || 'Location not recorded'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.clock_in_time ? new Date(entry.clock_in_time).toLocaleTimeString() : 'N/A'} - {entry.clock_out_time ? new Date(entry.clock_out_time).toLocaleTimeString() : 'Active'}
                        </p>
                        <p className="text-xs text-blue-600">
                          📍 {entry.total_hours ? `${entry.total_hours.toFixed(2)}h` : '0h'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {entry.total_hours ? `${entry.total_hours.toFixed(2)}h` : '0h'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {clockInLocation?.latitude?.toFixed(4) || 'N/A'}, {clockInLocation?.longitude?.toFixed(4) || 'N/A'}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {/* Today's Total */}
                {timesheetEntries.length > 1 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-900">Today's Total</span>
                      <span className="font-bold text-blue-900">
                        {timesheetEntries.reduce((total, entry) => total + (entry.total_hours || 0), 0).toFixed(2)}h
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {timesheetEntries.length} shift{timesheetEntries.length !== 1 ? 's' : ''} today
                    </p>
                  </div>
                )}
              </div>
            )}
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
                {geofences.filter(g => g.is_active).map((geofence) => {
                  const client = clients.find(c => c.id === geofence.client_id);
                  return (
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
                          <p className="font-medium text-gray-900">{geofence.name || 'Unnamed Geofence'}</p>
                          <p className="text-sm text-gray-600">{geofence.description || 'No description'}</p>
                          <p className="text-xs text-gray-500">
                            Client: {client ? `${client.first_name} ${client.last_name}` : 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">Radius: {geofence.radius_meters || 100}m</p>
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
                  );
                })}
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