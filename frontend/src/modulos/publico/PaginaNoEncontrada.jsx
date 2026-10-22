import Boton from '../../componentes/ui/Boton.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';

/** Ruta inexistente: se explica que ocurrio y como volver. */
export default function PaginaNoEncontrada() {
  return (
    <Seccion
      titulo="Pagina no encontrada"
      descripcion="La direccion que abrio no corresponde a ninguna seccion del sitio. Es posible que el enlace este desactualizado."
    >
      <div style={{ textAlign: 'center' }}>
        <Boton a="/">Volver al inicio</Boton>
      </div>
    </Seccion>
  );
}
