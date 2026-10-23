import { useCallback, useState } from 'react';
import { CircleCheck, TriangleAlert, UserPlus, Users } from 'lucide-react';

import {
  ETIQUETA_ROL,
  asignarDesarrolladores,
  obtenerCandidatos,
  obtenerEquipo,
} from '../../../api/proyectos.js';
import EstadoCarga from '../../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../../componentes/ui/Boton.jsx';
import Seccion from '../../../componentes/ui/Seccion.jsx';
import estilos from '../../../estilos/gestion.module.css';
import { usePeticion } from '../../../hooks/usePeticion.js';
import { formatearFecha } from '../../../utilidades/formato.js';

/**
 * Equipo de trabajo del proyecto (RF-009, HU-10).
 *
 * Cubre los cinco criterios: asigna uno o varios desarrolladores (C01),
 * no ofrece la operacion sobre un proyecto inhabilitado y muestra el aviso del
 * servidor si aun asi se intenta (C02), informa de los rechazados uno a uno sin
 * descartar el resto del lote (C03), admite a un lider de otro proyecto como
 * desarrollador -porque el servidor lo admite (RN-05)- y lista el equipo
 * asignado (C05).
 *
 * Los candidatos los decide el servidor: ya vienen sin los inhabilitados y sin
 * los que ya estan en el equipo, de modo que la lista no ofrece a nadie que la
 * asignacion fuera a rechazar.
 */
export default function EquipoProyecto({ proyecto }) {
  // Una sola clave de recarga para las dos listas: asignar cambia las dos a la
  // vez, y refrescar solo una dejaria la pantalla contradiciendose.
  const [recarga, setRecarga] = useState(0);
  const [seleccion, setSeleccion] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [fallo, setFallo] = useState(null);
  const [asignando, setAsignando] = useState(false);

  const cargarEquipo = useCallback(
    ({ senal }) => obtenerEquipo(proyecto.id, { senal }),
    [proyecto.id],
  );
  const equipo = usePeticion(cargarEquipo, [proyecto.id, recarga]);

  const cargarCandidatos = useCallback(
    ({ senal }) => obtenerCandidatos(proyecto.id, { senal }),
    [proyecto.id],
  );
  const candidatos = usePeticion(cargarCandidatos, [proyecto.id, recarga]);

  const habilitado = proyecto.estadoHabilitacion !== 'INHABILITADO';
  const disponibles = candidatos.datos?.contenido || [];

  function alMarcar(id) {
    setSeleccion((previos) =>
      previos.includes(id) ? previos.filter((otro) => otro !== id) : [...previos, id],
    );
    setResultado(null);
    setFallo(null);
  }

  async function alAsignar() {
    setAsignando(true);
    setFallo(null);
    setResultado(null);

    try {
      const respuesta = await asignarDesarrolladores(proyecto.id, seleccion);
      // Los rechazados solo traen el identificador; el nombre se recupera de la
      // lista que se tenia a la vista, para que el aviso diga a quien se
      // refiere y no un numero.
      setResultado({
        asignados: respuesta.asignados || [],
        rechazados: (respuesta.rechazados || []).map((rechazado) => ({
          ...rechazado,
          nombre: disponibles.find((uno) => uno.id === rechazado.desarrolladorId)?.nombreCompleto,
        })),
      });
      setSeleccion([]);
      setRecarga((numero) => numero + 1);
    } catch (error) {
      // C02: el proyecto inhabilitado detiene el lote entero, con el mensaje
      // del servidor.
      setFallo(error.message);
    } finally {
      setAsignando(false);
    }
  }

  return (
    <Seccion
      titulo="Equipo de trabajo"
      descripcion="Desarrolladores asignados al proyecto."
      fondo="tenue"
      id="equipo-proyecto"
    >
      {resultado && (
        <div role="status">
          {resultado.asignados.length > 0 && (
            <p className={estilos.avisoExito}>
              <CircleCheck size={18} aria-hidden="true" />
              {resultado.asignados.length === 1
                ? 'El desarrollador quedo asignado al proyecto.'
                : `${resultado.asignados.length} desarrolladores quedaron asignados al proyecto.`}
            </p>
          )}

          {resultado.rechazados.length > 0 && (
            <div className={estilos.avisoError}>
              <TriangleAlert size={18} aria-hidden="true" />
              <div>
                <p>No se asignaron estos desarrolladores:</p>
                <ul className={estilos.motivos}>
                  {resultado.rechazados.map((rechazado) => (
                    <li key={rechazado.desarrolladorId}>
                      <strong>{rechazado.nombre || `Trabajador n.º ${rechazado.desarrolladorId}`}</strong>
                      : {rechazado.motivo}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {fallo && (
        <p className={estilos.avisoError} role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          {fallo}
        </p>
      )}

      {/* --- C05: el equipo asignado --- */}
      {equipo.cargando && <EstadoCarga mensaje="Cargando el equipo..." />}

      {!equipo.cargando && equipo.error && (
        <EstadoError error={equipo.error} alReintentar={equipo.reintentar} />
      )}

      {!equipo.cargando && !equipo.error && (equipo.datos?.length || 0) === 0 && (
        <EstadoVacio
          mensaje="Todavia no hay desarrolladores asignados a este proyecto."
          icono={Users}
        />
      )}

      {!equipo.cargando && !equipo.error && equipo.datos?.length > 0 && (
        <div className={estilos.tablaEnvoltorio}>
          <table className={estilos.tabla}>
            <caption className="solo-lectores">Equipo asignado al proyecto</caption>
            <thead>
              <tr>
                <th scope="col">Identificacion</th>
                <th scope="col">Desarrollador</th>
                <th scope="col">Rol en el proyecto</th>
                <th scope="col">Asignado el</th>
              </tr>
            </thead>
            <tbody>
              {equipo.datos.map((asignacion) => (
                <tr key={asignacion.id}>
                  <td>{asignacion.trabajadorIdentificacion}</td>
                  <th scope="row" className={estilos.celdaNombre}>
                    {asignacion.trabajadorNombreCompleto}
                  </th>
                  <td>{ETIQUETA_ROL[asignacion.rolEnProyecto] || asignacion.rolEnProyecto}</td>
                  <td>{formatearFecha(asignacion.fechaAsignacion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- C01: asignar --- */}
      {habilitado ? (
        <SelectorDeCandidatos
          candidatos={candidatos}
          disponibles={disponibles}
          seleccion={seleccion}
          alMarcar={alMarcar}
          alAsignar={alAsignar}
          asignando={asignando}
        />
      ) : (
        // C02: no se ofrece una operacion que el servidor va a rechazar. El
        // equipo ya asignado se sigue viendo, porque inhabilitar no borra nada.
        <p className={estilos.notaDialogo}>
          El proyecto esta inhabilitado: no se le pueden asignar nuevos trabajadores.
        </p>
      )}
    </Seccion>
  );
}

/** Lista de desarrolladores asignables, con seleccion multiple. */
function SelectorDeCandidatos({
  candidatos,
  disponibles,
  seleccion,
  alMarcar,
  alAsignar,
  asignando,
}) {
  return (
    <div className={estilos.asignacion}>
      <p className={estilos.rotulo}>Asignar desarrolladores</p>

      {candidatos.cargando && <EstadoCarga mensaje="Cargando desarrolladores disponibles..." />}

      {!candidatos.cargando && candidatos.error && (
        <EstadoError error={candidatos.error} alReintentar={candidatos.reintentar} />
      )}

      {/* El aviso de que no hay a quien asignar lo redacta el servidor (RN-14). */}
      {!candidatos.cargando && !candidatos.error && disponibles.length === 0 && (
        <EstadoVacio mensaje={candidatos.datos?.mensaje} icono={UserPlus} />
      )}

      {!candidatos.cargando && !candidatos.error && disponibles.length > 0 && (
        <>
          <ul className={estilos.candidatos}>
            {disponibles.map((candidato) => (
              <li key={candidato.id}>
                <label className={estilos.candidato}>
                  <input
                    type="checkbox"
                    checked={seleccion.includes(candidato.id)}
                    onChange={() => alMarcar(candidato.id)}
                    disabled={asignando}
                  />
                  <span>
                    <span className={estilos.candidatoNombre}>{candidato.nombreCompleto}</span>
                    <span className={estilos.candidatoDetalle}>
                      {candidato.identificacion} · {candidato.especialidadDesarrollo}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <Boton
            icono={UserPlus}
            onClick={alAsignar}
            disabled={asignando || seleccion.length === 0}
          >
            {asignando
              ? 'Asignando...'
              : `Asignar ${seleccion.length || ''} seleccionado${seleccion.length === 1 ? '' : 's'}`}
          </Boton>
        </>
      )}
    </div>
  );
}
