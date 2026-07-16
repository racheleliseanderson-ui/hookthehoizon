<?php
/** Publication SEO and visibility baseline. */
declare(strict_types=1);
defined('ABSPATH') || exit;

final class RE_Publication_Visibility {
    /** @var array<string,mixed> */
    private static array $c = [];

    /** @param array<string,mixed> $config */
    public static function boot(array $config): void {
        self::$c = wp_parse_args($config, [
            'name' => get_bloginfo('name'),
            'domain' => home_url('/'),
            'description' => get_bloginfo('description'),
            'text_domain' => 'default',
            'post_types' => ['post', 'page'],
            'article_types' => ['post'],
        ]);
        add_action('init', [self::class, 'register_meta'], 30);
        add_action('add_meta_boxes', [self::class, 'add_box']);
        add_action('save_post', [self::class, 'save_box'], 10, 2);
        add_filter('pre_get_document_title', [self::class, 'title']);
        add_filter('wp_robots', [self::class, 'robots']);
        add_filter('wp_sitemaps_posts_query_args', [self::class, 'sitemap_args'], 10, 2);
        foreach (['wpseo_title','rank_math/frontend/title','aioseo_title','seopress_titles_title'] as $hook) add_filter($hook, [self::class, 'title']);
        foreach (['wpseo_metadesc','rank_math/frontend/description','aioseo_description','seopress_titles_desc'] as $hook) add_filter($hook, [self::class, 'description_filter']);
        add_action('wp_head', [self::class, 'head'], 2);
    }

    public static function register_meta(): void {
        foreach (self::types() as $type) {
            foreach ([
                '_re_seo_title' => ['string', 'sanitize_text_field'],
                '_re_seo_description' => ['string', 'sanitize_textarea_field'],
                '_re_noindex' => ['boolean', 'rest_sanitize_boolean'],
            ] as $key => [$valueType, $sanitize]) {
                register_post_meta($type, $key, [
                    'type' => $valueType, 'single' => true, 'show_in_rest' => true,
                    'sanitize_callback' => $sanitize,
                    'auth_callback' => static fn (): bool => current_user_can('edit_posts'),
                ]);
            }
        }
    }

    public static function add_box(): void {
        foreach (self::types() as $type) {
            add_meta_box('re-publication-visibility', __('Publication Visibility', self::td()), [self::class, 'box'], $type, 'side');
        }
    }

    public static function box(WP_Post $post): void {
        wp_nonce_field('re_visibility_save', 're_visibility_nonce');
        $title = (string) get_post_meta($post->ID, '_re_seo_title', true);
        $description = (string) get_post_meta($post->ID, '_re_seo_description', true);
        $noindex = get_post_meta($post->ID, '_re_noindex', true) === '1';
        ?>
        <p><label for="re_seo_title"><strong><?php esc_html_e('Search title override', self::td()); ?></strong></label></p>
        <input class="widefat" id="re_seo_title" name="re_seo_title" value="<?php echo esc_attr($title); ?>">
        <p><label for="re_seo_description"><strong><?php esc_html_e('Search description', self::td()); ?></strong></label></p>
        <textarea class="widefat" rows="4" id="re_seo_description" name="re_seo_description"><?php echo esc_textarea($description); ?></textarea>
        <p><label><input type="checkbox" name="re_noindex" value="1" <?php checked($noindex); ?>> <?php esc_html_e('Exclude from indexing and XML sitemaps', self::td()); ?></label></p>
        <?php
    }

    public static function save_box(int $postId, WP_Post $post): void {
        $nonce = isset($_POST['re_visibility_nonce']) ? sanitize_text_field(wp_unslash($_POST['re_visibility_nonce'])) : '';
        if (!in_array($post->post_type, self::types(), true) || !wp_verify_nonce($nonce, 're_visibility_save')) return;
        if ((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || !current_user_can('edit_post', $postId)) return;
        update_post_meta($postId, '_re_seo_title', sanitize_text_field((string) wp_unslash($_POST['re_seo_title'] ?? '')));
        update_post_meta($postId, '_re_seo_description', sanitize_textarea_field((string) wp_unslash($_POST['re_seo_description'] ?? '')));
        update_post_meta($postId, '_re_noindex', isset($_POST['re_noindex']) ? '1' : '0');
    }

    public static function title(string $title): string {
        if (!is_singular()) return $title;
        $value = trim((string) get_post_meta((int) get_queried_object_id(), '_re_seo_title', true));
        return $value !== '' ? $value : $title;
    }

    public static function description_filter(string $description): string {
        $value = self::description();
        return $value !== '' ? $value : $description;
    }

    /** @param array<string,mixed> $robots @return array<string,mixed> */
    public static function robots(array $robots): array {
        if (self::noindex()) {
            $robots['noindex'] = true; $robots['follow'] = true; unset($robots['index']);
        } else {
            $robots['max-image-preview'] = 'large'; $robots['max-snippet'] = -1; $robots['max-video-preview'] = -1;
        }
        return $robots;
    }

    /** @param array<string,mixed> $args @return array<string,mixed> */
    public static function sitemap_args(array $args, string $postType): array {
        if (!in_array($postType, self::types(), true)) return $args;
        $query = isset($args['meta_query']) && is_array($args['meta_query']) ? $args['meta_query'] : [];
        $query[] = ['relation' => 'OR', ['key' => '_re_noindex', 'compare' => 'NOT EXISTS'], ['key' => '_re_noindex', 'value' => '1', 'compare' => '!=']];
        $args['meta_query'] = $query;
        return $args;
    }

    public static function head(): void {
        $verification = trim((string) get_option('re_google_site_verification', ''));
        if ($verification !== '') printf("\n<meta name=\"google-site-verification\" content=\"%s\">\n", esc_attr($verification));
        if (self::seo_plugin() || is_admin() || is_feed() || is_404() || is_search()) return;
        $url = self::canonical(); if ($url === '') return;
        $title = wp_get_document_title(); $description = self::description(); $image = self::image();
        echo "\n<!-- Editorial Ecosystem publication visibility fallback -->\n";
        if (!is_singular()) printf("<link rel=\"canonical\" href=\"%s\">\n", esc_url($url));
        if ($description !== '') printf("<meta name=\"description\" content=\"%s\">\n", esc_attr($description));
        foreach (['og:site_name' => (string) self::$c['name'], 'og:title' => $title, 'og:url' => $url, 'og:type' => is_singular() ? 'article' : 'website'] as $property => $value) {
            printf("<meta property=\"%s\" content=\"%s\">\n", esc_attr($property), esc_attr($value));
        }
        if ($description !== '') printf("<meta property=\"og:description\" content=\"%s\">\n", esc_attr($description));
        if ($image !== '') printf("<meta property=\"og:image\" content=\"%s\">\n", esc_url($image));
        printf("<meta name=\"twitter:card\" content=\"%s\">\n", $image !== '' ? 'summary_large_image' : 'summary');
        printf("<meta name=\"twitter:title\" content=\"%s\">\n", esc_attr($title));
        if ($description !== '') printf("<meta name=\"twitter:description\" content=\"%s\">\n", esc_attr($description));
        if ($image !== '') printf("<meta name=\"twitter:image\" content=\"%s\">\n", esc_url($image));
        printf("<script type=\"application/ld+json\">%s</script>\n", wp_json_encode(self::schema($url, $title, $description, $image), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    /** @return array<string,mixed> */
    private static function schema(string $url, string $title, string $description, string $image): array {
        $home = trailingslashit((string) self::$c['domain']); $org = $home . '#organization'; $site = $home . '#website';
        $graph = [
            ['@type' => 'Organization', '@id' => $org, 'name' => (string) self::$c['name'], 'url' => $home],
            ['@type' => 'WebSite', '@id' => $site, 'url' => $home, 'name' => (string) self::$c['name'], 'description' => (string) self::$c['description'], 'publisher' => ['@id' => $org], 'inLanguage' => get_bloginfo('language')],
            ['@type' => 'WebPage', '@id' => $url . '#webpage', 'url' => $url, 'name' => $title, 'description' => $description, 'isPartOf' => ['@id' => $site], 'inLanguage' => get_bloginfo('language')],
        ];
        if (is_singular() && in_array((string) get_post_type(), self::article_types(), true)) {
            $id = (int) get_queried_object_id(); $author = (int) get_post_field('post_author', $id);
            $article = ['@type' => get_post_type($id) === 'post' ? 'BlogPosting' : 'Article', '@id' => $url . '#article', 'headline' => $title, 'description' => $description, 'mainEntityOfPage' => ['@id' => $url . '#webpage'], 'datePublished' => get_the_date(DATE_W3C, $id), 'dateModified' => get_the_modified_date(DATE_W3C, $id), 'author' => ['@type' => 'Person', 'name' => get_the_author_meta('display_name', $author), 'url' => get_author_posts_url($author)], 'publisher' => ['@id' => $org], 'inLanguage' => get_bloginfo('language')];
            if ($image !== '') $article['image'] = [$image]; $graph[] = $article;
        }
        return ['@context' => 'https://schema.org', '@graph' => $graph];
    }

    private static function description(): string {
        if (is_singular()) {
            $id = (int) get_queried_object_id();
            foreach ([(string) get_post_meta($id, '_re_seo_description', true), (string) get_the_excerpt($id), (string) get_post_field('post_content', $id)] as $candidate) {
                $candidate = trim(preg_replace('/\s+/u', ' ', wp_strip_all_tags(strip_shortcodes($candidate))) ?? '');
                if ($candidate !== '') return mb_strlen($candidate) > 165 ? rtrim(mb_substr($candidate, 0, 162)) . '...' : $candidate;
            }
        }
        $value = (string) self::$c['description'];
        return mb_strlen($value) > 165 ? rtrim(mb_substr($value, 0, 162)) . '...' : $value;
    }

    private static function canonical(): string {
        if (is_singular()) return (string) (wp_get_canonical_url((int) get_queried_object_id()) ?: '');
        if (is_front_page()) return trailingslashit((string) self::$c['domain']);
        if (is_home()) { $id = (int) get_option('page_for_posts'); return $id > 0 ? (string) get_permalink($id) : trailingslashit((string) self::$c['domain']); }
        if (is_post_type_archive()) { $url = get_post_type_archive_link((string) get_query_var('post_type')); return is_string($url) ? $url : ''; }
        if (is_category() || is_tag() || is_tax()) { $url = get_term_link(get_queried_object()); return is_wp_error($url) ? '' : (string) $url; }
        return (string) get_pagenum_link(max(1, (int) get_query_var('paged')));
    }

    private static function image(): string {
        if (is_singular() && has_post_thumbnail()) { $url = wp_get_attachment_image_url((int) get_post_thumbnail_id(), 'full'); if (is_string($url)) return $url; }
        return esc_url_raw((string) get_option('re_default_social_image', ''));
    }

    private static function noindex(): bool {
        return is_search() || is_404() || is_attachment() || (is_singular() && get_post_meta((int) get_queried_object_id(), '_re_noindex', true) === '1');
    }

    private static function seo_plugin(): bool {
        return defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION') || defined('SEOPRESS_VERSION') || class_exists('WPSEO_Frontend') || class_exists('RankMath\\Helper');
    }

    /** @return string[] */
    private static function types(): array { return array_values(array_unique(array_map('sanitize_key', (array) self::$c['post_types']))); }
    /** @return string[] */
    private static function article_types(): array { return array_values(array_unique(array_map('sanitize_key', (array) self::$c['article_types']))); }
    private static function td(): string { return (string) self::$c['text_domain']; }
}
