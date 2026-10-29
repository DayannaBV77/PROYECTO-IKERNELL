import { useCallback, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, CircleCheck, Save, TriangleAlert, UserX } from 'lucide-react';

import {
  TIPOS_TRABAJADOR,
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
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';
import SelectorEspecialidades from './componentes/SelectorEspecialidades.jsx';
import SelectorProfesiones from './componentes/SelectorProfesiones.jsx';
import SubidaFotografia from './componentes/SubidaFotografia.jsx';
import SelectorHabilidades from './componentes/SelectorHabilidades.jsx';

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
      <Boton a="/app/trabajadores" variante="texto" icono={ArrowLeft}>
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

  const [trabajador, setTrabajador] = useState(inicial);
  const [editables, setEditables] = useState(() => editablesDe(inicial));
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [inhabilitando, setInhabilitando] = useState(false);

  // Avisos del registro recien hecho, que llegan en el estado de la navegacion
  // (HU-04 C01 y C05).
  const registrado = ubicacion.state?.registrado;
  const falloFotografia = ubicacion.state?.falloFotografia;

  /** Reemplaza el perfil por el que confirma el servidor. */
  function aplicar(actualizado, mensaje) {
    setTrabajador(actualizado);
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

  function alCambiarHabilidades(habilidades) {
    setEditables((previos) => ({ ...previos, habilidades }));
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
        'El trabajador quedo inhabilitado. Su historial se conserva.',
      );
    } catch (error) {
      setFallo(error.message);
    } finally {
      setInhabilitando(false);
      setConfirmando(false);
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
              <dt>Profesion</dt>
              <dd>{trabajador.profesion}</dd>
            </div>
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

          <SelectorHabilidades
            seleccionadas={editables.habilidades}
            onChange={alCambiarHabilidades}
          />

          <div className={estilos.accionesPerfil}>
            <Boton type="submit" icono={Save} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Boton>

            {habilitado && (
              <Boton
                type="button"
                variante="peligro"
                icono={UserX}
                onClick={() => setConfirmando(true)}
              >
                Inhabilitar
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
    </Seccion>
  );
}
