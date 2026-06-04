import re

# This is a simple rule-based AI priority suggester
# It reads the task title and returns High / Medium / Low
# No internet or API key needed — works offline instantly

HIGH_KEYWORDS = ["urgent", "critical", "asap", "immediately", "deadline", "emergency", "important", "fix", "bug", "broken"]
LOW_KEYWORDS  = ["someday", "maybe", "optional", "eventually", "nice to have", "explore", "read", "review"]

def suggest_priority(title: str) -> str:
    text = title.lower()
    for word in HIGH_KEYWORDS:
        if word in text:
            return "high"
    for word in LOW_KEYWORDS:
        if word in text:
            return "low"
    return "medium"

def suggest_duration(title: str) -> int:
    # Estimate minutes based on task length/type
    text = title.lower()
    if any(w in text for w in ["meeting", "call", "interview", "review"]):
        return 60
    if any(w in text for w in ["write", "report", "design", "plan"]):
        return 90
    if any(w in text for w in ["email", "reply", "check", "read"]):
        return 15
    return 30  # default