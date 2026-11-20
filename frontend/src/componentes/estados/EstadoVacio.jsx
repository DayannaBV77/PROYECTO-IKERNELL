import { Inbox } from 'lucide-react';

import estilos from './Estados.module.css';

/**
 * Ausencia de contenido o de resultados.
 *
 * El backend no devuelve listas vacias a secas: cuando no hay nada que mostrar
 * manda el aviso en `mensaje` (RN-14). Ese texto es el que se pinta aqui, en
 * lugar de uno redactado en el cliente.
 */
export default function EstadoVacio({ mensaje, icono: Icono = Inbox, children }) {
  return (
    <div className={estilos.bloqueVacio}>
      <div className={estilos.iconoAnillo} aria-hidden="true">
        <Icono size={24} strokeWidth={1.6} className={estilos.icono} />
      </div>
      <p className={estilos.detalle}>{mensaje}</p>
      {children && <div className={estilos.accion}>{children}</div>}
    </div>
  );
}
