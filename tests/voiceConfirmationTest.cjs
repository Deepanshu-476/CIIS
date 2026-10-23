const testCases = [
  { text: "अहां जी कर दो complete, बना दो, create it, create कर दो,", expected: "confirm" },
  { text: "Buna do create karo.", expected: "confirm" },
  { text: "bana do", expected: "confirm" },
  { text: "create kardo", expected: "confirm" },
  { text: "crete it", expected: "confirm" },
  { text: "create it", expected: "confirm" },
  { text: "kar do create", expected: "confirm" },
  { text: "haan ji bana do", expected: "confirm" },
  { text: "bana do please", expected: "confirm" },
  { text: "haan", expected: "confirm" },
  { text: "yes", expected: "confirm" },
  { text: "theek hai", expected: "confirm" },
  { text: "bana dijiye", expected: "confirm" },
  { text: "क्रिएट कर दो", expected: "confirm" },
  { text: "हाँ बना दो", expected: "confirm" },
  { text: "priority high kar do", expected: "field_change" },
  { text: "due date kal shaam 5 baje kar do", expected: "field_change" },
  { text: "status in progress kar do", expected: "field_change" },
  { text: "due time 7 baaj kar 10 min ka karo", expected: "field_change" },
  { text: "7 bajkar 10 minute karo", expected: "field_change" },
  { text: "time 7:10 kar do", expected: "field_change" },
  { text: "nahi abhi nahi", expected: "refusal" },
  { text: "ruko changes karne hai", expected: "refusal" },
  { text: "cancel kar do", expected: "refusal" },
  { text: "mujhe kuch badalna hai", expected: "refusal" },
];

function classify(clean) {
  const lower = clean.toLowerCase();

  // 1. Refusal or general edit intent without specific values
  const isRefusalOrEdit = /(?:^|\P{L})(?:nahi|no|abhi\s*nahi|ruko|wait|cancel|rehne\s*do|chhod|rok\s*do|nahi\s*chahiye|change|changes|badal|badalna|edit|गलत|नहीं|मत|रुको|मत\s*करो|बदलो)(?:\P{L}|$)/iu.test(clean);
  // If specific field change is also mentioned (e.g. "due time change karo 7 baaj kar 10 min ka karo"), prioritize field_change over bare refusal
  const hasFieldChange = /(?:title|naam|नाम|description|विवरण|डिस्क्रिप्शन|priority|प्रायोरिटी|status|स्टेटस|due|kal|कल|aaj|आज|tomorrow|today|baje|बजे|baaj|baj|बज|time|samay|समय|date|tareekh|tarikh|तारीख|minute|min|मिनट|घंटा|hour|am|pm|subah|shaam|dopahar|raat|reminder|रिमाइंडर|checkpoints|चेकपॉइंट|assign|photo|file|low|high|medium|pending|in-progress|completed)/iu.test(clean);
  if (hasFieldChange) return "field_change";
  if (isRefusalOrEdit) return "refusal";

  // 3. Confirmation to create
  const isConfirmation = (
    // English & Hinglish create variations (including Whisper mishearings: "crete", "buna")
    /(?:^|\P{L})(?:create\s*it|create\s*this|create\s*now|create\s*task|create\s*kardo|create\s*kar\s*do|create\s*karo|create\s*kar|crete\s*it|crete\s*kardo|create|submit|confirm)(?:\P{L}|$)/iu.test(clean) ||
    // Hindi/Hinglish bana do / buna do variations
    /(?:^|\P{L})(?:bana\s*do|banao|bana\s*dijiye|bana\s*dena|buna\s*do|bana\s*dein|bana\s*karo)(?:\P{L}|$)/iu.test(clean) ||
    // Kar do variations (e.g., "kar do complete", "complete kar do", "kar do create")
    /(?:^|\P{L})(?:kar\s*do|kardo|kar\s*dijiye|karo|kar\s*dein|complete\s*kar\s*do|kar\s*do\s*complete)(?:\P{L}|$)/iu.test(clean) ||
    // Direct affirmations
    /(?:^|\P{L})(?:haan|ha|haanji|hnji|yes|yep|yeah|sure|ok|okay|done|theek\s*hai|thik\s*hai|sahi\s*hai|bilkul)(?:\P{L}|$)/iu.test(clean) ||
    // Devanagari explicit affirmation & creation patterns (tested without \b which breaks on Unicode)
    /(?:हाँ|हां|अहां|अहा|बना\s*दो|बनाओ|बना\s*दीजिए|बना\s*दें|कर\s*दो|कर\s*दीजिए|कर\s*दें|क्रिएट|क्रिएट\s*करो|क्रिएट\s*कर\s*दो|सबमिट|ठीक\s*है|सही\s*है|हांजी|हाँजी)/iu.test(clean)
  );

  if (isConfirmation) return "confirm";

  return "unhandled";
}

let passed = true;
testCases.forEach(({ text, expected }) => {
  const actual = classify(text);
  const ok = actual === expected;
  if (!ok) passed = false;
  console.log(`${ok ? '✅' : '❌'} "${text}" -> expected: ${expected}, got: ${actual}`);
});

console.log(passed ? "\nALL TESTS PASSED!" : "\nSOME TESTS FAILED!");
process.exit(passed ? 0 : 1);
