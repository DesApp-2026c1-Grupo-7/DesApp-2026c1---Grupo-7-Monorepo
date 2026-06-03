describe('Conexiones en Red Social', () => {
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

  const limpiarContactos = (estudianteEmail, nombreABorrar) => {
    login(estudianteEmail, 'estudiante123');
    cy.get('a[href="/student/social"]').click();
    cy.wait(waitTime);
    
    cy.get('body').then(($body) => {
      if ($body.find(`.request-item:contains("${nombreABorrar}")`).length > 0) {
        cy.log(`Limpiando contacto ${nombreABorrar} de ${estudianteEmail}...`);
        cy.contains('.request-item', nombreABorrar).find('button').contains('Eliminar').click();
        cy.wait(waitTime);
      }
    });
    logout();
  };

  beforeEach(() => {
    cy.viewport(1280, 720);
  });

  it('Flujo de Amistad: Estudiante 1 -> 2, y Estudiante 2 -> 3', () => {
    cy.log('--- PASO 0: LIMPIEZA DE CONTACTOS PREVIOS ---');
    // Limpiamos cruzado para asegurar estado virgen
    limpiarContactos('estudiante1@universidad.edu', 'Estudiante Dos');
    limpiarContactos('estudiante2@universidad.edu', 'Estudiante Tres');

    cy.log('--- PASO 1: ESTUDIANTE 1 SOLICITA A ESTUDIANTE 2 ---');
    login('estudiante1@universidad.edu', 'estudiante123');
    
    cy.get('a[href="/student/social"]').click();
    cy.wait(waitTime);
    
    cy.get('.search-bar-input').type('Estudiante Dos');
    cy.wait(waitTime);
    cy.get('.search-result-item').contains('Estudiante Dos').trigger('mousedown');
    cy.wait(waitTime);
    
    cy.get('button').contains('Sumar a mis contactos').click();
    cy.wait(waitTime);
    cy.get('.badge.blue').should('contain', 'Invitación enviada');
    logout();

    cy.log('--- PASO 2: ESTUDIANTE 2 ACEPTA A ESTUDIANTE 1 ---');
    login('estudiante2@universidad.edu', 'estudiante123');
    
    cy.get('a[href="/student/social"]').click();
    cy.wait(waitTime);
    cy.get('.request-item').contains('Estudiante Uno').closest('.request-item').find('button').contains('Aceptar').click();
    cy.wait(waitTime);
    cy.get('.contacts-list').should('contain', 'Estudiante Uno');

    cy.log('--- PASO 3: ESTUDIANTE 2 SOLICITA A ESTUDIANTE 3 ---');
    cy.get('.search-bar-input').clear().type('Estudiante Tres');
    cy.wait(waitTime);
    cy.get('.search-result-item').contains('Estudiante Tres').trigger('mousedown');
    cy.wait(waitTime);
    
    cy.get('button').contains('Sumar a mis contactos').click();
    cy.wait(waitTime);
    cy.get('.badge.blue').should('contain', 'Invitación enviada');
    logout();

    cy.log('--- PASO 4: ESTUDIANTE 3 ACEPTA A ESTUDIANTE 2 ---');
    login('estudiante3@universidad.edu', 'estudiante123');
    
    cy.get('a[href="/student/social"]').click();
    cy.wait(waitTime);
    cy.get('.request-item').contains('Estudiante Dos').closest('.request-item').find('button').contains('Aceptar').click();
    cy.wait(waitTime);
    cy.get('.contacts-list').should('contain', 'Estudiante Dos');
    
    logout();
    cy.log('--- CONEXIONES COMPLETADAS ---');
  });
});
