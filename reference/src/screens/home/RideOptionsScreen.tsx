import React, { useRef, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, ScrollView, Linking, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import polyline from '@mapbox/polyline';

const { width, height } = Dimensions.get('window');

// Add this at the top of the file or in a declarations.d.ts file if you have one
// declare module '@mapbox/polyline';

export default function RideOptionsScreen({ navigation, route }: any) {
  const [selected, setSelected] = useState('bike');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const snapPoints = useMemo(() => ['50%', '90%'], []);
  const [routeCoords, setRouteCoords] = useState([]);

  // Use params from navigation
  const pickup = route?.params?.pickup || { latitude: 17.444, longitude: 78.382, address: 'Pickup Location' };
  const drop = route?.params?.drop || { latitude: 17.4418, longitude: 78.38, address: 'Drop Location' };

  const mockVehicles = [
    { id: 1, latitude: 17.443, longitude: 78.381, heading: 45 },
    { id: 2, latitude: 17.442, longitude: 78.383, heading: 90 },
    { id: 3, latitude: 17.445, longitude: 78.384, heading: 120 },
    { id: 4, latitude: 17.440, longitude: 78.379, heading: 200 },
    { id: 5, latitude: 17.4435, longitude: 78.378, heading: 300 },
    // Add more for more icons
  ];

  const rideOptions = [
    {
      id: 'bike',
      icon: 'motorbike' as any,
      label: 'Bike',
      eta: '2 mins',
      dropTime: 'Drop 9:14 am',
      price: 33,
      tag: 'FASTEST',
      tagColor: '#22c55e',
    },
    {
      id: 'scooty',
      icon: 'scooter' as any,
      label: 'Electric Scooty',
      eta: '3 mins',
      dropTime: 'Drop 9:16 am',
      price: 35,
      tag: 'NEW',
      tagColor: '#3b82f6',
    },
    
  ];

  // Animated vehicle marker (rotation)
  const animatedMarkers = mockVehicles.map((v) => {
    const rotation = useSharedValue(v.heading);
    useEffect(() => {
      rotation.value = withTiming((v.heading + Math.random() * 30) % 360, { duration: 2000 });
    }, []);
    const style = useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.value}deg` }],
    }));
    return { ...v, style };
  });

  // Handlers
  const handleEditPickup = () => {
    // navigation.navigate('LocationSearch', { type: 'pickup' });
  };
  const handleEditDrop = () => {
    // navigation.navigate('LocationSearch', { type: 'drop' });
  };
  const handleBook = () => {
    // Get the selected ride option details
    const selectedRide = rideOptions.find(o => o.id === selected);
    
    navigation.navigate('FindingDriver', { 
      destination: {
        name: drop.address,
        latitude: drop.latitude,
        longitude: drop.longitude
      },
      estimate: {
        fare: selectedRide?.price || 0,
        distance: '2.5 km', // You can calculate this dynamically
        duration: '8 mins',  // You can calculate this dynamically
        eta: '5 mins' // Dummy eta for now
      },
      paymentMethod: 'Cash', // Default payment method
      driver: null // Will be set when driver is found
    });
  };

  // Fit map to route on mount
  useEffect(() => {
    if (mapRef.current && pickup && drop) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates([pickup, drop], {
          edgePadding: { top: 120, right: 60, bottom: 320, left: 60 },
          animated: true,
        });
      }, 500);
    }
  }, [pickup, drop]);

  useEffect(() => {
    const fetchRouteDirections = async () => {
      const apiKey = 'AIzaSyDHN3SH_ODlqnHcU9Blvv2pLpnDNkg03lU'; // <-- Replace with your actual API key
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.latitude},${pickup.longitude}&destination=${drop.latitude},${drop.longitude}&key=${apiKey}`;
      try {
        const response = await fetch(url);
        const json = await response.json();
        console.log('Directions API response:', json);
        if (json.routes && json.routes.length) {
          const points = polyline.decode(json.routes[0].overview_polyline.points);
          const coords = points.map((point: [number, number]) => ({ latitude: point[0], longitude: point[1] }));
          setRouteCoords(coords);
        } else {
          setRouteCoords([]);
        }
      } catch (error) {
        console.error('Error fetching directions:', error);
        setRouteCoords([]);
      }
    };
    fetchRouteDirections();
  }, [pickup, drop]);

  console.log('rideOptions:', rideOptions);

  return (
    <View style={styles.container}>
      {/* Map Section at the Top */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: (pickup.latitude + drop.latitude) / 2,
            longitude: (pickup.longitude + drop.longitude) / 2,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
        >
          {/* Render the real route */}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#222"
              strokeWidth={4}
            />
          )}
          {/* Pickup Marker */}
          <Marker coordinate={pickup} pinColor="green">
            <Ionicons name="location" size={32} color="#22c55e" />
          </Marker>
          {/* Drop Marker */}
          <Marker coordinate={drop} pinColor="red">
            <Ionicons name="location" size={32} color="#ef4444" />
          </Marker>
          {/* Animated Vehicle Markers */}
          {animatedMarkers.map((v) => (
            <Marker key={v.id} coordinate={v} anchor={{ x: 0.5, y: 0.5 }}>
              <Animated.View style={v.style}>
                <Image
                  source={require('../../../assets/images/iconAnimation1.png')}
                  style={{ width: 32, height: 32, resizeMode: 'contain' }}
                />
              </Animated.View>
            </Marker>
          ))}
        </MapView>
        {/* Chips overlay */}
        <View style={styles.chipContainer} pointerEvents="box-none">
          <View style={[styles.chip, { left: width * 0.25, top: 30 }]}> 
            <Text numberOfLines={1} style={styles.chipText}>{pickup.address}</Text>
            <TouchableOpacity onPress={handleEditPickup} style={styles.chipEdit}>
              <Ionicons name="pencil" size={16} color="#222" />
            </TouchableOpacity>
          </View>
          <View style={[styles.chip, { left: width * 0.55, top: 80 }]}> 
            <Text numberOfLines={1} style={styles.chipText}>{drop.address}</Text>
            <TouchableOpacity onPress={handleEditDrop} style={styles.chipEdit}>
              <Ionicons name="pencil" size={16} color="#222" />
            </TouchableOpacity>
          </View>
        </View>
       
      </View>
      {/* Bottom Sheet and rest of the UI */}
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#fff' }}>
        <View style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 16, maxHeight: height * 0.45 }}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.45 }}>
              {rideOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.rideOption,
                    selected === opt.id && styles.rideOptionSelected,
                    selected === opt.id && styles.rideOptionShadow,
                  ]}
                  onPress={() => setSelected(opt.id)}
                  activeOpacity={0.8}
                >
                  {/* Replace icon with logo */}
                  <Image
                    source={require('../../../assets/images/iconAnimation.jpg')}
                    style={{ width: 32, height: 32, marginRight: 16, resizeMode: 'contain' }}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <Text style={styles.rideLabel}>{opt.label}</Text>
                      {/* Person icon and seat count */}
                      <Ionicons name="person" size={16} color="#222" style={{ marginLeft: 6, marginRight: 2 }} />
                      <Text style={{ fontWeight: '600', color: '#222', fontSize: 14 }}>1</Text>
                    </View>
                    {/* Subtitle */}
                    {opt.id === 'bike' && <Text style={styles.rideSubtitle}>Quick Bike rides</Text>}
                    {opt.id === 'auto' && <Text style={styles.rideSubtitle}>Auto rickshaw rides</Text>}
                   
                    <Text style={styles.rideMeta}>{opt.eta} • {opt.dropTime}</Text>
                  </View>
                  {opt.tag && (
                    <View style={[styles.tag, { backgroundColor: opt.tagColor || '#fbbf24' }]}> 
                      <Text style={styles.tagText}>{opt.tag}</Text>
                    </View>
                  )}
                  <Text style={styles.ridePrice}>₹{opt.price}</Text>
                  {/* Checkmark for selected */}
                  {selected === opt.id && <Ionicons name="checkmark" size={22} color="#22c55e" style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16, marginTop: 8, marginBottom: 0, borderRadius: 1 }} />
          {/* Sticky Bar */}
          <View style={styles.stickyBar}>
            <TouchableOpacity
              style={[styles.stickyBtn, { flex: 1, borderRightWidth: 1, borderRightColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Payment')}
            >
              <Ionicons name="cash-outline" size={22} color="#222" style={{ marginRight: 8 }} />
              <Text style={styles.stickyBtnText}>Cash</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.stickyBtn, { flex: 1, alignItems: 'center', justifyContent: 'center' }]} activeOpacity={0.7}>
              <Ionicons name="pricetag-outline" size={22} color="#22c55e" style={{ marginRight: 8 }} />
              <Text style={[styles.stickyBtnText, { color: '#22c55e' }]}>% Offers</Text>
            </TouchableOpacity>
          </View>
          {/* Book Button - make sure this is OUTSIDE the ScrollView and stickyBar */}
          <TouchableOpacity style={styles.bookBtnFullGreen} onPress={handleBook} activeOpacity={0.85}>
            <Text style={styles.bookBtnTextFullGreen}>
              Book  {rideOptions.find(o => o.id === selected)?.label || 'ride'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapContainer: {
    width: '100%',
    height: '40%',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  chipContainer: { position: 'absolute', width: '100%', zIndex: 10 },
  chip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 120,
    maxWidth: 180,
  },
  chipText: { fontWeight: '600', color: '#222', flex: 1, marginRight: 8 },
  chipEdit: { padding: 4 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 80,
  },
  rideOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  rideOptionSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#e7fbe9',
    shadowOpacity: 0.10,
    elevation: 2,
  },
  rideOptionShadow: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
  },
  rideLabel: { fontWeight: '700', fontSize: 16, color: '#222' },
  rideMeta: { color: '#64748b', fontSize: 13, marginTop: 2 },
  ridePrice: { fontWeight: '700', fontSize: 18, color: '#222', marginLeft: 12 },
  tag: {
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  tagText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  stickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 10,
    marginTop: 0,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
  },
  stickyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  stickyBtnText: { fontWeight: '700', color: '#222', fontSize: 14 },
  bookBtnFullGreen: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  bookBtnTextFullGreen: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  addStopBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    zIndex: 10,
  },
  addStopBackBtn: { padding: 4 },
  addStopText: { fontWeight: '700', color: '#222', fontSize: 15, marginLeft: 8 },
  rideSubtitle: { color: '#64748b', fontSize: 13, marginTop: 2 },
  bottomAreaWrapper: { flex: 1, justifyContent: 'flex-end' },
}); 