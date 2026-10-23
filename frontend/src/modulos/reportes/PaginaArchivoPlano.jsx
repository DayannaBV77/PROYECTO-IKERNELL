import { useCallback, useState } from 'react';
import { CircleCheck, Download, FileDown, TriangleAlert } from 'lucide-react';

import { buscarProyectos } from '../../api/proyectos.js';
import { descargarArchivoPlano } from '../../api/reportes.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';

/**
 * Archivo plano para la empresa brasileña aliada (RF-025, HU-19).
 *
 * Reservado al lider (C05). Se puede elegir que proyectos incluir, o dejarlos
 * todos sin marcar ninguno, porque C01 admite las dos cosas: "eligiendo los
 * proyectos a incluir si la empresa lo permite".
 *
 * ESTRUCTURA PENDIENTE (D-28): C02 exige que el archivo cumpla "los campos, el
 * separador y la codificacion definidos", y ese acuerdo con la empresa
 * brasileña sigue sin cerrarse (HU-19 T1). El archivo que se descarga es una
 * propuesta, y la pantalla lo advierte para que nadie lo envie creyendo que ya
 * cumple lo pactado.
 *
 * El archivo no se abre en una pestaña nueva: se pide por fetch para que un
 * fallo llegue como mensaje (C04) y no como una descarga vacia o una pagina de
 * error. Solo cuando el contenido esta completo se entrega al navegador.
 */
export default function PaginaArchivoPlano() {
  const [seleccion, setSeleccion] = useState([]);
  const [generando, setGenerando] = useState(false);
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);

  const cargar = useCallback(({ senal }) => buscarProyectos({ tamano: 100 }, { senal }), []);
  const { datos, error, cargando, reintentar } = usePeticion(cargar, []);

  const proyectos = datos?.contenido || [];

  function alMarcar(id) {
    setSeleccion((previos) =>
      previos.includes(id) ? previos.filter((otro) => otro !== id) : [...previos, id],
    );
    setConfirmado(null);
    setFallo(null);
  }

  async function alGenerar() {
    setGenerando(true);
    setFallo(null);
    setConfirmado(null);

    try {
      const { nombre, blob } = await descargarArchivoPlano(seleccion);

      // La descarga se dispara desde memoria, con el archivo ya completo.
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);

      setConfirmado(
        `El archivo "${nombre}" esta listo y se descargo con ${
          seleccion.length === 0 ? 'todos los proyectos' : `${seleccion.length} proyecto(s)`
        }.`,
      );
    } catch (fallaApi) {
      // C03 y C04: el aviso de que no hay informacion, o el motivo del fallo.
      // En ninguno de los dos casos se entrega un archivo.
      setFallo(fallaApi.message);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <Seccion
      titulo="Archivo plano para la empresa aliada"
      descripcion="Informacion de los proyectos y de su ejecucion, para reportarla a la empresa brasileña."
      id="archivo-plano"
    >
      <div className={estilos.avisoPendiente} role="note">
        <TriangleAlert size={18} aria-hidden="true" />
        <div>
          <p>
            <strong>La estructura del archivo esta pendiente de acordar.</strong>
          </p>
          <p className={estilos.notaDialogo}>
            Los campos, el separador y la codificacion deben definirse con la empresa brasileña.
            Lo que se descarga es una propuesta armada con la informacion que el sistema tiene de
            cada proyecto; reviselo antes de enviarlo.
          </p>
        </div>
      </div>

      {confirmado && (
        <p className={estilos.avisoExito} role="status">
          <CircleCheck size={18} aria-hidden="true" />
          {confirmado}
        </p>
      )}

      {fallo && (
        <p className={estilos.avisoError} role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          {fallo}
        </p>
      )}

      {cargando && <EstadoCarga mensaje="Cargando los proyectos..." />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {!cargando && !error && proyectos.length === 0 && (
        <EstadoVacio mensaje={datos?.mensaje} icono={FileDown} />
      )}

      {!cargando && !error && proyectos.length > 0 && (
        <>
          <p className={estilos.rotulo}>Proyectos a incluir</p>
          <p className={estilos.notaDialogo}>
            Sin marcar ninguno se incluyen todos, tambien los inhabilitados: su historial se
            conserva y lo que se reporta es la ejecucion.
          </p>

          <ul className={estilos.candidatos}>
            {proyectos.map((proyecto) => (
              <li key={proyecto.id}>
                <label className={estilos.candidato}>
                  <input
                    type="checkbox"
                    checked={seleccion.includes(proyecto.id)}
                    onChange={() => alMarcar(proyecto.id)}
                    disabled={generando}
                  />
                  <span>
                    <span className={estilos.candidatoNombre}>{proyecto.nombre}</span>
                    <span className={estilos.candidatoDetalle}>
                      n.º {proyecto.id} ·{' '}
                      {proyecto.estadoHabilitacion === 'INHABILITADO'
                        ? 'inhabilitado'
                        : 'habilitado'}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className={estilos.accionesBuscador}>
            <Boton icono={Download} onClick={alGenerar} disabled={generando}>
              {generando ? 'Generando...' : 'Generar y descargar'}
            </Boton>
          </div>
        </>
      )}
    </Seccion>
  );
}
