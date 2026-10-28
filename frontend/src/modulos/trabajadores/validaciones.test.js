import assert from 'node:assert/strict';
import test from 'node:test';

import {
  esFormatoDireccionColombiana,
  validarCampoTrabajador,
  validarTrabajador,
} from './validaciones.js';
import {
  listarEspecialidades,
  serializarEspecialidades,
} from './catalogoEspecialidades.js';
import {
  listarProfesiones,
  serializarProfesiones,
} from './catalogoProfesiones.js';
import { CATEGORIAS_HABILIDADES, claveHabilidad } from './catalogoHabilidades.js';

test('acepta nomenclatura urbana colombiana con ciudad', () => {
  assert.equal(esFormatoDireccionColombiana('Calle 45 # 12-30, Bogotá'), true);
});

test('acepta una referencia rural', () => {
  assert.equal(esFormatoDireccionColombiana('Vereda San Isidro, Finca El Porvenir'), true);
});

test('rechaza caracteres y textos sin una estructura de direccion reconocida', () => {
  assert.equal(esFormatoDireccionColombiana('A@#'), false);
  assert.equal(esFormatoDireccionColombiana('Bogotá, Colombia'), false);
});

test('valida campos requeridos y los limites actuales del backend', () => {
  assert.equal(validarCampoTrabajador('nombre', '   '), 'Debe indicar el nombre.');
  assert.equal(validarCampoTrabajador('identificacion', 'AB-123'), 'La identificacion solo puede contener digitos.');
  assert.equal(validarCampoTrabajador('identificacion', '123456789012'), 'La identificacion admite maximo 10 digitos.');
  assert.equal(validarCampoTrabajador('identificacion', '123456789'), 'Faltan 1 digitos para completar la identificacion.');
  assert.equal(validarCampoTrabajador('identificacion', '1234567890'), null);
});

test('valida fecha de nacimiento y tipo de trabajador', () => {
  assert.equal(validarCampoTrabajador('fechaNacimiento', '2008-01-01'), 'La fecha de nacimiento no es válida. Debe ser del 31/12/2007 o anterior');
  assert.equal(validarCampoTrabajador('fechaNacimiento', '2026-05-01'), 'La fecha de nacimiento no es válida. Debe ser del 31/12/2007 o anterior');
  assert.equal(validarCampoTrabajador('fechaNacimiento', '2007-12-31'), null);
  assert.equal(validarCampoTrabajador('tipoTrabajador', ''), 'Debe indicar el tipo de trabajador.');
  assert.equal(validarCampoTrabajador('tipoTrabajador', 'DESARROLLADOR'), null);
});

test('devuelve errores de todos los campos sin alterar los valores', () => {
  const valores = {
    identificacion: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    direccion: '',
    profesion: '',
    especialidadDesarrollo: '',
    tipoTrabajador: '',
  };

  assert.equal(Object.keys(validarTrabajador(valores)).length, 8);
  assert.equal(valores.nombre, '');
});

test('serializa y normaliza la seleccion de especialidades para enviar al backend', () => {
  assert.deepEqual(listarEspecialidades('Frontend, Backend, Frontend'), ['Frontend', 'Backend']);
  assert.equal(serializarEspecialidades(['Frontend', 'Backend']), 'Frontend, Backend');
  assert.equal(validarCampoTrabajador('especialidadDesarrollo', ''), 'Debe indicar la especialidad de desarrollo.');
});

test('serializa y normaliza la seleccion de profesiones para un backend de texto unico', () => {
  assert.deepEqual(listarProfesiones('Ingeniero de sistemas, Analista de sistemas'), [
    'Ingeniero de sistemas',
    'Analista de sistemas',
  ]);
  assert.equal(
    serializarProfesiones(['Ingeniero de sistemas', 'Otra profesión: Diseñador industrial']),
    'Ingeniero de sistemas, Otra profesión: Diseñador industrial',
  );
  assert.equal(validarCampoTrabajador('profesion', ''), 'Debe indicar la profesion.');
});

test('expone el catalogo solicitado sin imponer asociaciones entre categorias', () => {
  const porCategoria = Object.fromEntries(
    CATEGORIAS_HABILIDADES.map(({ valor, opciones }) => [valor, opciones]),
  );
  assert.deepEqual(porCategoria.AREA, ['Frontend', 'Backend', 'Full Stack', 'Desarrollo 1']);
  assert.deepEqual(porCategoria.LENGUAJE, [
    'Java',
    'JavaScript',
    'TypeScript',
    'PHP',
    'Python',
    'C#',
    'C++',
    'C',
    'Kotlin',
    'Swift',
  ]);
  assert.deepEqual(porCategoria.FRAMEWORK, ['React', 'Laravel', 'Spring Boot', 'Angular', 'Django']);
  assert.deepEqual(porCategoria.BASE_DATOS, ['MySQL', 'PostgreSQL', 'SQL Server', 'MongoDB']);
  assert.notEqual(
    claveHabilidad({ categoria: 'AREA', nombre: 'Backend' }),
    claveHabilidad({ categoria: 'FRAMEWORK', nombre: 'Backend' }),
  );
});
