import { useCallback, useMemo, useState } from 'react';
import { Check, Search, Users } from 'lucide-react';

import {
  asignarEquipoCoordinador,
  obtenerDesarrolladoresDisponibles,
  obtenerRoles,
} from '../../api/asignaciones.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Dialogo from '../../componentes/ui/Dialogo.jsx';
import { useNotificador } from '../../componentes/ui/Notificador.jsx';
import { usePeticion } from '../../hooks/usePeticion.js';
import estilos from './ModalAsignarTrabajadores.module.css';

export default function ModalAsignarTrabajadores({ abierto, proyecto, alCerrar, alGuardar }) {
  const notificador = useNotificador();
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState({});
  const [advertencias, setAdvertencias] = useState(null);
  const [fallo, setFallo] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Carga de catálogo de roles para obtener el id del rol Desarrollador
  const cargarRoles = useCallback(({ senal }) => obtenerRoles({ senal }), []);
  const roles = usePeticion(cargarRoles, []);
  const rolDesarrolladorId = useMemo(() => {
    const listaRoles = Array.isArray(roles.datos) ? roles.datos : (roles.datos?.contenido || []);
    const rol = listaRoles.find((r) => r.nombreRol === 'Desarrollador');
    return rol?.id;
  }, [roles.datos]);

  // Carga de desarrolladores disponibles habilitados para este proyecto
  const cargarDesarrolladores = useCallback(
    ({ senal }) => (proyecto?.id ? obtenerDesarrolladoresDisponibles(proyecto.id, { senal }) : Promise.resolve([])),
    [proyecto?.id],
  );
  const desarrolladores = usePeticion(cargarDesarrolladores, [proyecto?.id]);
  const listaDesarrolladores = useMemo(() => {
    if (Array.isArray(desarrolladores.datos)) {
      return desarrolladores.datos;
    }
    if (Array.isArray(desarrolladores.datos?.contenido)) {
      return desarrolladores.datos.contenido;
    }
    return [];
  }, [desarrolladores.datos]);

  // Filtrado por buscador (nombre completo o identificación)
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) {
      return listaDesarrolladores;
    }
    return listaDesarrolladores.filter(
      (d) =>
        String(d?.nombreCompleto || '').toLowerCase().includes(q) ||
        String(d?.identificacion || '').toLowerCase().includes(q) ||
        String(d?.profesion || '').toLowerCase().includes(q) ||
        String(d?.especialidadDesarrollo || '').toLowerCase().includes(q),
    );
  }, [listaDesarrolladores, busqueda]);

  const totalSeleccionados = Object.keys(seleccionados).length;

  function alternar(id) {
    setSeleccionados((previos) => {
      const siguientes = { ...previos };
      if (siguientes[id]) {
        delete siguientes[id];
      } else {
        siguientes[id] = true;
      }
      return siguientes;
    });
    setAdvertencias(null);
    setFallo(null);
  }

  async function guardar(confirmado = false) {
    if (totalSeleccionados === 0 || !rolDesarrolladorId || !proyecto?.id) {
      return;
    }

    setGuardando(true);
    setFallo(null);

    const asignaciones = Object.keys(seleccionados).map((id) => ({
      trabajadorId: Number(id),
      rolId: Number(rolDesarrolladorId),
      dedicacionPorcentaje: 100,
    }));

    try {
      const resultado = await asignarEquipoCoordinador(proyecto.id, asignaciones, confirmado);
      const totalNuevas = resultado.asignadas?.length || 0;
      const totalExistentes = resultado.yaExistentes?.length || 0;
      const mensaje =
        totalNuevas > 0
          ? `${totalNuevas} desarrollador${totalNuevas === 1 ? '' : 'es'} asignado${totalNuevas === 1 ? '' : 's'} al proyecto.`
          : 'Las asignaciones ya existían en el proyecto.';
      notificador.exito(mensaje, 'Equipo actualizado');
      alGuardar(resultado);
    } catch (error) {
      if (error.requiereConfirmacion) {
        setAdvertencias(error.advertencias);
        return;
      }
      setFallo(error.message || 'No se pudo guardar la asignación del equipo.');
      notificador.error(error.message || 'No se pudo guardar la asignación del equipo.', 'Error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialogo
      abierto={abierto}
      titulo="Asignar desarrolladores"
      descripcion={`Selecciona los desarrolladores habilitados para asignar a ${proyecto?.nombre || 'el proyecto'}.`}
      alCerrar={guardando ? undefined : alCerrar}
      className={estilos.dialogoAsignacion}
    >
      <div className={estilos.contenidoModal}>
        <section className={estilos.filtros} aria-label="Búsqueda de desarrolladores">
          <div className={estilos.busqueda}>
            <label htmlFor="buscar-desarrollador">
              <Search size={16} aria-hidden="true" />
              <input
                id="buscar-desarrollador"
                type="search"
                value={busqueda}
                onChange={(evento) => {
                  setBusqueda(evento.target.value);
                  setAdvertencias(null);
                }}
                placeholder="Buscar trabajador por nombre o identificación..."
              />
            </label>
          </div>
        </section>

        {fallo && (
          <p className={estilos.error} role="alert">
            {fallo}
          </p>
        )}

        {roles.error && (
          <p className={estilos.error} role="alert">
            No se pudo cargar el catálogo de roles: {roles.error.message}
          </p>
        )}

        <div className={estilos.panelUnico}>
          <section className={estilos.panel} aria-labelledby="desarrolladores-disponibles">
            <h3 id="desarrolladores-disponibles">
              Desarrolladores disponibles ({filtrados.length})
            </h3>

            {desarrolladores.cargando && (
              <EstadoCarga mensaje="Cargando desarrolladores disponibles..." />
            )}

            {!desarrolladores.cargando && desarrolladores.error && (
              <EstadoError
                error={desarrolladores.error}
                alReintentar={desarrolladores.reintentar}
              />
            )}

            {!desarrolladores.cargando &&
              !desarrolladores.error &&
              filtrados.length === 0 && (
                <EstadoVacio
                  mensaje={
                    busqueda
                      ? 'No hay desarrolladores disponibles que coincidan con la búsqueda.'
                      : 'No hay desarrolladores disponibles para asignar en este proyecto.'
                  }
                  icono={Users}
                />
              )}

            {!desarrolladores.cargando && !desarrolladores.error && filtrados.length > 0 && (
              <ul className={estilos.listaTrabajadores}>
                {filtrados.map((trabajador) => {
                  const id = String(trabajador.id);
                  const estaMarcado = Boolean(seleccionados[id]);

                  return (
                    <li key={trabajador.id}>
                      <label className={estilos.trabajador}>
                        <span className={estilos.nombreTrabajador}>
                          <strong>{trabajador.nombreCompleto}</strong>
                          <small>
                            {trabajador.identificacion} · {trabajador.profesion || 'Desarrollador'}
                          </small>
                        </span>
                        <div className={estilos.accionesFila}>
                          <span className={estilos.estadoTrabajador}>Habilitado</span>
                          <input
                            type="checkbox"
                            checked={estaMarcado}
                            disabled={guardando || !rolDesarrolladorId}
                            onChange={() => alternar(id)}
                          />
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {advertencias && (
          <div className={estilos.advertencia} role="alert">
            <strong>Hay asignaciones equivalentes activas:</strong>
            <ul>
              {advertencias.map((advertencia) => (
                <li key={advertencia}>{advertencia}</li>
              ))}
            </ul>
            <p>Al confirmar, se mantendrán las existentes y no se crearán duplicados.</p>
          </div>
        )}

        <footer className={estilos.acciones}>
          <Boton type="button" variante="secundario" disabled={guardando} onClick={alCerrar}>
            Cancelar
          </Boton>
          <Boton
            type="button"
            icono={advertencias ? Check : undefined}
            disabled={
              guardando ||
              totalSeleccionados === 0 ||
              desarrolladores.cargando ||
              roles.cargando ||
              Boolean(roles.error) ||
              !rolDesarrolladorId
            }
            onClick={() => guardar(Boolean(advertencias))}
          >
            {guardando
              ? 'Guardando...'
              : advertencias
                ? 'Confirmar y guardar'
                : `Guardar asignación${totalSeleccionados > 0 ? ` (${totalSeleccionados})` : ''}`}
          </Boton>
        </footer>
      </div>
    </Dialogo>
  );
}
