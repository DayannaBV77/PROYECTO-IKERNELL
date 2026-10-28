import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ESPECIALIDADES_DESARROLLO,
  listarEspecialidades,
  serializarEspecialidades,
} from '../catalogoEspecialidades.js';
import estilos from './SelectorEspecialidades.module.css';

export default function SelectorEspecialidades({ value = '', onChange, error, obligatorio = false }) {
  const seleccionadas = listarEspecialidades(value);
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const opcionesVisibles = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase();
    if (!termino) {
      return ESPECIALIDADES_DESARROLLO;
    }

    return ESPECIALIDADES_DESARROLLO.filter((nombre) =>
      nombre.toLocaleLowerCase().includes(termino),
    );
  }, [busqueda]);

  function cambiarSeleccion(nombre, marcado) {
    const siguiente = marcado
      ? [...new Set([...seleccionadas, nombre])]
      : seleccionadas.filter((valor) => valor !== nombre);
    onChange?.(serializarEspecialidades(siguiente));
  }

  function quitarEspecialidad(nombre, evento) {
    evento.stopPropagation();
    cambiarSeleccion(nombre, false);
  }

  return (
    <div className={`${estilos.selector} ${error ? estilos.conError : ''}`}>
      <label className={estilos.etiqueta} htmlFor="especialidades-desarrollo">
        Especialidad de desarrollo
        {obligatorio && (
          <span className={estilos.obligatorio} aria-hidden="true">
            *
          </span>
        )}
        {obligatorio && <span className="solo-lectores"> (obligatorio)</span>}
      </label>

      <div
        id="especialidades-desarrollo"
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
                  onClick={(evento) => quitarEspecialidad(nombre, evento)}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            ))
          ) : (
            <span className={estilos.placeholder}>Seleccionar especialidades...</span>
          )}
        </div>

        <span className={estilos.icono} aria-hidden="true">
          {abierto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </div>

      {abierto && (
        <div className={estilos.panel} role="listbox" aria-multiselectable="true">
          <label className={estilos.buscador} htmlFor="buscar-especialidad">
            <Search size={16} aria-hidden="true" />
            <input
              id="buscar-especialidad"
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar especialidad"
            />
          </label>

          {opcionesVisibles.length ? (
            <div className={estilos.opciones}>
              {opcionesVisibles.map((nombre) => {
                const marcado = seleccionadas.includes(nombre);
                return (
                  <label className={estilos.opcion} key={nombre} htmlFor={`especialidad-${nombre}`}>
                    <input
                      id={`especialidad-${nombre}`}
                      type="checkbox"
                      checked={marcado}
                      onChange={(evento) => cambiarSeleccion(nombre, evento.target.checked)}
                    />
                    <span>{nombre}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className={estilos.sinResultados}>No hay resultados para la busqueda.</p>
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
