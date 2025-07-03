import React, { useRef, useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const PRIMARY_GREEN = '#219C7E';
const TITLE_COLOR = '#111827';
const SUBTITLE_COLOR = '#6B7280';

const screens = [
  {
    key: 'booking',
    illustration: (
      <View style={{ width: 300, height: 300, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Image source={require('../../../assets/images/Mainlogo.jpeg')} style={{ width: 270, height: 270, resizeMode: 'contain' }} />
      </View>
    ),
    title: 'Welcome to ROQET',
    subtitle: "Start your journey with ease. ROQET makes booking bike taxis simple, fast, and reliable.",
  },
  {
    key: 'affordable',
    illustration: (
      <View style={{ width: 300, height: 300, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Image source={require('../../../assets/images/Grow.jpg.jpeg')} style={{ width: 270, height: 270, resizeMode: 'contain' }} />
      </View>
    ),
    title: 'Ride Smart Earn More',
    subtitle: "Maximize your earnings with every ride. Flexible hours and smarter routes help you grow your income.",
  },
  {
    key: 'safe',
    illustration: (
      <View style={{ width: 300, height: 300, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Image source={require('../../../assets/images/Bossimage.jpg.jpeg')} style={{ width: 270, height: 270, resizeMode: 'contain' }} />
      </View>
    ),
    title: 'Be your own boss with ROQET',
    subtitle:"Drive on your terms, set your schedule, and earn at your convenience—all with full support from ROQET.",
  },
  {
    key: 'eco',
    illustration: (
      <View style={{ width: 300, height: 300, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Image source={require('../../../assets/images/Community.jpg.jpeg')} style={{ width: 270, height: 270, resizeMode: 'contain' }} />
      </View>
    ),
    title: 'Youre a part of the growing community',
    subtitle:'Join thousands of drivers moving the city forward. Drive with pride and be part of something bigger.',
  },
];

export default function OnboardingSwiper({ navigation }: { navigation?: any }) {
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (index < screens.length - 1) {
      flatListRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      navigation?.replace?.('Login');
    }
  };

  const handleSkip = () => {
    navigation?.replace?.('Login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        ref={flatListRef}
        data={screens}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.key}
        onMomentumScrollEnd={e => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(newIndex);
        }}
        renderItem={({ item }) => (
          <View style={{ width, height, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            {item.illustration}
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: TITLE_COLOR, marginTop: 32, textAlign: 'center' }}>{item.title}</Text>
            <Text style={{ fontSize: 16, color: SUBTITLE_COLOR, marginTop: 16, textAlign: 'center' }}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Pagination Dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
        {screens.map((_, i) => (
          <View
            key={i}
            style={{
              marginHorizontal: 4,
              borderRadius: 9999,
              width: i === index ? 20 : 10,
              height: 10,
              backgroundColor: i === index ? PRIMARY_GREEN : '#E5E7EB',
              opacity: i === index ? 1 : 0.5,
            }}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 32, marginBottom: 40 }}>
        {index < screens.length - 1 ? (
          <>
            <TouchableOpacity onPress={handleSkip} style={{ paddingVertical: 12, paddingHorizontal: 24 }}>
              <Text style={{ color: PRIMARY_GREEN, fontSize: 16, fontWeight: '600' }}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY_GREEN, borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 32 }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginRight: 8 }}>Next</Text>
              <Text style={{ color: '#fff', fontSize: 18 }}>→</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            style={{ flex: 1, backgroundColor: PRIMARY_GREEN, borderRadius: 9999, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
