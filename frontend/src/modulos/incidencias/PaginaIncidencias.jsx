import { useCallback, useState } from 'react';
import { Bug, CircleCheck, PauseCircle, Save, TriangleAlert } from 'lucide-react';

import { obtenerMisActividades } from '../../api/actividades.js';
import {
  UNIDADES_DURACION,
  obtenerFases,
  registrarError,
  registrarInterrupcion,
} from '../../api/incidencias.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';

/**
 * Registro de errores e interrupciones de un proyecto (RF-023, RF-024; HU-17, HU-18).
 *
 * Quien registra es el desarrollador, y el servidor no se conforma con el tipo
 * global: exige una asignacion activa como desarrollador en ESE proyecto. Por
 * eso la pantalla se ofrece tambien al lider, que puede estar asignado como
 * desarrollador en otro proyecto (RN-05); quien decide es el servidor.
 *
 * LIMITACION CONOCIDA: el backend no expone "los proyectos en los que estoy
 * asignado". La unica consulta propia del trabajador es la de sus actividades,
 * asi que los proyectos se deducen de ahi. Un desarrollador asignado a un
 * proyecto en el que todavia no tiene ninguna actividad no podra elegirlo, y
 * hara falta un endpoint equivalente al de candidatos de equipo.
 */
export default function PaginaIncidencias() {
  const cargarActividades = useCallback(({ senal }) => obtenerMisActividades({ senal }), []);
  const actividades = usePeticion(cargarActividades, []);

  const cargarFases = useCallback(({ senal }) => obtenerFases({ senal }), []);
  const fases = usePeticion(cargarFases, []);

  // Un proyecto puede aparecer en varias actividades; se deja uno por proyecto.
  const proyectos = Object.values(
    (actividades.datos?.contenido || []).reduce((acumulado, actividad) => {
      acumulado[actividad.proyectoId] = {
        valor: String(actividad.proyectoId),
        texto: actividad.proyectoNombre,
      };
      return acumulado;
    }, {}),
  );

  const opcionesDeFase = (fases.datos || []).map((fase) => ({
    valor: String(fase.id),
    texto: fase.orden ? `${fase.orden}. ${fase.nombre}` : fase.nombre,
  }));

  const cargando = actividades.cargando || fases.cargando;
  const error = actividades.error || fases.error;

  return (
    <Seccion
      titulo="Errores e interrupciones"
      descripcion="Deje documentadas las incidencias de los proyectos en los que trabaja."
      id="incidencias"
    >
      {cargando && <EstadoCarga mensaje="Cargando proyectos y fases..." />}

      {!cargando && error && (
        <EstadoError
          error={error}
          alReintentar={actividades.error ? actividades.reintentar : fases.reintentar}
        />
      )}

      {!cargando && !error && proyectos.length === 0 && (
        <EstadoVacio
          mensaje="No se le ha asignado trabajo en ningun proyecto todavia, de modo que no hay proyecto sobre el que registrar incidencias."
          icono={Bug}
        />
      )}

      {!cargando && !error && proyectos.length > 0 && (
        <div className={estilos.perfil}>
          <FormularioDeError proyectos={proyectos} opcionesDeFase={opcionesDeFase} />
          <FormularioDeInterrupcion proyectos={proyectos} opcionesDeFase={opcionesDeFase} />
        </div>
      )}
    </Seccion>
  );
}

/** Mensajes de confirmacion y de fallo, compartidos por los dos formularios. */
function Avisos({ confirmado, fallo }) {
  return (
    <>
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
    </>
  );
}

const ERROR_VACIO = { proyectoId: '', tipoError: '', faseId: '', descripcion: '', fecha: '' };

/**
 * Registro de un error (RF-023, HU-17).
 *
 * El proyecto va en la ruta, no en el cuerpo: si no se eligio, la peticion ni
 * siquiera se puede formar, asi que ese unico caso -C03- lo comprueba el
 * cliente. Los demas datos los valida el servidor (C02 y C04), que es quien
 * sabe cuales son obligatorios.
 */
function FormularioDeError({ proyectos, opcionesDeFase }) {
  const [valores, setValores] = useState(ERROR_VACIO);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setValores((previos) => ({ ...previos, [name]: value }));
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setConfirmado(null);
    setFallo(null);

    // C03: sin proyecto no hay a donde enviar el registro.
    if (!valores.proyectoId) {
      setErrores({ proyectoId: 'Debe elegir el proyecto al que pertenece el error.' });
      return;
    }

    setGuardando(true);
    setErrores({});
    try {
      await registrarError(valores.proyectoId, {
        tipoError: valores.tipoError,
        faseId: valores.faseId ? Number(valores.faseId) : null,
        descripcion: valores.descripcion,
        fecha: valores.fecha || null,
      });
      setConfirmado('El error quedo registrado y asociado al proyecto.');
      setValores({ ...ERROR_VACIO, proyectoId: valores.proyectoId });
    } catch (error) {
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className={estilos.ficha} onSubmit={alEnviar} noValidate>
      <p className={estilos.rotulo}>
        <Bug size={14} aria-hidden="true" /> Registrar un error
      </p>

      <Avisos confirmado={confirmado} fallo={fallo} />

      <Campo
        etiqueta="Proyecto"
        nombre="proyectoId"
        opciones={proyectos}
        obligatorio
        value={valores.proyectoId}
        onChange={alCambiar}
        error={errores.proyectoId}
      />
      <Campo
        etiqueta="Tipo de error"
        nombre="tipoError"
        obligatorio
        value={valores.tipoError}
        onChange={alCambiar}
        error={errores.tipoError}
        pista="Los tipos los define la empresa; por ahora es texto libre."
      />
      <Campo
        etiqueta="Fase en que lo encontro"
        nombre="faseId"
        opciones={opcionesDeFase}
        obligatorio
        value={valores.faseId}
        onChange={alCambiar}
        error={errores.faseId}
      />
      <Campo
        etiqueta="Fecha"
        nombre="fecha"
        tipo="date"
        value={valores.fecha}
        onChange={alCambiar}
        error={errores.fecha}
      />
      <Campo
        etiqueta="Descripcion"
        nombre="descripcion"
        area
        rows={4}
        value={valores.descripcion}
        onChange={alCambiar}
        error={errores.descripcion}
      />

      <div className={estilos.accionesPerfil}>
        <Boton type="submit" icono={Save} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Registrar error'}
        </Boton>
      </div>
    </form>
  );
}

const INTERRUPCION_VACIA = {
  proyectoId: '',
  tipoInterrupcion: '',
  fecha: '',
  duracionValor: '',
  duracionUnidad: 'HORAS',
  faseId: '',
};

/** Registro de una interrupcion (RF-024, HU-18). */
function FormularioDeInterrupcion({ proyectos, opcionesDeFase }) {
  const [valores, setValores] = useState(INTERRUPCION_VACIA);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setValores((previos) => ({ ...previos, [name]: value }));
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setConfirmado(null);
    setFallo(null);

    // C03: igual que con los errores, el proyecto va en la ruta.
    if (!valores.proyectoId) {
      setErrores({ proyectoId: 'Debe elegir el proyecto al que pertenece la interrupcion.' });
      return;
    }

    setGuardando(true);
    setErrores({});
    try {
      await registrarInterrupcion(valores.proyectoId, {
        tipoInterrupcion: valores.tipoInterrupcion,
        fecha: valores.fecha || null,
        // Un campo numerico vacio no se envia como cadena.
        duracionValor: valores.duracionValor === '' ? null : Number(valores.duracionValor),
        duracionUnidad: valores.duracionUnidad || null,
        faseId: valores.faseId ? Number(valores.faseId) : null,
      });
      setConfirmado('La interrupcion quedo registrada y asociada al proyecto.');
      setValores({ ...INTERRUPCION_VACIA, proyectoId: valores.proyectoId });
    } catch (error) {
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className={estilos.ficha} onSubmit={alEnviar} noValidate>
      <p className={estilos.rotulo}>
        <PauseCircle size={14} aria-hidden="true" /> Registrar una interrupcion
      </p>

      <Avisos confirmado={confirmado} fallo={fallo} />

      <Campo
        etiqueta="Proyecto"
        nombre="proyectoId"
        opciones={proyectos}
        obligatorio
        value={valores.proyectoId}
        onChange={alCambiar}
        error={errores.proyectoId}
      />
      <Campo
        etiqueta="Tipo de interrupcion"
        nombre="tipoInterrupcion"
        obligatorio
        value={valores.tipoInterrupcion}
        onChange={alCambiar}
        error={errores.tipoInterrupcion}
      />
      <Campo
        etiqueta="Fecha"
        nombre="fecha"
        tipo="date"
        obligatorio
        value={valores.fecha}
        onChange={alCambiar}
        error={errores.fecha}
      />

      <div className={estilos.criterios}>
        <Campo
          etiqueta="Duracion"
          nombre="duracionValor"
          tipo="number"
          min="0.01"
          step="0.01"
          obligatorio
          value={valores.duracionValor}
          onChange={alCambiar}
          error={errores.duracionValor}
        />
        <Campo
          etiqueta="Unidad"
          nombre="duracionUnidad"
          opciones={UNIDADES_DURACION}
          textoVacio={null}
          obligatorio
          value={valores.duracionUnidad}
          onChange={alCambiar}
          error={errores.duracionUnidad}
        />
      </div>

      <Campo
        etiqueta="Fase en que ocurrio"
        nombre="faseId"
        opciones={opcionesDeFase}
        obligatorio
        value={valores.faseId}
        onChange={alCambiar}
        error={errores.faseId}
      />

      <div className={estilos.accionesPerfil}>
        <Boton type="submit" icono={Save} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Registrar interrupcion'}
        </Boton>
      </div>
    </form>
  );
}
