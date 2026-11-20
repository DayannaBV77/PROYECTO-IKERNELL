import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import estilos from './BotonRegresar.module.css';

/**
 * Boton estandar y sobrio para volver a la vista anterior.
 *
 * Usa el historial del navegador cuando existe navegacion previa dentro de la
 * aplicacion (`window.history.state?.idx > 0`), y recurre a `rutaFallback`
 * cuando el usuario abrio la vista directamente.
 */
export default function BotonRegresar({ rutaFallback = '/app', etiqueta = 'Regresar', onRegresar }) {
  const navigate = useNavigate();

  function manejarRegreso() {
    if (onRegresar) {
      onRegresar();
      return;
    }
    const tieneHistorial =
      typeof window !== 'undefined' &&
      ((window.history.state && window.history.state.idx > 0) || window.history.length > 2);

    if (tieneHistorial) {
      navigate(-1);
    } else {
      navigate(rutaFallback);
    }
  }

  return (
    <button
      type="button"
      className={estilos.botonRegresar}
      onClick={manejarRegreso}
      data-testid="global-back-button"
    >
      <ArrowLeft size={15} strokeWidth={1.8} className={estilos.icono} aria-hidden="true" />
      <span>{etiqueta}</span>
    </button>
  );
}
