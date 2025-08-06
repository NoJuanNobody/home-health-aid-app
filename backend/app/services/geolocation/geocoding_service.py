from geopy.geocoders import Nominatim, ArcGIS, Photon
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable, GeocoderServiceError
import logging
import time
import random
import ssl
import certifi

logger = logging.getLogger(__name__)

class GeocodingService:
    """Service for converting addresses to coordinates and vice versa"""
    
    def __init__(self, user_agent="home_health_aid_app"):
        # Create SSL context that uses certifi for certificate verification
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        
        # Initialize multiple geocoding providers for fallback
        self.providers = [
            Nominatim(user_agent=user_agent, ssl_context=ssl_context),
            ArcGIS(user_agent=user_agent, ssl_context=ssl_context),
            Photon(user_agent=user_agent, ssl_context=ssl_context)
        ]
        self.current_provider_index = 0
    
    def address_to_coordinates(self, address, timeout=10, max_retries=3):
        """
        Convert an address to latitude and longitude coordinates with retry logic
        
        Args:
            address (str): The address to geocode
            timeout (int): Timeout in seconds
            max_retries (int): Maximum number of retry attempts
            
        Returns:
            dict: Dictionary with 'latitude', 'longitude', and 'formatted_address' keys
                 or None if geocoding fails
        """
        # Clean and normalize the address
        cleaned_address = self._clean_address(address)
        
        for attempt in range(max_retries):
            for provider_index, provider in enumerate(self.providers):
                try:
                    logger.info(f"Attempting geocoding with provider {provider_index + 1} (attempt {attempt + 1})")
                    
                    # Add random delay to avoid rate limiting
                    if attempt > 0:
                        time.sleep(random.uniform(1, 3))
                    
                    location = provider.geocode(cleaned_address, timeout=timeout)
                    
                    if location:
                        result = {
                            'latitude': location.latitude,
                            'longitude': location.longitude,
                            'formatted_address': location.address,
                            'raw': location.raw,
                            'provider': f"provider_{provider_index + 1}"
                        }
                        logger.info(f"Successfully geocoded address with provider {provider_index + 1}")
                        return result
                        
                except (GeocoderTimedOut, GeocoderUnavailable, GeocoderServiceError) as e:
                    logger.warning(f"Provider {provider_index + 1} failed for address '{address}': {str(e)}")
                    continue
                except Exception as e:
                    logger.error(f"Unexpected error with provider {provider_index + 1}: {str(e)}")
                    continue
            
            # If all providers failed, wait before retry
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2  # Exponential backoff
                logger.info(f"All providers failed, waiting {wait_time} seconds before retry")
                time.sleep(wait_time)
        
        logger.error(f"All geocoding attempts failed for address: {address}")
        return None
    
    def _clean_address(self, address):
        """
        Clean and normalize address for better geocoding results
        
        Args:
            address (str): Raw address string
            
        Returns:
            str: Cleaned address string
        """
        if not address:
            return address
        
        # Remove extra whitespace
        cleaned = ' '.join(address.split())
        
        # Common address improvements
        replacements = {
            'road': 'rd',
            'street': 'st',
            'avenue': 'ave',
            'boulevard': 'blvd',
            'drive': 'dr',
            'lane': 'ln',
            'circle': 'cir',
            'court': 'ct',
            'place': 'pl',
            'terrace': 'ter',
            'highway': 'hwy',
            'parkway': 'pkwy'
        }
        
        for full, abbrev in replacements.items():
            # Replace full words only (not parts of words)
            cleaned = cleaned.replace(f' {full} ', f' {abbrev} ')
            cleaned = cleaned.replace(f' {full}.', f' {abbrev}.')
            cleaned = cleaned.replace(f' {full},', f' {abbrev},')
        
        return cleaned
    
    def coordinates_to_address(self, latitude, longitude, timeout=10, max_retries=3):
        """
        Convert coordinates to a formatted address (reverse geocoding) with retry logic
        
        Args:
            latitude (float): Latitude coordinate
            longitude (float): Longitude coordinate
            timeout (int): Timeout in seconds
            max_retries (int): Maximum number of retry attempts
            
        Returns:
            dict: Dictionary with 'formatted_address' and 'raw' keys
                 or None if reverse geocoding fails
        """
        for attempt in range(max_retries):
            for provider_index, provider in enumerate(self.providers):
                try:
                    logger.info(f"Attempting reverse geocoding with provider {provider_index + 1} (attempt {attempt + 1})")
                    
                    # Add random delay to avoid rate limiting
                    if attempt > 0:
                        time.sleep(random.uniform(1, 3))
                    
                    location = provider.reverse(f"{latitude}, {longitude}", timeout=timeout)
                    
                    if location:
                        result = {
                            'formatted_address': location.address,
                            'raw': location.raw,
                            'provider': f"provider_{provider_index + 1}"
                        }
                        logger.info(f"Successfully reverse geocoded coordinates with provider {provider_index + 1}")
                        return result
                        
                except (GeocoderTimedOut, GeocoderUnavailable, GeocoderServiceError) as e:
                    logger.warning(f"Provider {provider_index + 1} failed for reverse geocoding: {str(e)}")
                    continue
                except Exception as e:
                    logger.error(f"Unexpected error with provider {provider_index + 1}: {str(e)}")
                    continue
            
            # If all providers failed, wait before retry
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2  # Exponential backoff
                logger.info(f"All providers failed for reverse geocoding, waiting {wait_time} seconds before retry")
                time.sleep(wait_time)
        
        logger.error(f"All reverse geocoding attempts failed for coordinates: {latitude}, {longitude}")
        return None
    
    def validate_coordinates(self, latitude, longitude):
        """
        Validate if coordinates are within valid ranges
        
        Args:
            latitude (float): Latitude coordinate
            longitude (float): Longitude coordinate
            
        Returns:
            bool: True if coordinates are valid, False otherwise
        """
        try:
            lat = float(latitude)
            lng = float(longitude)
            
            # Check if coordinates are within valid ranges
            if -90 <= lat <= 90 and -180 <= lng <= 180:
                return True
            else:
                return False
        except (ValueError, TypeError):
            return False
    
    def get_distance_between_points(self, lat1, lon1, lat2, lon2):
        """
        Calculate distance between two points in meters
        
        Args:
            lat1, lon1: First point coordinates
            lat2, lon2: Second point coordinates
            
        Returns:
            float: Distance in meters
        """
        try:
            from geopy.distance import geodesic
            point1 = (lat1, lon1)
            point2 = (lat2, lon2)
            return geodesic(point1, point2).meters
        except Exception as e:
            logger.error(f"Error calculating distance: {str(e)}")
            return None

# Global instance for easy access
geocoding_service = GeocodingService() 