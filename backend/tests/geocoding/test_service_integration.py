#!/usr/bin/env python3
"""
Simple test script for the geocoding service
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.geolocation.geocoding_service import geocoding_service

def test_geocoding():
    """Test the geocoding service with a sample address"""
    
    print("Testing Geocoding Service...")
    print("=" * 50)
    
    # Test address to coordinates
    test_address = "1600 Pennsylvania Avenue NW, Washington, DC"
    print(f"Testing address: {test_address}")
    
    result = geocoding_service.address_to_coordinates(test_address)
    
    if result:
        print("✅ Address to coordinates successful!")
        print(f"   Latitude: {result['latitude']}")
        print(f"   Longitude: {result['longitude']}")
        print(f"   Formatted Address: {result['formatted_address']}")
    else:
        print("❌ Address to coordinates failed!")
    
    print("\n" + "=" * 50)
    
    # Test reverse geocoding
    if result:
        print("Testing reverse geocoding...")
        reverse_result = geocoding_service.coordinates_to_address(
            result['latitude'], 
            result['longitude']
        )
        
        if reverse_result:
            print("✅ Reverse geocoding successful!")
            print(f"   Address: {reverse_result['formatted_address']}")
        else:
            print("❌ Reverse geocoding failed!")
    
    print("\n" + "=" * 50)
    
    # Test coordinate validation
    print("Testing coordinate validation...")
    valid_coords = geocoding_service.validate_coordinates(40.7128, -74.0060)
    invalid_coords = geocoding_service.validate_coordinates(200, 300)
    
    print(f"   Valid coordinates (40.7128, -74.0060): {valid_coords}")
    print(f"   Invalid coordinates (200, 300): {invalid_coords}")
    
    print("\n" + "=" * 50)
    
    # Test distance calculation
    if result:
        print("Testing distance calculation...")
        distance = geocoding_service.get_distance_between_points(
            40.7128, -74.0060,  # New York
            result['latitude'], result['longitude']  # Washington DC
        )
        
        if distance:
            print(f"   Distance from NY to DC: {distance:.2f} meters ({distance/1000:.2f} km)")
        else:
            print("❌ Distance calculation failed!")

if __name__ == "__main__":
    test_geocoding() 