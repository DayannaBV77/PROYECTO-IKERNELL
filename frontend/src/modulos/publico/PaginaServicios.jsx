import { Rejilla } from '../../componentes/ui/Seccion.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import { TIPOS_CONTENIDO } from '../../api/contenidoPublico.js';
import { iconoParaTitulo } from '../../utilidades/iconos.js';
import SeccionContenido from './componentes/SeccionContenido.jsx';

/** Portafolio de servicios (RF-032, HU-01 C02). */
export default function PaginaServicios() {
  return (
    <SeccionContenido
      tipo={TIPOS_CONTENIDO.PORTAFOLIO_SERVICIO}
      titulo="Portafolio de servicios corporativos"
      descripcion="Servicios que IKernell presta a las organizaciones que confian en su equipo."
      fondo="tenue"
      id="servicios"
      esqueleto={4}
    >
      {(contenido) => (
        <Rejilla columnas={3}>
          {contenido.map((servicio) => (
            <Tarjeta
              key={servicio.id}
              icono={iconoParaTitulo(servicio.titulo)}
              titulo={servicio.titulo}
              variante="tenue"
              centrada
            >
              {servicio.cuerpo}
            </Tarjeta>
          ))}
        </Rejilla>
      )}
    </SeccionContenido>
  );
}
