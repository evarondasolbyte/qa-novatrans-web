// Inicio de la suite de pruebas de login con gestión de errores y reporte automático a Excel
describe('LOGIN - Validación completa con gestión de errores y reporte a Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';

  const casos = [
    { numero: 1, nombre: 'TC001 - Login con credenciales válidas', datos: {}, esperado: 'Accede al dashboard', prioridad: 'ALTA' },
    { numero: 2, nombre: 'TC002 - Usuario incorrecto', datos: { username: 'Admin', useSession: false }, esperado: 'No accede', prioridad: 'ALTA' },
    { numero: 3, nombre: 'TC003 - Contraseña incorrecta', datos: { password: 'solbyte@2025', useSession: false }, esperado: 'No accede', prioridad: 'ALTA' },
    { numero: 4, nombre: 'TC004 - Base de datos incorrecta', datos: { database: 'NTDesarrolloLore', useSession: false }, esperado: 'No accede', prioridad: 'MEDIA' },
    { numero: 5, nombre: 'TC005 - Servidor incorrecto', datos: { server: 'SERVER\\DESARRO', useSession: false }, esperado: 'No accede', prioridad: 'MEDIA' },
    { numero: 6, nombre: 'TC006 - Usuario vacío', datos: { username: '', useSession: false }, esperado: 'No accede', prioridad: 'ALTA' },
    { numero: 7, nombre: 'TC007 - Contraseña vacía', datos: { password: '', useSession: false }, esperado: 'No accede', prioridad: 'ALTA' },
    { numero: 8, nombre: 'TC008 - Base de datos vacía', datos: { database: '', useSession: false }, esperado: 'No accede', prioridad: 'MEDIA' },
    { numero: 9, nombre: 'TC009 - Servidor vacío', datos: { server: '', useSession: false }, esperado: 'No accede', prioridad: 'MEDIA' },
    { numero: 10, nombre: 'TC010 - Todos los campos vacíos', datos: { database: '', server: '', username: '', password: '', useSession: false }, esperado: 'No accede', prioridad: 'ALTA' }
  ];

  // Resumen al final
  after(() => {
    cy.procesarResultadosPantalla('Login');
  });

  // Filtrar casos por prioridad si se especifica
  const prioridadFiltro = Cypress.env('prioridad');
  const casosFiltrados = prioridadFiltro && prioridadFiltro !== 'todas'
    ? casos.filter(caso => caso.prioridad === prioridadFiltro.toUpperCase())
    : casos;

  casosFiltrados.forEach(({ numero, nombre, datos, esperado, prioridad }) => {
    it(`${nombre} [${prioridad}]`, () => {
      //usar el helper correcto (mismo patrón que en "Otros Gastos")
      cy.resetearFlagsTest();

      // Captura de errores y registro
      cy.on('fail', (err) => {
        cy.capturarError(nombre, err, {
          numero,
          nombre,
          esperado,
          archivo,
          pantalla: 'Login'
        });
        return false;
      });

      // Ejecuta el login
      cy.login(datos);
      cy.wait(500);

      // IMPORTANTE: devolver la cadena de Cypress
      return cy.url({ timeout: 10000 }).then((url) => {
        const accedio = url.includes('/dashboard');

        // Si es el caso 1 y accedió, valida elementos del dashboard (y devolvemos esa cadena)
        const cadenaValidacion = (numero === 1 && accedio)
          ? cy.get('header, .MuiToolbar-root, .dashboard-container', { timeout: 8000 }).should('exist')
          : cy.wrap(null);

        const obtenido = accedio ? 'Accede al dashboard' : 'No accede';

        // Encadena el registro para mantener la cadena Cypress viva
        return cadenaValidacion.then(() => {
          // Si tienes un anti-doble-registro, úsalo aquí; si no, registra directo
          if (typeof cy.estaRegistrado === 'function') {
            cy.estaRegistrado().then((ya) => {
              if (!ya) {
                cy.registrarResultados({
                  numero,
                  nombre,
                  esperado,
                  obtenido,
                  archivo,
                  pantalla: 'Login'
                });
              }
            });
          } else {
            cy.registrarResultados({
              numero,
              nombre,
              esperado,
              obtenido,
              archivo,
              pantalla: 'Login'
            });
          }
        });
      });
    });
  });
});