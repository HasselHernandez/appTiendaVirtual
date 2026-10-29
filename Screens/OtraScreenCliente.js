import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export default function OtraScreenCliente({ navigation }) {
    const [nombre, setNombre] = useState("");
    const [cargandoNombre, setCargandoNombre] = useState(true);
    const [errorNombre, setErrorNombre] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let activa = true;

            const cargarNombre = async () => {
                const usuario = auth.currentUser;
                if (!usuario) {
                    setErrorNombre(true);
                    setCargandoNombre(false);
                    return;
                }

                setCargandoNombre(true);
                setErrorNombre(false);
                try {
                    const perfil = await getDoc(doc(db, "Usuario", usuario.uid));
                    if (activa) {
                        if (perfil.exists()) {
                            setNombre(String(perfil.data().nombre ?? "").trim());
                        } else {
                            setErrorNombre(true);
                        }
                    }
                } catch (error) {
                    console.error("Error cargando el nombre del cliente:", error);
                    if (activa) {
                        setErrorNombre(true);
                    }
                } finally {
                    if (activa) {
                        setCargandoNombre(false);
                    }
                }
            };

            cargarNombre();
            return () => {
                activa = false;
            };
        }, [])
    );

    const cerrarSesion = () => {
        Alert.alert(
            "Cerrar sesión",
            "¿Deseas salir de tu cuenta?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Cerrar sesión",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            navigation.getParent()?.reset({
                                index: 0,
                                routes: [{ name: "Login" }],
                            });
                        } catch (error) {
                            console.error("Error cerrando sesión:", error);
                            Alert.alert(
                                "No se pudo cerrar sesión",
                                "Inténtalo de nuevo."
                            );
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.pantalla} edges={["top", "left", "right"]}>
            <ScrollView
                contentContainerStyle={styles.contenedor}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.encabezado}>
                    <View style={styles.encabezadoTexto}>
                        <Text style={styles.etiqueta}>TU ESPACIO PERSONAL</Text>
                        <Text style={styles.titulo}>Mi perfil</Text>
                    </View>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Cerrar sesión"
                        style={styles.botonCerrar}
                        onPress={cerrarSesion}
                    >
                        <Ionicons name="log-out-outline" size={21} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.tarjetaBienvenida}>
                    <View style={styles.iconoPerfil}>
                        <Ionicons name="person" size={34} color="#fff" />
                    </View>
                    {cargandoNombre ? (
                        <ActivityIndicator color="#fff" style={styles.indicador} />
                    ) : errorNombre || !nombre ? (
                        <Text style={styles.mensajeError}>
                            No pudimos cargar tu nombre. Inténtalo de nuevo más tarde.
                        </Text>
                    ) : (
                        <>
                            <Text style={styles.saludo}>¡Bienvenido!</Text>
                            <Text style={styles.nombre} numberOfLines={2}>
                                {nombre}
                            </Text>
                            <Text style={styles.descripcion}>
                                Nos alegra tenerte aquí
                            </Text>
                        </>
                    )}
                    <View style={styles.decoracionUno} />
                    <View style={styles.decoracionDos} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    pantalla: {
        flex: 1,
        backgroundColor: "#F5F6FC",
    },
    contenedor: {
        flexGrow: 1,
        padding: 22,
        paddingTop: 14,
    },
    encabezado: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 25,
    },
    encabezadoTexto: {
        flex: 1,
    },
    etiqueta: {
        color: "#888BA5",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.4,
        marginBottom: 5,
    },
    titulo: {
        color: "#242541",
        fontSize: 28,
        fontWeight: "800",
    },
    botonCerrar: {
        alignItems: "center",
        backgroundColor: "#716EE8",
        borderRadius: 16,
        elevation: 3,
        height: 48,
        justifyContent: "center",
        shadowColor: "#4D49B5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        width: 48,
    },
    tarjetaBienvenida: {
        alignItems: "center",
        backgroundColor: "#716EE8",
        borderRadius: 28,
        elevation: 5,
        marginBottom: 30,
        minHeight: 245,
        overflow: "hidden",
        paddingHorizontal: 24,
        paddingVertical: 28,
        shadowColor: "#5551C3",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
    },
    iconoPerfil: {
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        borderColor: "rgba(255,255,255,0.55)",
        borderRadius: 36,
        borderWidth: 2,
        height: 72,
        justifyContent: "center",
        marginBottom: 16,
        width: 72,
    },
    saludo: {
        color: "#E9E8FF",
        fontSize: 17,
        fontWeight: "600",
    },
    nombre: {
        color: "#fff",
        fontSize: 27,
        fontWeight: "800",
        marginTop: 4,
        textAlign: "center",
    },
    descripcion: {
        color: "#E9E8FF",
        fontSize: 14,
        marginTop: 8,
    },
    mensajeError: {
        color: "#fff",
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center",
    },
    indicador: {
        marginTop: 24,
    },
    decoracionUno: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 100,
        height: 180,
        position: "absolute",
        right: -65,
        top: -76,
        width: 180,
    },
    decoracionDos: {
        backgroundColor: "rgba(255,255,255,0.07)",
        borderRadius: 100,
        bottom: -105,
        height: 190,
        left: -68,
        position: "absolute",
        width: 190,
    },
});
