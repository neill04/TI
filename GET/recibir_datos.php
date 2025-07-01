<?php
header("Content-Type: application/json");

include __DIR__ . '/../conexion.php';

$data = [];

// Recibe los datos de la tabla Tractos
$tractos = pg_query($conn, "SELECT id, placa FROM tractos");
$data['tractos'] = pg_fetch_all($tractos);

// Recibe los datos de la tabla Carretas
$carretas = pg_query($conn, "SELECT id, placa FROM carretas");
$data['carretas'] = pg_fetch_all($carretas);

// Recibe los datos de la tabla Conductores
$conductores = pg_query($conn, "SELECT id, nombre FROM conductores");
$data['conductores'] = pg_fetch_all($conductores);

echo json_encode($data);
?>