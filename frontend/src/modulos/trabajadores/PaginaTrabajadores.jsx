import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RotateCcw, Search, UserPlus, Users } from 'lucide-react';

import { ETIQUETA_TIPO } from '../../api/autenticacion.js';
import {
  ESTADOS_HABILITACION,
  TIPOS_TRABAJADOR,
  buscarTrabajadores,
} from '../../api/trabajadores.js';
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

const SIN_CRITERIOS = {
  identificacion: '',
  nombre: '',
  apellido: '',
  profesion: '',
  especialidadDesarrollo: '',
  tipoTrabajador: '',
  estado: '',
};

export default function PaginaTrabajadores() {
  const [borrador, setBorrador] = useState(SIN_CRITERIOS);
  const [criterios, setCriterios] = useState(SIN_CRITERIOS);
  const [pagina, setPagina] = useState(0);
  const [tamano, setTamano] = useState(10);

  const cargar = useCallback(
    ({ senal }) => buscarTrabajadores({ ...criterios, pagina, tamano }, { senal }),
    [criterios, pagina, tamano],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [criterios, pagina, tamano]);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setBorrador((previos) => ({ ...previos, [name]: value }));
  }

  function alBuscar(evento) {
    evento.preventDefault();
    setCriterios(borrador);
    setPagina(0);
  }

  function alLimpiar() {
    setBorrador(SIN_CRITERIOS);
    setCriterios(SIN_CRITERIOS);
    setPagina(0);
  }

  function alCambiarTamano(nuevoTamano) {
    setTamano(nuevoTamano);
    setPagina(0);
  }

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

      <form className={estilos.buscador} onSubmit={alBuscar}>
        <div className={estilos.criterios}>
          <Campo
            etiqueta="Nº Identificación"
            nombre="identificacion"
            placeholder="Buscar por documento..."
            value={borrador.identificacion}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Nombre"
            nombre="nombre"
            placeholder="Buscar por nombre..."
            value={borrador.nombre}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Apellido"
            nombre="apellido"
            placeholder="Buscar por apellido..."
            value={borrador.apellido}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Profesión"
            nombre="profesion"
            placeholder="Ej: Ingeniero..."
            value={borrador.profesion}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Especialidad de desarrollo"
            nombre="especialidadDesarrollo"
            placeholder="Ej: Backend, React..."
            value={borrador.especialidadDesarrollo}
            onChange={alCambiar}
          />
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

        <div className={estilos.accionesBuscador}>
          <Boton type="submit" icono={Search} disabled={cargando}>
            Buscar
          </Boton>
          <Boton type="button" variante="secundario" icono={RotateCcw} onClick={alLimpiar} disabled={cargando}>
            Limpiar filtros
          </Boton>
        </div>
      </form>

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
