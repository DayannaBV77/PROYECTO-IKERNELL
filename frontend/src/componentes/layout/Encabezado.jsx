import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, MoonStar, SunMedium, X } from 'lucide-react';

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
  const [temaOscuro, setTemaOscuro] = useState(() => {
    try {
      const guardado = localStorage.getItem('ikernell-theme');
      if (guardado === 'dark' || guardado === 'light') {
        return guardado === 'dark';
      }
    } catch {
      // localStorage puede estar deshabilitado.
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });
  const { sesion } = useSesion();

  useEffect(() => {
    const tema = temaOscuro ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', tema);

    try {
      localStorage.setItem('ikernell-theme', tema);
    } catch {
      // localStorage puede estar deshabilitado.
    }
  }, [temaOscuro]);

  const cerrar = () => setAbierto(false);

  async function abrirCorreoExterno(evento, url) {
    evento.preventDefault();
    try {
      const respuesta = await obtenerAccesoCorreo();
      const destino = respuesta?.disponible ? respuesta.url : url;
      window.open(destino, '_blank', 'noopener,noreferrer');
      cerrar();
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
      cerrar();
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
          className={estilos.botonTema}
          onClick={() => setTemaOscuro((valor) => !valor)}
          aria-label={temaOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={temaOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {temaOscuro ? <SunMedium size={18} aria-hidden="true" /> : <MoonStar size={18} aria-hidden="true" />}
        </button>

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
