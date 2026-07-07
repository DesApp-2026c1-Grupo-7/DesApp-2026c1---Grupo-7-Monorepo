// E2E de Denuncias de Materiales: cubre (en la parte visible por UI) los 9 escenarios que
// también se testean a nivel backend en backend/test/material-report-motivos.test.js.
// Las notificaciones NO se verifican acá (van en backend); Cypress verifica el flujo visible.
//
// Usa usuarios del seed:
//   - estudiante2@universidad.edu (Segundo Estudiante) -> denuncia materiales de otros
//   - admin@universidad.edu -> gestiona denuncias en /admin/moderation
// Password: estudiante123 / admin123.
//
// Los materiales de demo viven en la materia "Bases de Datos I" (BD1). Cada escenario denuncia
// un material DISTINTO y ajeno (para no toparse con la suspensión ni con la regla de autor).
//
// Requiere backend (npm run dev) y frontend (npm run dev) levantados, con el seed corrido.
// Verlo en vivo:   cd frontend && npm run cy:open
// Correrlo de una: cd frontend && npm run cy:run

const estudiante2 = { email: "estudiante2@universidad.edu", password: "estudiante123" };
const admin = { email: "admin@universidad.edu", password: "admin123" };
// Autor de "Archivo PDF" (material que el seed deja suspendido con 3 denuncias).
const prueba = { email: "estudiante@universidad.edu", password: "estudiante123" };

function login(u: { email: string; password: string }) {
  cy.clearLocalStorage();
  cy.visit("/");
  cy.get("#email").type(u.email);
  cy.get("#password").type(u.password);
  cy.contains("button", "Iniciar Sesión").click();
  cy.location("pathname").should("not.eq", "/");
}

// Entra al repositorio de "Bases de Datos I" (evita matchear "Bases de Datos II").
function abrirRepositorioBD1() {
  cy.visit("/student/materials");
  cy.contains(".repository-card h3", /^Bases de Datos I$/).click();
  cy.get(".materials-list", { timeout: 10000 }).should("exist");
}

// Denuncia un material (ajeno) de BD1 con el motivo indicado.
function denunciarMaterial(materialTitulo: string, motivo: string, motivoEspecifico?: string) {
  login(estudiante2);
  abrirRepositorioBD1();

  cy.contains(".material-card", materialTitulo).find(".btn-report").click();

  cy.get(".modal-content").should("be.visible");
  cy.get('select[name="reasonId"] option').should("have.length.greaterThan", 1);
  cy.get('select[name="reasonId"]').select(motivo);

  if (motivoEspecifico) {
    cy.get('input[name="motivoEspecifico"]').type(motivoEspecifico);
  }

  cy.get('textarea[name="detalle"]').type("Detalle de la denuncia (test e2e)");
  cy.get(".modal-content").contains("button", "Enviar Denuncia").click();

  cy.contains("Denuncia enviada correctamente").should("be.visible");
}

function irAModeracion() {
  cy.visit("/admin/moderation");
  cy.contains("Cargando denuncias...").should("not.exist");
}

describe("Denuncias de Materiales", () => {
  // -----------------------------------------------------------------------
  // Escenarios 1-5: un estudiante denuncia por cada motivo
  // -----------------------------------------------------------------------

  it("escenario 1 — denuncia un material por contenido pornográfico", () => {
    denunciarMaterial("Archivo PNG", "Contenido pornográfico o sexual explícito");
  });

  it("escenario 2 — denuncia un material por lenguaje ofensivo o insultos", () => {
    denunciarMaterial("Archivo Excel", "Lenguaje ofensivo o insultos");
  });

  it("escenario 3 — denuncia un material por derechos de autor", () => {
    denunciarMaterial("Archivo ZIP", "Material protegido por derechos de autor");
  });

  it("escenario 4 — denuncia un material por spam o publicidad engañosa", () => {
    denunciarMaterial("Archivo JPG", "Spam o publicidad engañosa");
  });

  it("escenario 5 — denuncia un material por información incorrecta o engañosa", () => {
    denunciarMaterial("Link de discord", "Información incorrecta o engañosa");
  });

  // -----------------------------------------------------------------------
  // Escenario 6: motivo "Otro" con descripción extra
  // -----------------------------------------------------------------------

  it('escenario 6 — denuncia un material por "otro" (no corresponde a la materia)', () => {
    denunciarMaterial(
      "link de github",
      "Otro",
      "No es contenido correspondiente a esta materia"
    );
  });

  // -----------------------------------------------------------------------
  // Escenarios 7-9: gestión por parte del admin
  // -----------------------------------------------------------------------

  it("escenario 7 — el admin puede ver las denuncias", () => {
    login(admin);
    irAModeracion();
    cy.get(".report-card").its("length").should("be.greaterThan", 0);
    cy.get(".report-card").first().should("contain", "Motivo:");
  });

  it("escenario 8 — el admin puede aceptar (confirmar) una denuncia", () => {
    login(admin);
    irAModeracion();

    // Nos quedamos solo con las pendientes y confirmamos la primera.
    cy.get(".filters select").select("pendiente");
    cy.get(".report-card").its("length").should("be.greaterThan", 0);
    cy.get(".report-card").first().within(() => {
      cy.contains("button", "Confirmar Denuncia").click();
    });

    cy.contains("Denuncia confirmada con éxito").should("be.visible");

    // Aparece al menos una denuncia en estado "revisado".
    cy.get(".filters select").select("revisado");
    cy.get(".report-card").its("length").should("be.greaterThan", 0);
  });

  it("escenario 9 — el admin puede rechazar una denuncia", () => {
    login(admin);
    irAModeracion();

    cy.get(".filters select").select("pendiente");
    cy.get(".report-card").its("length").should("be.greaterThan", 0);
    cy.get(".report-card").first().within(() => {
      cy.contains("button", "Rechazar Denuncia").click();
    });

    cy.contains("Denuncia rechazada").should("be.visible");

    cy.get(".filters select").select("ignorado");
    cy.get(".report-card").its("length").should("be.greaterThan", 0);
  });

  // -----------------------------------------------------------------------
  // Escenarios 10-11: visibilidad según cantidad de denuncias
  // -----------------------------------------------------------------------

  it("escenario 10 — un material con 2 denuncias sigue visible para el estudiante", () => {
    // "Archivo Word" viene del seed con 2 denuncias pendientes (umbral por defecto = 3): no suspendido.
    login(estudiante2);
    abrirRepositorioBD1();
    cy.contains(".material-card", "Archivo Word").should("be.visible");
    cy.contains(".material-card", "Archivo Word").should("not.contain", "Suspendido");
  });

  it("escenario 11 — un material suspendido se oculta a otros pero el creador lo ve suspendido", () => {
    // "Archivo PDF" viene del seed suspendido (3 denuncias). Su autor es "Estudiante de Prueba".
    login(estudiante2);
    abrirRepositorioBD1();
    cy.get(".materials-list").should("not.contain", "Archivo PDF");

    // El creador sí lo ve, marcado como suspendido.
    login(prueba);
    abrirRepositorioBD1();
    cy.contains(".material-card", "Archivo PDF").should("contain", "Suspendido");
  });

  // -----------------------------------------------------------------------
  // Escenario 12: el creador elimina su material
  // -----------------------------------------------------------------------

  it("escenario 12 — el creador puede eliminar su material y en uno ajeno no aparece el botón", () => {
    login(estudiante2);
    abrirRepositorioBD1();

    // En un material ajeno (de otro autor) no hay botón de eliminar.
    cy.contains(".material-card", "Archivo PNG").find(".btn-delete-material").should("not.exist");

    // En un material propio ("Link de youtube", autor Segundo Estudiante) sí puede eliminar.
    cy.contains(".material-card", "Link de youtube").find(".btn-delete-material").click();
    cy.get(".delete-modal").should("be.visible");
    cy.get(".delete-modal").contains("button", "Eliminar").click();

    // La card desaparece del listado.
    cy.contains(".material-card", "Link de youtube").should("not.exist");
  });
});
