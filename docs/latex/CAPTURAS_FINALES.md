# Guía para las capturas finales del informe

El informe final debe incluir una sola evidencia frontend por integrante. Para
mostrar la landing completa se agregarán cuatro vistas generales, con un máximo
de seis imágenes en total. Las capturas deben
mostrar la aplicación ejecutándose, sin código, DevTools, credenciales,
terminales ni información personal visible.

## Preparación

1. Actualizar el repositorio en la rama `main`.
2. Iniciar MySQL, Laravel y Vite siguiendo las instrucciones del README raíz.
3. Usar datos de demostración preparados: una comunidad activa, una solicitud
   de creación de comunidad pendiente y al menos un evento publicado.
4. Abrir el frontend en el navegador y usar una ventana de aproximadamente
   1440 x 900 px.
5. Verificar que las imágenes, nombres, fechas, cupos y estados visibles sean
   datos de prueba apropiados para compartir.
6. Tomar capturas en formato PNG, con el navegador limpio y sin el cursor
   ocultando botones o texto.

## Captura de Gabriel

Guardar como:

```text
docs/latex/images/resultado-gabriel-eventos.png
```

Pasos:

1. Iniciar sesión con una cuenta organizadora.
2. Abrir `/mis-eventos` y esperar a que cargue una actividad publicada.
3. Mostrar la tarjeta del evento con las acciones `Editar evento`, `Cancelar`
   y `Ver inscritos`.
4. Confirmar que el título, estado, fecha, comunidad y botones sean legibles.

La evidencia demuestra la gestión de eventos propios implementada por Gabriel.

## Captura de Darwin

Guardar como:

```text
docs/latex/images/resultado-darwin-admin-comunidades.png
```

Pasos:

1. Iniciar sesión con una cuenta que tenga permisos administrativos.
2. Abrir `/admin/solicitudes-comunidades`.
3. Asegurar que exista una solicitud pendiente visible.
4. Mostrar la información de la comunidad y las acciones de aprobar o
   rechazar.
5. Mantener la captura en un estado seguro antes de confirmar una mutación;
   no es necesario ejecutar la aprobación durante la evidencia.
6. Confirmar que el nombre, estado, botones y paginación sean legibles.

La evidencia demuestra el panel administrativo y la revisión de solicitudes de
creación de comunidades implementada por Darwin.

## Capturas generales de la landing

Estas cuatro imágenes son complementarias y muestran la landing por secciones.
No se presentan como una segunda evidencia de Gabriel o Darwin.

### Landing: hero

Guardar como:

```text
docs/latex/images/resultado-general-landing-01-hero.png
```

Pasos:

1. Abrir `/` sin iniciar sesión y volver al inicio de la página.
2. Mostrar el hero, el texto principal y los botones `Explorar eventos` y
   `Ver comunidades`.

### Landing: métricas y eventos

Guardar como:

```text
docs/latex/images/resultado-general-landing-02-metricas-eventos.png
```

Pasos:

1. Desplazarse hasta la franja de métricas.
2. Mostrar las métricas cargadas y el inicio de `Explora lo que está pasando`.
3. Confirmar que las tarjetas de eventos tengan datos de demostración legibles.

### Landing: comunidades y funcionamiento

Guardar como:

```text
docs/latex/images/resultado-general-landing-03-comunidades-funciona.png
```

Pasos:

1. Desplazarse hasta `Comunidades con las que puedes conectar`.
2. Mostrar las tarjetas de comunidades y la sección `Así funciona PoliLink`.
3. Verificar que no aparezcan estados de carga, errores o catálogos vacíos.

### Landing: llamado final

Guardar como:

```text
docs/latex/images/resultado-general-landing-04-cta-final.png
```

Pasos:

1. Desplazarse hasta el CTA `¿Organizas una comunidad?`.
2. Mostrar el enlace `Organizar una comunidad` y el cierre visual de la página.
3. Mantener la captura limpia y con el texto completamente legible.

## Verificación antes de entregar la fuente

- [ ] Las seis rutas o vistas cargan sin errores.
- [ ] Las capturas tienen extensión `.png` y los nombres exactos.
- [ ] No aparecen DevTools, terminales, contraseñas ni datos personales.
- [ ] La imagen de Gabriel muestra la gestión de eventos propios.
- [ ] La imagen de Darwin muestra una solicitud administrativa pendiente.
- [ ] Las cuatro imágenes generales cubren todas las secciones de la landing.
- [ ] Las capturas se ven nítidas al 100% de zoom.
- [ ] Se agregaron las seis imágenes dentro de `docs/latex/images/`.
- [ ] Se revisaron visualmente portada, tablas, captions, resultados,
  conclusiones, recomendaciones y referencias si se realizó una compilación.
