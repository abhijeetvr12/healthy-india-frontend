import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../constants/endpoint';

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
      else router.replace('/');

      const { status: imagePerm } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: locPerm } = await Location.requestForegroundPermissionsAsync();

      if (imagePerm !== 'granted' || locPerm !== 'granted') {
        Alert.alert('Permissions Required', 'Camera and location permissions are required.');
      }
    };
    init();
  }, []);

  const handleCapture = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });

      if (result.canceled) return setLoading(false);
      const uri = result.assets[0].uri;
      setImageUri(uri);

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      const formData = new FormData();
      formData.append('image', {
        uri,
        name: 'food.jpg',
        type: 'image/jpeg',
      } as any);
      formData.append('latitude', loc.coords.latitude.toString());
      formData.append('longitude', loc.coords.longitude.toString());

      const res = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setAnalysis(data);
    } catch (err: any) {
      Alert.alert('Capture/Analysis Error', err.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, {user?.name}!</Text>
      <Text>Email: {user?.email}</Text>

      <Button title="Capture & Analyze" onPress={handleCapture} />
      {loading && <ActivityIndicator size="large" color="blue" style={{ marginVertical: 10 }} />}
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
      {location && (
        <Text style={styles.location}>
          Location: {location.coords.latitude}, {location.coords.longitude}
        </Text>
      )}
      {analysis && (
        <View style={styles.result}>
          <Text style={styles.sectionTitle}>📋 Health Report</Text>
          <Text>Healthy: {analysis.is_healthy}</Text>
          {analysis.unhealthy_ingredients && (
            <>
              <Text>⚠️ Unhealthy Ingredients:</Text>
              {Object.entries(analysis.unhealthy_ingredients).map(([k, v]) => (
                <Text key={k}>- {k}: {v}</Text>
              ))}
            </>
          )}
          {analysis.health_impacts && (
            <>
              <Text>🩺 Health Impacts:</Text>
              {Object.entries(analysis.health_impacts).map(([k, v]) => (
                <Text key={k}>- {k}: {v}</Text>
              ))}
            </>
          )}
        </View>
      )}

      <Button title="Logout" onPress={handleLogout} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 40 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  preview: { width: '100%', height: 200, marginVertical: 10, borderRadius: 10 },
  location: { textAlign: 'center', marginVertical: 4 },
  result: { marginTop: 20, padding: 10, backgroundColor: '#eef', borderRadius: 8 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 5 },
});
