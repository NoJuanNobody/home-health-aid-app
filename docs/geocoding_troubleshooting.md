# Geocoding Service Troubleshooting Guide

## Common Issues and Solutions

### 1. "Geocoding service unavailable" Error

**Problem**: The geocoding service returns "service unavailable" for certain addresses.

**Causes**:
- Rate limiting from geocoding providers
- Temporary service outages
- Poor address formatting
- Address not found in geocoding databases

**Solutions**:

#### A. Try Different Address Formats
Instead of: `5007 water tank road haines city florida 33844`
Try these variations:
- `5007 Water Tank Rd, Haines City, FL 33844`
- `5007 Water Tank Road, Haines City, Florida 33844`
- `5007 Water Tank Rd, Haines City, FL`
- `Haines City, FL 33844`

#### B. Use the Improved Service
The updated geocoding service now includes:
- **Multiple providers**: Nominatim, ArcGIS, and Photon
- **Retry logic**: Up to 3 attempts with exponential backoff
- **Address cleaning**: Automatic formatting improvements
- **Rate limiting protection**: Random delays between requests

#### C. Manual Coordinate Entry
If geocoding fails, you can:
1. Use Google Maps to find the coordinates manually
2. Enter the latitude and longitude directly
3. Use the GPS location button to get current coordinates

### 2. Rate Limiting Issues

**Problem**: Too many requests causing temporary blocks.

**Solutions**:
- Wait 1-2 minutes between requests
- Use the retry mechanism (built into the service)
- Consider implementing caching for frequently used addresses

### 3. Address Not Found

**Problem**: Valid address exists but geocoding fails.

**Solutions**:
- Try broader address (city + state instead of full street address)
- Use nearby landmarks or intersections
- Check if the address is in a rural area (may have limited coverage)
- Try alternative address formats

## Best Practices

### 1. Address Formatting
**Good formats**:
- `123 Main St, New York, NY 10001`
- `1600 Pennsylvania Ave NW, Washington, DC`
- `123 Main Street, New York, New York`

**Avoid**:
- All lowercase: `123 main st new york ny`
- Missing punctuation: `123 Main St New York NY`
- Abbreviated state names in wrong format

### 2. Using the Frontend
1. **Start with the full address**: Enter the complete address first
2. **Try variations**: If it fails, try different formats
3. **Use GPS fallback**: If geocoding fails, use the GPS location button
4. **Manual entry**: As a last resort, enter coordinates manually

### 3. API Usage
When using the API directly:

```javascript
// Good: Include retry parameters
const response = await api.post('/geolocation/geocode/address', {
  address: '5007 Water Tank Rd, Haines City, FL 33844',
  max_retries: 3,
  timeout: 15
});

// Handle errors gracefully
if (response.data.success) {
  // Use the coordinates
} else {
  // Try alternative address formats
}
```

## Testing Your Address

### 1. Use the Test Script
```bash
cd backend
python3 ../test_specific_address.py
```

### 2. Test Different Formats
Try these variations for your address:
- Full format: `5007 Water Tank Rd, Haines City, FL 33844`
- State abbreviation: `5007 Water Tank Rd, Haines City, Florida 33844`
- Without zip: `5007 Water Tank Rd, Haines City, FL`
- City only: `Haines City, FL 33844`

### 3. Check Provider Information
The service now shows which provider was used:
- `provider_1`: Nominatim (OpenStreetMap)
- `provider_2`: ArcGIS
- `provider_3`: Photon

## Getting Help

If you continue to have issues:

1. **Check the logs**: Look for detailed error messages in the backend logs
2. **Try manual coordinates**: Use Google Maps to find coordinates manually
3. **Report the issue**: Include the exact address and error message
4. **Use alternative services**: Consider using Google Maps API for critical addresses

## SSL Certificate Issues (macOS)

If you encounter SSL certificate verification errors:

**Symptoms**:
- `SSLCertVerificationError: certificate verify failed`
- All geocoding providers failing with SSL errors

**Solution**:
The geocoding service now includes automatic SSL certificate handling using `certifi`. Make sure you have the latest version:

```bash
pip install certifi
```

The service automatically uses the proper SSL context for all geocoding providers.

## Service Providers

The geocoding service uses multiple providers for redundancy:

1. **Nominatim** (OpenStreetMap): Free, good coverage, rate limited
2. **ArcGIS**: Good coverage, more generous limits
3. **Photon**: Fast, good for international addresses

If one provider fails, the service automatically tries the next one. 