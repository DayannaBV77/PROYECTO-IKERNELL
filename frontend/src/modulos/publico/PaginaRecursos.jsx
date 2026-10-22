import { ExternalLink } from 'lucide-react';

import { TIPOS_CONTENIDO } from '../../api/contenidoPublico.js';
import SeccionContenido from './componentes/SeccionContenido.jsx';
import estilos from './componentes/Noticia.module.css';

/**
 * Recursos y enlaces de interes (RF-036, HU-01 C04).
 *
 * El menu de los mockups rotula esta entrada como "Recursos". Corresponde a los
 * enlaces de interes: la biblioteca de programas y los tutoriales son recursos
 * internos y exigen sesion iniciada (RF-029, RF-030, HU-21), de modo que no
 * pueden colgar del sitio publico.
 *
 * Cada enlace abre en una pestana nueva con rel="noreferrer noopener", y el
 * destino se anuncia en el texto accesible del enlace.
 */
export default function PaginaRecursos() {
  return (
    <SeccionContenido
      tipo={TIPOS_CONTENIDO.ENLACE_INTERES}
      titulo="Recursos y enlaces de interes"
      descripcion="Sitios externos que IKernell recomienda consultar."
      id="recursos"
      iconoVacio={ExternalLink}
      esqueleto={2}
    >
      {(enlaces) => (
        <div className={estilos.enlaces}>
          {enlaces.map((enlace) => (
            <a
              key={enlace.id}
              className={estilos.enlace}
              href={enlace.enlace}
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className={estilos.enlaceTexto}>
                {enlace.titulo}
                {enlace.cuerpo && <span className={estilos.enlaceDetalle}>{enlace.cuerpo}</span>}
              </span>
              <ExternalLink size={18} aria-hidden="true" />
              <span className="solo-lectores">(se abre en una pestana nueva)</span>
            </a>
          ))}
        </div>
      )}
    </SeccionContenido>
  );
}
