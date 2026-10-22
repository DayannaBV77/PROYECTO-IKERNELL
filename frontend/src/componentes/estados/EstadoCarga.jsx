import { LoaderCircle } from 'lucide-react';

import estilos from './Estados.module.css';

/**
 * Estado de carga.
 *
 * Con `esqueleto` dibuja marcadores con la forma del contenido que llegara, lo
 * que evita el salto de maquetacion al recibir los datos. `role="status"`
 * anuncia el cambio a los lectores de pantalla.
 */
export default function EstadoCarga({ mensaje = 'Cargando informacion...', esqueleto = 0 }) {
  if (esqueleto > 0) {
    return (
      <div role="status" aria-live="polite">
        <span className="solo-lectores">{mensaje}</span>
        <div className={estilos.rejillaEsqueleto} aria-hidden="true">
          {Array.from({ length: esqueleto }, (_, indice) => (
            <div key={indice} className={estilos.esqueleto} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={estilos.bloque} role="status" aria-live="polite">
      <LoaderCircle size={28} className={`${estilos.icono} ${estilos.girando}`} aria-hidden="true" />
      <p className={estilos.detalle}>{mensaje}</p>
    </div>
  );
}
