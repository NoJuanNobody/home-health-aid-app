import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Component to update map view when center/zoom changes
const MapUpdater = ({ center, zoomLevel }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoomLevel ?? map.getZoom());
    }
  }, [center, zoomLevel, map]);
  
  return null;
};

const LocationMap = ({
  height = '400px',
  center = [40.7128, -74.0060],
  zoom = 13,
  currentLocation = null,
  geofences = [],
  timesheetEntries = [],
  clients = [],
  showCurrentLocation = true,
  showGeofences = true,
  showTimesheetEntries = true,
  onMapClick = null,
  className = '',
  mapRef = null,
  highlightGeofenceId = null
}) => {
  const internalMapRef = useRef(null);
  const mapRefToUse = mapRef || internalMapRef;

  return (
    <div className={`rounded-lg overflow-hidden relative ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRefToUse}
        onClick={onMapClick}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Current Location Marker */}
        {showCurrentLocation && currentLocation?.latitude && currentLocation?.longitude && (
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
                {currentLocation.accuracy && (
                  <p className="text-xs text-gray-500">Accuracy: {currentLocation.accuracy}m</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Geofence Circles */}
        {showGeofences && geofences.map((geofence) => {
          if (!geofence.is_active || !geofence.center_latitude || !geofence.center_longitude) {
            return null;
          }
          
          const isHighlighted = highlightGeofenceId && geofence.id === highlightGeofenceId;
          const client = clients.find(c => c.id === geofence.client_id);
          return (
            <Circle
              key={geofence.id}
              center={[geofence.center_latitude, geofence.center_longitude]}
              radius={geofence.radius_meters || 100}
              pathOptions={{
                color: isHighlighted ? '#ef4444' : (geofence.isInside ? '#10B981' : '#6B7280'),
                fillColor: isHighlighted ? '#fecaca' : (geofence.isInside ? '#10B981' : '#6B7280'),
                fillOpacity: isHighlighted ? 0.25 : 0.2,
                weight: isHighlighted ? 3 : 2
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
                  {geofence.isInside !== undefined && (
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded mt-1 ${
                      geofence.isInside
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {geofence.isInside ? 'Inside' : 'Outside'}
                    </span>
                  )}
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* Timesheet Entry Markers */}
        {showTimesheetEntries && timesheetEntries.map((entry) => {
          const client = clients.find(c => c.id === entry.client_id);
          const clockInLocation = entry.clock_in_location;
          
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

        <MapUpdater center={center} zoomLevel={zoom} />
      </MapContainer>

      {/* Current Location Info Overlay */}
      {showCurrentLocation && currentLocation?.latitude && currentLocation?.longitude && (
        <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg text-xs">
          <div className="font-medium">Your Location</div>
          <div className="text-gray-600">
            {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </div>
          {currentLocation.accuracy && (
            <div className="text-gray-500">Accuracy: {currentLocation.accuracy}m</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationMap;
