import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from './supabase';

export default function SuggestScreen() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [foodType, setFoodType] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !location) {
      Alert.alert('Missing Info', 'Please enter both a restaurant name and location.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('suggestions').insert([
      { name, location, food_type: foodType, notes }
    ]);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } else {
      Alert.alert('Thank you!', 'Your suggestion has been submitted 🙌');
      setName('');
      setLocation('');
      setFoodType('');
      setNotes('');
    }
  };

  return (
    <LinearGradient
      colors={['#FFF5F0', '#EAF6FF']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Suggest a Restaurant</Text>

          <TextInput
            placeholder="Restaurant Name *"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <TextInput
            placeholder="Location (Address or Area) *"
            value={location}
            onChangeText={setLocation}
            style={styles.input}
          />

          <TextInput
            placeholder="Food Type (Optional)"
            value={foodType}
            onChangeText={setFoodType}
            style={styles.input}
          />

          <TextInput
            placeholder="Extra Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            multiline
          />

          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.button}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Submit Suggestion'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
