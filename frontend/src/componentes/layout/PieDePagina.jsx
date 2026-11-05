import { Link } from 'react-router-dom';
import { ShieldCheck, HelpCircle, ArrowUpRight } from 'lucide-react';

import estilos from './PieDePagina.module.css';

/**
 * Pie corporativo de IKernell.
 *
 * En páginas públicas ofrece la identidad corporativa, enlaces rápidos a secciones,
 * y acceso a la plataforma de trabajadores.
 * En la zona privada (`enZonaPrivada = true`) se presenta en formato compacto y técnico,
 * ofreciendo enlaces de soporte, lineamientos internos y créditos institucionales sin invadir
 * las interfaces operativas.
 */
export default function PieDePagina({ enlaces, trabajadores, enZonaPrivada = false }) {
  const anio = new Date().getFullYear();

  if (enZonaPrivada) {
    return (
      <footer className={`${estilos.pie} ${estilos.piePrivado}`}>
        <div className={estilos.contenidoPrivado}>
          <div className={estilos.privadoIzquierda}>
            <span className={estilos.privadoMarca}>IKernell</span>
            <span className={estilos.separadorPunto} aria-hidden="true">•</span>
            <span>Sistema Integrado de Gestión Empresarial</span>
          </div>

          <div className={estilos.privadoEnlaces}>
            <Link to="/app/tutoriales" className={estilos.enlacePrivado}>
              <HelpCircle size={14} aria-hidden="true" />
              <span>Tutoriales y Guías</span>
            </Link>
            <Link to="/lineamientos" className={estilos.enlacePrivado} target="_blank" rel="noopener noreferrer">
              <span>Lineamientos Corporativos</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>

          <div className={estilos.privadoDerecha}>
            <span>© {anio} IKernell Soluciones Software</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={estilos.pie}>
      <div className={estilos.contenido}>
        <div className={estilos.bloqueMarca}>
          <div className={estilos.logoEmblema}>
            <span className={estilos.sigla}><span>i</span>K</span>
            <span className={estilos.nombre}>IKernell</span>
          </div>
          <p className={estilos.descripcion}>
            Ingeniería y desarrollo de soluciones de software de alta calidad, escalables e innovadoras para la transformación digital empresarial.
          </p>
          <div className={estilos.compromisoSeguridad}>
            <ShieldCheck size={16} aria-hidden="true" className={estilos.iconoSeguridad} />
            <span>Plataforma Segura y Conforme a Estándares Corporativos</span>
          </div>
        </div>

        <nav className={estilos.bloque} aria-label="Navegación del pie de página">
          <p className={estilos.titulo}>Secciones del Portal</p>
          <div className={estilos.lista}>
            {enlaces.map(({ a, texto }) => (
              <Link key={a} to={a} className={estilos.enlaceItem}>
                {texto}
              </Link>
            ))}
          </div>
        </nav>

        <div className={estilos.bloque}>
          <p className={estilos.titulo}>Acceso Institucional</p>
          <div className={estilos.lista}>
            <Link to={trabajadores.a} className={`${estilos.enlaceItem} ${estilos.enlaceDestacado}`}>
              {trabajadores.texto}
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <Link to="/preguntas-frecuentes" className={estilos.enlaceItem}>
              Centro de Ayuda
            </Link>
            <Link to="/contacto" className={estilos.enlaceItem}>
              Canal de Soporte
            </Link>
          </div>
        </div>
      </div>

      <div className={estilos.legalContainer}>
        <div className={estilos.legalContenido}>
          <p className={estilos.legal}>
            © {anio} IKernell Soluciones Software. Todos los derechos reservados.
          </p>
          <p className={estilos.legalNota}>
            Desarrollo, consultoría tecnológica y gestión de proyectos de ingeniería.
          </p>
        </div>
      </div>
    </footer>
  );
}
