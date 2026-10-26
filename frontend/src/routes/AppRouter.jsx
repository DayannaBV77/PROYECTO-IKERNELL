import { Route, Routes } from 'react-router-dom';

import LayoutPrincipal from '../componentes/layout/LayoutPrincipal.jsx';
import PaginaIngreso from '../modulos/acceso/PaginaIngreso.jsx';
import PaginaBiblioteca from '../modulos/privado/PaginaBiblioteca.jsx';
import PaginaPanel from '../modulos/privado/PaginaPanel.jsx';
import PaginaRecursoInterno from '../modulos/privado/PaginaRecursoInterno.jsx';
import PaginaTutoriales from '../modulos/privado/PaginaTutoriales.jsx';
import PaginaActividades from '../modulos/actividades/PaginaActividades.jsx';
import PaginaDetalleActividad from '../modulos/actividades/PaginaDetalleActividad.jsx';
import PaginaMisActividades from '../modulos/actividades/PaginaMisActividades.jsx';
import PaginaRegistroActividad from '../modulos/actividades/PaginaRegistroActividad.jsx';
import PaginaAsignaciones from '../modulos/asignaciones/PaginaAsignaciones.jsx';
import PaginaChat from '../modulos/chat/PaginaChat.jsx';
import PaginaConsultas from '../modulos/contenido/PaginaConsultas.jsx';
import PaginaContenidoAdmin from '../modulos/contenido/PaginaContenidoAdmin.jsx';
import PaginaIncidencias from '../modulos/incidencias/PaginaIncidencias.jsx';
import PaginaArchivoPlano from '../modulos/reportes/PaginaArchivoPlano.jsx';
import PaginaReporteDesempeno from '../modulos/reportes/PaginaReporteDesempeno.jsx';
import PaginaReportesProyecto from '../modulos/reportes/PaginaReportesProyecto.jsx';
import PaginaDetalleProyecto from '../modulos/proyectos/PaginaDetalleProyecto.jsx';
import PaginaProyectos from '../modulos/proyectos/PaginaProyectos.jsx';
import PaginaRegistroProyecto from '../modulos/proyectos/PaginaRegistroProyecto.jsx';
import PaginaPerfilTrabajador from '../modulos/trabajadores/PaginaPerfilTrabajador.jsx';
import PaginaRegistroTrabajador from '../modulos/trabajadores/PaginaRegistroTrabajador.jsx';
import PaginaTrabajadores from '../modulos/trabajadores/PaginaTrabajadores.jsx';
import PaginaContacto from '../modulos/publico/PaginaContacto.jsx';
import PaginaInicio from '../modulos/publico/PaginaInicio.jsx';
import PaginaLineamientos from '../modulos/publico/PaginaLineamientos.jsx';
import PaginaNoEncontrada from '../modulos/publico/PaginaNoEncontrada.jsx';
import PaginaNoticias from '../modulos/publico/PaginaNoticias.jsx';
import PaginaPreguntas from '../modulos/publico/PaginaPreguntas.jsx';
import PaginaRecursos from '../modulos/publico/PaginaRecursos.jsx';
import PaginaServicios from '../modulos/publico/PaginaServicios.jsx';
import RutaProtegida from './RutaProtegida.jsx';

/**
 * Rutas de la aplicacion.
 *
 * Solo existen las secciones que el backend atiende realmente; no hay rutas
 * creadas para completar visualmente el menu.
 *
 * Las rutas privadas cuelgan de /app y pasan por RutaProtegida, que exige la
 * sesion. Panel, biblioteca y tutoriales las atiende el backend para cualquier
 * tipo de trabajador (HU-20, HU-21), asi que no declaran `tipos`. La gestion de
 * trabajadores y la de proyectos si: el backend reserva la primera al
 * coordinador y la segunda al lider, y declararlo aqui evita ofrecer una
 * pantalla que iba a responder 403. El servidor sigue siendo quien decide.
 *
 * Publico y privado comparten layout a proposito (ver LayoutPrincipal).
 */
export default function AppRouter() {
  return (
    <Routes>
      <Route element={<LayoutPrincipal />}>
        {/* Informacion empresarial publica (RF-026, RF-032..036, HU-01). */}
        <Route index element={<PaginaInicio />} />
        <Route path="lineamientos" element={<PaginaLineamientos />} />
        <Route path="servicios" element={<PaginaServicios />} />
        <Route path="noticias" element={<PaginaNoticias />} />
        <Route path="preguntas-frecuentes" element={<PaginaPreguntas />} />
        <Route path="recursos" element={<PaginaRecursos />} />
        <Route path="contacto" element={<PaginaContacto />} />
        <Route path="ingresar" element={<PaginaIngreso />} />

        {/* Zona privada: exige sesion iniciada (RF-027, HU-03 C02). */}
        <Route path="app" element={<RutaProtegida />}>
          <Route index element={<PaginaPanel />} />
          <Route path="biblioteca" element={<PaginaBiblioteca />} />
          <Route path="biblioteca/:id" element={<PaginaRecursoInterno tipo="PROGRAMA" />} />
          <Route path="tutoriales" element={<PaginaTutoriales />} />
          <Route path="tutoriales/:id" element={<PaginaRecursoInterno tipo="TUTORIAL" />} />

          {/* Gestion de trabajadores (RF-001..RF-007; HU-04, HU-05): solo el
              coordinador de proyectos. */}
          <Route element={<RutaProtegida tipos={['COORDINADOR']} />}>
            <Route path="trabajadores" element={<PaginaTrabajadores />} />
            <Route path="trabajadores/nuevo" element={<PaginaRegistroTrabajador />} />
            <Route path="trabajadores/:id" element={<PaginaPerfilTrabajador />} />

            {/* RF-003, HU-06: asignar trabajadores a proyectos. */}
            <Route path="asignaciones" element={<PaginaAsignaciones />} />

            {/* RF-006, HU-07: desempeno de un desarrollador. */}
            <Route path="reportes/desempeno" element={<PaginaReporteDesempeno />} />

            {/* RF-032..RF-036 y RF-035: administrar la pagina publica y las
                consultas recibidas. */}
            <Route path="contenido" element={<PaginaContenidoAdmin />} />
            <Route path="consultas" element={<PaginaConsultas />} />
          </Route>

          {/* Gestion de proyectos (RF-008, RF-013..RF-015; HU-08, HU-09): solo
              el lider de proyectos. */}
          <Route element={<RutaProtegida tipos={['LIDER']} />}>
            <Route path="proyectos" element={<PaginaProyectos />} />
            <Route path="proyectos/nuevo" element={<PaginaRegistroProyecto />} />
            <Route path="proyectos/:id" element={<PaginaDetalleProyecto />} />

            {/* Planificacion de actividades (RF-019..RF-021; HU-13). */}
            <Route path="actividades" element={<PaginaActividades />} />
            <Route path="actividades/nueva" element={<PaginaRegistroActividad />} />
            <Route path="actividades/:id" element={<PaginaDetalleActividad />} />

            {/* RF-017 y RF-018, HU-14 y HU-15: reportes del proyecto. */}
            <Route path="reportes/proyecto" element={<PaginaReportesProyecto />} />

            {/* RF-025, HU-19: archivo plano para la empresa brasileña. */}
            <Route path="reportes/archivo-plano" element={<PaginaArchivoPlano />} />
          </Route>

          {/* RF-022, HU-16: las actividades propias. Sin `tipos`, porque el
              backend tampoco restringe por tipo: quien tenga actividades
              asignadas las ve, incluido el lider asignado como desarrollador en
              otro proyecto (C05, RN-05). */}
          <Route path="mis-actividades" element={<PaginaMisActividades />} />

          {/* RF-023 y RF-024, HU-17 y HU-18: errores e interrupciones. Tampoco
              declara `tipos`: el servidor exige una asignacion activa como
              desarrollador en ESE proyecto, que es el nivel 2 y no el tipo
              global. */}
          <Route path="incidencias" element={<PaginaIncidencias />} />

          {/* RF-037, HU-22: conversaciones por proyecto y etapa. Sin `tipos`
              por la misma razon: el permiso es la asignacion en el proyecto,
              con cualquier rol, y lo comprueba el servidor. */}
          <Route path="chat" element={<PaginaChat />} />
        </Route>

        <Route path="*" element={<PaginaNoEncontrada />} />
      </Route>
    </Routes>
  );
}
