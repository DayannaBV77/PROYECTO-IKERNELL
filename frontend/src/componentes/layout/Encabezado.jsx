import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

import { obtenerAccesoCorreo } from '../../api/corporativo.js';
import { ETIQUETA_TIPO } from '../../api/autenticacion.js';
import { useSesion } from '../../sesion/contexto.js';
import MarcaIKernell from '../marca/MarcaIKernell.jsx';
import estilos from './Encabezado.module.css';

/**
 * Encabezado corporativo de IKernell.
 *
 * Incluye:
 * 1. Franja superior institucional con tono grafito/oscuro corporativo, mostrando
 *    el rol activo (p.ej. Líder de Proyectos) y el nombre del usuario autenticado.
 * 2. Barra de navegación principal limpia y equilibrada sobre fondo blanco,
 *    con renderizado condicional según el rol de la sesión.
 *
 * @param {Array}  enlaces  [{ a, texto, exacto }]
 * @param {Node}   acciones zona derecha: iniciar sesion, o datos de la sesion
 */
export default function Encabezado({ enlaces, acciones }) {
  const [abierto, setAbierto] = useState(false);
  const { sesion } = useSesion();

  const cerrar = () => setAbierto(false);

  async function abrirCorreoExterno(evento, url) {
    evento.preventDefault();
    try {
      const respuesta = await obtenerAccesoCorreo();
      const destino = respuesta?.disponible ? respuesta.url : url;
      if (!respuesta?.disponible) {
        window.alert(respuesta?.mensaje || 'El correo corporativo no está disponible en este momento.');
        return;
      }
      window.open(destino, '_blank', 'noopener,noreferrer');
      cerrar();
    } catch {
      window.alert('Debe iniciar sesion para abrir el correo corporativo.');
    }
  }

  return (
    <header className={`${estilos.encabezado} ${sesion ? estilos.conSesion : ''}`}>
      {/* 1. Franja superior grafito/oscuro institucional y de rol */}
      <div className={estilos.franjaSuperior}>
        <div className={estilos.franjaSuperiorContenido}>
          <div className={estilos.franjaIzquierda}>
            <span className={estilos.franjaMarca}>IKERNELL</span>
            <span className={estilos.franjaSeparador} aria-hidden="true">|</span>
            <span className={estilos.franjaTexto}>Soluciones de Software</span>
          </div>

          <div className={estilos.franjaDerecha}>
            {sesion ? (
              <div className={estilos.badgeRolSuperior}>
                <span className={estilos.indicadorPunto} aria-hidden="true" />
                <span className={estilos.franjaRolTexto}>
                  {ETIQUETA_TIPO[sesion.tipoTrabajador] || sesion.tipoTrabajador}
                </span>
                {sesion.nombreCompleto && (
                  <>
                    <span className={estilos.franjaSeparador} aria-hidden="true">•</span>
                    <span className={estilos.franjaNombre}>{sesion.nombreCompleto}</span>
                  </>
                )}
              </div>
            ) : (
              <span className={estilos.franjaPublico}>Portal Corporativo</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Barra de navegación principal sobre fondo claro */}
      <div className={estilos.barra}>
        {/* En la zona privada el logotipo reduce a su sigla cuando el menu
            completo necesita el ancho: la franja superior ya rotula IKERNELL. */}
        <MarcaIKernell a={sesion ? '/app' : '/'} compacta={Boolean(sesion)} />

        <nav
          className={`${estilos.navegacion} ${abierto ? estilos.navegacionAbierta : ''}`}
          aria-label="Navegacion principal"
          id="navegacion-principal"
        >
          {enlaces.map(({ a, texto, exacto, externo }) => {
            if (externo || /^https?:\/\//.test(a)) {
              return (
                <button
                  key={a}
                  type="button"
                  className={estilos.enlace}
                  onClick={(evento) => abrirCorreoExterno(evento, a)}
                >
                  {texto}
                </button>
              );
            }

            return (
              <NavLink
                key={a}
                to={a}
                end={exacto}
                onClick={cerrar}
                className={({ isActive }) => `${estilos.enlace} ${isActive ? estilos.activo : ''}`}
              >
                {texto}
              </NavLink>
            );
          })}
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
