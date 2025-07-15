<?php
header("Content-Type: application/json");
include '../conexion.php';

$input = json_decode(file_get_contents("php://input"), true);

if (
    !$input ||
    !isset($input["tipo"]) ||
    !isset($input["comprobante"]) ||
    !isset($input["cantidad"]) ||
    !isset($input["precio_unitario"]) ||
    !isset($input["total"])
) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan datos obligatorios."]);
    exit;
}

$tipo = $input["tipo"];
$comprobante = $input["comprobante"];
$descripcion = $input["descripcion"] ?? null;
$cantidad = $input["cantidad"];
$precioUnitario = $input["precio_unitario"];
$total = $input["total"];

$query = "INSERT INTO gastos (
    tipo, comprobante, descripcion, cantidad, precio_unitario, total
) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id";

$params = [$tipo, $comprobante, $descripcion, $cantidad, $precioUnitario, $total];
$result = pg_query_params($conn, $query, $params);

if ($result) {
    $idGasto = pg_fetch_result($result, 0, 0);
    echo json_encode(["mensaje" => "Gasto guardado correctamente.", "id_gasto" => $idGasto]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "No se pudo guardar el gasto."]);
}
?>