import os

# ---------------------------------------------------------
# [설정] 무시할 폴더 및 파일 목록
# ---------------------------------------------------------
IGNORE_DIRS = {
    "node_modules", ".next", ".git", ".vscode", "venv", 
    "__pycache__", "dist", "build", "coverage", ".idea"
}

# 분석에 필요한 파일 확장자만 포함 (이미지, 폰트 등 제외)
TARGET_EXTENSIONS = {
    ".py", ".ts", ".tsx", ".js", ".jsx", 
    ".css", ".html", ".sql", ".json", ".md", 
    ".txt", ".yml", ".yaml", ".toml"
}

# 굳이 분석 필요 없는 파일들 (패키지 락 파일 등)
IGNORE_FILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", 
    "poetry.lock", ".DS_Store", ".env", ".env.local"
}

OUTPUT_FILE = "boookntalk_full_source.txt"

def is_target_file(filename):
    """분석 대상 파일인지 확인"""
    if filename in IGNORE_FILES:
        return False
    _, ext = os.path.splitext(filename)
    return ext in TARGET_EXTENSIONS

def main():
    root_dir = os.getcwd() # 현재 폴더 기준
    
    print(f"📂 프로젝트 소스 코드 병합 시작... (위치: {root_dir})")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as outfile:
        # 프로젝트 구조(트리) 먼저 기록
        outfile.write("================================================================\n")
        outfile.write(f"PROJECT ROOT: {os.path.basename(root_dir)}\n")
        outfile.write("================================================================\n\n")
        
        for dirpath, dirnames, filenames in os.walk(root_dir):
            # 무시할 폴더 건너뛰기
            dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
            
            for filename in filenames:
                if is_target_file(filename):
                    file_path = os.path.join(dirpath, filename)
                    rel_path = os.path.relpath(file_path, root_dir)
                    
                    try:
                        with open(file_path, "r", encoding="utf-8") as infile:
                            content = infile.read()
                            
                            # 파일 구분자 및 내용 쓰기
                            outfile.write(f"\n\n{'='*60}\n")
                            outfile.write(f"FILE PATH: {rel_path}\n")
                            outfile.write(f"{'='*60}\n")
                            outfile.write(content)
                            outfile.write("\n")
                            
                            print(f"✅ 추가됨: {rel_path}")
                    except Exception as e:
                        print(f"⚠️ 읽기 실패 (건너뜀): {rel_path} - {e}")

    print(f"\n🎉 완료! '{OUTPUT_FILE}' 파일이 생성되었습니다.")
    print("이 파일을 AI에게 업로드하세요.")

if __name__ == "__main__":
    main()