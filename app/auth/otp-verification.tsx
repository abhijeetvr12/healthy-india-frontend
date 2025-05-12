// app/otp-verification.tsx
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { auth } from "../../constants/firebaseConfig";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";

export default function OTPVerificationScreen() {
  // Pull the verificationId from the URL params
  const { verificationId } = useLocalSearchParams<{ verificationId: string }>();
  const [code, setCode] = useState("");
  const router = useRouter();

  const confirmOTP = async () => {
    if (code.length !== 6) {
      Alert.alert("Enter 6-digit code");
      return;
    }
    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        code
      );
      await signInWithCredential(auth, credential);
      router.replace('/auth/pin-setup');
    } catch (e: any) {
      Alert.alert("Invalid OTP", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <TextInput
        style={styles.input}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />
      <TouchableOpacity style={styles.btn} onPress={confirmOTP}>
        <Text style={styles.btnText}>Verify</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 20 },
  btn: { backgroundColor: "#0066cc", padding: 14, borderRadius: 8 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
