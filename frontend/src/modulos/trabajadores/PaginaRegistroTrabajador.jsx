import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, TriangleAlert } from 'lucide-react';

import {
  TIPOS_TRABAJADOR,
  adjuntarFotografia,
  consultarDisponibilidadIdentificacion,
  registrarTrabajador,
} from '../../api/trabajadores.js';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Confirmacion from '../../componentes/ui/Confirmacion.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { aFechaIso } from '../../utilidades/formato.js';
import AsistenteDireccion from './componentes/AsistenteDireccion.jsx';
import SelectorEspecialidades from './componentes/SelectorEspecialidades.jsx';
import SelectorProfesiones from './componentes/SelectorProfesiones.jsx';
import archivo from './componentes/SubidaFotografia.module.css';
import {
  FECHA_MAXIMA_NACIMIENTO,
  REGLAS_DOCUMENTO,
  TIPOS_IDENTIFICACION,
  normalizarTipoDocumento,
  sanitizarDocumento,
  validarCampoTrabajador,
  validarTrabajador,
} from './validaciones.js';

const VACIO = {
  tipoIdentificacion: 'CEDULA_CIUDADANIA',
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
  const [mostrarConfirmacionVolver, setMostrarConfirmacionVolver] = useState(false);

  const hayCambios = Boolean(
    valores.identificacion.trim() ||
    valores.nombre.trim() ||
    valores.apellido.trim() ||
    valores.fechaNacimiento ||
    valores.direccion.trim() ||
    valores.profesion ||
    valores.especialidadDesarrollo ||
    valores.tipoTrabajador ||
    fotografia
  );

  function alIntentarVolver(e) {
    if (e) e.preventDefault();
    if (hayCambios) {
      setMostrarConfirmacionVolver(true);
    } else {
      navegar('/app/trabajadores');
    }
  }

  const hayErroresFormulario = Object.keys(validarTrabajador(valores)).length > 0;
  const identificacionPendiente = identificacionEstado.tipo === 'validando';
  const identificacionBloqueada = /^\d{10}$/.test(valores.identificacion) && identificacionEstado.tipo === 'error';
  const identificacionDuplicada =
    identificacionEstado.tipo === 'error' ||
    (errores.identificacion && errores.identificacion.includes('ya se encuentra registrado'));
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
    setFallo(null);

    if (name === 'tipoIdentificacion') {
      const nuevoTipo = value;
      const idAjustada = sanitizarDocumento(valores.identificacion, nuevoTipo);

      setValores((previos) => ({
        ...previos,
        tipoIdentificacion: nuevoTipo,
        identificacion: idAjustada,
      }));

      const errorTipo = validarCampoTrabajador('tipoIdentificacion', nuevoTipo);
      actualizarErroresCampo('tipoIdentificacion', errorTipo);

      const errorIdent = validarCampoTrabajador('identificacion', idAjustada, nuevoTipo);
      actualizarErroresCampo('identificacion', errorIdent);

      if (!idAjustada) {
        setIdentificacionEstado({ tipo: 'inicio', mensaje: '' });
      } else if (errorIdent) {
        setIdentificacionEstado({ tipo: 'error', mensaje: errorIdent });
      } else {
        setIdentificacionEstado({ tipo: 'validando', mensaje: 'Validando identificación...' });
      }
      return;
    }

    const siguienteValor =
      name === 'identificacion'
        ? sanitizarDocumento(value, valores.tipoIdentificacion)
        : value;

    setValores((previos) => ({ ...previos, [name]: siguienteValor }));

    const error = validarCampoTrabajador(name, siguienteValor, valores.tipoIdentificacion);
    if (name === 'identificacion') {
      if (!siguienteValor) {
        setIdentificacionEstado({ tipo: 'inicio', mensaje: '' });
      } else if (error) {
        setIdentificacionEstado({ tipo: 'error', mensaje: error });
      } else {
        setIdentificacionEstado({ tipo: 'validando', mensaje: 'Validando identificación...' });
      }
    }
    if (name === 'direccion') {
      actualizarErroresCampo('direccion', null);
      return;
    }
    actualizarErroresCampo(name, error);
  }

  useEffect(() => {
    const texto = valores.identificacion.trim();
    const tipo = valores.tipoIdentificacion || 'CEDULA_CIUDADANIA';
    const errorFormato = validarCampoTrabajador('identificacion', texto, tipo);
    if (errorFormato || !texto) {
      if (!texto) {
        setIdentificacionEstado({ tipo: 'inicio', mensaje: '' });
      }
      return undefined;
    }

    const controlador = new AbortController();
    controladorIdentificacion.current?.abort();
    controladorIdentificacion.current = controlador;
    const claveValidacion = `${tipo}:${texto}`;
    ultimaIdentificacionValidada.current = claveValidacion;

    const temporizador = setTimeout(async () => {
      try {
        const respuesta = await consultarDisponibilidadIdentificacion(texto, tipo, {
          senal: controlador.signal,
        });
        if (controlador.signal.aborted || ultimaIdentificacionValidada.current !== claveValidacion) {
          return;
        }

        if (!respuesta?.disponible) {
          const mensaje =
            respuesta?.mensaje === 'Este número de documento ya existe en el sistema'
              ? 'Este número de documento ya se encuentra registrado en el sistema. Verifique los datos o consulte en el módulo de búsqueda.'
              : respuesta?.mensaje ||
                'Este número de documento ya se encuentra registrado en el sistema. Verifique los datos o consulte en el módulo de búsqueda.';
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
          mensaje: 'No se pudo validar la identificación. Inténtalo de nuevo.',
        });
      }
    }, 400);

    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [valores.identificacion, valores.tipoIdentificacion]);

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
        <Boton type="button" onClick={alIntentarVolver} variante="texto">
          Volver a la busqueda
        </Boton>
      </div>

      <Confirmacion
        abierto={mostrarConfirmacionVolver}
        titulo="¿Desea salir sin guardar?"
        textoConfirmar="Salir y descartar"
        alConfirmar={() => {
          setMostrarConfirmacionVolver(false);
          navegar('/app/trabajadores');
        }}
        alCancelar={() => setMostrarConfirmacionVolver(false)}
      >
        <p>
          Hay información ingresada en el formulario de registro del trabajador. Si vuelve a la búsqueda ahora, se
          perderán todos los datos ingresados en esta operación.
        </p>
      </Confirmacion>

      {fallo && (
        <p className={estilos.avisoError} role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          {fallo}
        </p>
      )}

      <form className={estilos.formulario} onSubmit={alEnviar} noValidate>
        <div className={estilos.criterios}>
          <Campo
            etiqueta="Tipo de identificación"
            nombre="tipoIdentificacion"
            opciones={TIPOS_IDENTIFICACION}
            obligatorio
            value={valores.tipoIdentificacion}
            onChange={alCambiar}
            error={errores.tipoIdentificacion}
          />
          <Campo
            etiqueta="Identificación"
            nombre="identificacion"
            obligatorio
            placeholder={REGLAS_DOCUMENTO[normalizarTipoDocumento(valores.tipoIdentificacion)].placeholder}
            value={valores.identificacion}
            onChange={(evento) => {
              const limpio = sanitizarDocumento(evento.target.value, valores.tipoIdentificacion);
              alCambiar({ target: { name: 'identificacion', value: limpio } });
            }}
            onBlur={() => {
              const errorId = validarCampoTrabajador('identificacion', valores.identificacion, valores);
              actualizarErroresCampo('identificacion', errorId);
            }}
            error={errores.identificacion}
            exito={identificacionEstado.tipo === 'exito' ? identificacionEstado.mensaje : undefined}
            validando={identificacionEstado.tipo === 'validando'}
            estadoValidacion={
              errores.identificacion || identificacionEstado.tipo === 'error'
                ? 'invalido'
                : identificacionEstado.tipo === 'validando'
                  ? 'analizando'
                  : identificacionEstado.tipo === 'exito'
                    ? 'valido'
                    : 'inactivo'
            }
            maxLength={REGLAS_DOCUMENTO[normalizarTipoDocumento(valores.tipoIdentificacion)].max}
            inputMode={REGLAS_DOCUMENTO[normalizarTipoDocumento(valores.tipoIdentificacion)].inputMode}
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
          <AsistenteDireccion
            value={valores.direccion}
            onChange={alCambiar}
            onBlur={() => {
              const errorDir = validarCampoTrabajador('direccion', valores.direccion, valores);
              actualizarErroresCampo('direccion', errorDir);
            }}
            error={errores.direccion}
            obligatorio
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
