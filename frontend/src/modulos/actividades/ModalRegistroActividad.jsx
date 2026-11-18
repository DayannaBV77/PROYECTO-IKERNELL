import { useState } from 'react';
import { Save, TriangleAlert } from 'lucide-react';

import { PRIORIDADES_ACTIVIDAD, registrarActividad } from '../../api/actividades.js';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Confirmacion from '../../componentes/ui/Confirmacion.jsx';
import Dialogo from '../../componentes/ui/Dialogo.jsx';
import estilos from '../../estilos/gestion.module.css';
import {
  useContextoDeProyecto,
  useProyectosComoOpciones,
} from './componentes/useContextoDeProyecto.js';
import estilosModal from './ModalRegistroActividad.module.css';

const VACIO = {
  proyectoId: '',
  etapaId: '',
  desarrolladorId: '',
  descripcion: '',
  prioridad: '',
  fechaPlanificada: '',
};

export default function ModalRegistroActividad({ abierto, alCerrar, alRegistrar }) {
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [advertencias, setAdvertencias] = useState(null);
  const [mostrarConfirmacionCerrar, setMostrarConfirmacionCerrar] = useState(false);

  const { opcionesDeProyecto } = useProyectosComoOpciones({ soloHabilitados: true });
  const { opcionesDeEtapa, opcionesDeDesarrollador } = useContextoDeProyecto(valores.proyectoId);

  const hayCambios = Boolean(
    valores.proyectoId ||
    valores.etapaId ||
    valores.desarrolladorId ||
    valores.descripcion.trim() ||
    valores.prioridad ||
    valores.fechaPlanificada,
  );

  function alIntentarCerrar() {
    if (hayCambios) {
      setMostrarConfirmacionCerrar(true);
    } else {
      cerrarLimpiando();
    }
  }

  function cerrarLimpiando() {
    setValores(VACIO);
    setErrores({});
    setFallo(null);
    setAdvertencias(null);
    setMostrarConfirmacionCerrar(false);
    alCerrar();
  }

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setValores((previos) =>
      name === 'proyectoId'
        ? { ...previos, proyectoId: value, etapaId: '', desarrolladorId: '' }
        : { ...previos, [name]: value },
    );
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
  }

  async function guardar(confirmado) {
    setFallo(null);
    setErrores({});

    const nuevosErrores = {};
    if (!valores.proyectoId) {
      nuevosErrores.proyectoId = 'Debe seleccionar un proyecto.';
    }
    if (!valores.etapaId) {
      nuevosErrores.etapaId = 'Debe seleccionar una etapa del proyecto.';
    }
    if (!valores.desarrolladorId) {
      nuevosErrores.desarrolladorId = 'Debe asignar un desarrollador del equipo.';
    }
    if (!valores.descripcion.trim()) {
      nuevosErrores.descripcion = 'La descripción de la actividad es obligatoria.';
    } else if (valores.descripcion.trim().length > 1000) {
      nuevosErrores.descripcion = 'La descripción no puede superar 1000 caracteres.';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setGuardando(true);
    try {
      const creada = await registrarActividad(
        valores.proyectoId,
        {
          etapaId: valores.etapaId ? Number(valores.etapaId) : null,
          desarrolladorId: valores.desarrolladorId ? Number(valores.desarrolladorId) : null,
          descripcion: valores.descripcion.trim(),
          prioridad: valores.prioridad || null,
          fechaPlanificada: valores.fechaPlanificada || null,
        },
        confirmado,
      );
      setAdvertencias(null);
      cerrarLimpiando();
      if (alRegistrar) {
        alRegistrar(creada);
      }
    } catch (error) {
      if (error.requiereConfirmacion) {
        setAdvertencias(error.advertencias);
        return;
      }
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <Dialogo
        abierto={abierto}
        titulo="Registrar actividad"
        descripcion="La actividad queda asociada al proyecto, a la etapa y al desarrollador elegidos."
        alCerrar={alIntentarCerrar}
      >
        {fallo && (
          <p className={estilos.avisoError} role="alert">
            <TriangleAlert size={18} aria-hidden="true" />
            {fallo}
          </p>
        )}

        <form
          className={estilosModal.formularioModal}
          onSubmit={(evento) => {
            evento.preventDefault();
            guardar(false);
          }}
          noValidate
        >
          <div className={estilos.criterios}>
            <Campo
              etiqueta="Proyecto"
              nombre="proyectoId"
              opciones={opcionesDeProyecto}
              obligatorio
              value={valores.proyectoId}
              onChange={alCambiar}
              error={errores.proyectoId}
            />
            <Campo
              etiqueta="Etapa"
              nombre="etapaId"
              opciones={opcionesDeEtapa}
              obligatorio
              value={valores.etapaId}
              onChange={alCambiar}
              error={errores.etapaId}
              disabled={!valores.proyectoId}
            />
            <Campo
              etiqueta="Desarrollador"
              nombre="desarrolladorId"
              opciones={opcionesDeDesarrollador}
              obligatorio
              value={valores.desarrolladorId}
              onChange={alCambiar}
              error={errores.desarrolladorId}
              disabled={!valores.proyectoId}
            />
          </div>

          <Campo
            etiqueta="Descripcion de la actividad"
            nombre="descripcion"
            area
            rows={4}
            obligatorio
            value={valores.descripcion}
            onChange={alCambiar}
            error={errores.descripcion}
          />

          <div className={`${estilos.criterios} ${estilosModal.filaPlanificacion}`}>
            <Campo
              etiqueta="Prioridad"
              nombre="prioridad"
              opciones={PRIORIDADES_ACTIVIDAD}
              value={valores.prioridad}
              onChange={alCambiar}
              error={errores.prioridad}
            />
            <Campo
              etiqueta="Dia planificado"
              nombre="fechaPlanificada"
              tipo="date"
              value={valores.fechaPlanificada}
              onChange={alCambiar}
              error={errores.fechaPlanificada}
            />
          </div>

          <div className={estilos.accionesBuscador}>
            <Boton type="submit" icono={Save} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar actividad'}
            </Boton>
            <Boton type="button" variante="secundario" onClick={alIntentarCerrar} disabled={guardando}>
              Cancelar
            </Boton>
          </div>
        </form>
      </Dialogo>

      <Confirmacion
        abierto={mostrarConfirmacionCerrar}
        titulo="¿Desea salir sin guardar?"
        textoConfirmar="Salir y descartar"
        alConfirmar={() => {
          setMostrarConfirmacionCerrar(false);
          cerrarLimpiando();
        }}
        alCancelar={() => setMostrarConfirmacionCerrar(false)}
      >
        <p>
          Hay datos ingresados en el formulario de registro de la actividad. Si cierra la ventana ahora, se
          perderán todos los cambios de esta operación.
        </p>
      </Confirmacion>

      <Confirmacion
        abierto={advertencias !== null}
        titulo="Confirmar el registro"
        textoConfirmar="Registrar de todos modos"
        varianteConfirmar="primario"
        ocupado={guardando}
        alConfirmar={() => guardar(true)}
        alCancelar={() => setAdvertencias(null)}
      >
        <p>El servidor advierte lo siguiente:</p>
        <ul className={estilos.advertencias}>
          {(advertencias || []).map((advertencia) => (
            <li key={advertencia}>{advertencia}</li>
          ))}
        </ul>
      </Confirmacion>
    </>
  );
}
