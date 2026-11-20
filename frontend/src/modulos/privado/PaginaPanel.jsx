import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart3,
  Bug,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  FileDown,
  FileText,
  FolderKanban,
  GraduationCap,
  Inbox,
  Library,
  Link2,
  Mail,
  MessagesSquare,
  Users,
} from 'lucide-react';

import { ETIQUETA_SERVICIO, ETIQUETA_TIPO } from '../../api/autenticacion.js';
import { obtenerAccesoCorreo } from '../../api/corporativo.js';
import { IconoChatVectorial } from '../../componentes/chat/DockChat.jsx';
import { usePeticion } from '../../hooks/usePeticion.js';
import { useSesion } from '../../sesion/contexto.js';
import PaginaMiDia from './PaginaMiDia.jsx';
import estilos from './PaginaPanel.module.css';

/**
 * Portada de la zona privada (HU-03 C02).
 *
 * Muestra quien esta dentro, su tipo de trabajador y los servicios internos que
 * el servidor enumera en la sesion. La lista de servicios NO esta escrita aqui:
 * se recorre `serviciosComunes` tal como llega, y cada clave conocida se dibuja
 * con su acceso. Si el servidor cambia la lista, esta pantalla la sigue.
 *
 * Las funciones de gestion se ofrecen segun el tipo de trabajador (HU-03 C02):
 * hoy solo existe la gestion de trabajadores, reservada al coordinador. Las
 * demas -proyectos, actividades, incidencias, reportes- llegan con sus modulos;
 * esta pagina no las anuncia como disponibles antes de tiempo.
 *
 * Encabeza la pagina el panel «Mi Dia» (RF-038), que el requerimiento pide "como
 * parte de su pantalla de inicio" (decision D-34): no es una ruta aparte. Se
 * muestra a los tipos que pueden tener actividades asignadas, el mismo criterio
 * con que se ofrecen «Mis actividades» e «Incidencias»; HU-16 C05 (RN-05)
 * incluye al lider al que asignaron como desarrollador en otro proyecto.
 */

/** Tipos que pueden tener actividades asignadas y por tanto panel del dia. */
const TIPOS_CON_PANEL_DEL_DIA = ['DESARROLLADOR', 'LIDER'];

/** Funciones de gestion por tipo de trabajador. */
const GESTION = [
  {
    tipos: ['COORDINADOR'],
    icono: Users,
    titulo: 'Trabajadores',
    detalle: 'Registrar perfiles, buscarlos, corregir sus datos e inhabilitarlos.',
    a: '/app/trabajadores',
  },
  {
    tipos: ['COORDINADOR'],
    icono: Link2,
    titulo: 'Asignaciones',
    detalle: 'Asignar trabajadores a proyectos y consultar en cual participa cada uno.',
    a: '/app/asignaciones',
  },
  {
    tipos: ['COORDINADOR'],
    icono: BarChart3,
    titulo: 'Desempeno',
    detalle: 'Actividades y ejecuciones de un desarrollador dentro de un proyecto.',
    a: '/app/reportes/desempeno',
  },
  {
    tipos: ['COORDINADOR'],
    icono: FileText,
    titulo: 'Contenido',
    detalle: 'Actualizar la informacion y contenidos de la pagina publica.',
    a: '/app/contenido',
  },
  {
    tipos: ['COORDINADOR'],
    icono: Inbox,
    titulo: 'Consultas',
    detalle: 'Atender y responder las consultas recibidas desde el portal.',
    a: '/app/consultas',
  },
  {
    tipos: ['LIDER'],
    icono: FolderKanban,
    titulo: 'Proyectos',
    detalle: 'Registrar proyectos, buscarlos, corregir su informacion e inhabilitarlos.',
    a: '/app/proyectos',
  },
  {
    tipos: ['LIDER'],
    icono: ClipboardList,
    titulo: 'Actividades',
    detalle: 'Planificar el trabajo de cada desarrollador, buscarlo y ajustarlo.',
    a: '/app/actividades',
  },
  {
    tipos: ['LIDER'],
    icono: BarChart3,
    titulo: 'Reportes',
    detalle: 'Actividades e interrupciones registradas de un proyecto.',
    a: '/app/reportes/proyecto',
  },
  {
    tipos: ['LIDER'],
    icono: FileDown,
    titulo: 'Archivo plano',
    detalle: 'Generar el reporte de proyectos para la empresa brasileña aliada.',
    a: '/app/reportes/archivo-plano',
  },
  {
    // HU-16 C05: tambien el lider, cuando lo asignan como desarrollador.
    tipos: ['DESARROLLADOR', 'LIDER'],
    icono: ClipboardCheck,
    titulo: 'Mis actividades',
    detalle: 'Consultar las actividades asignadas y registrar su ejecucion.',
    a: '/app/mis-actividades',
  },
  {
    tipos: ['DESARROLLADOR', 'LIDER'],
    icono: Bug,
    titulo: 'Incidencias',
    detalle: 'Registrar los errores y las interrupciones que afectan a un proyecto.',
    a: '/app/incidencias',
  },
];

/** Presentacion de cada servicio: icono, texto y a donde lleva. */
const SERVICIOS = {
  BIBLIOTECA_DE_PROGRAMAS: {
    icono: Library,
    detalle: 'Programas que maneja la empresa, con su enlace autorizado.',
    a: '/app/biblioteca',
  },
  TUTORIALES_DE_PROGRAMACION: {
    icono: GraduationCap,
    detalle: 'Tutoriales de programacion publicados para el equipo.',
    a: '/app/tutoriales',
  },
  CORREO_ELECTRONICO: {
    icono: Mail,
    detalle: 'Acceso al correo corporativo mediante el enlace autorizado.',
  },
  CHAT_CORPORATIVO: {
    icono: MessagesSquare,
    // Lo que existe son los hilos por proyecto y etapa (RF-037, HU-22). El chat
    // libre de RF-028 -conversaciones individuales, grupos, disponibilidad-
    // sigue sin definir (D-12), y el texto no promete mas de lo que hay.
    detalle:
      'Conversaciones vinculadas a sus proyectos y etapas, para seguir consultas y decisiones tecnicas.',
    a: '/app/chat',
  },
};

export default function PaginaPanel() {
  const { sesion, misProyectos } = useSesion();

  const cargarCorreo = useCallback(({ senal }) => obtenerAccesoCorreo({ senal }), []);
  const correo = usePeticion(cargarCorreo, []);

  const rolEfectivo = sesion.rolActivo || sesion.tipoTrabajador;
  const esCoordinador = sesion.tipoTrabajador === 'COORDINADOR' && (!sesion.rolActivo || sesion.rolActivo === 'COORDINADOR');
  const servicios = sesion.serviciosComunes || [];
  const gestion = GESTION.filter(
    ({ tipos }) =>
      tipos.includes(rolEfectivo) || (sesion.tipoTrabajador === 'COORDINADOR' && tipos.includes('COORDINADOR')),
  );
  const tieneProyectos = Array.isArray(misProyectos) && misProyectos.length > 0;

  return (
    <main className={estilos.contenedorPanel}>
      {!tieneProyectos && !esCoordinador && (
        <section className={estilos.bloqueSeccion} style={{ marginBottom: '1.5rem' }}>
          <div style={{
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            backgroundColor: 'var(--color-superficie, #f8fafc)',
            border: '1px solid var(--color-borde, #e2e8f0)',
            color: '#64748b',
            fontSize: '0.875rem'
          }}>
            <strong>Sin proyectos asignados:</strong> Actualmente no tiene asignaciones activas en ningún proyecto.
            Cuando un coordinador o líder le asigne a un proyecto, aparecerá en el selector superior con su rol correspondiente.
          </div>
        </section>
      )}

      {/* Panel del día para roles operativos */}
      {TIPOS_CON_PANEL_DEL_DIA.includes(rolEfectivo) && (
        <section style={{ marginBottom: '2rem' }}>
          <PaginaMiDia />
        </section>
      )}

      <header className={estilos.cabeceraWorkspace}>
        <div className={estilos.cabeceraTextos}>
          <span className={estilos.cabeceraEyebrow}>ESPACIO DE TRABAJO · IKERNELL</span>
          <h1 className={estilos.tituloPrincipal}>Espacio de Trabajo</h1>
          <p className={estilos.subtituloPrincipal}>
            Notificaciones, herramientas de gestión y servicios corporativos
          </p>
        </div>

        <div className={estilos.badgeOperativo}>
          <span className={estilos.lanzadorPingWrapper} aria-hidden="true">
            <span className={estilos.lanzadorPingOnda} />
            <span className={estilos.lanzadorPingCentro} />
          </span>
          <span>{ETIQUETA_TIPO[rolEfectivo] || rolEfectivo}</span>
        </div>
      </header>

      {/* 1. Notificaciones y Comunicación */}
      <section className={estilos.bloqueSeccion} aria-label="Notificaciones">
        <div className={estilos.seccionCabecera}>
          <div className={estilos.seccionTitulos}>
            <span className={estilos.seccionCategoria}>COMUNICACIÓN</span>
            <h2 className={estilos.seccionNombre}>Notificaciones y Comunicación</h2>
          </div>
          <span className={estilos.badgeContador}>{esCoordinador ? 2 : 1}</span>
        </div>

        <div className={esCoordinador ? estilos.bentoComunicacion : estilos.bentoComunicacionUnico}>
          <Link to="/app/chat" className={`${estilos.tarjetaBento} ${estilos.tarjetaBentoDestacada}`}>
            <div className={estilos.tarjetaBentoCabecera}>
              <div className={estilos.iconoBento}>
                <MessagesSquare size={22} strokeWidth={1.7} aria-hidden="true" />
              </div>
              <span className={estilos.lanzadorEstado}>
                <span className={estilos.lanzadorPingWrapper} aria-hidden="true">
                  <span className={estilos.lanzadorPingOnda} />
                  <span className={estilos.lanzadorPingCentro} />
                </span>
                Canal activo
              </span>
            </div>
            <h3 className={estilos.tituloTarjeta}>Conversaciones del Equipo</h3>
            <p className={estilos.detalleTarjeta}>
              Canales de discusión, consultas de etapas y mensajería en tiempo real de los proyectos.
            </p>
            <div className={estilos.tarjetaPie}>
              <span>Abrir conversaciones</span>
              <ArrowUpRight size={14} strokeWidth={1.8} className={estilos.tarjetaFlecha} aria-hidden="true" />
            </div>
          </Link>

          {esCoordinador && (
            <Link to="/app/consultas" className={estilos.tarjetaBento}>
              <div className={estilos.tarjetaBentoCabecera}>
                <div className={estilos.iconoBento}>
                  <Inbox size={22} strokeWidth={1.7} aria-hidden="true" />
                </div>
              </div>
              <h3 className={estilos.tituloTarjeta}>Consultas Recibidas</h3>
              <p className={estilos.detalleTarjeta}>
                Preguntas y mensajes ciudadanos recibidos a través del portal público pendientes de respuesta.
              </p>
              <div className={estilos.tarjetaPie}>
                <span>Atender portal</span>
                <ArrowUpRight size={14} strokeWidth={1.8} className={estilos.tarjetaFlecha} aria-hidden="true" />
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* 2. Herramientas de Gestión */}
      {gestion.length > 0 && (
        <section className={estilos.bloqueSeccion} aria-label="Gestión">
          <div className={estilos.seccionCabecera}>
            <div className={estilos.seccionTitulos}>
              <span className={estilos.seccionCategoria}>OPERACIÓN</span>
              <h2 className={estilos.seccionNombre}>Herramientas de Gestión</h2>
            </div>
            <span className={estilos.badgeContador}>{gestion.length}</span>
          </div>

          <div className={estilos.bentoGrid}>
            {gestion.map(({ a, icono: Icono, titulo, detalle }, indice) => (
              <Link
                key={a}
                to={a}
                className={`${estilos.tarjetaBento} ${
                  indice === 0 && gestion.length % 2 === 1 ? estilos.tarjetaBentoAncha : ''
                }`}
              >
                <div className={estilos.tarjetaBentoCabecera}>
                  <div className={estilos.iconoBento}>
                    <Icono size={22} strokeWidth={1.7} aria-hidden="true" />
                  </div>
                  <ArrowUpRight size={15} strokeWidth={1.75} className={estilos.tarjetaFlecha} aria-hidden="true" />
                </div>
                <h3 className={estilos.tituloTarjeta}>{titulo}</h3>
                <p className={estilos.detalleTarjeta}>{detalle}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. Servicios Internos */}
      <section className={estilos.bloqueSeccion} aria-label="Servicios Internos">
        <div className={estilos.seccionCabecera}>
          <div className={estilos.seccionTitulos}>
            <span className={estilos.seccionCategoria}>ECOSISTEMA</span>
            <h2 className={estilos.seccionNombre}>Servicios Internos</h2>
          </div>
          <span className={estilos.badgeContador}>{servicios.length}</span>
        </div>

        <div className={estilos.bentoGrid}>
          {servicios.map((clave) => (
            <TarjetaServicioUnificada
              key={clave}
              clave={clave}
              titulo={ETIQUETA_SERVICIO[clave] || clave}
              correo={correo}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

/**
 * Tarjeta unificada de servicio para la vista de Coordinador.
 */
function TarjetaServicioUnificada({ clave, titulo, correo }) {
  const { icono: Icono, detalle, a } = SERVICIOS[clave] || {};

  if (clave === 'CHAT_CORPORATIVO' && a) {
    return (
      <Link
        to={a}
        className={estilos.lanzadorChatServicio}
        data-testid="servicios-chat-launcher"
      >
        <div className={estilos.lanzadorChatCabecera}>
          <div className={estilos.lanzadorChatIcono}>
            <IconoChatVectorial size={24} />
          </div>
          <span className={estilos.lanzadorEstado}>
            <span className={estilos.lanzadorPingWrapper} aria-hidden="true">
              <span className={estilos.lanzadorPingOnda} />
              <span className={estilos.lanzadorPingCentro} />
            </span>
            Canal activo
          </span>
        </div>
        <h3 className={estilos.tituloTarjeta}>{titulo}</h3>
        <p className={estilos.detalleTarjeta}>{detalle}</p>
        <div className={estilos.lanzadorPie}>
          <span>Abrir canales</span>
          <ExternalLink size={13} strokeWidth={1.75} aria-hidden="true" />
        </div>
      </Link>
    );
  }

  if (a) {
    return (
      <Link to={a} className={estilos.tarjetaBento}>
        <div className={estilos.tarjetaBentoCabecera}>
          <div className={estilos.iconoBento}>
            {Icono && <Icono size={22} strokeWidth={1.7} aria-hidden="true" />}
          </div>
          <ArrowUpRight size={15} strokeWidth={1.75} className={estilos.tarjetaFlecha} aria-hidden="true" />
        </div>
        <h3 className={estilos.tituloTarjeta}>{titulo}</h3>
        <p className={estilos.detalleTarjeta}>{detalle}</p>
      </Link>
    );
  }

  if (clave === 'CORREO_ELECTRONICO') {
    const cargando = correo.cargando;
    const sinAcceso = correo.error || !correo.datos?.disponible;
    const mensajeTexto = sinAcceso
      ? correo.datos?.mensaje || correo.error?.message || 'No se puede acceder al correo corporativo por ahora.'
      : detalle;

    if (cargando || sinAcceso) {
      return (
        <div className={estilos.tarjetaBento}>
          <div className={estilos.tarjetaBentoCabecera}>
            <div className={estilos.iconoBento}>
              {Icono && <Icono size={22} strokeWidth={1.7} aria-hidden="true" />}
            </div>
          </div>
          <h3 className={estilos.tituloTarjeta}>{titulo}</h3>
          <p className={estilos.detalleTarjeta}>
            {cargando ? 'Comprobando el acceso al correo corporativo...' : mensajeTexto}
          </p>
        </div>
      );
    }

    return (
      <a
        href={correo.datos.url}
        target="_blank"
        rel="noreferrer noopener"
        className={estilos.tarjetaBento}
      >
        <div className={estilos.tarjetaBentoCabecera}>
          <div className={estilos.iconoBento}>
            {Icono && <Icono size={22} strokeWidth={1.7} aria-hidden="true" />}
          </div>
          <ExternalLink size={14} strokeWidth={1.75} className={estilos.tarjetaFlecha} aria-hidden="true" />
        </div>
        <h3 className={estilos.tituloTarjeta}>{titulo}</h3>
        <p className={estilos.detalleTarjeta}>{detalle}</p>
      </a>
    );
  }

  return (
    <div className={estilos.tarjetaBento}>
      <div className={estilos.tarjetaBentoCabecera}>
        <div className={estilos.iconoBento}>
          {Icono && <Icono size={22} strokeWidth={1.7} aria-hidden="true" />}
        </div>
      </div>
      <h3 className={estilos.tituloTarjeta}>{titulo}</h3>
      <p className={estilos.detalleTarjeta}>{detalle}</p>
    </div>
  );
}
