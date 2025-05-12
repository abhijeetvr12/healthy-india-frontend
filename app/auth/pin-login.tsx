// app/pinLogin.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';
import { useRouter } from 'expo-router';

export default function PinLoginScreen() {
  const [pin, setPin] = useState('');
  const router = useRouter();

  const checkPin = async () => {
    const saved = await AsyncStorage.getItem('user_pin');
    if (pin === saved) {
      onAuthStateChanged(auth, user => {
        router.replace(user ? '/dashboard' : 'auth/phone-auth');
      });
    } else {
      Alert.alert('Wrong PIN');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter your PIN</Text>
      <TextInput
        style={styles.input}
        placeholder="••••"
        secureTextEntry
        keyboardType="number-pad"
        maxLength={4}
        value={pin}
        onChangeText={setPin}
      />
      <TouchableOpacity style={styles.btn} onPress={checkPin}>
        <Text style={styles.btnText}>Unlock</Text>
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
