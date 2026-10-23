import estilos from '../../../estilos/gestion.module.css';

/**
 * Lo que falta por definir para poder calcular indicadores.
 *
 * El servidor lo envia en la propia respuesta para explicar por que no hay
 * porcentajes ni promedios. Mostrarlo evita que quien lee el reporte crea que
 * faltan datos por un fallo, cuando lo que falta es una decision de la empresa.
 */
export default function DatosPendientes({ pendientes }) {
  if (!pendientes?.length) {
    return null;
  }

  return (
    <div className={estilos.pendientes}>
      <p className={estilos.rotulo}>Falta definir para poder calcular indicadores</p>
      <ul className={estilos.motivos}>
        {pendientes.map((pendiente) => (
          <li key={pendiente}>{pendiente}</li>
        ))}
      </ul>
    </div>
  );
}
