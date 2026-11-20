import { useId } from 'react';
import { CheckCheck, Info, LoaderCircle, TriangleAlert } from 'lucide-react';

import estilos from './Campo.module.css';

/**
 * Campo de formulario accesible con guia dinamica en tiempo real, chips de
 * atajo y soporte visual de estados de validacion.
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
  estadoValidacion,
  guiaDinamica,
  chipsSugeridos,
  alElegirChip,
  pista,
  opciones,
  textoVacio = 'Seleccione una opcion',
  compacto = false,
  className = '',
  accionEtiqueta,
  chipActivo,
  ...resto
}) {
  const idGenerado = useId();
  const idControl = `${idGenerado}-${nombre}`;
  const idError = `${idControl}-error`;
  const idPista = `${idControl}-pista`;

  const estadoResuelto =
    estadoValidacion ||
    (error ? 'invalido' : exito ? 'valido' : validando ? 'analizando' : 'inactivo');

  const guiaEvaluada =
    typeof guiaDinamica === 'function' ? guiaDinamica(resto.value ?? '') : guiaDinamica;
  const guiaObj =
    typeof guiaEvaluada === 'string'
      ? { tipo: 'guia', texto: guiaEvaluada }
      : guiaEvaluada;

  const mensaje =
    error ||
    exito ||
    (estadoResuelto === 'analizando' ? 'Comprobando disponibilidad...' : null);
  const tipoMensaje = error
    ? 'error'
    : exito
      ? 'exito'
      : estadoResuelto === 'analizando'
        ? 'validando'
        : null;
  const descritoPor = [error ? idError : null, pista ? idPista : null].filter(Boolean).join(' ');

  const Control = opciones ? 'select' : area ? 'textarea' : 'input';
  const mostrarIconoEstado =
    Control === 'input' && (estadoResuelto === 'analizando' || estadoResuelto === 'valido');

  function manejarChip(chip) {
    if (alElegirChip) {
      alElegirChip(chip);
      return;
    }
    if (resto.onChange) {
      resto.onChange({ target: { name: nombre, value: `${chip} ` } });
    }
  }

  return (
    <div className={estilos.campo}>
      <div className={estilos.cabeceraEtiqueta}>
        <label className={estilos.etiqueta} htmlFor={idControl}>
          {etiqueta}
          {obligatorio && (
            <span className={estilos.obligatorio} aria-hidden="true">
              *
            </span>
          )}
          {obligatorio && <span className="solo-lectores"> (obligatorio)</span>}
        </label>
        {accionEtiqueta}
      </div>

      {Array.isArray(chipsSugeridos) && chipsSugeridos.length > 0 && (
        <div className={estilos.chipsBarra} role="group" aria-label={`Atajos para ${etiqueta}`}>
          {chipsSugeridos.map((chip) => {
            const valorActual = String(resto.value ?? '').trim();
            const esActivo = chipActivo
              ? chipActivo === chip
              : valorActual.toLowerCase().startsWith(chip.toLowerCase());
            return (
              <button
                key={chip}
                type="button"
                className={`${estilos.chipAtajo} ${esActivo ? estilos.chipActivo : ''}`}
                onClick={() => manejarChip(chip)}
                aria-pressed={esActivo}
                data-testid={`chip-${nombre}-${chip.toLowerCase()}`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      )}

      {pista && (
        <p className={estilos.pista} id={idPista}>
          {pista}
        </p>
      )}

      <div className={estilos.controlWrapper}>
        <Control
          id={idControl}
          name={nombre}
          type={Control === 'input' ? tipo : undefined}
          className={`${estilos.control} ${area ? estilos.area : ''} ${
            opciones ? estilos.lista : ''
          } ${tipo === 'number' ? estilos.sinSpinner : ''} ${
            estadoResuelto === 'invalido' ? estilos.conError : ''
          } ${estadoResuelto === 'valido' ? estilos.conExito : ''} ${
            mostrarIconoEstado ? estilos.conIconoDerecho : ''
          } ${className}`}
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

        {mostrarIconoEstado && (
          <span className={estilos.iconoEstado} aria-hidden="true">
            {estadoResuelto === 'analizando' ? (
              <LoaderCircle size={15} className={estilos.girando} />
            ) : (
              <CheckCheck size={15} className={estilos.iconoValido} />
            )}
          </span>
        )}
      </div>

      {!compacto && (
        <div className={estilos.slotFeedback} aria-live="polite">
          {mensaje ? (
            <p
              className={
                tipoMensaje === 'error'
                  ? estilos.error
                  : tipoMensaje === 'exito'
                    ? estilos.exito
                    : estilos.validando
              }
              id={idError}
              data-testid={`field-message-${nombre}`}
            >
              {tipoMensaje === 'error' && <TriangleAlert size={14} aria-hidden="true" />}
              {tipoMensaje === 'exito' && <CheckCheck size={14} aria-hidden="true" />}
              <span>{mensaje}</span>
            </p>
          ) : guiaObj?.texto ? (
            <p
              className={
                guiaObj.tipo === 'exito'
                  ? estilos.guiaExito
                  : guiaObj.tipo === 'aviso'
                    ? estilos.guiaAviso
                    : estilos.guiaDinamica
              }
              data-testid={`live-guidance-${nombre}`}
            >
              {guiaObj.tipo === 'exito' ? (
                <CheckCheck size={13} aria-hidden="true" />
              ) : (
                <Info size={13} aria-hidden="true" />
              )}
              <span>{guiaObj.texto}</span>
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
