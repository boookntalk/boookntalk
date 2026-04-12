# 경로: export_code1.py
# 역할: BoooknTalk 프로젝트의 불필요한 소스 코드를 제외하고 backend 및 frontend의 지정된 핵심 폴더 내의 파일만 타겟팅하여 소스 코드를 추출하는 스크립트

import os

# ---------------------------------------------------------
# [설정] 무시할 폴더 및 파일 목록
# ---------------------------------------------------------
IGNORE_DIRS = {
    "node_modules", ".next", ".git", ".vscode", "venv", 
    "__pycache__", "dist", "build", "coverage", ".idea"
}

# 분석에 필요한 코드 파일 확장자
TARGET_EXTENSIONS = {
    ".py", ".ts", ".tsx", ".js", ".jsx", 
    ".css", ".html", ".sql", ".json", ".md", 
    ".yml", ".yaml", ".toml"
}

# 텍스트 파일 중 명시적으로 포함할 파일만
ALLOWED_TXT_FILES = {
    "requirements.txt", "기획.txt", "README.txt"
}

# 기존 전체 파일과 구분하기 위해 출력 파일명 변경
OUTPUT_FILE = "boookntalk_filtered_source.txt"

# 절대 읽지 말아야 할 파일들
IGNORE_FILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", 
    "poetry.lock", ".DS_Store", ".env", ".env.local", 
    OUTPUT_FILE, "boookntalk_full_source.txt", "a.txt"
}

# 함수: is_target_file
# 기능: 파일 이름과 확장자를 검사하여 코드 분석 대상에 포함될 파일인지 여부를 판단하여 반환합니다.
def is_target_file(filename):
    if filename in IGNORE_FILES:
        return False
    
    if filename.endswith(".txt"):
        return filename in ALLOWED_TXT_FILES
        
    _, ext = os.path.splitext(filename)
    return ext in TARGET_EXTENSIONS

# 함수: is_target_directory
# 기능: 탐색 중인 현재 폴더 경로가 backend, frontend 내의 지정된 핵심 대상 폴더인지 필터링하여 판별합니다.
def is_target_directory(rel_dir):
    if rel_dir == ".":
        return False
        
    # Windows 환경 등을 고려하여 슬래시 통일
    normalized = rel_dir.replace("\\", "/")
    
    # 1. 하위 폴더를 제외하고 정확히 해당 폴더 내의 파일만 포함하는 타겟
    exact_targets = ["backend", "frontend"]
    if normalized in exact_targets:
        return True
        
    # 2. 해당 폴더 및 하위 폴더의 모든 파일을 포함하는 타겟
    recursive_targets = [
        "backend/routers", 
        "backend/services", 
        "backend/utils", 
        "frontend/src"
    ]
    for target in recursive_targets:
        if normalized == target or normalized.startswith(target + "/"):
            return True
            
    return False

# 함수: generate_tree
# 기능: 프로젝트 구조를 트리 형태로 반환하며, 설정에 따라 불필요한 폴더를 화면에 출력하지 않도록 제외합니다.
def generate_tree(dir_path, prefix=""):
    tree_str = ""
    try:
        entries = sorted(os.listdir(dir_path))
    except PermissionError:
        return ""
    
    entries = [e for e in entries if e not in IGNORE_DIRS and e not in IGNORE_FILES]
    
    for i, entry in enumerate(entries):
        path = os.path.join(dir_path, entry)
        is_last = (i == len(entries) - 1)
        connector = "└── " if is_last else "├── "
        tree_str += f"{prefix}{connector}{entry}\n"
        
        if os.path.isdir(path):
            extension = "    " if is_last else "│   "
            tree_str += generate_tree(path, prefix=prefix + extension)
    return tree_str

# 함수: main
# 기능: BoooknTalk 소스 코드를 순회하며 타겟 디렉토리 내의 허용된 확장자 파일만을 읽어 단일 텍스트 파일로 병합 및 추출합니다.
def main():
    root_dir = os.getcwd()
    
    print(f"📂 BoooknTalk 소스 코드 타겟 추출 시작... (위치: {root_dir})")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8", errors="ignore") as outfile:
        outfile.write("================================================================\n")
        outfile.write(f"PROJECT ROOT: {os.path.basename(root_dir)}\n")
        outfile.write("================================================================\n\n")
        
        outfile.write("📚 [PROJECT DIRECTORY TREE]\n")
        outfile.write(generate_tree(root_dir))
        outfile.write("\n================================================================\n\n")
        
        for dirpath, dirnames, filenames in os.walk(root_dir):
            # 탐색에서 제외할 폴더를 제거하여 불필요한 하위 탐색 방지
            dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
            
            rel_dir = os.path.relpath(dirpath, root_dir)
            
            # 지정된 타겟 경로에 속하지 않는 폴더의 파일들은 읽지 않고 건너뜀
            if not is_target_directory(rel_dir):
                continue
                
            for filename in filenames:
                if is_target_file(filename):
                    file_path = os.path.join(dirpath, filename)
                    rel_path = os.path.relpath(file_path, root_dir)
                    
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as infile:
                            content = infile.read()
                            
                            outfile.write(f"\n\n{'='*60}\n")
                            outfile.write(f"FILE PATH: {rel_path}\n")
                            outfile.write(f"{'='*60}\n")
                            outfile.write(content)
                            outfile.write("\n")
                            
                            print(f"✅ 추출됨: {rel_path}")
                    except Exception as e:
                        print(f"⚠️ 읽기 실패 (건너뜀): {rel_path} - {e}")

    print(f"\n🎉 타겟 코드 추출 완료! '{OUTPUT_FILE}' 파일이 생성되었습니다.")

if __name__ == "__main__":
    main()