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

# 텍스트 파일 중 명시적으로 포함할 파일만 (로그 파일 난입 방지용)
ALLOWED_TXT_FILES = {
    "requirements.txt", "기획.txt", "README.txt"
}

OUTPUT_FILE = "boookntalk_full_source.txt"

# 절대 읽지 말아야 할 파일들
IGNORE_FILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", 
    "poetry.lock", ".DS_Store", ".env", ".env.local", 
    OUTPUT_FILE, "a.txt"
}

def is_target_file(filename):
    """분석 대상 파일인지 아주 깐깐하게 확인"""
    if filename in IGNORE_FILES:
        return False
    
    # txt 파일은 허가된 목록만 통과
    if filename.endswith(".txt"):
        return filename in ALLOWED_TXT_FILES
        
    _, ext = os.path.splitext(filename)
    return ext in TARGET_EXTENSIONS

def generate_tree(dir_path, prefix=""):
    """프로젝트 구조를 예쁘게 트리 형태로 반환 (무시 폴더 완벽 제외)"""
    tree_str = ""
    try:
        entries = sorted(os.listdir(dir_path))
    except PermissionError:
        return ""
    
    # 무시할 폴더 및 파일 걷어내기
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

def main():
    root_dir = os.getcwd()
    
    print(f"📂 BoooknTalk 소스 코드 병합 시작... (위치: {root_dir})")
    
    # errors="ignore"를 추가하여 인코딩 에러로 스크립트가 뻗는 것을 방지
    with open(OUTPUT_FILE, "w", encoding="utf-8", errors="ignore") as outfile:
        outfile.write("================================================================\n")
        outfile.write(f"PROJECT ROOT: {os.path.basename(root_dir)}\n")
        outfile.write("================================================================\n\n")
        
        # [NEW] 파일 목록 자동 트리 생성 탑재
        outfile.write("📚 [PROJECT DIRECTORY TREE]\n")
        outfile.write(generate_tree(root_dir))
        outfile.write("\n================================================================\n\n")
        
        for dirpath, dirnames, filenames in os.walk(root_dir):
            # 무시할 폴더 건너뛰기
            dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
            
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

    print(f"\n🎉 엑기스 추출 완료! '{OUTPUT_FILE}' 파일이 깔끔하게 생성되었습니다.")

if __name__ == "__main__":
    main()