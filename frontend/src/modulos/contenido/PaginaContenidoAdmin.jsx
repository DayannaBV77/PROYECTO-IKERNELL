import { useCallback, useState } from 'react';
import { CircleCheck, Eye, EyeOff, FileText, Pencil, Plus, Save, TriangleAlert, X } from 'lucide-react';

import {
  EXIGENCIA_DE_SECCION,
  SECCIONES,
  actualizarContenido,
  cambiarPublicacion,
  crearContenido,
  obtenerContenido,
} from '../../api/contenidoAdmin.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';

const PIEZA_VACIA = { id: null, titulo: '', cuerpo: '', enlace: '', fecha: '', orden: '' };

/** El formulario trabaja con cadenas; el servidor espera tipos. */
function paraEnviar(tipo, pieza) {
  return {
    tipo,
    titulo: pieza.titulo,
    cuerpo: pieza.cuerpo || null,
    enlace: pieza.enlace || null,
    fecha: pieza.fecha || null,
    orden: pieza.orden === '' ? null : Number(pieza.orden),
  };
}

/**
 * Administracion del contenido publico (RF-032 a RF-036).
 *
 * Es lo que permite que la pagina publica se corrija sin tocar el repositorio
 * ni la base de datos. Hasta ahora el contenido solo entraba por el script de
 * carga inicial.
 *
 * Una pieza nueva nace sin publicar y hay que publicarla expresamente, que es
 * como lo hace el servidor: asi nada aparece en la pagina por descuido. Y no
 * hay borrado: se retira despublicando, conservando el registro (RN-02).
 */
export default function PaginaContenidoAdmin() {
  const [tipo, setTipo] = useState(SECCIONES[0].valor);
  const [recarga, setRecarga] = useState(0);
  const [edicion, setEdicion] = useState(null);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cambiando, setCambiando] = useState(null);

  const cargar = useCallback(({ senal }) => obtenerContenido(tipo, { senal }), [tipo]);
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [tipo, recarga]);

  const piezas = datos?.contenido || [];

  function abrir(pieza) {
    setEdicion(
      pieza
        ? {
            ...pieza,
            cuerpo: pieza.cuerpo || '',
            enlace: pieza.enlace || '',
            fecha: pieza.fecha || '',
            orden: pieza.orden ?? '',
          }
        : PIEZA_VACIA,
    );
    setErrores({});
    setFallo(null);
    setConfirmado(null);
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
        await crearContenido(paraEnviar(tipo, edicion));
      } else {
        await actualizarContenido(edicion.id, paraEnviar(tipo, edicion));
      }
      setConfirmado(
        esNueva
          ? 'La pieza se creo. Todavia no esta publicada: publiquela cuando corresponda.'
          : 'Los cambios se guardaron correctamente.',
      );
      setEdicion(null);
      setRecarga((numero) => numero + 1);
    } catch (fallaApi) {
      if (fallaApi.campos) {
        setErrores(fallaApi.campos);
      }
      setFallo(fallaApi.message);
    } finally {
      setGuardando(false);
    }
  }

  async function alPublicar(pieza, publicada) {
    setCambiando(pieza.id);
    setFallo(null);
    setConfirmado(null);

    try {
      await cambiarPublicacion(pieza.id, publicada);
      setConfirmado(
        publicada
          ? `"${pieza.titulo}" ya aparece en la pagina publica.`
          : `"${pieza.titulo}" se retiro de la pagina publica. El registro se conserva.`,
      );
      setRecarga((numero) => numero + 1);
    } catch (fallaApi) {
      setFallo(fallaApi.message);
    } finally {
      setCambiando(null);
    }
  }

  const exigencia = EXIGENCIA_DE_SECCION[tipo];

  return (
    <Seccion
      titulo="Contenido de la pagina publica"
      descripcion="Lo que ven los visitantes en las seis secciones de informacion empresarial."
      id="contenido-admin"
    >
      <div className={estilos.buscador}>
        <div style={{ maxWidth: '420px' }}>
          <Campo
            etiqueta="Seccion"
            nombre="tipo"
            opciones={SECCIONES}
            textoVacio={null}
            value={tipo}
            onChange={(evento) => {
              setTipo(evento.target.value);
              setEdicion(null);
              setConfirmado(null);
              setFallo(null);
            }}
            pista={exigencia}
          />
        </div>
      </div>

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

      {cargando && <EstadoCarga mensaje="Cargando el contenido de la seccion..." />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {/* El aviso de seccion vacia lo redacta el servidor (RN-14). */}
      {!cargando && !error && piezas.length === 0 && (
        <EstadoVacio mensaje={datos?.mensaje} icono={FileText} />
      )}

      {!cargando && !error && piezas.length > 0 && (
        <div className={estilos.tablaEnvoltorio}>
          <table className={estilos.tabla}>
            <caption className="solo-lectores">Contenido registrado de la seccion</caption>
            <thead>
              <tr>
                <th scope="col">Orden</th>
                <th scope="col">Titulo</th>
                <th scope="col">Fecha</th>
                <th scope="col">En la pagina</th>
                <th scope="col">
                  <span className="solo-lectores">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {piezas.map((pieza) => (
                <tr key={pieza.id}>
                  <td>{pieza.orden ?? '—'}</td>
                  <th scope="row" className={estilos.celdaNombre}>
                    {pieza.titulo}
                  </th>
                  <td>{formatearFecha(pieza.fecha) || '—'}</td>
                  <td>
                    <span
                      className={`${estilos.estado} ${
                        pieza.publicada ? estilos.habilitado : estilos.inhabilitado
                      }`}
                    >
                      {pieza.publicada ? 'Publicada' : 'Borrador'}
                    </span>
                  </td>
                  <td>
                    <div className={estilos.accionesFila}>
                      <Boton variante="texto" icono={Pencil} onClick={() => abrir(pieza)}>
                        Editar
                        <span className="solo-lectores"> {pieza.titulo}</span>
                      </Boton>
                      <Boton
                        variante="texto"
                        icono={pieza.publicada ? EyeOff : Eye}
                        disabled={cambiando === pieza.id}
                        onClick={() => alPublicar(pieza, !pieza.publicada)}
                      >
                        {pieza.publicada ? 'Retirar' : 'Publicar'}
                        <span className="solo-lectores"> {pieza.titulo}</span>
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
          <p className={estilos.rotulo}>
            {edicion.id ? 'Modificar la pieza' : 'Nueva pieza de contenido'}
          </p>

          <div className={estilos.criterios}>
            <Campo
              etiqueta="Titulo"
              nombre="titulo"
              obligatorio
              value={edicion.titulo}
              onChange={alCambiar}
              error={errores.titulo}
            />
            <Campo
              etiqueta="Orden"
              nombre="orden"
              tipo="number"
              min="1"
              value={edicion.orden}
              onChange={alCambiar}
              error={errores.orden}
              pista="Opcional. Posicion dentro de la seccion."
            />
          </div>

          <Campo
            etiqueta="Cuerpo"
            nombre="cuerpo"
            area
            rows={6}
            value={edicion.cuerpo}
            onChange={alCambiar}
            error={errores.cuerpo}
            pista={
              tipo === 'PREGUNTA_FRECUENTE'
                ? 'Aqui va la respuesta a la pregunta.'
                : 'Hasta 2000 caracteres.'
            }
          />

          <div className={estilos.criterios}>
            <Campo
              etiqueta="Enlace"
              nombre="enlace"
              tipo="url"
              value={edicion.enlace}
              onChange={alCambiar}
              error={errores.enlace}
              pista={tipo === 'ENLACE_INTERES' ? 'Obligatorio en esta seccion.' : 'Opcional.'}
            />
            <Campo
              etiqueta="Fecha"
              nombre="fecha"
              tipo="date"
              value={edicion.fecha}
              onChange={alCambiar}
              error={errores.fecha}
              pista={tipo === 'NOTICIA' ? 'Fecha de la noticia.' : 'Opcional.'}
            />
          </div>

          <div className={estilos.accionesBuscador}>
            <Boton type="submit" icono={Save} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </Boton>
            <Boton
              type="button"
              variante="texto"
              icono={X}
              onClick={() => setEdicion(null)}
              disabled={guardando}
            >
              Cancelar
            </Boton>
          </div>
        </form>
      ) : (
        <div className={estilos.accionesBuscador}>
          <Boton icono={Plus} onClick={() => abrir(null)}>
            Anadir contenido a esta seccion
          </Boton>
        </div>
      )}
    </Seccion>
  );
}
