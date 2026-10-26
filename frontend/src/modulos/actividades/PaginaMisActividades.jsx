import { useCallback, useState } from 'react';
import { CircleCheck, ClipboardCheck, Play, TriangleAlert } from 'lucide-react';

import {
  ETIQUETA_PRIORIDAD,
  obtenerMisActividades,
  registrarEjecucion,
} from '../../api/actividades.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';

/**
 * Actividades asignadas al trabajador y su ejecucion (RF-022, HU-16).
 *
 * El servidor decide que actividades son suyas a partir de la sesion: esta
 * pantalla no envia ningun identificador de trabajador, de modo que no hay
 * forma de pedir las de otra persona desde el cliente. Ejecutar una actividad
 * ajena o inexistente lo rechaza el servidor igualmente (C03).
 *
 * Sirve a cualquier trabajador con actividades asignadas, no solo a los de tipo
 * desarrollador: C05 contempla al lider al que asignaron como desarrollador en
 * otro proyecto, y filtrar por el tipo global lo dejaria fuera (RN-05).
 */
export default function PaginaMisActividades() {
  const [recarga, setRecarga] = useState(0);
  const [abierta, setAbierta] = useState(null);
  const [confirmado, setConfirmado] = useState(null);

  const cargar = useCallback(({ senal }) => obtenerMisActividades({ senal }), []);
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [recarga]);

  const actividades = datos?.contenido || [];

  function alRegistrar(mensaje) {
    setConfirmado(mensaje);
    setAbierta(null);
    setRecarga((numero) => numero + 1);
  }

  return (
    <Seccion
      titulo="Mis actividades"
      descripcion="Actividades que el lider del proyecto registro y le asigno."
      id="mis-actividades"
    >
      {confirmado && (
        <p className={estilos.avisoExito} role="status">
          <CircleCheck size={18} aria-hidden="true" />
          {confirmado}
        </p>
      )}

      {cargando && <EstadoCarga mensaje="Cargando sus actividades..." esqueleto={2} />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {/* C04: el aviso lo manda el servidor, no se muestra una lista vacia. */}
      {!cargando && !error && actividades.length === 0 && (
        <EstadoVacio mensaje={datos?.mensaje} icono={ClipboardCheck} />
      )}

      {!cargando && !error && actividades.length > 0 && (
        <div className={estilos.listaActividades}>
          {actividades.map((actividad) => (
            <article key={actividad.id} className={estilos.actividad}>
              <div className={estilos.actividadCabecera}>
                <div>
                  <p className={estilos.actividadProyecto}>
                    {actividad.proyectoNombre} · {actividad.etapaNombre}
                    {/* Prioridad y dia los anade RF-038 y pueden faltar: solo se
                        muestran cuando el lider los diligencio. */}
                    {actividad.prioridad &&
                      ` · Prioridad ${ETIQUETA_PRIORIDAD[actividad.prioridad]}`}
                    {actividad.fechaPlanificada &&
                      ` · ${formatearFecha(actividad.fechaPlanificada)}`}
                  </p>
                  <p className={estilos.actividadDescripcion}>{actividad.descripcion}</p>
                </div>
                {/* Los estados posibles los define la empresa (D-04). */}
                {actividad.estado && (
                  <span className={estilos.actividadEstado}>{actividad.estado}</span>
                )}
              </div>

              {abierta === actividad.id ? (
                <FormularioDeEjecucion
                  actividad={actividad}
                  alRegistrar={alRegistrar}
                  alCancelar={() => setAbierta(null)}
                />
              ) : (
                <Boton
                  variante="secundario"
                  icono={Play}
                  onClick={() => {
                    setAbierta(actividad.id);
                    setConfirmado(null);
                  }}
                >
                  Registrar ejecucion
                </Boton>
              )}
            </article>
          ))}
        </div>
      )}
    </Seccion>
  );
}

/**
 * Registro de una ejecucion (HU-16 C02).
 *
 * Los dos campos son opcionales porque la empresa todavia no define que debe
 * registrarse al ejecutar una actividad (D-04). Lo unico que el criterio exige
 * es que la ejecucion quede guardada, asi que la pantalla no inventa campos
 * obligatorios que el servidor no pide.
 */
function FormularioDeEjecucion({ actividad, alRegistrar, alCancelar }) {
  const [observaciones, setObservaciones] = useState('');
  const [finalizada, setFinalizada] = useState(false);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setFallo(null);
    setErrores({});

    try {
      await registrarEjecucion(actividad.id, { observaciones, finalizada });
      alRegistrar(
        finalizada
          ? 'La ejecucion quedo registrada y la actividad se marco como finalizada.'
          : 'La ejecucion quedo registrada.',
      );
    } catch (error) {
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={estilos.ejecucion} onSubmit={alEnviar} noValidate>
      {fallo && (
        <p className={estilos.avisoError} role="alert">
          <TriangleAlert size={16} aria-hidden="true" />
          {fallo}
        </p>
      )}

      <Campo
        etiqueta="Observaciones"
        nombre="observaciones"
        area
        rows={3}
        value={observaciones}
        onChange={(evento) => setObservaciones(evento.target.value)}
        error={errores.observaciones}
        pista="Opcional. Deje constancia del trabajo realizado."
      />

      <label className={estilos.casilla}>
        <input
          type="checkbox"
          checked={finalizada}
          onChange={(evento) => setFinalizada(evento.target.checked)}
          disabled={enviando}
        />
        <span>Con este registro la actividad queda finalizada</span>
      </label>

      <div className={estilos.accionesBuscador}>
        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Registrando...' : 'Guardar ejecucion'}
        </Boton>
        <Boton type="button" variante="texto" onClick={alCancelar} disabled={enviando}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
