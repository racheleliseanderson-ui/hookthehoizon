<?php
/**
 * Idempotent primary page-world migration for WP-CLI.
 * Dry run: wp eval-file page-worlds.php
 * Apply to preview: wp eval-file page-worlds.php apply publish set-front-page
 */
declare(strict_types=1);
if (! defined('ABSPATH')) { fwrite(STDERR, "WordPress must be loaded.\n"); exit(1); }
$cli_args = isset($args) && is_array($args) ? array_map('strval', $args) : [];
$apply = in_array('--apply', $cli_args, true) || in_array('apply', $cli_args, true);
$set_front_page = in_array('--set-front-page', $cli_args, true) || in_array('set-front-page', $cli_args, true);
$status = 'draft';
foreach ($cli_args as $arg) { $candidate = str_starts_with($arg, '--status=') ? substr($arg, 9) : $arg; if (in_array($candidate, ['draft','private','publish'], true)) { $status = $candidate; } }
$manifest = json_decode((string) file_get_contents(__DIR__ . '/page-worlds.json'), true, 512, JSON_THROW_ON_ERROR);
$results=[];$registry=[];
foreach($manifest['pages'] as $page){$slug=sanitize_title((string)$page['slug']);$existing=get_page_by_path($slug,OBJECT,'page');$action=$existing instanceof WP_Post?'preserve':'create';$post_id=$existing instanceof WP_Post?(int)$existing->ID:0;if($apply){$payload=['ID'=>$post_id,'post_type'=>'page','post_title'=>sanitize_text_field((string)$page['title']),'post_name'=>$slug,'post_status'=>$status];if(!$post_id){$payload['post_content']='';}$written=wp_insert_post($payload,true);if(is_wp_error($written)){throw new RuntimeException($written->get_error_message());}$post_id=(int)$written;update_post_meta($post_id,'_nlh_page_world_role',sanitize_key((string)$page['role']));update_post_meta($post_id,'_nlh_template_contract',sanitize_key((string)$page['template']));$action=$existing instanceof WP_Post?'updated-metadata':'created';}$registry[$slug]=$post_id;$results[]=['slug'=>$slug,'id'=>$post_id,'action'=>$action,'status'=>$apply?$status:'planned'];}
if($apply){update_option('nlh_primary_page_world_registry',$registry,false);if($set_front_page&&!empty($registry[$manifest['frontPageSlug']])){update_option('show_on_front','page');update_option('page_on_front',(int)$registry[$manifest['frontPageSlug']]);}}
$output=wp_json_encode(['publication'=>$manifest['publication'],'mode'=>$apply?'apply':'dry-run','frontPageChanged'=>$apply&&$set_front_page,'pages'=>$results],JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);if(class_exists('WP_CLI')){WP_CLI::log((string)$output);}else{echo $output.PHP_EOL;}
