import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCheck,
  CircleCheck,
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

import { obtenerMisProyectos } from '../../api/asignaciones.js';
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
  const [proyectoId, setProyectoId] = useState('');
  const [etapaId, setEtapaId] = useState('');
  const [hiloAbierto, setHiloAbierto] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [modalNuevoHilo, setModalNuevoHilo] = useState(false);

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

  const proyectosLista = misProyectos.datos?.contenido || [];

  // Autoseleccionar el primer proyecto disponible para agilizar la entrada
  useEffect(() => {
    if (!proyectoId && proyectosLista.length > 0) {
      setProyectoId(String(proyectosLista[0].proyectoId));
    }
  }, [proyectoId, proyectosLista]);

  const opcionesDeProyecto = proyectosLista.map(
    ({ proyectoId: id, proyectoNombre, estadoHabilitacion }) => ({
      valor: String(id),
      texto:
        estadoHabilitacion === 'INHABILITADO'
          ? `${proyectoNombre} (inhabilitado)`
          : proyectoNombre,
    }),
  );

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
  const proyectoActual = proyectosLista.find((p) => String(p.proyectoId) === String(proyectoId));
  const hiloActual = listaDeHilos.find((h) => h.id === hiloAbierto);

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
          {/* Barra superior de contexto */}
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
              opciones={opcionesDeEtapa}
              value={etapaId}
              onChange={alElegirEtapa}
              pista="Opcional: Ver conversaciones de todas las etapas o filtrar una específica."
            />

            <div className={estilos.accionNuevoHilo}>
              <Boton
                variante="primario"
                icono={Plus}
                onClick={() => setModalNuevoHilo(true)}
                disabled={!proyectoId}
              >
                Nueva conversación
              </Boton>
            </div>
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
  hilos,
  cargando,
  error,
  alReintentar,
  mensajeVacio,
  hiloAbierto,
  alAbrir,
  onAbrirModalCreacion,
}) {
  const [busqueda, setBusqueda] = useState('');

  const hilosFiltrados = hilos.filter((hilo) =>
    hilo.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    hilo.etapaNombre?.toLowerCase().includes(busqueda.toLowerCase())
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
            <div style={{ marginTop: '1rem' }}>
              <Boton variante="secundario" icono={Plus} onClick={onAbrirModalCreacion}>
                Iniciar primer hilo
              </Boton>
            </div>
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

/** Conversación activa con lista de mensajes en burbujas y envío ágil con tecla Enter */
function Conversacion({ hiloId, hilo, proyectoNombre, alEnviar }) {
  const [recarga, setRecarga] = useState(0);
  const [texto, setTexto] = useState('');
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const scrollRef = useRef(null);

  const cargar = useCallback(({ senal }) => obtenerMensajes(hiloId, { senal }), [hiloId]);
  const mensajes = usePeticion(cargar, [hiloId, recarga]);

  const listaMensajes = mensajes.datos?.contenido || [];

  // Scroll automático al final cuando llegan mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [listaMensajes]);

  async function procesarEnvio() {
    if (!texto.trim() || enviando) return;

    setEnviando(true);
    setFallo(null);
    setConfirmado(null);
    setErrores({});

    try {
      await enviarMensaje(hiloId, texto.trim());
      setTexto('');
      setConfirmado('Mensaje enviado');
      setTimeout(() => setConfirmado(null), 3000);
      setRecarga((n) => n + 1);
      alEnviar();
    } catch (error) {
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message || 'No se pudo enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
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

        <div className={estilos.indicadorSeguro} title="Canal cifrado y restringido a los participantes autorizados del proyecto">
          <Lock size={12} aria-hidden="true" />
          <span>Canal de equipo verificado</span>
        </div>
      </div>

      {/* Historial de mensajes */}
      <div className={estilos.areaMensajes} ref={scrollRef}>
        {mensajes.cargando && <EstadoCarga mensaje="Cargando mensajes del hilo..." esqueleto={3} />}

        {!mensajes.cargando && mensajes.error && (
          <EstadoError error={mensajes.error} alReintentar={mensajes.reintentar} />
        )}

        {!mensajes.cargando && !mensajes.error && listaMensajes.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center' }}>
            <EstadoVacio
              mensaje={mensajes.datos?.mensaje || 'Aún no hay mensajes en este hilo. Sé el primero en escribir.'}
              icono={MessagesSquare}
            />
          </div>
        )}

        {!mensajes.cargando && !mensajes.error && listaMensajes.map((mensaje) => (
          <BurbujaMensaje key={mensaje.id} mensaje={mensaje} />
        ))}
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
            className={estilos.textareaMensaje}
            placeholder="Escriba un mensaje aquí... (Presione Enter para enviar)"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={alPresionarTecla}
            rows={2}
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
