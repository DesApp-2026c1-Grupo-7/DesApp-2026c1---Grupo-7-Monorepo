describe('Invitación por Email en Red Social', () => {
  const waitTime = 3000;

  const login = (email, pass) => {
    cy.visit('/');
    cy.get('#email').should('be.visible').clear().type(email);
    cy.get('#password').should('be.visible').clear().type(pass);
    cy.get('button[type="submit"]').click();
    cy.wait(waitTime);
  };

  const logout = () => {
    cy.get('.logout').click();
    cy.wait(waitTime);
  };

  beforeEach(() => {
    cy.viewport(1280, 720);
  });

  it('Flujo Completo: Invitación por Email de Estudiante 1 a Estudiante 2', () => {
    cy.log('--- PASO 0: LIMPIEZA INICIAL (Asegurar que no sean contactos) ---');
    login('estudiante1@universidad.edu', 'estudiante123');
    cy.get('a[href="/student/social"]').click();
    cy.wait(waitTime);

    // Si ya existe en la lista de contactos, lo eliminamos para el test
    cy.get('body').then(($body) => {
      if ($body.find('.contacts-list:contains("Estudiante Dos")').length > 0) {
        cy.log('Limpiando contacto previo para iniciar test limpio...');
        cy.contains('.request-item', 'Estudiante Dos').find('button').contains('Eliminar').click();
        // Cypress acepta automáticamente los window.confirm por defecto
        cy.wait(waitTime);
      }
    });

    cy.log('--- PASO 1: ESTUDIANTE 1 ENVÍA INVITACIÓN POR EMAIL ---');
    // Ya estamos en /student/social
    cy.log('Escribiendo el email de Estudiante 2...');
    cy.get('input[placeholder="email@ejemplo.com"]').type('estudiante2@universidad.edu');
    cy.get('button').contains('Enviar Invitación').click();
    
    cy.wait(waitTime);
    cy.get('.profile-alert.success').should('contain', 'Invitación enviada con éxito');
    
    cy.log('Verificando que aparezca en la lista de Invitaciones Enviadas...');
    cy.get('.card').contains('Invitaciones Enviadas').parent().should('contain', 'Estudiante Dos');
    
    logout();

    cy.log('--- PASO 2: ESTUDIANTE 2 RECIBE NOTIFICACIÓN Y ACEPTA ---');
    login('estudiante2@universidad.edu', 'estudiante123');
    
    cy.log('Navegando a Notificaciones desde el sidebar...');
    cy.get('a[href="/student/notifications"]').click();
    cy.wait(waitTime);
    
    cy.get('.card').should('contain', 'Estudiante Uno quiere sumarte a sus contactos');
    
    cy.log('Navegando a Red Social para aceptar...');
    cy.get('a[href="/student/social"]').click();
    cy.wait(waitTime);
    
    cy.get('.request-item')
      .contains('Estudiante Uno')
      .closest('.request-item')
      .find('button')
      .contains('Aceptar')
      .click();
      
    cy.wait(waitTime);
    cy.get('.contacts-list').should('contain', 'Estudiante Uno');
    
    logout();

    cy.log('--- PASO 3: VERIFICACIÓN FINAL EN ESTUDIANTE 1 ---');
    login('estudiante1@universidad.edu', 'estudiante123');
    
    cy.get('a[href="/student/social"]').click();
    cy.wait(waitTime);
    cy.get('.contacts-list').should('contain', 'Estudiante Dos');
    
    cy.log('--- TEST DE INVITACIÓN POR EMAIL FINALIZADO CON ÉXITO ---');
  });
});
