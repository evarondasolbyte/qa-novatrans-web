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
echo   - ficheros_clientes
echo   - ficheros_personal
echo   - procesos_planificacion
echo ========================================
echo.

REM Define los archivos específicos a ejecutar
set "SPECS=cypress/e2e/ficheros_clientes.cy.js,"
set "SPECS=%SPECS%cypress/e2e/ficheros_personal.cy.js,"
set "SPECS=%SPECS%cypress/e2e/procesos_planificacion.cy.js,"

REM Ejecuta las pruebas con Cypress usando Chrome (no Electron)
npx cypress run --browser chrome --spec "%SPECS%"

echo.
echo ========================================
echo    PRUEBAS COMPLETADAS
echo ========================================
echo.

endlocal