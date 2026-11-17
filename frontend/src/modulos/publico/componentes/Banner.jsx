import { useEffect, useRef, useState } from 'react';
import Boton from '../../../componentes/ui/Boton.jsx';
import estilos from './Banner.module.css';

/**
 * Banner principal del sitio público (Hero Section) (HU-01 C01).
 *
 * Fondo tecnológico corporativo con red digital y nodos luminosos en cian/turquesa:
 * - Fotografía base de red de constelación de nodos y conexiones luminosas con bokeh de profundidad.
 * - Malla geométrica interactiva superpuesta con nodos pulsantes que reaccionan sutilmente.
 * - Animación continua de flotación/brillo y efecto de desplazamiento (Parallax Scroll) al bajar la página.
 */
export default function Banner() {
  const [offsetScroll, setOffsetScroll] = useState(0);
  const seccionRef = useRef(null);

  useEffect(() => {
    let ticking = false;

    const manejarScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (seccionRef.current) {
            const rect = seccionRef.current.getBoundingClientRect();
            if (rect.bottom > 0 && rect.top < window.innerHeight) {
              setOffsetScroll(window.scrollY);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', manejarScroll, { passive: true });
    return () => window.removeEventListener('scroll', manejarScroll);
  }, []);

  // Factores de movimiento Parallax Scroll acelerados por hardware
  const translateYFondo = offsetScroll * 0.35;
  const translateYContenido = offsetScroll * 0.16;
  const escalaFondo = 1 + Math.min(0.08, offsetScroll * 0.0003);
  const opacidadContenido = Math.max(0, 1 - offsetScroll / 460);

  return (
    <section ref={seccionRef} className={estilos.banner} aria-labelledby="banner-titulo">
      {/* Capa de imagen de fondo tecnológico con movimiento Parallax al hacer scroll */}
      <div
        className={estilos.capaImagenFondo}
        style={{
          transform: `translate3d(0, ${translateYFondo}px, 0) scale(${escalaFondo})`,
        }}
        aria-hidden="true"
      />

      {/* Capa de destellos y bokeh luminosos en cian y turquesa */}
      <div className={estilos.resplandorNodos} aria-hidden="true" />
      <div className={estilos.particulasConstelacion} aria-hidden="true" />

      {/* Velo de contraste óptimo para legibilidad impecable de textos y botones */}
      <span className={estilos.velo} aria-hidden="true" />

      {/* Contenido interactivo del Hero con respuesta suave al scroll */}
      <div
        className={estilos.contenido}
        style={{
          transform: `translate3d(0, ${translateYContenido}px, 0)`,
          opacity: opacidadContenido,
        }}
      >
        <h1 className={estilos.titulo} id="banner-titulo">
          Bienvenido a IKernell: tu portal a la innovación de software
        </h1>
        <p className={estilos.descripcion}>
          Explora nuestros servicios corporativos, lineamientos y noticias tecnológicas.
        </p>
        <div className={estilos.acciones}>
          <Boton a="/servicios">Conoce nuestro portafolio</Boton>
        </div>
      </div>
    </section>
  );
}
