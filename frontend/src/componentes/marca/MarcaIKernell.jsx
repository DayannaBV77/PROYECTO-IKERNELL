import { Link } from 'react-router-dom';

import estilos from './MarcaIKernell.module.css';

/**
 * Marca de IKernell en el encabezado.
 *
 * PENDIENTE: el logotipo oficial todavia no esta en el repositorio. Mientras
 * llega se muestra una marca tipografica provisional que ocupa exactamente el
 * mismo espacio.
 *
 * Para sustituirla cuando el archivo exista: dejarlo en `public/logotipo.svg` y
 * cambiar RUTA_LOGOTIPO por '/logotipo.svg'. No hace falta tocar nada mas: el
 * encabezado no cambia de altura ni de alineacion.
 *
 * `compacta` oculta el nombre y deja solo la sigla en resoluciones en las que el
 * menu de la zona privada necesita todo el ancho disponible.
 */
const RUTA_LOGOTIPO = null;

export default function MarcaIKernell({ a = '/', compacta = false }) {
  return (
    <Link
      to={a}
      className={`${estilos.marca} ${compacta ? estilos.compacta : ''}`}
      aria-label="IKernell Soluciones Software, ir al inicio"
    >
      {RUTA_LOGOTIPO ? (
        <img src={RUTA_LOGOTIPO} alt="IKernell Soluciones Software" className={estilos.logotipo} />
      ) : (
        <span className={estilos.provisional} aria-hidden="true">
          <span className={estilos.sigla}>
            <span>i</span>K
          </span>
          <span className={estilos.nombre}>IKernell</span>
        </span>
      )}
    </Link>
  );
}
