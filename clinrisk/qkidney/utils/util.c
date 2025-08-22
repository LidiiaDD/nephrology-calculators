/* 
 * Copyright 2010 ClinRisk Ltd.
 * 
 * This file is part of QKidney-2010 (http://qkidney.org, http://svn.clinrisk.co.uk/opensource/qkidney).
 * (ліцензійний коментар залишено без змін)
 *
 * XML source: Q54_kidney_xml_51_neph5_1.xml
 * STATA dta time stamp: 25 Mar 2010 07:28
 * C file create date: Wed Nov 10 14:00:12 GMT 2010
 */

#include <stddef.h>
#include <string.h>
#include <irisk/util.h>

/* ---------- базові утиліти ---------- */

int is_boolean(int b) {
    return (b == 0 || b == 1);
}

int d_in_range(double x, double min, double max) {
    return !(x < min || x > max);
}

int i_in_range(int x, int min, int max) {
    return !(x < min || x > max);
}

/* ---------- strlcat ----------
   Реалізація сумісна з BSD strlcat:
   повертає суму довжин вихідних рядків; гарантує NUL-термінатор.
   ВАЖЛИВО: якщо платформа вже має strlcat (Emscripten / libc),
   не компілюємо цю версію, щоб уникнути дублювання символів.
*/
#if !defined(__EMSCRIPTEN__) && !defined(HAVE_STRLCAT)

/* Локальний strnlen, щоб не покладатись на розширення */
static size_t my_strnlen(const char *s, size_t max) {
    size_t n = 0;
    while (n < max && s[n] != '\0') n++;
    return n;
}

size_t strlcat(char *dst, const char *src, size_t size) {
    size_t dlen = my_strnlen(dst, size);
    size_t slen = strlen(src);

    /* Немає місця навіть для існуючого dst => повертаємо те,
       що було б, якби буфер був безмежним */
    if (dlen == size) {
        return size + slen;
    }

    /* Скільки байтів можна скопіювати, лишаючи місце під '\0' */
    size_t copy = size - dlen - 1;
    if (copy > slen) copy = slen;

    memcpy(dst + dlen, src, copy);
    dst[dlen + copy] = '\0';

    return dlen + slen;
}
#endif /* !__EMSCRIPTEN__ && !HAVE_STRLCAT */
