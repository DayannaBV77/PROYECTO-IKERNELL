import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  FileDown,
  FileText,
  Bug,
  Link2,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  Library,
  Mail,
  MessagesSquare,
  Users,
} from 'lucide-react';

import { ETIQUETA_SERVICIO, ETIQUETA_TIPO } from '../../api/autenticacion.js';
import { obtenerAccesoCorreo } from '../../api/corporativo.js';
import Seccion, { Rejilla } from '../../componentes/ui/Seccion.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import { usePeticion } from '../../hooks/usePeticion.js';
import { iniciales } from '../../utilidades/formato.js';
import { useSesion } from '../../sesion/contexto.js';
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
 */

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
    titulo: 'Contenido y consultas',
    detalle: 'Actualizar la pagina publica y atender las consultas recibidas.',
    a: '/app/contenido',
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
  const { sesion } = useSesion();

  const cargarCorreo = useCallback(({ senal }) => obtenerAccesoCorreo({ senal }), []);
  const correo = usePeticion(cargarCorreo, []);

  const servicios = sesion.serviciosComunes || [];
  const gestion = GESTION.filter(({ tipos }) => tipos.includes(sesion.tipoTrabajador));

  return (
    <>
      <Seccion titulo="Mi sesion" id="panel">
        <div className={estilos.identidad}>
          <span className={estilos.iniciales} aria-hidden="true">
            {iniciales(sesion.nombreCompleto)}
          </span>
          <div>
            <p className={estilos.nombre}>{sesion.nombreCompleto}</p>
            <p className={estilos.detalle}>{sesion.correoCorporativo}</p>
            <span className={estilos.rol}>
              {ETIQUETA_TIPO[sesion.tipoTrabajador] || sesion.tipoTrabajador}
            </span>
          </div>
        </div>
      </Seccion>

      {gestion.length > 0 && (
        <Seccion
          titulo="Gestion"
          descripcion="Funciones que corresponden a su tipo de trabajador."
          id="gestion"
        >
          <Rejilla columnas={2}>
            {gestion.map(({ a, icono, titulo, detalle }) => (
              <Tarjeta key={a} como={Link} to={a} interactiva icono={icono} titulo={titulo}>
                {detalle}
              </Tarjeta>
            ))}
          </Rejilla>
        </Seccion>
      )}

      <Seccion
        titulo="Servicios internos"
        descripcion="Servicios disponibles para cualquier trabajador con la sesion iniciada."
        fondo="tenue"
        id="servicios-internos"
      >
        <Rejilla columnas={2}>
          {servicios.map((clave) => (
            <TarjetaServicio
              key={clave}
              clave={clave}
              titulo={ETIQUETA_SERVICIO[clave] || clave}
              correo={correo}
            />
          ))}
        </Rejilla>
      </Seccion>
    </>
  );
}

/**
 * Tarjeta de un servicio.
 *
 * Tres formas segun el servicio: una ruta interna, un enlace externo que
 * entrega el servidor (el correo, RF-031) o solo informacion cuando no hay a
 * donde ir.
 */
function TarjetaServicio({ clave, titulo, correo }) {
  const { icono, detalle, a } = SERVICIOS[clave] || {};

  if (a) {
    return (
      <Tarjeta como={Link} to={a} interactiva icono={icono} titulo={titulo} variante="tenue">
        {detalle}
      </Tarjeta>
    );
  }

  if (clave === 'CORREO_ELECTRONICO') {
    return <TarjetaCorreo icono={icono} titulo={titulo} detalle={detalle} correo={correo} />;
  }

  return (
    <Tarjeta icono={icono} titulo={titulo} variante="tenue">
      {detalle}
    </Tarjeta>
  );
}

/**
 * Correo corporativo (RF-031, HU-20 C04 y C05).
 *
 * El enlace lo decide el servidor. Cuando no esta configurado, responde
 * `disponible: false` con su propio aviso, y ese es el texto que se muestra:
 * el cliente no redacta uno alternativo ni deja la tarjeta en blanco.
 */
function TarjetaCorreo({ icono, titulo, detalle, correo }) {
  if (correo.cargando) {
    return (
      <Tarjeta icono={icono} titulo={titulo} variante="tenue">
        Comprobando el acceso al correo corporativo...
      </Tarjeta>
    );
  }

  if (correo.error || !correo.datos?.disponible) {
    return (
      <Tarjeta icono={icono} titulo={titulo} variante="tenue">
        {correo.datos?.mensaje || correo.error?.message || detalle}
      </Tarjeta>
    );
  }

  return (
    <Tarjeta
      como="a"
      href={correo.datos.url}
      target="_blank"
      rel="noreferrer noopener"
      interactiva
      icono={icono}
      titulo={titulo}
      variante="tenue"
      pie={
        <span className={estilos.externo}>
          Abrir el correo
          <ExternalLink size={14} aria-hidden="true" />
          <span className="solo-lectores">(se abre en una pestana nueva)</span>
        </span>
      }
    >
      {detalle}
    </Tarjeta>
  );
}
