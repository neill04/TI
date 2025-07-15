<?php
header("Content-Type: application/json");
include '../conexion.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!$input || !isset($input["nombre"])) {
    http_response_code(400);
    echo json_encode(["error" => "Nombre requerido."]);
    exit;
}

$nombre = $input["nombre"];

$query = "INSERT INTO clientes (nombre) VALUES ($1)";
$result = pg_query_params($conn, $query, [$nombre]);

if ($result) {
    echo json_encode(["mensaje" => "Cliente guardado correctamente."]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error al guardar el cliente."]);
}
?>
