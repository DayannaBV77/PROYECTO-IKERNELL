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
    <div className={estilos.bloque}>
      <Icono size={28} className={estilos.icono} aria-hidden="true" />
      <p className={estilos.detalle}>{mensaje}</p>
      {children}
    </div>
  );
}
