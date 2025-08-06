# Geocoding Service

The geocoding service provides functionality to convert addresses to coordinates and vice versa, as well as calculate distances between points.

## Features

- **Forward Geocoding**: Convert addresses to latitude/longitude coordinates
- **Reverse Geocoding**: Convert coordinates to formatted addresses
- **Coordinate Validation**: Validate coordinate ranges
- **Distance Calculation**: Calculate distances between two points
- **Error Handling**: Comprehensive error handling with logging

## API Endpoints

### Convert Address to Coordinates

**POST** `/api/geolocation/geocode/address`

Convert an address to coordinates.

**Request Body:**
```json
{
  "address": "1600 Pennsylvania Avenue NW, Washington, DC",
  "timeout": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "latitude": 38.8977,
    "longitude": -77.0365,
    "formatted_address": "1600 Pennsylvania Avenue Northwest, Washington, DC 20500, USA",
    "raw": { ... }
  }
}
```

### Convert Coordinates to Address

**POST** `/api/geolocation/geocode/coordinates`

Convert coordinates to a formatted address.

**Request Body:**
```json
{
  "latitude": 38.8977,
  "longitude": -77.0365,
  "timeout": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "formatted_address": "1600 Pennsylvania Avenue Northwest, Washington, DC 20500, USA",
    "raw": { ... }
  }
}
```

### Calculate Distance Between Points

**POST** `/api/geolocation/geocode/distance`

Calculate the distance between two coordinate points.

**Request Body:**
```json
{
  "lat1": 40.7128,
  "lon1": -74.0060,
  "lat2": 38.8977,
  "lon2": -77.0365
}
```

**Response:**
```json
{
  "success": true,
  "distance_meters": 328000.0,
  "distance_km": 328.0
}
```

## Frontend Integration

The geolocation management page now includes an address lookup feature:

1. **Address Input**: Enter an address in the "Address Lookup" field
2. **Automatic Geocoding**: Click the search button or press Enter
3. **Coordinate Population**: The latitude and longitude fields are automatically populated
4. **Description Update**: The formatted address is added to the description field

## Usage Examples

### Python Service Usage

```python
from app.services.geolocation.geocoding_service import geocoding_service

# Convert address to coordinates
result = geocoding_service.address_to_coordinates("123 Main St, New York, NY")
if result:
    print(f"Latitude: {result['latitude']}")
    print(f"Longitude: {result['longitude']}")

# Convert coordinates to address
address = geocoding_service.coordinates_to_address(40.7128, -74.0060)
if address:
    print(f"Address: {address['formatted_address']}")

# Calculate distance
distance = geocoding_service.get_distance_between_points(
    40.7128, -74.0060,  # Point 1
    38.8977, -77.0365   # Point 2
)
print(f"Distance: {distance} meters")

# Validate coordinates
is_valid = geocoding_service.validate_coordinates(40.7128, -74.0060)
print(f"Valid coordinates: {is_valid}")
```

### JavaScript/React Usage

```javascript
// Convert address to coordinates
const geocodeAddress = async (address) => {
  try {
    const response = await api.post('/geolocation/geocode/address', {
      address: address
    });
    
    if (response.data.success) {
      const { latitude, longitude, formatted_address } = response.data.data;
      return { latitude, longitude, formatted_address };
    }
  } catch (error) {
    console.error('Geocoding failed:', error);
  }
};

// Calculate distance
const calculateDistance = async (lat1, lon1, lat2, lon2) => {
  try {
    const response = await api.post('/geolocation/geocode/distance', {
      lat1, lon1, lat2, lon2
    });
    
    if (response.data.success) {
      return {
        meters: response.data.distance_meters,
        kilometers: response.data.distance_km
      };
    }
  } catch (error) {
    console.error('Distance calculation failed:', error);
  }
};
```

## Dependencies

The service uses the following libraries:
- `geopy==2.4.0`: For geocoding functionality
- `geocoder==1.38.1`: Additional geocoding capabilities

## Error Handling

The service includes comprehensive error handling:

- **Timeout Errors**: When geocoding requests take too long
- **Service Unavailable**: When the geocoding service is down
- **Invalid Coordinates**: When coordinates are outside valid ranges
- **Address Not Found**: When an address cannot be geocoded

## Rate Limiting

The service uses Nominatim (OpenStreetMap) which has rate limiting:
- Maximum 1 request per second
- Recommended to implement caching for frequently used addresses

## Testing

Run the test script to verify the service works:

```bash
cd backend
python ../test_geocoding.py
```

## Notes

- The service uses Nominatim (OpenStreetMap) as the geocoding provider
- Results may vary based on the quality of the address provided
- International addresses are supported
- The service includes automatic retry logic for transient failures 