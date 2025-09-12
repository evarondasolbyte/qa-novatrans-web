@echo off
if "%1"=="" (
    echo Uso: run-simple.bat [categoria]
    echo.
    echo Categorias disponibles:
    echo   siniestros
    echo   usuarios
    echo   auditorias
    echo   repostajes
    echo   cajas
    echo   remesas
    echo   ficheros
    echo   configuracion
    echo   tallerYgastos
    echo   tesoreria
    echo   utilidades
    echo   procesos
    echo   remuneracion
    echo   login
    goto :eof
)

if "%1"=="siniestros" (
    echo Ejecutando pruebas de Siniestros...
    npx cypress run --spec cypress\e2e\ficheros_siniestros.cy.js
) else if "%1"=="usuarios" (
    echo Ejecutando pruebas de Usuarios...
    npx cypress run --spec cypress\e2e\configuracion_usuarios.cy.js
) else if "%1"=="auditorias" (
    echo Ejecutando pruebas de Auditorias...
    npx cypress run --spec cypress\e2e\utilidades_auditorias.cy.js
) else if "%1"=="repostajes" (
    echo Ejecutando pruebas de Repostajes...
    npx cypress run --spec cypress\e2e\tallerYgastos_repostajes.cy.js
) else if "%1"=="cajas" (
    echo Ejecutando pruebas de Cajas...
    npx cypress run --spec cypress\e2e\tesoreria_cajas.cy.js
) else if "%1"=="remesas" (
    echo Ejecutando pruebas de Remesas...
    npx cypress run --spec cypress\e2e\tesoreria_remesas.cy.js
) else if "%1"=="ficheros" (
    echo Ejecutando TODAS las pruebas de Ficheros...
    npx cypress run --spec cypress\e2e\ficheros_*.cy.js
) else if "%1"=="configuracion" (
    echo Ejecutando TODAS las pruebas de Configuracion...
    npx cypress run --spec cypress\e2e\configuracion_*.cy.js
) else if "%1"=="tallerYgastos" (
    echo Ejecutando TODAS las pruebas de Taller y Gastos...
    npx cypress run --spec cypress\e2e\tallerYgastos*.cy.js
) else if "%1"=="tesoreria" (
    echo Ejecutando TODAS las pruebas de Tesoreria...
    npx cypress run --spec cypress\e2e\tesoreria_*.cy.js
) else if "%1"=="utilidades" (
    echo Ejecutando TODAS las pruebas de Utilidades...
    npx cypress run --spec cypress\e2e\utilidades_*.cy.js
) else if "%1"=="procesos" (
    echo Ejecutando TODAS las pruebas de Procesos...
    npx cypress run --spec cypress\e2e\procesos_*.cy.js
) else if "%1"=="remuneracion" (
    echo Ejecutando TODAS las pruebas de Remuneracion...
    npx cypress run --spec cypress\e2e\remuneracion_*.cy.js
) else if "%1"=="login" (
    echo Ejecutando TODAS las pruebas de Login...
    npx cypress run --spec cypress\e2e\login_*.cy.js
) else (
    echo Categoria "%1" no encontrada.
    echo Usa: run-simple.bat sin parametros para ver las opciones.
)

echo.
echo Pruebas completadas.
pause
