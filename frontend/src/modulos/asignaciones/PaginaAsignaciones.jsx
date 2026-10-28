import { useCallback, useState } from 'react';
import { CircleCheck, Link2, Search, TriangleAlert } from 'lucide-react';

import {
  ETIQUETA_ROL,
  ROLES_EN_PROYECTO,
  asignacionesDeProyecto,
  asignacionesDeTrabajador,
  asignarTrabajador,
  obtenerProyectosAsignables,
} from '../../api/asignaciones.js';
import { buscarTrabajadores } from '../../api/trabajadores.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Confirmacion from '../../componentes/ui/Confirmacion.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { ESPECIALIDADES_DESARROLLO } from '../trabajadores/catalogoEspecialidades.js';
import { PROFESIONES } from '../trabajadores/catalogoProfesiones.js';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';

const VACIO = { trabajadorId: '', proyectoId: '', rolEnProyecto: '' };
const FILTROS_TRABAJADOR_VACIOS = {
  identificacion: '',
  especialidadDesarrollo: '',
  profesion: '',
  nombre: '',
  apellido: '',
};

const OPCIONES_PROFESIONES = [
  { valor: '', texto: 'Todas las profesiones' },
  ...PROFESIONES.map((profesion) => ({ valor: profesion, texto: profesion })),
];

const OPCIONES_ESPECIALIDADES = [
  { valor: '', texto: 'Todas las especialidades' },
  ...ESPECIALIDADES_DESARROLLO.map((especialidad) => ({ valor: especialidad, texto: especialidad })),
];

function normalizarTexto(valor = '') {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function filtrarTrabajadores(trabajadores, filtros = FILTROS_TRABAJADOR_VACIOS) {
  const criterios = Object.entries(filtros).filter(([, valor]) => String(valor ?? '').trim() !== '');

  if (criterios.length === 0) {
    return trabajadores;
  }

  return trabajadores.filter((trabajador) => {
    return criterios.every(([campo, valor]) => {
      const texto = {
        identificacion: trabajador.identificacion ?? '',
        especialidadDesarrollo: trabajador.especialidadDesarrollo ?? '',
        profesion: trabajador.profesion ?? '',
        nombre: trabajador.nombre ?? '',
        apellido: trabajador.apellido ?? '',
      }[campo];

      return normalizarTexto(texto).includes(normalizarTexto(valor));
    });
  });
}

/**
 * Asignacion de trabajadores a proyectos (RF-003, HU-06).
 *
 * Es la asignacion del coordinador, distinta de la de HU-10: alli el lider
 * arma el equipo de SU proyecto con desarrolladores, y aqui se deja registrado
 * en que proyecto participa cada persona y con que rol.
 *
 * Las dos listas vienen filtradas por el servidor: trabajadores habilitados y
 * proyectos habilitados. Asignar a uno inhabilitado lo rechaza la operacion
 * (C02 y C03), de modo que ofrecerlo seria ofrecer un fracaso; aun asi, si el
 * estado cambiara entre que se carga la lista y se guarda, el mensaje del
 * servidor es el que se muestra.
 */
export default function PaginaAsignaciones() {
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [advertencias, setAdvertencias] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [filtrosTrabajador, setFiltrosTrabajador] = useState(FILTROS_TRABAJADOR_VACIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_TRABAJADOR_VACIOS);

  const cargarTrabajadores = useCallback(
    ({ senal }) => buscarTrabajadores({ estado: 'HABILITADO', tamano: 100 }, { senal }),
    [],
  );
  const trabajadores = usePeticion(cargarTrabajadores, []);

  const cargarProyectos = useCallback(({ senal }) => obtenerProyectosAsignables({ senal }), []);
  const proyectos = usePeticion(cargarProyectos, []);

  const trabajadoresFiltrados = filtrarTrabajadores(trabajadores.datos?.contenido || [], filtrosAplicados);
  const opcionesDeTrabajador = trabajadoresFiltrados.map((trabajador) => ({
    valor: String(trabajador.id),
    texto: `${trabajador.nombreCompleto} (${trabajador.identificacion})`,
  }));
  const opcionesDeProyecto = (proyectos.datos?.contenido || []).map((proyecto) => ({
    valor: String(proyecto.id),
    texto: proyecto.nombre,
  }));

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setValores((previos) => ({ ...previos, [name]: value }));
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
  }

  function alCambiarFiltroTrabajador(evento) {
    const { name, value } = evento.target;
    setFiltrosTrabajador((previos) => ({ ...previos, [name]: value }));
    if (valores.trabajadorId && !filtrarTrabajadores(trabajadores.datos?.contenido || [], filtrosAplicados).some((trabajador) => String(trabajador.id) === String(valores.trabajadorId))) {
      setValores((previos) => ({ ...previos, trabajadorId: '' }));
    }
  }

  function aplicarFiltrosTrabajadores() {
    setFiltrosAplicados({ ...filtrosTrabajador });
    if (valores.trabajadorId && !filtrarTrabajadores(trabajadores.datos?.contenido || [], { ...filtrosTrabajador }).some((trabajador) => String(trabajador.id) === String(valores.trabajadorId))) {
      setValores((previos) => ({ ...previos, trabajadorId: '' }));
    }
  }

  function limpiarFiltrosTrabajadores() {
    setFiltrosTrabajador(FILTROS_TRABAJADOR_VACIOS);
    setFiltrosAplicados(FILTROS_TRABAJADOR_VACIOS);
    setValores((previos) => ({ ...previos, trabajadorId: '' }));
  }

  async function guardar(confirmacion) {
    setGuardando(true);
    setFallo(null);
    setConfirmado(null);
    setErrores({});

    try {
      const asignacion = await asignarTrabajador(
        {
          trabajadorId: valores.trabajadorId ? Number(valores.trabajadorId) : null,
          proyectoId: valores.proyectoId ? Number(valores.proyectoId) : null,
          rolEnProyecto: valores.rolEnProyecto || null,
        },
        confirmacion,
      );
      setAdvertencias(null);
      setConfirmado(
        `${asignacion.trabajadorNombreCompleto} quedo asignado a "${asignacion.proyectoNombre}" como ${
          ETIQUETA_ROL[asignacion.rolEnProyecto] || asignacion.rolEnProyecto
        }.`,
      );
      // C05: las consultas de abajo deben reflejar la asignacion recien hecha.
      setRecarga((numero) => numero + 1);
    } catch (error) {
      // C04: el servidor avisa de la asignacion equivalente activa y no registra
      // nada hasta que se confirme.
      if (error.requiereConfirmacion) {
        setAdvertencias(error.advertencias);
        return;
      }
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
    } finally {
      setGuardando(false);
    }
  }

  const cargandoListas = trabajadores.cargando || proyectos.cargando;
  const errorListas = trabajadores.error || proyectos.error;

  return (
    <>
      <Seccion
        titulo="Asignar un trabajador a un proyecto"
        descripcion="Deja registrado en que proyecto participa cada persona y con que rol."
        id="asignaciones"
      >
        <div className={estilos.filtrosBarra}>
          <div className={estilos.filtrosCabecera}>
            <span className={estilos.rotulo}>Filtrar trabajadores</span>
          </div>
          <div className={estilos.filtrosGrid}>
            <Campo
              etiqueta="Identificacion"
              nombre="identificacion"
              value={filtrosTrabajador.identificacion}
              onChange={alCambiarFiltroTrabajador}
            />
            <Campo
              etiqueta="Especialidad"
              nombre="especialidadDesarrollo"
              opciones={OPCIONES_ESPECIALIDADES}
              value={filtrosTrabajador.especialidadDesarrollo}
              onChange={alCambiarFiltroTrabajador}
            />
            <Campo
              etiqueta="Profesion"
              nombre="profesion"
              opciones={OPCIONES_PROFESIONES}
              value={filtrosTrabajador.profesion}
              onChange={alCambiarFiltroTrabajador}
            />
            <Campo
              etiqueta="Nombre"
              nombre="nombre"
              value={filtrosTrabajador.nombre}
              onChange={alCambiarFiltroTrabajador}
            />
            <Campo
              etiqueta="Apellido"
              nombre="apellido"
              value={filtrosTrabajador.apellido}
              onChange={alCambiarFiltroTrabajador}
            />
          </div>
          <div className={estilos.filtrosAcciones}>
            <Boton type="button" icono={Search} onClick={aplicarFiltrosTrabajadores}>
              Buscar
            </Boton>
            <Boton type="button" variante="texto" onClick={limpiarFiltrosTrabajadores}>
              Limpiar filtros
            </Boton>
          </div>
        </div>

        {filtrosAplicados && Object.values(filtrosAplicados).some((valor) => String(valor).trim() !== '') && trabajadoresFiltrados.length === 0 && (
          <div style={{ marginBottom: 'var(--s-5)' }}>
            <EstadoVacio mensaje="No hay trabajadores que coincidan con los filtros indicados." icono={Search} />
          </div>
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

        {cargandoListas && <EstadoCarga mensaje="Cargando trabajadores y proyectos..." />}

        {!cargandoListas && errorListas && (
          <EstadoError
            error={errorListas}
            alReintentar={trabajadores.error ? trabajadores.reintentar : proyectos.reintentar}
          />
        )}

        {!cargandoListas && !errorListas && opcionesDeProyecto.length === 0 && (
          <EstadoVacio mensaje={proyectos.datos?.mensaje} icono={Link2} />
        )}

        {!cargandoListas && !errorListas && opcionesDeProyecto.length > 0 && (
          <form
            className={estilos.formulario}
            onSubmit={(evento) => {
              evento.preventDefault();
              guardar(false);
            }}
            noValidate
          >
            <div className={estilos.criterios}>
              <Campo
                etiqueta="Trabajador"
                nombre="trabajadorId"
                opciones={opcionesDeTrabajador}
                obligatorio
                value={valores.trabajadorId}
                onChange={alCambiar}
                error={errores.trabajadorId}
                pista="Solo trabajadores habilitados."
              />
              <Campo
                etiqueta="Proyecto"
                nombre="proyectoId"
                opciones={opcionesDeProyecto}
                obligatorio
                value={valores.proyectoId}
                onChange={alCambiar}
                error={errores.proyectoId}
                pista="Solo proyectos habilitados."
              />
              <Campo
                etiqueta="Rol en el proyecto"
                nombre="rolEnProyecto"
                opciones={ROLES_EN_PROYECTO}
                obligatorio
                value={valores.rolEnProyecto}
                onChange={alCambiar}
                error={errores.rolEnProyecto}
              />
            </div>

            <div className={estilos.accionesBuscador}>
              <Boton type="submit" icono={Link2} disabled={guardando}>
                {guardando ? 'Registrando...' : 'Registrar asignacion'}
              </Boton>
            </div>
          </form>
        )}

        <Confirmacion
          abierto={advertencias !== null}
          titulo="Confirmar la asignacion"
          textoConfirmar="Asignar de todos modos"
          varianteConfirmar="primario"
          ocupado={guardando}
          alConfirmar={() => guardar(true)}
          alCancelar={() => setAdvertencias(null)}
        >
          <p>El servidor advierte lo siguiente:</p>
          <ul className={estilos.advertencias}>
            {(advertencias || []).map((advertencia) => (
              <li key={advertencia}>{advertencia}</li>
            ))}
          </ul>
        </Confirmacion>
      </Seccion>

      {/* C05: consultar las asignaciones de un trabajador o de un proyecto. */}
      <ConsultaDeAsignaciones
        trabajadoresHabilitados={trabajadores.datos?.contenido || []}
        opcionesDeProyecto={opcionesDeProyecto}
        recarga={recarga}
      />
    </>
  );
}

/**
 * Consulta de asignaciones registradas (HU-06 C05).
 *
 * Dos vistas del mismo dato -por trabajador o por proyecto- porque el criterio
 * nombra las dos: "consulto las asignaciones de ese trabajador o de ese
 * proyecto".
 */
function ConsultaDeAsignaciones({ trabajadoresHabilitados, opcionesDeProyecto, recarga }) {
  const [por, setPor] = useState('trabajador');
  const [id, setId] = useState('');
  const [consulta, setConsulta] = useState(null);
  const [filtrosTrabajador, setFiltrosTrabajador] = useState(FILTROS_TRABAJADOR_VACIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_TRABAJADOR_VACIOS);

  const cargar = useCallback(
    ({ senal }) =>
      consulta
        ? consulta.por === 'trabajador'
          ? asignacionesDeTrabajador(consulta.id, { senal })
          : asignacionesDeProyecto(consulta.id, { senal })
        : Promise.resolve(null),
    [consulta],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [consulta, recarga]);

  const opcionesDeTrabajador = filtrarTrabajadores(trabajadoresHabilitados, filtrosAplicados).map(
    (trabajador) => ({
      valor: String(trabajador.id),
      texto: `${trabajador.nombreCompleto} (${trabajador.identificacion})`,
    }),
  );
  const opciones = por === 'trabajador' ? opcionesDeTrabajador : opcionesDeProyecto;

  function alCambiarFiltroTrabajador(evento) {
    const { name, value } = evento.target;
    setFiltrosTrabajador((previos) => ({ ...previos, [name]: value }));
  }

  function aplicarFiltrosTrabajador() {
    setFiltrosAplicados({ ...filtrosTrabajador });
    if (id && !opciones.some((opcion) => opcion.valor === String(id))) {
      setId('');
      setConsulta(null);
    }
  }

  function limpiarFiltrosTrabajador() {
    setFiltrosTrabajador(FILTROS_TRABAJADOR_VACIOS);
    setFiltrosAplicados(FILTROS_TRABAJADOR_VACIOS);
    setId('');
    setConsulta(null);
  }

  return (
    <Seccion
      titulo="Asignaciones registradas"
      descripcion="Consulte en que proyectos participa un trabajador, o quienes participan en un proyecto."
      fondo="tenue"
      id="consulta-asignaciones"
    >
      <form
        className={estilos.buscador}
        onSubmit={(evento) => {
          evento.preventDefault();
          if (id) {
            setConsulta({ por, id });
          }
        }}
      >
        <div className={estilos.filtrosBarra}>
          <div className={estilos.filtrosCabecera}>
            <span className={estilos.rotulo}>Filtrar trabajadores</span>
          </div>
          {por === 'trabajador' && (
            <div className={estilos.filtrosGrid}>
              <Campo
                etiqueta="Identificacion"
                nombre="identificacion"
                value={filtrosTrabajador.identificacion}
                onChange={alCambiarFiltroTrabajador}
              />
              <Campo
                etiqueta="Especialidad"
                nombre="especialidadDesarrollo"
                opciones={OPCIONES_ESPECIALIDADES}
                value={filtrosTrabajador.especialidadDesarrollo}
                onChange={alCambiarFiltroTrabajador}
              />
              <Campo
                etiqueta="Profesion"
                nombre="profesion"
                opciones={OPCIONES_PROFESIONES}
                value={filtrosTrabajador.profesion}
                onChange={alCambiarFiltroTrabajador}
              />
              <Campo
                etiqueta="Nombre"
                nombre="nombre"
                value={filtrosTrabajador.nombre}
                onChange={alCambiarFiltroTrabajador}
              />
              <Campo
                etiqueta="Apellido"
                nombre="apellido"
                value={filtrosTrabajador.apellido}
                onChange={alCambiarFiltroTrabajador}
              />
            </div>
          )}
          <div className={estilos.filtrosAcciones}>
            <Boton type="button" icono={Search} onClick={aplicarFiltrosTrabajador}>
              Buscar
            </Boton>
            <Boton type="button" variante="texto" onClick={limpiarFiltrosTrabajador}>
              Limpiar filtros
            </Boton>
          </div>
        </div>

        {por === 'trabajador' &&
          filtrosAplicados &&
          Object.values(filtrosAplicados).some((valor) => String(valor).trim() !== '') &&
          opcionesDeTrabajador.length === 0 && (
            <div style={{ marginBottom: 'var(--s-5)' }}>
              <EstadoVacio mensaje="No hay trabajadores que coincidan con los filtros indicados." icono={Search} />
            </div>
          )}

        <div className={estilos.criterios}>
          <Campo
            etiqueta="Consultar por"
            nombre="por"
            opciones={[
              { valor: 'trabajador', texto: 'Trabajador' },
              { valor: 'proyecto', texto: 'Proyecto' },
            ]}
            textoVacio={null}
            value={por}
            onChange={(evento) => {
              setPor(evento.target.value);
              setId('');
              setConsulta(null);
            }}
          />
          <Campo
            etiqueta={por === 'trabajador' ? 'Trabajador' : 'Proyecto'}
            nombre="id"
            opciones={opciones}
            value={id}
            onChange={(evento) => setId(evento.target.value)}
          />
        </div>

        <div className={estilos.accionesBuscador}>
          <Boton type="submit" icono={Search} disabled={!id || cargando}>
            Consultar
          </Boton>
        </div>
      </form>

      {consulta && cargando && <EstadoCarga mensaje="Consultando asignaciones..." />}

      {consulta && !cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {consulta && !cargando && !error && (datos?.length || 0) === 0 && (
        <EstadoVacio mensaje="No hay asignaciones registradas para lo que eligio." icono={Link2} />
      )}

      {consulta && !cargando && !error && datos?.length > 0 && (
        <div className={estilos.tablaEnvoltorio}>
          <table className={estilos.tabla}>
            <caption className="solo-lectores">Asignaciones registradas</caption>
            <thead>
              <tr>
                <th scope="col">Trabajador</th>
                <th scope="col">Proyecto</th>
                <th scope="col">Rol</th>
                <th scope="col">Desde</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((asignacion) => (
                <tr key={asignacion.id}>
                  <th scope="row" className={estilos.celdaNombre}>
                    {asignacion.trabajadorNombreCompleto}
                  </th>
                  <td>{asignacion.proyectoNombre}</td>
                  <td>{ETIQUETA_ROL[asignacion.rolEnProyecto] || asignacion.rolEnProyecto}</td>
                  <td>{formatearFecha(asignacion.fechaAsignacion)}</td>
                  <td>{asignacion.activa ? 'Activa' : 'Terminada'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Seccion>
  );
}
