<?php
header("Content-Type: application/json");
include '../conexion.php';

$input = json_decode(file_get_contents("php://input"), true);

if (
    !$input ||
    !isset($input["serie"]) ||
    !isset($input["cantidad"]) ||
    !isset($input["unidad_medida"]) ||
    !isset($input["flete_sin_igv"]) ||
    !isset($input["dias_credito"])
) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan datos obligatorios."]);
    exit;
}

$serie = $input["serie"];
$cantidad = $input["cantidad"];
$unidadMedida = $input["unidad_medida"];
$fleteSinIGV = $input["flete_sin_igv"];
$diasCredito = $input["dias_credito"];

$query = "INSERT INTO facturas (
    serie, cantidad, unidad_medida, flete_sin_igv, dias_credito
) VALUES ($1, $2, $3, $4, $5) RETURNING id";

$params = [$serie, $cantidad, $unidadMedida, $fleteSinIGV, $diasCredito];
$result = pg_query_params($conn, $query, $params);

if ($result) {
    $idFactura = pg_fetch_result($result, 0, 0);
    echo json_encode(["mensaje" => "Factura guardada correctamente.", "id_factura" => $idFactura]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "No se pudo guardar la factura."]);
}
?>