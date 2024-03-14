import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

export default function App() {
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentHospitalIndex, setCurrentHospitalIndex] = useState(0);
  const [selectedMarker, setSelectedMarker] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);

      fetchHospitals(location.coords.latitude, location.coords.longitude);
    })();
  }, []);

  const fetchHospitals = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://lz4.overpass-api.de/api/interpreter?data=[out:json];node(around:7000,${latitude},${longitude})[amenity=hospital];out;`
      );
      const data = await response.json();
      setHospitals(data.elements);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const animateToMarker = (marker) => {
    if (mapRef.current && marker) {
      mapRef.current.animateToRegion(
        {
          latitude: marker.lat,
          longitude: marker.lon,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        1000
      );
      setSelectedMarker(marker);
    }
  };

  const handleGoToCurrentLocation = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        1000
      );
      setSelectedMarker(null); // Reset selected marker
    }
  };

  const handleGoToNextHospital = () => {
    if (currentHospitalIndex < hospitals.length - 1) {
      setCurrentHospitalIndex(currentHospitalIndex + 1);
      const hospital = hospitals[currentHospitalIndex + 1];
      animateToMarker(hospital);
    }
  };

  const handleGoToPreviousHospital = () => {
    if (currentHospitalIndex > 0) {
      setCurrentHospitalIndex(currentHospitalIndex - 1);
      const hospital = hospitals[currentHospitalIndex - 1];
      animateToMarker(hospital);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hospital Finder</Text>
      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="You are here"
              pinColor="blue"
              onPress={() => setSelectedMarker(null)} // Deselect when tapping current location marker
            />
          )}
          {hospitals.map((hospital, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: hospital.lat,
                longitude: hospital.lon,
              }}
              title={hospital.tags.name}
              pinColor="red"
              onPress={() => animateToMarker(hospital)}
            />
          ))}
        </MapView>
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleGoToCurrentLocation} style={styles.button}>
          <MaterialIcons name="my-location" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGoToPreviousHospital} style={styles.button}>
          <MaterialIcons name="navigate-before" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGoToNextHospital} style={styles.button}>
          <MaterialIcons name="navigate-next" size={24} color="black" />
        </TouchableOpacity>
      </View>
      {selectedMarker && (
        <View style={styles.markerTitleContainer}>
          <Text style={styles.markerTitle}>{selectedMarker.tags.name}</Text>
        </View>
      )}
      {errorMsg && <Text>{errorMsg}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    paddingVertical: 15,
    backgroundColor: 'rgba(240, 240, 240, 1)',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'white',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    elevation: 5,
  },
  markerTitleContainer: {
    position: 'absolute',
    bottom: 100,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  markerTitle: {
    fontWeight: 'bold',
  },
});