import { Library } from 'lucide-react';

import { obtenerProgramas } from '../../api/corporativo.js';
import ListaRecursos from './componentes/ListaRecursos.jsx';

/**
 * Biblioteca de programas (RF-029, HU-21 C01, C04 y C05).
 *
 * Disponible para los tres tipos de trabajador: el backend solo exige la sesion
 * iniciada, de modo que no lleva restriccion por tipo.
 */
export default function PaginaBiblioteca() {
  return (
    <ListaRecursos
      titulo="Biblioteca de programas"
      descripcion="Programas que maneja la empresa, con su categoria y version."
      etiquetaBusqueda="Buscar en la biblioteca"
      obtener={obtenerProgramas}
      rutaBase="/app/biblioteca"
      iconoVacio={Library}
      id="biblioteca"
    />
  );
}
