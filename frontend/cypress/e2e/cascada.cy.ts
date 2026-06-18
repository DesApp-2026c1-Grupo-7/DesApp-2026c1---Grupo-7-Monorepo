// E2E: el planificador reacomoda en cascada en vez de bloquear.
// Requiere backend (npm run dev) y frontend (npm run dev) levantados con el seed corrido.

const estudiante = { email: "estudiante@universidad.edu", password: "estudiante123" };

function iniciarSesion() {
  cy.clearLocalStorage();
  cy.visit("/");
  cy.get("#email").type(estudiante.email);
  cy.get("#password").type(estudiante.password);
  cy.contains("button", "Iniciar Sesión").click();
  cy.location("pathname").should("eq", "/student");
}

describe("Planificador - reacomodo en cascada", () => {
  beforeEach(() => {
    iniciarSesion();
    cy.visit("/student/assistant");
    cy.get('[data-testid="planificador"]').scrollIntoView().should("be.visible");
  });

  it("nunca bloquea un movimiento y no pierde materias", () => {
    cy.get('[data-testid="periodo-materia"]').then(($m) => {
      const total = $m.length;
      cy.get('[data-testid="periodo"]').first().within(() => {
        cy.get('[data-testid="periodo-materia"]').first()
          .find('button[aria-label^="Mover"]').last().click();
      });
      cy.get("body").should("not.contain", "No se puede mover");
      cy.get('[data-testid="periodo-materia"]').should("have.length", total);
    });
  });

  it("muestra un aviso cuando reacomoda materias", () => {
    cy.get('[data-testid="periodo"]').first().within(() => {
      cy.get('[data-testid="periodo-materia"]').first()
        .find('button[aria-label^="Mover"]').last().click();
    });
    cy.get(".assistant-alert.success").should("be.visible");
  });
});
