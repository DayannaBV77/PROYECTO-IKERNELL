import { useCallback, useState } from 'react';
import { UserCheck, Users } from 'lucide-react';

import { cambiarLider, obtenerLideresDisponibles } from '../../api/asignaciones.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Dialogo from '../../componentes/ui/Dialogo.jsx';
import { useNotificador } from '../../componentes/ui/Notificador.jsx';
import { usePeticion } from '../../hooks/usePeticion.js';
import estilos from './ModalAsignarTrabajadores.module.css';

export default function ModalCambiarLider({ abierto, proyecto, alCerrar, alLiderCambiado }) {
  const notificador = useNotificador();
  const [nuevoLiderId, setNuevoLiderId] = useState('');
  const [cambiando, setCambiando] = useState(false);
  const [fallo, setFallo] = useState(null);

  const cargarLideres = useCallback(
    ({ senal }) => obtenerLideresDisponibles(proyecto.id, { senal }),
    [proyecto.id],
  );
  const lideres = usePeticion(cargarLideres, [proyecto.id]);
  const disponibles = Array.isArray(lideres.datos)
    ? lideres.datos
    : (lideres.datos?.contenido || []);

  const opciones = disponibles.map((lider) => ({
    valor: String(lider.id),
    texto: `${lider.nombreCompleto} (${lider.identificacion}) - ${lider.profesion || 'Líder'}`,
  }));

  async function alConfirmar(evento) {
    evento.preventDefault();
    if (!nuevoLiderId) {
      setFallo('Debe seleccionar un líder de la lista.');
      return;
    }

    setCambiando(true);
    setFallo(null);

    try {
      await cambiarLider(proyecto.id, Number(nuevoLiderId));
      notificador.exito(
        'El líder del proyecto ha sido modificado exitosamente.',
        'Liderazgo actualizado',
      );
      alLiderCambiado();
    } catch (error) {
      setFallo(error.message || 'No se pudo cambiar el líder del proyecto.');
      notificador.error(error.message || 'No se pudo cambiar el líder del proyecto.', 'Error');
    } finally {
      setCambiando(false);
    }
  }

  return (
    <Dialogo
      abierto={abierto}
      titulo="Cambiar líder del proyecto"
      descripcion={`Asigna un nuevo líder para ${proyecto.nombre}.`}
      alCerrar={cambiando ? undefined : alCerrar}
      className={estilos.dialogoAsignacion}
    >
      <form onSubmit={alConfirmar} className={estilos.contenidoModal}>
        {fallo && (
          <p className={estilos.error} role="alert">
            {fallo}
          </p>
        )}

        {proyecto.liderResponsableNombre && (
          <p style={{ margin: 0, fontSize: 'var(--t-sm)', color: 'var(--c-texto-tenue)' }}>
            <strong>Líder actual:</strong> {proyecto.liderResponsableNombre}
            {proyecto.liderResponsableIdentificacion && ` (${proyecto.liderResponsableIdentificacion})`}
          </p>
        )}

        {lideres.cargando && <EstadoCarga mensaje="Cargando líderes disponibles..." />}

        {!lideres.cargando && lideres.error && (
          <EstadoError error={lideres.error} alReintentar={lideres.reintentar} />
        )}

        {!lideres.cargando && !lideres.error && disponibles.length === 0 && (
          <EstadoVacio
            mensaje="No hay otros líderes habilitados disponibles para asumir este proyecto."
            icono={Users}
          />
        )}

        {!lideres.cargando && !lideres.error && disponibles.length > 0 && (
          <>
            <Campo
              etiqueta="Nuevo líder del proyecto"
              nombre="nuevoLiderId"
              opciones={opciones}
              textoVacio="Seleccione un nuevo líder..."
              obligatorio
              value={nuevoLiderId}
              onChange={(evento) => {
                setNuevoLiderId(evento.target.value);
                setFallo(null);
              }}
            />

            <p style={{ margin: 0, fontSize: 'var(--t-xs)', color: 'var(--c-texto-tenue)' }}>
              El cambio es atómico e inmediato: el nuevo líder asumirá con estado <strong>Activo</strong> y el líder anterior dejará de ser el líder del proyecto, conservando su registro histórico.
            </p>
          </>
        )}

        <footer className={estilos.acciones}>
          <Boton type="button" variante="secundario" disabled={cambiando} onClick={alCerrar}>
            Cancelar
          </Boton>
          <Boton
            type="submit"
            icono={UserCheck}
            disabled={cambiando || !nuevoLiderId || lideres.cargando || Boolean(lideres.error)}
          >
            {cambiando ? 'Cambiando líder...' : 'Confirmar cambio'}
          </Boton>
        </footer>
      </form>
    </Dialogo>
  );
}
