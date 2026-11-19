import { useCallback, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { CircleCheck, Save, TriangleAlert } from 'lucide-react';

import {
  TIPOS_TRABAJADOR,
  habilitarTrabajador,
  inhabilitarTrabajador,
  modificarTrabajador,
  obtenerTrabajador,
} from '../../api/trabajadores.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Confirmacion from '../../componentes/ui/Confirmacion.jsx';
import EtiquetaEstado from '../../componentes/ui/EtiquetaEstado.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import { useNotificador } from '../../componentes/ui/Notificador.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';
import SelectorEspecialidades from './componentes/SelectorEspecialidades.jsx';
import SelectorProfesiones from './componentes/SelectorProfesiones.jsx';
import SubidaFotografia from './componentes/SubidaFotografia.jsx';
import { esFormatoDireccionColombiana, validarCampoTrabajador } from './validaciones.js';

/** Los tres campos que RF-005 autoriza a modificar. */
function editablesDe(trabajador) {
  return {
    direccion: trabajador.direccion || '',
    profesion: trabajador.profesion || '',
    especialidadDesarrollo: trabajador.especialidadDesarrollo || '',
    tipoTrabajador: trabajador.tipoTrabajador || '',
    habilidades: trabajador.habilidades || [],
  };
}

/**
 * Perfil de un trabajador: consulta, modificacion e inhabilitacion
 * (RF-004, RF-005, RF-007; HU-05 C03, C04 y C05).
 *
 * Esta mitad solo carga el perfil. La vista editable es un componente aparte
 * que recibe el perfil cargado y toma de el su estado inicial, con `key` en el
 * identificador para que cambiar de trabajador lo vuelva a montar. Asi el
 * estado editable no se sincroniza desde un efecto, que es lo que produciria
 * los renders en cascada que usePeticion evita a proposito.
 */
export default function PaginaPerfilTrabajador() {
  const { id } = useParams();

  const cargar = useCallback(({ senal }) => obtenerTrabajador(id, { senal }), [id]);
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [id]);

  if (cargando) {
    return (
      <Seccion titulo="Perfil del trabajador" id="perfil-trabajador">
        <EstadoCarga mensaje="Cargando el perfil..." />
      </Seccion>
    );
  }

  if (error) {
    return (
      <Seccion titulo="Perfil del trabajador" id="perfil-trabajador">
        <VolverALaBusqueda />
        <EstadoError error={error} alReintentar={reintentar} />
      </Seccion>
    );
  }

  if (!datos) {
    return null;
  }

  return <PerfilCargado key={id} inicial={datos} />;
}

function VolverALaBusqueda() {
  return (
    <div className={estilos.barraSuperior}>
      <Boton a="/app/trabajadores" variante="texto">
        Volver a la busqueda
      </Boton>
    </div>
  );
}

/**
 * Perfil ya cargado, con sus dos operaciones.
 *
 * Modificar e inhabilitar devuelven el perfil completo, de modo que la pantalla
 * se actualiza con lo que el servidor confirma y no con lo que el cliente
 * supone.
 *
 * Solo son editables direccion, especialidad y tipo: los tres campos que
 * RF-005 autoriza. La identificacion no es modificable -el backend no admite
 * recibirla- y por eso figura entre los datos fijos.
 *
 * La inhabilitacion pide confirmacion antes de ejecutarse (C05) y no borra
 * nada: cambia el estado y conserva el historial (RN-02).
 */
function PerfilCargado({ inicial }) {
  const ubicacion = useLocation();
  const notificador = useNotificador();

  const [trabajador, setTrabajador] = useState(inicial);
  const [editables, setEditables] = useState(() => editablesDe(inicial));
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [inhabilitando, setInhabilitando] = useState(false);
  const [confirmandoHabilitacion, setConfirmandoHabilitacion] = useState(false);
  const [habilitando, setHabilitando] = useState(false);

  // Avisos del registro recien hecho, que llegan en el estado de la navegacion
  // (HU-04 C01 y C05).
  const registrado = ubicacion.state?.registrado;
  const falloFotografia = ubicacion.state?.falloFotografia;

  /** Reemplaza el perfil por el que confirma el servidor. */
  function aplicar(actualizado, mensaje) {
    setTrabajador(actualizado);
    setEditables(editablesDe(actualizado));
    setConfirmado(mensaje);
    notificador.exito(mensaje, 'Perfil actualizado');
    setFallo(null);
    setErrores({});
  }

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setEditables((previos) => ({ ...previos, [name]: value }));
    if (name === 'direccion') {
      const err = validarCampoTrabajador('direccion', value);
      setErrores((previos) => ({ ...previos, direccion: err || undefined }));
    } else {
      setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
    }
    setConfirmado(null);
  }

  async function alGuardar(evento) {
    evento.preventDefault();
    setFallo(null);
    setConfirmado(null);

    const erroresValidacion = {};
    if (!editables.profesion || !editables.profesion.trim() || editables.profesion === 'Seleccione una profesión') {
      erroresValidacion.profesion = 'La profesión es obligatoria. Por favor seleccione una profesión del catálogo.';
    }
    if (!editables.direccion || !editables.direccion.trim()) {
      erroresValidacion.direccion = 'La dirección es obligatoria.';
    } else if (!esFormatoDireccionColombiana(editables.direccion)) {
      erroresValidacion.direccion =
        'Use nomenclatura urbana (ej.: Calle 45 # 12-30) o una referencia rural (vereda, finca, corregimiento o km).';
    }
    if (!editables.especialidadDesarrollo) {
      erroresValidacion.especialidadDesarrollo = 'Debe indicar la especialidad de desarrollo.';
    }
    if (!editables.tipoTrabajador) {
      erroresValidacion.tipoTrabajador = 'Debe seleccionar un tipo de trabajador.';
    }

    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      const mensajeError = erroresValidacion.profesion || 'Corrija los campos señalados antes de guardar los cambios.';
      setFallo(mensajeError);
      notificador.error(mensajeError, 'Validación de perfil');
      return;
    }

    setGuardando(true);
    setErrores({});

    try {
      aplicar(
        await modificarTrabajador(trabajador.id, editables),
        'Los cambios se guardaron correctamente.',
      );
    } catch (error) {
      // C04: se indica que corregir y el perfil conserva los datos que tenia,
      // porque solo se reemplaza cuando el servidor confirma.
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
    } finally {
      setGuardando(false);
    }
  }

  async function alInhabilitar() {
    setInhabilitando(true);
    setFallo(null);

    try {
      aplicar(
        await inhabilitarTrabajador(trabajador.id),
        'El trabajador quedó inhabilitado exitosamente. Su historial se conserva en el sistema.',
      );
    } catch (error) {
      setFallo(error.message);
      notificador.error(error.message || 'No se pudo inhabilitar al trabajador.', 'Error');
    } finally {
      setInhabilitando(false);
      setConfirmando(false);
    }
  }

  async function alHabilitar() {
    setHabilitando(true);
    setFallo(null);

    try {
      aplicar(
        await habilitarTrabajador(trabajador.id),
        'El trabajador quedó habilitado exitosamente y puede volver a recibir asignaciones.',
      );
    } catch (error) {
      setFallo(error.message);
      notificador.error(error.message || 'No se pudo habilitar al trabajador.', 'Error');
    } finally {
      setHabilitando(false);
      setConfirmandoHabilitacion(false);
    }
  }

  const habilitado = trabajador.estado !== 'INHABILITADO';

  return (
    <Seccion titulo={`${trabajador.nombre} ${trabajador.apellido}`} id="perfil-trabajador">
      <VolverALaBusqueda />

      {registrado && (
        <p className={estilos.avisoExito} role="status">
          <CircleCheck size={18} aria-hidden="true" />
          El registro se hizo correctamente.
        </p>
      )}

      {falloFotografia && (
        <p className={estilos.avisoError} role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          El perfil se guardo, pero la fotografia no se adjunto: {falloFotografia}
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
          <p className={estilos.rotulo}>Datos no modificables</p>
          <dl className={estilos.datos}>
            <div>
              <dt>Tipo de identificación</dt>
              <dd>
                {trabajador.tipoIdentificacion === 'CEDULA_EXTRANJERIA'
                  ? 'Cédula de extranjería'
                  : 'Cédula de ciudadanía'}
              </dd>
            </div>
            <div>
              <dt>Identificacion</dt>
              <dd>{trabajador.identificacion}</dd>
            </div>
            <div>
              <dt>Nombre completo</dt>
              <dd>
                {trabajador.nombre} {trabajador.apellido}
              </dd>
            </div>
            <div>
              <dt>Fecha de nacimiento</dt>
              <dd>{formatearFecha(trabajador.fechaNacimiento)}</dd>
            </div>
            {trabajador.correoCorporativo && (
              <div>
                <dt>Correo corporativo</dt>
                <dd>{trabajador.correoCorporativo}</dd>
              </div>
            )}
            <div>
              <dt>Estado</dt>
              <dd>
                <EtiquetaEstado estado={trabajador.estado} />
              </dd>
            </div>
          </dl>

          <SubidaFotografia
            trabajador={trabajador}
            alActualizar={(actualizado) =>
              aplicar(actualizado, 'La fotografia se adjunto al perfil.')
            }
          />
        </div>

        <form className={estilos.ficha} onSubmit={alGuardar} noValidate>
          <p className={estilos.rotulo}>Datos modificables</p>

          <Campo
            etiqueta="Direccion"
            nombre="direccion"
            obligatorio
            value={editables.direccion}
            onChange={alCambiar}
            error={errores.direccion}
          />
          <SelectorProfesiones
            value={editables.profesion}
            onChange={(valor) => {
              setEditables((previos) => ({ ...previos, profesion: valor }));
              setErrores((previos) => {
                if (!previos.profesion) {
                  return previos;
                }
                const siguiente = { ...previos };
                delete siguiente.profesion;
                return siguiente;
              });
              setConfirmado(null);
            }}
            error={errores.profesion}
            obligatorio
          />
          <SelectorEspecialidades
            value={editables.especialidadDesarrollo}
            onChange={(valor) => {
              setEditables((previos) => ({ ...previos, especialidadDesarrollo: valor }));
              setErrores((previos) => {
                if (!previos.especialidadDesarrollo) {
                  return previos;
                }
                const siguiente = { ...previos };
                delete siguiente.especialidadDesarrollo;
                return siguiente;
              });
              setConfirmado(null);
            }}
            error={errores.especialidadDesarrollo}
            obligatorio
          />
          <Campo
            etiqueta="Tipo de trabajador"
            nombre="tipoTrabajador"
            opciones={TIPOS_TRABAJADOR}
            obligatorio
            value={editables.tipoTrabajador}
            onChange={alCambiar}
            error={errores.tipoTrabajador}
          />

          <div className={estilos.accionesPerfil}>
            <Boton type="submit" icono={Save} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Boton>

            {habilitado ? (
              <Boton
                type="button"
                variante="peligro"
                onClick={() => setConfirmando(true)}
              >
                Inhabilitar
              </Boton>
            ) : (
              <Boton
                type="button"
                variante="exito"
                onClick={() => setConfirmandoHabilitacion(true)}
              >
                Habilitar
              </Boton>
            )}
          </div>
        </form>
      </div>

      <Confirmacion
        abierto={confirmando}
        titulo="Inhabilitar al trabajador"
        textoConfirmar="Inhabilitar"
        ocupado={inhabilitando}
        alConfirmar={alInhabilitar}
        alCancelar={() => setConfirmando(false)}
      >
        <p>
          {trabajador.nombre} {trabajador.apellido} dejara de recibir asignaciones a proyectos y no
          podra entrar a los servicios internos.
        </p>
        <p className={estilos.notaDialogo}>
          No se borra nada: su historial se conserva y el perfil queda marcado como inhabilitado.
        </p>
      </Confirmacion>

      <Confirmacion
        abierto={confirmandoHabilitacion}
        titulo="Habilitar al trabajador"
        textoConfirmar="Habilitar"
        varianteConfirmar="exito"
        ocupado={habilitando}
        alConfirmar={alHabilitar}
        alCancelar={() => setConfirmandoHabilitacion(false)}
      >
        <p>
          ¿Desea reactivar a {trabajador.nombre} {trabajador.apellido}?
        </p>
        <p className={estilos.notaDialogo}>
          El trabajador volverá al estado habilitado y podrá operar y recibir asignaciones a proyectos nuevamente.
        </p>
      </Confirmacion>
    </Seccion>
  );
}
