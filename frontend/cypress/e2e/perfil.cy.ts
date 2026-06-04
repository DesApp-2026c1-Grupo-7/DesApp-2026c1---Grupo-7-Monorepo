// Demo E2E: el perfil de otro estudiante se ve bien en mobile (sin desborde horizontal).
// Cubre el arreglo de responsive de ExternalProfile.
//
// Usa los dos estudiantes sembrados (perfil publico por defecto, asi que se pueden ver).
// Requiere backend + frontend levantados con la base sembrada.

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

describe("Perfil de un contacto - responsive", () => {
  it("se ve sin desborde horizontal en una pantalla de celular", () => {
    iniciarSesion();
    cy.visit("/student/social");

    // Buscamos al segundo estudiante sembrado y abrimos su perfil.
    cy.get(".search-bar-input").type("Segundo");
    cy.get(".search-result-item").contains("Segundo Estudiante").click();
    cy.location("pathname").should("include", "/student/perfil/");

    // En viewport de celular el contenido no debe generar scroll horizontal.
    cy.viewport(375, 720);
    cy.contains("Perfil del Estudiante").should("be.visible");
    cy.document().then((doc) => {
      const el = doc.documentElement;
      expect(el.scrollWidth).to.be.lte(el.clientWidth + 1);
    });
  });
});
