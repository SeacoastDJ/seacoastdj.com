<?php
declare(strict_types=1);

require __DIR__ . '/lib/PHPMailer/Exception.php';
require __DIR__ . '/lib/PHPMailer/PHPMailer.php';
require __DIR__ . '/lib/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

$config = require __DIR__ . '/contact-config.php';
$smtp   = require __DIR__ . '/smtp-config.php';

function redirect_to(string $page): never {
    header('Location: ' . $page, true, 303);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_to('contact.html');
}

// Honeypot: real visitors never fill this field.
if (trim((string)($_POST['website'] ?? '')) !== '') {
    redirect_to('contact-success.html');
}

$started = filter_input(INPUT_POST, 'form_started', FILTER_VALIDATE_INT);
if (!$started || (time() - $started) < 3 || (time() - $started) > 86400) {
    redirect_to('contact-error.html');
}

$clean = static function (string $value, int $max): string {
    $value = trim(str_replace(["\r", "\0"], '', $value));
    return mb_substr($value, 0, $max);
};

$name       = $clean((string)($_POST['name'] ?? ''), 100);
$email      = $clean((string)($_POST['email'] ?? ''), 180);
$phone      = $clean((string)($_POST['phone'] ?? ''), 40);
$eventType  = $clean((string)($_POST['event_type'] ?? ''), 80);
$eventDate  = $clean((string)($_POST['event_date'] ?? ''), 20);
$venue      = $clean((string)($_POST['venue'] ?? ''), 180);
$message    = $clean((string)($_POST['message'] ?? ''), 4000);

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect_to('contact-error.html');
}

$subject = $config['subject_prefix'] . ' ' . $name;
$body = "New website inquiry\n\n"
      . "Name: {$name}\n"
      . "Email: {$email}\n"
      . "Phone: " . ($phone ?: 'Not provided') . "\n"
      . "Event type: " . ($eventType ?: 'Not provided') . "\n"
      . "Event date: " . ($eventDate ?: 'Not provided') . "\n"
      . "Venue/location: " . ($venue ?: 'Not provided') . "\n\n"
      . "Message:\n{$message}\n\n"
      . "Submitted from: " . ($_SERVER['HTTP_HOST'] ?? 'seacoastdj.com') . "\n";

$sent = false;
try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = $smtp['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtp['username'];
    $mail->Password   = $smtp['password'];
    $mail->SMTPSecure = $smtp['secure'] === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = $smtp['port'];
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($config['recipient_email'], $config['recipient_name']);
    $mail->addReplyTo($email, $name);

    $mail->isHTML(false);
    $mail->Subject = $subject;
    $mail->Body    = $body;

    $mail->send();
    $sent = true;
} catch (PHPMailerException $e) {
    error_log('SeacoastDJ contact form: PHPMailer error - ' . $e->getMessage());
} catch (\Throwable $e) {
    error_log('SeacoastDJ contact form: unexpected error - ' . $e->getMessage());
}

if (!$sent) {
    redirect_to('contact-error.html');
}

$allowedCategories = ['wedding', 'corporate', 'private', 'general'];
$category = in_array($eventType, $allowedCategories, true) ? $eventType : 'general';
redirect_to('/thank-you.html?category=' . rawurlencode($category));
