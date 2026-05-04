# Cómo trabajamos en el Grupo 7

Esta guía es la fuente de verdad del flujo de trabajo. Si algo no está acá, preguntá antes de inventar.

## 1. Ramas

| Rama        | Para qué sirve                                  | ¿Quién mergea? |
|-------------|--------------------------------------------------|----------------|
| `main`      | Código entregable al profesor. Siempre estable. | Solo PRs aprobados desde `dev`, una vez por entrega de sprint. |
| `dev`       | Integración del equipo. De acá salen y vuelven todas las features. | PRs aprobados desde `feature/*` o `fix/*`. |
| `feature/*` | Nuevas funcionalidades. Salen de `dev`.          | El autor mergea su PR cuando tiene aprobación. |
| `fix/*`     | Correcciones de bugs. Salen de `dev` (o `main` si es hotfix). | Idem feature. |

**Reglas:**
- Nunca commitear directo a `main` ni a `dev`.
- Una rama, una funcionalidad. Si crece mucho, partila.
- Borrar la rama después de mergear.

### Convención de nombres
- `feature/gestion-usuarios`
- `feature/asistente-academico-situacion-actual`
- `fix/login-redirect`
- `chore/setup-ci`
- `docs/der`

Todo en kebab-case, en español, corto y descriptivo.

## 2. Commits

Estilo [Conventional Commits](https://www.conventionalcommits.org/) en español:

```
feat: agrega pantalla de login de estudiante
fix: corrige cálculo de correlatividades cuando hay materias optativas
docs: agrega DER del módulo de plan de estudios
chore: configura GitHub Actions
refactor: separa el servicio de auth en módulo propio
test: agrega tests del asistente académico
```

Mensajes en español, en presente, sin punto final, descriptivos.

## 3. Pull Requests

1. Subí tu rama a GitHub: `git push -u origin feature/mi-rama`
2. Abrí el PR contra `dev` (no contra `main`).
3. Completá la plantilla.
4. Pedí review en el grupo de WhatsApp / Trello mencionando al menos a 1 compañero.
5. Cuando tenga 1 aprobación y el CI esté en verde, mergeás vos.
6. Borrá la rama remota.

### Entregas a `main`
Al cierre de cada sprint, abrimos un PR `dev → main` con el changelog del sprint. Lo revisamos entre todos antes de mergear.

## 4. Setup local

```bash
# Backend
cd backend
npm install
cp .env.example .env   # cuando exista
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

## 5. Antes de abrir un PR

```bash
# Frontend
cd frontend && npm run lint && npm run build

# Backend
cd backend && npm test --if-present
```

Si el CI te tira rojo, **arreglalo antes de pedir review**. No lo dejes para que lo arregle el reviewer.

## 6. Decisiones técnicas

Toda decisión de arquitectura va a `docs/arquitectura.md`. Si vas a cambiar algo grande (estructura de carpetas, librería, modelo de datos), abrí primero un issue o avisá en el grupo para discutirlo.
