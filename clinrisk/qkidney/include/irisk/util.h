/* 
 * Copyright 2010 ClinRisk Ltd.
 * (ліцензійний коментар залишено без змін)
 *
 * XML source: Q54_kidney_xml_51_neph5_1.xml
 * STATA dta time stamp: 25 Mar 2010 07:28
 * C file create date: Wed Nov 10 14:00:12 GMT 2010
 */

#ifndef IRISK_UTIL_H
#define IRISK_UTIL_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stddef.h>   /* size_t */
#include <string.h>   /* може вже містити прототип strlcat */

/* Базові утиліти */
int  is_boolean(int b);
int  d_in_range(double x, double min, double max);
int  i_in_range(int x, int min, int max);

/* ВАЖЛИВО: робимо прототип сумісним зі стандартним BSD strlcat.
   Якщо ваша libc вже реалізує strlcat, це лише узгоджене оголошення.
   Реалізацію у util.c за потреби загорніть умовно, щоб уникнути
   дублювання символів під час лінкування. */
size_t strlcat(char *dst, const char *src, size_t n);

#ifdef __cplusplus
} /* extern "C" */
#endif

#endif /* IRISK_UTIL_H */
