import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import Campo from '../../../componentes/ui/Campo.jsx';
import EstadoCarga from '../../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../../componentes/estados/EstadoVacio.jsx';
import Seccion, { Rejilla } from '../../../componentes/ui/Seccion.jsx';
import Tarjeta from '../../../componentes/ui/Tarjeta.jsx';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { usePeticion } from '../../../hooks/usePeticion.js';

/**
 * Listado de recursos internos con buscador (HU-21 C01, C03, C04 y C05).
 *
 * Es el equivalente privado de SeccionContenido: resuelve en un solo sitio los
 * cuatro estados -carga, error, sin resultados y contenido- para la biblioteca
 * de programas y para los tutoriales, que comparten forma de respuesta.
 *
 * La busqueda la resuelve el servidor (HU-21 C04), no un filtrado local: de
 * otro modo solo buscaria dentro de lo ya descargado. Cuando no hay resultados,
 * el backend responde 200 con el aviso en `mensaje` (C05, RN-14) y ese es el
 * texto que se muestra.
 *
 * @param {Function} obtener  (busqueda, opciones) => Promise; debe ser estable
 * @param {string}   rutaBase prefijo de la ruta de detalle
 */
export default function ListaRecursos({
  titulo,
  descripcion,
  etiquetaBusqueda,
  obtener,
  rutaBase,
  iconoVacio,
  id,
  recarga = 0,
}) {
  const [termino, setTermino] = useState('');
  const busqueda = useDebounce(termino, 350);

  const cargar = useCallback(({ senal }) => obtener(busqueda, { senal }), [obtener, busqueda]);
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [busqueda, recarga]);

  return (
    <Seccion titulo={titulo} descripcion={descripcion} id={id}>
      <div style={{ maxWidth: '520px', margin: '0 auto var(--s-6)' }}>
        <Campo
          etiqueta={etiquetaBusqueda}
          nombre="busqueda"
          tipo="search"
          value={termino}
          onChange={(evento) => setTermino(evento.target.value)}
          placeholder="Escriba una palabra clave"
        />
      </div>

      {cargando && <EstadoCarga esqueleto={3} mensaje={`Cargando ${titulo.toLowerCase()}...`} />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {!cargando && !error && datos?.contenido?.length > 0 && (
        <Rejilla columnas={3}>
          {datos.contenido.map((recurso) => (
            <Tarjeta
              key={recurso.id}
              como={Link}
              to={`${rutaBase}/${recurso.id}`}
              interactiva
              titulo={recurso.titulo}
              pie={etiquetaDeRecurso(recurso)}
            >
              {recurso.descripcion}
            </Tarjeta>
          ))}
        </Rejilla>
      )}

      {!cargando && !error && !datos?.contenido?.length && (
        <EstadoVacio
          mensaje={datos?.mensaje || 'Todavia no hay nada publicado en esta seccion.'}
          icono={iconoVacio}
        />
      )}
    </Seccion>
  );
}

/** Categoria y version, solo si el recurso las trae. */
function etiquetaDeRecurso({ categoria, version }) {
  const partes = [categoria, version && `version ${version}`].filter(Boolean);
  return partes.length > 0 ? partes.join(' · ') : null;
}
