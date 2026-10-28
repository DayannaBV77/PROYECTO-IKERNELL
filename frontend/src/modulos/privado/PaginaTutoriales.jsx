import { useCallback, useState } from 'react';
import {
  CircleCheck,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Pencil,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

import { obtenerTutoriales } from '../../api/corporativo.js';
import {
  cambiarPublicacionRecurso,
  crearRecurso,
  eliminarRecurso,
  obtenerRecursosAdmin,
  actualizarRecurso,
} from '../../api/recursosAdmin.js';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Confirmacion from '../../componentes/ui/Confirmacion.jsx';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import { useSesion } from '../../sesion/contexto.js';
import ListaRecursos from './componentes/ListaRecursos.jsx';

const FORMULARIO_VACIO = {
  id: null,
  tipo: 'TUTORIAL',
  titulo: '',
  descripcion: '',
  categoria: '',
  version: 'Básico',
  contenido: '',
  enlace: '',
  orden: '',
  publicada: false,
};

function normalizarFormulario(formulario) {
  return {
    tipo: 'TUTORIAL',
    titulo: formulario.titulo.trim(),
    descripcion: formulario.descripcion.trim(),
    categoria: formulario.categoria.trim(),
    version: formulario.version.trim(),
    contenido: formulario.contenido.trim(),
    enlace: formulario.enlace.trim(),
    orden: formulario.orden === '' ? null : Number(formulario.orden),
  };
}

/** Tutoriales de programacion (RF-030, HU-21 C03, C04 y C05). */
export default function PaginaTutoriales() {
  const { sesion } = useSesion();
  const esCoordinador = sesion?.tipoTrabajador === 'COORDINADOR';

  const [recargaPublica, setRecargaPublica] = useState(0);
  const [recargaAdmin, setRecargaAdmin] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [fallo, setFallo] = useState('');
  const [recursoAEliminar, setRecursoAEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cambiando, setCambiando] = useState(null);

  const cargarAdmin = useCallback(
    ({ senal }) => (esCoordinador ? obtenerRecursosAdmin('TUTORIAL', { senal }) : Promise.resolve({ contenido: [] })),
    [esCoordinador],
  );
  const { datos: admin, error: errorAdmin, cargando: cargandoAdmin, reintentar: reintentarAdmin } =
    usePeticion(cargarAdmin, [esCoordinador, recargaAdmin]);

  const tutorialesAdmin = admin?.contenido ?? [];

  function abrirFormulario(tutorial = null) {
    setFormulario(
      tutorial
        ? {
            ...tutorial,
            orden: tutorial.orden ?? '',
            publicada: Boolean(tutorial.publicada),
          }
        : { ...FORMULARIO_VACIO },
    );
    setErrores({});
    setFallo('');
    setMensaje('');
    setAbierto(true);
  }

  function manejarCambio(evento) {
    const { name, value } = evento.target;
    setFormulario((previo) => ({
      ...previo,
      [name]: name === 'publicada' ? value === 'true' : value,
    }));
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
  }

  async function guardarTutorial(evento) {
    evento.preventDefault();
    setGuardando(true);
    setFallo('');
    setErrores({});

    const siguiente = { ...formulario };
    const erroresNuevos = {};

    if (!siguiente.titulo.trim()) erroresNuevos.titulo = 'El titulo es obligatorio.';
    if (!siguiente.descripcion.trim()) erroresNuevos.descripcion = 'La descripcion breve es obligatoria.';
    if (!siguiente.contenido.trim()) erroresNuevos.contenido = 'El contenido es obligatorio.';
    if (!siguiente.categoria.trim()) erroresNuevos.categoria = 'Debe indicar el lenguaje o la tecnologia.';

    if (Object.keys(erroresNuevos).length > 0) {
      setErrores(erroresNuevos);
      setGuardando(false);
      return;
    }

    try {
      const payload = normalizarFormulario(siguiente);
      const publicadoAntes = Boolean(formulario.publicada);

      if (siguiente.id) {
        await actualizarRecurso(siguiente.id, payload);
        if (siguiente.publicada !== publicadoAntes) {
          await cambiarPublicacionRecurso(siguiente.id, siguiente.publicada);
        }
      } else {
        const creado = await crearRecurso(payload);
        if (siguiente.publicada) {
          await cambiarPublicacionRecurso(creado.id, true);
        }
      }

      setMensaje(
        siguiente.id
          ? 'El tutorial se actualizo correctamente.'
          : 'El tutorial se creo correctamente.',
      );
      setAbierto(false);
      setFormulario(FORMULARIO_VACIO);
      setRecargaAdmin((actual) => actual + 1);
      setRecargaPublica((actual) => actual + 1);
    } catch (fallaApi) {
      setFallo(fallaApi.message);
      if (fallaApi.campos) {
        setErrores(fallaApi.campos);
      }
    } finally {
      setGuardando(false);
    }
  }

  async function alternarPublicacion(tutorial) {
    setCambiando(tutorial.id);
    setFallo('');
    setMensaje('');

    try {
      await cambiarPublicacionRecurso(tutorial.id, !tutorial.publicada);
      setMensaje(
        tutorial.publicada
          ? `"${tutorial.titulo}" se despublico.`
          : `"${tutorial.titulo}" ya quedo publicado.`,
      );
      setRecargaAdmin((actual) => actual + 1);
      setRecargaPublica((actual) => actual + 1);
    } catch (fallaApi) {
      setFallo(fallaApi.message);
    } finally {
      setCambiando(null);
    }
  }

  async function eliminarTutorial() {
    if (!recursoAEliminar) {
      return;
    }

    setGuardando(true);
    setFallo('');
    setMensaje('');

    try {
      await eliminarRecurso(recursoAEliminar.id);
      setMensaje(`"${recursoAEliminar.titulo}" se elimino correctamente.`);
      setRecursoAEliminar(null);
      setRecargaAdmin((actual) => actual + 1);
      setRecargaPublica((actual) => actual + 1);
    } catch (fallaApi) {
      setFallo(fallaApi.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <ListaRecursos
        titulo="Tutoriales de programacion"
        descripcion="Material de consulta publicado por la empresa para el equipo."
        etiquetaBusqueda="Buscar entre los tutoriales"
        obtener={obtenerTutoriales}
        rutaBase="/app/tutoriales"
        iconoVacio={GraduationCap}
        id="tutoriales"
        recarga={recargaPublica}
      />

      {esCoordinador && (
        <div style={{ marginTop: 'var(--s-7)' }}>
          <div className={estilos.barraSuperior}>
            <Boton icono={Plus} onClick={() => abrirFormulario()}>
              Agregar tutorial
            </Boton>
          </div>

          {mensaje && (
            <p className={estilos.avisoExito} role="status">
              <CircleCheck size={18} aria-hidden="true" />
              {mensaje}
            </p>
          )}

          {fallo && (
            <p className={estilos.avisoError} role="alert">
              <TriangleAlert size={18} aria-hidden="true" />
              {fallo}
            </p>
          )}

          {abierto && (
            <form className={estilos.formulario} onSubmit={guardarTutorial} noValidate>
              <div className={estilos.criterios}>
                <Campo
                  etiqueta="Titulo"
                  nombre="titulo"
                  value={formulario.titulo}
                  onChange={manejarCambio}
                  error={errores.titulo}
                  obligatorio
                />
                <Campo
                  etiqueta="Tecnologia o lenguaje"
                  nombre="categoria"
                  value={formulario.categoria}
                  onChange={manejarCambio}
                  error={errores.categoria}
                  placeholder="PHP, React, JavaScript..."
                  obligatorio
                />
                <Campo
                  etiqueta="Nivel"
                  nombre="version"
                  opciones={[
                    { valor: 'Básico', texto: 'Básico' },
                    { valor: 'Intermedio', texto: 'Intermedio' },
                    { valor: 'Avanzado', texto: 'Avanzado' },
                  ]}
                  value={formulario.version}
                  onChange={manejarCambio}
                  textoVacio={null}
                />
                <Campo
                  etiqueta="Estado"
                  nombre="publicada"
                  opciones={[
                    { valor: 'false', texto: 'Borrador' },
                    { valor: 'true', texto: 'Publicado' },
                  ]}
                  value={String(formulario.publicada)}
                  onChange={manejarCambio}
                  textoVacio={null}
                />
              </div>

              <div style={{ marginTop: 'var(--s-4)' }}>
                <Campo
                  etiqueta="Descripcion breve"
                  nombre="descripcion"
                  value={formulario.descripcion}
                  onChange={manejarCambio}
                  error={errores.descripcion}
                  area
                  rows={3}
                  obligatorio
                />
              </div>

              <div style={{ marginTop: 'var(--s-4)' }}>
                <Campo
                  etiqueta="Contenido del tutorial"
                  nombre="contenido"
                  value={formulario.contenido}
                  onChange={manejarCambio}
                  error={errores.contenido}
                  area
                  rows={12}
                  obligatorio
                />
              </div>

              <div className={estilos.criterios} style={{ marginTop: 'var(--s-4)' }}>
                <Campo
                  etiqueta="Enlace externo"
                  nombre="enlace"
                  value={formulario.enlace}
                  onChange={manejarCambio}
                  placeholder="Opcional"
                />
                <Campo
                  etiqueta="Orden"
                  nombre="orden"
                  tipo="number"
                  value={formulario.orden}
                  onChange={manejarCambio}
                  placeholder="1"
                />
              </div>

              <div className={estilos.accionesBuscador}>
                <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>
                  Cancelar
                </Boton>
                <Boton icono={Save} type="submit" disabled={guardando}>
                  {guardando ? 'Guardando...' : formulario.id ? 'Guardar cambios' : 'Crear tutorial'}
                </Boton>
              </div>
            </form>
          )}

          {cargandoAdmin && <EstadoCarga mensaje="Cargando tutoriales del coordinador..." />}

          {!cargandoAdmin && errorAdmin && <EstadoError error={errorAdmin} alReintentar={reintentarAdmin} />}

          {!cargandoAdmin && !errorAdmin && tutorialesAdmin.length === 0 && (
            <EstadoVacio mensaje="Todavia no hay tutoriales registrados." icono={FileText} />
          )}

          {!cargandoAdmin && !errorAdmin && tutorialesAdmin.length > 0 && (
            <div className={estilos.tablaEnvoltorio}>
              <table className={estilos.tabla}>
                <thead>
                  <tr>
                    <th scope="col">Titulo</th>
                    <th scope="col">Lenguaje</th>
                    <th scope="col">Nivel</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tutorialesAdmin.map((tutorial) => (
                    <tr key={tutorial.id}>
                      <th scope="row" className={estilos.celdaNombre}>
                        {tutorial.titulo}
                      </th>
                      <td>{tutorial.categoria || '—'}</td>
                      <td>{tutorial.version || '—'}</td>
                      <td>
                        <span className={`${estilos.estado} ${tutorial.publicada ? estilos.habilitado : estilos.inhabilitado}`}>
                          {tutorial.publicada ? 'Publicado' : 'Borrador'}
                        </span>
                      </td>
                      <td>
                        <div className={estilos.accionesFila}>
                          <Boton variante="texto" icono={Pencil} onClick={() => abrirFormulario(tutorial)}>
                            Editar
                          </Boton>
                          <Boton
                            variante="texto"
                            icono={tutorial.publicada ? EyeOff : Eye}
                            disabled={cambiando === tutorial.id}
                            onClick={() => alternarPublicacion(tutorial)}
                          >
                            {tutorial.publicada ? 'Despublicar' : 'Publicar'}
                          </Boton>
                          <Boton
                            variante="texto"
                            icono={Trash2}
                            onClick={() => setRecursoAEliminar(tutorial)}
                          >
                            Eliminar
                          </Boton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Confirmacion
        abierto={Boolean(recursoAEliminar)}
        titulo="Eliminar tutorial"
        textoConfirmar="Eliminar"
        ocupado={guardando}
        alConfirmar={eliminarTutorial}
        alCancelar={() => setRecursoAEliminar(null)}
      >
        <p>
          ¿Seguro que quieres eliminar el tutorial <strong>{recursoAEliminar?.titulo}</strong>? Esta
          accion no se puede deshacer.
        </p>
      </Confirmacion>
    </>
  );
}
