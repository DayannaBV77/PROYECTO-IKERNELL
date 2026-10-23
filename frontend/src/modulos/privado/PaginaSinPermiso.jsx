import { ShieldX } from 'lucide-react';

import Boton from '../../componentes/ui/Boton.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import { ETIQUETA_TIPO } from '../../api/autenticacion.js';
import { useSesion } from '../../sesion/contexto.js';
import estilos from './PaginaPanel.module.css';

/**
 * Pantalla para una funcion que no corresponde al tipo de trabajador.
 *
 * Corresponde al criterio C05 que repiten HU-07, HU-08, HU-12, HU-14, HU-15,
 * HU-17 y HU-18: la operacion se rechaza y se informa de la falta de
 * autorizacion. Aparece cuando se llega por la URL a una ruta que el menu no
 * ofrece; el servidor responderia 403 de todos modos.
 */
export default function PaginaSinPermiso() {
  const { sesion } = useSesion();

  return (
    <Seccion titulo="Sin autorizacion" id="sin-permiso">
      <div className={estilos.aviso} role="alert">
        <ShieldX size={28} className={estilos.avisoIcono} aria-hidden="true" />
        <div>
          <p className={estilos.avisoTitulo}>No tiene autorizacion para ver esta pantalla.</p>
          <p className={estilos.avisoDetalle}>
            {sesion
              ? `Su sesion corresponde a ${ETIQUETA_TIPO[sesion.tipoTrabajador] || sesion.tipoTrabajador}, y esta funcion pertenece a otro tipo de trabajador.`
              : 'Esta funcion pertenece a otro tipo de trabajador.'}
          </p>
          <div className={estilos.avisoAccion}>
            <Boton a="/app" variante="secundario">
              Volver al panel
            </Boton>
          </div>
        </div>
      </div>
    </Seccion>
  );
}
