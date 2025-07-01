<?php
header("Content-Type: application/json");

include 'conexion.php';

$input = json_decode(file_get_contents("php:://input"), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(["error" => "Datos incorrectos"]);
    exit;
}

// Extrae los datos de JSON 
$idTracto = $input["id_tracto"];
$idCarreta = $input["id_carreta"] ?? null;
$idConductor = $input["id_conductor"];
$nroLiq = $input["nro_liquidacion"];
$anulada = $input["liquidacion_anulada"] ? 'true' : 'false';
$fechaInicio = $input["fecha_inicio"];
$fechaFin = $input["fecha_fin"];
$kmInicio = $input["km_inicio"];
$kmFin = $input["km_fin"];

// Inserta los datos en la tabla viajes
$query = "INSERT INTO viajes (id_tracto, id_carreta, id_conductor, nro_liquidacion, liquidacion_anulada, fecha_inicio, fecha_fin, km_inicio, km_fin)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)";

$params = [$idTracto, $idCarreta, $idConductor, $nroLiq, $anulada, $fechaInicio, $fechaFin, $kmInicio, $kmFin];

$result = pg_query_params($conn, $query, $params);

// Comprueba si se guardó exitosamente los datos
if ($result) {
    pg_query_params($conn, "UPDATE tractos SET nro_liquidacion_inicial = nro_liquidacion_inicial + 1 WHERE id = $1", [$idTracto]);
    pg_query($conn, "COMMIT");
    echo json_encode(["mensaje" => "Datos guardados correctamente. "]);
} else {
    pg_query($conn, "ROLLBACK");
    http_response_code(500);
    echo json_encode(["error" => "Error al guardar los datos."]);
}
?>