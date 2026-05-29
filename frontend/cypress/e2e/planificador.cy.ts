// Demo E2E del Planificador de cursada (Asistente Academico).
//
// Usa el estudiante sembrado por defecto (seed): su plan tiene una cadena de
// correlatividades (AED -> PROG1 -> SO/BD1 -> ISW, AM1 -> AM2), asi que el
// planificador arma varios cuatrimestres hasta recibirse.
//
// Requiere el backend (npm run dev) y el frontend (npm run dev) levantados,
// con la base sembrada (seed) corrida al menos una vez.
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

describe("Planificador de cursada", () => {
  beforeEach(() => {
    iniciarSesion();
    cy.visit("/student/assistant");
    cy.get('[data-testid="planificador"]').scrollIntoView().should("be.visible");
  });

  it("arma un plan de varios cuatrimestres hasta recibirse", () => {
    // El sistema proyecta mas de un cuatrimestre respetando correlatividades.
    cy.get('[data-testid="periodo"]').its("length").should("be.greaterThan", 1);
    cy.get('[data-testid="periodo-materia"]').its("length").should("be.greaterThan", 1);
    // Cada periodo muestra su carga horaria semanal.
    cy.get('[data-testid="periodo"]').first().contains("h/sem");
  });

  it("mueve una materia a otro cuatrimestre sin perder materias ni romper correlatividades", () => {
    cy.get('[data-testid="periodo-materia"]').then(($materias) => {
      const total = $materias.length;
      // Mover la ultima materia del ultimo periodo hacia adelante siempre es valido
      // (ninguna materia depende de ella). No debe aparecer el aviso de bloqueo.
      cy.get('[data-testid="periodo"]').last().within(() => {
        cy.get('[data-testid="periodo-materia"]').last()
          .find('button[aria-label^="Mover"]').last().click();
      });
      cy.get("body").should("not.contain", "No se puede mover");
      // El plan reubica la materia: no se pierde ni se duplica ninguna.
      cy.get('[data-testid="periodo-materia"]').should("have.length", total);
    });
  });

  it("guarda el plan y compara el rendimiento contra lo planteado (plus)", () => {
    cy.get('input[aria-label="Horas por semana"]').clear().type("12");
    cy.contains("button", "Guardar plan").click();
    cy.contains("Planificacion guardada").should("be.visible");

    cy.get('[data-testid="planes-guardados"]').should("be.visible");
    cy.get('[data-testid="plan-guardado"]').first().within(() => {
      cy.contains("button", "Comparar rendimiento").click();
    });
    cy.get('[data-testid="comparacion"]').first().should("contain", "materias previstas");
  });
});
