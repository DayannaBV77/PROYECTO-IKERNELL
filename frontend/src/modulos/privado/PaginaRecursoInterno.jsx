import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import { obtenerPrograma, obtenerTutorial } from '../../api/corporativo.js';
import Boton from '../../componentes/ui/Boton.jsx';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import { usePeticion } from '../../hooks/usePeticion.js';
import estilos from './PaginaRecursoInterno.module.css';

/**
 * Detalle de un programa o de un tutorial (HU-21 C02 y C03).
 *
 * El listado no trae el contenido ni el enlace: los pide esta pantalla, para
 * que una lista no arrastre el cuerpo completo de cada tutorial (RNF-005). Por
 * eso el detalle es una peticion propia y no un dato que ya estuviera en mano.
 *
 * El enlace de un programa es "el enlace autorizado" de RF-029: se abre en una
 * pestana nueva y el aplicativo no intenta servir el archivo.
 *
 * Un identificador que no exista, o que corresponda a algo sin publicar, lo
 * rechaza el servidor con su propio mensaje (404), que es el que se muestra.
 */
const RECURSOS = {
  PROGRAMA: {
    obtener: obtenerPrograma,
    volverA: '/app/biblioteca',
    volverTexto: 'Volver a la biblioteca',
    seccion: 'Programa',
  },
  TUTORIAL: {
    obtener: obtenerTutorial,
    volverA: '/app/tutoriales',
    volverTexto: 'Volver a los tutoriales',
    seccion: 'Tutorial',
  },
};

export default function PaginaRecursoInterno({ tipo }) {
  const { id } = useParams();
  const { obtener, volverA, volverTexto, seccion } = RECURSOS[tipo];

  const cargar = useCallback(({ senal }) => obtener(id, { senal }), [obtener, id]);
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [tipo, id]);

  return (
    <Seccion titulo={datos?.titulo || seccion} id="recurso-interno">
      <div className={estilos.volver}>
        <Boton a={volverA} variante="texto" icono={ArrowLeft}>
          {volverTexto}
        </Boton>
      </div>

      {cargando && <EstadoCarga mensaje={`Cargando el ${seccion.toLowerCase()}...`} />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {!cargando && !error && datos && (
        <article className={estilos.ficha}>
          {(datos.categoria || datos.version) && (
            <p className={estilos.etiquetas}>
              {[datos.categoria, datos.version && `version ${datos.version}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}

          {datos.descripcion && <p className={estilos.descripcion}>{datos.descripcion}</p>}

          {/* `white-space: pre-line` conserva los saltos de linea con que el
              contenido se guardo, sin interpretar el texto como marcado. */}
          {datos.contenido && <div className={estilos.contenido}>{datos.contenido}</div>}

          {datos.enlace && (
            <a
              className={estilos.enlace}
              href={datos.enlace}
              target="_blank"
              rel="noreferrer noopener"
            >
              Abrir el recurso autorizado
              <ExternalLink size={18} aria-hidden="true" />
              <span className="solo-lectores">(se abre en una pestana nueva)</span>
            </a>
          )}
        </article>
      )}
    </Seccion>
  );
}
