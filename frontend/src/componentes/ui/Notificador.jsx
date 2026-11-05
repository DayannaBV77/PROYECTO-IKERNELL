import { createContext, useCallback, useContext, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from 'lucide-react';
import estilos from './Notificador.module.css';

const ContextoNotificaciones = createContext(null);

export function ProveedorNotificaciones({ children }) {
  const [toasts, setToasts] = useState([]);

  const removerToast = useCallback((id) => {
    setToasts((previos) => previos.filter((t) => t.id !== id));
  }, []);

  const notificar = useCallback(({ tipo = 'exito', titulo, mensaje, duracion = 4500 }) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 7);
    const nuevoToast = { id, tipo, titulo, mensaje };

    setToasts((previos) => [nuevoToast, ...previos.slice(0, 4)]);

    if (duracion > 0) {
      setTimeout(() => {
        removerToast(id);
      }, duracion);
    }
    return id;
  }, [removerToast]);

  const exito = useCallback((mensaje, titulo = 'Operación completada') => {
    return notificar({ tipo: 'exito', titulo, mensaje });
  }, [notificar]);

  const error = useCallback((mensaje, titulo = 'Atención / Error') => {
    return notificar({ tipo: 'error', titulo, mensaje, duracion: 6000 });
  }, [notificar]);

  const advertencia = useCallback((mensaje, titulo = 'Advertencia') => {
    return notificar({ tipo: 'advertencia', titulo, mensaje, duracion: 5000 });
  }, [notificar]);

  const info = useCallback((mensaje, titulo = 'Información del sistema') => {
    return notificar({ tipo: 'info', titulo, mensaje });
  }, [notificar]);

  return (
    <ContextoNotificaciones.Provider value={{ notificar, exito, error, advertencia, info, removerToast }}>
      {children}
      <div className={estilos.contenedorToast} aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          let Icono = CheckCircle2;
          let claseTipo = estilos.toastExito;

          if (toast.tipo === 'error') {
            Icono = XCircle;
            claseTipo = estilos.toastError;
          } else if (toast.tipo === 'advertencia') {
            Icono = AlertTriangle;
            claseTipo = estilos.toastAdvertencia;
          } else if (toast.tipo === 'info') {
            Icono = Info;
            claseTipo = estilos.toastInfo;
          }

          return (
            <div key={toast.id} className={`${estilos.toastItem} ${claseTipo}`} role="status">
              <div className={estilos.iconoContenedor}>
                <Icono size={20} aria-hidden="true" />
              </div>
              <div className={estilos.cuerpoToast}>
                {toast.titulo && <strong className={estilos.tituloToast}>{toast.titulo}</strong>}
                <p className={estilos.mensajeToast}>{toast.mensaje}</p>
              </div>
              <button
                type="button"
                className={estilos.botonCerrar}
                onClick={() => removerToast(toast.id)}
                aria-label="Cerrar notificación"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ContextoNotificaciones.Provider>
  );
}

export function useNotificador() {
  const contexto = useContext(ContextoNotificaciones);
  if (!contexto) {
    // Si se usa fuera del proveedor, proveer un fallback seguro para evitar crash
    return {
      notificar: console.log,
      exito: console.log,
      error: console.error,
      advertencia: console.warn,
      info: console.info,
      removerToast: () => {},
    };
  }
  return contexto;
}
