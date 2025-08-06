#!/usr/bin/env python3
"""
Test script with SSL certificate fixes
"""

import sys
import os
import ssl
import certifi

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Test the geocoding libraries with SSL fixes
try:
    from geopy.geocoders import Nominatim, ArcGIS, Photon
    from geopy.exc import GeocoderTimedOut, GeocoderUnavailable, GeocoderServiceError
    import time
    import random
    
    print("✅ Geocoding libraries imported successfully!")
    print("🔒 SSL certificate verification enabled")
    print("=" * 50)
    
    def test_geocoding_with_ssl():
        """Test geocoding with proper SSL certificate handling"""
        
        problematic_address = "5007 water tank road haines city florida 33844"
        
        # Create SSL context that uses certifi
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        
        # Initialize providers with SSL context
        providers = [
            ("Nominatim", Nominatim(user_agent="test_app", ssl_context=ssl_context)),
            ("ArcGIS", ArcGIS(user_agent="test_app", ssl_context=ssl_context)),
            ("Photon", Photon(user_agent="test_app", ssl_context=ssl_context))
        ]
        
        print(f"Testing address: {problematic_address}")
        print()
        
        for provider_name, provider in providers:
            print(f"Testing {provider_name}...")
            try:
                # Add delay to avoid rate limiting
                time.sleep(1)
                
                location = provider.geocode(problematic_address, timeout=15)
                
                if location:
                    print(f"✅ {provider_name} SUCCESS!")
                    print(f"   Latitude: {location.latitude}")
                    print(f"   Longitude: {location.longitude}")
                    print(f"   Address: {location.address}")
                    print()
                else:
                    print(f"❌ {provider_name} FAILED - No results found")
                    print()
                    
            except (GeocoderTimedOut, GeocoderUnavailable, GeocoderServiceError) as e:
                print(f"❌ {provider_name} FAILED - Service error: {str(e)}")
                print()
            except Exception as e:
                print(f"❌ {provider_name} FAILED - Unexpected error: {str(e)}")
                print()
        
        # Test address variations
        print("Testing address variations...")
        print("=" * 50)
        
        variations = [
            "5007 Water Tank Rd, Haines City, FL 33844",
            "5007 Water Tank Road, Haines City, Florida 33844",
            "5007 Water Tank Rd, Haines City, FL",
            "Haines City, FL 33844",
            "5007 Water Tank Road, Haines City, Florida",
        ]
        
        for i, variation in enumerate(variations, 1):
            print(f"\nTrying variation {i}: {variation}")
            
            for provider_name, provider in providers:
                try:
                    time.sleep(0.5)  # Small delay
                    location = provider.geocode(variation, timeout=15)
                    
                    if location:
                        print(f"✅ {provider_name} SUCCESS!")
                        print(f"   Latitude: {location.latitude}")
                        print(f"   Longitude: {location.longitude}")
                        print(f"   Address: {location.address}")
                        break  # Found a result, try next variation
                    else:
                        print(f"❌ {provider_name} - No results")
                        
                except Exception as e:
                    print(f"❌ {provider_name} - Error: {str(e)}")
            
            print()
    
    # Run the test
    test_geocoding_with_ssl()
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please install the required packages:")
    print("pip install geopy certifi")
    print()
    print("Or activate your virtual environment and install:")
    print("source venv/bin/activate")
    print("pip install -r requirements.txt")
    
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    print("Please check your Python environment and dependencies.") 