package com.PROYECTO.IKERNELL.backend.trabajadores.validacion;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Documented
@Constraint(validatedBy = DireccionColombianaValidator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER, ElementType.ANNOTATION_TYPE, ElementType.RECORD_COMPONENT })
@Retention(RetentionPolicy.RUNTIME)
public @interface DireccionColombiana {

	String message() default "Use nomenclatura urbana (ej.: Calle 45 # 12-30) o una referencia rural (vereda, finca, corregimiento o km).";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
