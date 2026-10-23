import { useCallback, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, CircleCheck, Save, TriangleAlert } from 'lucide-react';

import { modificarActividad, obtenerActividad } from '../../api/actividades.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import { useContextoDeProyecto } from './componentes/useContextoDeProyecto.js';

/**
 * Detalle de una actividad y su modificacion (RF-020, RF-021; HU-13 C05).
 *
 * Como en las demas pantallas de detalle, la carga vive aqui y la vista
 * editable es un hijo que toma su estado inicial de la prop, con `key` en el
 * identificador; asi no hay estado sincronizado desde un efecto.
 */
export default function PaginaDetalleActividad() {
  const { id } = useParams();

  const cargar = useCallback(({ senal }) => obtenerActividad(id, { senal }), [id]);
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [id]);

  if (cargando) {
    return (
      <Seccion titulo="Actividad" id="detalle-actividad">
        <EstadoCarga mensaje="Cargando la actividad..." />
      </Seccion>
    );
  }

  if (error) {
    return (
      <Seccion titulo="Actividad" id="detalle-actividad">
        <Volver />
        <EstadoError error={error} alReintentar={reintentar} />
      </Seccion>
    );
  }

  if (!datos) {
    return null;
  }

  return <ActividadCargada key={id} inicial={datos} />;
}

function Volver() {
  return (
    <div className={estilos.barraSuperior}>
      <Boton a="/app/actividades" variante="texto" icono={ArrowLeft}>
        Volver a la busqueda
      </Boton>
    </div>
  );
}

/**
 * Actividad ya cargada.
 *
 * Solo se pueden cambiar la etapa y la descripcion. El desarrollador no:
 * RF-021 ordena conservar esa asociacion y el servidor no admite el campo, de
 * modo que ofrecerlo seria prometer algo que no ocurre. La etapa si, y solo
 * entre las del mismo proyecto, con lo que la garantia de C05 -que la actividad
 * siga en el mismo proyecto y con el mismo desarrollador- se mantiene.
 */
function ActividadCargada({ inicial }) {
  const ubicacion = useLocation();

  const [actividad, setActividad] = useState(inicial);
  const [editables, setEditables] = useState(() => ({
    etapaId: String(inicial.etapaId ?? ''),
    descripcion: inicial.descripcion || '',
  }));
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const { opcionesDeEtapa } = useContextoDeProyecto(actividad.proyectoId);
  const registrada = ubicacion.state?.registrada;

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setEditables((previos) => ({ ...previos, [name]: value }));
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
    setConfirmado(null);
  }

  async function alGuardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setFallo(null);
    setErrores({});
    setConfirmado(null);

    try {
      const actualizada = await modificarActividad(actividad.id, {
        etapaId: editables.etapaId ? Number(editables.etapaId) : null,
        descripcion: editables.descripcion,
      });
      setActividad(actualizada);
      setEditables({
        etapaId: String(actualizada.etapaId ?? ''),
        descripcion: actualizada.descripcion || '',
      });
      setConfirmado('Los cambios se guardaron correctamente.');
    } catch (error) {
      // C02: se indica que corregir y la actividad conserva lo que tenia.
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Seccion titulo={`Actividad n.º ${actividad.id}`} id="detalle-actividad">
      <Volver />

      {registrada && (
        <p className={estilos.avisoExito} role="status">
          <CircleCheck size={18} aria-hidden="true" />
          La actividad se registro y quedo asociada al proyecto y al desarrollador.
        </p>
      )}

      {confirmado && (
        <p className={estilos.avisoExito} role="status">
          <CircleCheck size={18} aria-hidden="true" />
          {confirmado}
        </p>
      )}

      {fallo && (
        <p className={estilos.avisoError} role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          {fallo}
        </p>
      )}

      <div className={estilos.perfil}>
        <div className={estilos.ficha}>
          <p className={estilos.rotulo}>Asociaciones que no cambian</p>
          <dl className={estilos.datos}>
            <div>
              <dt>Proyecto</dt>
              <dd>{actividad.proyectoNombre}</dd>
            </div>
            <div>
              <dt>Desarrollador</dt>
              <dd>{actividad.desarrolladorNombreCompleto}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              {/* Los estados posibles los define la empresa (D-04). */}
              <dd>{actividad.estado || 'Sin definir'}</dd>
            </div>
          </dl>
        </div>

        <form className={estilos.ficha} onSubmit={alGuardar} noValidate>
          <p className={estilos.rotulo}>Datos modificables</p>

          <Campo
            etiqueta="Etapa"
            nombre="etapaId"
            opciones={opcionesDeEtapa}
            obligatorio
            value={editables.etapaId}
            onChange={alCambiar}
            error={errores.etapaId}
            pista="Solo etapas del mismo proyecto."
          />
          <Campo
            etiqueta="Descripcion de la actividad"
            nombre="descripcion"
            area
            rows={6}
            obligatorio
            value={editables.descripcion}
            onChange={alCambiar}
            error={errores.descripcion}
          />

          <div className={estilos.accionesPerfil}>
            <Boton type="submit" icono={Save} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Boton>
          </div>
        </form>
      </div>
    </Seccion>
  );
}
