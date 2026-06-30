import os
import glob
import shutil
import json

def gather_and_merge():
    # Base directories
    brain_dir = "/Users/voquy/.gemini/antigravity/brain"
    my_id = "625a30aa-9dbd-4d38-81bf-b7029b6811b5"
    my_scratch_dir = os.path.join(brain_dir, my_id, "scratch")
    output_file = "/Users/voquy/Desktop/Web Tiếng Anh/js/readingData.js"
    
    os.makedirs(my_scratch_dir, exist_ok=True)
    
    # 1. Search for test_*.json files in all subfolders of the brain directory
    search_pattern = os.path.join(brain_dir, "*", "scratch", "test_*.json")
    found_files = glob.glob(search_pattern)
    
    print(f"Found {len(found_files)} test JSON files in brain directory.")
    
    # 2. Copy them to our scratch directory
    for src in found_files:
        filename = os.path.basename(src)
        dst = os.path.join(my_scratch_dir, filename)
        # Avoid copying to itself unless it's from another directory
        if os.path.abspath(src) != os.path.abspath(dst):
            try:
                shutil.copy(src, dst)
                print(f"Copied {src} -> {dst}")
            except Exception as e:
                print(f"Error copying {src}: {e}")
                
    # 3. Read and merge tests 1 to 10
    tests = []
    missing = []
    for i in range(1, 11):
        file_path = os.path.join(my_scratch_dir, f"test_{i}.json")
        if not os.path.exists(file_path):
            missing.append(i)
            continue
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
                # Normalize keys: some subagents might output 'test_id' instead of 'id' or different case
                # We will standardize it to ensure frontend compatibility
                test_id = f"test-{i}"
                title = data.get("title", f"IELTS Reading Academic Practice Test {i}")
                passages = data.get("passages", [])
                
                normalized_passages = []
                for p_idx, p in enumerate(passages):
                    p_title = p.get("title", f"Passage {p_idx + 1}")
                    p_text = p.get("text", "")
                    
                    groups = p.get("groups", [])
                    normalized_groups = []
                    for g in groups:
                        g_instruction = g.get("instruction", "")
                        g_type = g.get("type", "gapfill")
                        
                        questions = g.get("questions", [])
                        normalized_questions = []
                        for q in questions:
                            q_num = int(q.get("number", 0))
                            q_type = q.get("type", "gapfill")
                            q_text = q.get("text", "")
                            q_options = q.get("options")
                            q_answer = str(q.get("answer", "")).strip()
                            q_explanation = q.get("explanation", "")
                            q_location = q.get("location", "")
                            
                            normalized_questions.append({
                                "number": q_num,
                                "type": q_type,
                                "text": q_text,
                                "options": q_options,
                                "answer": q_answer,
                                "explanation": q_explanation,
                                "location": q_location
                            })
                            
                        normalized_groups.append({
                            "instruction": g_instruction,
                            "type": g_type,
                            "questions": normalized_questions
                        })
                        
                    normalized_passages.append({
                        "title": p_title,
                        "text": p_text,
                        "groups": normalized_groups
                    })
                    
                normalized_test = {
                    "id": test_id,
                    "title": title,
                    "passages": normalized_passages
                }
                
                tests.append(normalized_test)
                print(f"Standardized Test {i} successfully.")
        except Exception as e:
            print(f"Error parsing Test {i}: {e}")
            
    if missing:
        print(f"Warning: Missing tests {missing}")
        return False
        
    try:
        # Sort tests by id number
        tests.sort(key=lambda x: int(x["id"].split("-")[1]))
        
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("// IELTS Academic Reading Database - 10 Full Mock Tests\n")
            f.write("const READING_TESTS = ")
            json.dump(tests, f, ensure_ascii=False, indent=2)
            f.write(";\n")
        print(f"Successfully merged {len(tests)} tests to {output_file}")
        return True
    except Exception as e:
        print(f"Error writing combined file: {e}")
        return False

if __name__ == "__main__":
    gather_and_merge()
