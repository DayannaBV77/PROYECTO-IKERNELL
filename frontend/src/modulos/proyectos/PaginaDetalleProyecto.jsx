import { useCallback, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CircleCheck,
  Flag,
  FolderX,
  Play,
  Save,
  TriangleAlert,
} from 'lucide-react';

import {
  advertenciasDeInhabilitacion,
  etiquetaEstadoOperativo,
  finalizarProyecto,
  iniciarProyecto,
  inhabilitarProyecto,
  modificarProyecto,
  obtenerProyecto,
} from '../../api/proyectos.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Confirmacion from '../../componentes/ui/Confirmacion.jsx';
import EtiquetaEstado from '../../componentes/ui/EtiquetaEstado.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import EquipoProyecto from './componentes/EquipoProyecto.jsx';
import EstadoProyecto from './componentes/EstadoProyecto.jsx';
import EtapasProyecto from './componentes/EtapasProyecto.jsx';

/** Los dos campos que el backend admite modificar (RF-014). */
function editablesDe(proyecto) {
  return {
    nombre: proyecto.nombre || '',
    descripcion: proyecto.descripcion || '',
  };
}

/**
 * Detalle de un proyecto: consulta, modificacion e inhabilitacion
 * (RF-013, RF-014, RF-015; HU-09 C03, C04 y C05).
 *
 * Como en el perfil del trabajador, esta mitad solo carga y el detalle editable
 * es un hijo que toma su estado inicial de la prop, con `key` en el
 * identificador. Asi no hay estado sincronizado desde un efecto.
 */
export default function PaginaDetalleProyecto() {
  const { id } = useParams();

  const cargar = useCallback(({ senal }) => obtenerProyecto(id, { senal }), [id]);
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [id]);

  if (cargando) {
    return (
      <Seccion titulo="Detalle del proyecto" id="detalle-proyecto">
        <EstadoCarga mensaje="Cargando el proyecto..." />
      </Seccion>
    );
  }

  if (error) {
    return (
      <Seccion titulo="Detalle del proyecto" id="detalle-proyecto">
        <VolverALaBusqueda />
        <EstadoError error={error} alReintentar={reintentar} />
      </Seccion>
    );
  }

  if (!datos) {
    return null;
  }

  return <ProyectoCargado key={id} inicial={datos} />;
}

function VolverALaBusqueda() {
  return (
    <div className={estilos.barraSuperior}>
      <Boton a="/app/proyectos" variante="texto" icono={ArrowLeft}>
        Volver a la busqueda
      </Boton>
    </div>
  );
}

/**
 * Proyecto ya cargado, con sus dos operaciones.
 *
 * La inhabilitacion sigue el orden que pide C05: primero se consultan las
 * advertencias -el backend las expone en su propio endpoint para esto- y se
 * muestran en el dialogo; solo despues se confirma. La peticion de
 * inhabilitacion viaja con `confirmado=true`, y si aun asi el servidor
 * respondiera 409 pidiendo confirmacion, sus advertencias se muestran y se
 * vuelve a pedir: el cliente nunca da por hecho que puede saltarse ese paso.
 */
function ProyectoCargado({ inicial }) {
  const ubicacion = useLocation();

  const [proyecto, setProyecto] = useState(inicial);
  const [editables, setEditables] = useState(() => editablesDe(inicial));
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarFinalizacion, setConfirmarFinalizacion] = useState(false);

  // Dialogo de inhabilitacion: null cuando esta cerrado.
  const [dialogo, setDialogo] = useState(null);

  const registrado = ubicacion.state?.registrado;

  function aplicar(actualizado, mensaje) {
    setProyecto(actualizado);
    setEditables(editablesDe(actualizado));
    setConfirmado(mensaje);
    setFallo(null);
    setErrores({});
  }

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
      aplicar(
        await modificarProyecto(proyecto.id, editables),
        'Los cambios se guardaron correctamente. Sus etapas y actividades siguen asociadas.',
      );
    } catch (error) {
      // C04: se indica que corregir y el proyecto conserva lo que tenia, porque
      // solo se reemplaza cuando el servidor confirma.
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
    } finally {
      setGuardando(false);
    }
  }

  async function alIniciar() {
    setGuardando(true);
    setFallo(null);
    setConfirmado(null);
    try {
      aplicar(await iniciarProyecto(proyecto.id), 'La ejecución del proyecto quedó iniciada.');
    } catch (error) {
      setFallo(error.message);
    } finally {
      setGuardando(false);
    }
  }

  async function alFinalizar() {
    setGuardando(true);
    setFallo(null);
    setConfirmado(null);
    try {
      const actualizado = await finalizarProyecto(proyecto.id);
      aplicar(
        actualizado,
        actualizado.excedeSeisAnios
          ? 'El proyecto quedó finalizado. Su duración superó seis años; se registró la excepción.'
          : 'El proyecto quedó finalizado.',
      );
      setConfirmarFinalizacion(false);
    } catch (error) {
      setFallo(error.message);
    } finally {
      setGuardando(false);
    }
  }

  /** Abre el dialogo y consulta las advertencias que C05 exige mostrar antes. */
  async function alPedirInhabilitacion() {
    setDialogo({ consultando: true, advertencias: [], ocupado: false });
    try {
      const advertencias = await advertenciasDeInhabilitacion(proyecto.id);
      setDialogo({ consultando: false, advertencias: advertencias || [], ocupado: false });
    } catch {
      // No poder consultarlas no debe impedir la operacion, pero tampoco
      // ocultarla: se avisa de que no se pudieron comprobar.
      setDialogo({ consultando: false, advertencias: null, ocupado: false });
    }
  }

  async function alInhabilitar() {
    setDialogo((previo) => ({ ...previo, ocupado: true }));
    setFallo(null);

    try {
      aplicar(
        await inhabilitarProyecto(proyecto.id, true),
        'El proyecto quedo inhabilitado. Sus registros historicos se conservan.',
      );
      setDialogo(null);
    } catch (error) {
      if (error.requiereConfirmacion) {
        // El servidor exige confirmar advertencias que no conociamos: se
        // muestran y se vuelve a pedir el paso, sin cerrar el dialogo.
        setDialogo({ consultando: false, advertencias: error.advertencias, ocupado: false });
        return;
      }
      setFallo(error.message);
      setDialogo(null);
    }
  }

  const habilitado = proyecto.estadoHabilitacion !== 'INHABILITADO';

  return (
    <Seccion titulo={proyecto.nombre} id="detalle-proyecto">
      <VolverALaBusqueda />

      {registrado && (
        <p className={estilos.avisoExito} role="status">
          <CircleCheck size={18} aria-hidden="true" />
          El registro se hizo correctamente. El proyecto queda habilitado y disponible para
          asignarle desarrolladores y registrar sus etapas.
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

      {proyecto.excedeSeisAnios && (
        <p className={estilos.avisoExito} role="status">
          <TriangleAlert size={18} aria-hidden="true" />
          El proyecto finalizó después de seis años; se registró la excepción.
        </p>
      )}

      <div className={estilos.perfil}>
        <div className={estilos.ficha}>
          <p className={estilos.rotulo}>Datos del proyecto</p>
          <dl className={estilos.datos}>
            <div>
              <dt>Identificador</dt>
              <dd>{proyecto.id}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>
                <EtiquetaEstado estado={proyecto.estadoHabilitacion} />
              </dd>
            </div>
            <div>
              <dt>Estado operativo</dt>
              <dd>{etiquetaEstadoOperativo(proyecto.estadoOperativo)}</dd>
            </div>
            <div>
              <dt>Inicio real</dt>
              <dd>{proyecto.fechaInicioReal || 'Sin iniciar'}</dd>
            </div>
            <div>
              <dt>Finalización real</dt>
              <dd>{proyecto.fechaFinReal || 'Pendiente'}</dd>
            </div>
            <div>
              <dt>Lider responsable</dt>
              <dd>
                {proyecto.liderResponsableId
                  ? `Trabajador n.º ${proyecto.liderResponsableId}`
                  : 'Sin registrar'}
              </dd>
            </div>
          </dl>
        </div>

        <form className={estilos.ficha} onSubmit={alGuardar} noValidate>
          <p className={estilos.rotulo}>Datos modificables</p>

          <Campo
            etiqueta="Nombre del proyecto"
            nombre="nombre"
            obligatorio
            value={editables.nombre}
            onChange={alCambiar}
            error={errores.nombre}
          />
          <Campo
            etiqueta="Descripcion"
            nombre="descripcion"
            area
            rows={6}
            value={editables.descripcion}
            onChange={alCambiar}
            error={errores.descripcion}
          />

          <div className={estilos.accionesPerfil}>
            <Boton type="submit" icono={Save} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Boton>

            {!proyecto.estadoOperativo && (
              <Boton type="button" icono={Play} onClick={alIniciar} disabled={guardando}>
                Iniciar ejecución
              </Boton>
            )}

            {proyecto.estadoOperativo === 'EN_EJECUCION' && (
              <Boton
                type="button"
                variante="secundario"
                icono={Flag}
                onClick={() => setConfirmarFinalizacion(true)}
                disabled={guardando}
              >
                Finalizar proyecto
              </Boton>
            )}

            {habilitado && (
              <Boton
                type="button"
                variante="peligro"
                icono={FolderX}
                onClick={alPedirInhabilitacion}
              >
                Inhabilitar
              </Boton>
            )}
          </div>
        </form>
      </div>

      {/* RF-016, HU-12 y RF-009, HU-10: cada seccion consulta lo suyo, de modo
          que actualizar una no obliga a recargar el resto de la pantalla. */}
      <EstadoProyecto
        key={`${proyecto.id}-${proyecto.estadoOperativo || 'SIN_INICIAR'}`}
        proyecto={proyecto}
      />

      <EtapasProyecto proyecto={proyecto} />

      <EquipoProyecto proyecto={proyecto} />

      <Confirmacion
        abierto={confirmarFinalizacion}
        titulo="Finalizar el proyecto"
        textoConfirmar="Finalizar"
        ocupado={guardando}
        alConfirmar={alFinalizar}
        alCancelar={() => setConfirmarFinalizacion(false)}
      >
        <p>
          Se guardará la fecha real de finalización de hoy. Si la duración supera seis años, se
          permitirá finalizar y el sistema lo indicará.
        </p>
      </Confirmacion>

      <Confirmacion
        abierto={dialogo !== null}
        titulo="Inhabilitar el proyecto"
        textoConfirmar="Inhabilitar"
        ocupado={dialogo?.ocupado || dialogo?.consultando}
        alConfirmar={alInhabilitar}
        alCancelar={() => setDialogo(null)}
      >
        {dialogo?.consultando && <p>Comprobando si el proyecto tiene dependencias...</p>}

        {!dialogo?.consultando && dialogo?.advertencias === null && (
          <p className={estilos.avisoError}>
            <TriangleAlert size={16} aria-hidden="true" />
            No se pudieron comprobar las dependencias del proyecto.
          </p>
        )}

        {!dialogo?.consultando && dialogo?.advertencias?.length > 0 && (
          <>
            <p>Antes de continuar, revise estas advertencias:</p>
            <ul className={estilos.advertencias}>
              {dialogo.advertencias.map((advertencia) => (
                <li key={advertencia}>{advertencia}</li>
              ))}
            </ul>
          </>
        )}

        {!dialogo?.consultando && dialogo?.advertencias?.length === 0 && (
          <p>El proyecto no tiene dependencias registradas que impidan inhabilitarlo.</p>
        )}

        <p className={estilos.notaDialogo}>
          No se borra nada: sus registros historicos se conservan y ya no se le podran asignar
          trabajadores.
        </p>
      </Confirmacion>
    </Seccion>
  );
}
