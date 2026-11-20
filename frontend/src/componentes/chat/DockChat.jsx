import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import estilos from './DockChat.module.css';

/**
 * Icono vectorial sobrio de líneas refinadas para el lanzador del chat.
 */
export function IconoChatVectorial({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <line x1="8.5" y1="11.5" x2="15.5" y2="11.5" />
      <line x1="8.5" y1="14.5" x2="12.5" y2="14.5" />
    </svg>
  );
}

/**
 * Widget / Dock flotante acrílico no obstructivo para acceso rápido al Chat.
 *
 * Se expande dinámicamente al hacer hover o recibir foco de teclado, mostrando
 * un indicador de presencia CSS (status ping) y etiqueta tipográfica sobria.
 */
export default function DockChat() {
  return (
    <div className={estilos.dockContenedor}>
      <Link
        to="/app/chat"
        className={estilos.dockCapsula}
        aria-label="Abrir chat corporativo de proyectos"
        data-testid="dock-chat-launcher"
      >
        <span className={estilos.iconoContenedor}>
          <IconoChatVectorial size={20} />
          <span className={estilos.statusPingWrapper} aria-hidden="true">
            <span className={estilos.statusPingOnda} />
            <span className={estilos.statusPingCentro} />
          </span>
        </span>

        <span className={estilos.etiquetaExpansible}>
          <span className={estilos.etiquetaContenido}>
            <span className={estilos.etiquetaTitulo}>Chat de Proyectos</span>
            <span className={estilos.etiquetaSubtitulo}>Canal activo</span>
          </span>
          <ArrowUpRight size={15} strokeWidth={1.75} className={estilos.flecha} aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}
