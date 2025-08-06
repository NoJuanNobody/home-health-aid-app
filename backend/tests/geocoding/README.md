# Geocoding Service Tests

This directory contains test files for the geocoding service functionality.

## Test Files

### `test_providers_ssl.py`
**Purpose**: Test all geocoding providers with SSL certificate handling
**What it tests**:
- All three geocoding providers (Nominatim, ArcGIS, Photon)
- SSL certificate verification
- Address variations and fallback logic
- Specific problematic addresses

**Usage**:
```bash
cd backend
python3 tests/geocoding/test_providers_ssl.py
```

**Use case**: When you need to debug geocoding issues or test specific addresses

### `test_service_integration.py`
**Purpose**: Test the full geocoding service integration
**What it tests**:
- Address to coordinates conversion
- Reverse geocoding (coordinates to address)
- Coordinate validation
- Distance calculations
- Full service workflow

**Usage**:
```bash
cd backend
python3 tests/geocoding/test_service_integration.py
```

**Use case**: When you want to verify the entire geocoding service works correctly

## Running Tests

### Prerequisites
Make sure you have the required packages installed:
```bash
pip install geopy certifi
```

### Quick Test
To quickly test if geocoding works:
```bash
cd backend
python3 tests/geocoding/test_providers_ssl.py
```

### Full Service Test
To test the complete geocoding service:
```bash
cd backend
python3 tests/geocoding/test_service_integration.py
```

## Troubleshooting

### SSL Certificate Issues
If you get SSL certificate errors:
1. Make sure `certifi` is installed: `pip install certifi`
2. The test files include SSL certificate handling
3. Check your Python environment and certificates

### Import Errors
If you get import errors:
1. Make sure you're in the backend directory
2. Install requirements: `pip install -r requirements.txt`
3. Activate virtual environment if using one

### Rate Limiting
The tests include delays to avoid rate limiting. If you get rate limit errors:
1. Wait a few minutes before running tests again
2. The service includes retry logic for production use

## Test Results

Expected output from `test_providers_ssl.py`:
```
✅ Geocoding libraries imported successfully!
🔒 SSL certificate verification enabled
==================================================
Testing address: 5007 water tank road haines city florida 33844

Testing Nominatim...
❌ Nominatim FAILED - No results found

Testing ArcGIS...
✅ ArcGIS SUCCESS!
   Latitude: 28.049308493756
   Longitude: -81.58824019208
   Address: 5007 Water Tank Rd, Haines City, Florida, 33844
```

This shows that:
- SSL certificate handling works
- ArcGIS provider successfully geocodes the address
- Multiple providers provide fallback options 