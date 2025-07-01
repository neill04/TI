<?php
header("Content-Type: application/json");
include __DIR__ . '/../conexion.php';

$id = $_GET['id'] ?? null;

if (!$id) {
    echo json_encode(["error" => "ID no recibido"]);
    exit;
}

$res = pg_query_params($conn, "
  SELECT nro_liquidacion_inicial 
  FROM tractos 
  WHERE id = $1
", [$id]);

if ($res && pg_num_rows($res) > 0) {
    $row = pg_fetch_assoc($res);
    echo json_encode(["nro_liquidacion" => $row['nro_liquidacion_inicial']]);
} else {
    echo json_encode(["error" => "No encontrado"]);
}
?>
