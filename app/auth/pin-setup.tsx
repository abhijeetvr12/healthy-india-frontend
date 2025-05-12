// app/pinSetup.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function PinSetupScreen() {
  const [pin, setPin] = useState('');
  const router = useRouter();

  const savePin = async () => {
    if (pin.length !== 4) return Alert.alert('PIN must be 4 digits');
    await AsyncStorage.setItem('user_pin', pin);
    router.replace('/dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set a 4‐digit PIN</Text>
      <TextInput
        style={styles.input}
        placeholder="••••"
        secureTextEntry
        keyboardType="number-pad"
        maxLength={4}
        value={pin}
        onChangeText={setPin}
      />
      <TouchableOpacity style={styles.btn} onPress={savePin}>
        <Text style={styles.btnText}>Save PIN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1,justifyContent:'center',padding:20, backgroundColor:'#fff' },
  title: { fontSize:24,fontWeight:'bold',marginBottom:20, textAlign:'center' },
  input: { borderWidth:1,borderColor:'#ccc',padding:12,borderRadius:8,marginBottom:20 },
  btn: { backgroundColor:'#0066cc',padding:14,borderRadius:8 },
  btnText: { color:'#fff',textAlign:'center',fontWeight:'600' },
});
