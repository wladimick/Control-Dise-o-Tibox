# Edición rápida e importación

## Flujo de edición

- Al seleccionar una fila se abre un modal compacto con los campos operativos principales.
- El botón **Editar todo** abre el formulario completo existente.
- El botón **Agregar** reutiliza el mismo modal para una creación rápida.
- Los perfiles `viewer` pueden revisar el detalle, pero no guardar cambios.

## Importación

Se aceptan archivos `.xlsx`, `.xlsm` y `.csv` de hasta 8 MB.

La aplicación busca los encabezados en las primeras 15 filas y reconoce, entre otros:

- Cliente
- Proyecto o Trabajo
- Tipo
- Estado
- Fecha Inicio y Fecha Término
- Duración
- HH Sem. y HH Total
- Wladimick y Braulio
- Comentarios

Los registros existentes con la misma combinación de cliente, título y fecha de inicio se omiten. La importación puede marcar todos los nuevos elementos como reportables para César.
