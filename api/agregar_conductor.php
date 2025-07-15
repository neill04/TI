<?php
header("Content-Type: application/json");
include '../conexion.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(["error" => "Datos inválidos."]);
    exit;
}

$nombre = $input["nombre"];
$licencia = $input["licencia"];
$sueldo = $input["sueldo"];

$query = "INSERT INTO conductores (nombre, licencia, sueldo) VALUES ($1, $2, $3)";
$params = [$nombre, $licencia, $sueldo];

$result = pg_query_params($conn, $query, $params);

if ($result) {
    echo json_encode(["mensaje" => "Conductor guardado correctamente."]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error al guardar el conductor."]);
}
?>
