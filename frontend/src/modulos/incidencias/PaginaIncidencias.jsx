import { useCallback, useState } from 'react';
import { Bug, CircleCheck, Save, TriangleAlert } from 'lucide-react';

import { obtenerMisProyectos } from '../../api/asignaciones.js';
import { registrarError } from '../../api/incidencias.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { useEtapasDeProyecto } from '../../hooks/useEtapasDeProyecto.js';
import { usePeticion } from '../../hooks/usePeticion.js';
import FormularioDeInterrupcion from './componentes/FormularioDeInterrupcion.jsx';

/**
 * Registro de errores e interrupciones de un proyecto (RF-023, RF-024; HU-17, HU-18).
 *
 * Quien registra es el desarrollador, y el servidor no se conforma con el tipo
 * global: exige una asignacion activa como desarrollador en ESE proyecto. Por
 * eso la pantalla se ofrece tambien al lider, que puede estar asignado como
 * desarrollador en otro proyecto (RN-05); quien decide es el servidor.
 *
 * Los proyectos salen de /api/mis-proyectos, que entrega las asignaciones
 * activas de quien pregunta. Antes se deducian de las actividades propias, de
 * modo que un desarrollador recien asignado, sin actividades todavia, no podia
 * elegir su proyecto; esa limitacion queda resuelta.
 *
 * Se ofrecen solo los proyectos donde tiene el rol DESARROLLADOR, porque es el
 * que el servidor exige para registrar (nivel 2): ofrecer los demas seria
 * ofrecer un 403.
 *
 * D-36: la fase que se indica es una ETAPA del proyecto, no un valor de un
 * catalogo comun. Por eso el desplegable de etapa depende del proyecto elegido
 * en el mismo formulario, y cada uno carga las suyas.
 *
 * El formulario de interrupcion vive en su propio archivo porque el acceso
 * rapido del panel «Mi Dia» usa el mismo (RF-038).
 */
export default function PaginaIncidencias() {
  const cargarProyectos = useCallback(({ senal }) => obtenerMisProyectos({ senal }), []);
  const misProyectos = usePeticion(cargarProyectos, []);

  // El servidor ya entrega una fila por proyecto, sin repetirlos.
  const proyectos = (misProyectos.datos?.contenido || [])
    .filter(({ roles }) => roles.includes('DESARROLLADOR'))
    .map(({ proyectoId, proyectoNombre, estadoHabilitacion }) => ({
      valor: String(proyectoId),
      // El proyecto inhabilitado se ofrece igualmente -el servidor no lo
      // rechaza al registrar- pero se senala para que no pase inadvertido.
      texto:
        estadoHabilitacion === 'INHABILITADO'
          ? `${proyectoNombre} (inhabilitado)`
          : proyectoNombre,
    }));

  const cargando = misProyectos.cargando;
  const error = misProyectos.error;

  return (
    <Seccion
      titulo="Errores e interrupciones"
      descripcion="Deje documentadas las incidencias de los proyectos en los que trabaja."
      id="incidencias"
    >
      {cargando && <EstadoCarga mensaje="Cargando sus proyectos..." />}

      {!cargando && error && (
        <EstadoError error={error} alReintentar={misProyectos.reintentar} />
      )}

      {!cargando && !error && proyectos.length === 0 && (
        <EstadoVacio
          mensaje="No esta asignado como desarrollador en ningun proyecto, de modo que no hay proyecto sobre el que registrar incidencias."
          icono={Bug}
        />
      )}

      {!cargando && !error && proyectos.length > 0 && (
        <div className={estilos.perfil}>
          <FormularioDeError proyectos={proyectos} />
          <FormularioDeInterrupcion proyectos={proyectos} />
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

const ERROR_VACIO = { proyectoId: '', tipoError: '', etapaId: '', descripcion: '', fecha: '' };

/**
 * Registro de un error (RF-023, HU-17).
 *
 * El proyecto va en la ruta, no en el cuerpo: si no se eligio, la peticion ni
 * siquiera se puede formar, asi que ese unico caso -C03- lo comprueba el
 * cliente. Los demas datos los valida el servidor (C02 y C04), que es quien
 * sabe cuales son obligatorios.
 */
function FormularioDeError({ proyectos }) {
  const [valores, setValores] = useState(ERROR_VACIO);
  const { opcionesDeEtapa } = useEtapasDeProyecto(valores.proyectoId);
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
        etapaId: valores.etapaId ? Number(valores.etapaId) : null,
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
        etiqueta="Etapa en que lo encontro"
        nombre="etapaId"
        opciones={opcionesDeEtapa}
        obligatorio
        value={valores.etapaId}
        onChange={alCambiar}
        error={errores.etapaId}
        pista="Son las etapas del proyecto elegido; elija primero el proyecto."
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
