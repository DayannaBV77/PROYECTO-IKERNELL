import { useRef, useState } from 'react';
import { ImagePlus, TriangleAlert, UserRound } from 'lucide-react';

import { adjuntarFotografia } from '../../../api/trabajadores.js';
import Boton from '../../../componentes/ui/Boton.jsx';
import gestion from '../../../estilos/gestion.module.css';
import estilos from './SubidaFotografia.module.css';

/**
 * Fotografia del perfil (RF-002, HU-04 C04 y C05).
 *
 * El formato y el tamano los valida el servidor con los limites que configure
 * la empresa (D-11): el cliente no los repite porque no los conoce, y
 * duplicarlos aqui significaria que un cambio de configuracion dejaria los dos
 * lados en desacuerdo. El atributo `accept` solo orienta al selector de
 * archivos; la decision sigue siendo del servidor.
 *
 * Cuando el archivo se rechaza, el perfil no se toca (C05): se muestra el
 * motivo que da el servidor y se puede elegir otro archivo o dejarlo sin
 * fotografia.
 *
 * La imagen se pide a /api/trabajadores/{id}/fotografia. No se descarga a un
 * blob: la cookie de sesion viaja sola en la peticion de la etiqueta <img>, y
 * el navegador se encarga de la descarga y del descarte.
 */
export default function SubidaFotografia({ trabajador, alActualizar }) {
  const entrada = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [fallo, setFallo] = useState(null);

  // `version` cambia la URL tras cada subida. El servidor responde sin cache,
  // pero si la direccion no cambia el navegador no vuelve a pedir la imagen y
  // seguiria mostrando la anterior.
  const [version, setVersion] = useState(0);
  const [imagenRota, setImagenRota] = useState(false);

  // `hayFotografia` se sostiene en el dato del servidor, no en que la subida
  // haya terminado: quien manda es `tieneFotografia` del perfil recargado.
  const hayFotografia = trabajador.tieneFotografia && !imagenRota;

  async function alElegir(evento) {
    const archivo = evento.target.files?.[0];
    if (!archivo) {
      return;
    }

    setSubiendo(true);
    setFallo(null);
    try {
      // La respuesta es el perfil actualizado: se lo pasa al perfil para que
      // `tieneFotografia` deje de ser una suposicion del cliente.
      alActualizar(await adjuntarFotografia(trabajador.id, archivo));
      setImagenRota(false);
      setVersion((numero) => numero + 1);
    } catch (error) {
      setFallo(error.message);
    } finally {
      setSubiendo(false);
      // Se limpia para que elegir el mismo archivo otra vez vuelva a disparar
      // el evento despues de corregir el motivo del rechazo.
      if (entrada.current) {
        entrada.current.value = '';
      }
    }
  }

  return (
    <div className={estilos.fotografia}>
      <p className={gestion.rotulo}>Fotografia</p>

      {hayFotografia ? (
        <img
          className={estilos.imagen}
          src={`/api/trabajadores/${trabajador.id}/fotografia?v=${version}`}
          alt={`Fotografia de ${trabajador.nombre} ${trabajador.apellido}`}
          // El perfil puede decir que tiene fotografia y el archivo no estar
          // disponible; en ese caso se cae al marcador en vez de dejar el hueco
          // de una imagen rota.
          onError={() => setImagenRota(true)}
        />
      ) : (
        <div className={estilos.marcador}>
          <UserRound size={40} strokeWidth={1.4} aria-hidden="true" />
          <span className={estilos.marcadorTexto}>
            {trabajador.tieneFotografia
              ? 'La fotografia del perfil no esta disponible.'
              : 'El perfil todavia no tiene fotografia.'}
          </span>
        </div>
      )}

      <input
        ref={entrada}
        className="solo-lectores"
        id="fotografia-trabajador"
        type="file"
        accept="image/jpeg,image/png"
        onChange={alElegir}
        disabled={subiendo}
      />

      <Boton
        icono={ImagePlus}
        variante="secundario"
        disabled={subiendo}
        onClick={() => entrada.current?.click()}
      >
        {subiendo
          ? 'Adjuntando...'
          : trabajador.tieneFotografia
            ? 'Reemplazar fotografia'
            : 'Adjuntar fotografia'}
      </Boton>

      {fallo && (
        <p className={gestion.avisoError} role="alert">
          <TriangleAlert size={16} aria-hidden="true" />
          {fallo}
        </p>
      )}
    </div>
  );
}
