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
 * @param {Function} [alRegistrar]  aviso al componente padre tras guardar
 */
export default function FormularioDeInterrupcion({ proyectos, proyectoInicial = '', alRegistrar }) {
  const [valores, setValores] = useState({ ...VACIO, proyectoId: proyectoInicial });
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

    // HU-18 C03: el proyecto va en la ruta, asi que sin el la peticion ni se
    // puede formar. Es el unico caso que comprueba el cliente.
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
        etapaId: valores.etapaId ? Number(valores.etapaId) : null,
      });
      setConfirmado('La interrupcion quedo registrada y asociada al proyecto.');
      // C02: se conserva el proyecto para registrar otra sin volver a elegirlo.
      setValores({ ...VACIO, proyectoId: valores.proyectoId });
      if (alRegistrar) {
        alRegistrar();
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
