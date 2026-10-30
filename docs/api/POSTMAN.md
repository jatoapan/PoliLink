# Pruebas manuales con Postman

Importa el archivo `docs/api/PoliLink.postman_collection.json` desde
**Import** y **File**.

## Antes de enviar solicitudes

1. Un humano debe iniciar MySQL y Laravel según backend/README.md.
2. En Postman, ejecuta Obtener cookie CSRF y confirma que responde `204`.
3. La prueba de esa solicitud debe pasar y la variable `xsrfToken` debe dejar
   de aparecer en rojo. Postman conserva las cookies de localhost y la
   colección copia `XSRF-TOKEN` al encabezado necesario para POST, PATCH y
   DELETE.
4. Si la prueba falla, abre **Cookies** en la esquina superior derecha de
   Postman y confirma que, para `localhost`, existen `XSRF-TOKEN` y
   `laravel_session`. No continúes con login hasta que ambas estén presentes.

## Recorrido de Gabriel

1. Ejecuta una ruta del grupo Público.
2. Obtén la cookie CSRF.
3. Ejecuta Login Gabriel y luego Proponer mi comunidad.
   Usa un `newCommunityName` único; la colección guarda la propuesta en
   `communityCreationRequestId`.
4. Inicia sesión como administrador, ejecuta Listar propuestas de comunidades y
   luego Aprobar propuesta de comunidad. La colección guarda la comunidad creada
   en `communityId`.
5. Ejecuta Login solicitante después de aprobar y luego Mis comunidades, Crear
   evento, Editar evento creado y Cancelar evento creado.

Crear evento guarda automáticamente el ID retornado en eventId; las dos
solicitudes siguientes usan ese valor.

### Prueba manual de imágenes de eventos

Para completar el flujo de portada con el evento guardado en `eventId`, crea
una solicitud adicional en Postman si no aparece en la colección importada:

1. `POST {{baseUrl}}/api/events/{{eventId}}/image` con **Body → form-data** y una
   fila `image` de tipo **File**. Usa JPG, PNG o WebP de máximo 5 MB; espera
   `200` y guarda el `image_url` retornado.
2. Repite la misma solicitud con otro archivo para comprobar el reemplazo y
   que la URL cambie.
3. `DELETE {{baseUrl}}/api/events/{{eventId}}/image` sin cuerpo; espera `200` y
   confirma que `image_url` sea `null`.

No fijes manualmente `Content-Type`: Postman debe generar el boundary de
`multipart/form-data`. Estas acciones requieren el mismo organizador
responsable que creó el evento y responden `409` si el evento ya está
cancelado.

## Recorrido de membresías

1. Usa un usuario autenticado que no tenga una membresía activa en la
   comunidad objetivo.
2. Ejecuta Descubrir comunidades para localizar una comunidad y conserva su ID
   en `membershipCommunityId`.
3. Ejecuta Solicitar unirme a la comunidad; debe responder `201` y crear
   `pending/member`.
4. Ejecuta Mis membresías para consultar el estado y la metadata de paginación.
5. Ejecuta Cancelar solicitud o abandonar comunidad; debe responder `200` y
   dejar el estado `left`.
6. Vuelve a ejecutar Solicitar unirme para evidenciar la reactivación a
   `pending/member` con respuesta `200`.

La colección incluye la aprobación administrativa de propuestas; todavía no
incluye aprobación de membresías ni asignación de tutor.

## Recorrido de Darwin

1. Ejecuta Obtener cookie CSRF.
2. En la carpeta 03, ejecuta Buscar evento Hackathon TAWS; guarda su ID en
   registrationEventId automáticamente.
3. Cambia newStudentEmail por un correo único y ejecuta Registrar estudiante
   nuevo (carpeta 01).
4. Ejecuta Obtener cookie CSRF de nuevo y luego Login estudiante nuevo
   (inscripciones).
5. Ejecuta Inscribirme al evento (`201`), Cancelar mi inscripción (`200`) y
   vuelve a ejecutar Inscribirme al evento para capturar la reactivación
   (`200`).
6. Ejecuta Mis inscripciones.
7. Ejecuta Logout (carpeta 01), Obtener cookie CSRF y luego Login organizador
   semilla.
8. Ejecuta Lista de inscritos para ver los inscritos activos y el summary de
   cupos del evento.

## Datos semilla

- Usuario de la colección: gatumbac@espol.edu.ec y password.
- La comunidad creada obtiene su ID automáticamente; no depende de TAWS ni del ID 1.
- Categoría Hackatón: ID 3.
- Modalidad presencial: ID 1.
- Ubicación Campus Gustavo Galindo: ID 1.
- Usuarios semilla de inscripciones: student@espol.edu.ec y
  organizer@espol.edu.ec, ambos con password. El estudiante semilla ya tiene
  una inscripción activa en Hackathon TAWS, por lo que el recorrido de Darwin
  usa un estudiante nuevo para capturar la inscripción `201`.

Para probar el registro de Gabriel, cambia newStudentEmail por un correo único
en las variables de la colección; ese mismo correo se reutiliza en el
recorrido de Darwin.
