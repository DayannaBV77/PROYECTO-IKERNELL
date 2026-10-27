import assert from 'node:assert/strict';
import test from 'node:test';

import {
  esFormatoDireccionColombiana,
  validarCampoTrabajador,
  validarTrabajador,
} from './validaciones.js';
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
  assert.equal(validarCampoTrabajador('identificacion', '123456789012'), 'La identificacion admite hasta 11 digitos.');
  assert.equal(validarCampoTrabajador('identificacion', '12345678901'), null);
});

test('valida fecha de nacimiento y tipo de trabajador', () => {
  assert.equal(validarCampoTrabajador('fechaNacimiento', '2999-01-01'), 'La fecha de nacimiento debe ser una fecha valida anterior a hoy.');
  assert.equal(validarCampoTrabajador('fechaNacimiento', '2000-02-30'), 'La fecha de nacimiento debe ser una fecha valida anterior a hoy.');
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
