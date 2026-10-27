import { useCallback } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

import {
  etiquetaEstadoOperativo,
  obtenerEstadoProyecto,
} from '../../../api/proyectos.js';
import EstadoCarga from '../../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../../componentes/ui/Boton.jsx';
import EtiquetaEstado from '../../../componentes/ui/EtiquetaEstado.jsx';
import Seccion from '../../../componentes/ui/Seccion.jsx';
import estilos from '../../../estilos/gestion.module.css';
import { usePeticion } from '../../../hooks/usePeticion.js';

/**
 * Nombres legibles de los conteos de avance.
 *
 * El servidor devuelve un mapa cuyas claves van creciendo conforme cada modulo
 * aporta los suyos. Se traducen las conocidas y las demas se muestran tal cual:
 * asi, cuando el backend sume un conteo nuevo, aparece solo, sin quedar oculto
 * por no estar en esta tabla.
 */
const NOMBRE_DEL_CONTEO = {
  etapasRegistradas: 'Etapas registradas',
  actividadesRegistradas: 'Actividades registradas',
  ejecucionesRegistradas: 'Ejecuciones registradas',
  erroresRegistrados: 'Errores registrados',
  interrupcionesRegistradas: 'Interrupciones registradas',
};

/** Convierte `erroresRegistrados` en `Errores registrados` como ultimo recurso. */
function nombreDelConteo(clave) {
  if (NOMBRE_DEL_CONTEO[clave]) {
    return NOMBRE_DEL_CONTEO[clave];
  }
  const separado = clave.replace(/([A-Z])/g, ' $1').toLowerCase();
  return separado.charAt(0).toUpperCase() + separado.slice(1);
}

/**
 * Estado del proyecto y datos de avance (RF-016, HU-12).
 *
 * No muestra ningun porcentaje de avance, y es deliberado: la formula no esta
 * definida (D-03) y el servidor entrega conteos crudos precisamente para no
 * inventarla. Lo que se ve aqui es lo que el servidor sabe.
 *
 * C04 pide que una nueva consulta traiga datos frescos y no los anteriores; de
 * eso se encarga el boton de actualizar, que relanza la peticion.
 */
export default function EstadoProyecto({ proyecto }) {
  const cargar = useCallback(
    ({ senal }) => obtenerEstadoProyecto(proyecto.id, { senal }),
    [proyecto.id],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [proyecto.id]);

  const conteos = Object.entries(datos?.datosDisponibles || {});

  return (
    <Seccion titulo="Estado y avance" id="estado-proyecto">
      <div className={estilos.barraSuperior}>
        <Boton variante="secundario" icono={RefreshCw} onClick={reintentar} disabled={cargando}>
          {cargando ? 'Consultando...' : 'Actualizar'}
        </Boton>
      </div>

      {cargando && <EstadoCarga mensaje="Consultando el estado del proyecto..." />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {!cargando && !error && datos && (
        <div className={estilos.ficha}>
          <dl className={estilos.datos}>
            <div>
              <dt>Estado</dt>
              {/* C03: un proyecto inhabilitado se consulta igual y conserva su
                  informacion. */}
              <dd>
                <EtiquetaEstado estado={datos.estadoHabilitacion} />
              </dd>
            </div>
            <div>
              <dt>Estado operativo</dt>
              <dd>{etiquetaEstadoOperativo(datos.estadoOperativo)}</dd>
            </div>
            <div>
              <dt>Inicio real</dt>
              <dd>{datos.fechaInicioReal || 'Sin iniciar'}</dd>
            </div>
            <div>
              <dt>Finalización real</dt>
              <dd>{datos.fechaFinReal || 'Pendiente'}</dd>
            </div>
          </dl>

          {datos.excedeSeisAnios && (
            <p className={estilos.avisoExito} role="status">
              El proyecto finalizó después de seis años; se registró la excepción.
            </p>
          )}

          <p className={estilos.rotulo}>Datos de avance</p>

          {/* C02: cuando no hay de que derivar un avance, el servidor manda su
              propio aviso en lugar de dejar la seccion vacia. */}
          {datos.mensajeAvance ? (
            <EstadoVacio mensaje={datos.mensajeAvance} icono={Activity} />
          ) : (
            <ul className={estilos.conteos}>
              {conteos.map(([clave, valor]) => (
                <li key={clave} className={estilos.conteo}>
                  <span className={estilos.conteoValor}>{valor}</span>
                  <span className={estilos.conteoNombre}>{nombreDelConteo(clave)}</span>
                </li>
              ))}
            </ul>
          )}

          {/* El servidor explica por que no hay porcentaje; el cliente no lo
              calcula por su cuenta. */}
          {datos.datosPendientes?.length > 0 && (
            <div className={estilos.pendientes}>
              <p className={estilos.rotulo}>Falta para poder calcular un avance</p>
              <ul className={estilos.motivos}>
                {datos.datosPendientes.map((pendiente) => (
                  <li key={pendiente}>{pendiente}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Seccion>
  );
}
