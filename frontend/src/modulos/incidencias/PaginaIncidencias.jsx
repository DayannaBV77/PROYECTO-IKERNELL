import { useCallback, useMemo, useState } from 'react';
import { Bug, CheckCircle2, PauseCircle, Save } from 'lucide-react';

import { obtenerMisProyectos } from '../../api/asignaciones.js';
import {
  ETIQUETA_UNIDAD,
  etiquetaDeFase,
  obtenerMisErrores,
  obtenerMisInterrupciones,
  registrarError,
} from '../../api/incidencias.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import PaginacionTabla from '../../componentes/ui/PaginacionTabla.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import { useNotificador } from '../../componentes/ui/Notificador.jsx';
import { useEtapasDeProyecto } from '../../hooks/useEtapasDeProyecto.js';
import { usePaginacionLocal } from '../../hooks/usePaginacionLocal.js';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';
import FormularioDeInterrupcion from './componentes/FormularioDeInterrupcion.jsx';
import estilos from './PaginaIncidencias.module.css';

const SEVERIDADES = [
  { valor: 'BAJA', texto: 'Baja' },
  { valor: 'MEDIA', texto: 'Media' },
  { valor: 'ALTA', texto: 'Alta' },
  { valor: 'CRITICA', texto: 'Crítica' },
];

const ERROR_VACIO = {
  proyectoId: '',
  etapaId: '',
  tipoError: '',
  severidad: 'MEDIA',
  fecha: '',
  descripcion: '',
};

function hoyLocal() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/**
 * Módulo de Registro y Seguimiento de Incidencias (RF-023, RF-024; HU-17, HU-18).
 */
export default function PaginaIncidencias() {
  const [tabActiva, setTabActiva] = useState('errores'); // 'errores' | 'interrupciones'
  const [recargaHistorial, setRecargaHistorial] = useState(0);

  const cargarProyectos = useCallback(({ senal }) => obtenerMisProyectos({ senal }), []);
  const misProyectos = usePeticion(cargarProyectos, []);

  const cargarMisErrores = useCallback(({ senal }) => obtenerMisErrores({ senal }), []);
  const misErroresReq = usePeticion(cargarMisErrores, [recargaHistorial]);

  const cargarMisInterrupciones = useCallback(
    ({ senal }) => obtenerMisInterrupciones({ senal }),
    [],
  );
  const misInterrupcionesReq = usePeticion(cargarMisInterrupciones, [recargaHistorial]);

  const proyectos = (misProyectos.datos?.contenido || [])
    .filter(({ roles }) => roles.includes('DESARROLLADOR'))
    .map(({ proyectoId, proyectoNombre, estadoHabilitacion }) => ({
      valor: String(proyectoId),
      texto:
        estadoHabilitacion === 'INHABILITADO'
          ? `${proyectoNombre} (inhabilitado)`
          : proyectoNombre,
    }));

  const incidenciasRecientes = useMemo(() => {
    const listaErrores = (misErroresReq.datos?.contenido || []).map((e) => ({
      clave: `err-${e.id}`,
      id: e.id,
      clase: 'DEFECTO',
      fecha: e.fecha || '',
      proyecto: e.proyectoNombre || 'Proyecto',
      etapa: etiquetaDeFase(e) || 'Sin etapa',
      resumen: e.tipoError,
      detalle: e.descripcion || 'Sin descripción adicional',
    }));

    const listaInterrupciones = (misInterrupcionesReq.datos?.contenido || []).map((i) => ({
      clave: `int-${i.id}`,
      id: i.id,
      clase: 'INTERRUPCION',
      fecha: i.fecha || '',
      proyecto: i.proyectoNombre || 'Proyecto',
      etapa: etiquetaDeFase(i) || 'Sin etapa',
      resumen: i.tipoInterrupcion,
      detalle: `${i.duracionValor} ${ETIQUETA_UNIDAD[i.duracionUnidad] || i.duracionUnidad}`,
    }));

    return [...listaErrores, ...listaInterrupciones].sort((a, b) => {
      if (a.fecha !== b.fecha) return (b.fecha || '').localeCompare(a.fecha || '');
      return b.id - a.id;
    });
  }, [misErroresReq.datos, misInterrupcionesReq.datos]);

  const {
    itemsPaginados: incidenciasPaginadas,
    datosPaginacion,
    pagina,
    setPagina,
    tamano,
    alCambiarTamano,
  } = usePaginacionLocal(incidenciasRecientes, {
    clavePersistencia: 'mis-incidencias-v1',
    tamanoInicial: 5,
  });

  const cargando = misProyectos.cargando;
  const error = misProyectos.error;

  return (
    <Seccion
      titulo="Errores e Interrupciones"
      descripcion="Registre defectos técnicos o bloqueos operativos y consulte su historial reciente."
      id="incidencias"
    >
      {cargando && <EstadoCarga mensaje="Cargando sus proyectos..." />}

      {!cargando && error && (
        <EstadoError error={error} alReintentar={misProyectos.reintentar} />
      )}

      {!cargando && !error && proyectos.length === 0 && (
        <EstadoVacio
          mensaje="No tiene asignaciones activas como desarrollador para registrar incidencias."
          icono={Bug}
        />
      )}

      {!cargando && !error && proyectos.length > 0 && (
        <div className={estilos.contenedor}>
          <div className={estilos.tabsBarra} role="tablist" aria-label="Tipo de incidencia">
            <button
              type="button"
              role="tab"
              aria-selected={tabActiva === 'errores'}
              data-testid="tab-errores"
              className={`${estilos.tabBoton} ${tabActiva === 'errores' ? estilos.tabActiva : ''}`}
              onClick={() => setTabActiva('errores')}
            >
              <Bug size={16} aria-hidden="true" />
              <span>Errores de Software (RF-023)</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={tabActiva === 'interrupciones'}
              data-testid="tab-interrupciones"
              className={`${estilos.tabBoton} ${tabActiva === 'interrupciones' ? estilos.tabActiva : ''}`}
              onClick={() => setTabActiva('interrupciones')}
            >
              <PauseCircle size={16} aria-hidden="true" />
              <span>Interrupciones (RF-024)</span>
            </button>
          </div>

          {tabActiva === 'errores' ? (
            <FormularioDeError
              proyectos={proyectos}
              alRegistrar={() => setRecargaHistorial((n) => n + 1)}
            />
          ) : (
            <FormularioDeInterrupcion
              proyectos={proyectos}
              alRegistrar={() => setRecargaHistorial((n) => n + 1)}
            />
          )}

          <section className={estilos.panelHistorial} data-testid="incidencias-recientes-tabla">
            <div className={estilos.historialCabecera}>
              <div>
                <h2 className={estilos.historialTitulo}>Mis incidencias recientes</h2>
                <span className={estilos.historialSub}>
                  {incidenciasRecientes.length} registro(s) documentados
                </span>
              </div>
            </div>

            {incidenciasRecientes.length === 0 ? (
              <EstadoVacio
                icono={CheckCircle2}
                mensaje="Aún no ha registrado errores ni interrupciones."
              />
            ) : (
              <>
                <div className={estilos.tablaWrap}>
                  <table className={estilos.tabla}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Proyecto y Etapa</th>
                        <th>Tipo</th>
                        <th>Detalle / Duración</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidenciasPaginadas.map((item) => (
                        <tr key={item.clave}>
                          <td>{item.fecha ? formatearFecha(item.fecha) : 'Hoy'}</td>
                          <td>
                            <strong>{item.proyecto}</strong>
                            <div className={estilos.historialSub}>{item.etapa}</div>
                          </td>
                          <td>
                            <span
                              className={`${estilos.badgeTipo} ${
                                item.clase === 'DEFECTO'
                                  ? estilos.badgeDefecto
                                  : estilos.badgeInterrupcion
                              }`}
                            >
                              {item.clase === 'DEFECTO' ? (
                                <Bug size={12} aria-hidden="true" />
                              ) : (
                                <PauseCircle size={12} aria-hidden="true" />
                              )}
                              <span>{item.clase === 'DEFECTO' ? 'Defecto' : 'Interrupción'}</span>
                            </span>
                          </td>
                          <td>
                            <strong>{item.resumen}</strong>
                            <div className={estilos.historialSub}>{item.detalle}</div>
                          </td>
                          <td>
                            <span className={`${estilos.badgeTipo} ${estilos.badgeRegistrado}`}>
                              Registrado
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PaginacionTabla
                  datos={datosPaginacion}
                  pagina={pagina}
                  tamano={tamano}
                  etiquetaItem="incidencias"
                  opcionesTamano={[5, 10, 25]}
                  alCambiarPagina={setPagina}
                  alCambiarTamano={alCambiarTamano}
                />
              </>
            )}
          </section>
        </div>
      )}
    </Seccion>
  );
}

function FormularioDeError({ proyectos, alRegistrar }) {
  const notificador = useNotificador();
  const [valores, setValores] = useState(() => ({ ...ERROR_VACIO, fecha: hoyLocal() }));
  const { opcionesDeEtapa } = useEtapasDeProyecto(valores.proyectoId);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setValores((previos) => ({
      ...previos,
      [name]: value,
      ...(name === 'proyectoId' ? { etapaId: '' } : {}),
    }));
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
  }

  function validar() {
    const e = {};
    if (!valores.proyectoId) e.proyectoId = 'Seleccione el proyecto.';
    if (!valores.etapaId) e.etapaId = 'Seleccione la etapa del proyecto.';
    if (!valores.tipoError.trim()) e.tipoError = 'Indique el tipo de defecto.';
    if (valores.fecha && valores.fecha > hoyLocal()) {
      e.fecha = 'La fecha no puede ser posterior a hoy.';
    }
    if (!valores.descripcion.trim() || valores.descripcion.trim().length < 5) {
      e.descripcion = 'Describa el defecto (mínimo 5 caracteres).';
    }
    return e;
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    const e = validar();
    if (Object.keys(e).length > 0) {
      setErrores(e);
      return;
    }

    setGuardando(true);
    try {
      const descripcionConSeveridad = `[Severidad: ${valores.severidad}] ${valores.descripcion.trim()}`;
      await registrarError(valores.proyectoId, {
        tipoError: valores.tipoError.trim(),
        etapaId: Number(valores.etapaId),
        descripcion: descripcionConSeveridad,
        fecha: valores.fecha || hoyLocal(),
      });
      notificador.exito('Defecto técnico registrado correctamente.', 'Defecto guardado');
      setValores({
        ...ERROR_VACIO,
        proyectoId: valores.proyectoId,
        fecha: hoyLocal(),
      });
      setErrores({});
      if (alRegistrar) alRegistrar();
    } catch (err) {
      if (err.campos) setErrores(err.campos);
      notificador.error(err.message || 'No se pudo registrar el defecto.', 'Error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className={estilos.fichaFormulario} onSubmit={alEnviar} noValidate data-testid="form-registrar-error">
      <div className={estilos.gridCampos}>
        <Campo
          etiqueta="Proyecto"
          nombre="proyectoId"
          obligatorio
          opciones={proyectos}
          textoVacio="Seleccione un proyecto"
          value={valores.proyectoId}
          onChange={alCambiar}
          error={errores.proyectoId}
        />

        <Campo
          etiqueta="Etapa del proyecto"
          nombre="etapaId"
          obligatorio
          opciones={opcionesDeEtapa}
          textoVacio={valores.proyectoId ? 'Seleccione la etapa' : 'Elija primero un proyecto'}
          value={valores.etapaId}
          onChange={alCambiar}
          disabled={!valores.proyectoId}
          error={errores.etapaId}
        />

        <Campo
          etiqueta="Tipo de defecto"
          nombre="tipoError"
          obligatorio
          placeholder="Ej: Bug de lógica, Fallo SQL, Error de UI"
          value={valores.tipoError}
          onChange={alCambiar}
          error={errores.tipoError}
        />

        <Campo
          etiqueta="Fecha de detección"
          nombre="fecha"
          tipo="date"
          max={hoyLocal()}
          value={valores.fecha}
          onChange={alCambiar}
          error={errores.fecha}
        />
      </div>

      <div className={estilos.severidadGrupo}>
        <span className={estilos.microEtiqueta}>Severidad</span>
        <div className={estilos.severidadPildoras}>
          {SEVERIDADES.map((sev) => (
            <button
              key={sev.valor}
              type="button"
              className={`${estilos.severidadBtn} ${
                valores.severidad === sev.valor ? estilos.severidadActiva : ''
              }`}
              onClick={() => setValores((prev) => ({ ...prev, severidad: sev.valor }))}
            >
              {sev.texto}
            </button>
          ))}
        </div>
      </div>

      <Campo
        etiqueta="Descripción y pasos para reproducir"
        nombre="descripcion"
        area
        obligatorio
        placeholder="Describa brevemente el comportamiento inesperado..."
        value={valores.descripcion}
        onChange={alCambiar}
        error={errores.descripcion}
      />

      <div className={estilos.accionesForm}>
        <Boton type="submit" variante="primario" icono={Save} disabled={guardando} data-testid="btn-registrar-defecto">
          {guardando ? 'Registrando...' : 'Registrar Defecto'}
        </Boton>
      </div>
    </form>
  );
}
