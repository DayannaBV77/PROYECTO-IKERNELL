import { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Inbox,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  User,
} from 'lucide-react';

import {
  enviarRespuestaConsulta,
  marcarConsultaEnGestion,
  obtenerConsultas,
  reintentarNotificacionConsulta,
} from '../../api/contenidoAdmin.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilosGestion from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import estilos from './PaginaConsultas.module.css';

const FILTROS_ESTADO = [
  { valor: 'TODAS', texto: 'Todas las consultas' },
  { valor: 'PENDIENTE', texto: 'Pendientes' },
  { valor: 'EN_GESTION', texto: 'En gestión' },
  { valor: 'RESPONDIDA', texto: 'Respondidas' },
  { valor: 'ERROR_NOTIFICACION', texto: 'Error de notificación' },
];

/**
 * Formatea una fecha ISO para presentación en pantalla de forma legible.
 */
function formatearFecha(iso) {
  if (!iso) return '';
  return iso.slice(0, 16).replace('T', ' ');
}

/**
 * Insignia visual para identificar de forma clara e intuitiva el estado de una consulta.
 */
function InsigniaEstado({ estado }) {
  switch (estado) {
    case 'PENDIENTE':
      return (
        <span className={`${estilos.badgeEstado} ${estilos.badgePendiente}`} role="status">
          <Clock size={13} aria-hidden="true" />
          Pendiente
        </span>
      );
    case 'EN_GESTION':
      return (
        <span className={`${estilos.badgeEstado} ${estilos.badgeEnGestion}`} role="status">
          <RefreshCw size={13} aria-hidden="true" />
          En gestión
        </span>
      );
    case 'RESPONDIDA':
      return (
        <span className={`${estilos.badgeEstado} ${estilos.badgeRespondida}`} role="status">
          <CheckCircle2 size={13} aria-hidden="true" />
          Respondida
        </span>
      );
    case 'ERROR_NOTIFICACION':
      return (
        <span className={`${estilos.badgeEstado} ${estilos.badgeErrorNotificacion}`} role="status">
          <AlertTriangle size={13} aria-hidden="true" />
          Error de notificación
        </span>
      );
    default:
      return (
        <span className={estilos.badgeEstado}>
          {estado || 'Sin estado'}
        </span>
      );
  }
}

/**
 * Módulo de administración, gestión y respuesta de consultas web recibidas desde el portal
 * público (RF-035, HU-02), operado por el rol de Coordinador.
 */
export default function PaginaConsultas() {
  const [filtroEstado, setFiltroEstado] = useState('TODAS');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [recarga, setRecarga] = useState(0);

  // Estados de interfaz interactiva
  const [consultaExpandidaId, setConsultaExpandidaId] = useState(null);
  const [borradoresRespuesta, setBorradoresRespuesta] = useState({});
  const [enviando, setEnviando] = useState({});
  const [marcandoGestion, setMarcandoGestion] = useState({});
  const [reintentando, setReintentando] = useState({});
  const [avisoExito, setAvisoExito] = useState(null);
  const [avisoFallo, setAvisoFallo] = useState(null);

  // Carga de todas las consultas para calcular contadores y permitir filtrado ágil
  const cargar = useCallback(({ senal }) => obtenerConsultas({}, { senal }), []);
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [recarga]);

  const listaCompleta = useMemo(() => datos?.contenido || [], [datos]);

  // Contadores para métricas y accesos rápidos
  const conteos = useMemo(() => {
    const c = {
      TOTAL: listaCompleta.length,
      PENDIENTE: 0,
      EN_GESTION: 0,
      RESPONDIDA: 0,
      ERROR_NOTIFICACION: 0,
    };
    listaCompleta.forEach((item) => {
      const st = item.estado || (item.atendida ? 'RESPONDIDA' : 'PENDIENTE');
      if (c[st] !== undefined) {
        c[st]++;
      }
    });
    return c;
  }, [listaCompleta]);

  // Filtrado local según estado seleccionado y término de búsqueda
  const consultasFiltradas = useMemo(() => {
    let resultado = listaCompleta;

    if (filtroEstado !== 'TODAS') {
      resultado = resultado.filter((c) => {
        const st = c.estado || (c.atendida ? 'RESPONDIDA' : 'PENDIENTE');
        return st === filtroEstado;
      });
    }

    if (terminoBusqueda.trim()) {
      const q = terminoBusqueda.toLowerCase().trim();
      resultado = resultado.filter((c) =>
        (c.nombreContacto && c.nombreContacto.toLowerCase().includes(q)) ||
        (c.correoContacto && c.correoContacto.toLowerCase().includes(q)) ||
        (c.pregunta && c.pregunta.toLowerCase().includes(q)) ||
        (c.id && String(c.id).includes(q))
      );
    }

    return resultado;
  }, [listaCompleta, filtroEstado, terminoBusqueda]);

  // Alterna la apertura del panel de redacción y seguimiento para una consulta
  function alternarConsulta(id) {
    setAvisoExito(null);
    setAvisoFallo(null);
    setConsultaExpandidaId((actual) => (actual === id ? null : id));
  }

  // Actualiza el borrador de respuesta para una consulta
  function alCambiarBorrador(id, valor) {
    setBorradoresRespuesta((prev) => ({ ...prev, [id]: valor }));
  }

  // Pasa la consulta a estado EN_GESTION
  async function alIniciarGestion(consulta) {
    setMarcandoGestion((prev) => ({ ...prev, [consulta.id]: true }));
    setAvisoExito(null);
    setAvisoFallo(null);

    try {
      await marcarConsultaEnGestion(consulta.id);
      setAvisoExito(`La consulta #CONS-${consulta.id} pasó al estado "En gestión".`);
      setRecarga((n) => n + 1);
    } catch (err) {
      setAvisoFallo(err.message || 'No se pudo actualizar el estado de la consulta.');
    } finally {
      setMarcandoGestion((prev) => ({ ...prev, [consulta.id]: false }));
    }
  }

  // Envía la respuesta redactada con notificación por correo y control anti-duplicados
  async function alEnviarRespuesta(evento, consulta) {
    evento.preventDefault();
    const texto = (borradoresRespuesta[consulta.id] || '').trim();

    if (!texto) {
      setAvisoFallo('Debe redactar una respuesta antes de realizar el envío.');
      return;
    }

    if (texto.length < 5) {
      setAvisoFallo('La respuesta debe tener al menos 5 caracteres.');
      return;
    }

    // Bloqueo frontend contra clics dobles repetidos
    if (enviando[consulta.id]) {
      return;
    }

    setEnviando((prev) => ({ ...prev, [consulta.id]: true }));
    setAvisoExito(null);
    setAvisoFallo(null);

    try {
      const res = await enviarRespuestaConsulta(consulta.id, {
        respuesta: texto,
        tokenTransaccion: `${consulta.id}-${Date.now()}`,
      });

      if (res.exitoso) {
        setAvisoExito(res.mensaje || 'Respuesta enviada y notificada por correo exitosamente.');
        // Limpiar el borrador si fue exitoso
        setBorradoresRespuesta((prev) => {
          const copia = { ...prev };
          delete copia[consulta.id];
          return copia;
        });
      } else {
        // En caso de fallo de correo, la respuesta se conservó y la consulta no desaparece
        setAvisoFallo(res.mensaje || 'La respuesta fue guardada, pero ocurrió un fallo al enviar la notificación por correo.');
      }
      setRecarga((n) => n + 1);
    } catch (err) {
      setAvisoFallo(err.message || 'Error al procesar el envío de la respuesta.');
    } finally {
      setEnviando((prev) => ({ ...prev, [consulta.id]: false }));
    }
  }

  // Reintenta el envío de la notificación para una respuesta previamente guardada
  async function alReintentarNotificacion(consulta, respuesta) {
    setReintentando((prev) => ({ ...prev, [respuesta.id]: true }));
    setAvisoExito(null);
    setAvisoFallo(null);

    try {
      const res = await reintentarNotificacionConsulta(consulta.id, respuesta.id);
      if (res.exitoso) {
        setAvisoExito(res.mensaje || 'Notificación por correo reenviada exitosamente.');
      } else {
        setAvisoFallo(res.mensaje || 'El reintento de envío de correo volvió a fallar.');
      }
      setRecarga((n) => n + 1);
    } catch (err) {
      setAvisoFallo(err.message || 'No se pudo reintentar el envío.');
    } finally {
      setReintentando((prev) => ({ ...prev, [respuesta.id]: false }));
    }
  }

  return (
    <Seccion
      titulo="Gestión de Consultas Web"
      descripcion="Administración, atención e historial de preguntas enviadas por los visitantes desde el portal web (RF-035, HU-02)."
      id="consultas-admin"
    >
      <div className={estilos.filtrosContenedor}>
        {/* Contadores rápidos / métricas de estado */}
        <div className={estilos.resumenGrid}>
          <button
            type="button"
            className={`${estilos.tarjetaContador} ${estilos.bordeTotal} ${filtroEstado === 'TODAS' ? estilos.tarjetaActiva : ''}`}
            onClick={() => setFiltroEstado('TODAS')}
          >
            <span className={estilos.contadorNumero}>{conteos.TOTAL}</span>
            <span className={estilos.contadorRotulo}>Todas</span>
          </button>

          <button
            type="button"
            className={`${estilos.tarjetaContador} ${estilos.bordePendiente} ${filtroEstado === 'PENDIENTE' ? estilos.tarjetaActiva : ''}`}
            onClick={() => setFiltroEstado('PENDIENTE')}
          >
            <span className={estilos.contadorNumero}>{conteos.PENDIENTE}</span>
            <span className={estilos.contadorRotulo}>Pendientes</span>
          </button>

          <button
            type="button"
            className={`${estilos.tarjetaContador} ${estilos.bordeEnGestion} ${filtroEstado === 'EN_GESTION' ? estilos.tarjetaActiva : ''}`}
            onClick={() => setFiltroEstado('EN_GESTION')}
          >
            <span className={estilos.contadorNumero}>{conteos.EN_GESTION}</span>
            <span className={estilos.contadorRotulo}>En gestión</span>
          </button>

          <button
            type="button"
            className={`${estilos.tarjetaContador} ${estilos.bordeRespondida} ${filtroEstado === 'RESPONDIDA' ? estilos.tarjetaActiva : ''}`}
            onClick={() => setFiltroEstado('RESPONDIDA')}
          >
            <span className={estilos.contadorNumero}>{conteos.RESPONDIDA}</span>
            <span className={estilos.contadorRotulo}>Respondidas</span>
          </button>

          <button
            type="button"
            className={`${estilos.tarjetaContador} ${estilos.bordeError} ${filtroEstado === 'ERROR_NOTIFICACION' ? estilos.tarjetaActiva : ''}`}
            onClick={() => setFiltroEstado('ERROR_NOTIFICACION')}
          >
            <span className={estilos.contadorNumero}>{conteos.ERROR_NOTIFICACION}</span>
            <span className={estilos.contadorRotulo}>Error de correo</span>
          </button>
        </div>

        {/* Barra de búsqueda y selector de filtro */}
        <div className={estilos.barraControl}>
          <div className={estilos.grupoFiltros}>
            <div style={{ minWidth: '220px' }}>
              <Campo
                etiqueta="Filtrar por estado"
                nombre="filtroEstado"
                opciones={FILTROS_ESTADO}
                textoVacio={null}
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              />
            </div>

            <div style={{ flex: '1', minWidth: '240px' }}>
              <Campo
                etiqueta="Buscar por visitante, correo o texto"
                nombre="terminoBusqueda"
                placeholder="Escriba para filtrar..."
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Avisos de retroalimentación operacional */}
      {avisoExito && (
        <p className={estilosGestion.avisoExito} role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          {avisoExito}
        </p>
      )}

      {avisoFallo && (
        <p className={estilosGestion.avisoError} role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          {avisoFallo}
        </p>
      )}

      {/* Estados de carga y error inicial */}
      {cargando && <EstadoCarga mensaje="Cargando las consultas recibidas..." esqueleto={3} />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {/* Estado vacío si no hay resultados */}
      {!cargando && !error && consultasFiltradas.length === 0 && (
        <EstadoVacio
          mensaje={
            terminoBusqueda || filtroEstado !== 'TODAS'
              ? 'No se encontraron consultas que coincidan con los criterios de filtrado.'
              : (datos?.mensaje || 'No hay consultas web recibidas en el sistema.')
          }
          icono={Inbox}
        />
      )}

      {/* Listado de consultas */}
      {!cargando && !error && consultasFiltradas.length > 0 && (
        <div className={estilosGestion.listaActividades}>
          {consultasFiltradas.map((consulta) => {
            const estaExpandida = consultaExpandidaId === consulta.id;
            const estadoActual = consulta.estado || (consulta.atendida ? 'RESPONDIDA' : 'PENDIENTE');
            const historialRespuestas = consulta.respuestas || [];
            const estaEnviando = enviando[consulta.id] || false;
            const borrador = borradoresRespuesta[consulta.id] || '';

            return (
              <article key={consulta.id} className={estilos.tarjetaConsulta}>
                {/* Cabecera de la consulta: visitante, fecha y estado */}
                <header className={estilos.cabeceraConsulta}>
                  <div>
                    <div className={estilos.visitanteNombre}>
                      <User size={18} aria-hidden="true" />
                      <span>{consulta.nombreContacto || 'Visitante anónimo'}</span>
                      <span className={estilos.identificadorRef}>(Ref: #CONS-{consulta.id})</span>
                    </div>

                    <div className={estilos.metaRecepcion}>
                      <Clock size={12} aria-hidden="true" style={{ display: 'inline', marginRight: '4px' }} />
                      Recibida: {formatearFecha(consulta.recibidaEn)}
                    </div>
                  </div>

                  <InsigniaEstado estado={estadoActual} />
                </header>

                {/* Pregunta recibida */}
                <div className={estilos.preguntaBloque}>
                  <p className={estilos.preguntaTitulo}>Pregunta formulada:</p>
                  <p className={estilos.preguntaTexto}>{consulta.pregunta}</p>
                </div>

                {/* Datos de contacto para respuesta */}
                <div className={estilos.datosContacto}>
                  {consulta.correoContacto ? (
                    <span className={estilos.enlaceContacto}>
                      <Mail size={14} aria-hidden="true" />
                      <a href={`mailto:${consulta.correoContacto}`}>{consulta.correoContacto}</a>
                    </span>
                  ) : (
                    <span>Sin correo de contacto</span>
                  )}

                  {consulta.telefonoContacto && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={14} aria-hidden="true" />
                      {consulta.telefonoContacto}
                    </span>
                  )}
                </div>

                {/* Trazabilidad: trabajador que atendió y fecha de respuesta */}
                {(consulta.atendidaPorNombre || consulta.fechaRespuesta) && (
                  <div className={estilos.infoAtencion}>
                    <Check size={14} aria-hidden="true" />
                    <span>
                      Atendida por:{' '}
                      <strong>{consulta.atendidaPorNombre || `Trabajador #${consulta.atendidaPorId}`}</strong>
                    </span>
                    {consulta.fechaRespuesta && (
                      <span>· Fecha de atención: {formatearFecha(consulta.fechaRespuesta)}</span>
                    )}
                  </div>
                )}

                {/* Botones de acción rápida */}
                <div className={estilos.accionesConsulta}>
                  <Boton
                    variante={estaExpandida ? 'secundario' : 'primario'}
                    icono={MessageSquare}
                    onClick={() => alternarConsulta(consulta.id)}
                  >
                    {estaExpandida ? 'Ocultar gestión' : 'Gestionar / Responder'}
                  </Boton>

                  {estadoActual === 'PENDIENTE' && (
                    <Boton
                      variante="secundario"
                      icono={RefreshCw}
                      disabled={marcandoGestion[consulta.id]}
                      onClick={() => alIniciarGestion(consulta)}
                    >
                      {marcandoGestion[consulta.id] ? 'Marcando...' : 'Iniciar gestión'}
                    </Boton>
                  )}
                </div>

                {/* Panel desplegable: Redacción integrada y trazabilidad del historial */}
                {estaExpandida && (
                  <div className={estilos.panelRedaccion}>
                    <div className={estilos.cabeceraRedaccion}>
                      <h4 className={estilos.tituloRedaccion}>
                        <MessageSquare size={16} aria-hidden="true" />
                        Redacción y Notificación Integrada
                      </h4>
                      <span style={{ fontSize: 'var(--t-xs)', color: 'var(--c-texto-tenue)' }}>
                        Consulta #CONS-{consulta.id}
                      </span>
                    </div>

                    {/* Aviso informativo de envío seguro de correo */}
                    <div className={estilos.avisoEnvioCorreo}>
                      <Mail size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        Al confirmar, el sistema enviará automáticamente un correo electrónico a{' '}
                        <strong>{consulta.correoContacto || 'el visitante'}</strong> con la respuesta oficial
                        y la referencia #{`CONS-${consulta.id}`}, sin exponer datos internos.
                      </div>
                    </div>

                    {/* Formulario de redacción de respuesta */}
                    <form onSubmit={(e) => alEnviarRespuesta(e, consulta)}>
                      <Campo
                        etiqueta="Respuesta oficial de la empresa"
                        nombre={`respuesta-${consulta.id}`}
                        area
                        rows={5}
                        obligatorio
                        placeholder="Redacte aquí la respuesta detallada para el visitante..."
                        value={borrador}
                        onChange={(e) => alCambiarBorrador(consulta.id, e.target.value)}
                        pista={`Mínimo 5 caracteres. Longitud actual: ${borrador.length} caracteres.`}
                      />

                      <div className={estilos.accionesFormularioRespuesta}>
                        <Boton
                          tipo="button"
                          variante="secundario"
                          onClick={() => alternarConsulta(consulta.id)}
                          disabled={estaEnviando}
                        >
                          Cerrar
                        </Boton>

                        <Boton
                          tipo="submit"
                          variante="primario"
                          icono={estaEnviando ? RefreshCw : Send}
                          disabled={estaEnviando || borrador.trim().length < 5}
                        >
                          {estaEnviando ? 'Enviando respuesta...' : 'Enviar respuesta por correo'}
                        </Boton>
                      </div>
                    </form>

                    {/* Historial de respuestas y trazabilidad de conversación */}
                    {historialRespuestas.length > 0 && (
                      <div className={estilos.historialContenedor}>
                        <h5 className={estilos.historialTitulo}>
                          <Clock size={15} aria-hidden="true" />
                          Historial de respuestas registradas ({historialRespuestas.length})
                        </h5>

                        {historialRespuestas.map((resp) => {
                          const estaReintentando = reintentando[resp.id] || false;

                          return (
                            <div key={resp.id} className={estilos.itemHistorial}>
                              <div className={estilos.cabeceraItemHistorial}>
                                <span>
                                  <strong>{resp.nombreTrabajador || `Coordinador #${resp.trabajadorId}`}</strong>
                                </span>
                                <span>{formatearFecha(resp.fechaRespuesta)}</span>
                              </div>

                              <p className={estilos.cuerpoItemHistorial}>{resp.contenido}</p>

                              <div className={estilos.pieItemHistorial}>
                                {resp.enviadaPorCorreo ? (
                                  <span className={estilos.estadoEnvioExito}>
                                    <CheckCircle2 size={14} aria-hidden="true" />
                                    Notificación por correo entregada
                                  </span>
                                ) : (
                                  <div>
                                    <span className={estilos.estadoEnvioFallo}>
                                      <AlertTriangle size={14} aria-hidden="true" />
                                      Fallo en la notificación por correo
                                    </span>
                                    {resp.detalleError && (
                                      <div className={estilos.detalleFallo}>
                                        Detalle del error: {resp.detalleError}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {!resp.enviadaPorCorreo && (
                                  <Boton
                                    variante="secundario"
                                    icono={RefreshCw}
                                    disabled={estaReintentando}
                                    onClick={() => alReintentarNotificacion(consulta, resp)}
                                  >
                                    {estaReintentando ? 'Reintentando...' : 'Reintentar notificación'}
                                  </Boton>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Seccion>
  );
}
