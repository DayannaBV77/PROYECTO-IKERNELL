import { useCallback, useState } from 'react';
import { CircleCheck, ListOrdered, Pencil, Plus, Save, Trash2, TriangleAlert, X } from 'lucide-react';

import {
  eliminarEtapa,
  modificarEtapa,
  obtenerEtapas,
  registrarEtapa,
} from '../../../api/proyectos.js';
import EstadoCarga from '../../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../../componentes/ui/Boton.jsx';
import Campo from '../../../componentes/ui/Campo.jsx';
import Confirmacion from '../../../componentes/ui/Confirmacion.jsx';
import Seccion from '../../../componentes/ui/Seccion.jsx';
import estilos from '../../../estilos/gestion.module.css';
import { usePeticion } from '../../../hooks/usePeticion.js';

const ETAPA_NUEVA = { id: null, nombre: '', descripcion: '', orden: '' };

/** El formulario trabaja con cadenas; el backend espera un entero o nada. */
function paraEnviar({ nombre, descripcion, orden }) {
  return {
    nombre,
    descripcion,
    // Un campo numerico vacio no se envia como cadena: el servidor espera un
    // entero y "" no es uno.
    orden: orden === '' || orden === null ? null : Number(orden),
  };
}

/**
 * Etapas del proyecto (RF-010 a RF-012, HU-11).
 *
 * Cubre los cinco criterios: registra una etapa asociada al proyecto (C01),
 * marca los datos que falten conservando lo escrito (C02), modifica sin que la
 * etapa cambie de proyecto (C03), elimina previa confirmacion (C04) y muestra
 * el motivo cuando la etapa tiene registros asociados y no se puede borrar
 * (C05).
 *
 * El formulario es uno solo para registrar y para modificar: los campos son los
 * mismos -el backend usa el mismo DTO para las dos operaciones- y duplicarlo
 * llevaria a que las validaciones se separen con el tiempo.
 */
export default function EtapasProyecto({ proyecto }) {
  const [recarga, setRecarga] = useState(0);
  const [edicion, setEdicion] = useState(null);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(
    ({ senal }) => obtenerEtapas(proyecto.id, { senal }),
    [proyecto.id],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [proyecto.id, recarga]);

  const etapas = datos || [];

  function abrir(etapa) {
    setEdicion(etapa ? { ...etapa, orden: etapa.orden ?? '' } : ETAPA_NUEVA);
    setErrores({});
    setFallo(null);
    setConfirmado(null);
  }

  function cerrar() {
    setEdicion(null);
    setErrores({});
    setFallo(null);
  }

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setEdicion((previa) => ({ ...previa, [name]: value }));
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
  }

  async function alGuardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setFallo(null);
    setErrores({});

    const esNueva = !edicion.id;
    try {
      if (esNueva) {
        await registrarEtapa(proyecto.id, paraEnviar(edicion));
      } else {
        await modificarEtapa(proyecto.id, edicion.id, paraEnviar(edicion));
      }
      setConfirmado(
        esNueva
          ? 'La etapa se registro y quedo asociada al proyecto.'
          : 'Los cambios de la etapa se guardaron correctamente.',
      );
      setEdicion(null);
      setRecarga((numero) => numero + 1);
    } catch (fallaApi) {
      // C02: se indica que completar y el formulario conserva lo escrito.
      if (fallaApi.campos) {
        setErrores(fallaApi.campos);
      }
      setFallo(fallaApi.message);
    } finally {
      setGuardando(false);
    }
  }

  async function alEliminar() {
    setEliminando(true);
    setFallo(null);

    try {
      await eliminarEtapa(proyecto.id, aEliminar.id);
      setConfirmado(`La etapa "${aEliminar.nombre}" fue eliminada.`);
      setRecarga((numero) => numero + 1);
    } catch (fallaApi) {
      // C05: la etapa con registros asociados no se borra; el servidor explica
      // cual es la dependencia que lo impide.
      setFallo(fallaApi.message);
    } finally {
      setEliminando(false);
      setAEliminar(null);
    }
  }

  return (
    <Seccion
      titulo="Etapas del proyecto"
      descripcion="Fases de ejecucion en que se organiza el proyecto."
      fondo="tenue"
      id="etapas-proyecto"
    >
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

      {cargando && <EstadoCarga mensaje="Cargando las etapas..." />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {!cargando && !error && etapas.length === 0 && (
        <EstadoVacio
          mensaje="Este proyecto todavia no tiene etapas registradas."
          icono={ListOrdered}
        />
      )}

      {!cargando && !error && etapas.length > 0 && (
        <div className={estilos.tablaEnvoltorio}>
          <table className={estilos.tabla}>
            <caption className="solo-lectores">Etapas registradas del proyecto</caption>
            <thead>
              <tr>
                <th scope="col">Orden</th>
                <th scope="col">Etapa</th>
                <th scope="col">Descripcion</th>
                <th scope="col">
                  <span className="solo-lectores">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {etapas.map((etapa) => (
                <tr key={etapa.id}>
                  <td>{etapa.orden ?? '—'}</td>
                  <th scope="row" className={estilos.celdaNombre}>
                    {etapa.nombre}
                  </th>
                  <td className={estilos.celdaDescripcion}>{etapa.descripcion || '—'}</td>
                  <td>
                    <div className={estilos.accionesFila}>
                      <Boton variante="texto" icono={Pencil} onClick={() => abrir(etapa)}>
                        Editar
                        <span className="solo-lectores"> la etapa {etapa.nombre}</span>
                      </Boton>
                      <Boton
                        variante="texto"
                        icono={Trash2}
                        onClick={() => {
                          setAEliminar(etapa);
                          setFallo(null);
                          setConfirmado(null);
                        }}
                      >
                        Eliminar
                        <span className="solo-lectores"> la etapa {etapa.nombre}</span>
                      </Boton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {edicion ? (
        <form className={estilos.formularioEtapa} onSubmit={alGuardar} noValidate>
          <p className={estilos.rotulo}>{edicion.id ? 'Modificar etapa' : 'Nueva etapa'}</p>

          <div className={estilos.criterios}>
            <Campo
              etiqueta="Nombre de la etapa"
              nombre="nombre"
              obligatorio
              value={edicion.nombre}
              onChange={alCambiar}
              error={errores.nombre}
            />
            <Campo
              etiqueta="Orden"
              nombre="orden"
              tipo="number"
              min="1"
              value={edicion.orden}
              onChange={alCambiar}
              error={errores.orden}
              pista="Opcional. Posicion de la etapa dentro del proyecto."
            />
          </div>

          <Campo
            etiqueta="Descripcion"
            nombre="descripcion"
            area
            rows={4}
            value={edicion.descripcion || ''}
            onChange={alCambiar}
            error={errores.descripcion}
          />

          <div className={estilos.accionesBuscador}>
            <Boton type="submit" icono={Save} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar etapa'}
            </Boton>
            <Boton type="button" variante="texto" icono={X} onClick={cerrar} disabled={guardando}>
              Cancelar
            </Boton>
          </div>
        </form>
      ) : (
        <div className={estilos.accionesBuscador}>
          <Boton icono={Plus} onClick={() => abrir(null)}>
            Anadir etapa
          </Boton>
        </div>
      )}

      <Confirmacion
        abierto={aEliminar !== null}
        titulo="Eliminar la etapa"
        textoConfirmar="Eliminar"
        ocupado={eliminando}
        alConfirmar={alEliminar}
        alCancelar={() => setAEliminar(null)}
      >
        <p>
          Se eliminara la etapa <strong>{aEliminar?.nombre}</strong> del proyecto.
        </p>
        <p className={estilos.notaDialogo}>
          Es la unica operacion del sistema que borra de verdad. Si la etapa tiene actividades u
          otros registros asociados, no se eliminara y se explicara el motivo, para no perder la
          informacion historica del proyecto.
        </p>
      </Confirmacion>
    </Seccion>
  );
}
