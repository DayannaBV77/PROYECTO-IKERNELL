import { useState } from 'react';
import { ChevronRight, CircleHelp } from 'lucide-react';

import { TIPOS_CONTENIDO } from '../../api/contenidoPublico.js';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import FormularioConsulta from './componentes/FormularioConsulta.jsx';
import SeccionContenido from './componentes/SeccionContenido.jsx';
import estilos from './componentes/Noticia.module.css';

/**
 * Preguntas frecuentes (RF-034, HU-01 C03) y formulario de consulta
 * (RF-035, HU-02).
 *
 * El formulario vive en esta pagina y no en una propia porque HU-02 C01 lo
 * situa aqui: "estoy en la seccion de preguntas frecuentes y quiero enviar una
 * pregunta distinta a las publicadas".
 *
 * La busqueda la resuelve el servidor (parametro `busqueda` de RF-034), no un
 * filtrado en el cliente: de otro modo solo buscaria dentro de lo ya descargado.
 */
export default function PaginaPreguntas() {
  const [termino, setTermino] = useState('');
  const busqueda = useDebounce(termino, 350);

  return (
    <>
      <SeccionContenido
        tipo={TIPOS_CONTENIDO.PREGUNTA_FRECUENTE}
        titulo="Preguntas frecuentes"
        descripcion="Consulte las preguntas publicadas por la empresa junto con su respuesta."
        busqueda={busqueda}
        id="preguntas"
        iconoVacio={CircleHelp}
        antesDelContenido={
          <div style={{ maxWidth: '520px', margin: '0 auto var(--s-6)' }}>
            <Campo
              etiqueta="Buscar entre las preguntas"
              nombre="busqueda"
              tipo="search"
              value={termino}
              onChange={(evento) => setTermino(evento.target.value)}
              placeholder="Escriba una palabra clave"
            />
          </div>
        }
      >
        {(preguntas) => (
          <div>
            {preguntas.map((pregunta) => (
              <details key={pregunta.id} className={estilos.pregunta}>
                <summary className={estilos.resumen}>
                  {pregunta.titulo}
                  <ChevronRight size={18} className={estilos.flecha} aria-hidden="true" />
                </summary>
                <div className={estilos.respuesta}>{pregunta.cuerpo}</div>
              </details>
            ))}
          </div>
        )}
      </SeccionContenido>

      <Seccion fondo="tenue" sinCabecera>
        <FormularioConsulta />
      </Seccion>
    </>
  );
}
