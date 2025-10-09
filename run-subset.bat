@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM Script para ejecutar un subconjunto específico de pruebas
REM ============================================================

echo.
echo ========================================
echo    EJECUTANDO SUBCONJUNTO DE PRUEBAS
echo ========================================
echo.
echo Ejecutando las siguientes pruebas:
echo   - ficheros_tipos_vehiculo
echo   - ficheros_categorias_conductores
echo   - ficheros_multas
echo   - ficheros_siniestros
echo   - ficheros_tarjetas
echo   - ficheros_alquileres_vehiculos
echo   - ficheros_formas_pago
echo   - almacen_familias_subfamilias_almacenes
echo   - almacen_articulos
echo   - almacen_pedidos
echo ========================================
echo.

REM Define los archivos específicos a ejecutar
set "SPECS=cypress/e2e/ficheros_tipos_vehiculo.cy.js,"
set "SPECS=%SPECS%cypress/e2e/ficheros_categorias_conductores.cy.js,"
set "SPECS=%SPECS%cypress/e2e/ficheros_multas.cy.js,"
set "SPECS=%SPECS%cypress/e2e/ficheros_siniestros.cy.js,"
set "SPECS=%SPECS%cypress/e2e/ficheros_tarjetas.cy.js,"
set "SPECS=%SPECS%cypress/e2e/ficheros_alquileres_vehiculos.cy.js,"
set "SPECS=%SPECS%cypress/e2e/ficheros_formas_pago.cy.js,"
set "SPECS=%SPECS%cypress/e2e/almacen_familias_subfamilias_almacenes.cy.js,"
set "SPECS=%SPECS%cypress/e2e/almacen_articulos.cy.js,"
set "SPECS=%SPECS%cypress/e2e/almacen_pedidos.cy.js"

REM Ejecuta las pruebas con Cypress
npx cypress run --spec "%SPECS%"

echo.
echo ========================================
echo    PRUEBAS COMPLETADAS
echo ========================================
echo.

endlocal

