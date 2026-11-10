import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
} from 'lucide-react';

import { ETIQUETA_TIPO } from '../../api/autenticacion.js';
import {
  ESTADOS_HABILITACION,
  TIPOS_TRABAJADOR,
  buscarTrabajadores,
} from '../../api/trabajadores.js';
import { PROFESIONES } from './catalogoProfesiones.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import EtiquetaEstado from '../../componentes/ui/EtiquetaEstado.jsx';
import PaginacionTabla from '../../componentes/ui/PaginacionTabla.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';

const OPCIONES_PROFESIONES = [
  { valor: '', texto: 'Todas las profesiones' },
  ...PROFESIONES.map((profesion) => ({ valor: profesion, texto: profesion })),
];

const SIN_CRITERIOS = {
  q: '',
  profesion: '',
  especialidadDesarrollo: '',
  tipoTrabajador: '',
  estado: '',
};

/** Milisegundos de espera tras el ultimo cambio antes de lanzar la busqueda. */
const RETARDO_MS = 400;

export default function PaginaTrabajadores() {
  const [busquedaGeneral, setBusquedaGeneral] = useState('');
  const [borrador, setBorrador] = useState(SIN_CRITERIOS);
  const [criterios, setCriterios] = useState(SIN_CRITERIOS);
  const [pagina, setPagina] = useState(0);
  const [tamano, setTamano] = useState(10);
  const [mostrarMasFiltros, setMostrarMasFiltros] = useState(false);

  const temporizador = useRef(null);

  /**
   * Aplica los criterios actuales con un retardo (debounce).
   * Se llama cada vez que cambia busquedaGeneral o cualquier campo del borrador.
   */
  function aplicarConRetardo(nuevaBusqueda, nuevoBorrador) {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      setCriterios({
        ...nuevoBorrador,
        q: nuevaBusqueda.trim(),
      });
      setPagina(0);
    }, RETARDO_MS);
  }

  function alCambiarBusqueda(e) {
    const valor = e.target.value;
    setBusquedaGeneral(valor);
    aplicarConRetardo(valor, borrador);
  }

  function alCambiar(evento) {
    const { name, value } = evento.target;
    const nuevoBorrador = { ...borrador, [name]: value };
    setBorrador(nuevoBorrador);
    aplicarConRetardo(busquedaGeneral, nuevoBorrador);
  }

  function alLimpiar() {
    clearTimeout(temporizador.current);
    setBusquedaGeneral('');
    setBorrador(SIN_CRITERIOS);
    setCriterios(SIN_CRITERIOS);
    setPagina(0);
  }

  function alCambiarTamano(nuevoTamano) {
    setTamano(nuevoTamano);
    setPagina(0);
  }

  /* Limpia el temporizador al desmontar el componente. */
  useEffect(() => () => clearTimeout(temporizador.current), []);

  const cargar = useCallback(
    ({ senal }) => buscarTrabajadores({ ...criterios, pagina, tamano }, { senal }),
    [criterios, pagina, tamano],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [criterios, pagina, tamano]);

  const resultados = datos?.contenido || [];

  return (
    <Seccion
      titulo="Trabajadores"
      descripcion="Busque un trabajador por uno o varios datos y abra su perfil."
      id="trabajadores"
    >
      <div className={estilos.barraSuperior}>
        <Boton a="/app/trabajadores/nuevo" icono={UserPlus}>
          Registrar trabajador
        </Boton>
      </div>

      <div className={estilos.buscador}>
        {/* Campo de búsqueda general */}
        <div className={estilos.filtroCampoGeneral}>
          <label className={estilos.filtroEtiqueta} htmlFor="busquedaGeneral">
            Buscar por nombre, apellido o identificación
          </label>
          <div className={estilos.filtroInputIcono}>
            <Search size={16} className={estilos.filtroIconoBusqueda} aria-hidden="true" />
            <input
              id="busquedaGeneral"
              className={estilos.filtroInput}
              type="text"
              placeholder="Escriba un nombre, apellido o número de documento..."
              value={busquedaGeneral}
              onChange={alCambiarBusqueda}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Fila de selectores: tipo y estado */}
        <div className={estilos.filtroFilaDoble}>
          <Campo
            etiqueta="Tipo de trabajador"
            nombre="tipoTrabajador"
            opciones={TIPOS_TRABAJADOR}
            textoVacio="Todos los roles"
            value={borrador.tipoTrabajador}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Estado"
            nombre="estado"
            opciones={ESTADOS_HABILITACION}
            textoVacio="Todos los estados"
            value={borrador.estado}
            onChange={alCambiar}
          />
        </div>

        {/* Toggle más filtros */}
        <button
          type="button"
          className={estilos.filtroToggle}
          onClick={() => setMostrarMasFiltros((v) => !v)}
          aria-expanded={mostrarMasFiltros}
        >
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span>{mostrarMasFiltros ? 'Ocultar filtros adicionales' : 'Más filtros'}</span>
          {mostrarMasFiltros
            ? <ChevronUp size={15} aria-hidden="true" />
            : <ChevronDown size={15} aria-hidden="true" />}
        </button>

        {/* Filtros adicionales colapsables */}
        {mostrarMasFiltros && (
          <div className={estilos.filtroFilaDoble}>
            <Campo
              etiqueta="Profesión"
              nombre="profesion"
              opciones={OPCIONES_PROFESIONES}
              textoVacio="Todas las profesiones"
              value={borrador.profesion}
              onChange={alCambiar}
            />
            <Campo
              etiqueta="Especialidad de desarrollo"
              nombre="especialidadDesarrollo"
              placeholder="Ej. Backend, React"
              value={borrador.especialidadDesarrollo}
              onChange={alCambiar}
            />
          </div>
        )}

        {/* Solo botón Limpiar */}
        <div className={estilos.filtroAcciones}>
          <button
            type="button"
            className={estilos.filtroBtnLimpiar}
            onClick={alLimpiar}
            disabled={cargando}
          >
            <RotateCcw size={15} aria-hidden="true" />
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Conteo de resultados */}
      {!cargando && !error && datos && resultados.length > 0 && (
        <p className={estilos.filtroConteo}>
          {datos.totalElementos ?? resultados.length}{' '}
          {(datos.totalElementos ?? resultados.length) === 1
            ? 'trabajador encontrado'
            : 'trabajadores encontrados'}
        </p>
      )}

      {cargando && <EstadoCarga mensaje="Buscando trabajadores..." />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {/* C02: un aviso explicito, redactado por el servidor, no una lista vacia. */}
      {!cargando && !error && resultados.length === 0 && (
        <EstadoVacio
          mensaje={
            datos?.mensaje || 'No hay trabajadores que coincidan con los criterios indicados.'
          }
          icono={Users}
        />
      )}

      {!cargando && !error && resultados.length > 0 && (
        <>
          <div className={estilos.tablaEnvoltorio}>
            <table className={estilos.tabla}>
              <caption className="solo-lectores">
                Resultados de la busqueda de trabajadores
              </caption>
              <thead>
                <tr>
                  <th scope="col">Identificacion</th>
                  <th scope="col">Trabajador</th>
                  <th scope="col">Profesion</th>
                  <th scope="col">Especialidad</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="solo-lectores">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((trabajador) => (
                  <tr key={trabajador.id}>
                    <td>{trabajador.identificacion}</td>
                    <th scope="row" className={estilos.celdaNombre}>
                      {trabajador.nombreCompleto}
                    </th>
                    <td>{trabajador.profesion}</td>
                    <td>{trabajador.especialidadDesarrollo}</td>
                    <td>{ETIQUETA_TIPO[trabajador.tipoTrabajador] || trabajador.tipoTrabajador}</td>
                    <td>
                      <EtiquetaEstado estado={trabajador.estado} />
                    </td>
                    <td>
                      <Link className={estilos.abrir} to={`/app/trabajadores/${trabajador.id}`}>
                        <span>Ver perfil</span>
                        <ArrowRight size={13} aria-hidden="true" />
                        <span className="solo-lectores"> de {trabajador.nombreCompleto}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginacionTabla
            datos={datos}
            pagina={pagina}
            alCambiarPagina={setPagina}
            tamano={tamano}
            alCambiarTamano={alCambiarTamano}
            etiquetaItem="trabajadores"
          />
        </>
      )}
    </Seccion>
  );
}
