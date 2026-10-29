import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const FormProducto = ({ route, navigation }) => {
  const productoEditar = route.params?.producto;

  const [nombre, setNombre] = useState(String(productoEditar?.nombre ?? ''));
  const [precio, setPrecio] = useState(String(productoEditar?.precio ?? ''));
  const [color, setColor] = useState(String(productoEditar?.color ?? ''));
  const [imagen, setImagen] = useState(String(productoEditar?.imagen ?? ''));
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [hayCategoriasSinIdNumerico, setHayCategoriasSinIdNumerico] = useState(false);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [errorCategorias, setErrorCategorias] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const obtenerCategorias = async () => {
    setCargandoCategorias(true);
    setErrorCategorias(false);
    try {
      const resultado = await getDocs(collection(db, 'Categorias'));
      let hayIdsInvalidos = false;
      const categoriasCargadas = resultado.docs.flatMap((documento) => {
        const datosCategoria = documento.data();
        const idCategoria = [datosCategoria.categoriaId, datosCategoria.id].find(
          (valor) =>
            valor !== null &&
            valor !== undefined &&
            String(valor).trim() !== '' &&
            Number.isSafeInteger(Number(valor)) &&
            Number(valor) >= 0
        );
        const idNumerico = Number(idCategoria);

        if (idCategoria === undefined) {
          hayIdsInvalidos = true;
          return [];
        }

        return {
          ...datosCategoria,
          id: idNumerico,
          firestoreId: documento.id,
        };
      });
      setCategorias(categoriasCargadas);
      setHayCategoriasSinIdNumerico(hayIdsInvalidos);

      if (productoEditar) {
        const categoriaGuardadaTexto = String(
          productoEditar.categoriaId ??
            productoEditar.categoria ??
            productoEditar.categoriaNombre ??
            ''
        ).trim();
        const categoriaGuardada = categoriaGuardadaTexto.toLocaleLowerCase();
        const categoriaGuardadaNumerica = Number(categoriaGuardadaTexto);
        const categoriaActual = categoriasCargadas.find(
          (categoria) =>
            (Number.isSafeInteger(categoriaGuardadaNumerica) &&
              categoria.id === categoriaGuardadaNumerica) ||
            categoria.firestoreId === categoriaGuardadaTexto ||
            String(categoria.nombre ?? '').trim().toLocaleLowerCase() ===
              categoriaGuardada
        );
        setCategoriaSeleccionada(categoriaActual?.id ?? '');
      }
    } catch (error) {
      console.error('Error obteniendo categorías para el formulario:', error);
      setErrorCategorias(true);
    } finally {
      setCargandoCategorias(false);
    }
  };

  useEffect(() => {
    obtenerCategorias();
  }, []);

  const guardarProducto = async () => {
    const nombreLimpio = nombre.trim();
    const precioNumerico = Number(String(precio).replace(',', '.'));
    const categoria = categorias.find(
      (opcion) => opcion.id === categoriaSeleccionada
    );

    if (!nombreLimpio) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del producto.');
      return;
    }
    if (!categoria) {
      Alert.alert('Falta la categoría', 'Selecciona una categoría para el producto.');
      return;
    }
    if (
      String(precio).trim() === '' ||
      !Number.isFinite(precioNumerico) ||
      precioNumerico < 0
    ) {
      Alert.alert('Precio no válido', 'Escribe un precio numérico igual o mayor que cero.');
      return;
    }
    setGuardando(true);
    try {
      const datosProducto = {
        nombre: nombreLimpio,
        precio: precioNumerico,
        color: color.trim() || '#F4F4F4',
        imagen: imagen.trim(),
        categoriaId: categoria.id,
      };

      if (productoEditar?.id) {
        await updateDoc(doc(db, 'Productos', productoEditar.id), {
          ...datosProducto,
          categoriaNombre: deleteField(),
        });
      } else {
        await addDoc(collection(db, 'Productos'), datosProducto);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error guardando producto:', error);
      Alert.alert('No se pudo guardar', 'Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
      <Text style={styles.titulo}>
        {productoEditar ? 'Actualizar Producto' : 'Agregar Producto'}
      </Text>

      <Text style={styles.label}>Nombre:</Text>
      <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Ej. Zapatillas" />

      <Text style={styles.label}>Precio ($):</Text>
      <TextInput style={styles.input} value={precio} onChangeText={setPrecio} keyboardType="numeric" placeholder="Ej. 25" />

      <Text style={styles.label}>Color Hexadecimal:</Text>
      <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="Ej. #F5AFC1" />

      <Text style={styles.label}>URL de la Imagen:</Text>
      <TextInput style={styles.input} value={imagen} onChangeText={setImagen} placeholder="https://..." />

      <Text style={styles.label}>Categoría:</Text>
      {cargandoCategorias ? (
        <ActivityIndicator color="#7C7CFF" style={styles.cargandoCategorias} />
      ) : errorCategorias ? (
        <View>
          <Text style={styles.mensajeCategorias}>
            No se pudieron cargar las categorías.
          </Text>
          <TouchableOpacity onPress={obtenerCategorias}>
            <Text style={styles.reintentarCategorias}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : categorias.length === 0 ? (
        <Text style={styles.mensajeCategorias}>
          {hayCategoriasSinIdNumerico
            ? 'Las categorías deben tener un campo id o categoriaId numérico en Firebase.'
            : 'No hay categorías disponibles. Agrega categorías antes de guardar el producto.'}
        </Text>
      ) : (
        <>
          {hayCategoriasSinIdNumerico ? (
            <Text style={styles.mensajeCategorias}>
              Se omitieron categorías sin un id numérico.
            </Text>
          ) : null}
          <View style={styles.listaCategorias}>
            {categorias.map((categoria) => {
              const seleccionada = categoria.id === categoriaSeleccionada;
              return (
                <TouchableOpacity
                  key={categoria.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: seleccionada }}
                  style={[
                    styles.opcionCategoria,
                    seleccionada && styles.opcionCategoriaSeleccionada,
                  ]}
                  onPress={() => setCategoriaSeleccionada(categoria.id)}
                >
                  <Text
                    style={[
                      styles.textoCategoria,
                      seleccionada && styles.textoCategoriaSeleccionada,
                    ]}
                  >
                    {categoria.nombre ?? 'Categoría sin nombre'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
        onPress={guardarProducto}
        disabled={guardando || cargandoCategorias || errorCategorias || categorias.length === 0}
      >
        <Text style={styles.textoBoton}>
          {guardando ? 'Guardando...' : 'Guardar Producto'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contenido: {
    padding: 20,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F5F4FC',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  cargandoCategorias: {
    marginVertical: 12,
  },
  listaCategorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  opcionCategoria: {
    backgroundColor: '#F5F4FC',
    borderColor: '#E6E4F4',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  opcionCategoriaSeleccionada: {
    backgroundColor: '#7C7CFF',
    borderColor: '#7C7CFF',
  },
  textoCategoria: {
    color: '#555',
    fontSize: 14,
  },
  textoCategoriaSeleccionada: {
    color: '#fff',
    fontWeight: '600',
  },
  mensajeCategorias: {
    color: '#666',
    lineHeight: 20,
    marginTop: 4,
  },
  reintentarCategorias: {
    color: '#7C7CFF',
    fontWeight: '600',
    marginTop: 8,
  },
  botonGuardar: {
    backgroundColor: '#7C7CFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 25,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FormProducto;