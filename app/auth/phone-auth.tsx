// app/phone-auth.tsx
import React, { useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../../constants/firebaseConfig";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { PhoneAuthProvider } from "firebase/auth";

export default function PhoneAuthScreen() {
  const [phone, setPhone] = useState("");
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const router = useRouter();

  const sendOTP = async () => {
    if (!phone) return Alert.alert("Enter phone number");
    try {
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        phone,
        recaptchaVerifier.current!
      );
      router.push('/auth/otp-verification');
    } catch (e: any) {
      Alert.alert("Error sending OTP", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
      />
      <Text style={styles.title}>Enter Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="+91 98765 43210"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TouchableOpacity style={styles.btn} onPress={sendOTP}>
        <Text style={styles.btnText}>Send OTP</Text>
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