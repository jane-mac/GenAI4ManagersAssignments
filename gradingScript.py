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
            while parts and parts[0] in app_name_roots:
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
                continue
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
            while parts and parts[0] in app_name_roots:
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
        ['npm', 'test'],
        cwd=project_dir,
        capture_output=True,
        text=True,
    )
    return result.stdout + result.stderr


def parse_vitest_output(output):
    """
    Parse vitest `run` output and return (passed, total, failed_names).
    Vitest prints lines like:
        Tests  45 passed (45)
        Tests  40 passed | 5 failed (45)
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
    for section in ('dependencies', 'devDependencies'):
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


def grade_app(app_name, zip_path, tmp_root):
    """
    Unzip the student's app, inject the grading test file, run tests.
    Returns (passed, total, log).
    """
    app_dir = os.path.join(tmp_root, app_name)
    os.makedirs(app_dir, exist_ok=True)

    try:
        project_dir = unzip(zip_path, app_dir)
    except Exception as e:
        return 0, 0, f'Unzip failed: {e}'

    src_dir = os.path.join(project_dir, 'src')
    if not os.path.isdir(src_dir):
        print("trying to repair flattened paths")
        repaired = fix_flattened_paths(project_dir)
        src_dir = os.path.join(project_dir, 'src')
        if not os.path.isdir(src_dir):
            return 0, 0, f'No src/ directory found after unzip (repaired {repaired} flattened paths)'
    
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
        app_name = 'dashboard'
        #for app_name in ('ecommerce', 'dashboard', 'game'):
        zip_files = [f for f in os.listdir(student_path)
                     if re.search(app_name, f, re.IGNORECASE) and f.endswith('.zip')]
        zip_path = os.path.join(student_path, zip_files[0]) if zip_files else os.path.join(student_path, f'{app_name}.zip')

        if not os.path.isfile(zip_path):
            print(f'  [{app_name}] MISSING zip — 0 pts')
            continue

        passed, total, failed_names, log = grade_app(app_name, zip_path, tmp_root)
        
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
