/**
 * A small, transparent keyword rule set. This is deliberately simple and is
 * NOT intelligent moderation: it flags obvious insults and attempts to move a
 * conversation off-platform so a human moderator can take a look.
 */
export interface ModerationRule {
  id: string;
  label: string;
  description: string;
  pattern: RegExp;
}

export const MODERATION_RULES: ModerationRule[] = [
  {
    id: "insult",
    label: "Insulting language",
    description: "Common insults such as “idiot”, “stupid” or “loser”.",
    pattern: /\b(idiot|stupid|loser|shut up|pathetic)\b/i,
  },
  {
    id: "off_platform",
    label: "Off-platform contact",
    description: "Sharing a phone number or asking to move the conversation somewhere unsupervised.",
    pattern: /(\b\d{3}[-.\s]\d{4}\b|\btext me\b|\bsnap me\b|\bdm me on\b|\badd me on\b)/i,
  },
];

export function matchRules(text: string): { rule: ModerationRule; matched: string } | null {
  for (const rule of MODERATION_RULES) {
    const m = text.match(rule.pattern);
    if (m) return { rule, matched: m[0] };
  }
  return null;
}
