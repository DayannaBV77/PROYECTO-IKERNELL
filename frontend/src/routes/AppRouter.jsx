import { Route, Routes } from 'react-router-dom';

import LayoutPublico from '../componentes/layout/LayoutPublico.jsx';
import PaginaIngreso from '../modulos/acceso/PaginaIngreso.jsx';
import PaginaContacto from '../modulos/publico/PaginaContacto.jsx';
import PaginaInicio from '../modulos/publico/PaginaInicio.jsx';
import PaginaLineamientos from '../modulos/publico/PaginaLineamientos.jsx';
import PaginaNoEncontrada from '../modulos/publico/PaginaNoEncontrada.jsx';
import PaginaNoticias from '../modulos/publico/PaginaNoticias.jsx';
import PaginaPreguntas from '../modulos/publico/PaginaPreguntas.jsx';
import PaginaRecursos from '../modulos/publico/PaginaRecursos.jsx';
import PaginaServicios from '../modulos/publico/PaginaServicios.jsx';

/**
 * Rutas de la aplicacion.
 *
 * Solo existen las secciones que el backend publica realmente; no hay rutas
 * creadas para completar visualmente el menu.
 *
 * Las rutas privadas (/app/...) se incorporan en la etapa siguiente, junto con
 * el proveedor de sesion y las guardas por tipo de trabajador.
 */
export default function AppRouter() {
  return (
    <Routes>
      <Route element={<LayoutPublico />}>
        <Route index element={<PaginaInicio />} />
        <Route path="lineamientos" element={<PaginaLineamientos />} />
        <Route path="servicios" element={<PaginaServicios />} />
        <Route path="noticias" element={<PaginaNoticias />} />
        <Route path="preguntas-frecuentes" element={<PaginaPreguntas />} />
        <Route path="recursos" element={<PaginaRecursos />} />
        <Route path="contacto" element={<PaginaContacto />} />
        <Route path="ingresar" element={<PaginaIngreso />} />
        <Route path="*" element={<PaginaNoEncontrada />} />
      </Route>
    </Routes>
  );
}
