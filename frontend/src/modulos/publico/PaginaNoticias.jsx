import { Newspaper } from 'lucide-react';

import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import { TIPOS_CONTENIDO } from '../../api/contenidoPublico.js';
import { formatearFecha } from '../../utilidades/formato.js';
import SeccionContenido from './componentes/SeccionContenido.jsx';
import estilos from './componentes/Noticia.module.css';

/**
 * Noticias relacionadas con software (RF-033, HU-01 C02).
 *
 * Solo aparece lo que la empresa publico: el endpoint publico no devuelve
 * borradores.
 */
export default function PaginaNoticias() {
  return (
    <SeccionContenido
      tipo={TIPOS_CONTENIDO.NOTICIA}
      titulo="Noticias"
      descripcion="Novedades relacionadas con software publicadas por IKernell."
      id="noticias"
      iconoVacio={Newspaper}
    >
      {(noticias) => (
        <div className={estilos.lista}>
          {noticias.map((noticia) => {
            const fecha = formatearFecha(noticia.fecha);
            return (
              <Tarjeta
                key={noticia.id}
                titulo={noticia.titulo}
                pie={
                  noticia.enlace ? (
                    <a href={noticia.enlace} target="_blank" rel="noreferrer noopener">
                      Leer la noticia completa
                    </a>
                  ) : null
                }
              >
                {fecha && (
                  <p className={estilos.fecha}>
                    <Newspaper size={13} aria-hidden="true" />
                    <time dateTime={noticia.fecha}>{fecha}</time>
                  </p>
                )}
                {noticia.cuerpo}
              </Tarjeta>
            );
          })}
        </div>
      )}
    </SeccionContenido>
  );
}
