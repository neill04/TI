<?php
header("Content-Type: application/json");
include '../conexion.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!$input || !isset($input["placa"])) {
    http_response_code(400);
    echo json_encode(["error" => "Placa requerida."]);
    exit;
}

$placa = $input["placa"];

$query = "INSERT INTO carretas (placa) VALUES ($1)";
$result = pg_query_params($conn, $query, [$placa]);

if ($result) {
    echo json_encode(["mensaje" => "Carreta guardada correctamente."]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error al guardar la carreta."]);
}
?>
