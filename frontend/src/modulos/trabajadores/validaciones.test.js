import assert from 'node:assert/strict';
import test from 'node:test';

import {
  esFormatoDireccionColombiana,
  formatearDireccionEstandar,
  sanitizarDocumento,
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

test('acepta nomenclatura urbana colombiana compleja y con ciudad', () => {
  assert.equal(esFormatoDireccionColombiana('Calle 45 # 12-30, Bogotá'), true);
  assert.equal(esFormatoDireccionColombiana('Avenida Carrera 68 # 26-48 Int 2 Apto 501'), true);
  assert.equal(esFormatoDireccionColombiana('Avenida Calle 26 # 68-10'), true);
  assert.equal(esFormatoDireccionColombiana('Carrera 15 Bis A # 120 30 Sur'), true);
  assert.equal(
    formatearDireccionEstandar('Calle 45 # 12-30 Apartamento 302'),
    'CLL 45 # 12-30 APTO 302',
  );
});

test('acepta referencias rurales y rechaza textos sin estructura de direccion', () => {
  assert.equal(esFormatoDireccionColombiana('Vereda San Isidro Finca Los Sauces'), true);
  assert.equal(esFormatoDireccionColombiana('Km 14 Vía al Llano, Hacienda El Roble'), true);
  assert.equal(esFormatoDireccionColombiana('A@#'), false);
  assert.equal(esFormatoDireccionColombiana('12345'), false);
  assert.equal(esFormatoDireccionColombiana('Casa verde'), false);
  assert.equal(esFormatoDireccionColombiana('Bogotá, Colombia'), false);
});

test('valida el catalogo ampliado de tipos de documento (CC, TI, CE, PA, PPT)', () => {
  assert.equal(validarCampoTrabajador('tipoIdentificacion', ''), 'Debe indicar el tipo de identificacion.');
  assert.equal(validarCampoTrabajador('tipoIdentificacion', 'CEDULA_CIUDADANIA'), null);
  assert.equal(validarCampoTrabajador('tipoIdentificacion', 'PASAPORTE'), null);

  // CC: solo numeros, 7 a 10 digitos
  assert.ok(validarCampoTrabajador('identificacion', '1234', 'CEDULA_CIUDADANIA'));
  assert.ok(validarCampoTrabajador('identificacion', 'AB123456', 'CEDULA_CIUDADANIA'));
  assert.equal(validarCampoTrabajador('identificacion', '1234567', 'CEDULA_CIUDADANIA'), null);
  assert.equal(validarCampoTrabajador('identificacion', '1010101010', 'CEDULA_CIUDADANIA'), null);

  // TI: solo numeros, 10 u 11 digitos
  assert.ok(validarCampoTrabajador('identificacion', '123456789', 'TARJETA_IDENTIDAD'));
  assert.equal(validarCampoTrabajador('identificacion', '1001234567', 'TARJETA_IDENTIDAD'), null);
  assert.equal(validarCampoTrabajador('identificacion', '10012345678', 'TARJETA_IDENTIDAD'), null);

  // CE: alfanumerico 6 a 12 caracteres
  assert.ok(validarCampoTrabajador('identificacion', '12345', 'CEDULA_EXTRANJERIA'));
  assert.equal(validarCampoTrabajador('identificacion', 'CE524102', 'CEDULA_EXTRANJERIA'), null);
  assert.equal(validarCampoTrabajador('identificacion', '524102', 'CEDULA_EXTRANJERIA'), null);

  // PA: alfanumerico 6 a 16 caracteres
  assert.ok(validarCampoTrabajador('identificacion', 'AB12', 'PASAPORTE'));
  assert.equal(validarCampoTrabajador('identificacion', 'AB123456', 'PASAPORTE'), null);

  // PPT: alfanumerico 7 a 10 caracteres
  assert.ok(validarCampoTrabajador('identificacion', '123456', 'PPT'));
  assert.equal(validarCampoTrabajador('identificacion', '12345678', 'PPT'), null);

  // Sanitizacion en tiempo real
  assert.equal(sanitizarDocumento('10A10B10', 'CEDULA_CIUDADANIA'), '101010');
  assert.equal(sanitizarDocumento('ab-1234', 'PASAPORTE'), 'AB1234');
});

test('valida fecha de nacimiento y tipo de trabajador', () => {
  assert.equal(validarCampoTrabajador('fechaNacimiento', '2008-01-01'), 'La fecha de nacimiento no es válida. Debe ser del 31/12/2007 o anterior');
  assert.equal(validarCampoTrabajador('fechaNacimiento', '2026-05-01'), 'La fecha de nacimiento no es válida. Debe ser del 31/12/2007 o anterior');
  assert.equal(validarCampoTrabajador('fechaNacimiento', '1940-01-01'), 'Ingrese una fecha de nacimiento válida (edad máxima permitida: 80 años)');
  assert.equal(validarCampoTrabajador('fechaNacimiento', '1985-06-15'), null);
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

test('serializa y normaliza la seleccion de especialidades y profesiones', () => {
  assert.deepEqual(listarEspecialidades('Frontend, Backend, Frontend'), ['Frontend', 'Backend']);
  assert.equal(serializarEspecialidades(['Frontend', 'Backend']), 'Frontend, Backend');
  assert.equal(validarCampoTrabajador('especialidadDesarrollo', ''), 'Debe indicar la especialidad de desarrollo.');
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
  assert.equal(porCategoria.LENGUAJE.includes('Java'), true);
  assert.equal(porCategoria.FRAMEWORK.includes('React'), true);
  assert.equal(porCategoria.BASE_DATOS.includes('PostgreSQL'), true);
  assert.notEqual(
    claveHabilidad({ categoria: 'AREA', nombre: 'Backend' }),
    claveHabilidad({ categoria: 'FRAMEWORK', nombre: 'Backend' }),
  );
});
