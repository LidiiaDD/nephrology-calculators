@echo off
setlocal enableextensions

rem 0) Піднімемо середовище Emscripten
call "%USERPROFILE%\emsdk\emsdk_env.bat" >nul

rem 1) У корінь проєкту
cd /d "%~dp0"

rem 2) Почистити/Створити каталоги
rmdir /s /q build 2>nul & mkdir build
mkdir public\wasm 2>nul

rem 3) Інклуди для ClinRisk
set "INC=-I clinrisk\qkidney\include"

echo [1/6] neph3_0.c
emcc -O2 %INC% -c "clinrisk\qkidney\c\Q54_kidney_xml_51_neph3_0.c" -o build\neph3_0.o || goto :err

echo [2/6] neph3_1.c
emcc -O2 %INC% -c "clinrisk\qkidney\c\Q54_kidney_xml_51_neph3_1.c" -o build\neph3_1.o || goto :err

echo [3/6] neph5_0.c
emcc -O2 %INC% -c "clinrisk\qkidney\c\Q54_kidney_xml_51_neph5_0.c" -o build\neph5_0.o || goto :err

echo [4/6] neph5_1.c
emcc -O2 %INC% -c "clinrisk\qkidney\c\Q54_kidney_xml_51_neph5_1.c" -o build\neph5_1.o || goto :err

echo [5/6] util.c
emcc -O2 %INC% -c "clinrisk\qkidney\utils\util.c" -o build\util.o || goto :err

rem 6) Експортуємо потрібні функції (пишемо з підкресленням — формат Emscripten)
set "EF=[\"_q54_kidney_xml_51_neph3_0\",\"_q54_kidney_xml_51_neph3_1\",\"_q54_kidney_xml_51_neph5_0\",\"_q54_kidney_xml_51_neph5_1\",\"_malloc\",\"_free\"]"

echo [6/6] Лінкуємо у один WASM
emcc -O2 -s STANDALONE_WASM=1 -Wl,--no-entry -s EXPORTED_FUNCTIONS=%EF% ^
  build\neph3_0.o build\neph3_1.o build\neph5_0.o build\neph5_1.o build\util.o ^
  -o public\wasm\qkidney.wasm || goto :err

echo.
echo ✅ Готово: public\wasm\qkidney.wasm
echo Перевіряю список експортів...

node -e "const fs=require('fs');(async()=>{const m=await WebAssembly.compile(fs.readFileSync('public/wasm/qkidney.wasm'));console.log(WebAssembly.Module.exports(m).map(e=>e.name));})();"

exit /b 0

:err
echo.
echo ❌ Помилка збірки (дивись рядок вище).
exit /b 1
