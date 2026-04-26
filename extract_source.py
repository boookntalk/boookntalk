import os
from pathlib import Path

# ==========================================
# BoooknTalk Source Code Extractor
# ==========================================

# 추출할 대상 폴더 및 확장자 정의
TARGET_DIRECTORIES = {
    'backend': ['.py'],
    'frontend/src': ['.js', '.jsx', '.ts', '.tsx', '.css']
}

# 제외할 폴더 및 파일 (분석 노이즈 제거)
EXCLUDE_DIRS = ['__pycache__', 'node_modules', '.git', 'migrations', 'venv', '.venv']
EXCLUDE_FILES = ['__init__.py', 'package-lock.json', 'yarn.lock']

OUTPUT_FILE = 'boookntalk_source_export.txt'

def is_valid_file(filepath, allowed_extensions):
    """파일이 추출 대상인지 검사합니다."""
    path = Path(filepath)
    
    # 제외 폴더 검사
    if any(exclude in path.parts for exclude in EXCLUDE_DIRS):
        return False
        
    # 제외 파일 검사
    if path.name in EXCLUDE_FILES:
        return False
        
    # 확장자 검사
    if path.suffix not in allowed_extensions:
        return False
        
    return True

def extract_code():
    project_root = Path.cwd()
    total_files = 0
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        outfile.write("# ==========================================\n")
        outfile.write("# BoooknTalk Source Code Export\n")
        outfile.write("# ==========================================\n\n")
        
        for directory, extensions in TARGET_DIRECTORIES.items():
            target_path = project_root / directory
            
            if not target_path.exists():
                print(f"⚠️ 경고: '{directory}' 폴더를 찾을 수 없습니다.")
                continue
                
            for root, _, files in os.walk(target_path):
                for file in files:
                    filepath = Path(root) / file
                    
                    if is_valid_file(filepath, extensions):
                        relative_path = filepath.relative_to(project_root)
                        
                        try:
                            with open(filepath, 'r', encoding='utf-8') as infile:
                                content = infile.read()
                                
                            # 파일 구분자 작성 (AI가 파싱하기 좋은 구조)
                            outfile.write(f"\n{'='*80}\n")
                            outfile.write(f"File: {relative_path}\n")
                            outfile.write(f"{'='*80}\n\n")
                            outfile.write(content)
                            outfile.write("\n")
                            
                            total_files += 1
                            print(f"✅ 추출 완료: {relative_path}")
                            
                        except Exception as e:
                            print(f"❌ 읽기 오류 ({relative_path}): {e}")
                            
    print(f"\n🎉 총 {total_files}개의 파일이 '{OUTPUT_FILE}'에 성공적으로 병합되었습니다.")

if __name__ == "__main__":
    extract_code()