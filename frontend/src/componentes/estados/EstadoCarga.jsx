import estilos from './Estados.module.css';

/**
 * Estado de carga elegante con esqueletos shimmer.
 *
 * Con `esqueleto` dibuja marcadores con la forma del contenido que llegara, lo
 * que evita el salto de maquetacion al recibir los datos. `role="status"`
 * anuncia el cambio a los lectores de pantalla.
 */
export default function EstadoCarga({ mensaje = 'Cargando informacion...', esqueleto = 0 }) {
  const cantidad = esqueleto > 0 ? esqueleto : 3;

  return (
    <div className={estilos.cargaContenedor} role="status" aria-live="polite">
      <span className="solo-lectores">{mensaje}</span>
      <div className={estilos.rejillaEsqueleto} aria-hidden="true">
        {Array.from({ length: cantidad }, (_, indice) => (
          <div key={indice} className={estilos.esqueletoCard}>
            <div className={estilos.esqueletoLineaCorta} />
            <div className={estilos.esqueletoLineaLarga} />
            <div className={estilos.esqueletoLineaMedia} />
          </div>
        ))}
      </div>
      <p className={estilos.textoCarga}>{mensaje}</p>
    </div>
  );
}
