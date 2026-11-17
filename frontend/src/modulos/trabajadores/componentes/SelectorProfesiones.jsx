import { PROFESIONES } from '../catalogoProfesiones.js';
import Campo from '../../../componentes/ui/Campo.jsx';

const OPCIONES_PROFESION = PROFESIONES.map((profesion) => ({
  valor: profesion,
  texto: profesion,
}));

/**
 * Selector de profesión de selección única simple (RF-001, RF-005).
 */
export default function SelectorProfesiones({
  value = '',
  onChange,
  error,
  obligatorio = false,
  nombre = 'profesion',
}) {
  function alCambiar(evento) {
    onChange?.(evento.target.value);
  }

  return (
    <Campo
      etiqueta="Profesión"
      nombre={nombre}
      opciones={OPCIONES_PROFESION}
      textoVacio="Seleccione una profesión"
      obligatorio={obligatorio}
      value={value || ''}
      onChange={alCambiar}
      error={error}
    />
  );
}
