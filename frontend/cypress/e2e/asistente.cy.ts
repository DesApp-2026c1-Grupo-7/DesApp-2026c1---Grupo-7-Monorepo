// Demo E2E del Asistente Academico - Analisis de situacion y proyecciones (punto 4.1 y 4.2).
//
// Usa el estudiante sembrado por defecto (seed TUP de UNAHUR): tiene 1er anio aprobado
// (anio "Completo"), BD2 aprobada, IS1 regular y PROG2 en curso.
//
// Requiere backend (npm run dev) y frontend (npm run dev) levantados con la base sembrada.
// Verlo en vivo:   cd frontend && npm run cy:open
// Correrlo de una: cd frontend && npm run cy:run

const estudiante = {
  email: "estudiante@universidad.edu",
  password: "estudiante123",
};

function iniciarSesion() {
  cy.clearLocalStorage();
  cy.visit("/");
  cy.get("#email").type(estudiante.email);
  cy.get("#password").type(estudiante.password);
  cy.contains("button", "Iniciar Sesión").click();
  cy.location("pathname").should("eq", "/student");
}

describe("Asistente Academico - situacion y proyecciones", () => {
  beforeEach(() => {
    iniciarSesion();
    cy.visit("/student/assistant");
  });

  it("muestra el avance por anio con un anio completo y las materias faltantes", () => {
    cy.contains("h3", "Avance por año").scrollIntoView();
    // El 1er anio esta completo en el seed.
    cy.contains("✓ Completo").should("be.visible");
    // Y se muestran las materias faltantes por anio (requisito del 4.1).
    cy.contains("Faltantes:").should("exist");
  });

  it("lista materias en las que el estudiante puede inscribirse", () => {
    cy.contains("h3", "Materias disponibles").scrollIntoView();
    cy.contains("button", "Inscribirse").should("exist");
  });

  it("¿que pasa si? regularizar la materia en curso habilita su correlativa", () => {
    cy.contains("h3", "Que pasa si").scrollIntoView();
    // Solo PROG2 esta en curso: la marcamos y simulamos.
    cy.contains("button", "Aprobar/Regularizar").click();
    cy.contains("button", "Ejecutar Simulacion").click();
    // Al regularizar PROG2 (con BD2 ya aprobada) se desbloquea Programacion III.
    cy.contains("Nuevas materias desbloqueadas").should("be.visible");
    cy.contains("Programacion III").should("be.visible");
  });
});
