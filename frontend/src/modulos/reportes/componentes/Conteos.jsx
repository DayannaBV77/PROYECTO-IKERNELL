import estilos from '../../../estilos/gestion.module.css';

/** Nombres legibles de los conteos que devuelven los reportes. */
const NOMBRES = {
  actividadesRegistradas: 'Actividades registradas',
  actividadesConEjecucion: 'Con ejecucion registrada',
  actividadesSinEjecucion: 'Sin ejecucion registrada',
  ejecucionesRegistradas: 'Ejecuciones registradas',
  ejecucionesFinalizadas: 'Ejecuciones finalizadas',
  interrupcionesRegistradas: 'Interrupciones registradas',
};

/** Convierte `actividadesRegistradas` en `Actividades registradas`. */
function nombreDe(clave) {
  if (NOMBRES[clave]) {
    return NOMBRES[clave];
  }
  const separado = clave.replace(/([A-Z])/g, ' $1').toLowerCase();
  return separado.charAt(0).toUpperCase() + separado.slice(1);
}

/**
 * Conteos de un reporte.
 *
 * Se recorre el mapa tal como llega: si el servidor anade un conteo nuevo
 * aparece solo, en vez de quedar oculto por no estar en la tabla de nombres.
 * No se deriva ningun indicador de estos numeros -ni porcentajes ni promedios-
 * porque esas formulas no estan definidas (D-03, D-04).
 */
export default function Conteos({ conteos, titulo = 'Resumen' }) {
  const entradas = Object.entries(conteos || {});

  if (entradas.length === 0) {
    return null;
  }

  return (
    <>
      <p className={estilos.rotulo}>{titulo}</p>
      <ul className={estilos.conteos}>
        {entradas.map(([clave, valor]) => (
          <li key={clave} className={estilos.conteo}>
            <span className={estilos.conteoValor}>{String(valor)}</span>
            <span className={estilos.conteoNombre}>{nombreDe(clave)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
