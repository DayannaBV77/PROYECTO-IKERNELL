import { useEffect, useId, useRef } from 'react';

import estilos from './Dialogo.module.css';

/**
 * Dialogo modal reutilizable.
 *
 * Usa el <dialog> nativo por las mismas razones que Confirmacion: trae el foco
 * atrapado, el cierre con Escape y el aislamiento del resto de la pagina sin
 * reimplementarlos. La diferencia es que este no impone acciones: el contenido
 * y sus botones los pone quien lo abre, de modo que sirve para formularios
 * completos como el registro de una interrupcion (RF-038, RF-024).
 *
 * @param {boolean}  abierto
 * @param {string}   titulo
 * @param {string}   [descripcion]
 * @param {Function} [alCerrar]  se invoca con Escape, con el boton de cerrar o
 *                               al hacer clic fuera del contenido
 */
export default function Dialogo({ abierto, titulo, descripcion, alCerrar, children }) {
  const dialogo = useRef(null);
  const idTitulo = useId();
  const idDescripcion = useId();

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) {
      return;
    }
    if (abierto && !elemento.open) {
      elemento.showModal();
    } else if (!abierto && elemento.open) {
      elemento.close();
    }
  }, [abierto]);

  return (
    <dialog
      ref={dialogo}
      className={estilos.dialogo}
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDescripcion : undefined}
      onCancel={(evento) => {
        evento.preventDefault();
        if (alCerrar) {
          alCerrar();
        }
      }}
      onClose={() => {
        // Mantiene sincronizado el estado de quien lo abrio si el navegador
        // cierra el dialogo por su cuenta.
        if (abierto && alCerrar) {
          alCerrar();
        }
      }}
      onClick={(evento) => {
        // El clic en el backdrop tiene como objetivo el propio <dialog>.
        if (evento.target === dialogo.current && alCerrar) {
          alCerrar();
        }
      }}
    >
      <div className={estilos.contenido}>
        <div className={estilos.cabecera}>
          <div>
            <h2 className={estilos.titulo} id={idTitulo}>
              {titulo}
            </h2>
            {descripcion && (
              <p className={estilos.descripcion} id={idDescripcion}>
                {descripcion}
              </p>
            )}
          </div>
          {alCerrar && (
            <button
              type="button"
              className={estilos.cerrar}
              onClick={alCerrar}
              aria-label="Cerrar el dialogo"
            >
              ×
            </button>
          )}
        </div>

        {children}
      </div>
    </dialog>
  );
}
