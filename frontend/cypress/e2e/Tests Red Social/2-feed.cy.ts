describe('Feed Académico: Visibilidad y Privacidad', () => {
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

  const publicar = (mensaje) => {
    cy.get('a[href="/student/feed"]').click();
    cy.wait(waitTime);
    cy.get('textarea[placeholder*="Compartí algo"]').type(mensaje);
    cy.get('button').contains('Publicar').click();
    cy.wait(waitTime);
  };

  it('Prueba de Visibilidad: Público vs Privado', () => {
    cy.viewport(1280, 720);

    // 1. ESTUDIANTE 1 (PÚBLICO)
    login('estudiante1@universidad.edu', 'estudiante123');
    publicar('Hola, soy Estudiante Uno (Público).');
    logout();

    // 2. ESTUDIANTE 2 (PÚBLICO)
    login('estudiante2@universidad.edu', 'estudiante123');
    cy.get('a[href="/student/feed"]').click();
    cy.wait(waitTime);
    cy.get('.social-container').should('contain', 'Estudiante Uno'); // Lo ve porque es público
    publicar('Hola, soy Estudiante Dos (Público). Amigo de Uno y Tres.');
    logout();

    // 3. ESTUDIANTE 3 (PRIVADO)
    login('estudiante3@universidad.edu', 'estudiante123');
    cy.get('a[href="/student/feed"]').click();
    cy.wait(waitTime);
    cy.get('.social-container').should('contain', 'Estudiante Uno');
    cy.get('.social-container').should('contain', 'Estudiante Dos'); // Lo ve porque es su amigo
    publicar('Contenido PRIVADO de Estudiante Tres. Solo para mis amigos.');
    logout();

    // 4. VERIFICACIÓN FINAL DE PRIVACIDAD
    cy.log('--- VERIFICANDO QUE ESTUDIANTE 2 (AMIGO) VE EL POST DE 3 ---');
    login('estudiante2@universidad.edu', 'estudiante123');
    cy.get('a[href="/student/feed"]').click();
    cy.wait(waitTime);
    cy.get('.social-container').should('contain', 'Estudiante Tres');
    logout();

    cy.log('--- VERIFICANDO QUE ESTUDIANTE 1 (NO AMIGO) NO VE EL POST DE 3 ---');
    login('estudiante1@universidad.edu', 'estudiante123');
    cy.get('a[href="/student/feed"]').click();
    cy.wait(waitTime);
    cy.get('.social-container').should('contain', 'Estudiante Dos');
    cy.get('.social-container').should('not.contain', 'Estudiante Tres'); // NO DEBE VERLO
    
    logout();
  });
});
