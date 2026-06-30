export async function callAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const endpoint = 'https://text.pollinations.ai/';

  // 1. Try POST request (OpenAI GPT-4o-mini on Pollinations AI)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'openai'
      })
    });

    if (response.ok) {
      return await response.text();
    }
    console.warn(`POST request failed with status: ${response.status}. Retrying via GET...`);
  } catch (postErr) {
    console.warn("POST request network error, retrying via GET...", postErr);
  }

  // 2. Try GET request (fallback)
  const getUrl = `${endpoint}${encodeURIComponent(userPrompt)}?model=openai&system=${encodeURIComponent(systemPrompt)}`;

  try {
    const response = await fetch(getUrl);
    if (response.ok) {
      return await response.text();
    }
    console.warn(`GET fallback failed with status: ${response.status}. Trying final retry...`);
  } catch (getErr) {
    console.warn("GET fallback network error, trying final retry...", getErr);
  }

  // 3. Final Retry (Wait 1.2s and retry GET request once more)
  await new Promise(resolve => setTimeout(resolve, 1200));
  try {
    const response = await fetch(getUrl);
    if (response.ok) {
      return await response.text();
    }
    throw new Error(`Final GET status: ${response.status}`);
  } catch (finalErr) {
    console.error("AI API all attempts failed:", finalErr);
    return null;
  }
}

export default callAI;
