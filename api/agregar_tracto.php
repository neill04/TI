<?php
header("Content-Type: application/json");
include '../conexion.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(["error" => "Datos incorrectos"]);
    exit;
}

$placa = $input["placa"];
$depreciacion = $input["depreciacion_km"];
$nroLiqInicial = $input["nro_liquidacion_inicial"];

$query = "INSERT INTO tractos (placa, depreciacion_km, nro_liquidacion_inicial) VALUES ($1, $2, $3)";
$params = [$placa, $depreciacion, $nroLiqInicial];

$result = pg_query_params($conn, $query, $params);

if ($result) {
    echo json_encode(["mensaje" => "Tracto guardado correctamente."]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error al guardar el tracto."]);
}
?>
