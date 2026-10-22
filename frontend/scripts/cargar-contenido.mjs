#!/usr/bin/env node
/**
 * Carga el contenido institucional inicial a traves de la API real.
 *
 * Por que un script y no texto dentro de los componentes: el contenido publico
 * es un dato del sistema, no parte de la interfaz. Vive en la tabla
 * contenido_publico y se administra con los endpoints de /api/admin/contenido.
 * Escribirlo en el codigo daria una pagina que se ve bien pero que no consume
 * el backend y que nadie podria corregir despues sin tocar el repositorio.
 *
 * El script no toca la base de datos directamente: inicia sesion y usa las
 * mismas operaciones que usaria una persona, con sus validaciones y su control
 * de acceso.
 *
 * Uso:
 *   node scripts/cargar-contenido.mjs
 *   node scripts/cargar-contenido.mjs --api http://localhost:8080 \
 *        --usuario coordinador@ikernell.com --clave Dev12345
 *
 * Es seguro repetirlo: omite las piezas cuyo titulo ya existe.
 */

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));

function argumento(nombre, porDefecto) {
  const indice = process.argv.indexOf(`--${nombre}`);
  return indice !== -1 && process.argv[indice + 1] ? process.argv[indice + 1] : porDefecto;
}

const API = argumento('api', process.env.IKERNELL_API || 'http://localhost:8080');
const USUARIO = argumento('usuario', process.env.IKERNELL_USUARIO || 'coordinador@ikernell.com');
const CLAVE = argumento('clave', process.env.IKERNELL_CLAVE || 'Dev12345');

/** Almacen de cookies minimo: fetch no las conserva entre peticiones. */
const galletas = new Map();

function guardarCookies(respuesta) {
  for (const cruda of respuesta.headers.getSetCookie?.() ?? []) {
    const [par] = cruda.split(';');
    const separador = par.indexOf('=');
    if (separador > 0) {
      galletas.set(par.slice(0, separador).trim(), par.slice(separador + 1).trim());
    }
  }
}

function cabeceraCookie() {
  return [...galletas].map(([nombre, valor]) => `${nombre}=${valor}`).join('; ');
}

async function llamar(ruta, { metodo = 'GET', cuerpo } = {}) {
  const cabeceras = { Cookie: cabeceraCookie() };

  if (metodo !== 'GET') {
    const token = galletas.get('XSRF-TOKEN');
    if (token) {
      cabeceras['X-XSRF-TOKEN'] = decodeURIComponent(token);
    }
  }
  if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json; charset=utf-8';
  }

  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  guardarCookies(respuesta);

  const tipo = respuesta.headers.get('content-type') || '';
  const datos = tipo.includes('application/json') ? await respuesta.json() : await respuesta.text();

  if (!respuesta.ok) {
    const detalle = datos?.mensaje || respuesta.statusText;
    throw new Error(`${metodo} ${ruta} -> ${respuesta.status}: ${detalle}`);
  }
  return datos;
}

async function main() {
  const contenido = JSON.parse(await readFile(resolve(AQUI, 'contenido-inicial.json'), 'utf8'));

  console.log(`API: ${API}`);
  await llamar('/api/auth/csrf');
  await llamar('/api/auth/login', { metodo: 'POST', cuerpo: { correoCorporativo: USUARIO, password: CLAVE } });
  // La sesion cambia de identificador al autenticar; hay que renovar el token.
  await llamar('/api/auth/csrf');
  console.log(`Sesion iniciada como ${USUARIO}`);

  let creadas = 0;
  let omitidas = 0;

  for (const [tipo, piezas] of Object.entries(contenido)) {
    const existentes = await llamar(`/api/admin/contenido?tipo=${tipo}`);
    const titulos = new Set((existentes.contenido || []).map((pieza) => pieza.titulo));

    for (const pieza of piezas) {
      if (titulos.has(pieza.titulo)) {
        console.log(`  = ${tipo}: "${pieza.titulo}" ya existe`);
        omitidas += 1;
        continue;
      }

      const creada = await llamar('/api/admin/contenido', { metodo: 'POST', cuerpo: { tipo, ...pieza } });
      // El contenido nace sin publicar, para que nada aparezca por descuido.
      await llamar(`/api/admin/contenido/${creada.id}/publicacion?publicada=true`, { metodo: 'POST' });
      console.log(`  + ${tipo}: "${pieza.titulo}" creada y publicada`);
      creadas += 1;
    }
  }

  await llamar('/api/auth/logout', { metodo: 'POST' });
  console.log(`\nListo. ${creadas} creadas, ${omitidas} omitidas.`);
}

main().catch((error) => {
  console.error(`\nERROR: ${error.message}`);
  process.exitCode = 1;
});
