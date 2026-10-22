import Banner from './componentes/Banner.jsx';
import PaginaLineamientos from './PaginaLineamientos.jsx';
import PaginaServicios from './PaginaServicios.jsx';

/**
 * Pagina principal publica (RF-026, HU-01 C01).
 *
 * Reune el banner y las dos secciones que el mockup situa en la portada. Las
 * otras cuatro partes de la informacion empresarial se alcanzan "con un clic"
 * desde el menu, que es lo que HU-01 C01 exige.
 *
 * Reutiliza los mismos componentes de seccion que las paginas dedicadas: el
 * contenido se pide al backend, no se duplica.
 */
export default function PaginaInicio() {
  return (
    <>
      <Banner />
      <PaginaLineamientos />
      <PaginaServicios />
    </>
  );
}
