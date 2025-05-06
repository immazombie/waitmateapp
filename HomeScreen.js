import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
  FlatList,
  Image,
  Easing,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
  Slider,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from './supabase';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from './Components/GradientBackground';
import axios from 'axios';
import { Circle } from 'react-native-maps';
import * as Location from 'expo-location';

const screenWidth = Dimensions.get('window').width;
const defaultImage = 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=60';

const GlowingPin = ({ source }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image source={source} style={{ width: 36, height: 36 }} resizeMode="contain" />
    </Animated.View>
  );
};

const RenderCard = ({ item }) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Restaurant', { restaurant: item })}
    >
      <Image source={{ uri: item.image_url || defaultImage }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>{item.food_type || 'Type not set'}</Text>
        <Text style={styles.sub}>🍽 Dine In: {item.dine_in_wait ?? 'N/A'} min</Text>
        <Text style={styles.sub}>🥡 Take Out: {item.take_out_wait ?? 'N/A'} min</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const MILES_TO_METERS = 1609;
  const [radiusInMiles, setRadiusInMiles] = useState(1);
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    diningType: '',
    sortOrder: '',
  });
  const [mapRegion, setMapRegion] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const mapRef = useRef(null);
  
  const getPinImage = (restaurant) => {
    const waitTime = restaurant.dine_in_wait ?? restaurant.take_out_wait;
    if (waitTime > 15) return require('./assets/redpin.png');
    if (waitTime <= 10) return require('./assets/greenpin.png');
    return require('./assets/yellowpin.png');
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      console.log('Got location:', location);
      setUserLocation(location.coords);
      
      // Initialize map region based on user location
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  // Update map region when radius changes
  useEffect(() => {
    if (userLocation && mapRef.current) {
      // Calculate appropriate delta values based on radius
      // This is a rough approximation - you may need to adjust
      const latDelta = radiusInMiles * 0.018;
      const longDelta = radiusInMiles * 0.018;
      
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: latDelta,
        longitudeDelta: longDelta,
      };
      
      mapRef.current.animateToRegion(newRegion, 300);
      setMapRegion(newRegion);
    }
  }, [radiusInMiles, userLocation]);

  const fetchRestaurants = async () => {
    const { data: waitData, error: waitError } = await supabase
      .from('wait_times')
      .select('*')
      .gte('submitted_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

    if (waitError) return console.error('Wait time fetch error:', waitError);

    const averages = {};
    waitData.forEach((entry) => {
      const key = `${entry.restaurant_id}-${entry.visit_type}`;
      if (!averages[key]) averages[key] = { total: 0, count: 0 };
      averages[key].total += entry.wait_time;
      averages[key].count += 1;
    });

    const { data: restaurantsData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*');

    if (restaurantError) return console.error('Restaurant fetch error:', restaurantError);

    const enriched = restaurantsData.map((r) => {
      const dineKey = `${r.id}-Dine In`;
      const takeKey = `${r.id}-Take Out`;
      return {
        ...r,
        dine_in_wait: averages[dineKey]
          ? Math.round(averages[dineKey].total / averages[dineKey].count)
          : null,
        take_out_wait: averages[takeKey]
          ? Math.round(averages[takeKey].total / averages[takeKey].count)
          : null,
      };
    });

    let filtered = enriched.filter((r) => {
      if (filterOptions.diningType === 'Dine In' && r.dine_in_wait == null) return false;
      if (filterOptions.diningType === 'Take Out' && r.take_out_wait == null) return false;
      return true;
    });

    if (filterOptions.sortOrder === 'Shortest Wait') {
      filtered.sort((a, b) => {
        const aWait = filterOptions.diningType === 'Take Out' ? a.take_out_wait : a.dine_in_wait;
        const bWait = filterOptions.diningType === 'Take Out' ? b.take_out_wait : b.dine_in_wait;
        return (aWait ?? Infinity) - (bWait ?? Infinity);
      });
    } else if (filterOptions.sortOrder === 'Longest Wait') {
      filtered.sort((a, b) => {
        const aWait = filterOptions.diningType === 'Take Out' ? a.take_out_wait : a.dine_in_wait;
        const bWait = filterOptions.diningType === 'Take Out' ? b.take_out_wait : b.dine_in_wait;
        return (bWait ?? 0) - (aWait ?? 0);
      });
    }

    console.log('Filter options:', filterOptions);
    console.log('Filtered restaurants:', filtered.map(r => ({
      name: r.name,
      dine: r.dine_in_wait,
      take: r.take_out_wait,
    })));

    setRestaurants(filtered);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const fetchNearbyRestaurants = async () => {
    try {
      const res = await axios.get('http://192.168.50.48:8000/restaurants-nearby', {
        timeout: 10000, // 10 seconds
        params: {
          lat: userLocation.latitude,
          lon: userLocation.longitude,
          radius: radiusInMiles  // Use the current radius value
        }
      });
      console.log('Nearby restaurants:', res.data);
      setRestaurants(res.data.restaurants);
      // Close the radius modal after fetching
      setShowRadiusModal(false);
      
      // Provide feedback with haptics
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Error fetching nearby restaurants:', err.message);
      Alert.alert('Oops', 'Could not fetch nearby restaurants.');
      
      // Provide feedback with haptics
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRestaurants();
    }, [filterOptions])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRestaurants();
    setRefreshing(false);
  };

  const RadiusModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showRadiusModal}
      onRequestClose={() => setShowRadiusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Adjust Search Radius</Text>
          
          <Text style={styles.radiusText}>{radiusInMiles} mile{radiusInMiles !== 1 ? 's' : ''}</Text>
          
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={10}
            step={0.5}
            value={radiusInMiles}
            onValueChange={setRadiusInMiles}
            minimumTrackTintColor="#007BFF"
            maximumTrackTintColor="#DDDDDD"
            thumbTintColor="#007BFF"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: '#f44336' }]}
              onPress={() => setShowRadiusModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: '#28a745' }]}
              onPress={fetchNearbyRestaurants}
            >
              <Text style={styles.modalButtonText}>Find Restaurants</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  console.log('userLocation:', userLocation);
  if (!userLocation) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18 }}>📍 Fetching location...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        <RadiusModal />

        <LinearGradient colors={['#FFD6C0', '#C6E6FF']} style={styles.header}>
          <Text style={styles.title}>🍽️ WaitMate</Text>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Text style={styles.menu}>☰</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search restaurants..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
          />
          <TouchableOpacity onPress={() => setShowFilter((prev) => !prev)} style={styles.filterButton}>
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {showFilter && (
          <View style={styles.filterDropdown}>
            <Text style={styles.filterLabel}>Dining Type</Text>
            <View style={styles.filterRow}>
              {['All', 'Dine In', 'Take Out'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOption,
                    filterOptions.diningType === option && styles.selectedOption,
                  ]}
                  onPress={() =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      diningType: option === 'All' ? '' : option,
                    }))
                  }
                >
                  <Text style={styles.filterOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Sort Order</Text>
            <View style={styles.filterRow}>
              {['Shortest Wait', 'Longest Wait'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOption,
                    filterOptions.sortOrder === option && styles.selectedOption,
                  ]}
                  onPress={() => {
                    setFilterOptions((prev) => ({
                      ...prev,
                      sortOrder: prev.sortOrder === option ? '' : option,
                    }));
                    fetchRestaurants();
                  }}
                >
                  <Text style={styles.filterOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setShowRadiusModal(true)}
              style={{
                marginTop: 6,
                padding: 12,
                backgroundColor: '#28a745',
                borderRadius: 10,
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                📍 Find Nearby Restaurants
              </Text>
            </TouchableOpacity>
          </View>
        )}


        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            region={mapRegion}
          >
            {userLocation?.latitude && (
              <Circle
                center={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                radius={radiusInMiles * MILES_TO_METERS}
                strokeColor="rgba(0,122,255,0.5)"
                fillColor="rgba(0,122,255,0.2)"
              />
            )}

            {restaurants.map((r, index) => (
              <Marker
                key={index}
                coordinate={{ latitude: r.latitude, longitude: r.longitude }}
                onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
              >
                <GlowingPin source={getPinImage(r)} />
              </Marker>
            ))}
          </MapView>

          <View style={styles.radiusControl}>
            <Text style={{ textAlign: 'center', color: '#555', marginBottom: 4 }}>
              Showing a {radiusInMiles}-mile radius
            </Text>
            <TouchableOpacity 
              style={styles.radiusButton}
              onPress={() => setShowRadiusModal(true)}
            >
              <Text style={styles.radiusButtonText}>Adjust Radius</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <FlatList
            data={restaurants}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <RenderCard item={item} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ padding: 16 }}
          />
        </Animated.View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FAFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  menu: {
    fontSize: 24,
    color: '#333',
  },
  searchBar: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 12,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 10,
  },
  mapContainer: {
    height: 300,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
  },
  radiusControl: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 8,
    borderRadius: 8,
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    alignItems: 'center',
  },
  radiusButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  radiusButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#ffffffee',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 3,
  },
  image: {
    width: screenWidth - 32,
    height: 140,
    resizeMode: 'cover',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
  },
  sub: {
    fontSize: 14,
    color: '#666',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    borderColor: '#ddd',
    borderWidth: 1,
    marginRight: 8,
  },
  filterButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 10,
  },
  filterText: {
    color: '#fff',
    fontSize: 16,
  },
  filterDropdown: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 12,
    width: '100%',
  },
  filterOption: {
    backgroundColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
  },
  selectedOption: {
    backgroundColor: '#007BFF',
  },
  filterOptionText: {
    color: '#333',
  },
  filterLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  radiusText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
    color: '#007BFF',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});