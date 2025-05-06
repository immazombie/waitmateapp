import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import HomeScreen from './HomeScreen';
import RestaurantScreen from './RestaurantScreen';
import FAQScreen from './FAQScreen';
import ProfileScreen from './ProfileScreen';
import SuggestScreen from './SuggestScreen';
import RestaurantListScreen from './RestaurantListScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NearbyScreen from './NearbyScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Nearby" component={NearbyScreen} />
      <Stack.Screen name="Restaurant" component={RestaurantScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Home">
        <Drawer.Screen name="Home" component={HomeStack} options={{ headerShown: false }} />
        <Drawer.Screen name="All Restaurants" component={RestaurantListScreen} />
        <Drawer.Screen name="FAQ" component={FAQScreen} />
        <Drawer.Screen name="Profile" component={ProfileScreen} />
        <Drawer.Screen name="Suggest a Restaurant" component={SuggestScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
