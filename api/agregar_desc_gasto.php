<?php
header("Content-Type: application/json");
include '../conexion.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!$input || !isset($input["descripcion"])) {
    http_response_code(400);
    echo json_encode(["error" => "Descripción requerida."]);
    exit;
}

$descripcion = $input["descripcion"];

$query = "INSERT INTO descripciones_gasto (descripcion) VALUES ($1)";
$result = pg_query_params($conn, $query, [$descripcion]);

if ($result) {
    echo json_encode(["mensaje" => "Descripción guardada correctamente."]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error al guardar la descripción."]);
}
?>