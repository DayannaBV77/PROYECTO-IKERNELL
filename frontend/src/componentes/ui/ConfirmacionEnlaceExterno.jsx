import { useState } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

import Boton from './Boton.jsx';
import Dialogo from './Dialogo.jsx';
import estilos from './ConfirmacionEnlaceExterno.module.css';

const CLAVE_OMITIR = 'ikernell-omitir-aviso-externo';

export function debeOmitirAvisoExterno() {
  try {
    return sessionStorage.getItem(CLAVE_OMITIR) === 'true';
  } catch {
    return false;
  }
}

/**
 * Dialogo de confirmacion asistida antes de abrir el correo corporativo o un
 * enlace externo en una nueva pestana.
 */
export default function ConfirmacionEnlaceExterno({
  abierto,
  esCorreo = true,
  url,
  alCancelar,
  alConfirmar,
}) {
  const [noVolverAAdvertir, setNoVolverAAdvertir] = useState(false);

  const titulo = esCorreo ? 'Acceso a Correo Corporativo' : 'Apertura de Enlace Externo';
  const descripcion = esCorreo
    ? 'Estás a punto de abrir el cliente de correo corporativo en una nueva pestaña del navegador. Tu sesión actual en la plataforma permanecerá activa.'
    : 'Estás a punto de abrir un enlace externo en una nueva pestaña del navegador. Tu sesión actual en la plataforma permanecerá activa.';

  function confirmar() {
    if (noVolverAAdvertir) {
      try {
        sessionStorage.setItem(CLAVE_OMITIR, 'true');
      } catch {
        // sessionStorage puede estar deshabilitado.
      }
    }
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    if (alConfirmar) {
      alConfirmar();
    }
  }

  return (
    <Dialogo
      abierto={abierto}
      titulo={titulo}
      alCerrar={alCancelar}
      className={estilos.dialogoExterno}
    >
      <div className={estilos.cuerpo} data-testid="external-link-confirm-dialog">
        <div className={estilos.avisoSeguro}>
          <ShieldCheck size={18} strokeWidth={1.75} className={estilos.iconoSeguro} aria-hidden="true" />
          <p className={estilos.mensaje}>{descripcion}</p>
        </div>

        <label className={estilos.opcionRecordar}>
          <input
            type="checkbox"
            checked={noVolverAAdvertir}
            onChange={(e) => setNoVolverAAdvertir(e.target.checked)}
          />
          <span>No volver a advertirme durante esta sesión</span>
        </label>

        <div className={estilos.acciones}>
          <Boton
            type="button"
            variante="secundario"
            onClick={alCancelar}
            data-testid="external-confirm-cancel"
          >
            Cancelar
          </Boton>
          <Boton
            type="button"
            variante="primario"
            icono={ExternalLink}
            onClick={confirmar}
            data-testid="external-confirm-continue"
          >
            Continuar y abrir
          </Boton>
        </div>
      </div>
    </Dialogo>
  );
}
