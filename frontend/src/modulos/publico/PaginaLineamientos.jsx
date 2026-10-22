import { Rejilla } from '../../componentes/ui/Seccion.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import { TIPOS_CONTENIDO } from '../../api/contenidoPublico.js';
import { iconoParaTitulo } from '../../utilidades/iconos.js';
import SeccionContenido from './componentes/SeccionContenido.jsx';

/**
 * Lineamientos de la empresa (RF-032, HU-01 C02).
 *
 * El mockup presenta mision, vision y valores en tres tarjetas. El backend no
 * tiene esas tres categorias: ofrece la seccion LINEAMIENTO, y cada pieza
 * publicada se dibuja como una tarjeta. La estructura del mockup se conserva
 * cargando tres lineamientos, pero la pagina funciona con los que haya.
 */
export default function PaginaLineamientos() {
  return (
    <SeccionContenido
      tipo={TIPOS_CONTENIDO.LINEAMIENTO}
      titulo="Nuestros lineamientos"
      descripcion="Los principios que orientan el trabajo de IKernell Soluciones Software."
      id="lineamientos"
    >
      {(contenido) => (
        <Rejilla columnas={3}>
          {contenido.map((pieza) => (
            <Tarjeta
              key={pieza.id}
              icono={iconoParaTitulo(pieza.titulo)}
              titulo={pieza.titulo}
              centrada
            >
              {pieza.cuerpo}
            </Tarjeta>
          ))}
        </Rejilla>
      )}
    </SeccionContenido>
  );
}
