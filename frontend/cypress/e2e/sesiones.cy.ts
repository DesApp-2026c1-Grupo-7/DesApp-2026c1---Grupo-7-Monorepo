// E2E de Sesiones de Estudio: cubre (en la parte visible por UI) los 4 escenarios
// que tambien se testean a nivel backend en backend/test/study-sessions.test.js.
// Los mails y el recordatorio de 24hs NO se verifican aca (no son observables desde
// el navegador): eso queda cubierto por los tests de backend.
//
// Usa los usuarios sembrados por el seed:
//   - estudiante@universidad.edu   -> Estudiante de Prueba (perfil publico)
//   - matiaslopez1345@gmail.com    -> Matias Lopez (publico, contacto de Privado)
//   - estudianteprivado@universidad.edu -> Estudiante Privado (privado, contacto de Matias)
// Todos con password estudiante123. Matias y Privado son contactos mutuos; Prueba NO.
//
// Requiere el backend (npm run dev) y el frontend (npm run dev) levantados,
// con la base sembrada (seed) corrida al menos una vez.
// Verlo en vivo:   cd frontend && npm run cy:open
// Correrlo de una: cd frontend && npm run cy:run

const prueba = { email: "estudiante@universidad.edu", password: "estudiante123" };
const matias = { email: "matiaslopez1345@gmail.com", password: "estudiante123" };
const privado = { email: "estudianteprivado@universidad.edu", password: "estudiante123" };

function login(u: { email: string; password: string }) {
  cy.clearLocalStorage();
  cy.visit("/");
  cy.get("#email").type(u.email);
  cy.get("#password").type(u.password);
  cy.contains("button", "Iniciar Sesión").click();
  cy.location("pathname").should("eq", "/student");
}

// Crea una sesion desde la UI. Devuelve nada; identificamos la sesion por su tema.
function crearSesion(tema: string, opciones: { aprobacion?: boolean } = {}) {
  cy.visit("/student/create-session");
  cy.get("#materia option").should("have.length.greaterThan", 1);
  cy.get("#materia").find("option").eq(1).then(($o) => {
    cy.get("#materia").select($o.val() as string);
  });
  cy.get("#tema").clear().type(tema);
  // La modalidad por defecto es presencial: completamos la ubicacion.
  cy.get("#ubicacion").type("Aula 305");
  cy.get("#fecha").type("2035-12-31");
  cy.get("#hora").type("10:00");
  if (opciones.aprobacion) {
    cy.get("#requiereAprobacion").check();
  }
  cy.get('button[type="submit"]').click();
  cy.location("pathname").should("eq", "/student/sessions");
}

function irAListado() {
  cy.visit("/student/sessions");
  cy.contains("Cargando sesiones...").should("not.exist");
}

describe("Sesiones de Estudio", () => {
  beforeEach(() => {
    // Aceptamos automaticamente los window.confirm (baja / cancelacion).
    cy.on("window:confirm", () => true);
  });

  // -----------------------------------------------------------------------
  // Escenario 1: sesion abierta (sin aprobacion manual)
  // -----------------------------------------------------------------------

  it("escenario 1 — crea una sesion abierta y otro estudiante se une y queda como miembro", () => {
    const tema = `Abierta ${Date.now()}`;

    login(prueba);
    crearSesion(tema);

    login(matias);
    irAListado();
    cy.contains(".session-card", tema).within(() => {
      cy.contains("button", "Unirse").click();
    });
    cy.contains(".session-card", tema).should("contain", "Eres miembro");
  });

  it("escenario 1 — el creador puede editar su sesion", () => {
    const tema = `Editar ${Date.now()}`;
    const temaEditado = `${tema} EDITADO`;

    login(prueba);
    crearSesion(tema);

    irAListado();
    cy.contains(".session-card", tema).within(() => {
      cy.contains("button", "Editar").click();
    });
    cy.location("pathname").should("include", "/student/edit-session/");
    cy.get("#tema").clear().type(temaEditado);
    cy.get('button[type="submit"]').click();

    cy.location("pathname").should("eq", "/student/sessions");
    cy.contains(".session-card", temaEditado).should("be.visible");
  });

  it("escenario 1 — filtra por 'Mis inscripciones', se ve como miembro y puede darse de baja", () => {
    const tema = `Filtros ${Date.now()}`;

    login(prueba);
    crearSesion(tema);

    login(privado);
    irAListado();
    cy.contains(".session-card", tema).within(() => {
      cy.contains("button", "Unirse").click();
    });

    // Filtro "Mis inscripciones" -> debe mostrar la sesion a la que se unio.
    cy.get(".sessions-filters select").first().select("enrolled");
    cy.contains(".session-card", tema).should("contain", "Eres miembro");

    // Darse de baja -> como el filtro sigue en "Mis inscripciones", la sesion
    // deja de figurar (ya no es una inscripcion del usuario).
    cy.contains(".session-card", tema).within(() => {
      cy.contains("button", "Darse de baja").click();
    });
    cy.contains(".session-card", tema).should("not.exist");

    // Quitando el filtro vuelve a aparecer y ofrece "Unirse" de nuevo.
    cy.get(".sessions-filters select").first().select("all");
    cy.contains(".session-card", tema).within(() => {
      cy.contains("button", "Unirse").should("be.visible");
    });
  });

  it("escenario 1 — el creador cancela la sesion y desaparece del listado activo", () => {
    const tema = `Cancelar ${Date.now()}`;

    login(prueba);
    crearSesion(tema);

    irAListado();
    cy.contains(".session-card", tema).within(() => {
      cy.contains("button", "Cancelar").click();
    });

    // Al cancelar, la sesion deja de estar activa y no aparece mas en el listado.
    cy.contains(".session-card", tema).should("not.exist");
  });

  // -----------------------------------------------------------------------
  // Escenario 2: sesion con aprobacion manual
  // -----------------------------------------------------------------------

  it("escenario 2 — con aprobacion manual: solicitar queda pendiente, el creador acepta a uno y rechaza al otro", () => {
    const tema = `Aprobacion ${Date.now()}`;

    login(prueba);
    crearSesion(tema, { aprobacion: true });

    // Matias solicita unirse -> queda pendiente de aprobacion.
    login(matias);
    irAListado();
    cy.contains(".session-card", tema).within(() => {
      cy.contains("button", "Solicitar unirse").click();
    });
    cy.contains(".session-card", tema).should("contain", "Pendiente de aprobación");

    // Privado tambien solicita unirse.
    login(privado);
    irAListado();
    cy.contains(".session-card", tema).within(() => {
      cy.contains("button", "Solicitar unirse").click();
    });

    // El creador acepta a Matias y rechaza a Privado.
    login(prueba);
    irAListado();
    cy.contains(".session-card", tema).within(() => {
      cy.contains("div", "Matias Lopez").within(() => {
        cy.contains("button", "Aceptar").click();
      });
    });
    cy.contains(".session-card", tema).within(() => {
      cy.contains("div", "Estudiante Privado").within(() => {
        cy.contains("button", "Rechazar").click();
      });
    });

    // Matias quedo como miembro.
    login(matias);
    irAListado();
    cy.contains(".session-card", tema).should("contain", "Eres miembro");

    // Privado NO es miembro: puede volver a solicitar.
    login(privado);
    irAListado();
    cy.contains(".session-card", tema).should("not.contain", "Eres miembro");
    cy.contains(".session-card", tema).within(() => {
      cy.contains("button", "Solicitar unirse").should("be.visible");
    });
  });

  // -----------------------------------------------------------------------
  // Escenario 3: privacidad por contactos
  // -----------------------------------------------------------------------

  it("escenario 3 — un contacto ve la sesion de un creador privado y un no-contacto no la ve", () => {
    const tema = `Privada ${Date.now()}`;

    // Estudiante Privado (perfil privado) crea la sesion.
    login(privado);
    crearSesion(tema);

    // Matias es contacto de Privado -> la ve y puede unirse.
    login(matias);
    irAListado();
    cy.contains(".session-card", tema).should("be.visible");
    cy.contains(".session-card", tema).within(() => {
      cy.contains("button", "Unirse").click();
    });
    cy.contains(".session-card", tema).should("contain", "Eres miembro");

    // Estudiante de Prueba NO es contacto de Privado -> no la ve.
    login(prueba);
    irAListado();
    cy.get(".sessions-list").should("not.contain", tema);
  });
});
