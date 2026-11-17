import { Component } from 'react';
import Boton from './ui/Boton.jsx';

/**
 * Captura excepciones no controladas en el árbol de componentes
 * evitando pantallas blancas completas.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { tieneError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { tieneError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Error no controlado en la interfaz:', error, info);
  }

  render() {
    if (this.state.tieneError) {
      return (
        <div style={{
          padding: '3rem 1.5rem',
          maxWidth: '600px',
          margin: '2rem auto',
          textAlign: 'center',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #fee2e2'
        }}>
          <h2 style={{ color: '#b91c1c', marginBottom: '0.75rem', fontSize: '1.4rem' }}>
            Ocurrió un problema inesperado
          </h2>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Se presentó un error al procesar esta vista. Puede reintentar cargarla o regresar al panel de control.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Boton
              variante="primario"
              onClick={() => {
                this.setState({ tieneError: false, error: null });
                window.location.reload();
              }}
            >
              Recargar página
            </Boton>
            <Boton
              variante="secundario"
              onClick={() => {
                this.setState({ tieneError: false, error: null });
                window.location.href = '/app';
              }}
            >
              Volver al panel
            </Boton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
