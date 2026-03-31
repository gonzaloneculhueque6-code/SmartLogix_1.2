import { useEffect, useState } from 'react'
import './App.css'

const API_PRODUCTOS = 'http://localhost:8081/api/productos'
const API_VENTA = 'http://localhost:8081/api/venta'

export default function App() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [vendiendoId, setVendiendoId] = useState(null)
  
  // Estado para controlar el formulario
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', precio: '', stock: '' })
  const [agregando, setAgregando] = useState(false)

  const cargarProductos = async () => {
    try {
      setCargando(true)
      setError('')
      const response = await fetch(API_PRODUCTOS)
      
      if (!response.ok) {
        const status = response.status;
        if (status === 503) {
          throw new Error("Sistema en mantenimiento o DB desconectada");
        } else if (status === 429) {
          throw new Error("Servidor sobrecargado, intente en unos segundos");
        } else {
          throw new Error(`Error del servidor: código ${status}`);
        }
      }

      const data = await response.json()
      setProductos(Array.isArray(data) ? data : [])
      
    } catch (err) {
      if (err.name === 'TypeError') {
        setError("Error de red o servidor no disponible");
      } else {
        setError(err.message)
      }
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  // Función para agregar un producto a la Base de Datos
  const agregarProducto = async (e) => {
    e.preventDefault();
    try {
      setAgregando(true);
      setError('');
      
      const payload = {
        nombre: nuevoProducto.nombre,
        precio: Number(nuevoProducto.precio),
        stock: Number(nuevoProducto.stock)
      };

      const response = await fetch(API_PRODUCTOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error al guardar el producto');

      setMensaje(`Producto agregado: ${nuevoProducto.nombre}`);
      setNuevoProducto({ nombre: '', precio: '', stock: '' });
      cargarProductos();
      
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAgregando(false);
    }
  };

  const venderProducto = async (producto) => {
    if (producto.stock <= 0) {
      setError(`El producto ${producto.nombre} está agotado.`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setVendiendoId(producto.id)
      setError('')
      const response = await fetch(`${API_VENTA}/${producto.id}/1`, { method: 'POST' })
      
      if (!response.ok) throw new Error('No se pudo procesar la venta')

      setMensaje(`Venta exitosa: ${producto.nombre}`)
      setTimeout(() => {
        cargarProductos()
        setTimeout(() => setMensaje(''), 3000)
      }, 700)
    } catch (err) {
      setError(err.message)
    } finally {
      setVendiendoId(null)
    }
  }

  // Función para eliminar producto
  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    
    try {
      setError('');
      const response = await fetch(`${API_PRODUCTOS}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('No se pudo eliminar el producto');

      setMensaje('Producto eliminado del inventario');
      cargarProductos();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  const totalStock = productos.reduce((acc, p) => acc + p.stock, 0)

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo-icon"></div>
          <div>
            <h1>Inventario SmartLogix</h1>
          </div>
        </div>
        <button className="btn-refresh" onClick={cargarProductos} disabled={cargando}>
          {cargando ? 'Cargando...' : 'Actualizar Stock'}
        </button>
      </header>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-row">
        <div className="stat-card">
          <span>Items Únicos</span>
          <strong>{productos.length}</strong>
        </div>
        <div className="stat-card">
          <span>Stock Total</span>
          <strong>{totalStock}</strong>
        </div>
      </div>

      <div className="add-product-card">
        <h3 className="add-product-title">Agregar Nuevo Producto</h3>
        <form onSubmit={agregarProducto} className="add-product-form">
          <input 
            required 
            placeholder="Nombre del producto" 
            value={nuevoProducto.nombre} 
            onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
            className="form-input flex-2"
          />
          <input 
            required 
            type="number" 
            min="0"
            placeholder="Precio" 
            value={nuevoProducto.precio} 
            onChange={e => setNuevoProducto({...nuevoProducto, precio: e.target.value})}
            className="form-input flex-1"
          />
          <input 
            required 
            type="number" 
            min="0"
            placeholder="Stock Inicial" 
            value={nuevoProducto.stock} 
            onChange={e => setNuevoProducto({...nuevoProducto, stock: e.target.value})}
            className="form-input flex-1"
          />
          <button type="submit" disabled={agregando} className="btn-submit">
            {agregando ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </form>
      </div>

      <div className="table-wrapper">
        <table className="main-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Stock Actual</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className={p.stock === 0 ? 'out-of-stock' : ''}>
                <td>
                  <div className="product-cell">
                    <span className="p-name">{p.nombre}</span>
                    <span className="p-id">ID: #{p.id}</span>
                  </div>
                </td>
                <td className="p-price">${p.precio.toLocaleString()}</td>
                <td>
                  <span className={`badge-stock ${p.stock > 10 ? 'high' : p.stock > 0 ? 'low' : 'empty'}`}>
                    {p.stock} unidades
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-sell"
                      onClick={() => venderProducto(p)}
                      disabled={p.stock <= 0 || vendiendoId === p.id}
                    >
                      {p.stock <= 0 ? 'Agotado' : (vendiendoId === p.id ? '...' : 'Vender')}
                    </button>
                    
                    <button 
                      onClick={() => eliminarProducto(p.id)}
                      className="btn-delete"
                      title="Eliminar"
                    >
                      
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}