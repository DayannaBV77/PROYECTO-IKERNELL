import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCheck,
  ChevronDown,
  CircleCheck,
  Clock,
  FolderKanban,
  Layers,
  Lock,
  MessagesSquare,
  Plus,
  Search,
  Send,
  TriangleAlert,
  User,
  X,
} from 'lucide-react';

import { obtenerMisProyectos, obtenerProyectosAsignables } from '../../api/asignaciones.js';
import { crearHilo, enviarMensaje, obtenerHilos, obtenerMensajes } from '../../api/chat.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import { useEtapasDeProyecto } from '../../hooks/useEtapasDeProyecto.js';
import { usePeticion } from '../../hooks/usePeticion.js';
import { useSesion } from '../../sesion/contexto.js';
import { formatearFechaHora } from '../../utilidades/formato.js';
import estilos from './PaginaChat.module.css';

/**
 * Conversaciones colaborativas vinculadas a proyectos y etapas (RF-037, HU-22).
 *
 * Flujo optimizado con panel interactivo, comunicación segura vinculada a asignaciones
 * activas y navegación ágil tipo mensajería profesional.
 */
export default function PaginaChat() {
  const { sesion } = useSesion();
  const esCoordinador = sesion?.tipoTrabajador === 'COORDINADOR';

  const [proyectoId, setProyectoId] = useState('');
  const [etapaId, setEtapaId] = useState('');
  const [hiloAbierto, setHiloAbierto] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [modalNuevoHilo, setModalNuevoHilo] = useState(false);

  const cargarProyectos = useCallback(
    ({ senal }) =>
      esCoordinador
        ? obtenerProyectosAsignables({ senal })
        : obtenerMisProyectos({ senal }),
    [esCoordinador],
  );
  const misProyectos = usePeticion(cargarProyectos, [esCoordinador]);

  const { opcionesDeEtapa, cargando: cargandoEtapas } = useEtapasDeProyecto(proyectoId);

  const cargarHilos = useCallback(
    ({ senal }) =>
      proyectoId
        ? obtenerHilos(proyectoId, etapaId || undefined, { senal })
        : Promise.resolve(null),
    [proyectoId, etapaId],
  );
  const hilos = usePeticion(cargarHilos, [proyectoId, etapaId, recarga]);

  const proyectosLista = useMemo(() => {
    let raw = [];
    if (Array.isArray(misProyectos.datos?.contenido)) {
      raw = misProyectos.datos.contenido;
    } else if (Array.isArray(misProyectos.datos)) {
      raw = misProyectos.datos;
    }
    return raw.map((p) => ({
      proyectoId: p.proyectoId || p.id,
      proyectoNombre: p.proyectoNombre || p.nombre || `Proyecto #${p.id || ''}`,
      estadoHabilitacion: p.estadoHabilitacion || p.estado || 'HABILITADO',
    }));
  }, [misProyectos.datos]);

  // Autoseleccionar el primer proyecto disponible para agilizar la entrada
  useEffect(() => {
    if (!proyectoId && proyectosLista.length > 0) {
      setProyectoId(String(proyectosLista[0].proyectoId));
    }
  }, [proyectoId, proyectosLista]);

  const opcionesDeProyecto = useMemo(() => {
    return proyectosLista.map(
      ({ proyectoId: id, proyectoNombre, estadoHabilitacion }) => ({
        valor: String(id),
        texto:
          estadoHabilitacion === 'INHABILITADO'
            ? `${proyectoNombre} (inhabilitado)`
            : proyectoNombre,
      }),
    );
  }, [proyectosLista]);

  function alElegirProyecto(evento) {
    setProyectoId(evento.target.value);
    setEtapaId('');
    setHiloAbierto(null);
  }

  function alElegirEtapa(evento) {
    setEtapaId(evento.target.value);
    setHiloAbierto(null);
  }

  const listaDeHilos = useMemo(() => {
    if (Array.isArray(hilos.datos?.contenido)) {
      return hilos.datos.contenido;
    }
    if (Array.isArray(hilos.datos)) {
      return hilos.datos;
    }
    return [];
  }, [hilos.datos]);

  const proyectoActual = proyectosLista.find((p) => String(p.proyectoId) === String(proyectoId));
  const hiloActual = listaDeHilos.find((h) => h.id === hiloAbierto);
  const proyectoInhabilitado = proyectoActual?.estadoHabilitacion === 'INHABILITADO';
  const sinEtapasConfiguradas = Boolean(proyectoId) && !cargandoEtapas && opcionesDeEtapa.length === 0;

  return (
    <Seccion
      titulo="Conversaciones del proyecto"
      descripcion="Espacio seguro y colaborativo para discutir avances, decisiones de arquitectura y soporte técnico del equipo."
      id="chat"
    >
      {misProyectos.cargando && <EstadoCarga mensaje="Cargando proyectos asignados..." />}

      {!misProyectos.cargando && misProyectos.error && (
        <EstadoError error={misProyectos.error} alReintentar={misProyectos.reintentar} />
      )}

      {!misProyectos.cargando && !misProyectos.error && opcionesDeProyecto.length === 0 && (
        <EstadoVacio mensaje={misProyectos.datos?.mensaje || 'No tiene proyectos asignados actualmente.'} icono={MessagesSquare} />
      )}

      {!misProyectos.cargando && !misProyectos.error && opcionesDeProyecto.length > 0 && (
        <div className={estilos.contenedorChat}>
          {/* Barra superior compacta de contexto */}
          <div className={estilos.barraFiltros}>
            <Campo
              etiqueta="Proyecto Activo"
              nombre="proyectoId"
              opciones={opcionesDeProyecto}
              value={proyectoId}
              onChange={alElegirProyecto}
            />

            <Campo
              etiqueta="Filtrar por Etapa"
              nombre="etapaId"
              textoVacio={
                cargandoEtapas
                  ? 'Cargando etapas...'
                  : sinEtapasConfiguradas
                    ? 'Sin etapas específicas (Canal General)'
                    : 'Todas las etapas (General)'
              }
              opciones={opcionesDeEtapa}
              value={etapaId}
              onChange={alElegirEtapa}
              disabled={!proyectoId || cargandoEtapas || sinEtapasConfiguradas}
            />
          </div>

          {/* Panel interactivo de dos columnas */}
          <div className={estilos.panelChat}>
            <ColumnaDeHilos
              hilos={listaDeHilos}
              cargando={hilos.cargando}
              error={hilos.error}
              alReintentar={hilos.reintentar}
              mensajeVacio={hilos.datos?.mensaje}
              hiloAbierto={hiloAbierto}
              alAbrir={setHiloAbierto}
              onAbrirModalCreacion={() => setModalNuevoHilo(true)}
              puedeCrearHilo={Boolean(proyectoId) && !proyectoInhabilitado}
              proyectoInhabilitado={proyectoInhabilitado}
            />

            <div className={estilos.columnaConversacion}>
              {hiloAbierto && hiloActual ? (
                <Conversacion
                  key={hiloAbierto}
                  hiloId={hiloAbierto}
                  hilo={hiloActual}
                  proyectoNombre={proyectoActual?.proyectoNombre}
                  alEnviar={() => setRecarga((numero) => numero + 1)}
                />
              ) : (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                  <EstadoVacio
                    mensaje={listaDeHilos.length > 0 ? "Seleccione una conversación de la izquierda para ver los mensajes e interactuar." : "No hay conversaciones abiertas en este filtro. Inicie una con el botón 'Nueva conversación'."}
                    icono={MessagesSquare}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Modal modal para crear hilo */}
          {modalNuevoHilo && (
            <div className={estilos.modalOverlay} onClick={() => setModalNuevoHilo(false)}>
              <div className={estilos.modalCard} onClick={(e) => e.stopPropagation()}>
                <FormularioDeHilo
                  proyectoId={proyectoId}
                  proyectoNombre={proyectoActual?.proyectoNombre}
                  etapaId={etapaId}
                  opcionesDeEtapa={opcionesDeEtapa}
                  alCrear={(nuevoHilo) => {
                    setModalNuevoHilo(false);
                    setRecarga((n) => n + 1);
                    setHiloAbierto(nuevoHilo.id);
                  }}
                  alCancelar={() => setModalNuevoHilo(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Seccion>
  );
}

/** Columna lateral con filtro rápido de texto y lista estilizada de hilos */
function ColumnaDeHilos({
  hilos = [],
  cargando,
  error,
  alReintentar,
  mensajeVacio,
  hiloAbierto,
  alAbrir,
  onAbrirModalCreacion,
  puedeCrearHilo = true,
  proyectoInhabilitado = false,
}) {
  const [busqueda, setBusqueda] = useState('');
  const listaSegura = Array.isArray(hilos) ? hilos : [];

  const hilosFiltrados = listaSegura.filter((hilo) =>
    hilo?.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    hilo?.etapaNombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className={estilos.columnaHilos}>
      <div className={estilos.cabeceraHilos}>
        <div className={estilos.tituloHilosContenedor}>
          <p className={estilos.tituloHilos}>
            <FolderKanban size={17} aria-hidden="true" />
            Hilos de discusión
          </p>
          <span className={estilos.badgeConteoHilos}>
            {hilos.length}
          </span>
        </div>

        <button
          type="button"
          className={estilos.btnIniciarHilo}
          onClick={onAbrirModalCreacion}
          disabled={!puedeCrearHilo}
          title={
            proyectoInhabilitado
              ? 'El proyecto está inhabilitado; no se pueden iniciar nuevos hilos.'
              : 'Iniciar un nuevo hilo de discusión en este proyecto'
          }
          data-testid="btn-iniciar-hilo"
        >
          <Plus size={15} strokeWidth={2} aria-hidden="true" />
          <span>Iniciar Hilo de Discusión</span>
        </button>

        {proyectoInhabilitado && (
          <p className={estilos.avisoInhabilitado}>
            Proyecto inhabilitado: solo lectura de historial.
          </p>
        )}

        {hilos.length > 3 && (
          <div className={estilos.buscadorHilosWrapper}>
            <Search size={15} className={estilos.buscadorHilosIcono} aria-hidden="true" />
            <input
              type="text"
              className={estilos.buscadorHilosInput}
              placeholder="Buscar en conversaciones..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className={estilos.listaHilosScroll}>
        {cargando && <EstadoCarga mensaje="Cargando hilos..." esqueleto={3} />}

        {!cargando && error && <EstadoError error={error} alReintentar={alReintentar} />}

        {!cargando && !error && hilos.length === 0 && (
          <div style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
            <EstadoVacio mensaje={mensajeVacio || 'Sin conversaciones aún.'} icono={MessagesSquare} />
            {puedeCrearHilo && (
              <div style={{ marginTop: '1rem' }}>
                <Boton variante="secundario" icono={Plus} onClick={onAbrirModalCreacion}>
                  Iniciar Hilo de Discusión
                </Boton>
              </div>
            )}
          </div>
        )}

        {!cargando && !error && hilosFiltrados.map((hilo) => {
          const estaActivo = hiloAbierto === hilo.id;
          return (
            <button
              key={hilo.id}
              type="button"
              className={`${estilos.itemHilo} ${estaActivo ? estilos.itemHiloActivo : ''}`}
              aria-current={estaActivo ? 'true' : undefined}
              onClick={() => alAbrir(hilo.id)}
            >
              <div className={estilos.itemHiloCabecera}>
                <p className={estilos.itemHiloTitulo}>{hilo.titulo}</p>
                {hilo.noLeidos > 0 && (
                  <span className={estilos.badgeNoLeidos} title={`${hilo.noLeidos} mensajes sin leer`}>
                    {hilo.noLeidos}
                  </span>
                )}
              </div>

              <div className={estilos.itemHiloMeta}>
                {hilo.etapaNombre ? (
                  <span className={estilos.badgeEtapa} title={`Etapa: ${hilo.etapaNombre}`}>
                    <Layers size={11} style={{ display: 'inline', marginRight: '3px' }} />
                    {hilo.etapaNombre}
                  </span>
                ) : (
                  <span className={estilos.badgeEtapa}>Proyecto general</span>
                )}
                <span>· {hilo.totalMensajes} mensaje(s)</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Formulario de creación de nuevo hilo */
function FormularioDeHilo({
  proyectoId,
  proyectoNombre,
  etapaId,
  opcionesDeEtapa,
  alCrear,
  alCancelar,
}) {
  const [titulo, setTitulo] = useState('');
  const [etapaDelHilo, setEtapaDelHilo] = useState(etapaId || '');
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function alEnviar(evento) {
    evento.preventDefault();
    if (!titulo.trim()) {
      setErrores({ titulo: 'Ingrese un asunto descriptivo para la conversación.' });
      return;
    }

    setGuardando(true);
    setFallo(null);
    setErrores({});

    try {
      const hilo = await crearHilo(proyectoId, {
        titulo: titulo.trim(),
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
    <form onSubmit={alEnviar} noValidate>
      <div className={estilos.modalCabecera}>
        <p className={estilos.modalTitulo}>
          <MessagesSquare size={20} color="var(--c-enlace)" aria-hidden="true" />
          Nueva conversación
        </p>
        <button
          type="button"
          onClick={alCancelar}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--c-texto-secundario)' }}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--c-texto-secundario)' }}>
        Proyecto: <strong>{proyectoNombre || 'Seleccionado'}</strong>
      </p>

      {fallo && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--c-error-fondo)', color: 'var(--c-error-texto)', border: '1px solid var(--c-error)' }}>
          <TriangleAlert size={16} style={{ display: 'inline', marginRight: '6px' }} />
          {fallo}
        </div>
      )}

      <Campo
        etiqueta="Asunto / Título del hilo"
        nombre="titulo"
        obligatorio
        placeholder="Ej. Revisión de especificaciones API pasarela PSE"
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        error={errores.titulo}
      />

      <Campo
        etiqueta="Vincular a etapa específica"
        nombre="etapaDelHilo"
        opciones={opcionesDeEtapa}
        value={etapaDelHilo}
        onChange={(evento) => setEtapaDelHilo(evento.target.value)}
        error={errores.etapaId}
        pista="Opcional. Deje en blanco si concierne a todo el proyecto en general."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
        <Boton type="button" variante="texto" onClick={alCancelar} disabled={guardando}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={guardando}>
          {guardando ? 'Creando hilo...' : 'Crear conversación'}
        </Boton>
      </div>
    </form>
  );
}

/** Conversación activa con lista de mensajes en burbujas, tiempo real y scroll fluido */
function Conversacion({ hiloId, hilo, proyectoNombre, alEnviar }) {
  const [recarga, setRecarga] = useState(0);
  const [texto, setTexto] = useState('');
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mensajesLista, setMensajesLista] = useState([]);
  const [mostrarBotonBajar, setMostrarBotonBajar] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const usuarioHizoScrollArribaRef = useRef(false);
  const esCargaInicialRef = useRef(true);

  // Al cambiar de conversación, restablecer estado de scroll
  useEffect(() => {
    esCargaInicialRef.current = true;
    usuarioHizoScrollArribaRef.current = false;
    setMostrarBotonBajar(false);
  }, [hiloId]);

  const cargar = useCallback(({ senal }) => obtenerMensajes(hiloId, { senal }), [hiloId]);
  const mensajes = usePeticion(cargar, [hiloId, recarga]);

  // Sincronizar datos iniciales de la petición
  useEffect(() => {
    if (mensajes.datos) {
      const lista = Array.isArray(mensajes.datos?.contenido)
        ? mensajes.datos.contenido
        : Array.isArray(mensajes.datos)
          ? mensajes.datos
          : [];
      setMensajesLista(lista);
    }
  }, [mensajes.datos]);

  // Sincronización continua en tiempo real contra BD (polling suave cada 2.5s)
  useEffect(() => {
    if (!hiloId) return;
    let vigente = true;

    const temporizador = setInterval(async () => {
      try {
        const respuesta = await obtenerMensajes(hiloId);
        if (!vigente) return;
        const listaActual = Array.isArray(respuesta?.contenido)
          ? respuesta.contenido
          : Array.isArray(respuesta)
            ? respuesta
            : [];
        setMensajesLista((prev) => {
          if (!prev || prev.length !== listaActual.length) {
            return listaActual;
          }
          if (prev.length > 0 && listaActual.length > 0 && prev[prev.length - 1].id !== listaActual[listaActual.length - 1].id) {
            return listaActual;
          }
          return prev;
        });
      } catch {
        // En segundo plano sin interrumpir la experiencia de usuario
      }
    }, 2500);

    return () => {
      vigente = false;
      clearInterval(temporizador);
    };
  }, [hiloId]);

  // Scroll inteligente estilo WhatsApp / Telegram: scroll libre hacia arriba/abajo sin bloqueos
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;

    // Al abrir el hilo por primera vez, bajar al último mensaje
    if (esCargaInicialRef.current && mensajesLista.length > 0) {
      el.scrollTop = el.scrollHeight;
      esCargaInicialRef.current = false;
      return;
    }

    // Si el usuario no está navegando hacia arriba y se encuentra cerca del fondo (< 60px),
    // acompañar suavemente al nuevo mensaje que llega
    if (!usuarioHizoScrollArribaRef.current) {
      const cercaDelFondo = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      if (cercaDelFondo) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [mensajesLista]);

  function alHacerScroll(evento) {
    const el = evento.currentTarget;
    const distanciaAlFondo = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Si la distancia supera 40px, el usuario está navegando el historial hacia arriba
    const navegandoArriba = distanciaAlFondo > 40;
    usuarioHizoScrollArribaRef.current = navegandoArriba;
    setMostrarBotonBajar(distanciaAlFondo > 100);
  }

  function irAlFondo() {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      usuarioHizoScrollArribaRef.current = false;
      setMostrarBotonBajar(false);
    }
  }

  async function procesarEnvio() {
    const cuerpo = texto.trim();
    if (!cuerpo || enviando) return;

    setEnviando(true);
    setFallo(null);
    setConfirmado(null);
    setErrores({});

    try {
      await enviarMensaje(hiloId, cuerpo);
      setTexto('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
      setConfirmado('Mensaje enviado');
      setTimeout(() => setConfirmado(null), 2500);
      usuarioHizoScrollArribaRef.current = false;
      setMostrarBotonBajar(false);
      setRecarga((n) => n + 1);
      alEnviar();

      // Mantener el cursor activo en el textarea para continuar escribiendo sin pausas
      setTimeout(() => {
        textareaRef.current?.focus();
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 40);
    } catch (error) {
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message || 'No se pudo enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  }

  function alCambiarTexto(e) {
    setTexto(e.target.value);
    const el = e.target;
    el.style.height = '44px';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function alPresionarTecla(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      procesarEnvio();
    }
  }

  return (
    <>
      {/* Cabecera del hilo abierto */}
      <div className={estilos.cabeceraConversacion}>
        <div className={estilos.infoConversacion}>
          <h3 className={estilos.tituloConversacion}>{hilo.titulo}</h3>
          <p className={estilos.subtituloConversacion}>
            <span>{proyectoNombre}</span>
            {hilo.etapaNombre && (
              <>
                <span>·</span>
                <span className={estilos.badgeEtapa}>Etapa: {hilo.etapaNombre}</span>
              </>
            )}
          </p>
        </div>

        <div className={estilos.cabeceraBadges}>
          <div
            className={estilos.indicadorEfimero}
            title="Política de retención automática de mensajes"
            data-testid="chat-ephemeral-notice"
          >
            <Clock size={12} aria-hidden="true" />
            <span>Historial efímero: los mensajes se depuran automáticamente tras 30 días</span>
          </div>

          <div className={estilos.indicadorSeguro} title="Canal cifrado y restringido a los participantes autorizados del proyecto">
            <Lock size={12} aria-hidden="true" />
            <span>Canal en tiempo real verificado</span>
          </div>
        </div>
      </div>

      {/* Historial de mensajes con scroll libre y botón para bajar */}
      <div className={estilos.areaMensajesWrapper}>
        <div className={estilos.areaMensajes} ref={scrollRef} onScroll={alHacerScroll}>
          {mensajes.cargando && mensajesLista.length === 0 && (
            <EstadoCarga mensaje="Cargando mensajes del hilo..." esqueleto={3} />
          )}

          {!mensajes.cargando && mensajes.error && mensajesLista.length === 0 && (
            <EstadoError error={mensajes.error} alReintentar={mensajes.reintentar} />
          )}

          {!mensajes.cargando && !mensajes.error && mensajesLista.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center' }}>
              <EstadoVacio
                mensaje={mensajes.datos?.mensaje || 'Aún no hay mensajes en este hilo. Sé el primero en escribir.'}
                icono={MessagesSquare}
              />
            </div>
          )}

          {mensajesLista.map((mensaje) => (
            <BurbujaMensaje key={mensaje.id} mensaje={mensaje} />
          ))}
        </div>

        {mostrarBotonBajar && (
          <button
            type="button"
            className={estilos.botonBajarFlotante}
            onClick={irAlFondo}
            title="Ir a los mensajes más recientes"
            aria-label="Ir al último mensaje"
          >
            <ChevronDown size={18} />
          </button>
        )}
      </div>

      {/* Área inferior de escritura */}
      <div className={estilos.areaEnvio}>
        {confirmado && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--c-exito-texto)' }}>
            <CheckCheck size={14} />
            <span>{confirmado}</span>
          </div>
        )}

        {fallo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--c-error-texto)' }}>
            <AlertCircle size={14} />
            <span>{fallo}</span>
          </div>
        )}

        <form
          className={estilos.formularioEnvio}
          onSubmit={(e) => {
            e.preventDefault();
            procesarEnvio();
          }}
        >
          <textarea
            ref={textareaRef}
            className={estilos.textareaMensaje}
            placeholder="Escriba un mensaje aquí... (Presione Enter para enviar)"
            value={texto}
            onChange={alCambiarTexto}
            onKeyDown={alPresionarTecla}
            rows={1}
            disabled={enviando}
          />

          <button
            type="submit"
            className={estilos.botonEnviarIcono}
            disabled={enviando || !texto.trim()}
            title="Enviar mensaje (Enter)"
            aria-label="Enviar mensaje"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </form>

        <div className={estilos.pistaAtajo}>
          <span><strong>Enter</strong> para enviar · <strong>Shift + Enter</strong> para salto de línea</span>
          <span>Autenticado como miembro autorizado del proyecto</span>
        </div>
      </div>
    </>
  );
}

/** Componente de burbuja de mensaje con distinción visual autor/destinatario */
function BurbujaMensaje({ mensaje }) {
  const { sesion } = useSesion();
  const esPropio = mensaje.autorId === sesion?.trabajadorId;

  return (
    <div className={`${estilos.filaMensaje} ${esPropio ? estilos.filaMensajePropio : estilos.filaMensajeAjeno}`}>
      <div className={estilos.encabezadoBurbuja}>
        <User size={13} aria-hidden="true" />
        <span className={estilos.nombreAutor}>
          {esPropio ? 'Usted' : mensaje.autorNombreCompleto}
        </span>
      </div>

      <div className={`${estilos.burbuja} ${esPropio ? estilos.burbujaPropia : estilos.burbujaAjena}`}>
        <div>{mensaje.cuerpo}</div>
        <div className={estilos.horaBurbuja}>
          <span>{formatearFechaHora(mensaje.enviadoEn)}</span>
        </div>
      </div>
    </div>
  );
}
