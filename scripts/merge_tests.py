import os
import json

def merge_tests():
    scratch_dir = "/Users/voquy/.gemini/antigravity/brain/625a30aa-9dbd-4d38-81bf-b7029b6811b5/scratch"
    output_file = "/Users/voquy/Desktop/Web Tiếng Anh/js/readingData.js"
    
    tests = []
    for i in range(1, 11):
        file_path = os.path.join(scratch_dir, f"test_{i}.json")
        if not os.path.exists(file_path):
            print(f"Error: {file_path} does not exist!")
            return False
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                tests.append(data)
                print(f"Loaded Test {i} successfully.")
        except Exception as e:
            print(f"Error parsing Test {i} ({file_path}): {e}")
            return False
            
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("// IELTS Academic Reading Database - 10 Full Mock Tests\n")
            f.write("const READING_TESTS = ")
            json.dump(tests, f, ensure_ascii=False, indent=2)
            f.write(";\n")
        print(f"Successfully wrote {len(tests)} tests to {output_file}")
        return True
    except Exception as e:
        print(f"Error writing output file: {e}")
        return False

if __name__ == "__main__":
    merge_tests()
