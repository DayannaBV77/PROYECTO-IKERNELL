import { Mail, MapPin, Phone } from 'lucide-react';

import { TIPOS_CONTENIDO } from '../../api/contenidoPublico.js';
import SeccionContenido from './componentes/SeccionContenido.jsx';
import estilos from './componentes/Noticia.module.css';

/**
 * Informacion de contacto (RF-036, HU-01 C04).
 *
 * Cada pieza guarda la etiqueta en `titulo` y el dato en `cuerpo`. Solo se
 * muestra lo que la empresa publico: aqui no se redacta ninguna direccion,
 * telefono ni correo.
 */
function iconoDeContacto(etiqueta) {
  const normalizada = (etiqueta || '').toLowerCase();
  if (normalizada.includes('correo') || normalizada.includes('mail')) {
    return Mail;
  }
  if (normalizada.includes('tel') || normalizada.includes('celular')) {
    return Phone;
  }
  return MapPin;
}

export default function PaginaContacto() {
  return (
    <SeccionContenido
      tipo={TIPOS_CONTENIDO.INFORMACION_CONTACTO}
      titulo="Contacto"
      descripcion="Datos de comunicacion publicados por IKernell Soluciones Software."
      id="contacto"
      iconoVacio={Mail}
      esqueleto={3}
    >
      {(datos) => (
        <div className={estilos.contactos}>
          {datos.map((dato) => {
            const Icono = iconoDeContacto(dato.titulo);
            return (
              <div key={dato.id} className={estilos.contacto}>
                <Icono size={20} className={estilos.contactoIcono} aria-hidden="true" />
                <div>
                  <p className={estilos.contactoEtiqueta}>{dato.titulo}</p>
                  <p className={estilos.contactoDato}>{dato.cuerpo}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SeccionContenido>
  );
}
