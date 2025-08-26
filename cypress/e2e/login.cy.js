// Inicio de la suite de pruebas de login con gestión de errores y reporte automático a Excel
describe('LOGIN - Validación completa con gestión de errores y reporte a Excel', () => {

  // Defino un array de objetos con todos los casos de prueba
  // Cada objeto contiene: el número del caso, un nombre identificativo, los datos que se usarán en el login, y el resultado esperado
  const casos = [
    { numero: 1, nombre: 'TC001 - Login con credenciales válidas', datos: {}, esperado: 'Accede al dashboard' },
    { numero: 2, nombre: 'TC002 - Usuario incorrecto', datos: { username: 'Admin', useSession: false }, esperado: 'No accede' },
    { numero: 3, nombre: 'TC003 - Contraseña incorrecta', datos: { password: 'solbyte@2025', useSession: false }, esperado: 'No accede' },
    { numero: 4, nombre: 'TC004 - Base de datos incorrecta', datos: { database: 'NTDesarrolloLore', useSession: false }, esperado: 'No accede' },
    { numero: 5, nombre: 'TC005 - Servidor incorrecto', datos: { server: 'SERVER\\DESARRO', useSession: false }, esperado: 'No accede' },
    { numero: 6, nombre: 'TC006 - Usuario vacío', datos: { username: '', useSession: false }, esperado: 'No accede' },
    { numero: 7, nombre: 'TC007 - Contraseña vacía', datos: { password: '', useSession: false }, esperado: 'No accede' },
    { numero: 8, nombre: 'TC008 - Base de datos vacía', datos: { database: '', useSession: false }, esperado: 'No accede' },
    { numero: 9, nombre: 'TC009 - Servidor vacío', datos: { server: '', useSession: false }, esperado: 'No accede' },
    { numero: 10, nombre: 'TC010 - Todos los campos vacíos', datos: { database: '', server: '', username: '', password: '', useSession: false }, esperado: 'No accede' }
  ];

  // Hook para procesar los resultados agregados después de que terminen todas las pruebas
  after(() => {
    cy.procesarResultadosPantalla('Login');
  });

  // Recorro cada uno de los casos de prueba
  casos.forEach(({ numero, nombre, datos, esperado }) => {

    // Creo dinámicamente un test por cada caso, usando el nombre del mismo
    it(nombre, () => {
      // Reseteo el flag de error al inicio de cada test
      cy.resetearErrorFlag();

      // Capturo cualquier error que ocurra dentro del test y lo registro automáticamente con el comando personalizado
      cy.on('fail', (err) => {
        // Solo paso los campos clave, el resto se gestiona en commands.js
        cy.capturarError(nombre, err, { 
          numero, 
          nombre, 
          esperado,
          pantalla: 'Login'
        });
        return false; // Esto evita que Cypress detenga la ejecución completa del test si hay un error
      });

      // Realizo el login usando los datos definidos en el objeto del caso
      cy.login(datos);

      // Espero medio segundo por si la redirección tarda un poco
      cy.wait(500);

      // Obtengo la URL actual después del login para saber si accedió al dashboard o no
      cy.url({ timeout: 10000 }).then((url) => {
        const accedio = url.includes('/dashboard');

        // Si es el caso 1 (login correcto), además valido que existan elementos del dashboard en pantalla
        if (numero === 1 && accedio) {
          cy.get('header, .MuiToolbar-root, .dashboard-container', { timeout: 8000 }).should('exist');
        }

        // Armo el resultado real según la URL final
        const obtenido = accedio ? 'Accede al dashboard' : 'No accede';

        // Registro el resultado final en el Excel, pasando solo los campos clave
        cy.registrarResultados({ 
          numero, 
          nombre, 
          esperado, 
          obtenido,
          pantalla: 'Login'
        });
      });
    });
  });
});