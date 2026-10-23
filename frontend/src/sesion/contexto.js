import { createContext, useContext } from 'react';

/**
 * Contexto de la sesion abierta.
 *
 * Vive separado del proveedor para que el archivo del componente exporte
 * unicamente componentes, por el mismo motivo que enlaces.js no esta dentro del
 * layout.
 *
 * El valor expone:
 *  - `sesion`: SesionResponse del servidor, o null si no hay nadie dentro.
 *  - `comprobando`: true hasta que la primera consulta a /api/auth/sesion
 *    responde. Distinguirlo de "no hay sesion" es lo que evita que una recarga
 *    eche de la pantalla a quien si tiene la sesion abierta.
 *  - `fallo`: solo para errores que no sean el 401 de "no hay sesion"; un corte
 *    de red no debe interpretarse como que el trabajador salio.
 *  - `entrar` y `salir`.
 */
export const ContextoSesion = createContext(null);

export function useSesion() {
  const valor = useContext(ContextoSesion);
  if (!valor) {
    throw new Error('useSesion exige que el arbol este dentro de ProveedorSesion.');
  }
  return valor;
}
