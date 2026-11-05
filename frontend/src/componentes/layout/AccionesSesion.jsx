import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut } from 'lucide-react';

import { ETIQUETA_TIPO } from '../../api/autenticacion.js';
import Boton from '../ui/Boton.jsx';
import Confirmacion from '../ui/Confirmacion.jsx';
import { useNotificador } from '../ui/Notificador.jsx';
import { useSesion } from '../../sesion/contexto.js';
import estilos from './AccionesSesion.module.css';

/**
 * Zona derecha del encabezado.
 *
 * Con sesión ofrece identidad, enlace al panel y botón interactivo para cerrar
 * sesión con diálogo modal de confirmación y feedback animado.
 */
export default function AccionesSesion() {
  const { sesion, comprobando, salir } = useSesion();
  const [modalSalir, setModalSalir] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const notificador = useNotificador();
  const navegar = useNavigate();
  const ubicacion = useLocation();

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

  async function alConfirmarSalida() {
    setSaliendo(true);
    try {
      await salir();
      notificador.info('Ha cerrado su sesión de forma segura.', 'Sesión finalizada');
      setModalSalir(false);
      navegar('/');
    } catch {
      notificador.error('Ocurrió un inconveniente al cerrar la sesión.', 'Error');
    } finally {
      setSaliendo(false);
    }
  }

  const enZonaPrivada = ubicacion.pathname.startsWith('/app');

  return (
    <>
      <div className={estilos.sesion}>
        <span className={estilos.identidad}>
          <span className={estilos.nombre}>{sesion.nombreCompleto}</span>
          <span className={estilos.tipo}>
            {ETIQUETA_TIPO[sesion.tipoTrabajador] || sesion.tipoTrabajador}
          </span>
        </span>

        {!enZonaPrivada && (
          <Boton a="/app" variante="secundario" icono={LayoutDashboard}>
            Panel
          </Boton>
        )}

        <button
          type="button"
          className={estilos.botonSalir}
          onClick={() => setModalSalir(true)}
          title="Cerrar sesión"
        >
          <LogOut size={15} aria-hidden="true" />
          <span>Salir</span>
        </button>
      </div>

      <Confirmacion
        abierto={modalSalir}
        titulo="¿Desea cerrar la sesión?"
        textoConfirmar="Cerrar sesión"
        varianteConfirmar="peligro"
        ocupado={saliendo}
        alConfirmar={alConfirmarSalida}
        alCancelar={() => setModalSalir(false)}
      >
        <p style={{ margin: 0 }}>
          Está a punto de salir del espacio seguro de trabajo de <strong>{sesion.nombreCompleto}</strong>.
          Cualquier cambio sin guardar en formularios activos podría perderse.
        </p>
      </Confirmacion>
    </>
  );
}
