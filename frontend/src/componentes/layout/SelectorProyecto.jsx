import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, FolderKanban } from 'lucide-react';

import { useNotificador } from '../ui/Notificador.jsx';
import { useSesion } from '../../sesion/contexto.js';
import estilos from './SelectorProyecto.module.css';

const ETIQUETA_ROL = {
  COORDINADOR: 'Coordinador',
  LIDER: 'Líder',
  DESARROLLADOR: 'Desarrollador',
};

/**
 * Selector de proyecto y rol activo para el trabajador autenticado.
 *
 * Permite cambiar de contexto de trabajo de forma dinámica entre los proyectos
 * y roles a los que el trabajador está asignado.
 */
export default function SelectorProyecto() {
  const { sesion, misProyectos, cambiarProyecto } = useSesion();
  const [desplegado, setDesplegado] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const contenedorRef = useRef(null);
  const notificador = useNotificador();

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    function clickFuera(evento) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setDesplegado(false);
      }
    }
    if (desplegado) {
      document.addEventListener('mousedown', clickFuera);
    }
    return () => document.removeEventListener('mousedown', clickFuera);
  }, [desplegado]);

  if (!sesion) {
    return null;
  }

  // Generar opciones: cada par (proyecto, rol)
  const opciones = [];
  if (Array.isArray(misProyectos)) {
    misProyectos.forEach((proyecto) => {
      const roles = proyecto.roles || [];
      roles.forEach((rol) => {
        opciones.push({
          proyectoId: proyecto.proyectoId,
          proyectoNombre: proyecto.proyectoNombre,
          rol,
          esActivo:
            sesion.proyectoActivoId === proyecto.proyectoId &&
            sesion.rolActivo === rol,
        });
      });
    });
  }

  const tieneProyectos = opciones.length > 0;
  const nombreActivo = sesion.proyectoActivoNombre || (tieneProyectos ? 'Seleccionar proyecto' : 'Sin asignaciones');
  const rolActivoTexto = sesion.rolActivo
    ? ETIQUETA_ROL[sesion.rolActivo] || sesion.rolActivo
    : sesion.tipoTrabajador === 'COORDINADOR'
      ? 'Coordinador'
      : 'Sin rol activo';

  async function seleccionarOpcion(opcion) {
    if (opcion.esActivo) {
      setDesplegado(false);
      return;
    }
    setCambiando(true);
    try {
      await cambiarProyecto({ proyectoId: opcion.proyectoId, rol: opcion.rol });
      notificador.exito(
        `Ha cambiado a ${opcion.proyectoNombre} con el rol de ${ETIQUETA_ROL[opcion.rol] || opcion.rol}.`,
        'Contexto actualizado',
      );
      setDesplegado(false);
    } catch (error) {
      notificador.error(error.message || 'No se pudo cambiar el contexto del proyecto.', 'Error');
    } finally {
      setCambiando(false);
    }
  }

  return (
    <div className={estilos.contenedor} ref={contenedorRef}>
      <button
        type="button"
        className={estilos.botonSelector}
        onClick={() => setDesplegado((prev) => !prev)}
        disabled={cambiando || !tieneProyectos}
        title="Cambiar proyecto y rol de trabajo"
        aria-haspopup="true"
        aria-expanded={desplegado}
      >
        <FolderKanban size={16} className={estilos.iconoCarpeta} aria-hidden="true" />
        <span className={estilos.textoProyecto}>
          <span className={estilos.nombreProyecto}>{nombreActivo}</span>
          <span className={estilos.etiquetaRol}>{rolActivoTexto}</span>
        </span>
        {tieneProyectos && <ChevronDown size={14} className={estilos.iconoChevron} aria-hidden="true" />}
      </button>

      {desplegado && tieneProyectos && (
        <div className={estilos.menuDesplegable} role="menu">
          <div className={estilos.encabezadoMenu}>Proyectos y Roles Asignados</div>
          <ul className={estilos.listaOpciones}>
            {opciones.map((opc) => (
              <li key={`${opc.proyectoId}-${opc.rol}`}>
                <button
                  type="button"
                  className={`${estilos.opcion} ${opc.esActivo ? estilos.opcionActiva : ''}`}
                  onClick={() => seleccionarOpcion(opc)}
                >
                  <div className={estilos.opcionContenido}>
                    <span className={estilos.opcionNombre}>{opc.proyectoNombre}</span>
                    <span className={estilos.opcionDetalle}>
                      Rol: {ETIQUETA_ROL[opc.rol] || opc.rol}
                    </span>
                  </div>
                  {opc.esActivo && <Check size={16} color="#2563eb" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
