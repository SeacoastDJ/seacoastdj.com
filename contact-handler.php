<?php
declare(strict_types=1);

$config = require __DIR__ . '/contact-config.php';

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

$headers = [
    'From: ' . $config['from_name'] . ' <' . $config['from_email'] . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . PHP_VERSION,
];

$sent = @mail(
    $config['recipient_email'],
    $subject,
    $body,
    implode("\r\n", $headers)
);

if (!$sent) {
    error_log('SeacoastDJ contact form: mail() returned false.');
    redirect_to('contact-error.html');
}

$allowedCategories = ['wedding', 'corporate', 'private', 'general'];
$category = in_array($eventType, $allowedCategories, true) ? $eventType : 'general';
redirect_to('/thank-you.html?category=' . rawurlencode($category));
