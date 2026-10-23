import { useCallback } from 'react';

import { buscarProyectos, obtenerEquipo, obtenerEtapas } from '../../../api/proyectos.js';
import { usePeticion } from '../../../hooks/usePeticion.js';

/**
 * Etapas y equipo de un proyecto, como opciones para un formulario.
 *
 * Una actividad se registra sobre un proyecto, una etapa de ese proyecto y un
 * desarrollador de su equipo (HU-13 C01). El backend espera identificadores,
 * asi que la pantalla tiene que ofrecerlos: pedirlos escritos a mano obligaria
 * a conocerlos de memoria.
 *
 * Sin proyecto elegido no se consulta nada y las dos listas llegan vacias, de
 * modo que los desplegables dependientes quedan sin opciones hasta que haya un
 * proyecto.
 */
export function useContextoDeProyecto(proyectoId) {
  const cargarEtapas = useCallback(
    ({ senal }) => (proyectoId ? obtenerEtapas(proyectoId, { senal }) : Promise.resolve([])),
    [proyectoId],
  );
  const etapas = usePeticion(cargarEtapas, [proyectoId]);

  const cargarEquipo = useCallback(
    ({ senal }) => (proyectoId ? obtenerEquipo(proyectoId, { senal }) : Promise.resolve([])),
    [proyectoId],
  );
  const equipo = usePeticion(cargarEquipo, [proyectoId]);

  return {
    opcionesDeEtapa: (etapas.datos || []).map((etapa) => ({
      valor: String(etapa.id),
      texto: etapa.orden ? `${etapa.orden}. ${etapa.nombre}` : etapa.nombre,
    })),
    // El equipo son asignaciones: lo que identifica a la persona es
    // `trabajadorId`, no el id de la asignacion.
    opcionesDeDesarrollador: (equipo.datos || []).map((asignacion) => ({
      valor: String(asignacion.trabajadorId),
      texto: asignacion.trabajadorNombreCompleto,
    })),
    cargando: etapas.cargando || equipo.cargando,
    error: etapas.error || equipo.error,
  };
}

/**
 * Proyectos de la empresa como opciones de un desplegable.
 *
 * Se piden habilitados: una actividad nueva pertenece a un proyecto que se
 * sigue gestionando como activo. La busqueda, en cambio, recibe `estado` vacio
 * para poder encontrar tambien las actividades de proyectos ya inhabilitados,
 * cuyo historial se conserva (RN-02).
 */
export function useProyectosComoOpciones({ soloHabilitados = false } = {}) {
  const cargar = useCallback(
    ({ senal }) =>
      buscarProyectos(
        { estado: soloHabilitados ? 'HABILITADO' : '', tamano: 100 },
        { senal },
      ),
    [soloHabilitados],
  );
  const { datos, error, cargando } = usePeticion(cargar, [soloHabilitados]);

  return {
    opcionesDeProyecto: (datos?.contenido || []).map((proyecto) => ({
      valor: String(proyecto.id),
      texto: proyecto.nombre,
    })),
    cargando,
    error,
  };
}
