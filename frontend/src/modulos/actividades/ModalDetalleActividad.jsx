import { useCallback, useEffect, useState } from 'react';
import { CircleCheck, Save, TriangleAlert } from 'lucide-react';

import {
  PRIORIDADES_ACTIVIDAD,
  modificarActividad,
  obtenerActividad,
} from '../../api/actividades.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Dialogo from '../../componentes/ui/Dialogo.jsx';
import { useNotificador } from '../../componentes/ui/Notificador.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import { useContextoDeProyecto } from './componentes/useContextoDeProyecto.js';

/**
 * Modal para ver detalle y editar una actividad seleccionada (RF-020, RF-021; HU-13 C05).
 */
export default function ModalDetalleActividad({ actividadId, abierto, alCerrar, alGuardar }) {
  if (!abierto || !actividadId) {
    return null;
  }

  return (
    <Dialogo
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Detalle de la actividad"
      descripcion={`Consulta y ajuste de especificaciones para la actividad #${actividadId}`}
    >
      <ContenidoModalDetalle
        actividadId={actividadId}
        alCerrar={alCerrar}
        alGuardar={alGuardar}
      />
    </Dialogo>
  );
}

function ContenidoModalDetalle({ actividadId, alCerrar, alGuardar }) {
  const notificador = useNotificador();

  const cargar = useCallback(
    ({ senal }) => obtenerActividad(actividadId, { senal }),
    [actividadId],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [actividadId]);

  const [editables, setEditables] = useState({
    etapaId: '',
    descripcion: '',
    prioridad: '',
    fechaPlanificada: '',
  });
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const { opcionesDeEtapa } = useContextoDeProyecto(datos?.proyectoId);

  useEffect(() => {
    if (datos) {
      setEditables({
        etapaId: String(datos.etapaId ?? ''),
        descripcion: datos.descripcion || '',
        prioridad: datos.prioridad || '',
        fechaPlanificada: datos.fechaPlanificada || '',
      });
      setErrores({});
      setFallo(null);
    }
  }, [datos]);

  if (cargando) {
    return <EstadoCarga mensaje="Cargando información de la actividad..." />;
  }

  if (error) {
    return <EstadoError error={error} alReintentar={reintentar} />;
  }

  if (!datos) {
    return null;
  }

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setEditables((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }

  async function procesarGuardado(evento) {
    evento.preventDefault();
    setGuardando(true);
    setFallo(null);
    setErrores({});

    try {
      const peticion = {
        ...editables,
        etapaId: editables.etapaId ? Number(editables.etapaId) : null,
      };
      await modificarActividad(actividadId, peticion);
      notificador.exito('Los cambios en la actividad se guardaron exitosamente.', 'Actividad actualizada');
      alGuardar?.();
      alCerrar();
    } catch (err) {
      if (err.campos) {
        setErrores(err.campos);
      }
      setFallo(err.message || 'No se pudo actualizar la actividad.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={procesarGuardado} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
      {fallo && (
        <p className={estilos.avisoError} role="alert" style={{ margin: 0 }}>
          <TriangleAlert size={18} aria-hidden="true" />
          {fallo}
        </p>
      )}

      {/* Información fija de contexto */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
        padding: '0.85rem 1rem',
        borderRadius: '8px',
        backgroundColor: 'var(--c-fondo-franja, #f8fafc)',
        border: '1px solid var(--c-borde, #e2e8f0)',
        fontSize: '0.85rem',
      }}>
        <div>
          <span style={{ color: 'var(--c-texto-tenue, #64748b)', display: 'block' }}>Proyecto</span>
          <strong>{datos.proyectoNombre || `Proyecto #${datos.proyectoId}`}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--c-texto-tenue, #64748b)', display: 'block' }}>Desarrollador asignado</span>
          <strong>{datos.desarrolladorNombreCompleto || 'Sin desarrollador'}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--c-texto-tenue, #64748b)', display: 'block' }}>Estado</span>
          <strong>{datos.estado || 'PENDIENTE'}</strong>
        </div>
      </div>

      {/* Campos editables */}
      <Campo
        etiqueta="Descripción de la actividad"
        nombre="descripcion"
        area
        rows={3}
        obligatorio
        value={editables.descripcion}
        onChange={alCambiar}
        error={errores.descripcion}
      />

      <div className={estilos.criterios}>
        <Campo
          etiqueta="Etapa del proyecto"
          nombre="etapaId"
          opciones={opcionesDeEtapa}
          obligatorio
          value={editables.etapaId}
          onChange={alCambiar}
          error={errores.etapaId}
        />
        <Campo
          etiqueta="Prioridad"
          nombre="prioridad"
          opciones={PRIORIDADES_ACTIVIDAD}
          textoVacio="Sin prioridad asignada"
          value={editables.prioridad}
          onChange={alCambiar}
          error={errores.prioridad}
        />
      </div>

      <div className={estilos.criterios}>
        <Campo
          etiqueta="Fecha planificada"
          nombre="fechaPlanificada"
          tipo="date"
          value={editables.fechaPlanificada}
          onChange={alCambiar}
          error={errores.fechaPlanificada}
        />
      </div>

      <div className={estilos.accionesBuscador} style={{ marginTop: '0.5rem' }}>
        <Boton type="submit" icono={Save} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </Boton>
        <Boton
          type="button"
          variante="texto"
          onClick={alCerrar}
          disabled={guardando}
        >
          Cerrar
        </Boton>
      </div>
    </form>
  );
}
