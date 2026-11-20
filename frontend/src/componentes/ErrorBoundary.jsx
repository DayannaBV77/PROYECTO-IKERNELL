import { Component } from 'react';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';
import Boton from './ui/Boton.jsx';

/**
 * Captura excepciones no controladas en el árbol de componentes
 * evitando pantallas blancas completas y ocultando trazas técnicas internas.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { tieneError: false };
  }

  static getDerivedStateFromError() {
    return { tieneError: true };
  }

  componentDidCatch(error, info) {
    // Registro interno silencioso para diagnóstico sin exponer detalles al usuario final.
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary interceptó un fallo de renderizado:', error, info?.componentStack);
    }
  }

  render() {
    if (this.state.tieneError) {
      return (
        <div
          role="alert"
          style={{
            padding: '2.5rem 1.75rem',
            maxWidth: '540px',
            margin: '3.5rem auto',
            textAlign: 'center',
            backgroundColor: 'var(--c-superficie, #ffffff)',
            color: 'var(--c-texto, #111827)',
            borderRadius: '14px',
            border: '1px solid var(--c-borde, #e5e7eb)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              color: '#ef4444',
              marginBottom: '1rem',
            }}
          >
            <ShieldAlert size={24} aria-hidden="true" />
          </div>
          <h2 style={{ margin: '0 0 0.65rem', fontSize: '1.3rem', fontWeight: 700 }}>
            Ocurrió un inconveniente inesperado
          </h2>
          <p
            style={{
              color: 'var(--c-texto-tenue, #6b7280)',
              fontSize: '0.94rem',
              margin: '0 0 1.5rem',
              lineHeight: 1.55,
            }}
          >
            La vista actual encontró un error al procesarse. Por seguridad, los detalles técnicos
            han sido resguardados. Puede recargar la pantalla o volver al inicio seguro.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Boton
              variante="primario"
              icono={RefreshCw}
              onClick={() => {
                this.setState({ tieneError: false });
                window.location.reload();
              }}
            >
              Recargar pantalla
            </Boton>
            <Boton
              variante="secundario"
              icono={Home}
              onClick={() => {
                this.setState({ tieneError: false });
                window.location.assign('/app');
              }}
            >
              Volver al inicio seguro
            </Boton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
