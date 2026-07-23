<?php
/**
 * Plugin Name: Hook the Horizon Experience Core
 * Description: Publication-owned field-file, pathway, privacy, discovery, account and commerce contracts for the Hook the Horizon rebuild.
 * Version: 0.3.1
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Author: Rachel Anderson
 * Text Domain: horizon-experience-core
 */
declare(strict_types=1);
if (! defined('ABSPATH')) { exit; }
const HTH_EXPERIENCE_CORE_VERSION = '0.3.1';
function hth_experience_register_types(): void {
    register_post_type('hth_field_file',['labels'=>['name'=>__('Field Files','horizon-experience-core'),'singular_name'=>__('Field File','horizon-experience-core'),'add_new_item'=>__('Add Field File','horizon-experience-core'),'edit_item'=>__('Edit Field File','horizon-experience-core'),'not_found'=>__('No field files found.','horizon-experience-core')],'public'=>true,'show_in_rest'=>true,'has_archive'=>true,'rewrite'=>['slug'=>'field-files','with_front'=>false],'menu_icon'=>'dashicons-location-alt','supports'=>['title','editor','excerpt','thumbnail','revisions','custom-fields']]);
    register_taxonomy('hth_field_type',['hth_field_file'],['labels'=>['name'=>__('Field Types','horizon-experience-core'),'singular_name'=>__('Field Type','horizon-experience-core')],'public'=>true,'show_in_rest'=>true,'hierarchical'=>true,'rewrite'=>['slug'=>'field-type','with_front'=>false]]);
}
add_action('init','hth_experience_register_types');
function hth_experience_register_meta(): void {
    foreach (['hth_conditions','hth_source_time','hth_confidence','hth_uncertainty','hth_regulation_state','hth_privacy_state','hth_adjustment','hth_stop_condition','hth_image_state','hth_equipment_limits','hth_access_state','hth_media_slot_map'] as $field) {
        register_post_meta('hth_field_file',$field,['type'=>'string','single'=>true,'default'=>'','sanitize_callback'=>'sanitize_textarea_field','auth_callback'=>static fn():bool=>current_user_can('edit_posts'),'show_in_rest'=>['schema'=>['type'=>'string','context'=>['view','edit']]]]);
    }
}
add_action('init','hth_experience_register_meta');
function hth_experience_pattern_category(): void { if (function_exists('register_block_pattern_category')) { register_block_pattern_category('horizon-pathways',['label'=>__('Horizon pathways','horizon-experience-core')]); } }
add_action('init','hth_experience_pattern_category');
function hth_experience_rest_routes(): void { register_rest_route('horizon-experience/v1','/readiness',['methods'=>'GET','permission_callback'=>static fn():bool=>current_user_can('edit_posts'),'callback'=>static fn():WP_REST_Response=>new WP_REST_Response(['pluginVersion'=>HTH_EXPERIENCE_CORE_VERSION,'productionActivationAuthorized'=>false,'requiredEvidence'=>['installed preview','migration dry run','current regulation and weather source review','location privacy QA','backup and rollback']])]); }
add_action('rest_api_init','hth_experience_rest_routes');
function hth_experience_activate(): void { hth_experience_register_types(); update_option('hth_experience_core_cutover_authorized','no',false); flush_rewrite_rules(); }
register_activation_hook(__FILE__,'hth_experience_activate');
register_deactivation_hook(__FILE__,'flush_rewrite_rules');
function hth_experience_notice(): void { if (! current_user_can('manage_options') || get_option('hth_experience_core_cutover_authorized')==='yes') { return; } echo '<div class="notice notice-warning"><p>'.esc_html__('Hook the Horizon Experience Core is a reversible rebuild candidate. Activation does not authorize publication, migration, location disclosure, or production replacement.','horizon-experience-core').'</p></div>'; }
add_action('admin_notices','hth_experience_notice');
require_once __DIR__ . '/includes/class-publication-runtime.php';
require_once __DIR__ . '/includes/publication-adapter-runtime.php';
new NLH_Publication_Runtime([
    'key'=>'hook-the-horizon','publication'=>'Hook the Horizon','version'=>HTH_EXPERIENCE_CORE_VERSION,'plugin_file'=>__FILE__,'rest_namespace'=>'horizon-experience/v1',
    'discover_post_types'=>['post','page','hth_field_file'],
    'primary_sections'=>['start-here','field-files','resources','tools','store','research-and-standards'],
    'applications'=>[
        ['id'=>'conditions-brief','title'=>'Conditions Brief','state'=>'contract-ready'],
        ['id'=>'trip-blueprint','title'=>'Trip Blueprint','state'=>'contract-ready'],
        ['id'=>'tackle-compatibility','title'=>'Tackle Compatibility','state'=>'contract-ready']
    ],
    'commerce_collections'=>[
        ['id'=>'gear','title'=>'Gear edits','state'=>'editorial-mapping-required'],
        ['id'=>'packing','title'=>'Packing systems','state'=>'editorial-mapping-required'],
        ['id'=>'downloads','title'=>'Field resources','state'=>'editorial-mapping-required']
    ]
]);
nlh_register_publication_adapter_runtime(
    'horizon-experience/v1',
    dirname(__DIR__, 2) . '/contracts/publication-adapter.json',
    'nlh-hook-the-horizon-runtime',
    'hook-the-horizon'
);

add_filter('rest_request_before_callbacks', static function ($response, $handler, WP_REST_Request $request) {
    if (! in_array($request->get_method(), ['POST', 'PUT', 'PATCH'], true) || $request->get_route() !== '/horizon-experience/v1/account') {
        return $response;
    }
    $body = $request->get_body_params();
    if (is_array($body) && $body !== []) {
        $request->set_header('content-type', 'application/json');
        $request->set_body((string) wp_json_encode($body));
    }
    return $response;
}, 10, 3);
