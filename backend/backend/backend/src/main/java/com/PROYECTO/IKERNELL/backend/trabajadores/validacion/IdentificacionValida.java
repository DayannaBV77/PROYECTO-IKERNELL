package com.PROYECTO.IKERNELL.backend.trabajadores.validacion;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Valida dinamicamente el campo identificacion segun el tipo de identificacion:
 * - CEDULA_CIUDADANIA (CC): solo digitos, maximo 10 digitos.
 * - CEDULA_EXTRANJERIA (CE): solo digitos, maximo 7 digitos.
 * Se permiten longitudes menores (no se exige longitud fija).
 */
@Documented
@Constraint(validatedBy = IdentificacionValidaValidator.class)
@Target({ ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
public @interface IdentificacionValida {

	String message() default "La identificación no es válida para el tipo de documento seleccionado.";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

}
