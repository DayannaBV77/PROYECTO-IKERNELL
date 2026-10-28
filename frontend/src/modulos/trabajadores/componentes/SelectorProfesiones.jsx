import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';

import { listarProfesiones, PROFESIONES, serializarProfesiones } from '../catalogoProfesiones.js';
import estilos from './SelectorEspecialidades.module.css';

const OTRO = 'Otra profesión';

function obtenerValorPersonalizado(texto) {
  const entrada = String(texto ?? '').trim();
  const prefijo = `${OTRO}: `;
  if (entrada.startsWith(prefijo)) {
    return entrada.slice(prefijo.length).trim();
  }
  return '';
}

export default function SelectorProfesiones({ value = '', onChange, error, obligatorio = false }) {
  const seleccionadas = listarProfesiones(value);
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [personalizado, setPersonalizado] = useState(
    () => obtenerValorPersonalizado(seleccionadas.find((item) => item.startsWith(OTRO)) ?? ''),
  );

  const opcionesVisibles = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase();
    if (!termino) {
      return PROFESIONES;
    }

    return PROFESIONES.filter((nombre) => nombre.toLocaleLowerCase().includes(termino));
  }, [busqueda]);

  function actualizarSeleccion(nombre, marcado) {
    let siguiente = [...seleccionadas];

    if (marcado) {
      siguiente = [...new Set([...siguiente, nombre])];
    } else {
      siguiente = siguiente.filter((valor) => valor !== nombre && !valor.startsWith(`${OTRO}:`));
      if (nombre === OTRO) {
        setPersonalizado('');
      }
    }

    if (nombre === OTRO && marcado) {
      const valorTexto = personalizado.trim();
      const item = valorTexto ? `${OTRO}: ${valorTexto}` : OTRO;
      siguiente = [...new Set([...siguiente.filter((valor) => valor !== OTRO), item])];
    }

    onChange?.(serializarProfesiones(siguiente));
  }

  function onChangePersonalizado(evento) {
    const siguiente = evento.target.value.trimStart();
    setPersonalizado(siguiente);

    const base = seleccionadas.filter((valor) => valor !== OTRO && !valor.startsWith(`${OTRO}:`));
    const valorSalida = siguiente.trim();
    if (!valorSalida) {
      onChange?.(serializarProfesiones(base));
      return;
    }

    const siguienteLista = [...new Set([...base, `${OTRO}: ${valorSalida}`])];
    onChange?.(serializarProfesiones(siguienteLista));
  }

  function quitar(item) {
    const base = seleccionadas.filter((valor) => valor !== item && !(valor === OTRO && item === OTRO));
    if (item.startsWith(`${OTRO}:`)) {
      setPersonalizado('');
      onChange?.(serializarProfesiones(base));
      return;
    }

    onChange?.(serializarProfesiones(base));
  }

  const tienePersonalizada = seleccionadas.some((item) => item.startsWith(`${OTRO}:`));
  const valorActualPersonalizado = tienePersonalizada
    ? obtenerValorPersonalizado(seleccionadas.find((item) => item.startsWith(`${OTRO}:`)))
    : personalizado;

  return (
    <div className={`${estilos.selector} ${error ? estilos.conError : ''}`}>
      <label className={estilos.etiqueta} htmlFor="profesiones-trabajador">
        Profesión
        {obligatorio && (
          <span className={estilos.obligatorio} aria-hidden="true">
            *
          </span>
        )}
        {obligatorio && <span className="solo-lectores"> (obligatorio)</span>}
      </label>

      <div
        id="profesiones-trabajador"
        className={`${estilos.campo} ${abierto ? estilos.abierto : ''} ${error ? estilos.conError : ''}`}
        role="button"
        aria-expanded={abierto}
        aria-haspopup="listbox"
        aria-invalid={error ? 'true' : undefined}
        aria-required={obligatorio || undefined}
        tabIndex={0}
        onClick={() => setAbierto((valor) => !valor)}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter' || evento.key === ' ') {
            evento.preventDefault();
            setAbierto((valor) => !valor);
          }
        }}
      >
        <div className={estilos.chips}>
          {seleccionadas.length ? (
            seleccionadas.map((nombre) => (
              <span key={nombre} className={estilos.chip}>
                {nombre}
                <button
                  type="button"
                  className={estilos.quitarChip}
                  aria-label={`Retirar ${nombre}`}
                  onClick={(evento) => {
                    evento.stopPropagation();
                    quitar(nombre);
                  }}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            ))
          ) : (
            <span className={estilos.placeholder}>Seleccionar profesiones...</span>
          )}
        </div>

        <span className={estilos.icono} aria-hidden="true">
          {abierto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </div>

      {abierto && (
        <div className={estilos.panel} role="listbox" aria-multiselectable="true">
          <label className={estilos.buscador} htmlFor="buscar-profesion">
            <Search size={16} aria-hidden="true" />
            <input
              id="buscar-profesion"
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar profesion"
            />
          </label>

          {opcionesVisibles.length ? (
            <div className={estilos.opciones}>
              {opcionesVisibles.map((nombre) => {
                const marcada = seleccionadas.includes(nombre) || seleccionadas.some((valor) => valor.startsWith(`${OTRO}:`)) && nombre === OTRO;
                return (
                  <label className={estilos.opcion} key={nombre} htmlFor={`profesion-${nombre}`}>
                    <input
                      id={`profesion-${nombre}`}
                      type="checkbox"
                      checked={marcada}
                      onChange={(evento) => actualizarSeleccion(nombre, evento.target.checked)}
                    />
                    <span>{nombre}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className={estilos.sinResultados}>No hay resultados para la busqueda.</p>
          )}

          {seleccionadas.some((item) => item === OTRO || item.startsWith(`${OTRO}:`)) && (
            <div className={estilos.personalizada}>
              <label className={estilos.etiqueta} htmlFor="profesion-personalizada">
                Otra profesión
              </label>
              <input
                id="profesion-personalizada"
                type="text"
                value={valorActualPersonalizado}
                onChange={onChangePersonalizado}
                placeholder="Escribe la profesion personalizada"
              />
            </div>
          )}

          <div className={estilos.acciones}>
            <button type="button" className={estilos.confirmar} onClick={() => setAbierto(false)}>
              Confirmar selección
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className={estilos.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
