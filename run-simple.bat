@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM Ejecuta Cypress con sistema de prioridades + alias por pantalla
REM Uso:
REM   run-simple.bat [categoria] [subcategoria OPCIONAL] [--prioridad alta|media|baja|todas]
REM   (o solo con alias: run-simple.bat siniestros --prioridad alta)
REM ============================================================

REM --------- Parseo de argumentos (robusto) ----------
set "CATEGORIA="
set "SUBCAT="
set "PRIORIDAD=todas"
set "EXPECT_PRIO_VALUE="

for %%A in (%*) do (
  if defined EXPECT_PRIO_VALUE (
    set "PRIORIDAD=%%~A"
    set "EXPECT_PRIO_VALUE="
  ) else (
    if /I "%%~A"=="--prioridad" (
      set "EXPECT_PRIO_VALUE=1"
    ) else (
      if not defined CATEGORIA (
        set "CATEGORIA=%%~A"
      ) else if not defined SUBCAT (
        set "SUBCAT=%%~A"
      )
    )
  )
)

REM ============================================================
REM =====================  ALIAS  ==============================
REM Puedes llamar por alias directo (ej: "siniestros") o "ficheros siniestros"
REM ============================================================

REM ---- CONFIGURACION
if /I "%CATEGORIA%"=="perfiles" (
  set "CATEGORIA=configuracion"
  set "SUBCAT=perfiles"
) else if /I "%CATEGORIA%"=="usuarios" (
  set "CATEGORIA=configuracion"
  set "SUBCAT=usuarios"
)

REM ---- FICHEROS
if /I "%CATEGORIA%"=="siniestros" (
  set "CATEGORIA=ficheros"
  set "SUBCAT=siniestros"
) else if /I "%CATEGORIA%"=="clientes" (
  set "CATEGORIA=ficheros"
  set "SUBCAT=clientes"
) else if /I "%CATEGORIA%"=="categorias_conductores" (
  set "CATEGORIA=ficheros"
  set "SUBCAT=categorias_conductores"
) else if /I "%CATEGORIA%"=="categorias" (
  set "CATEGORIA=ficheros"
  set "SUBCAT=categorias"
) else if /I "%CATEGORIA%"=="formas_pago" (
  set "CATEGORIA=ficheros"
  set "SUBCAT=formas_pago"
) else if /I "%CATEGORIA%"=="multas" (
  set "CATEGORIA=ficheros"
  set "SUBCAT=multas"
) else if /I "%CATEGORIA%"=="tarjetas" (
  set "CATEGORIA=ficheros"
  set "SUBCAT=tarjetas"
) else if /I "%CATEGORIA%"=="telefonos" (
  set "CATEGORIA=ficheros"
  set "SUBCAT=telefonos"
) else if /I "%CATEGORIA%"=="tipos_vehiculo" (
  set "CATEGORIA=ficheros"
  set "SUBCAT=tipos_vehiculo"
) else if /I "%CATEGORIA%"=="alquileres_vehiculos" (
  set "CATEGORIA=ficheros"
  set "SUBCAT=alquileres_vehiculos"
)

REM ---- PROCESOS
if /I "%CATEGORIA%"=="cargas_descargas" (
  set "CATEGORIA=procesos"
  set "SUBCAT=cargas_descargas"
) else if /I "%CATEGORIA%"=="incidencias" (
  set "CATEGORIA=procesos"
  set "SUBCAT=incidencias"
) else if /I "%CATEGORIA%"=="peticiones_pedidos" (
  set "CATEGORIA=procesos"
  set "SUBCAT=peticiones_pedidos"
) else if /I "%CATEGORIA%"=="presupuestos" (
  set "CATEGORIA=procesos"
  set "SUBCAT=presupuestos"
)

REM ---- TALLER Y GASTOS
if /I "%CATEGORIA%"=="revisiones" (
  set "CATEGORIA=tallerYgastos"
  set "SUBCAT=revisiones"
) else if /I "%CATEGORIA%"=="repostajes" (
  set "CATEGORIA=tallerYgastos"
  set "SUBCAT=repostajes"
) else if /I "%CATEGORIA%"=="peajes" (
  set "CATEGORIA=tallerYgastos"
  set "SUBCAT=peajes"
) else if /I "%CATEGORIA%"=="gastos_generales" (
  set "CATEGORIA=tallerYgastos"
  set "SUBCAT=gastos_generales"
) else if /I "%CATEGORIA%"=="otros_gastos" (
  set "CATEGORIA=tallerYgastos"
  set "SUBCAT=otros_gastos"
)

REM ---- TESORERIA
if /I "%CATEGORIA%"=="anticipos_conductores" (
  set "CATEGORIA=tesoreria"
  set "SUBCAT=anticipos_conductores"
) else if /I "%CATEGORIA%"=="anticipos_proveedores" (
  set "CATEGORIA=tesoreria"
  set "SUBCAT=anticipos_proveedores"
) else if /I "%CATEGORIA%"=="cajas" (
  set "CATEGORIA=tesoreria"
  set "SUBCAT=cajas"
) else if /I "%CATEGORIA%"=="remesas" (
  set "CATEGORIA=tesoreria"
  set "SUBCAT=remesas"
)

REM ---- UTILIDADES
if /I "%CATEGORIA%"=="auditorias" (
  set "CATEGORIA=utilidades"
  set "SUBCAT=auditorias"
) else if /I "%CATEGORIA%"=="datos_maestros" (
  set "CATEGORIA=utilidades"
  set "SUBCAT=datos_maestros"
) else if /I "%CATEGORIA%"=="divisas" (
  set "CATEGORIA=utilidades"
  set "SUBCAT=divisas"
) else if /I "%CATEGORIA%"=="gasoleo_profesional" (
  set "CATEGORIA=utilidades"
  set "SUBCAT=gasoleo_profesional"
) else if /I "%CATEGORIA%"=="gasoleo_profesional_autonomico" (
  set "CATEGORIA=utilidades"
  set "SUBCAT=gasoleo_profesional_autonomico"
)

REM ---- REMUNERACION
if /I "%CATEGORIA%"=="dietas_predefinidas" (
  set "CATEGORIA=remuneracion"
  set "SUBCAT=dietas_predefinidas"
)

REM ---- LOGIN (archivo suelto)
if /I "%CATEGORIA%"=="login" (
  set "SUBCAT="
)

REM ============================================================
REM Normalizar prioridad y exportar a Cypress
set "PRIORIDAD_LC=%PRIORIDAD%"
for %%A in (ALTA,alta) do if /I "%PRIORIDAD%"=="%%A" set "PRIORIDAD_LC=alta"
for %%A in (MEDIA,media) do if /I "%PRIORIDAD%"=="%%A" set "PRIORIDAD_LC=media"
for %%A in (BAJA,baja)  do if /I "%PRIORIDAD%"=="%%A" set "PRIORIDAD_LC=baja"
for %%A in (TODAS,todas) do if /I "%PRIORIDAD%"=="%%A" set "PRIORIDAD_LC=todas"
set "CYPRESS_prioridad=%PRIORIDAD_LC%"

REM ============================================================
REM Resolver patrón (exacto a tus ficheros)
set "SPEC_PATTERN="

if /I "%CATEGORIA%"=="configuracion" (
  if /I "%SUBCAT%"=="perfiles"  set "SPEC_PATTERN=cypress/e2e/configuracion_perfiles.cy.js"
  if /I "%SUBCAT%"=="usuarios"  set "SPEC_PATTERN=cypress/e2e/configuracion_usuarios.cy.js"
  if not defined SUBCAT set "SPEC_PATTERN=cypress/e2e/configuracion_*.cy.js"
)

if /I "%CATEGORIA%"=="ficheros" (
  if /I "%SUBCAT%"=="alquileres_vehiculos"   set "SPEC_PATTERN=cypress/e2e/ficheros_alquileres_vehiculos.cy.js"
  if /I "%SUBCAT%"=="categorias_conductores" set "SPEC_PATTERN=cypress/e2e/ficheros_categorias_conductores.cy.js"
  if /I "%SUBCAT%"=="categorias"             set "SPEC_PATTERN=cypress/e2e/ficheros_categorias.cy.js"
  if /I "%SUBCAT%"=="clientes"               set "SPEC_PATTERN=cypress/e2e/ficheros_clientes.cy.js"
  if /I "%SUBCAT%"=="formas_pago"            set "SPEC_PATTERN=cypress/e2e/ficheros_formas_pago.cy.js"
  if /I "%SUBCAT%"=="multas"                 set "SPEC_PATTERN=cypress/e2e/ficheros_multas.cy.js"
  if /I "%SUBCAT%"=="siniestros"             set "SPEC_PATTERN=cypress/e2e/ficheros_siniestros.cy.js"
  if /I "%SUBCAT%"=="tarjetas"               set "SPEC_PATTERN=cypress/e2e/ficheros_tarjetas.cy.js"
  if /I "%SUBCAT%"=="telefonos"              set "SPEC_PATTERN=cypress/e2e/ficheros_telefonos.cy.js"
  if /I "%SUBCAT%"=="tipos_vehiculo"         set "SPEC_PATTERN=cypress/e2e/ficheros_tipos_vehiculo.cy.js"
  if not defined SUBCAT set "SPEC_PATTERN=cypress/e2e/ficheros_*.cy.js"
)

if /I "%CATEGORIA%"=="procesos" (
  if /I "%SUBCAT%"=="cargas_descargas"  set "SPEC_PATTERN=cypress/e2e/procesos_cargas_descargas.cy.js"
  if /I "%SUBCAT%"=="incidencias"       set "SPEC_PATTERN=cypress/e2e/procesos_incidencias.cy.js"
  if /I "%SUBCAT%"=="peticiones_pedidos" set "SPEC_PATTERN=cypress/e2e/procesos_peticiones_pedidos.cy.js"
  if /I "%SUBCAT%"=="presupuestos"      set "SPEC_PATTERN=cypress/e2e/procesos_presupuestos.cy.js"
  if not defined SUBCAT set "SPEC_PATTERN=cypress/e2e/procesos_*.cy.js"
)

if /I "%CATEGORIA%"=="tallerYgastos" (
  if /I "%SUBCAT%"=="gastos_generales" set "SPEC_PATTERN=cypress/e2e/tallerYgastos_gastos_generales.cy.js"
  if /I "%SUBCAT%"=="otros_gastos"     set "SPEC_PATTERN=cypress/e2e/tallerYgastos_otros_gastos.cy.js"
  if /I "%SUBCAT%"=="peajes"           set "SPEC_PATTERN=cypress/e2e/tallerYgastos_peajes.cy.js"
  if /I "%SUBCAT%"=="repostajes"       set "SPEC_PATTERN=cypress/e2e/tallerYgastos_repostajes.cy.js"
  if /I "%SUBCAT%"=="revisiones"       set "SPEC_PATTERN=cypress/e2e/tallerYgastos_revisiones.cy.js"
  if not defined SUBCAT set "SPEC_PATTERN=cypress/e2e/tallerYgastos_*.cy.js"
)

if /I "%CATEGORIA%"=="tesoreria" (
  if /I "%SUBCAT%"=="anticipos_conductores"  set "SPEC_PATTERN=cypress/e2e/tesoreria_anticipos_conductores.cy.js"
  if /I "%SUBCAT%"=="anticipos_proveedores"  set "SPEC_PATTERN=cypress/e2e/tesoreria_anticipos_proveedores.cy.js"
  if /I "%SUBCAT%"=="cajas"                  set "SPEC_PATTERN=cypress/e2e/tesoreria_cajas.cy.js"
  if /I "%SUBCAT%"=="remesas"                set "SPEC_PATTERN=cypress/e2e/tesoreria_remesas.cy.js"
  if not defined SUBCAT set "SPEC_PATTERN=cypress/e2e/tesoreria_*.cy.js"
)

if /I "%CATEGORIA%"=="utilidades" (
  if /I "%SUBCAT%"=="auditorias"               set "SPEC_PATTERN=cypress/e2e/utilidades_auditorias.cy.js"
  if /I "%SUBCAT%"=="datos_maestros"           set "SPEC_PATTERN=cypress/e2e/utilidades_datos_maestros.cy.js"
  if /I "%SUBCAT%"=="divisas"                  set "SPEC_PATTERN=cypress/e2e/utilidades_divisas.cy.js"
  if /I "%SUBCAT%"=="gasoleo_profesional"      set "SPEC_PATTERN=cypress/e2e/utilidades_gasoleo_profesional.cy.js"
  if /I "%SUBCAT%"=="gasoleo_profesional_autonomico" set "SPEC_PATTERN=cypress/e2e/utilidades_gasoleo_profesional_autonomico*.cy.js"
  if not defined SUBCAT set "SPEC_PATTERN=cypress/e2e/utilidades_*.cy.js"
)

if /I "%CATEGORIA%"=="remuneracion" (
  if /I "%SUBCAT%"=="dietas_predefinidas" set "SPEC_PATTERN=cypress/e2e/remuneracion_dietas_predefinidas*.cy.js"
  if not defined SUBCAT set "SPEC_PATTERN=cypress/e2e/remuneracion_*.cy.js"
)

if /I "%CATEGORIA%"=="login" (
  set "SPEC_PATTERN=cypress/e2e/login.cy.js"
)

REM Si NO hay categoria (pero sí prioridad), ejecuta TODO
if "%CATEGORIA%"=="" (
  set "SPEC_PATTERN=cypress/e2e/**/*.cy.js"
)

REM Si sigue sin patrón, mostrar ayuda
if not defined SPEC_PATTERN (
  echo.
  echo ========================================
  echo    SISTEMA DE PRIORIDADES CYPRESS
  echo ========================================
  echo.
  echo Uso: run-simple.bat [categoria] [subcategoria] [--prioridad nivel]
  echo Ejemplos:
  echo   run-simple.bat siniestros --prioridad alta
  echo   run-simple.bat ficheros siniestros --prioridad alta
  echo   run-simple.bat procesos presupuestos --prioridad media
  echo   run-simple.bat --prioridad alta
  echo.
  goto :eof
)

echo.
echo ========================================
echo    EJECUTANDO PRUEBAS CYPRESS
echo ========================================
if defined CATEGORIA echo Categoria   : %CATEGORIA%
if defined SUBCAT    echo Subcategoria: %SUBCAT%
echo Prioridad   : %PRIORIDAD_LC%
echo Pattern     : %SPEC_PATTERN%
echo ========================================
echo.

npx cypress run --spec "%SPEC_PATTERN%" --env prioridad=%PRIORIDAD_LC%

echo.
echo ========================================
echo    PRUEBAS COMPLETADAS
echo ========================================
echo.
endlocal