import estilos from './EtiquetaEstado.module.css';

const ETIQUETAS = {
  HABILITADO: 'Habilitado',
  INHABILITADO: 'Inhabilitado',
};

/**
 * Estado de habilitacion, en el sistema de diseno porque no es de un modulo:
 * trabajadores y proyectos comparten el mismo dominio cerrado, igual que en el
 * backend, donde EstadoHabilitacion vive en shared/domain.
 *
 * Lleva texto ademas del color. El estado es la diferencia entre algo que se
 * gestiona como activo y algo que no (RN-02, RN-03), y distinguirlo solo por el
 * color lo dejaria ilegible para quien no percibe ese contraste.
 */
export default function EtiquetaEstado({ estado }) {
  const clase = estado === 'INHABILITADO' ? estilos.inhabilitado : estilos.habilitado;

  return <span className={`${estilos.estado} ${clase}`}>{ETIQUETAS[estado] || estado}</span>;
}
