import { TriangleAlert } from 'lucide-react';

import Boton from '../ui/Boton.jsx';
import estilos from './Estados.module.css';

/**
 * Estado de error.
 *
 * Muestra el mensaje que envia el servidor, que ya esta redactado para el
 * usuario, y anade la via de correccion: reintentar. Nunca se inventa un texto
 * cuando el backend manda uno.
 */
export default function EstadoError({ error, alReintentar, titulo = 'No se pudo cargar la informacion' }) {
  const detalle = error?.message || 'Ocurrio un error inesperado.';

  return (
    <div className={estilos.bloque} role="alert">
      <TriangleAlert size={28} className={estilos.iconoError} aria-hidden="true" />
      <p className={estilos.titulo}>{titulo}</p>
      <p className={estilos.detalle}>{detalle}</p>
      {alReintentar && (
        <div className={estilos.accion}>
          <Boton variante="secundario" onClick={alReintentar}>
            Reintentar
          </Boton>
        </div>
      )}
    </div>
  );
}
