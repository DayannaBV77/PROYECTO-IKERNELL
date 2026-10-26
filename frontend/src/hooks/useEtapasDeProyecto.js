import { useCallback } from 'react';

import { obtenerEtapas } from '../api/proyectos.js';
import { usePeticion } from './usePeticion.js';

/**
 * Etapas de un proyecto como opciones de un desplegable.
 *
 * Lo usan las dos pantallas que piden una etapa dependiente del proyecto
 * elegido: el registro de actividades (HU-13 C01) y el de incidencias, que
 * desde D-36 indica la etapa en lugar de una fase de catalogo (RF-023, RF-024).
 *
 * Sin proyecto elegido no se consulta nada y la lista llega vacia, de modo que
 * el desplegable dependiente queda sin opciones hasta que haya un proyecto.
 *
 * El servidor admite esta consulta al lider del proyecto y a quien participe en
 * el con cualquier rol; a un trabajador ajeno le responde 403, y entonces
 * `error` trae ese fallo.
 */
export function useEtapasDeProyecto(proyectoId) {
  const cargar = useCallback(
    ({ senal }) => (proyectoId ? obtenerEtapas(proyectoId, { senal }) : Promise.resolve([])),
    [proyectoId],
  );
  const { datos, error, cargando } = usePeticion(cargar, [proyectoId]);

  return {
    opcionesDeEtapa: (datos || []).map((etapa) => ({
      valor: String(etapa.id),
      texto: etapa.orden ? `${etapa.orden}. ${etapa.nombre}` : etapa.nombre,
    })),
    cargando,
    error,
  };
}
