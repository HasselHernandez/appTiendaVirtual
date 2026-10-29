import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";
import {
    createUserWithEmailAndPassword,
    deleteUser,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";


export default function Login({ navigation }) {
    const [usuario, setUsuario] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [nombreCompleto, setNombreCompleto] = useState("");
    const [modoRegistro, setModoRegistro] = useState(false);
    const [iniciandoSesion, setIniciandoSesion] = useState(false);

    const registrarCliente = async () => {
        const correo = usuario.trim().toLowerCase();
        const nombre = nombreCompleto.trim().replace(/\s+/g, " ");

        if (nombre.split(" ").length < 2) {
            Alert.alert("Nombre incompleto", "Escribe tu nombre y apellido.");
            return;
        }
        if (!correo || !contrasena) {
            Alert.alert("Datos incompletos", "Ingresa tu correo y contraseña.");
            return;
        }
        if (contrasena.length < 6) {
            Alert.alert(
                "Contraseña muy corta",
                "La contraseña debe tener al menos 6 caracteres."
            );
            return;
        }

        setIniciandoSesion(true);
        let usuarioCreado;
        let registroCompletado = false;
        try {
            const credencial = await createUserWithEmailAndPassword(
                auth,
                correo,
                contrasena
            );
            usuarioCreado = credencial.user;
            const partesNombre = nombre.split(" ");
            await setDoc(doc(db, "Usuario", usuarioCreado.uid), {
                nombre,
                apellido: partesNombre.slice(1).join(" "),
                correo,
                rol: "Cliente",
            });
            registroCompletado = true;
        } catch (error) {
            console.error("Error registrando cliente:", error);
            if (usuarioCreado) {
                try {
                    await deleteUser(usuarioCreado);
                } catch (errorEliminandoUsuario) {
                    console.error(
                        "No se pudo revertir la cuenta creada sin perfil:",
                        errorEliminandoUsuario
                    );
                    try {
                        await signOut(auth);
                    } catch (errorCerrandoSesion) {
                        console.error(
                            "No se pudo cerrar la sesión después del error de registro:",
                            errorCerrandoSesion
                        );
                    }
                }
            }

            let mensaje;
            switch (error.code) {
                case "auth/email-already-in-use":
                    mensaje = "Ya existe una cuenta con ese correo. Inicia sesión.";
                    break;
                case "auth/invalid-email":
                    mensaje = "Ingresa un correo electrónico válido.";
                    break;
                case "auth/weak-password":
                    mensaje = "La contraseña debe tener al menos 6 caracteres.";
                    break;
                default:
                    mensaje = "No pudimos completar tu registro. Inténtalo de nuevo más tarde.";
            }
            Alert.alert("No se pudo crear la cuenta", mensaje);
        } finally {
            setIniciandoSesion(false);
        }

        if (registroCompletado) {
            navigation.replace("ClienteTabs");
        }
    };

    const iniciarSesion = async () => {
        const correo = usuario.trim().toLowerCase();
        if (!correo || !contrasena) {
            Alert.alert("Datos incompletos", "Ingresa tu correo y contraseña.");
            return;
        }

        setIniciandoSesion(true);
        try {
            const credencial = await signInWithEmailAndPassword(
                auth,
                correo,
                contrasena
            );
            let perfil;
            try {
                perfil = await getDoc(doc(db, "Usuario", credencial.user.uid));
            } catch (errorPerfil) {
                await signOut(auth);
                throw errorPerfil;
            }

            if (!perfil.exists()) {
                await signOut(auth);
                Alert.alert(
                    "No pudimos validar tu cuenta",
                    "Inténtalo de nuevo más tarde. Si el problema continúa, contacta con soporte."
                );
                return;
            }

            const rol = String(perfil.data().rol ?? "").trim().toLowerCase();
            if (rol === "admin" || rol === "administrador") {
                navigation.replace("AdminTabs");
            } else if (rol === "cliente") {
                navigation.replace("ClienteTabs");
            } else {
                await signOut(auth);
                Alert.alert(
                    "No pudimos validar tu cuenta",
                    "Inténtalo de nuevo más tarde. Si el problema continúa, contacta con soporte."
                );
            }
        } catch (error) {
            console.error("Error iniciando sesión:", error);
            let mensaje;
            switch (error.code) {
                case "auth/user-not-found":
                    mensaje = "No encontramos una cuenta con ese correo. Verifícalo o regístrate.";
                    break;
                case "auth/invalid-email":
                    mensaje = "Ingresa un correo electrónico válido.";
                    break;
                case "auth/invalid-credential":
                case "auth/wrong-password":
                    mensaje = "El correo o la contraseña no coinciden. Verifica tus datos e inténtalo de nuevo.";
                    break;
                default:
                    mensaje = "No pudimos iniciar sesión en este momento. Inténtalo de nuevo más tarde.";
            }
            Alert.alert("No se pudo iniciar sesión", mensaje);
        } finally {
            setIniciandoSesion(false);
        }
    };

    return (
        <View style={styles.contenedor}>
            <Text style={styles.titulo}>TV HASSEL</Text>
            <Text style={styles.subtitulo}>
                {modoRegistro ? "Crear cuenta" : "Iniciar sesión"}
            </Text>
            {modoRegistro && (
                <TextInput
                    style={styles.input}
                    placeholder="Nombre y apellido"
                    value={nombreCompleto}
                    onChangeText={setNombreCompleto}
                    autoCapitalize="words"
                    editable={!iniciandoSesion}
                />
            )}
            <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                value={usuario}
                onChangeText={setUsuario}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!iniciandoSesion}
            />
            <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry
                autoComplete={modoRegistro ? "new-password" : "password"}
                editable={!iniciandoSesion}
            />
            <TouchableOpacity
                style={styles.boton}
                onPress={modoRegistro ? registrarCliente : iniciarSesion}
                disabled={iniciandoSesion}
            >
                <Text style={styles.textoBoton}>
                    {iniciandoSesion
                        ? modoRegistro
                            ? "Creando cuenta..."
                            : "Ingresando..."
                        : modoRegistro
                          ? "Registrarme"
                          : "Ingresar"}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.enlaceRegistro}
                onPress={() => setModoRegistro(!modoRegistro)}
                disabled={iniciandoSesion}
            >
                <Text style={styles.textoEnlace}>
                    {modoRegistro
                        ? "¿Ya tienes una cuenta? Inicia sesión"
                        : "¿No tienes una cuenta? Regístrate"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}
const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
        justifyContent: "center",
        padding: 25,
        backgroundColor: "#f7f7ff",
    },
    titulo: {
        fontSize: 38,
        fontWeight: "bold",
        color: "#7C7CFF",
        textAlign: "center",
    },
    subtitulo: {
        fontSize: 20,
        textAlign: "center",
        marginBottom: 30,
    },
    input: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 10,
        padding: 14,
        marginBottom: 15,
    },
    boton: {
        backgroundColor: "#7C7CFF",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
    },
    textoBoton: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    enlaceRegistro: {
        alignItems: "center",
        marginTop: 22,
        padding: 8,
    },
    textoEnlace: {
        color: "#5555CC",
        fontSize: 15,
        fontWeight: "600",
    },
});
