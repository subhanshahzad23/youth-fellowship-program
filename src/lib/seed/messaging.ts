import type { Conversation, Message, MessageReport } from "@/lib/domain/types";
import { ago } from "@/lib/clock";

/*
 * Synthetic, safe conversations. One clearly fictional flagged example
 * (cv_jamal_ryan) and one historical moderation action (cv_leo_kai).
 */

type Line = [senderId: string, body: string, daysAgo: number, hoursAgo?: number, extra?: Partial<Message>];

interface ThreadSeed {
  id: string;
  kind: Conversation["kind"];
  cohortId: string;
  participants: string[];
  title?: string;
  createdBy: string;
  /** users who have NOT read the last N messages: [userId, unreadCount] */
  unread?: [string, number][];
  lines: Line[];
}

const THREADS: ThreadSeed[] = [
  {
    id: "cv_daniel_noah",
    kind: "mentor",
    cohortId: "c_summer26",
    participants: ["u_daniel", "u_noah"],
    createdBy: "u_daniel",
    unread: [["u_noah", 2]],
    lines: [
      ["u_daniel", "Hi Noah — Daniel here, your mentor for the fellowship. I read your Porchlight Repair summary. Love that it started on your actual porch. What's the one thing you most want to figure out this month?", 38, 4],
      ["u_noah", "Hi Daniel! Honestly whether people would come to a repair café at the community hall, or if it only works because they know me on my street.", 38, 1],
      ["u_daniel", "Great question to test before you book anything. Could you run one pop-up on a different street and count who shows up that you don't know?", 37, 20],
      ["u_noah", "Yes. The tenants association on Rope Walk said I could use their courtyard on the 19th.", 30, 5],
      ["u_noah", "Update: 14 people came, 9 of them strangers. We fixed 6 lamps, 2 kettles and a bike chain.", 11, 3, { attachments: [{ id: "att_noah_popup", name: "popup-tally-sheet.pdf", mime: "application/pdf", size: 18432, sampleUrl: "/samples/attachments/popup-tally-sheet.pdf" }] }],
      ["u_daniel", "Nine strangers is a real signal. Did anyone ask when the next one is?", 11, 1],
      ["u_noah", "Four people asked. One offered to lend us a soldering station.", 10, 22],
      ["u_daniel", "Before our call on Tuesday, write down what it cost you to run it — hall, snacks, parts, your time. Even rough numbers.", 1, 6],
      ["u_daniel", "Also: Elena mentioned your interview notes are due Friday. Happy to look at a draft if you want a second pair of eyes before you submit.", 0, 18],
    ],
  },
  {
    id: "cv_noah_aisha",
    kind: "direct",
    cohortId: "c_summer26",
    participants: ["u_noah", "u_aisha"],
    createdBy: "u_aisha",
    lines: [
      ["u_aisha", "Noah! Are you doing the customer interviews assignment on paper or recording them?", 6, 9],
      ["u_noah", "Notes on paper, then I type them up the same night. Recording made people stiff.", 6, 7],
      ["u_aisha", "Same experience. Want to swap notes on how we're asking about price? I keep leading the witness.", 6, 6],
      ["u_noah", "Yes please. I've started asking \"what did you do last time it broke?\" instead of \"would you pay for this?\"", 5, 20],
      ["u_aisha", "That's so much better. Stealing it.", 5, 19, { reactions: { "🙌": ["u_noah"] } }],
    ],
  },
  {
    id: "cv_elena_noah",
    kind: "direct",
    cohortId: "c_summer26",
    participants: ["u_elena", "u_noah"],
    createdBy: "u_elena",
    lines: [
      ["u_elena", "Noah, great work on the problem statement assignment — I left feedback on it. The part about renters not owning tools was sharp.", 16, 3],
      ["u_noah", "Thank you! Should my interviews focus only on renters or older neighbors too?", 16, 1],
      ["u_elena", "Start with renters — that's your sharpest segment. Interview one or two older neighbors as a contrast so you can see if the problem is different for them.", 15, 22],
    ],
  },
  {
    id: "cv_foundations_circle",
    kind: "group",
    cohortId: "c_summer26",
    participants: ["u_elena", "u_noah", "u_aisha", "u_diego", "u_lily"],
    title: "Foundations circle · Summer 2026",
    createdBy: "u_elena",
    unread: [["u_noah", 1], ["u_diego", 1]],
    lines: [
      ["u_elena", "Welcome to the Foundations circle for Summer 2026. Use this space to share interview wins, stuck moments and useful questions.", 70, 2],
      ["u_lily", "Interview tip from this week: ask people to show you, not tell you. One neighbor walked me to where she keeps the dog leads and it explained everything.", 9, 4],
      ["u_diego", "Has anyone found a good way to get 15-minute calls with busy shop owners?", 3, 2],
      ["u_aisha", "Go in at 10am on a weekday, bring a one-page summary, ask for 10 minutes not 15.", 3, 1],
      ["u_elena", "Reminder: office hours are Thursday 5–6pm. Bring one interview transcript and we'll practice finding the insight together.", 0, 20],
    ],
  },
  {
    id: "cv_daniel_diego",
    kind: "mentor",
    cohortId: "c_summer26",
    participants: ["u_daniel", "u_diego"],
    createdBy: "u_daniel",
    unread: [["u_daniel", 1]],
    lines: [
      ["u_daniel", "Diego, how did the conversation with the optometrist go?", 4, 5],
      ["u_diego", "She said she'd consider a discount for Fresh Frames customers if we send at least 10 a month. Is that a good deal?", 0, 3],
    ],
  },
  {
    id: "cv_daniel_lily",
    kind: "mentor",
    cohortId: "c_summer26",
    participants: ["u_daniel", "u_lily"],
    createdBy: "u_daniel",
    lines: [
      ["u_daniel", "Lily — twelve regular walks a week is excellent. How are you handling cancellations?", 8, 6],
      ["u_lily", "Right now by text through the parents. It's getting messy.", 8, 2],
      ["u_daniel", "Let's sketch a simple cancellation policy together on Thursday. Bring your last month's bookings.", 7, 23],
    ],
  },
  {
    id: "cv_grace_aisha",
    kind: "mentor",
    cohortId: "c_summer26",
    participants: ["u_grace", "u_aisha"],
    createdBy: "u_grace",
    lines: [
      ["u_grace", "Aisha, the StudyNook floor plan sketch is lovely. Which room are you testing first?", 12, 4],
      ["u_aisha", "The upstairs room at the Millbrook library. They said Tuesday and Thursday evenings.", 12, 1],
      ["u_grace", "Perfect. Track how many people book vs. show up — that gap will tell you a lot.", 11, 20],
    ],
  },
  {
    id: "cv_omar_tyler",
    kind: "mentor",
    cohortId: "c_summer26",
    participants: ["u_omar", "u_tyler"],
    createdBy: "u_omar",
    lines: [
      ["u_omar", "Tyler, good session today. Your game night attendance numbers are strong.", 45, 3],
      ["u_tyler", "Thanks Omar. I'll send the library partnership draft next week.", 45, 1],
      ["u_omar", "Heads up: the program team is moving you to a mentor with more events experience. It's been great working with you.", 35, 2],
    ],
  },
  {
    id: "cv_jamal_ryan",
    kind: "direct",
    cohortId: "c_summer26",
    participants: ["u_jamal", "u_ryan"],
    createdBy: "u_ryan",
    lines: [
      ["u_ryan", "Hey Jamal, saw your BookBarber demo. Would you want to share a stall at the December market?", 2, 8],
      ["u_jamal", "Maybe. Are you planning to do booking stuff too?", 2, 6],
      ["u_ryan", "No, just refill orders by text. Different thing.", 2, 5],
      ["u_jamal", "Stop copying my booking idea, you idiot. Nobody needs two of the same thing in this cohort.", 1, 22, { autoFlag: { rule: "insult", matched: "idiot", at: ago(1, 22) } }],
      ["u_ryan", "I'm not copying anything. I'm going to report this.", 1, 21],
    ],
  },
  {
    id: "cv_leo_kai",
    kind: "direct",
    cohortId: "c_spring26",
    participants: ["u_leo", "u_kai"],
    createdBy: "u_leo",
    lines: [
      ["u_leo", "Kai, want to run a joint repair day? Bikes on your side, lamps and toasters on mine.", 20, 6],
      ["u_kai", "Yes! Text me on 555-0142 instead, it's easier than this app.", 20, 3, {
        autoFlag: { rule: "off_platform", matched: "555-0142", at: ago(20, 3) },
        hidden: { byId: "u_marcus", reason: "Shared a personal phone number to move the conversation off-platform. Fellowship conversations stay on supervised channels.", at: ago(19, 20) },
      }],
      ["u_marcus", "Hi both — a quick reminder from the program team: please keep fellowship conversations here, where staff can support you. I've hidden the message with the phone number. Your joint repair day sounds brilliant.", 19, 20],
      ["u_leo", "Got it, thanks Marcus. Kai — Saturday the 7th at Makers Hall?", 19, 18],
      ["u_kai", "Saturday works. I'll bring the stand and two pumps.", 19, 16],
    ],
  },
  {
    id: "cv_sofia_zara",
    kind: "mentor",
    cohortId: "c_spring26",
    participants: ["u_sofia", "u_zara"],
    createdBy: "u_sofia",
    unread: [["u_zara", 1]],
    lines: [
      ["u_sofia", "Zara, how did the pricing test for the family lessons go?", 5, 7],
      ["u_zara", "Six families signed up at $12 a lesson, only one at $18. But the $18 family booked ten lessons upfront.", 5, 2],
      ["u_sofia", "Interesting — maybe the real product is a package, not a lesson. Worth testing a 10-lesson bundle at a small discount?", 0, 22],
    ],
  },
  {
    id: "cv_kwame_ethan",
    kind: "direct",
    cohortId: "c_spring26",
    participants: ["u_kwame", "u_ethan"],
    createdBy: "u_ethan",
    lines: [
      ["u_ethan", "Kwame, quick question on the unit economics sheet — do I include the container rental in cost per refill?", 3, 5],
      ["u_kwame", "Keep it out of cost per refill — it's a fixed cost. Put it in your monthly fixed costs and work out how many refills cover it. That's your break-even.", 3, 2],
      ["u_ethan", "That makes it much clearer. 310 refills a month to break even.", 2, 20],
    ],
  },
  {
    id: "cv_mateo_lucas",
    kind: "direct",
    cohortId: "c_spring26",
    participants: ["u_mateo", "u_lucas"],
    createdBy: "u_mateo",
    lines: [
      ["u_mateo", "Lucas, could PrintLab print 40 small appointment-card stands for Slotly barbers?", 9, 3],
      ["u_lucas", "Definitely. Send me the dimensions and I'll do a test print this week.", 9, 1],
      ["u_lucas", "Test print done — it wobbles a bit. Adding a wider base.", 6, 4, { attachments: [{ id: "att_lucas_proto", name: "stand-prototype.png", mime: "image/png", size: 64512, sampleUrl: "/samples/attachments/stand-prototype.png" }] }],
    ],
  },
  {
    id: "cv_amira_noah",
    kind: "direct",
    cohortId: "c_summer26",
    participants: ["u_amira", "u_noah"],
    createdBy: "u_amira",
    lines: [
      ["u_amira", "Hi Noah, the Summer 2026 showcase is on December 10. Would you be up for a two-minute demo of Porchlight Repair?", 4, 3],
      ["u_noah", "I'd love to. Can I bring the repair toolkit as a prop?", 4, 1],
      ["u_amira", "Absolutely. I'll add you to the running order.", 3, 22],
    ],
  },
];

export function buildMessaging(): { conversations: Conversation[]; messages: Message[]; reports: MessageReport[] } {
  const conversations: Conversation[] = [];
  const messages: Message[] = [];

  for (const t of THREADS) {
    const lines = t.lines.map((l, i) => {
      const [senderId, body, d, h = 0, extra] = l;
      const sentAt = ago(d, h);
      return { senderId, body, sentAt, extra, i };
    });
    const unreadMap = new Map(t.unread ?? []);
    const threadMessages: Message[] = lines.map(({ senderId, body, sentAt, extra, i }) => {
      const readBy: Record<string, string> = {};
      for (const p of t.participants) {
        if (p === senderId) {
          readBy[p] = sentAt;
          continue;
        }
        const unreadCount = unreadMap.get(p) ?? 0;
        const isUnread = i >= lines.length - unreadCount;
        if (!isUnread) readBy[p] = new Date(new Date(sentAt).getTime() + 25 * 60000).toISOString();
      }
      return {
        id: `msg_${t.id.slice(3)}_${i + 1}`,
        conversationId: t.id,
        senderId,
        body,
        attachments: [],
        sentAt,
        readBy,
        ...extra,
      };
    });
    messages.push(...threadMessages);
    conversations.push({
      id: t.id,
      kind: t.kind,
      cohortId: t.cohortId,
      participantIds: t.participants,
      title: t.title,
      createdAt: threadMessages[0].sentAt,
      createdById: t.createdBy,
      lastMessageAt: threadMessages[threadMessages.length - 1].sentAt,
    });
  }

  const reports: MessageReport[] = [
    {
      id: "rp_jamal_ryan",
      messageId: "msg_jamal_ryan_4",
      conversationId: "cv_jamal_ryan",
      cohortId: "c_summer26",
      reporterId: "u_ryan",
      source: "participant",
      reason: "Harassment or insults",
      details: "He called me an idiot after I asked about sharing a stall. I'd like someone to talk to him.",
      status: "open",
      createdAt: ago(1, 21),
      history: [
        { at: ago(1, 22), action: "Keyword rule “Insulting language” matched “idiot”" },
        { at: ago(1, 21), byId: "u_ryan", action: "Reported by participant", note: "Harassment or insults" },
      ],
    },
    {
      id: "rp_leo_kai",
      messageId: "msg_leo_kai_2",
      conversationId: "cv_leo_kai",
      cohortId: "c_spring26",
      source: "keyword_rule",
      reason: "Off-platform contact",
      details: "Automatic flag: a phone number was shared.",
      status: "resolved",
      createdAt: ago(20, 3),
      assignedToId: "u_marcus",
      resolution: {
        outcome: "message_hidden",
        note: "Hid the message and reminded both fellows to keep conversations on the platform. No further action needed.",
        byId: "u_marcus",
        at: ago(19, 20),
      },
      history: [
        { at: ago(20, 3), action: "Keyword rule “Off-platform contact” matched “555-0142”" },
        { at: ago(19, 21), byId: "u_marcus", action: "Review started" },
        { at: ago(19, 20), byId: "u_marcus", action: "Message hidden", note: "Shared a personal phone number to move the conversation off-platform." },
        { at: ago(19, 20), byId: "u_marcus", action: "Resolved", note: "Reminder sent in thread." },
      ],
    },
  ];

  return { conversations, messages, reports };
}

/**
 * Deterministic scripted replies for counterparts who are not walkthrough
 * personas. Each conversation receives at most one simulated reply.
 */
export const SCRIPTED_REPLIES: Record<string, string[]> = {
  u_aisha: ["Oh nice, thanks for sharing! Let's compare notes after Thursday's office hours.", "That's really useful — I'll try it in my next interview."],
  u_diego: ["Thanks! That helps a lot. I'll send you the numbers tonight.", "Good call. I'll ask her about a trial month first."],
  u_lily: ["Thank you! I'll bring the booking sheet on Thursday.", "Makes sense — I'll draft a policy and share it."],
  u_grace: ["Thanks for the update — happy to talk it through on our next call.", "Love this. Keep a note of what surprised you most."],
  u_ryan: ["Thanks, appreciate it.", "Sounds good — see you at the workshop."],
  u_jamal: ["Okay, noted.", "Thanks for checking in."],
  u_elena: ["Thanks Noah — I'll take a look before Thursday's office hours.", "Good question. Bring it to office hours and we'll work through it together."],
  u_amira: ["Thanks — noted! I'll follow up by Friday.", "Great, I've added that to the plan."],
  u_kwame: ["Good thinking. Put the numbers in the sheet and I'll review them.", "Yes — and note your assumptions next to each figure."],
  u_hannah: ["Thanks for sharing. Let's discuss in the next circle.", "Lovely reflection — keep going."],
  default: ["Thanks for the message — I'll get back to you soon.", "Got it, thank you!"],
};
