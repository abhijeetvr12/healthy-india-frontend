// constants/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web‐SDK config object (from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyDuvRop9YFt8Uq1ohNNzFnxPFK-Daeu3Rw",
  authDomain: "healthyindiamodule.firebaseapp.com",
  projectId: "healthyindiamodule",
  storageBucket: "healthyindiamodule.firebasestorage.app",
  messagingSenderId: "212667952875",
  appId: "1:212667952875:web:5520b70754b892f2e358ae",
  measurementId: "G-R3VWEBCGY7"
};
// Initialize the app
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
