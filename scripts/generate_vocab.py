import urllib.request
import urllib.error
import json
import time
import os

api_key = "AQ.Ab8RN6J0X4L5c0o4gZl0wLZlEvHHXzag47HiCHiHD2IxNpgpCA"
MODELS = [
    "gemini-2.5-flash", 
    "gemini-2.5-flash-lite", 
    "gemini-2.0-flash", 
    "gemini-2.0-flash-lite", 
    "gemini-3.1-flash-lite", 
    "gemini-3.5-flash"
]
model_idx = 0

js_path = "/Users/voquy/Desktop/Web Tiếng Anh/js/vocabularyData.js"

def call_gemini(prompt):
    global model_idx
    
    for attempt in range(8):
        active_model = MODELS[(model_idx + attempt) % len(MODELS)]
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{active_model}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": prompt}]}
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.5
            }
        }
        
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=60) as response:
                res_json = json.loads(response.read().decode('utf-8'))
                text = res_json['candidates'][0]['content']['parts'][0]['text']
                model_idx = (model_idx + attempt) % len(MODELS)
                return json.loads(text)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                sleep_time = 15 * (attempt + 1)
                print(f"  Rate limit 429 on {active_model}. Trying another model in {sleep_time}s...", flush=True)
                time.sleep(sleep_time)
            elif e.code in [500, 503, 504]:
                print(f"  Service Error {e.code} on {active_model}. Trying another model in 8s...", flush=True)
                time.sleep(8)
            else:
                print(f"  HTTP Error {e.code}: {e.reason} on {active_model}. Trying another model in 5s...", flush=True)
                time.sleep(5)
        except Exception as e:
            print(f"  Error calling {active_model}: {e}. Trying another model in 5s...", flush=True)
            time.sleep(5)
    return None

levels = ["A1", "A2", "B1", "B2"]
themes = [
    "Family, Relationships & People",
    "Food, Cooking & Health",
    "Hobbies, Sports & Entertainment",
    "School, Study & Education",
    "Jobs, Work & Business",
    "Home, City & Daily Activities",
    "Travel, Tourism & Transport",
    "Nature, Animals & Environment",
    "Clothes, Shopping & Fashion",
    "Weather, Climate & Time"
]

all_vocab = []
seen_words = set()

print("Starting themed CEFR vocabulary generation...", flush=True)

for level in levels:
    print(f"\n=== Generating level {level} ===", flush=True)
    level_words = []
    
    # 1. Generate words for each of the 10 themes (target 15 words per theme)
    for theme_idx, theme in enumerate(themes):
        print(f"  Theme {theme_idx+1}/10: {theme}...", flush=True)
        exclude_str = ", ".join(list(seen_words)) if seen_words else "none"
        
        prompt = (
            f"Generate exactly 15 English vocabulary words for CEFR level {level} related to the theme: \"{theme}\".\n"
            f"The words must be grouped by word families (e.g. base word followed by its derivatives, such as nouns, verbs, adjectives, or adverbs).\n"
            f"All members of a word family must be adjacent in the list.\n"
            f"Ensure the words are strictly appropriate for CEFR level {level} and relevant to the theme.\n"
            f"Make sure that each example sentence contains the word in its exact form (no plurals, no past tense, no suffix changes) so it can be matched exactly.\n"
            f"For each word, return a JSON object with keys:\n"
            f"- \"word\": the English word (lowercase)\n"
            f"- \"ipa\": phonetic transcription (e.g. /ækt/)\n"
            f"- \"partOfSpeech\": the part of speech abbreviation (e.g. \"n\" for noun, \"v\" for verb, \"adj\" for adjective, \"adv\" for adverb, \"prep\" for preposition)\n"
            f"- \"translation\": Vietnamese translation\n"
            f"- \"example\": an English example sentence containing the word in its EXACT form\n"
            f"- \"exampleVi\": Vietnamese translation of the example sentence\n"
            f"- \"level\": \"{level}\"\n"
            f"- \"family\": the base word of the family (e.g. \"act\" for \"active\" and \"activity\")\n\n"
            f"Do NOT generate any of these already seen words: {exclude_str}.\n"
            f"Return a strict JSON list of objects. Output raw JSON only."
        )
        
        batch_data = call_gemini(prompt)
        if batch_data and isinstance(batch_data, list):
            added_in_batch = 0
            for item in batch_data:
                required_keys = ["word", "ipa", "partOfSpeech", "translation", "example", "exampleVi", "level", "family"]
                if not all(k in item for k in required_keys):
                    continue
                
                word_clean = item["word"].strip().lower()
                if word_clean not in seen_words:
                    seen_words.add(word_clean)
                    item["word"] = word_clean
                    item["family"] = item["family"].strip().lower()
                    level_words.append(item)
                    added_in_batch += 1
            
            print(f"    Added {added_in_batch} unique words. Total level words: {len(level_words)}/150", flush=True)
        else:
            print("    Failed to fetch batch data or response was invalid.", flush=True)
            
        time.sleep(12.0)
        
    # 2. Fill the gap if we are short of 150 words
    while len(level_words) < 150:
        gap = 150 - len(level_words)
        print(f"  Gap detected! Need {gap} more words for {level}. Requesting supplementary batch...", flush=True)
        exclude_str = ", ".join(list(seen_words)) if seen_words else "none"
        
        prompt = (
            f"Generate exactly {gap} English vocabulary words for CEFR level {level}.\n"
            f"The words must be grouped by word families (e.g. base word followed by its derivatives).\n"
            f"All members of a word family must be adjacent in the list.\n"
            f"Ensure the words are strictly appropriate for CEFR level {level}.\n"
            f"Make sure that each example sentence contains the word in its exact form.\n"
            f"For each word, return a JSON object with keys: word, ipa, partOfSpeech, translation, example, exampleVi, level, family.\n\n"
            f"Do NOT generate any of these already seen words: {exclude_str}.\n"
            f"Return a strict JSON list of objects. Output raw JSON only."
        )
        
        batch_data = call_gemini(prompt)
        if batch_data and isinstance(batch_data, list):
            added_in_batch = 0
            for item in batch_data:
                required_keys = ["word", "ipa", "partOfSpeech", "translation", "example", "exampleVi", "level", "family"]
                if not all(k in item for k in required_keys):
                    continue
                
                word_clean = item["word"].strip().lower()
                if word_clean not in seen_words:
                    seen_words.add(word_clean)
                    item["word"] = word_clean
                    item["family"] = item["family"].strip().lower()
                    level_words.append(item)
                    added_in_batch += 1
            
            print(f"    Added {added_in_batch} unique words. Total level words: {len(level_words)}/150", flush=True)
        else:
            print("    Failed to fetch supplementary batch data. Retrying...", flush=True)
            time.sleep(5.0)
            
        time.sleep(12.0)
        
    # If we have slightly MORE than 150 words (due to batch size logic or overlap), prune to exactly 150
    if len(level_words) > 150:
        print(f"  Level {level} has {len(level_words)} words. Pruning to exactly 150...", flush=True)
        # Remove excess words while keeping families together
        level_words = level_words[:150]
        # Rebuild seen_words to match pruned set
        seen_words = set([w["word"] for w in all_vocab] + [w["word"] for w in level_words])
    
    # Sort the level words to ensure word families are grouped together and base words are first
    family_groups = {}
    for w in level_words:
        fam = w["family"]
        if fam not in family_groups:
            family_groups[fam] = []
        family_groups[fam].append(w)
        
    sorted_level_words = []
    for fam in sorted(family_groups.keys()):
        group = family_groups[fam]
        def sort_key(item):
            w = item["word"]
            f = item["family"]
            is_base = (w == f)
            return (0 if is_base else 1, len(w), w)
            
        group.sort(key=sort_key)
        sorted_level_words.extend(group)
        
    all_vocab.extend(sorted_level_words)

# Double check
print(f"\nVerification: Total generated words = {len(all_vocab)}")
for lvl in levels:
    lvl_words = [w for w in all_vocab if w["level"] == lvl]
    print(f"  Level {lvl}: {len(lvl_words)} words")

# Write output file
js_content = f"// CEFR Graded Vocabulary Data for IELTS EnglishFree\n// Contains words classified by A1-B2 CEFR level and grouped by word family.\n\nconst VOCABULARY_DATA = {json.dumps(all_vocab, ensure_ascii=False, indent=2)};\n"
with open(js_path, 'w', encoding='utf-8') as out:
    out.write(js_content)

print(f"\nSuccessfully wrote {len(all_vocab)} words to {js_path}!", flush=True)
