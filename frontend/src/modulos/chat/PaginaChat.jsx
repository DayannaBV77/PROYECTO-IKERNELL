import { useCallback, useState } from 'react';
import { CircleCheck, MessagesSquare, Plus, Send, TriangleAlert } from 'lucide-react';

import { obtenerMisProyectos } from '../../api/asignaciones.js';
import { crearHilo, enviarMensaje, obtenerHilos, obtenerMensajes } from '../../api/chat.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import gestion from '../../estilos/gestion.module.css';
import { useEtapasDeProyecto } from '../../hooks/useEtapasDeProyecto.js';
import { usePeticion } from '../../hooks/usePeticion.js';
import { useSesion } from '../../sesion/contexto.js';
import { formatearFechaHora } from '../../utilidades/formato.js';
import estilos from './PaginaChat.module.css';

/**
 * Conversaciones vinculadas a un proyecto y a sus etapas (RF-037, HU-22).
 *
 * Quien entra lo decide el servidor: exige una asignacion activa en el
 * proyecto, con cualquier rol, y responde 403 a quien no participa (C04). Esta
 * pantalla no se ofrece por tipo de trabajador, porque el permiso no depende del
 * tipo: ofrece los proyectos que /api/mis-proyectos devuelve, que son
 * exactamente aquellos en los que el trabajador participa.
 *
 * El filtro por etapa es opcional y cubre las dos formas de HU-22: sin etapa se
 * ven todos los hilos del proyecto (C01), con etapa solo los suyos (C03).
 *
 * NO es el chat corporativo libre de RF-028 -conversaciones individuales,
 * grupos, disponibilidad-, que sigue sin definir por D-12.
 */
export default function PaginaChat() {
  const [proyectoId, setProyectoId] = useState('');
  const [etapaId, setEtapaId] = useState('');
  const [hiloAbierto, setHiloAbierto] = useState(null);
  const [recarga, setRecarga] = useState(0);

  const cargarProyectos = useCallback(({ senal }) => obtenerMisProyectos({ senal }), []);
  const misProyectos = usePeticion(cargarProyectos, []);

  const { opcionesDeEtapa } = useEtapasDeProyecto(proyectoId);

  const cargarHilos = useCallback(
    ({ senal }) =>
      proyectoId
        ? obtenerHilos(proyectoId, etapaId || undefined, { senal })
        : Promise.resolve(null),
    [proyectoId, etapaId],
  );
  const hilos = usePeticion(cargarHilos, [proyectoId, etapaId, recarga]);

  const opcionesDeProyecto = (misProyectos.datos?.contenido || []).map(
    ({ proyectoId: id, proyectoNombre, estadoHabilitacion }) => ({
      valor: String(id),
      texto:
        estadoHabilitacion === 'INHABILITADO'
          ? `${proyectoNombre} (inhabilitado)`
          : proyectoNombre,
    }),
  );

  // Cambiar de proyecto invalida la etapa elegida y el hilo abierto: pertenecen
  // al proyecto anterior.
  function alElegirProyecto(evento) {
    setProyectoId(evento.target.value);
    setEtapaId('');
    setHiloAbierto(null);
  }

  function alElegirEtapa(evento) {
    setEtapaId(evento.target.value);
    setHiloAbierto(null);
  }

  const listaDeHilos = hilos.datos?.contenido || [];

  return (
    <Seccion
      titulo="Conversaciones del proyecto"
      descripcion="Hilos vinculados a un proyecto o a una de sus etapas, para seguir las consultas y las decisiones tecnicas del equipo."
      id="chat"
    >
      {misProyectos.cargando && <EstadoCarga mensaje="Cargando sus proyectos..." />}

      {!misProyectos.cargando && misProyectos.error && (
        <EstadoError error={misProyectos.error} alReintentar={misProyectos.reintentar} />
      )}

      {!misProyectos.cargando && !misProyectos.error && opcionesDeProyecto.length === 0 && (
        <EstadoVacio mensaje={misProyectos.datos?.mensaje} icono={MessagesSquare} />
      )}

      {!misProyectos.cargando && !misProyectos.error && opcionesDeProyecto.length > 0 && (
        <>
          <div className={gestion.criterios}>
            <Campo
              etiqueta="Proyecto"
              nombre="proyectoId"
              opciones={opcionesDeProyecto}
              value={proyectoId}
              onChange={alElegirProyecto}
            />
            <Campo
              etiqueta="Etapa"
              nombre="etapaId"
              opciones={opcionesDeEtapa}
              value={etapaId}
              onChange={alElegirEtapa}
              pista="Opcional. Sin etapa se ven todas las conversaciones del proyecto."
            />
          </div>

          {!proyectoId && (
            <EstadoVacio
              mensaje="Elija un proyecto para ver sus conversaciones."
              icono={MessagesSquare}
            />
          )}

          {proyectoId && hilos.cargando && (
            <EstadoCarga mensaje="Cargando las conversaciones..." esqueleto={2} />
          )}

          {proyectoId && !hilos.cargando && hilos.error && (
            <EstadoError error={hilos.error} alReintentar={hilos.reintentar} />
          )}

          {proyectoId && !hilos.cargando && !hilos.error && (
            <div className={estilos.disposicion}>
              <ColumnaDeHilos
                hilos={listaDeHilos}
                mensajeVacio={hilos.datos?.mensaje}
                hiloAbierto={hiloAbierto}
                alAbrir={setHiloAbierto}
                proyectoId={proyectoId}
                etapaId={etapaId}
                opcionesDeEtapa={opcionesDeEtapa}
                alCrear={(hilo) => {
                  setRecarga((numero) => numero + 1);
                  setHiloAbierto(hilo.id);
                }}
              />

              {hiloAbierto ? (
                <Conversacion
                  // `key` remonta el componente al cambiar de hilo, y con eso se
                  // descarta el borrador y los avisos del anterior: un mensaje a
                  // medio escribir no debe acabar enviado a otra conversacion.
                  key={hiloAbierto}
                  hiloId={hiloAbierto}
                  alEnviar={() => setRecarga((numero) => numero + 1)}
                />
              ) : (
                <EstadoVacio
                  mensaje="Abra una conversacion para ver sus mensajes."
                  icono={MessagesSquare}
                />
              )}
            </div>
          )}
        </>
      )}
    </Seccion>
  );
}

/** Lista de hilos del proyecto, con la marca de mensajes sin leer (HU-22 C01). */
function ColumnaDeHilos({
  hilos,
  mensajeVacio,
  hiloAbierto,
  alAbrir,
  proyectoId,
  etapaId,
  opcionesDeEtapa,
  alCrear,
}) {
  const [creando, setCreando] = useState(false);

  return (
    <div className={estilos.conversacion}>
      {hilos.length === 0 && <EstadoVacio mensaje={mensajeVacio} icono={MessagesSquare} />}

      {hilos.length > 0 && (
        <div className={estilos.hilos}>
          {hilos.map((hilo) => (
            <button
              key={hilo.id}
              type="button"
              className={`${estilos.hilo} ${hiloAbierto === hilo.id ? estilos.hiloActivo : ''}`}
              aria-current={hiloAbierto === hilo.id ? 'true' : undefined}
              onClick={() => alAbrir(hilo.id)}
            >
              <span className={estilos.hiloCabecera}>
                <span className={estilos.hiloTitulo}>{hilo.titulo}</span>
                {hilo.noLeidos > 0 && (
                  <span className={estilos.noLeidos}>
                    {hilo.noLeidos}
                    <span className="solo-lectores"> mensajes sin leer</span>
                  </span>
                )}
              </span>
              <span className={estilos.hiloContexto}>
                {/* Sin etapa el hilo es del proyecto; con etapa se indica cual. */}
                {hilo.etapaNombre ? `Etapa: ${hilo.etapaNombre}` : 'Todo el proyecto'}
                {' · '}
                {hilo.totalMensajes} mensaje(s)
              </span>
            </button>
          ))}
        </div>
      )}

      {creando ? (
        <FormularioDeHilo
          proyectoId={proyectoId}
          etapaId={etapaId}
          opcionesDeEtapa={opcionesDeEtapa}
          alCrear={(hilo) => {
            setCreando(false);
            alCrear(hilo);
          }}
          alCancelar={() => setCreando(false)}
        />
      ) : (
        <Boton variante="secundario" icono={Plus} onClick={() => setCreando(true)}>
          Nueva conversacion
        </Boton>
      )}
    </div>
  );
}

/**
 * Creacion de un hilo (RF-037, HU-22 C03).
 *
 * La etapa se hereda del filtro cuando hay uno activo, que es lo que el usuario
 * esperaria al crear un hilo mientras mira una etapa concreta. Puede cambiarla o
 * dejarla vacia para que el hilo sea del proyecto.
 */
function FormularioDeHilo({ proyectoId, etapaId, opcionesDeEtapa, alCrear, alCancelar }) {
  const [titulo, setTitulo] = useState('');
  const [etapaDelHilo, setEtapaDelHilo] = useState(etapaId || '');
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function alEnviar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setFallo(null);
    setErrores({});

    try {
      const hilo = await crearHilo(proyectoId, {
        titulo,
        etapaId: etapaDelHilo ? Number(etapaDelHilo) : null,
      });
      alCrear(hilo);
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
    <form className={gestion.ficha} onSubmit={alEnviar} noValidate>
      <p className={gestion.rotulo}>
        <MessagesSquare size={14} aria-hidden="true" /> Nueva conversacion
      </p>

      {fallo && (
        <p className={gestion.avisoError} role="alert">
          <TriangleAlert size={16} aria-hidden="true" />
          {fallo}
        </p>
      )}

      <Campo
        etiqueta="Asunto"
        nombre="titulo"
        obligatorio
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        error={errores.titulo}
      />
      <Campo
        etiqueta="Etapa"
        nombre="etapaDelHilo"
        opciones={opcionesDeEtapa}
        value={etapaDelHilo}
        onChange={(evento) => setEtapaDelHilo(evento.target.value)}
        error={errores.etapaId}
        pista="Opcional. Sin etapa, la conversacion es de todo el proyecto."
      />

      <div className={gestion.accionesBuscador}>
        <Boton type="submit" disabled={guardando}>
          {guardando ? 'Creando...' : 'Crear conversacion'}
        </Boton>
        <Boton type="button" variante="texto" onClick={alCancelar} disabled={guardando}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}

/**
 * Mensajes del hilo abierto y envio de uno nuevo (HU-22 C02 y C05).
 *
 * Consultar los mensajes marca el hilo como leido en el servidor, de modo que
 * abrirlo baja su contador de no leidos sin ninguna accion adicional.
 *
 * Su estado local -el borrador y los avisos- se descarta al cambiar de hilo
 * porque quien lo usa le pasa `key={hiloId}` y React lo remonta. No hace falta
 * un efecto que lo limpie.
 */
function Conversacion({ hiloId, alEnviar }) {
  const [recarga, setRecarga] = useState(0);
  const [texto, setTexto] = useState('');
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(({ senal }) => obtenerMensajes(hiloId, { senal }), [hiloId]);
  const mensajes = usePeticion(cargar, [hiloId, recarga]);

  async function alEnviarMensaje(evento) {
    evento.preventDefault();
    setEnviando(true);
    setFallo(null);
    setConfirmado(null);
    setErrores({});

    try {
      await enviarMensaje(hiloId, texto);
      setTexto('');
      setConfirmado('El mensaje quedo registrado en la conversacion.');
      setRecarga((numero) => numero + 1);
      alEnviar();
    } catch (error) {
      // C03: con un fallo de envio el mensaje NO se da por enviado, y el texto
      // se conserva para poder reintentarlo.
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={estilos.conversacion}>
      {mensajes.cargando && <EstadoCarga mensaje="Cargando los mensajes..." esqueleto={2} />}

      {!mensajes.cargando && mensajes.error && (
        <EstadoError error={mensajes.error} alReintentar={mensajes.reintentar} />
      )}

      {!mensajes.cargando && !mensajes.error && (
        <>
          {(mensajes.datos?.contenido || []).length === 0 ? (
            <EstadoVacio mensaje={mensajes.datos?.mensaje} icono={MessagesSquare} />
          ) : (
            <div className={estilos.mensajes}>
              {mensajes.datos.contenido.map((mensaje) => (
                <Mensaje key={mensaje.id} mensaje={mensaje} />
              ))}
            </div>
          )}

          <form onSubmit={alEnviarMensaje} noValidate>
            {confirmado && (
              <p className={gestion.avisoExito} role="status">
                <CircleCheck size={16} aria-hidden="true" />
                {confirmado}
              </p>
            )}
            {fallo && (
              <p className={gestion.avisoError} role="alert">
                <TriangleAlert size={16} aria-hidden="true" />
                {fallo}
              </p>
            )}

            <Campo
              etiqueta="Mensaje"
              nombre="cuerpo"
              area
              rows={3}
              obligatorio
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
              error={errores.cuerpo}
            />
            <Boton type="submit" icono={Send} disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar mensaje'}
            </Boton>
          </form>
        </>
      )}
    </div>
  );
}

/** Un mensaje con su autor y su fecha de envio (HU-22 C02). */
function Mensaje({ mensaje }) {
  const { sesion } = useSesion();
  const esPropio = mensaje.autorId === sesion?.trabajadorId;

  return (
    <article className={`${estilos.mensaje} ${esPropio ? estilos.mensajePropio : ''}`}>
      <p className={estilos.mensajeFirma}>
        <span className={estilos.mensajeAutor}>
          {mensaje.autorNombreCompleto}
          {esPropio && <span className="solo-lectores"> (usted)</span>}
        </span>
        <span>{formatearFechaHora(mensaje.enviadoEn)}</span>
      </p>
      <p className={estilos.mensajeCuerpo}>{mensaje.cuerpo}</p>
    </article>
  );
}
