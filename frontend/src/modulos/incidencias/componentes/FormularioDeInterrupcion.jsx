import { useState } from 'react';
import { CircleCheck, PauseCircle, Save, TriangleAlert } from 'lucide-react';

import { UNIDADES_DURACION, registrarInterrupcion } from '../../../api/incidencias.js';
import Boton from '../../../componentes/ui/Boton.jsx';
import Campo from '../../../componentes/ui/Campo.jsx';
import estilos from '../../../estilos/gestion.module.css';
import { useEtapasDeProyecto } from '../../../hooks/useEtapasDeProyecto.js';

/**
 * Registro de una interrupcion del proyecto (RF-024, HU-18).
 *
 * Vive en su propio archivo porque lo usan dos pantallas: la de incidencias y el
 * acceso rapido del panel «Mi Dia», que RF-038 pide que lleve "a la funcion de
 * registro de bloqueos o interrupciones" ya existente. Duplicarlo habria dejado
 * dos formularios que mantener y dos sitios donde equivocarse con los campos
 * obligatorios de RN-10.
 *
 * Quien registra es el desarrollador, y el servidor no se conforma con el tipo
 * global: exige una asignacion activa como desarrollador en ESE proyecto. Este
 * componente no decide nada de eso.
 *
 * D-36: la fase que se indica es una ETAPA del proyecto, asi que el desplegable
 * de etapa depende del proyecto elegido.
 *
 * @param {Array}  proyectos        opciones [{ valor, texto }] donde puede registrar
 * @param {string} [proyectoInicial] proyecto preseleccionado, si el contexto lo sabe
 * @param {string} [etapaInicial]   etapa preseleccionada, si el contexto lo sabe
 * @param {boolean} [proyectoFijo]  oculta el selector y asocia el proyecto del contexto
 * @param {Function} [alRegistrar]  aviso al componente padre tras guardar
 * @param {Function} [alCancelar]   cierra el formulario o el modal que lo contiene
 */
export default function FormularioDeInterrupcion({
  proyectos,
  proyectoInicial = '',
  etapaInicial = '',
  proyectoFijo = false,
  alRegistrar,
  alCancelar,
}) {
  const [valores, setValores] = useState(() => ({
    ...VACIO,
    proyectoId: proyectoInicial,
    etapaId: etapaInicial,
    fecha: hoyLocal(),
  }));
  const { opcionesDeEtapa } = useEtapasDeProyecto(valores.proyectoId);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const proyecto = proyectos.find(({ valor }) => valor === valores.proyectoId);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setValores((previos) => ({
      ...previos,
      [name]: value,
      // La etapa pertenece al proyecto: cambiarlo invalida la elegida.
      ...(name === 'proyectoId' ? { etapaId: '' } : {}),
    }));
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setConfirmado(null);
    setFallo(null);

    const nuevosErrores = validar(valores);
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setGuardando(true);
    setErrores({});
    try {
      const registrada = await registrarInterrupcion(valores.proyectoId, {
        tipoInterrupcion: valores.tipoInterrupcion.trim(),
        fecha: valores.fecha,
        duracionValor: Number(valores.duracionValor),
        duracionUnidad: valores.duracionUnidad,
        etapaId: Number(valores.etapaId),
      });
      setConfirmado('La interrupcion quedo registrada y asociada al proyecto.');
      // C02: se conserva el proyecto para registrar otra sin volver a elegirlo.
      setValores({
        ...VACIO,
        proyectoId: valores.proyectoId,
        etapaId: proyectoFijo ? valores.etapaId : '',
        fecha: hoyLocal(),
      });
      if (alRegistrar) {
        alRegistrar(registrada);
      }
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

      {proyectoFijo ? (
        <div>
          <p className={estilos.rotulo}>Proyecto</p>
          <p>{proyecto?.texto || 'Proyecto seleccionado'}</p>
          <p className={estilos.notaDialogo}>
            La interrupcion se asociara automaticamente a este proyecto.
          </p>
        </div>
      ) : (
        <Campo
          etiqueta="Proyecto"
          nombre="proyectoId"
          opciones={proyectos}
          obligatorio
          value={valores.proyectoId}
          onChange={alCambiar}
          error={errores.proyectoId}
        />
      )}

      <Campo
        etiqueta="Tipo de interrupcion"
        nombre="tipoInterrupcion"
        obligatorio
        maxLength={50}
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
        etiqueta="Etapa en que ocurrio"
        nombre="etapaId"
        opciones={opcionesDeEtapa}
        obligatorio
        value={valores.etapaId}
        onChange={alCambiar}
        error={errores.etapaId}
        pista="Son las etapas del proyecto elegido; elija primero el proyecto."
      />

      <div className={estilos.accionesPerfil}>
        <Boton type="submit" icono={Save} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Registrar interrupcion'}
        </Boton>
        {alCancelar && (
          <Boton type="button" variante="texto" onClick={alCancelar} disabled={guardando}>
            Cancelar
          </Boton>
        )}
      </div>
    </form>
  );
}

const VACIO = {
  proyectoId: '',
  tipoInterrupcion: '',
  fecha: '',
  duracionValor: '',
  duracionUnidad: 'HORAS',
  etapaId: '',
};

/** Fecha local en formato ISO corto, sin el desfase de toISOString en UTC. */
function hoyLocal() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/**
 * Validacion previa a la peticion.
 *
 * Repite las reglas que el servidor ya aplica (RN-10, HU-18 C02) para dar
 * respuesta inmediata, pero no las sustituye: el backend sigue siendo la
 * autoridad y sus mensajes de campo se pintan igual en cada control.
 */
function validar(valores) {
  const errores = {};

  if (!valores.proyectoId) {
    errores.proyectoId = 'Debe elegir el proyecto al que pertenece la interrupcion.';
  }
  if (!valores.tipoInterrupcion.trim()) {
    errores.tipoInterrupcion = 'Debe indicar el tipo de interrupcion.';
  } else if (valores.tipoInterrupcion.trim().length > 50) {
    errores.tipoInterrupcion = 'El tipo admite hasta 50 caracteres.';
  }
  if (!valores.fecha) {
    errores.fecha = 'Debe indicar la fecha de la interrupcion.';
  }
  if (valores.duracionValor === '') {
    errores.duracionValor = 'Debe indicar la duracion de la interrupcion.';
  } else if (!Number.isFinite(Number(valores.duracionValor)) || Number(valores.duracionValor) <= 0) {
    errores.duracionValor = 'La duracion debe ser un numero mayor que cero.';
  }
  if (!valores.duracionUnidad) {
    errores.duracionUnidad = 'Debe indicar la unidad de la duracion.';
  }
  if (!valores.etapaId) {
    errores.etapaId = 'Debe indicar la etapa del proyecto en la que ocurrio.';
  }

  return errores;
}
