// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
    getAuth,
    getReactNativePersistence,
    initializeAuth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
    apiKey: "AIzaSyCK6qIPJEIaqAXWSHkHQGwyMqbh6Q3WRDk",
    authDomain: "tiendavirtualhassel.firebaseapp.com",
    projectId: "tiendavirtualhassel",
    storageBucket: "tiendavirtualhassel.firebasestorage.app",
    messagingSenderId: "517965178479",
    appId: "1:517965178479:web:1826b7e81507d8f4df8f9a",
    measurementId: "G-TGR6T2RF62"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth =
    Platform.OS === "web"
        ? getAuth(app)
        : initializeAuth(app, {
              persistence: getReactNativePersistence(AsyncStorage),
          });
