<?php
// Datos para la conexión con la base de datos
$host = "localhost";
$port = "5432";
$dbname = "rentabilidad";
$user = "neillolazabal";
$password = "neill";

// Crear conexión
$conn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");

if (!$conn) {
    die("Error al conectar con PostgreSQL");
}
?>
