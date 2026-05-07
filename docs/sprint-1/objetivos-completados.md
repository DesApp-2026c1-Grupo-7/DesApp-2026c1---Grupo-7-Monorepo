# Objetivos Sprint 1 - Completados

Este documento resume el cumplimiento de los objetivos planteados para el Sprint 1 (16/04/2026 - 07/05/2026).

## 1. Identificación de Actores y Funcionalidades
- **Documentación:** Se detallan en `docs/sprint-1/actores-y-funcionalidades.md` y `docs/sprint-1/casos-de-uso-detallados.md`.
- **Actores identificados:** Estudiante y Administrador.
- **Funcionalidades principales:** Gestión de usuarios, administración académica (carreras/planes/materias), carga de situación académica (manual/Excel), y asistente académico (proyecciones/planificador).

## 2. Diseño de Base de Datos (DER)
- **Documentación:** El modelo de datos está definido en `docs/sprint-1/DER.md`.
- **Implementación:** Los esquemas de Mongoose en `backend/src/models/` reflejan fielmente el diseño:
  - `User.js`, `Career.js`, `StudyPlan.js`, `Subject.js`, `Grade.js`, `AcademicOffer.js`, etc.

## 3. Arquitectura e Infraestructura
- **Documentación:** Definida en `docs/arquitectura.md`.
- **Entorno:** 
  - Estructura de monorepo (Backend Express / Frontend React + Vite).
  - Repositorio configurado con estándares de contribución (`CONTRIBUTING.md`).
  - Base de datos MongoDB configurada y con scripts de seed (`backend/src/utils/seed.js`).
  - CI configurado mediante GitHub Actions (`.github/workflows/ci.yml`).

## 4. Tests Unitarios y Validación
- **Implementación:** Se implementaron tests unitarios y de integración para las entidades principales.
- **Ubicación:** `backend/test/sprint1-debt.test.js`.
- **Cobertura:** Registro, gestión de carreras, carga de situación (Excel) y lógica del asistente académico.

## 5. Fichas de Seguimiento
- **Cierre Sprint 1:** `docs/sprint-1/cierre-sprint-1.md`.
- **Inicio Sprint 2:** `docs/sprint-2/ficha.md`.
