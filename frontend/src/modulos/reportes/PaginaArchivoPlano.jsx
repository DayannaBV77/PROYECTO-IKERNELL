import { useCallback, useState } from 'react';
import {
  CircleCheck,
  Download,
  FileCode2,
  FileDown,
  FileSpreadsheet,
  FileText,
  Mail,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

import {
  listarProyectosAutorizados,
  listarConfiguracionReporte,
  descargarArchivoPlano,
  enviarArchivoPlanoPorCorreo,
} from '../../api/reportes.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import estilosArchivo from './PaginaArchivoPlano.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';

const OPCIONES_FORMATO = [
  {
    id: 'PDF',
    nombre: 'Documento PDF',
    extension: '.pdf',
    icono: FileText,
    claseIcono: estilosArchivo.iconoPdf,
    descripcion: 'Informe ejecutivo formal estructurado en apaisado para auditoría, gerencia e impresión.',
    detalle: 'Formato visual listo para presentación',
  },
  {
    id: 'CSV',
    nombre: 'Excel / CSV',
    extension: '.csv',
    icono: FileSpreadsheet,
    claseIcono: estilosArchivo.iconoExcel,
    descripcion: 'Matriz compatible con Microsoft Excel, Google Sheets, Power BI y análisis tabular.',
    detalle: 'Campos normalizados con delimitación estándar',
  },
  {
    id: 'TXT',
    nombre: 'Archivo Plano',
    extension: '.txt',
    icono: FileCode2,
    claseIcono: estilosArchivo.iconoPlano,
    descripcion: 'Estructura por bloques de registros para ingesta rápida de bases de datos y migración.',
    detalle: 'Codificación UTF-8 sin dependencias visuales',
  },
];

/**
 * Archivo plano y reportes consolidados para la empresa aliada (RF-025, HU-19).
 *
 * Reservado al líder de proyecto. Permite seleccionar proyectos específicos
 * o exportar todos los autorizados. Soporta generación en PDF ejecutivo,
 * Excel / CSV analítico y archivo plano TXT.
 */
export default function PaginaArchivoPlano() {
  const [seleccion, setSeleccion] = useState([]);
  const [formato, setFormato] = useState('PDF');
  const [generando, setGenerando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);

  const cargar = useCallback(({ senal }) => listarProyectosAutorizados({ senal }), []);
  const cargarConfiguracion = useCallback(({ senal }) => listarConfiguracionReporte({ senal }), []);
  const { datos, error, cargando, reintentar } = usePeticion(cargar, []);
  const { datos: configuracion } = usePeticion(cargarConfiguracion, []);

  const proyectos = datos || [];
  const envioCorreoHabilitado = Boolean(configuracion?.correoHabilitado && configuracion?.correoDestinatario);
  const seleccionados = proyectos.filter((proyecto) => seleccion.includes(proyecto.id));
  const todosSeleccionados = proyectos.length > 0 && seleccion.length === proyectos.length;
  const estadoReporte = (proyecto) =>
    proyecto.tieneDatosEjecucion ? 'con datos de ejecución' : 'sin datos de ejecución';

  function alMarcar(id) {
    setSeleccion((previos) =>
      previos.includes(id) ? previos.filter((otro) => otro !== id) : [...previos, id],
    );
    setConfirmado(null);
    setFallo(null);
  }

  function alMarcarTodos() {
    if (todosSeleccionados) {
      setSeleccion([]);
    } else {
      setSeleccion(proyectos.map((proyecto) => proyecto.id));
    }
    setConfirmado(null);
    setFallo(null);
  }

  async function alGenerar() {
    setGenerando(true);
    setFallo(null);
    setConfirmado(null);

    try {
      const { nombre, blob } = await descargarArchivoPlano(seleccion, formato);

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
        `El archivo "${nombre}" se generó y descargó exitosamente en formato ${formato} con ${
          seleccion.length === 0 ? 'todos los proyectos autorizados' : `${seleccion.length} proyecto(s)`
        }.`,
      );
    } catch (fallaApi) {
      setFallo(fallaApi.message || 'Ocurrió un error al generar el archivo solicitado.');
    } finally {
      setGenerando(false);
    }
  }

  async function alEnviarPorCorreo() {
    setEnviando(true);
    setFallo(null);
    setConfirmado(null);

    try {
      const respuesta = await enviarArchivoPlanoPorCorreo(seleccion, formato);
      setConfirmado(respuesta?.mensaje || 'El archivo fue enviado por correo correctamente.');
    } catch (fallaApi) {
      setFallo(fallaApi.message || 'No se pudo enviar el archivo por correo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Seccion
      titulo="Archivo plano para la empresa aliada"
      descripcion="Información consolidada de proyectos y ejecución operativa para entrega formal o integración analítica."
      id="archivo-plano"
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

      {cargando && <EstadoCarga mensaje="Cargando los proyectos autorizados..." />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {!cargando && !error && proyectos.length === 0 && (
        <EstadoVacio mensaje={datos?.mensaje || 'No hay proyectos autorizados para el reporte.'} icono={FileDown} />
      )}

      {!cargando && !error && proyectos.length > 0 && (
        <>
          <div>
            <p className={estilos.rotulo}>Formato de exportación</p>
            <div className={estilosArchivo.selectorFormatos} role="radiogroup" aria-label="Formatos de exportación">
              {OPCIONES_FORMATO.map((opc) => {
                const IconoComp = opc.icono;
                const estaActivo = formato === opc.id;
                return (
                  <div
                    key={opc.id}
                    className={`${estilosArchivo.tarjetaFormato} ${estaActivo ? estilosArchivo.activa : ''} ${
                      generando ? estilosArchivo.deshabilitada : ''
                    }`}
                    onClick={() => !generando && setFormato(opc.id)}
                    role="radio"
                    aria-checked={estaActivo}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if ((e.key === ' ' || e.key === 'Enter') && !generando) {
                        e.preventDefault();
                        setFormato(opc.id);
                      }
                    }}
                  >
                    <div className={estilosArchivo.cabeceraTarjeta}>
                      <div className={`${estilosArchivo.iconoContenedor} ${opc.claseIcono}`}>
                        <IconoComp size={22} aria-hidden="true" />
                      </div>
                      <div className={estilosArchivo.indicadorSeleccion}>
                        {estaActivo && <div className={estilosArchivo.puntoSeleccion} />}
                      </div>
                    </div>

                    <p className={estilosArchivo.tituloFormato}>
                      {opc.nombre}
                      <span className={estilosArchivo.badgeExt}>{opc.extension}</span>
                    </p>
                    <p className={estilosArchivo.descripcionFormato}>{opc.descripcion}</p>

                    <div className={estilosArchivo.detalleTecnico}>
                      <ShieldCheck size={14} aria-hidden="true" />
                      <span>{opc.detalle}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '1.75rem' }}>
            <p className={estilos.rotulo}>Proyectos a incluir</p>
            <p className={estilos.notaDialogo}>
              Sin marcar ninguno se incluyen todos los autorizados: su historial se
              conserva y lo que se procesa y reporta es la ejecución registrada.
            </p>
            <div className={estilos.accionesBuscador} style={{ marginTop: '0.75rem' }}>
              <Boton onClick={alMarcarTodos} disabled={generando || enviando}>
                {todosSeleccionados ? 'Quitar todos' : 'Seleccionar todos los proyectos'}
              </Boton>
            </div>
          </div>

          <ul className={estilos.candidatos}>
            {proyectos.map((proyecto) => (
              <li key={proyecto.id}>
                <label className={estilos.candidato}>
                  <input
                    type="checkbox"
                    checked={seleccion.includes(proyecto.id)}
                    onChange={() => alMarcar(proyecto.id)}
                    disabled={generando || enviando}
                  />
                  <span>
                    <span className={estilos.candidatoNombre}>{proyecto.nombre}</span>
                    <span className={estilos.candidatoDetalle}>
                      n.º {proyecto.id} ·{' '}
                      {proyecto.estadoHabilitacion === 'INHABILITADO'
                        ? 'inhabilitado'
                        : 'habilitado'}
                    </span>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '0.35rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: 'var(--c-exito-fondo)',
                        color: 'var(--c-exito-texto)',
                        border: '1px solid var(--c-exito)',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        letterSpacing: '0.02em',
                      }}
                    >
                      Autorizado para reporte externo · {estadoReporte(proyecto)}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: '1.25rem', padding: '0.9rem 1.15rem', background: 'var(--c-fondo-franja)', border: '1px solid var(--c-borde)', borderRadius: '0.85rem' }}>
            <p className={estilos.rotulo}>Resumen de generación</p>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', color: 'var(--c-texto-principal)' }}>
              {seleccion.length === 0
                ? `Se exportarán todos los proyectos autorizados (${proyectos.length}) en formato ${formato}.`
                : `${seleccion.length} de ${proyectos.length} proyecto(s) seleccionados: ${seleccionados
                    .map((proyecto) => proyecto.nombre)
                    .join(', ')}`}
            </p>
          </div>

          <div className={estilos.accionesBuscador} style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <Boton icono={Download} onClick={alGenerar} disabled={generando || enviando}>
              {generando ? `Generando ${formato}...` : `Generar y descargar (${formato})`}
            </Boton>
            {envioCorreoHabilitado && (
              <Boton icono={Mail} onClick={alEnviarPorCorreo} disabled={generando || enviando}>
                {enviando ? 'Enviando por correo...' : 'Enviar por correo'}
              </Boton>
            )}
          </div>
        </>
      )}
    </Seccion>
  );
}
