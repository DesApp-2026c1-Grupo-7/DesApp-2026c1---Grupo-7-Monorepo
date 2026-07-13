// Demo E2E del Planificador de cursada (Asistente Academico).
//
// Usa el estudiante sembrado por defecto (seed): carrera TUP (UNAHUR) con una cadena
// de correlatividades real (IP -> PROG1 -> PROG2 -> PROG3, BD1 -> BD2, OC -> SO -> RED...),
// asi que el planificador arma varios cuatrimestres hasta recibirse. El estudiante tiene
// 1er anio aprobado y PROG2 "Cursando" (su correlativa PROG3 no debe ir en el primer cuatri).
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

  it("no ubica en el primer cuatrimestre una materia cuya correlativa esta en curso", () => {
    // PROG2 esta "Cursando" (no aprobada) en el seed y PROG3 depende de PROG2:
    // PROG3 NO puede aparecer en el primer cuatrimestre del plan.
    cy.get('[data-testid="periodo"]').first().within(() => {
      cy.get('[data-testid="periodo-materia"]').should("not.contain", "Programacion III");
    });
    // Pero el plan igual la incluye mas adelante (llega hasta recibirse).
    cy.get('[data-testid="planificador"]').should("contain", "Programacion III");
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
    cy.contains("Planificación guardada").should("be.visible");

    cy.get('[data-testid="planes-guardados"]').should("be.visible");
    cy.get('[data-testid="plan-guardado"]').first().within(() => {
      cy.contains("button", "Comparar rendimiento").click();
    });
    cy.get('[data-testid="comparacion"]').first().should("contain", "materias previstas");
  });
});
