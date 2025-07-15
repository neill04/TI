<?php
header("Content-Type: application/json");
include '../conexion.php'; 

$input = json_decode(file_get_contents("php://input"), true);

if (
    !$input || 
    !isset($input["cliente"]) || 
    !isset($input["fecha_inicio_servicio"]) || 
    !isset($input["fecha_fin_servicio"])
) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan datos obligatorios."]);
    exit;
}

$cliente = $input["cliente"];
$material = $input["material"] ?? null;
$orden = $input["orden"] ?? null;
$guia = $input["guia"] ?? null;
$fechaInicio = $input["fecha_inicio_servicio"];
$fechaFin = $input["fecha_fin_servicio"];

$query = "INSERT INTO servicios (
    cliente, material, orden, guia, fecha_inicio, fecha_fin
) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id";

$params = [$cliente, $material, $orden, $guia, $fechaInicio, $fechaFin];
$result = pg_query_params($conn, $query, $params);

if ($result) {
    $idServicio = pg_fetch_result($result, 0, 0); // devuelve el ID del nuevo servicio
    echo json_encode(["mensaje" => "Servicio guardado correctamente.", "id_servicio" => $idServicio]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "No se pudo guardar el servicio."]);
}
?>