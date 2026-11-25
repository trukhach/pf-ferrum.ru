<?php
// Обработчик заявок для хостинга REG.RU (PHP включён по умолчанию).
// Письмо уходит на адрес ниже. Если письма не доходят, в панели REG.RU
// создайте ящик на домене (например, info@pf-ferrum.ru) и укажите его в $from.
header('Content-Type: application/json; charset=utf-8');

$to   = 'tdk_miass@mail.ru';
$from = 'noreply@pf-ferrum.ru';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok' => false]); exit; }
if (!empty($_POST['website'])) { echo json_encode(['ok' => true]); exit; } // ловушка для ботов

$clean = function ($v, $len) { return mb_substr(trim(strip_tags((string)$v)), 0, $len); };
$name    = $clean($_POST['name'] ?? '', 200);
$phone   = $clean($_POST['phone'] ?? '', 50);
$message = $clean($_POST['message'] ?? '', 3000);
$agree   = !empty($_POST['agree']);

if ($name === '' || strlen(preg_replace('/\D/', '', $phone)) < 10 || !$agree) {
  http_response_code(422); echo json_encode(['ok' => false]); exit;
}

$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта pf-ferrum.ru') . '?=';
$body = "Имя / компания: $name\nТелефон: $phone\n\nСообщение:\n$message\n\nДата: " . date('d.m.Y H:i');
$headers = "From: $from\r\nReply-To: $from\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail($to, $subject, $body, $headers);
http_response_code($sent ? 200 : 500);
echo json_encode(['ok' => (bool)$sent]);
