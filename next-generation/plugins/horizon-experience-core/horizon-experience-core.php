<?php
/**
 * Plugin Name: Hook the Horizon Experience Core
 * Description: Publication-owned field-file, pathway, privacy and evidence contracts for the Hook the Horizon rebuild.
 * Version: 0.2.0
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Author: Rachel Anderson
 * Text Domain: horizon-experience-core
 */
declare(strict_types=1);
if (! defined('ABSPATH')) { exit; }
const HTH_EXPERIENCE_CORE_VERSION = '0.2.0';
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
