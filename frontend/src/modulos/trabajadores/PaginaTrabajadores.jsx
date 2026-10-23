import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Users } from 'lucide-react';

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

/**
 * Busqueda de trabajadores (RF-004, HU-05 C01 y C02).
 *
 * La busqueda se lanza al pulsar el boton y no mientras se escribe, porque C01
 * la describe asi -"escribo uno o varios datos de busqueda y pulso buscar"- y
 * porque con siete criterios una consulta por cada tecla seria ruido para el
 * servidor (RNF-005). Es la diferencia con los buscadores del sitio publico,
 * donde hay un solo criterio y la busqueda en vivo si ayuda.
 *
 * Los criterios confirmados se guardan aparte del borrador del formulario: de
 * otro modo cada tecla cambiaria las claves de la peticion. Cambiar de
 * criterios vuelve a la primera pagina, para no quedar en una que ya no existe.
 */
export default function PaginaTrabajadores() {
  const [borrador, setBorrador] = useState(SIN_CRITERIOS);
  const [criterios, setCriterios] = useState(SIN_CRITERIOS);
  const [pagina, setPagina] = useState(0);

  const cargar = useCallback(
    ({ senal }) => buscarTrabajadores({ ...criterios, pagina }, { senal }),
    [criterios, pagina],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [criterios, pagina]);

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
            etiqueta="Identificacion"
            nombre="identificacion"
            value={borrador.identificacion}
            onChange={alCambiar}
          />
          <Campo etiqueta="Nombre" nombre="nombre" value={borrador.nombre} onChange={alCambiar} />
          <Campo
            etiqueta="Apellido"
            nombre="apellido"
            value={borrador.apellido}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Profesion"
            nombre="profesion"
            value={borrador.profesion}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Especialidad de desarrollo"
            nombre="especialidadDesarrollo"
            value={borrador.especialidadDesarrollo}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Tipo de trabajador"
            nombre="tipoTrabajador"
            opciones={TIPOS_TRABAJADOR}
            textoVacio="Cualquiera"
            value={borrador.tipoTrabajador}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Estado"
            nombre="estado"
            opciones={ESTADOS_HABILITACION}
            textoVacio="Cualquiera"
            value={borrador.estado}
            onChange={alCambiar}
          />
        </div>

        <div className={estilos.accionesBuscador}>
          <Boton type="submit" icono={Search} disabled={cargando}>
            Buscar
          </Boton>
          <Boton type="button" variante="texto" onClick={alLimpiar} disabled={cargando}>
            Limpiar criterios
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
                        Abrir perfil
                        <span className="solo-lectores"> de {trabajador.nombreCompleto}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacion datos={datos} pagina={pagina} alCambiarPagina={setPagina} />
        </>
      )}
    </Seccion>
  );
}

/** Navegacion entre paginas: el backend pagina los resultados (RNF-005). */
function Paginacion({ datos, pagina, alCambiarPagina }) {
  const { totalPaginas = 0, totalElementos = 0 } = datos || {};

  if (totalPaginas <= 1) {
    return <p className={estilos.recuento}>{totalElementos} trabajador(es).</p>;
  }

  return (
    <nav className={estilos.paginacion} aria-label="Paginas de resultados">
      <Boton
        variante="secundario"
        onClick={() => alCambiarPagina(pagina - 1)}
        disabled={pagina <= 0}
      >
        Anterior
      </Boton>
      <p className={estilos.recuento} aria-live="polite">
        Pagina {pagina + 1} de {totalPaginas} · {totalElementos} trabajador(es)
      </p>
      <Boton
        variante="secundario"
        onClick={() => alCambiarPagina(pagina + 1)}
        disabled={pagina + 1 >= totalPaginas}
      >
        Siguiente
      </Boton>
    </nav>
  );
}
