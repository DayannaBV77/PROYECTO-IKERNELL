import { useCallback, useState } from 'react';
import { Check, Search, UserRoundPlus, X } from 'lucide-react';

import { asignarEquipoCoordinador, ROLES_EN_PROYECTO } from '../../api/asignaciones.js';
import { buscarTrabajadores, ESTADOS_HABILITACION, TIPOS_TRABAJADOR } from '../../api/trabajadores.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Dialogo from '../../componentes/ui/Dialogo.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { usePeticion } from '../../hooks/usePeticion.js';
import { useNotificador } from '../../componentes/ui/Notificador.jsx';
import estilos from './ModalAsignarTrabajadores.module.css';

const TAMANO_PAGINA = 20;
const DEDICACIONES = [
  { valor: '', texto: 'Sin especificar' },
  { valor: '100', texto: '100% (Tiempo completo)' },
  { valor: '50', texto: '50% (Medio tiempo)' },
  { valor: '25', texto: '25% (Disponibilidad parcial)' },
];

export default function ModalAsignarTrabajadores({ abierto, proyecto, alCerrar, alGuardar }) {
  const notificador = useNotificador();
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [pagina, setPagina] = useState(0);
  const [seleccionados, setSeleccionados] = useState({});
  const [advertencias, setAdvertencias] = useState(null);
  const [fallo, setFallo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const consulta = useDebounce(busqueda, 250);

  const cargarTrabajadores = useCallback(
    ({ senal }) =>
      buscarTrabajadores(
        {
          q: consulta,
          tipoTrabajador: tipo,
          estado,
          pagina,
          tamano: TAMANO_PAGINA,
        },
        { senal },
      ),
    [consulta, tipo, estado, pagina],
  );
  const trabajadores = usePeticion(cargarTrabajadores, [consulta, tipo, estado, pagina]);
  const listaTrabajadores = trabajadores.datos?.contenido || [];
  const listaSeleccionados = Object.values(seleccionados);

  function cambiarFiltro(setter, valor) {
    setter(valor);
    setPagina(0);
    setAdvertencias(null);
  }

  function alternar(trabajador) {
    const id = String(trabajador.id);
    if (trabajador.estado !== 'HABILITADO') {
      return;
    }

    setSeleccionados((actuales) => {
      if (actuales[id]) {
        const siguientes = { ...actuales };
        delete siguientes[id];
        return siguientes;
      }
      return {
        ...actuales,
        [id]: {
          trabajador,
          rolEnProyecto: 'DESARROLLADOR',
          dedicacionPorcentaje: '',
        },
      };
    });
    setAdvertencias(null);
    setFallo(null);
  }

  function actualizarSeleccion(id, nombre, valor) {
    setSeleccionados((actuales) => ({
      ...actuales,
      [id]: {
        ...actuales[id],
        [nombre]: nombre === 'dedicacionPorcentaje' && valor ? Number(valor) : valor || null,
      },
    }));
    setAdvertencias(null);
  }

  async function guardar(confirmado = false) {
    setGuardando(true);
    setFallo(null);
    try {
      const resultado = await asignarEquipoCoordinador(
        proyecto.id,
        listaSeleccionados.map(({ trabajador, ...asignacion }) => ({
          trabajadorId: trabajador.id,
          rolEnProyecto: asignacion.rolEnProyecto,
          dedicacionPorcentaje: asignacion.dedicacionPorcentaje || null,
        })),
        confirmado,
      );
      const totalNuevas = resultado.asignadas.length;
      const totalExistentes = resultado.yaExistentes.length;
      const mensaje =
        totalNuevas > 0
          ? `${totalNuevas} asignación${totalNuevas === 1 ? '' : 'es'} registrada${totalNuevas === 1 ? '' : 's'}.${
              totalExistentes ? ` ${totalExistentes} ya existían y no se duplicaron.` : ''
            }`
          : 'Las asignaciones ya existían; no se crearon duplicados.';
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
      titulo="Asignar trabajadores"
      descripcion={`Selecciona trabajadores y define su rol en ${proyecto.nombre}.`}
      alCerrar={guardando ? undefined : alCerrar}
      className={estilos.dialogoAsignacion}
    >
      <div className={estilos.contenidoModal}>
        <section className={estilos.filtros} aria-label="Filtros de búsqueda">
          <div className={estilos.busqueda}>
            <label htmlFor="buscar-trabajador">
              <Search size={16} aria-hidden="true" />
              <input
                id="buscar-trabajador"
                type="search"
                value={busqueda}
                onChange={(evento) => cambiarFiltro(setBusqueda, evento.target.value)}
                placeholder="Buscar por nombre o identificación..."
              />
            </label>
          </div>
          <Campo
            etiqueta="Tipo de trabajador"
            nombre="tipoTrabajadorModal"
            opciones={TIPOS_TRABAJADOR}
            textoVacio="Todos los tipos"
            value={tipo}
            onChange={(evento) => cambiarFiltro(setTipo, evento.target.value)}
          />
          <Campo
            etiqueta="Estado"
            nombre="estadoModal"
            opciones={ESTADOS_HABILITACION}
            textoVacio="Todos los estados"
            value={estado}
            onChange={(evento) => cambiarFiltro(setEstado, evento.target.value)}
          />
        </section>

        {fallo && <p className={estilos.error} role="alert">{fallo}</p>}

        <div className={estilos.paneles}>
          <section className={estilos.panel} aria-labelledby="trabajadores-disponibles">
            <h3 id="trabajadores-disponibles">
              Trabajadores ({trabajadores.datos?.totalElementos ?? 0})
            </h3>
            {trabajadores.cargando && <EstadoCarga mensaje="Buscando trabajadores..." />}
            {!trabajadores.cargando && trabajadores.error && (
              <EstadoError error={trabajadores.error} alReintentar={trabajadores.reintentar} />
            )}
            {!trabajadores.cargando &&
              !trabajadores.error &&
              listaTrabajadores.length === 0 && (
                <EstadoVacio mensaje={trabajadores.datos?.mensaje || 'No hay trabajadores para mostrar.'} />
              )}
            {!trabajadores.cargando && !trabajadores.error && listaTrabajadores.length > 0 && (
              <ul className={estilos.listaTrabajadores}>
                {listaTrabajadores.map((trabajador) => {
                  const id = String(trabajador.id);
                  const deshabilitado = trabajador.estado !== 'HABILITADO';
                  return (
                    <li key={trabajador.id}>
                      <label className={`${estilos.trabajador} ${deshabilitado ? estilos.noDisponible : ''}`}>
                        <input
                          type="checkbox"
                          checked={Boolean(seleccionados[id])}
                          disabled={deshabilitado || guardando}
                          onChange={() => alternar(trabajador)}
                        />
                        <span className={estilos.nombreTrabajador}>
                          <strong>{trabajador.nombreCompleto}</strong>
                          <small>{trabajador.identificacion} · {trabajador.tipoTrabajador}</small>
                        </span>
                        <span className={`${estilos.estadoTrabajador} ${deshabilitado ? estilos.inhabilitado : ''}`}>
                          {deshabilitado ? 'Inhabilitado' : 'Habilitado'}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            {trabajadores.datos?.totalPaginas > 1 && (
              <div className={estilos.paginacion}>
                <button type="button" disabled={pagina === 0 || trabajadores.cargando} onClick={() => setPagina((actual) => actual - 1)}>
                  Anterior
                </button>
                <span>Página {pagina + 1} de {trabajadores.datos.totalPaginas}</span>
                <button
                  type="button"
                  disabled={pagina + 1 >= trabajadores.datos.totalPaginas || trabajadores.cargando}
                  onClick={() => setPagina((actual) => actual + 1)}
                >
                  Siguiente
                </button>
              </div>
            )}
          </section>

          <section className={estilos.panel} aria-labelledby="trabajadores-seleccionados">
            <h3 id="trabajadores-seleccionados">
              Trabajadores seleccionados ({listaSeleccionados.length})
            </h3>
            {listaSeleccionados.length === 0 ? (
              <EstadoVacio mensaje="Selecciona uno o varios trabajadores habilitados." icono={UserRoundPlus} />
            ) : (
              <ul className={estilos.listaSeleccionados}>
                {listaSeleccionados.map(({ trabajador, rolEnProyecto, dedicacionPorcentaje }) => {
                  const id = String(trabajador.id);
                  return (
                    <li key={id} className={estilos.seleccionado}>
                      <span className={estilos.nombreSeleccionado}>{trabajador.nombreCompleto}</span>
                      <Campo
                        etiqueta={`Rol de ${trabajador.nombreCompleto}`}
                        nombre={`rol-${id}`}
                        opciones={ROLES_EN_PROYECTO}
                        textoVacio={null}
                        value={rolEnProyecto}
                        onChange={(evento) => actualizarSeleccion(id, 'rolEnProyecto', evento.target.value)}
                      />
                      <Campo
                        etiqueta={`Dedicación de ${trabajador.nombreCompleto}`}
                        nombre={`dedicacion-${id}`}
                        opciones={DEDICACIONES}
                        textoVacio={null}
                        value={dedicacionPorcentaje ? String(dedicacionPorcentaje) : ''}
                        onChange={(evento) => actualizarSeleccion(id, 'dedicacionPorcentaje', evento.target.value)}
                      />
                      <button
                        className={estilos.quitar}
                        type="button"
                        aria-label={`Quitar a ${trabajador.nombreCompleto}`}
                        disabled={guardando}
                        onClick={() => alternar(trabajador)}
                      >
                        <X size={18} aria-hidden="true" />
                      </button>
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
              {advertencias.map((advertencia) => <li key={advertencia}>{advertencia}</li>)}
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
            disabled={guardando || listaSeleccionados.length === 0 || trabajadores.cargando}
            onClick={() => guardar(Boolean(advertencias))}
          >
            {guardando
              ? 'Guardando...'
              : advertencias
                ? 'Confirmar y guardar'
                : 'Guardar asignación'}
          </Boton>
        </footer>
      </div>
    </Dialogo>
  );
}
