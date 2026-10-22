import MallaDeRed from '../../../componentes/decoracion/MallaDeRed.jsx';
import Boton from '../../../componentes/ui/Boton.jsx';
import estilos from './Banner.module.css';

/**
 * Banner principal del sitio publico (HU-01 C01).
 *
 * PENDIENTE: la fotografia tecnologica del mockup no esta en el repositorio.
 * Mientras llega, el fondo se construye con un degradado y la malla de nodos,
 * que reproducen su composicion sin recurrir a una imagen ajena al proyecto.
 * Al disponer del archivo basta con anadirlo como capa de fondo de `.banner`.
 *
 * El texto es institucional fijo, no contenido administrable: no corresponde a
 * ninguna de las seis secciones que el backend publica.
 */
export default function Banner() {
  return (
    <section className={estilos.banner} aria-labelledby="banner-titulo">
      <MallaDeRed className={estilos.mallaClara} color="#1c3557" opacidad={0.12} />
      <MallaDeRed className={estilos.mallaOscura} color="#7dd3dc" opacidad={0.3} />
      <span className={estilos.velo} aria-hidden="true" />

      <div className={estilos.contenido}>
        <h1 className={estilos.titulo} id="banner-titulo">
          Bienvenido a IKernell: tu portal a la innovacion de software
        </h1>
        <p className={estilos.descripcion}>
          Explora nuestros servicios corporativos, lineamientos y noticias tecnologicas.
        </p>
        <Boton a="/servicios">Conoce nuestro portafolio</Boton>
      </div>
    </section>
  );
}
