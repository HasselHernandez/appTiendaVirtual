import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebase/config';

const Admin = ({ navigation }) => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [productoEliminando, setProductoEliminando] = useState(null);

  const obtenerProductos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const resultado = await getDocs(collection(db, 'Productos'));
      setProductos(
        resultado.docs.map((documento) => ({
          ...documento.data(),
          id: documento.id,
        }))
      );
    } catch (errorConsulta) {
      console.error('Error obteniendo productos para administración:', errorConsulta);
      setError('No se pudieron cargar los productos. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      obtenerProductos();
    }, [obtenerProductos])
  );

  const eliminarProducto = (producto) => {
    Alert.alert(
      'Eliminar producto',
      `¿Seguro que quieres eliminar "${producto.nombre || 'este producto'}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setProductoEliminando(producto.id);
            try {
              await deleteDoc(doc(db, 'Productos', producto.id));
              setProductos((productosActuales) =>
                productosActuales.filter((item) => item.id !== producto.id)
              );
              Alert.alert(
                'Eliminado con éxito',
                'El producto se eliminó correctamente.'
              );
            } catch (errorEliminacion) {
              console.error('Error eliminando producto:', errorEliminacion);
              Alert.alert(
                'No se pudo eliminar',
                'Revisa tu conexión e inténtalo de nuevo.'
              );
            } finally {
              setProductoEliminando(null);
            }
          },
        },
      ]
    );
  };

  const renderProducto = ({ item }) => (
    <View style={styles.producto}>
      {item.imagen ? (
        <Image source={{ uri: item.imagen }} style={styles.imagen} />
      ) : (
        <View style={styles.imagenVacia}>
          <Ionicons name="image-outline" size={28} color="#999" />
        </View>
      )}


      <View style={styles.detalles}>
        <Text style={styles.nombre} numberOfLines={1}>
          {item.nombre || 'Producto sin nombre'}
        </Text>
        <Text style={styles.precio}>$ {item.precio ?? '—'}</Text>
      </View>


      <TouchableOpacity
        accessibilityLabel={`Editar ${item.nombre || 'producto'}`}
        style={styles.botonEditar}
        onPress={() => navigation.navigate('FormProducto', { producto: item })}
      >
        <Ionicons name="create-outline" size={22} color="#7C7CFF" />
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel={`Eliminar ${item.nombre || 'producto'}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: productoEliminando === item.id }}
        disabled={productoEliminando === item.id}
        style={styles.botonEliminar}
        onPress={() => eliminarProducto(item)}
      >
        {productoEliminando === item.id ? (
          <ActivityIndicator size="small" color="#D93025" />
        ) : (
          <Ionicons name="trash-outline" size={21} color="#D93025" />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.titulo}>Panel de Administración</Text>
      <TouchableOpacity
        style={styles.botonAgregar}
        onPress={() => navigation.navigate('FormProducto')}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.textoBoton}>Agregar producto</Text>
      </TouchableOpacity>

      <Text style={styles.subtitulo}>Productos</Text>
      {cargando ? (
        <ActivityIndicator color="#7C7CFF" style={styles.cargando} />
      ) : error ? (
        <View>
          <Text style={styles.mensaje}>{error}</Text>
          <TouchableOpacity onPress={obtenerProductos}>
            <Text style={styles.reintentar}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => item.id}
          renderItem={renderProducto}
          contentContainerStyle={
            productos.length === 0 ? styles.listaVacia : styles.lista
          }
          ListEmptyComponent={
            <Text style={styles.mensaje}>
              Aún no hay productos. Agrega el primero con el botón de arriba.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  titulo: {
    color: '#222',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  botonAgregar: {
    alignItems: 'center',
    backgroundColor: '#7C7CFF',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 14,
  },
  textoBoton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 24,
  },
  cargando: {
    marginTop: 32,
  },
  lista: {
    paddingBottom: 20,
  },
  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  producto: {
    alignItems: 'center',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 12,
  },
  imagen: {
    backgroundColor: '#F5F4FC',
    borderRadius: 8,
    height: 64,
    width: 64,
  },
  imagenVacia: {
    alignItems: 'center',
    backgroundColor: '#F5F4FC',
    borderRadius: 8,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  detalles: {
    flex: 1,
    marginHorizontal: 12,
  },
  nombre: {
    color: '#222',
    fontSize: 15,
    fontWeight: '600',
  },
  precio: {
    color: '#666',
    marginTop: 5,
  },
  botonEditar: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  botonEliminar: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  mensaje: {
    color: '#666',
    lineHeight: 21,
    textAlign: 'center',
  },
  reintentar: {
    color: '#7C7CFF',
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default Admin;
