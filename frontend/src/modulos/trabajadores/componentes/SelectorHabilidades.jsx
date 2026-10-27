import { useMemo, useState } from 'react';

import { CATEGORIAS_HABILIDADES, claveHabilidad } from '../catalogoHabilidades.js';
import estilos from './SelectorHabilidades.module.css';

export default function SelectorHabilidades({ seleccionadas, onChange }) {
  const [busqueda, setBusqueda] = useState('');
  const termino = busqueda.trim().toLocaleLowerCase();
  const visibles = useMemo(
    () =>
      CATEGORIAS_HABILIDADES.map((categoria) => ({
        ...categoria,
        opciones: categoria.opciones.filter((nombre) =>
          nombre.toLocaleLowerCase().includes(termino),
        ),
      })).filter((categoria) => categoria.opciones.length > 0),
    [termino],
  );
  const clavesSeleccionadas = new Set(seleccionadas.map(claveHabilidad));

  function cambiarSeleccion(categoria, nombre, marcado) {
    const clave = claveHabilidad({ categoria, nombre });
    onChange(
      marcado
        ? [...seleccionadas, { categoria, nombre }]
        : seleccionadas.filter((habilidad) => claveHabilidad(habilidad) !== clave),
    );
  }

  return (
    <section className={estilos.selector} aria-labelledby="habilidades-titulo">
      <h3 className={estilos.titulo} id="habilidades-titulo">
        Areas y habilidades
      </h3>
      <p className={estilos.pista}>
        Seleccione las que correspondan. Las categorias son independientes; puede buscar, revisar
        y retirar selecciones.
      </p>

      <label className={estilos.etiqueta} htmlFor="buscar-habilidades">
        Consultar opciones
      </label>
      <input
        className={estilos.busqueda}
        id="buscar-habilidades"
        type="search"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
        placeholder="Buscar area o tecnologia"
      />

      {visibles.length ? (
        <div className={estilos.categorias}>
          {visibles.map((categoria) => (
            <fieldset className={estilos.categoria} key={categoria.valor}>
              <legend>{categoria.texto}</legend>
              <div className={estilos.opciones}>
                {categoria.opciones.map((nombre) => {
                  const habilidad = { categoria: categoria.valor, nombre };
                  const id = `habilidad-${categoria.valor}-${nombre.replaceAll(/[^a-zA-Z0-9]/g, '-')}`;
                  return (
                    <label className={estilos.opcion} htmlFor={id} key={claveHabilidad(habilidad)}>
                      <input
                        id={id}
                        type="checkbox"
                        checked={clavesSeleccionadas.has(claveHabilidad(habilidad))}
                        onChange={(evento) =>
                          cambiarSeleccion(categoria.valor, nombre, evento.target.checked)
                        }
                      />
                      {nombre}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      ) : (
        <p className={estilos.sinResultados}>No hay opciones que coincidan con la busqueda.</p>
      )}

      <div className={estilos.seleccionadas} aria-live="polite">
        <h4>Seleccionadas ({seleccionadas.length})</h4>
        {seleccionadas.length ? (
          <ul>
            {seleccionadas.map((habilidad) => (
              <li key={claveHabilidad(habilidad)}>
                <span>
                  {habilidad.nombre} · {CATEGORIAS_HABILIDADES.find(
                    (categoria) => categoria.valor === habilidad.categoria,
                  )?.texto}
                </span>
                <button
                  type="button"
                  aria-label={`Retirar ${habilidad.nombre}`}
                  onClick={() =>
                    cambiarSeleccion(habilidad.categoria, habilidad.nombre, false)
                  }
                >
                  Retirar
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aun no hay areas o habilidades seleccionadas.</p>
        )}
      </div>
    </section>
  );
}
