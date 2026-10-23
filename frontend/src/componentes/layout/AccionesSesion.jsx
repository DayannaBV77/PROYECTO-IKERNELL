import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut } from 'lucide-react';

import { ETIQUETA_TIPO } from '../../api/autenticacion.js';
import Boton from '../ui/Boton.jsx';
import { useSesion } from '../../sesion/contexto.js';
import estilos from './AccionesSesion.module.css';

/**
 * Zona derecha del encabezado.
 *
 * Sin sesion ofrece el acceso; con sesion identifica a quien esta dentro, con
 * su tipo de trabajador, y permite salir.
 *
 * Mientras la sesion se comprueba no muestra ninguna de las dos cosas: ofrecer
 * "Iniciar sesion" a quien ya la tiene abierta y cambiarlo un instante despues
 * es peor que reservar el hueco y esperar.
 */
export default function AccionesSesion() {
  const { sesion, comprobando, salir } = useSesion();
  const navegar = useNavigate();

  if (comprobando) {
    return <span className={estilos.reserva} aria-hidden="true" />;
  }

  if (!sesion) {
    return (
      <Boton a="/ingresar" variante="primario">
        Iniciar sesion
      </Boton>
    );
  }

  async function alSalir() {
    await salir();
    // Las rutas privadas quedan inaccesibles al perder la sesion; se vuelve al
    // sitio publico en lugar de dejar la guarda redirigiendo.
    navegar('/');
  }

  return (
    <div className={estilos.sesion}>
      <span className={estilos.identidad}>
        <span className={estilos.nombre}>{sesion.nombreCompleto}</span>
        <span className={estilos.tipo}>
          {ETIQUETA_TIPO[sesion.tipoTrabajador] || sesion.tipoTrabajador}
        </span>
      </span>

      <Boton a="/app" variante="secundario" icono={LayoutDashboard}>
        Panel
      </Boton>

      <Boton variante="texto" icono={LogOut} onClick={alSalir}>
        Salir
      </Boton>
    </div>
  );
}
