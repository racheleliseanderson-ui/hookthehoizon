<?php
/** Validate that active block-theme HTML files parse into named Gutenberg blocks. */
if (! defined('ABSPATH')) { fwrite(STDERR, "WordPress must be loaded.\n"); exit(1); }
$theme_root = get_stylesheet_directory();
$files = [];
foreach (['templates', 'parts'] as $directory) {
    $path = $theme_root . '/' . $directory;
    if (! is_dir($path)) { continue; }
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path));
    foreach ($iterator as $file) { if ($file->isFile() && strtolower($file->getExtension()) === 'html') { $files[] = $file->getPathname(); } }
}
$errors = [];
$inspect = static function (array $blocks, string $file) use (&$inspect, &$errors): void { foreach ($blocks as $block) { if (($block['blockName'] ?? null) === null && trim((string) ($block['innerHTML'] ?? '')) !== '') { $errors[] = basename($file) . ': unparsed top-level HTML'; } if (! empty($block['innerBlocks'])) { $inspect($block['innerBlocks'], $file); } } };
foreach ($files as $file) { $blocks = parse_blocks((string) file_get_contents($file)); if (! $blocks) { $errors[] = basename($file) . ': no blocks parsed'; continue; } $inspect($blocks, $file); }
if (! $files) { $errors[] = 'No active-theme block templates found.'; }
if ($errors) { fwrite(STDERR, implode("\n", $errors) . "\n"); exit(1); }
$output = wp_json_encode(['theme' => get_stylesheet(), 'validated' => count($files), 'status' => 'pass'], JSON_PRETTY_PRINT);
if (class_exists('WP_CLI')) { WP_CLI::log((string) $output); } else { echo $output . PHP_EOL; }
