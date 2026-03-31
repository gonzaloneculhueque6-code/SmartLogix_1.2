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

  const venderProducto = async (producto) => {
    // 1. Nueva barrera de seguridad por si acaso
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
                  {/* 3. Botones agrupados */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-sell"
                      onClick={() => venderProducto(p)}
                      disabled={p.stock <= 0 || vendiendoId === p.id}
                    >
                      {/* Cambio de texto dinámico si no hay stock */}
                      {p.stock <= 0 ? 'Agotado' : (vendiendoId === p.id ? '...' : 'Vender')}
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