import { useEffect, useId, useRef } from 'react';

import Boton from './Boton.jsx';
import estilos from './Confirmacion.module.css';

/**
 * Dialogo de confirmacion para una accion que no se deshace.
 *
 * Varios criterios exigen un paso de confirmacion explicito antes de cambiar el
 * estado de algo: HU-05 C05 al inhabilitar un trabajador, y el mismo patron
 * aparece en HU-06 C04 y HU-09 C05.
 *
 * Usa el <dialog> nativo en lugar de un div superpuesto: trae el foco atrapado,
 * el cierre con Escape y el aislamiento del resto de la pagina sin tener que
 * reimplementarlos, que es donde estos dialogos suelen fallar en accesibilidad.
 */
export default function Confirmacion({
  abierto,
  titulo,
  children,
  textoConfirmar = 'Confirmar',
  varianteConfirmar = 'peligro',
  ocupado = false,
  alConfirmar,
  alCancelar,
}) {
  const dialogo = useRef(null);
  const idTitulo = useId();

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
      // Escape dispara `cancel`; se trata como cancelar y no como cerrar a secas
      // para que el estado de quien lo abrio quede sincronizado.
      onCancel={(evento) => {
        evento.preventDefault();
        if (!ocupado) {
          alCancelar();
        }
      }}
      aria-labelledby={idTitulo}
    >
      <h2 className={estilos.titulo} id={idTitulo}>
        {titulo}
      </h2>

      <div className={estilos.cuerpo}>{children}</div>

      <div className={estilos.acciones}>
        <Boton variante="secundario" onClick={alCancelar} disabled={ocupado}>
          Cancelar
        </Boton>
        <Boton variante={varianteConfirmar} onClick={alConfirmar} disabled={ocupado}>
          {ocupado ? 'Procesando...' : textoConfirmar}
        </Boton>
      </div>
    </dialog>
  );
}
