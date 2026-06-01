# Guion de demo — Asistente Académico (Grupo 7)

Guion para que la presentación fluya y se vea el "show". Pensado sobre los datos
que carga el seed automáticamente al levantar el backend (carrera **TUP de UNAHUR**,
Plan 2023 con correlativas reales y una situación académica de demo ya cargada).

## Antes de empezar

1. Backend: `cd backend && npm run dev` (siembra la base sola en cada arranque).
2. Frontend: `cd frontend && npm run dev` → http://localhost:5173
3. Cuentas sembradas:
   - **Admin**: `admin@universidad.edu` / `admin123`
   - **Estudiante (con historia académica)**: `estudiante@universidad.edu` / `estudiante123`
   - **Estudiante 2 (para contactos/feed)**: `estudiante2@universidad.edu` / `estudiante123`

> El estudiante de demo ya tiene: 1er año 1C completo (IP, MAT, OC, ING1 aprobadas),
> PROG1 y BD1 aprobadas, ED regular y **PROG2 en curso**. Esto hace que el planificador,
> el "¿qué pasa si?" y el avance por año muestren datos reales de entrada.

---

## Parte 1 — Admin: carreras y planes (2-3 min)

Logueado como **admin**:

1. **Carreras** → mostrar la TUP ya cargada. Crear una carrera nueva en vivo
   (solo datos básicos) para mostrar que **la carrera se crea sola**.
2. **Planes de estudio** → abrir el Plan 2023 de la TUP. Mostrar que el plan:
   - se asocia a **una carrera** (select),
   - define materias con año/cuatrimestre/horas/créditos,
   - y **correlativas** (ej: PROG2 requiere PROG1 y ED). Este es el dato clave que
     después usa el planificador.
3. **Oferta académica** → mostrar la oferta del período (materias inscribibles).

> Mensaje: "Primero la carrera, después el plan que apunta a esa carrera, y dentro
> del plan las correlativas. Todo lo demás del asistente se calcula a partir de acá."

---

## Parte 2 — Estudiante: análisis de situación (3 min)

Logueado como **estudiante@universidad.edu**, ir a **Asistente Académico**:

1. **Tu avance**: porcentaje general, créditos y UNAHUR faltantes.
2. **Avance por año**: mostrar las tarjetas con barra de progreso, el badge
   **✓ Completo** en 1er año 1C, y el desglose **aprobadas / regulares / cursando / faltantes**.
3. **Materias disponibles**: las que puede cursar según lo que ya hizo y la oferta.
   Mostrar el filtro por **oferta académica** (Plus del 4.1) y por año/tipo.
4. **Finales pendientes**: intentos previos y vencimiento de regularidad.

---

## Parte 3 — Proyecciones (4 min, el corazón del sprint)

1. **¿Qué pasa si...?**
   - Seleccionar **PROG2** (la materia en curso) como "a regularizar".
   - Ejecutar → mostrar qué materias se **desbloquean** (PROG3 aparece) y por qué
     correlativa.

2. **Planificador de cursada** (mostrar las 3 etapas):
   - **Etapa 1 (automático):** se arma el plan **hasta recibirse** respetando
     correlativas y horas. Señalar que las materias **aprobadas/cursando/regulares
     no se planifican** (no aparecen ED ni PROG2).
   - **Punto fuerte / fix:** PROG2 está **en curso, no aprobada** → su correlativa
     PROG3 **NO** aparece en el primer cuatrimestre, recién más adelante. Mostrar que
     intentar mover PROG3 al primer cuatrimestre con la **flechita** ◀ es **bloqueado**
     con un mensaje claro.
   - **Etapa 2 (editar):** mover materias entre cuatrimestres con ◀ ▶; la **carga
     horaria** de cada cuatri se recalcula sola y avisa si hay sobrecarga.
   - Cambiar **horas por semana** y **Regenerar plan automático** para mostrar cómo
     se redistribuye.
   - **Guardar** el plan con un nombre.

3. **Etapa 3 (seguimiento / recálculo):**
   - En **Planes guardados** → "Comparar rendimiento".
   - Mostrar el detalle **por período**: "planeaste N, cumpliste M" y las
     **materias atrasadas** (las que se había propuesto y no aprobó/regularizó).
   - Mensaje: "Al cerrar el cuatri cargo lo que realmente aprobé; si quedé atrasado,
     regenero el plan y el sistema reacomoda lo que falta."

---

## Parte 4 — Red social (3 min)

Con **estudiante@** y **estudiante2@** (dos navegadores / ventana incógnito):

1. **Buscar** al otro estudiante y enviarle una invitación de contacto.
   - En el que **envía**: aparece "Invitación enviada" (no la puede aceptar él mismo).
   - En el que **recibe**: aparece "Aceptar solicitud".
2. Aceptar y mostrar que quedan como **contactos**.
3. **Perfil del contacto**: abrir su perfil (con foto) y mostrar que el **responsive**
   funciona (achicar la ventana).
4. **Feed académico**: publicar algo desde "Compartí algo académico…" y verlo en el
   feed del contacto.
5. **Público vs privado**: en Configuración, poner el perfil en **privado** y mostrar
   que solo los contactos ven sus posteos / su perfil; en **público**, lo ve cualquiera.

---

## Cierre (30 s)

Recorrido completo del punto 4 del enunciado: situación actual, proyecciones
(¿qué pasa si? + planificador en 3 etapas) y la red social con privacidad.
Todo sobre una carrera real de UNAHUR para que las correlatividades se vean de verdad.
