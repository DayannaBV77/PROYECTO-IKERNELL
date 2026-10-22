import { useCallback } from 'react';

import { obtenerSeccion } from '../../../api/contenidoPublico.js';
import EstadoCarga from '../../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../../componentes/estados/EstadoVacio.jsx';
import Seccion from '../../../componentes/ui/Seccion.jsx';
import { usePeticion } from '../../../hooks/usePeticion.js';

/**
 * Seccion publica alimentada por el backend.
 *
 * Resuelve en un solo sitio los cuatro estados que toda pantalla debe
 * contemplar: carga, error, ausencia de contenido y contenido disponible.
 *
 * Cuando una seccion no tiene nada publicado, el backend responde 200 con el
 * aviso en `mensaje` en lugar de una lista vacia (RN-14, HU-01 C02). Ese texto
 * es el que se muestra; el cliente no redacta uno propio.
 */
export default function SeccionContenido({
  tipo,
  titulo,
  descripcion,
  busqueda,
  fondo = 'clara',
  id,
  esqueleto = 3,
  iconoVacio,
  children,
  antesDelContenido,
}) {
  const cargar = useCallback(
    ({ senal }) => obtenerSeccion(tipo, busqueda, { senal }),
    [tipo, busqueda],
  );

  const { datos, error, cargando, reintentar } = usePeticion(cargar, [tipo, busqueda]);

  return (
    <Seccion titulo={titulo} descripcion={descripcion} fondo={fondo} id={id}>
      {antesDelContenido}

      {cargando && <EstadoCarga esqueleto={esqueleto} mensaje={`Cargando ${titulo.toLowerCase()}...`} />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {!cargando && !error && datos?.contenido?.length > 0 && children(datos.contenido)}

      {!cargando && !error && !datos?.contenido?.length && (
        <EstadoVacio
          mensaje={datos?.mensaje || 'Esta seccion aun no tiene contenido publicado.'}
          icono={iconoVacio}
        />
      )}
    </Seccion>
  );
}
