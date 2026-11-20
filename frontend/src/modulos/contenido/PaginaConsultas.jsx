import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Inbox,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Send,
  Sparkles,
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
import PaginacionTabla from '../../componentes/ui/PaginacionTabla.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import { useNotificador } from '../../componentes/ui/Notificador.jsx';
import { usePeticion } from '../../hooks/usePeticion.js';
import estilos from './PaginaConsultas.module.css';

const FILTROS_ESTADO = [
  { valor: 'TODAS', texto: 'Todas' },
  { valor: 'PENDIENTE', texto: 'Pendientes' },
  { valor: 'EN_GESTION', texto: 'En gestión' },
  { valor: 'RESPONDIDA', texto: 'Respondidas' },
  { valor: 'ERROR_NOTIFICACION', texto: 'Error de notificación' },
];

const PLANTILLAS_RESPUESTA = [
  {
    id: 'recepcion',
    etiqueta: 'Agradecimiento y recepción',
    texto:
      'Estimado(a) cliente, agradecemos su comunicación con IKernell Soluciones Software. Hemos recibido su consulta y nuestro equipo técnico ya la está revisando para brindarle una respuesta completa a la brevedad.',
  },
  {
    id: 'servicios',
    etiqueta: 'Información de servicios',
    texto:
      'Gracias por su interés en nuestros servicios de desarrollo y consultoría de software. Adjuntamos el alcance de nuestras soluciones empresariales y quedamos atentos para agendar una breve reunión de diagnóstico.',
  },
  {
    id: 'ampliacion',
    etiqueta: 'Solicitud de ampliación',
    texto:
      'Para brindarle una estimación técnica precisa, le agradecemos compartirnos un poco más de detalle sobre el alcance esperado, volumen de usuarios y fechas objetivo de su requerimiento.',
  },
  {
    id: 'asesor',
    etiqueta: 'Remisión a asesor comercial',
    texto:
      'Hemos escalado su solicitud con uno de nuestros asesores comerciales especializados, quien se pondrá en contacto con usted por este medio o vía telefónica en el transcurso del día.',
  },
];

function formatearFechaExacta(iso) {
  if (!iso) return 'Sin fecha';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso.slice(0, 16).replace('T', ' ');
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha);
}

function formatearTiempoRelativo(iso) {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const diffMin = Math.floor((Date.now() - fecha.getTime()) / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `Hace ${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) return 'Ayer';
  if (diffDias < 7) return `Hace ${diffDias} días`;
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' }).format(fecha);
}

function estadoDe(consulta) {
  return consulta.estado || (consulta.atendida ? 'RESPONDIDA' : 'PENDIENTE');
}

function InsigniaEstado({ estado }) {
  switch (estado) {
    case 'PENDIENTE':
      return (
        <span className={`${estilos.badgeEstado} ${estilos.badgePendiente}`} role="status">
          <Clock size={12} aria-hidden="true" />
          Pendiente
        </span>
      );
    case 'EN_GESTION':
      return (
        <span className={`${estilos.badgeEstado} ${estilos.badgeEnGestion}`} role="status">
          <RefreshCw size={12} aria-hidden="true" />
          En gestión
        </span>
      );
    case 'RESPONDIDA':
      return (
        <span className={`${estilos.badgeEstado} ${estilos.badgeRespondida}`} role="status">
          <CheckCircle2 size={12} aria-hidden="true" />
          Respondida
        </span>
      );
    case 'ERROR_NOTIFICACION':
      return (
        <span className={`${estilos.badgeEstado} ${estilos.badgeErrorNotificacion}`} role="status">
          <AlertTriangle size={12} aria-hidden="true" />
          Error de notificación
        </span>
      );
    default:
      return <span className={estilos.badgeEstado}>{estado || 'Sin estado'}</span>;
  }
}

/**
 * Desk de Atención Corporativo para Consultas Web (RF-035, HU-02).
 */
export default function PaginaConsultas() {
  const notificador = useNotificador();
  const [filtroEstado, setFiltroEstado] = useState('TODAS');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [ordenFecha, setOrdenFecha] = useState('recientes');
  const [pagina, setPagina] = useState(1);
  const [tamanoPagina, setTamanoPagina] = useState(10);
  const [recarga, setRecarga] = useState(0);

  const [consultaSeleccionadaId, setConsultaSeleccionadaId] = useState(null);
  const [borradoresRespuesta, setBorradoresRespuesta] = useState({});
  const [correosDestino, setCorreosDestino] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [marcandoGestion, setMarcandoGestion] = useState(false);
  const [reintentandoId, setReintentandoId] = useState(null);
  const [copiadoId, setCopiadoId] = useState(null);

  const cargar = useCallback(({ senal }) => obtenerConsultas({}, { senal }), []);
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [recarga]);

  const listaCompleta = useMemo(() => datos?.contenido || [], [datos]);

  const conteos = useMemo(() => {
    const c = {
      TODAS: listaCompleta.length,
      PENDIENTE: 0,
      EN_GESTION: 0,
      RESPONDIDA: 0,
      ERROR_NOTIFICACION: 0,
    };
    listaCompleta.forEach((item) => {
      const st = estadoDe(item);
      if (c[st] !== undefined) {
        c[st]++;
      }
    });
    return c;
  }, [listaCompleta]);

  const consultasFiltradas = useMemo(() => {
    let resultado = listaCompleta;

    if (filtroEstado !== 'TODAS') {
      resultado = resultado.filter((c) => estadoDe(c) === filtroEstado);
    }

    if (terminoBusqueda.trim()) {
      const q = terminoBusqueda.toLowerCase().trim();
      resultado = resultado.filter(
        (c) =>
          (c.nombreContacto && c.nombreContacto.toLowerCase().includes(q)) ||
          (c.correoContacto && c.correoContacto.toLowerCase().includes(q)) ||
          (c.pregunta && c.pregunta.toLowerCase().includes(q)) ||
          (c.id && (`cons-${c.id}`.includes(q) || String(c.id).includes(q))),
      );
    }

    const ordenadas = [...resultado].sort((a, b) => {
      const ta = new Date(a.recibidaEn || 0).getTime();
      const tb = new Date(b.recibidaEn || 0).getTime();
      return ordenFecha === 'recientes' ? tb - ta : ta - tb;
    });

    return ordenadas;
  }, [listaCompleta, filtroEstado, terminoBusqueda, ordenFecha]);

  const totalPaginas = Math.max(1, Math.ceil(consultasFiltradas.length / tamanoPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const consultasPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * tamanoPagina;
    return consultasFiltradas.slice(inicio, inicio + tamanoPagina);
  }, [consultasFiltradas, paginaSegura, tamanoPagina]);

  const consultaActiva = useMemo(() => {
    if (consultasFiltradas.length === 0) return null;
    return (
      consultasFiltradas.find((c) => c.id === consultaSeleccionadaId) ||
      consultasPaginadas[0] ||
      consultasFiltradas[0]
    );
  }, [consultasFiltradas, consultasPaginadas, consultaSeleccionadaId]);

  function alCambiarFiltroEstado(nuevoEstado) {
    setFiltroEstado(nuevoEstado);
    setPagina(1);
  }

  function alCambiarBusqueda(e) {
    setTerminoBusqueda(e.target.value);
    setPagina(1);
  }

  async function alCopiarCorreo(consulta) {
    if (!consulta.correoContacto) return;
    try {
      await navigator.clipboard.writeText(consulta.correoContacto);
      setCopiadoId(consulta.id);
      notificador.info(`Correo copiado: ${consulta.correoContacto}`, 'Copiado');
      setTimeout(() => setCopiadoId((prev) => (prev === consulta.id ? null : prev)), 1800);
    } catch {
      notificador.error('No fue posible copiar el correo al portapapeles.', 'Portapapeles');
    }
  }

  async function alIniciarGestion(consulta) {
    setMarcandoGestion(true);
    try {
      await marcarConsultaEnGestion(consulta.id);
      notificador.exito(`Consulta #CONS-${consulta.id} marcada en gestión.`, 'Estado actualizado');
      setRecarga((n) => n + 1);
    } catch (err) {
      notificador.error(err.message || 'No se pudo actualizar el estado.', 'Error');
    } finally {
      setMarcandoGestion(false);
    }
  }

  function aplicarPlantilla(consultaId, textoPlantilla) {
    setBorradoresRespuesta((prev) => ({ ...prev, [consultaId]: textoPlantilla }));
  }

  async function alEnviarRespuesta(evento, consulta) {
    evento.preventDefault();
    const texto = (borradoresRespuesta[consulta.id] || '').trim();
    const correoDestino = (
      correosDestino[consulta.id] !== undefined
        ? correosDestino[consulta.id]
        : consulta.correoContacto || ''
    ).trim();

    if (texto.length < 5) {
      notificador.error('Redacte una respuesta de al menos 5 caracteres.', 'Mensaje incompleto');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoDestino || !emailRegex.test(correoDestino)) {
      notificador.error('Indique un correo electrónico de destino válido.', 'Correo inválido');
      return;
    }

    if (enviando) return;
    setEnviando(true);

    try {
      await enviarRespuestaConsulta(consulta.id, {
        respuesta: texto,
        correoDestino,
        tokenTransaccion: `${consulta.id}-${Date.now()}`,
      });

      notificador.exito(
        `Respuesta enviada a ${correoDestino}.`,
        `Consulta #CONS-${consulta.id} respondida`,
      );
      setBorradoresRespuesta((prev) => {
        const copia = { ...prev };
        delete copia[consulta.id];
        return copia;
      });
      setRecarga((n) => n + 1);
    } catch (err) {
      notificador.error(err.message || 'No se pudo enviar la respuesta.', 'Error de envío');
    } finally {
      setEnviando(false);
    }
  }

  async function alReintentarNotificacion(consulta, respuesta) {
    setReintentandoId(respuesta.id);
    try {
      const res = await reintentarNotificacionConsulta(consulta.id, respuesta.id);
      if (res.exitoso) {
        notificador.exito(res.mensaje || 'Notificación reenviada correctamente.', 'Correo enviado');
      } else {
        notificador.error(res.mensaje || 'El reintento volvió a fallar.', 'Error de correo');
      }
      setRecarga((n) => n + 1);
    } catch (err) {
      notificador.error(err.message || 'No se pudo reintentar el envío.', 'Error');
    } finally {
      setReintentandoId(null);
    }
  }

  const estadoActivo = consultaActiva ? estadoDe(consultaActiva) : null;
  const borradorActivo = consultaActiva ? borradoresRespuesta[consultaActiva.id] || '' : '';
  const correoActivo = consultaActiva
    ? correosDestino[consultaActiva.id] !== undefined
      ? correosDestino[consultaActiva.id]
      : consultaActiva.correoContacto || ''
    : '';

  return (
    <Seccion
      titulo="Gestión de Consultas Web"
      descripcion="Bandeja centralizada para revisar solicitudes del portal público y enviar respuestas por correo."
    >
      {cargando ? (
        <EstadoCarga mensaje="Cargando bandeja de consultas..." />
      ) : error ? (
        <EstadoError error={error} alReintentar={reintentar} />
      ) : (
        <div className={estilos.contenedor}>
          <div className={estilos.barraSuperior}>
            <div className={estilos.filaPildoras} role="tablist" aria-label="Filtros por estado">
              {FILTROS_ESTADO.map((f) => {
                if (f.valor === 'ERROR_NOTIFICACION' && conteos.ERROR_NOTIFICACION === 0) {
                  return null;
                }
                const activo = filtroEstado === f.valor;
                return (
                  <button
                    key={f.valor}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    data-testid={`consultas-pill-${f.valor}`}
                    className={`${estilos.pildoraFiltro} ${activo ? estilos.pildoraActiva : ''}`}
                    onClick={() => alCambiarFiltroEstado(f.valor)}
                  >
                    <span>{f.texto}</span>
                    <span className={estilos.pildoraContador}>{conteos[f.valor] ?? 0}</span>
                  </button>
                );
              })}
            </div>

            <div className={estilos.filaBusqueda}>
              <div className={estilos.buscadorWrap}>
                <Search size={15} className={estilos.buscadorIcono} aria-hidden="true" />
                <input
                  type="search"
                  data-testid="consultas-search-input"
                  className={estilos.buscadorInput}
                  placeholder="Buscar por remitente, correo, ticket (#CONS) o palabra clave..."
                  value={terminoBusqueda}
                  onChange={alCambiarBusqueda}
                  aria-label="Buscar consultas"
                />
              </div>

              <select
                data-testid="consultas-sort-select"
                className={estilos.selectorOrden}
                value={ordenFecha}
                onChange={(e) => {
                  setOrdenFecha(e.target.value);
                  setPagina(1);
                }}
                aria-label="Ordenar consultas"
              >
                <option value="recientes">Más recientes primero</option>
                <option value="antiguas">Más antiguas primero</option>
              </select>
            </div>
          </div>

          {consultasFiltradas.length === 0 ? (
            <EstadoVacio
              icono={Inbox}
              titulo="Sin consultas para este criterio"
              descripcion="No hay solicitudes que coincidan con el filtro o búsqueda actual."
            />
          ) : (
            <div className={estilos.splitPane}>
              <div className={estilos.panelBandeja}>
                <div className={estilos.listaBandeja} role="list" aria-label="Lista de consultas">
                  {consultasPaginadas.map((c) => {
                    const seleccionada = consultaActiva?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="listitem"
                        data-testid={`consulta-item-${c.id}`}
                        className={`${estilos.itemConsulta} ${seleccionada ? estilos.itemConsultaActiva : ''}`}
                        onClick={() => setConsultaSeleccionadaId(c.id)}
                      >
                        <div className={estilos.itemCabecera}>
                          <span className={estilos.itemNombre}>{c.nombreContacto || 'Visitante'}</span>
                          <span className={estilos.itemTiempo}>{formatearTiempoRelativo(c.recibidaEn)}</span>
                        </div>
                        <p className={estilos.itemExtracto}>{c.pregunta}</p>
                        <div className={estilos.itemPie}>
                          <span className={estilos.ticketCodigo}>#CONS-{c.id}</span>
                          <InsigniaEstado estado={estadoDe(c)} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className={estilos.paginacionWrap}>
                  <PaginacionTabla
                    datos={{
                      totalPaginas,
                      totalElementos: consultasFiltradas.length,
                      tamano: tamanoPagina,
                      pagina: paginaSegura - 1,
                    }}
                    pagina={paginaSegura - 1}
                    tamano={tamanoPagina}
                    etiquetaItem="consultas"
                    alCambiarPagina={(nuevaPagina) => setPagina(nuevaPagina + 1)}
                    alCambiarTamano={(nuevoTamano) => {
                      setTamanoPagina(nuevoTamano);
                      setPagina(1);
                    }}
                  />
                </div>
              </div>

              {consultaActiva ? (
                <div className={estilos.panelDetalle} data-testid="consultas-detail-pane">
                  <div className={estilos.detalleCabecera}>
                    <div className={estilos.detalleIdentidad}>
                      <div className={estilos.detalleNombreFila}>
                        <h2 className={estilos.detalleNombre}>
                          {consultaActiva.nombreContacto || 'Visitante sin nombre'}
                        </h2>
                        <span className={estilos.ticketCodigo}>#CONS-{consultaActiva.id}</span>
                        <InsigniaEstado estado={estadoActivo} />
                      </div>

                      <div className={estilos.metaContacto}>
                        <span className={estilos.metaDato}>
                          <Mail size={14} aria-hidden="true" />
                          <span>{consultaActiva.correoContacto || 'Sin correo'}</span>
                          {consultaActiva.correoContacto && (
                            <button
                              type="button"
                              className={estilos.botonCopiar}
                              onClick={() => alCopiarCorreo(consultaActiva)}
                              title="Copiar correo electrónico"
                            >
                              {copiadoId === consultaActiva.id ? (
                                <Check size={12} aria-hidden="true" />
                              ) : (
                                <Copy size={12} aria-hidden="true" />
                              )}
                              <span>{copiadoId === consultaActiva.id ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          )}
                        </span>

                        {consultaActiva.telefonoContacto && (
                          <span className={estilos.metaDato}>
                            <Phone size={14} aria-hidden="true" />
                            <span>{consultaActiva.telefonoContacto}</span>
                          </span>
                        )}

                        <span className={estilos.metaDato}>
                          <Calendar size={14} aria-hidden="true" />
                          <span>{formatearFechaExacta(consultaActiva.recibidaEn)}</span>
                        </span>
                      </div>
                    </div>

                    <div className={estilos.barraAcciones}>
                      {estadoActivo === 'PENDIENTE' && (
                        <Boton
                          variante="secundario"
                          icono={RefreshCw}
                          disabled={marcandoGestion}
                          onClick={() => alIniciarGestion(consultaActiva)}
                          data-testid="consultas-mark-in-progress"
                        >
                          {marcandoGestion ? 'Actualizando...' : 'Marcar en gestión'}
                        </Boton>
                      )}
                    </div>
                  </div>

                  <div className={estilos.bloquePregunta}>
                    <span className={estilos.microEtiqueta}>Consulta recibida</span>
                    <p className={estilos.textoPregunta}>{consultaActiva.pregunta}</p>
                  </div>

                  {consultaActiva.respuestas && consultaActiva.respuestas.length > 0 && (
                    <div className={estilos.historialLista}>
                      <span className={estilos.microEtiqueta}>
                        Historial de respuestas ({consultaActiva.respuestas.length})
                      </span>
                      {consultaActiva.respuestas.map((resp) => (
                        <div key={resp.id} className={estilos.historialItem}>
                          <div className={estilos.historialCabecera}>
                            <span>
                              <strong>{resp.nombreTrabajador || resp.autorNombre || 'Coordinador'}</strong> ·{' '}
                              {formatearFechaExacta(resp.fechaRespuesta || resp.fechaEnvio)}
                            </span>
                            {(estadoActivo === 'ERROR_NOTIFICACION' || resp.notificacionExitosa === false) && (
                              <Boton
                                variante="secundario"
                                icono={RefreshCw}
                                disabled={reintentandoId === resp.id}
                                onClick={() => alReintentarNotificacion(consultaActiva, resp)}
                              >
                                {reintentandoId === resp.id ? 'Reintentando...' : 'Reintentar notificación'}
                              </Boton>
                            )}
                          </div>
                          <p className={estilos.historialTexto}>{resp.contenido || resp.texto}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form
                    className={estilos.redactorForm}
                    onSubmit={(e) => alEnviarRespuesta(e, consultaActiva)}
                  >
                    <div>
                      <span className={estilos.microEtiqueta}>Plantillas de respuesta rápida</span>
                      <div className={estilos.plantillasBarra}>
                        {PLANTILLAS_RESPUESTA.map((pl) => (
                          <button
                            key={pl.id}
                            type="button"
                            data-testid={`template-btn-${pl.id}`}
                            className={estilos.plantillaBtn}
                            onClick={() => aplicarPlantilla(consultaActiva.id, pl.texto)}
                          >
                            <Sparkles size={12} aria-hidden="true" />
                            <span>{pl.etiqueta}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="respuesta-consulta-texto" className={estilos.microEtiqueta}>
                        Mensaje de respuesta
                      </label>
                      <textarea
                        id="respuesta-consulta-texto"
                        data-testid="consultas-reply-textarea"
                        className={estilos.textareaRespuesta}
                        placeholder="Redacte la respuesta o seleccione una plantilla superior..."
                        value={borradorActivo}
                        onChange={(e) =>
                          setBorradoresRespuesta((prev) => ({
                            ...prev,
                            [consultaActiva.id]: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className={estilos.filaDestino}>
                      <div>
                        <Campo
                          etiqueta="Correo de destino"
                          nombre="correoDestino"
                          tipo="email"
                          compacto
                          value={correoActivo}
                          onChange={(e) =>
                            setCorreosDestino((prev) => ({
                              ...prev,
                              [consultaActiva.id]: e.target.value,
                            }))
                          }
                          placeholder="cliente@ejemplo.com"
                        />
                        <p className={estilos.confirmacionDestino}>
                          Se enviará copia oficial al correo: <strong>{correoActivo || 'sin definir'}</strong>
                        </p>
                      </div>

                      <Boton
                        type="submit"
                        variante="primario"
                        icono={Send}
                        disabled={enviando}
                        data-testid="consultas-send-btn"
                      >
                        {enviando ? 'Enviando...' : 'Enviar Respuesta al Cliente'}
                      </Boton>
                    </div>
                  </form>
                </div>
              ) : (
                <div className={estilos.panelDetalle}>
                  <p className={estilos.detalleVacio}>
                    Seleccione una consulta de la bandeja izquierda para revisar su detalle y responder.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Seccion>
  );
}
