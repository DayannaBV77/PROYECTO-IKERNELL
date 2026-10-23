import { GraduationCap } from 'lucide-react';

import { obtenerTutoriales } from '../../api/corporativo.js';
import ListaRecursos from './componentes/ListaRecursos.jsx';

/** Tutoriales de programacion (RF-030, HU-21 C03, C04 y C05). */
export default function PaginaTutoriales() {
  return (
    <ListaRecursos
      titulo="Tutoriales de programacion"
      descripcion="Material de consulta publicado por la empresa para el equipo."
      etiquetaBusqueda="Buscar entre los tutoriales"
      obtener={obtenerTutoriales}
      rutaBase="/app/tutoriales"
      iconoVacio={GraduationCap}
      id="tutoriales"
    />
  );
}
