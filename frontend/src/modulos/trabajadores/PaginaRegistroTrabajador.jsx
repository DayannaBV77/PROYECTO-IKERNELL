import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, TriangleAlert } from 'lucide-react';

import {
  TIPOS_TRABAJADOR,
  adjuntarFotografia,
  consultarDisponibilidadIdentificacion,
  registrarTrabajador,
} from '../../api/trabajadores.js';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { aFechaIso } from '../../utilidades/formato.js';
import SelectorEspecialidades from './componentes/SelectorEspecialidades.jsx';
import SelectorProfesiones from './componentes/SelectorProfesiones.jsx';
import archivo from './componentes/SubidaFotografia.module.css';
import {
  FECHA_MAXIMA_NACIMIENTO,
  validarCampoTrabajador,
  validarTrabajador,
} from './validaciones.js';

const VACIO = {
  identificacion: '',
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  direccion: '',
  profesion: '',
  especialidadDesarrollo: '',
  tipoTrabajador: '',
};

/**
 * Registro del perfil de un trabajador (RF-001, RF-002; HU-04).
 *
 * Los ocho datos son obligatorios y los valida el servidor: cuando falta alguno
 * responde 400 con el detalle por campo, y cuando la identificacion ya existe
 * responde 409 con su mensaje. En los dos casos (C02 y C03) el formulario marca
 * lo que corresponde y conserva lo escrito, que es justo lo que los criterios
 * exigen (RN-13). Los campos se validan en el cliente mientras se editan para
 * orientar al usuario; el backend conserva la validacion autoritativa y la
 * comprobacion de identificaciones duplicadas.
 *
 * La fecha de nacimiento es el unico dato que no viaja tal cual: se normaliza a
 * ISO (AAAA-MM-DD) con `aFechaIso`, que es el formato que el servidor convierte
 * a `LocalDate` y la columna `date` de PostgreSQL almacena. No es validarla
 * -de eso sigue encargandose el servidor- sino asegurar el formato: donde el
 * navegador no soporta `<input type="date">` el control degrada a texto y lo
 * escrito a mano ("12/07/1994") no se podia convertir, de modo que el perfil no
 * se guardaba.
 *
 * La fotografia es opcional y se adjunta en una segunda peticion, porque el
 * backend la recibe en su propio endpoint. Si el perfil se crea y la fotografia
 * se rechaza, el perfil no se pierde (C05): se abre su perfil con el motivo a la
 * vista, donde se puede reintentar con otro archivo o dejarlo sin ella.
 */
export default function PaginaRegistroTrabajador() {
  const navegar = useNavigate();
  const controladorIdentificacion = useRef(null);
  const ultimaIdentificacionValidada = useRef('');

  const [valores, setValores] = useState(VACIO);
  const [fotografia, setFotografia] = useState(null);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [identificacionEstado, setIdentificacionEstado] = useState({ tipo: 'inicio', mensaje: '' });

  const hayErroresFormulario = Object.keys(validarTrabajador(valores)).length > 0;
  const identificacionPendiente = identificacionEstado.tipo === 'validando';
  const identificacionBloqueada = /^\d{10}$/.test(valores.identificacion) && identificacionEstado.tipo === 'error';
  const identificacionDuplicada = errores.identificacion === 'Este número de documento ya existe en el sistema';
  const deshabilitarRegistro =
    guardando || hayErroresFormulario || identificacionPendiente || identificacionBloqueada || identificacionDuplicada;

  function actualizarErroresCampo(nombre, error) {
    setErrores((previos) => {
      const siguientes = { ...previos };
      if (error) {
        siguientes[nombre] = error;
      } else {
        delete siguientes[nombre];
      }
      return siguientes;
    });
  }

  function alCambiar(evento) {
    const { name, value } = evento.target;
    const siguienteValor = name === 'identificacion' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setValores((previos) => ({ ...previos, [name]: siguienteValor }));
    setFallo(null);

    const error = validarCampoTrabajador(name, siguienteValor);
    if (name === 'identificacion') {
      if (!siguienteValor) {
        setIdentificacionEstado({ tipo: 'inicio', mensaje: '' });
      } else if (!/^\d{10}$/.test(siguienteValor)) {
        setIdentificacionEstado({ tipo: 'error', mensaje: error || 'La identificacion debe tener 10 digitos.' });
      } else {
        setIdentificacionEstado({ tipo: 'validando', mensaje: 'Validando identificacion...' });
      }
    }
    actualizarErroresCampo(name, error);
  }

  useEffect(() => {
    const texto = valores.identificacion.trim();
    if (!/^\d{10}$/.test(texto)) {
      return undefined;
    }

    const controlador = new AbortController();
    controladorIdentificacion.current?.abort();
    controladorIdentificacion.current = controlador;
    ultimaIdentificacionValidada.current = texto;

    const temporizador = setTimeout(async () => {
      try {
        const respuesta = await consultarDisponibilidadIdentificacion(texto, { senal: controlador.signal });
        if (controlador.signal.aborted || ultimaIdentificacionValidada.current !== texto) {
          return;
        }

        if (!respuesta?.disponible) {
          const mensaje = respuesta?.mensaje || 'Este número de documento ya existe en el sistema';
          setIdentificacionEstado({ tipo: 'error', mensaje });
          setErrores((previos) => ({ ...previos, identificacion: mensaje }));
          return;
        }

        setIdentificacionEstado({ tipo: 'exito', mensaje: 'Identificación disponible y válida.' });
        setErrores((previos) => {
          const siguientes = { ...previos };
          delete siguientes.identificacion;
          return siguientes;
        });
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }
        setIdentificacionEstado({
          tipo: 'error',
          mensaje: 'No se pudo validar la identificacion. Intentalo de nuevo.',
        });
      }
    }, 400);

    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [valores.identificacion]);

  async function alEnviar(evento) {
    evento.preventDefault();

    const erroresLocales = validarTrabajador(valores);
    if (Object.keys(erroresLocales).length > 0 || identificacionPendiente || identificacionBloqueada) {
      setErrores({ ...errores, ...erroresLocales });
      setFallo(null);
      return;
    }

    setGuardando(true);
    setFallo(null);
    setErrores({});

    let creado;
    try {
      creado = await registrarTrabajador({ ...valores, fechaNacimiento: aFechaIso(valores.fechaNacimiento) });
    } catch (error) {
      if (error.campos) {
        setErrores(error.campos);
      } else if (error.estado === 409 && !error.advertencias) {
        setErrores({ identificacion: error.message });
      }
      setFallo(error.message);
      setGuardando(false);
      return;
    }

    // El perfil ya existe; lo que falle de aqui en adelante no lo deshace.
    let falloFotografia = null;
    if (fotografia) {
      try {
        await adjuntarFotografia(creado.id, fotografia);
      } catch (error) {
        falloFotografia = error.message;
      }
    }

    navegar(`/app/trabajadores/${creado.id}`, {
      replace: true,
      state: { registrado: true, falloFotografia },
    });
  }

  return (
    <Seccion
      titulo="Registrar trabajador"
      descripcion="Todos los datos del perfil son obligatorios."
      id="registro-trabajador"
    >
      <div className={estilos.barraSuperior}>
        <Boton a="/app/trabajadores" variante="texto" icono={ArrowLeft}>
          Volver a la busqueda
        </Boton>
      </div>

      {fallo && (
        <p className={estilos.avisoError} role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          {fallo}
        </p>
      )}

      <form className={estilos.formulario} onSubmit={alEnviar} noValidate>
        <div className={estilos.criterios}>
          <Campo
            etiqueta="Identificacion"
            nombre="identificacion"
            obligatorio
            value={valores.identificacion}
            onChange={alCambiar}
            error={errores.identificacion}
            exito={identificacionEstado.tipo === 'exito' ? identificacionEstado.mensaje : undefined}
            validando={identificacionEstado.tipo === 'validando'}
            pista="Solo digitos; maximo 10. No se podra modificar despues."
            maxLength={10}
            inputMode="numeric"
          />
          <Campo
            etiqueta="Nombre"
            nombre="nombre"
            obligatorio
            value={valores.nombre}
            onChange={alCambiar}
            error={errores.nombre}
            maxLength={100}
          />
          <Campo
            etiqueta="Apellido"
            nombre="apellido"
            obligatorio
            value={valores.apellido}
            onChange={alCambiar}
            error={errores.apellido}
            maxLength={100}
          />
          <Campo
            etiqueta="Fecha de nacimiento"
            nombre="fechaNacimiento"
            tipo="date"
            obligatorio
            value={valores.fechaNacimiento}
            onChange={alCambiar}
            error={errores.fechaNacimiento}
            max={FECHA_MAXIMA_NACIMIENTO}
          />
          <Campo
            etiqueta="Direccion"
            nombre="direccion"
            obligatorio
            value={valores.direccion}
            onChange={alCambiar}
            error={errores.direccion}
            pista="Se valida el formato, no se comprueba que la direccion exista."
            maxLength={200}
          />
          <SelectorProfesiones
            value={valores.profesion}
            onChange={(valor) => {
              setValores((previos) => ({ ...previos, profesion: valor }));
              const error = validarCampoTrabajador('profesion', valor);
              actualizarErroresCampo('profesion', error);
              setFallo(null);
            }}
            error={errores.profesion}
            obligatorio
          />
          <SelectorEspecialidades
            value={valores.especialidadDesarrollo}
            onChange={(valor) => {
              setValores((previos) => ({ ...previos, especialidadDesarrollo: valor }));
              const error = validarCampoTrabajador('especialidadDesarrollo', valor);
              actualizarErroresCampo('especialidadDesarrollo', error);
              setFallo(null);
            }}
            error={errores.especialidadDesarrollo}
            obligatorio
          />
          <Campo
            etiqueta="Tipo de trabajador"
            nombre="tipoTrabajador"
            opciones={TIPOS_TRABAJADOR}
            obligatorio
            value={valores.tipoTrabajador}
            onChange={alCambiar}
            error={errores.tipoTrabajador}
          />
        </div>

        <div className={archivo.campoArchivo}>
          <label className={estilos.rotulo} htmlFor="fotografia-nueva">
            Fotografia (opcional)
          </label>
          <p className={archivo.pistaArchivo} id="fotografia-nueva-pista">
            Se puede adjuntar ahora o mas tarde, desde el perfil del trabajador.
          </p>
          <input
            id="fotografia-nueva"
            type="file"
            accept="image/jpeg,image/png"
            aria-describedby="fotografia-nueva-pista"
            onChange={(evento) => setFotografia(evento.target.files?.[0] || null)}
          />
        </div>

        <div className={estilos.accionesBuscador}>
          <Boton type="submit" icono={Save} disabled={deshabilitarRegistro}>
            {guardando ? 'Guardando...' : 'Guardar perfil'}
          </Boton>
        </div>
      </form>
    </Seccion>
  );
}
