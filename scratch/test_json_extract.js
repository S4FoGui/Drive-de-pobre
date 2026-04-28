
function extractJson(text) {
  // Try to find an array first
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    let content = arrayMatch[0];
    // Try to parse. If it fails, maybe it's too greedy?
    while (content.length > 0) {
      try {
        return JSON.parse(content);
      } catch (e) {
        // Try to remove the last character and everything after the last ']'
        const lastIndex = content.lastIndexOf(']');
        if (lastIndex === -1) break;
        content = content.substring(0, lastIndex + 1);
        // If it's still failing, try to find the previous ']'
        content = content.substring(0, content.length - 1);
        const nextLastIndex = content.lastIndexOf(']');
        if (nextLastIndex === -1) break;
        content = content.substring(0, nextLastIndex + 1);
      }
    }
  }

  // Try to find an object
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    let content = objectMatch[0];
    while (content.length > 0) {
      try {
        return JSON.parse(content);
      } catch (e) {
        const lastIndex = content.lastIndexOf('}');
        if (lastIndex === -1) break;
        content = content.substring(0, lastIndex);
        const nextLastIndex = content.lastIndexOf('}');
        if (nextLastIndex === -1) break;
        content = content.substring(0, nextLastIndex + 1);
      }
    }
  }
  
  throw new Error("Could not extract valid JSON");
}

// Test cases
const t1 = 'Here is your JSON: { "action": "ADD" } I hope you like it! :)';
const t2 = 'Multiple: { "a": 1 } { "b": 2 }';
const t3 = 'Nested: { "a": { "b": 2 } } :)';

try { console.log("T1:", extractJson(t1)); } catch(e) { console.log("T1 Fail:", e.message); }
try { console.log("T2:", extractJson(t2)); } catch(e) { console.log("T2 Fail:", e.message); }
try { console.log("T3:", extractJson(t3)); } catch(e) { console.log("T3 Fail:", e.message); }
