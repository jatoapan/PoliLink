# Contexto del proyecto: PoliLink

## Propósito

PoliLink es una propuesta para la materia Lenguajes de Programación. Se enmarca en la categoría **Gestión de comunidades ESPOL**. Su objetivo es conectar a los clubes y organizaciones estudiantiles con los estudiantes mediante una plataforma web centralizada para publicar, descubrir e inscribirse en eventos.

El problema observado es que los eventos se difunden de forma dispersa, principalmente en Instagram. Esto reduce su visibilidad: por ejemplo, un hackatón de TAWS debería poder llegar a estudiantes de distintas carreras interesados en participar.

## Alcance acordado

- Público: estudiantes, clubes y organizaciones estudiantiles de ESPOL.
- Los organizadores publican directamente sus eventos; no existe flujo de aprobación administrativa.
- Un administrador del sistema mantiene las categorías, modalidades y ubicaciones disponibles; esta función no modera eventos.
- Cada evento tiene título, descripción, imagen de portada opcional, categoría, fecha, hora, ubicación, modalidad, cupos y comunidad responsable.
- Los estudiantes consultan, filtran, se inscriben y cancelan su inscripción para reservar o liberar un cupo.
- No incluir: integración con sistemas institucionales, pagos, QR, validación de asistencia, correos ni calendario institucional. Son trabajo futuro.

## Tecnologías y arquitectura

- Aplicación web responsive.
- Frontend: React + TypeScript.
- Backend: Laravel + PHP, expuesto mediante API REST.
- Persistencia: MySQL.
- Arquitectura: cliente-servidor con patrón MVC en el backend.

## Requisitos asignados

| Responsable | Escritura | Lectura |
| --- | --- | --- |
| Gabriel Tumbaco | Crear, editar y cancelar eventos | Consultar y filtrar eventos |
| Darwin Díaz | Inscribirse y cancelar inscripción | Consultar inscritos y cupos disponibles |

## Estado de la propuesta LaTeX

- Archivo principal: `docs/latex/main.tex`.
- Contiene portada, problemática, objetivos, alcance, características, requisitos, arquitectura, lenguajes, bocetos de baja fidelidad y referencias.
- La portada debe permanecer monocromática, centrada y de tipografía uniforme; no usar colores ni logos externos.
- El diagrama de arquitectura fue ajustado para evitar texto superpuesto; mantener cuatro nodos compactos sin etiquetas sobre las flechas.
- Los bocetos actuales están dibujados en LaTeX como guía. Antes de entregar, crear el prototipo real en Figma e incorporar sus capturas si el docente lo exige.
- No hay compilador `pdflatex` instalado localmente; verificar la compilación en Overleaf.

## Fuentes y estilo

- Plantilla funcional: `../Plantilla_Propuesta_LP_2026.md`.
- Referencia de redacción: `/home/gabrieltumbaco/Documents/6S/LP/GUIA/Propuesta_LP.md`.
- Mantener redacción formal, directa y en español; evitar prometer funcionalidades fuera del alcance.
- Fuentes ya citadas: ESPOL clubes, programa de apoyo de clubes, mapa del campus, PHP y TypeScript.

## Próximo trabajo sugerido

1. Compilar `docs/latex/main.tex` en Overleaf y corregir cualquier detalle de maquetación.
2. Elaborar en Figma las pantallas: catálogo, detalle, crear evento, mis inscripciones y lista de inscritos.
3. Reemplazar o complementar los bocetos LaTeX con las capturas de Figma.
