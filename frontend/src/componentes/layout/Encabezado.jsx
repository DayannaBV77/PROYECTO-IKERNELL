import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

import MarcaIKernell from '../marca/MarcaIKernell.jsx';
import estilos from './Encabezado.module.css';

/**
 * Encabezado compartido por el sitio publico y la aplicacion privada.
 *
 * Es uno solo y no dos a proposito: HU-03 C02 dice que el trabajador
 * autenticado "sigue viendo la informacion empresarial publica y, ademas, ve
 * los servicios internos". La sesion anade enlaces, no los sustituye, que es
 * tambien lo que muestran los dos mockups.
 *
 * @param {Array}  enlaces  [{ a, texto, exacto }]
 * @param {Node}   acciones zona derecha: iniciar sesion, o datos de la sesion
 */
export default function Encabezado({ enlaces, acciones }) {
  const [abierto, setAbierto] = useState(false);

  const cerrar = () => setAbierto(false);

  return (
    <header className={estilos.encabezado}>
      <div className={estilos.barra}>
        <MarcaIKernell />

        <nav
          className={`${estilos.navegacion} ${abierto ? estilos.navegacionAbierta : ''}`}
          aria-label="Navegacion principal"
          id="navegacion-principal"
        >
          {enlaces.map(({ a, texto, exacto }) => (
            <NavLink
              key={a}
              to={a}
              end={exacto}
              onClick={cerrar}
              className={({ isActive }) => `${estilos.enlace} ${isActive ? estilos.activo : ''}`}
            >
              {texto}
            </NavLink>
          ))}
        </nav>

        {acciones && (
          <div
            className={`${estilos.acciones} ${abierto ? estilos.accionesAbiertas : ''}`}
            onClick={cerrar}
          >
            {acciones}
          </div>
        )}

        <button
          type="button"
          className={estilos.interruptor}
          onClick={() => setAbierto((valor) => !valor)}
          aria-expanded={abierto}
          aria-controls="navegacion-principal"
          aria-label={abierto ? 'Cerrar el menu' : 'Abrir el menu'}
        >
          {abierto ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
