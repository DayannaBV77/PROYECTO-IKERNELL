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
 *
 * Con `opciones` renderiza un <select> en vez de un <input>, para que una lista
 * cerrada -los tipos de trabajador, un estado- no se escriba a mano y comparta
 * la etiqueta, el error y el cableado accesible con el resto de los campos.
 *
 * @param {Array}  [opciones]  [{ valor, texto }]
 * @param {string} [textoVacio] primera opcion sin valor; null la suprime
 */
export default function Campo({
  etiqueta,
  nombre,
  tipo = 'text',
  area = false,
  obligatorio = false,
  error,
  exito,
  validando,
  pista,
  opciones,
  textoVacio = 'Seleccione una opcion',
  ...resto
}) {
  const idGenerado = useId();
  const idControl = `${idGenerado}-${nombre}`;
  const idError = `${idControl}-error`;
  const idPista = `${idControl}-pista`;

  const mensaje = error || exito || (validando ? 'Validando...' : null);
  const tipoMensaje = error ? 'error' : exito ? 'exito' : validando ? 'validando' : null;
  const descritoPor = [error ? idError : null, pista ? idPista : null].filter(Boolean).join(' ');

  const Control = opciones ? 'select' : area ? 'textarea' : 'input';

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
        type={Control === 'input' ? tipo : undefined}
        className={`${estilos.control} ${area ? estilos.area : ''} ${
          opciones ? estilos.lista : ''
        } ${error ? estilos.conError : ''} ${exito ? estilos.conExito : ''}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={descritoPor || undefined}
        aria-required={obligatorio || undefined}
        {...resto}
      >
        {opciones && (
          <>
            {textoVacio !== null && <option value="">{textoVacio}</option>}
            {opciones.map(({ valor, texto }) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </>
        )}
      </Control>

      {mensaje && (
        <p className={tipoMensaje === 'error' ? estilos.error : tipoMensaje === 'exito' ? estilos.exito : estilos.validando} id={idError}>
          {tipoMensaje === 'error' && <TriangleAlert size={14} aria-hidden="true" />}
          {mensaje}
        </p>
      )}
    </div>
  );
}
