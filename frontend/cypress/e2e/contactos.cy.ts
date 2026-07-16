// Demo E2E: crea dos usuarios desde la UI y los hace contactos entre si
// usando la busqueda de perfiles (sin mail).
//
// Requiere el backend (npm run dev) y el frontend (npm run dev) levantados.
// Verlo en vivo:   cd frontend && npm run cy:open
// Correrlo de una: cd frontend && npm run cy:run   (graba video en cypress/videos)

const sufijo = Date.now();

const ada = {
  nombre: `Cypress Ada ${sufijo}`,
  email: `cy.ada.${sufijo}@universidad.edu`,
  password: "demo1234",
};

const alan = {
  nombre: `Cypress Alan ${sufijo}`,
  email: `cy.alan.${sufijo}@universidad.edu`,
  password: "demo1234",
};

function registrar(u: { nombre: string; email: string; password: string }) {
  cy.clearLocalStorage();
  cy.visit("/register");
  cy.get("#nombre").type(u.nombre);
  cy.get("#email").type(u.email);
  cy.get("#password").type(u.password);
  cy.get("#confirmPassword").type(u.password);
  cy.get("select#carrera option").should("have.length.greaterThan", 0);
  cy.contains("button", "Registrarse").click();
  cy.location("pathname").should("eq", "/student");
}

function iniciarSesion(u: { email: string; password: string }) {
  cy.clearLocalStorage();
  cy.visit("/");
  cy.get("#email").type(u.email);
  cy.get("#password").type(u.password);
  cy.contains("button", "Iniciar Sesión").click();
  cy.location("pathname").should("eq", "/student");
}

describe("Crear dos usuarios y agregarlos como amigos", () => {
  it("registra a Ada y Alan y los hace contactos mutuos", () => {
    // 1. Registramos a los dos estudiantes desde la pantalla de registro.
    registrar(ada);
    registrar(alan);

    // 2. Alan (ya logueado) busca a Ada y le manda solicitud desde su perfil.
    //    La solicitud queda pendiente hasta que Ada la apruebe (también en perfiles públicos).
    cy.visit("/student/social");
    cy.get(".search-bar-input").type(ada.nombre);
    cy.get(".search-result-item").contains(ada.nombre).click();
    cy.location("pathname").should("include", "/student/perfil/");
    cy.contains("button", "Sumar a mis contactos").click();
    cy.contains("Invitación enviada").should("be.visible");

    // 3. Ada inicia sesion y acepta la solicitud pendiente.
    iniciarSesion(ada);
    cy.visit("/student/social");
    cy.contains(".request-item", alan.nombre).within(() => {
      cy.contains("button", "Aceptar").click();
    });

    // 4. Verificamos que Alan quedo en los contactos de Ada.
    cy.contains("h3", "Mis Contactos").should("contain", "(1)");
    cy.get(".contacts-list").should("contain", alan.nombre);
  });
});
