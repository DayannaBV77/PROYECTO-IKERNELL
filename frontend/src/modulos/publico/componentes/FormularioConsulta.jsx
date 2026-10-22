import { useState } from 'react';
import { CircleCheck, TriangleAlert } from 'lucide-react';

import { enviarConsulta } from '../../../api/contenidoPublico.js';
import Boton from '../../../componentes/ui/Boton.jsx';
import Campo from '../../../componentes/ui/Campo.jsx';
import estilos from './FormularioConsulta.module.css';

const VACIO = { pregunta: '', nombreContacto: '', correoContacto: '', telefonoContacto: '' };

/**
 * Formulario publico de consultas (RF-035, HU-02).
 *
 * Tres detalles que exigen los criterios de aceptacion:
 *
 *  - El unico campo obligatorio es la pregunta; asi lo valida el servidor. Los
 *    datos de contacto son opcionales y se marcan como tales.
 *  - Ante un error, lo escrito NO se borra (HU-02 C03 y C04, RN-13): el estado
 *    del formulario no se reinicia y los mensajes por campo llegan en
 *    `ErrorRespuesta.campos`, es decir, redactados por el servidor.
 *  - La confirmacion es la que devuelve el backend (HU-02 C02). La consulta no
 *    se muestra en ninguna parte publica (HU-02 C05): este formulario solo
 *    envia.
 */
export default function FormularioConsulta() {
  const [valores, setValores] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setValores((previos) => ({ ...previos, [name]: value }));
    // Limpia solo el error del campo que se esta corrigiendo.
    setErrores((previos) => (previos[name] ? { ...previos, [name]: undefined } : previos));
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setFallo(null);
    setErrores({});

    try {
      const respuesta = await enviarConsulta(valores);
      setConfirmacion(respuesta?.mensaje || 'Su consulta fue enviada correctamente.');
      setValores(VACIO);
    } catch (error) {
      if (error.campos) {
        setErrores(error.campos);
      }
      setFallo(error.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={estilos.envoltura}>
      <h3 className={estilos.titulo}>Envie su consulta</h3>
      <p className={estilos.introduccion}>
        Si su duda no aparece entre las preguntas frecuentes, escribanos. No necesita registrarse
        ni iniciar sesion. Los campos marcados con asterisco son obligatorios.
      </p>

      {confirmacion && (
        <p className={`${estilos.aviso} ${estilos.confirmacion}`} role="status">
          <CircleCheck size={18} className={estilos.iconoAviso} aria-hidden="true" />
          {confirmacion}
        </p>
      )}

      {fallo && (
        <p className={`${estilos.aviso} ${estilos.fallo}`} role="alert">
          <TriangleAlert size={18} className={estilos.iconoAviso} aria-hidden="true" />
          {fallo}
        </p>
      )}

      <form className={estilos.formulario} onSubmit={alEnviar} noValidate>
        <Campo
          etiqueta="Su pregunta"
          nombre="pregunta"
          area
          obligatorio
          value={valores.pregunta}
          onChange={alCambiar}
          error={errores.pregunta}
          maxLength={4000}
          placeholder="Escriba aqui su consulta"
        />

        <div className={estilos.pareja}>
          <Campo
            etiqueta="Nombre"
            nombre="nombreContacto"
            value={valores.nombreContacto}
            onChange={alCambiar}
            error={errores.nombreContacto}
            maxLength={150}
            autoComplete="name"
          />
          <Campo
            etiqueta="Correo electronico"
            nombre="correoContacto"
            tipo="email"
            value={valores.correoContacto}
            onChange={alCambiar}
            error={errores.correoContacto}
            maxLength={150}
            autoComplete="email"
            pista="Para poder responderle."
          />
        </div>

        <Campo
          etiqueta="Telefono"
          nombre="telefonoContacto"
          tipo="tel"
          value={valores.telefonoContacto}
          onChange={alCambiar}
          error={errores.telefonoContacto}
          maxLength={50}
          autoComplete="tel"
        />

        <div className={estilos.acciones}>
          <Boton type="submit" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar consulta'}
          </Boton>
        </div>
      </form>
    </div>
  );
}
