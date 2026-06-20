import os
import re
import csv
import json
import shutil
import subprocess
import zipfile
from datetime import datetime

# ── Config ────────────────────────────────────────────────────────────────────
BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
SUBMISSIONS_DIR = os.path.join(BASE_DIR, 'submissions')   # one subfolder per student
OUTPUT_CSV      = os.path.join(BASE_DIR, 'grades.csv')
DEBUG_RUNS_DIR  = os.path.join(BASE_DIR, 'grading-debug-runs')

# Root-level grading test files to inject into each student project
GRADING_FILES = {
    'ecommerce': os.path.join(BASE_DIR, 'ecommerce.grading.test.js'),
    'dashboard': os.path.join(BASE_DIR, 'dashboard.grading.test.js'),
    'game':      os.path.join(BASE_DIR, 'game.grading.test.js'),
}

TESTSUPPORT = os.path.join(BASE_DIR, 'testSetup.js')
PACKAGEDOTJSON = os.path.join(BASE_DIR, 'package.json')
VITECONFIG = os.path.join(BASE_DIR,'vite.config.js')

# ── Helpers ───────────────────────────────────────────────────────────────────

def unzip(zip_path, dest_dir):
    """Unzip zip_path into dest_dir, returning the top-level extracted folder."""
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(dest_dir)
    # If everything landed inside a single top-level folder, return that folder
    entries = os.listdir(dest_dir)
    if len(entries) == 1 and os.path.isdir(os.path.join(dest_dir, entries[0])):
        return os.path.join(dest_dir, entries[0])
    return dest_dir


def fix_flattened_paths(project_dir):
    """
    Repair "flattened" paths caused by some zippers.

    Symptom: extracted files/directories end up with backslashes in their *names*,
    e.g. "src\\main.jsx" instead of a real "src/main.jsx" path.
    """
    repaired = 0
    # Only repair app-source folders; avoid touching node_modules (it gets deleted/reinstalled).
    allowed_roots = {'src', 'public', 'tests', '__tests__'}
    app_name_roots = {'ecommerce', 'dashboard', 'game'}

    for root, dirs, files in os.walk(project_dir, topdown=False):
        for name in files:
            if name.startswith('node_modules'):
                try:
                    os.remove(os.path.join(root, name))
                except OSError:
                    pass
                continue
            if '\\' not in name:
                continue
            src_path = os.path.join(root, name)
            parts = [p for p in name.split('\\') if p and p != '.']
            while parts and any(app in parts[0].lower() for app in app_name_roots):
                parts = parts[1:]
            if not parts:
                continue
            if parts[0] == 'node_modules':
                try:
                    os.remove(src_path)
                except OSError:
                    pass
                continue
            if parts[0] not in allowed_roots:
                # Allow root-level files (e.g. package.json, index.html) to land
                # directly in the project root; skip anything else.
                if len(parts) != 1:
                    continue
                dest_path = os.path.join(project_dir, parts[0])
            else:
                dest_path = os.path.join(root, *parts)
            dest_parent = os.path.dirname(dest_path)
            if os.path.exists(dest_parent) and not os.path.isdir(dest_parent):
                continue
            os.makedirs(dest_parent, exist_ok=True)
            if os.path.abspath(src_path) != os.path.abspath(dest_path):
                shutil.move(src_path, dest_path)
                repaired += 1

        for name in dirs:
            if name.startswith('node_modules'):
                try:
                    shutil.rmtree(os.path.join(root, name))
                except OSError:
                    pass
                continue
            if '\\' not in name:
                continue
            src_path = os.path.join(root, name)
            parts = [p for p in name.split('\\') if p and p != '.']
            while parts and any(app in parts[0].lower() for app in app_name_roots):
                parts = parts[1:]
            if not parts:
                continue
            if parts[0] == 'node_modules':
                try:
                    shutil.rmtree(src_path)
                except OSError:
                    pass
                continue
            if parts[0] not in allowed_roots:
                continue
            dest_path = os.path.join(root, *parts)
            dest_parent = os.path.dirname(dest_path)
            if os.path.exists(dest_parent) and not os.path.isdir(dest_parent):
                continue
            os.makedirs(dest_parent, exist_ok=True)
            if os.path.abspath(src_path) != os.path.abspath(dest_path):
                shutil.move(src_path, dest_path)
                repaired += 1

        try:
            if root != project_dir and os.path.isdir(root) and not os.listdir(root):
                os.rmdir(root)
        except OSError:
            pass
            

    return repaired


def run_npm_test(project_dir):
    """
    Run `npm install` then `npm test` in project_dir.
    Returns the combined stdout+stderr string.
    """
    # Remove node_modules shipped in the zip — symlinks in .bin/ are broken
    # after zip/unzip and must be recreated by a fresh npm install.
    node_modules = os.path.join(project_dir, 'node_modules')
    if os.path.isdir(node_modules):
        shutil.rmtree(node_modules)
    subprocess.run(
        ['npm', 'install'],
        cwd=project_dir,
        capture_output=True,
    )
    result = subprocess.run(
        ['npx', 'vitest', 'run', 'grading.test'],
        cwd=project_dir,
        capture_output=True,
        text=True,
    )
    return result.stdout + result.stderr


def parse_vitest_output(output):
    """
    Parse vitest `run` output and return (passed, total, failed_names).
    Vitest prints lines like:
        Test Files  1 failed | 3 passed (4)
        Tests  2 failed | 57 passed (59)
    Failed test names appear as lines with a leading × character.
    """
    passed = 0
    failed = 0

    # Look for the summary "Tests" line.
    # Vitest formats vary: "45 passed (45)" or "5 failed | 40 passed (45)"
    match = re.search(r'Tests\s+(.*)', output)
    if match:
        summary = match.group(1)
        m_passed = re.search(r'(\d+)\s+passed', summary)
        m_failed = re.search(r'(\d+)\s+failed', summary)
        passed = int(m_passed.group(1)) if m_passed else 0
        failed = int(m_failed.group(1)) if m_failed else 0

    total = passed + failed

    # Extract failed test names — vitest marks them with × (U+00D7)
    failed_names = re.findall(r'[×✗]\s+(.+?)(?:\s+\d+ms\s*$|\s*$)', output, re.MULTILINE)
    failed_names = [n.strip() for n in failed_names if n.strip()]

    # Vitest reports unhandled errors (TypeError, AssertionError, etc.) separately
    # from test failures, with the associated test name on a line like:
    #   The latest test that might've caused the error is "test name here".
    # These tests are counted as passed in the summary but should be failures.
    error_test_names = re.findall(
        r"The latest test that might've caused the error is \"(.+?)\"",
        output
    )
    for name in error_test_names:
        name = name.strip()
        if name and name not in failed_names:
            failed_names.append(name)
            failed += 1
            if passed > 0:
                passed -= 1

    total = passed + failed
    return passed, total, failed_names

def copy_support_files(project_dir, src_dir):
    # Merge package.json: add any dependencies missing from the student's copy
    packageJson_dest = os.path.join(project_dir, 'package.json')
    with open(PACKAGEDOTJSON, 'r') as f:
        base_pkg = json.load(f)
    if os.path.isfile(packageJson_dest):
        with open(packageJson_dest, 'r') as f:
            student_pkg = json.load(f)
    else:
        student_pkg = {}
    for section in ('dependencies', 'devDependencies', 'scripts'):
        base_section = base_pkg.get(section, {})
        if base_section:
            student_section = student_pkg.setdefault(section, {})
            for pkg, version in base_section.items():
                if pkg not in student_section:
                    student_section[pkg] = version
    with open(packageJson_dest, 'w') as f:
        json.dump(student_pkg, f, indent=2)

    viteConfigSrc = VITECONFIG
    vite_dest = os.path.join(project_dir, os.path.basename(viteConfigSrc))
    shutil.copy(viteConfigSrc, vite_dest)
    
    
    testSupport = TESTSUPPORT
    testSupport_dest = os.path.join(src_dir, os.path.basename(testSupport))
    shutil.copy(testSupport, testSupport_dest)
    return


def find_project_root(base_dir):
    """
    Walk down through nested single-child directories until we find one
    containing a src/ folder. Handles cases like dashboard/dashboard/dashboard/src/.
    Returns the directory containing src/, or None if not found.
    """
    current = base_dir
    visited = set()
    while True:
        real = os.path.realpath(current)
        if real in visited:
            break
        visited.add(real)
        if os.path.isdir(os.path.join(current, 'src')):
            return current
        # Descend only if there's exactly one subdirectory child (ignoring system/hidden dirs)
        try:
            children = [
                e for e in os.listdir(current)
                if os.path.isdir(os.path.join(current, e))
                and e != '__MACOSX'
                and not e.startswith('.')
            ]
        except OSError:
            break
        if len(children) == 1:
            current = os.path.join(current, children[0])
        else:
            break
    return None


def grade_app(app_name, source, tmp_root):
    """
    Grade a student's app. source may be a zip file or an unzipped directory.
    Returns (passed, total, failed_names, log).
    """
    app_dir = os.path.join(tmp_root, app_name)
    os.makedirs(app_dir, exist_ok=True)

    try:
        if os.path.isdir(source):
            project_dir = os.path.join(app_dir, app_name)
            shutil.copytree(source, project_dir)
        else:
            project_dir = unzip(source, app_dir)
    except Exception as e:
        return 0, 0, [], f'Setup failed: {e}'

    src_dir = os.path.join(project_dir, 'src')
    if not os.path.isdir(src_dir):
        print("trying to repair flattened paths")
        repaired = fix_flattened_paths(project_dir)
        # Re-check after flattened-path repair
        src_dir = os.path.join(project_dir, 'src')
        if not os.path.isdir(src_dir):
            # Try walking down nested single-child folders
            deeper = find_project_root(project_dir)
            if deeper:
                print(f"  found project root at deeper path: {os.path.relpath(deeper, app_dir)}")
                project_dir = deeper
                src_dir = os.path.join(project_dir, 'src')
            else:
                # Last resort: flat structure — source files live directly in project_dir (no src/)
                flat_source_files = [
                    f for f in os.listdir(project_dir)
                    if os.path.isfile(os.path.join(project_dir, f))
                    and f.endswith(('.jsx', '.js'))
                    and f not in ('vite.config.js', 'vitest.config.js')
                ]
                if flat_source_files:
                    src_dir = project_dir
                    print(f'  Flat structure detected — using project root as src dir')
                else:
                    return 0, 0, [], f'No src/ directory found after unzip (repaired {repaired} flattened paths)'
    
    copy_support_files(project_dir, src_dir)

    # Copy the hidden grading test into the student's src/
    grading_src = GRADING_FILES[app_name]
    grading_dest = os.path.join(src_dir, os.path.basename(grading_src))
    shutil.copy2(grading_src, grading_dest)
    
    output = run_npm_test(project_dir)
    passed, total, failed_names = parse_vitest_output(output)
    return passed, total, failed_names, output


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    student_grades = []

    student_dirs = sorted([
        d for d in os.listdir(SUBMISSIONS_DIR)
        if os.path.isdir(os.path.join(SUBMISSIONS_DIR, d))
    ])

    run_stamp = datetime.now().strftime('%Y%m%d-%H%M%S')

    for student_name in student_dirs:
        student_path = os.path.join(SUBMISSIONS_DIR, student_name)
        print(f'\n{"="*60}')
        print(f'Grading: {student_name}')

        total_passed = 0
        total_tests  = 0
        all_failed_names = []

        tmp_root = os.path.join(DEBUG_RUNS_DIR, run_stamp, student_name)
        os.makedirs(tmp_root, exist_ok=True)

        # Peel away wrapper layers until app-matching content is visible.
        # Each iteration handles one layer: a lone zip is unwrapped, a lone
        # subfolder is entered.  Stops as soon as any app-named zip or folder
        # is directly visible, or when no further descent is possible.
        _JUNK = {'__macosx', '.ds_store', 'thumbs.db', 'desktop.ini'}
        for _layer in range(6):
            entries = [f for f in os.listdir(student_path) if f.lower() not in _JUNK]
            app_content = [
                f for f in entries
                if any(re.search(app, f, re.IGNORECASE) for app in ('ecommerce', 'dashboard', 'game'))
                and (f.endswith('.zip') or os.path.isdir(os.path.join(student_path, f)))
            ]
            if app_content:
                break
            zips = [f for f in entries if f.endswith('.zip')]
            dirs = [f for f in entries if os.path.isdir(os.path.join(student_path, f))]
            if len(zips) == 1 and not dirs:
                outer_zip = os.path.join(student_path, zips[0])
                unwrap_dir = os.path.join(tmp_root, f'_unwrap_{_layer}')
                os.makedirs(unwrap_dir, exist_ok=True)
                try:
                    student_path = unzip(outer_zip, unwrap_dir)
                    print(f'  Unwrapped outer zip → {student_path}')
                except Exception as e:
                    print(f'  Failed to unwrap outer zip: {e}')
                    break
            elif len(dirs) == 1 and not zips:
                student_path = os.path.join(student_path, dirs[0])
                print(f'  Entered subfolder → {student_path}')
            elif len(dirs) == 1 and len(zips) == 1:
                # Both a zip and a same-name extracted folder exist — use the folder.
                zip_base = os.path.splitext(zips[0])[0]
                if dirs[0] == zip_base:
                    student_path = os.path.join(student_path, dirs[0])
                    print(f'  Entered subfolder (already-extracted zip) → {student_path}')
                else:
                    # Different names — unwrap the zip
                    outer_zip = os.path.join(student_path, zips[0])
                    unwrap_dir = os.path.join(tmp_root, f'_unwrap_{_layer}')
                    os.makedirs(unwrap_dir, exist_ok=True)
                    try:
                        student_path = unzip(outer_zip, unwrap_dir)
                        print(f'  Unwrapped outer zip (mixed dir+zip) → {student_path}')
                    except Exception as e:
                        print(f'  Failed to unwrap outer zip: {e}')
                        break
            else:
                break
        # Build source map: first pass matches each app by name, second pass
        # assigns any leftover unclaimed zips to apps with no source (handles
        # zips like "catalog-runner-source.zip" that don't contain the app name).
        _all_zips = [f for f in os.listdir(student_path) if f.endswith('.zip')]
        _all_dirs = [
            f for f in os.listdir(student_path)
            if os.path.isdir(os.path.join(student_path, f))
            and f.lower() not in _JUNK
        ]
        _claimed_zips, _claimed_dirs = set(), set()
        source_map = {}
        for _app in ('ecommerce', 'dashboard', 'game'):
            zm = [f for f in _all_zips if re.search(_app, f, re.IGNORECASE) and f not in _claimed_zips]
            if zm:
                source_map[_app] = os.path.join(student_path, zm[0])
                _claimed_zips.add(zm[0])
                continue
            dm = [f for f in _all_dirs if re.search(_app, f, re.IGNORECASE) and f not in _claimed_dirs]
            if dm:
                source_map[_app] = os.path.join(student_path, dm[0])
                _claimed_dirs.add(dm[0])
        # Assign unclaimed zips to apps that still have no source
        _unclaimed = [f for f in _all_zips if f not in _claimed_zips]
        for _app in ('ecommerce', 'dashboard', 'game'):
            if _app not in source_map and _unclaimed:
                source_map[_app] = os.path.join(student_path, _unclaimed.pop(0))
                print(f'  [{_app}] no name match — assigned unclaimed zip')

        for app_name in ('ecommerce', 'dashboard', 'game'):
            source = source_map.get(app_name)
            if not source or not os.path.exists(source):
                print(f'  [{app_name}] MISSING — 0 pts')
                continue

            passed, total, failed_names, log = grade_app(app_name, source, tmp_root)
           
            print(f'  [{app_name}] {passed}/{total} tests passed')
            if failed_names:
                for name in failed_names:
                    print(f'    FAILED: {name}')
                all_failed_names.extend([f'[{app_name}] {name}' for name in failed_names])
                
            print(log)
            total_passed += passed
            total_tests  += total
        

        print(f'  TOTAL: {total_passed}/{total_tests}')

        student_grades.append({
            'student':       student_name,
            'passed':        total_passed,
            'total':         total_tests,
            'failed_tests':  '; '.join(all_failed_names),
        })
    

    # ── Write CSV ─────────────────────────────────────────────────────────────
    with open(OUTPUT_CSV, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['student', 'passed', 'total', 'failed_tests'])
        writer.writeheader()
        writer.writerows(student_grades)

    print(f'\nGrades written to {OUTPUT_CSV}')


if __name__ == '__main__':
    main()
