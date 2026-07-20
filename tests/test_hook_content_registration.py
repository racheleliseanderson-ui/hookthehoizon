from __future__ import annotations

import re
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
CANONICAL_PLUGIN = REPO_ROOT / "wordpress-plugin" / "hook-content" / "hook-content.php"
RETIRED_PLUGIN = REPO_ROOT / "content-plugin" / "hook-content.php"

PLUGIN_HEADER = "Plugin Name: Hook the Horizon Content"
EXPECTED_VERSION = "0.3.1"
EXPECTED_TEXT_DOMAIN = "hook-the-horizon-content"

# These identifiers must have one executable provider in the repository.
UNIQUE_REGISTRATIONS = {
    "post_type:hth_field_report": r"register_post_type\(\s*['\"]hth_field_report['\"]",
    "post_type:hth_gear_verdict": r"register_post_type\(\s*['\"]hth_gear_verdict['\"]",
    "taxonomy:hth_water_type": r"register_taxonomy\(\s*['\"]hth_water_type['\"]",
    "constant:HTH_CONTENT_VERSION": r"\bconst\s+HTH_CONTENT_VERSION\s*=",
    "option:hth_content_rewrite_version": r"['\"]hth_content_rewrite_version['\"]",
}


def php_files() -> list[Path]:
    excluded = {"vendor", "node_modules", ".git"}
    return [
        path
        for path in REPO_ROOT.rglob("*.php")
        if not any(part in excluded for part in path.parts)
    ]


def files_matching(pattern: str) -> list[Path]:
    regex = re.compile(pattern)
    matches: list[Path] = []
    for path in php_files():
        if regex.search(path.read_text(encoding="utf-8", errors="replace")):
            matches.append(path.relative_to(REPO_ROOT))
    return matches


class HookContentRegistrationGuard(unittest.TestCase):
    def test_canonical_plugin_exists_and_legacy_bootstrap_is_retired(self) -> None:
        self.assertTrue(CANONICAL_PLUGIN.is_file(), CANONICAL_PLUGIN)
        self.assertFalse(
            RETIRED_PLUGIN.exists(),
            "The legacy content-plugin/hook-content.php bootstrap must remain retired.",
        )

    def test_one_plugin_header_and_one_canonical_provider(self) -> None:
        header_files = files_matching(re.escape(PLUGIN_HEADER))
        self.assertEqual(
            header_files,
            [Path("wordpress-plugin/hook-content/hook-content.php")],
            f"Expected one canonical Hook Content plugin header, found: {header_files}",
        )

    def test_canonical_version_and_text_domain(self) -> None:
        source = CANONICAL_PLUGIN.read_text(encoding="utf-8")
        self.assertRegex(source, rf"Version:\s*{re.escape(EXPECTED_VERSION)}\b")
        self.assertRegex(
            source,
            rf"Text Domain:\s*{re.escape(EXPECTED_TEXT_DOMAIN)}\b",
        )
        self.assertRegex(
            source,
            rf"const\s+HTH_CONTENT_VERSION\s*=\s*['\"]{re.escape(EXPECTED_VERSION)}['\"]\s*;",
        )

    def test_unique_registration_providers(self) -> None:
        for label, pattern in UNIQUE_REGISTRATIONS.items():
            with self.subTest(registration=label):
                providers = files_matching(pattern)
                self.assertEqual(
                    providers,
                    [Path("wordpress-plugin/hook-content/hook-content.php")],
                    f"{label} must have exactly one provider; found: {providers}",
                )

    def test_release_authority_does_not_point_to_legacy_plugin(self) -> None:
        readme = (REPO_ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn(
            "`wordpress-plugin/hook-content/` — authoritative deployable content plugin",
            readme,
        )
        self.assertIn(
            "The release source is `wordpress-theme/` plus `wordpress-plugin/hook-content/`.",
            readme,
        )


if __name__ == "__main__":
    unittest.main()
