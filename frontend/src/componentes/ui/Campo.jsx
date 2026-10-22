import { useId } from 'react';
import { TriangleAlert } from 'lucide-react';

import estilos from './Campo.module.css';

/**
 * Campo de formulario accesible.
 *
 * Une etiqueta y control con `htmlFor`/`id`, marca lo obligatorio con texto
 * ademas del asterisco, y enlaza el mensaje de error con `aria-describedby`
 * para que un lector de pantalla lo anuncie al llegar al campo.
 *
 * El error que recibe procede de `ErrorRespuesta.campos`, es decir, del propio
 * servidor: la validacion que manda es la suya.
 */
export default function Campo({
  etiqueta,
  nombre,
  tipo = 'text',
  area = false,
  obligatorio = false,
  error,
  pista,
  ...resto
}) {
  const idGenerado = useId();
  const idControl = `${idGenerado}-${nombre}`;
  const idError = `${idControl}-error`;
  const idPista = `${idControl}-pista`;

  const descritoPor = [error ? idError : null, pista ? idPista : null].filter(Boolean).join(' ');

  const Control = area ? 'textarea' : 'input';

  return (
    <div className={estilos.campo}>
      <label className={estilos.etiqueta} htmlFor={idControl}>
        {etiqueta}
        {obligatorio && (
          <span className={estilos.obligatorio} aria-hidden="true">
            *
          </span>
        )}
        {obligatorio && <span className="solo-lectores"> (obligatorio)</span>}
      </label>

      {pista && (
        <p className={estilos.pista} id={idPista}>
          {pista}
        </p>
      )}

      <Control
        id={idControl}
        name={nombre}
        type={area ? undefined : tipo}
        className={`${estilos.control} ${area ? estilos.area : ''} ${error ? estilos.conError : ''}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={descritoPor || undefined}
        aria-required={obligatorio || undefined}
        {...resto}
      />

      {error && (
        <p className={estilos.error} id={idError}>
          <TriangleAlert size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
