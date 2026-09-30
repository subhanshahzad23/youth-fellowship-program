import type { VideoScript } from "./types";

export type VideoId =
  | "ff-problems-worth-solving"
  | "ff-value-propositions"
  | "vb-prototyping-basics"
  | "vb-cash-flow-basics"
  | "li-clear-updates"
  | "li-partnership-ask";

/**
 * Narrated slide videos. Narration is read by text-to-speech, so it is
 * written as plain spoken sentences with no abbreviations or symbols.
 * Each script is used by exactly one session of kind "video".
 */
export const VIDEO_SCRIPTS: VideoScript[] = [
  {
    id: "ff-problems-worth-solving",
    title: "Finding problems worth solving",
    segments: [
      {
        slideTitle: "Start with the struggle",
        slideBody: "Strong ventures begin with a problem someone already feels, not an idea looking for a home.",
        narration:
          "Welcome. In this short video, we will look at where good problems hide, and how to turn a vague frustration into a problem statement you can actually test with real people.",
      },
      {
        slideTitle: "Look for workarounds",
        slideBody: "Spreadsheets, group chats, sticky notes and favors from friends all point to a job done badly.",
        narration:
          "The first place to look is workarounds. When people patch a problem with a spreadsheet, a group chat or a favor from a friend, they are telling you that the existing options are not good enough.",
      },
      {
        slideTitle: "Listen for repeated complaints",
        slideBody: "When the same frustration comes up again and again, write it down word for word.",
        narration:
          "Next, listen for complaints that keep coming back. Keep a simple note on your phone. When you hear the same frustration from different people, you may have found a pattern worth exploring.",
      },
      {
        slideTitle: "Apply three tests",
        slideBody: "Is it frequent? Is it painful? Is it underserved by the options people have today?",
        narration:
          "Before you commit, check three things. Does the problem happen often? Does it cost people time, money or stress? And are the current options missing, expensive or built for someone else?",
      },
      {
        slideTitle: "Write the problem statement",
        slideBody: "A specific person struggles to do something when a situation happens, because of a reason.",
        narration:
          "Finally, write it as one sentence. Name a specific person, what they struggle to do, when it happens and why. If you cannot fill in every part, you have found your next question.",
      },
    ],
  },
  {
    id: "ff-value-propositions",
    title: "Writing a value proposition people repeat",
    segments: [
      {
        slideTitle: "A promise, not a slogan",
        slideBody: "Your value proposition tells the right customer, in one breath, why this is for them.",
        narration:
          "A value proposition is a promise. It tells the right customer, quickly and clearly, what will change for them. It is not a clever slogan, and it is not a list of features.",
      },
      {
        slideTitle: "Write the full version",
        slideBody: "For a customer who has a problem, our offer gives an outcome, unlike the alternative, because of our difference.",
        narration:
          "Start by writing it out in full. For a specific customer, who has a specific problem, your offer gives a clear outcome, unlike their current option, because of what makes your approach different.",
      },
      {
        slideTitle: "Lead with the outcome",
        slideBody: "Customers care about what changes for them, not about how your product works.",
        narration:
          "Lead with the outcome, not the mechanism. A parent does not want a tutoring platform. They want homework time that ends without tears. Say the thing your customer would actually say.",
      },
      {
        slideTitle: "Avoid three common mistakes",
        slideBody: "Too broad, too clever, or too focused on features instead of the customer.",
        narration:
          "Watch out for three mistakes. Being too broad, so nobody feels it is for them. Being too clever, so nobody understands it. And listing features instead of describing what changes for the customer.",
      },
      {
        slideTitle: "Run the repeat test",
        slideBody: "Explain it once. Ask someone to repeat it to a third person. Listen for drift.",
        narration:
          "Then test it. Explain your offer to someone, and ask them to describe it to another person. If their version matches yours, it is working. If it drifts, simplify and try again.",
      },
    ],
  },
  {
    id: "vb-prototyping-basics",
    title: "From sketch to clickable prototype",
    segments: [
      {
        slideTitle: "Start with a question",
        slideBody: "Every prototype exists to answer one question. Write it down before you build anything.",
        narration:
          "Every prototype should answer a question. In this example, a fellow is building a study space finder for college students. Her question is simple: can students find a quiet place to study in under a minute?",
      },
      {
        slideTitle: "Sketch three versions",
        slideBody: "Quick paper sketches let you explore different directions before committing to one.",
        narration:
          "She starts with paper. In twenty minutes, she sketches three different versions: a map, a list sorted by distance, and a short quiz that asks what kind of space you need.",
      },
      {
        slideTitle: "Make it clickable",
        slideBody: "Link screens together with a free design tool. It only needs to look real enough.",
        narration:
          "She picks the list version and rebuilds it as a clickable prototype in a free design tool. Buttons link the screens together. Nothing works behind the scenes, but it looks real enough to test.",
      },
      {
        slideTitle: "Test with five people",
        slideBody: "Give a realistic task, then watch in silence. Hesitation tells you more than opinions do.",
        narration:
          "Next, she tests with five students. She gives each one a task: find a quiet place near you that is open late. Then she stays silent and watches where they hesitate.",
      },
      {
        slideTitle: "Fix it and test again",
        slideBody: "Fix the biggest problem first. Two quick rounds beat one perfect prototype.",
        narration:
          "Three of the five students missed the filter for opening hours. She moves it to the top of the screen and tests again the next day. Two quick rounds taught her more than weeks of polishing.",
      },
    ],
  },
  {
    id: "vb-cash-flow-basics",
    title: "Reading your first cash flow",
    segments: [
      {
        slideTitle: "Profit is not cash",
        slideBody: "A venture can be profitable on paper and still run out of money.",
        narration:
          "Here is something that surprises many founders. A venture can be profitable on paper and still run out of money. The difference comes down to timing, and timing is what cash flow is about.",
      },
      {
        slideTitle: "Follow the timing",
        slideBody: "Cash flow tracks when money actually arrives and leaves, not when a sale is agreed.",
        narration:
          "Cash flow tracks when money actually moves. Not when a customer agrees to buy, and not when you send an invoice, but the day money arrives in your account or leaves it.",
      },
      {
        slideTitle: "A school supplies example",
        slideBody: "Stock is bought in July. Most orders arrive in late August and September.",
        narration:
          "Imagine a venture selling school supply kits. The founder buys stock in July, but most parents order in late August and September. For weeks, money goes out long before anything comes in.",
      },
      {
        slideTitle: "Spot the gaps early",
        slideBody: "A simple monthly table of money in and money out shows problems before they arrive.",
        narration:
          "The fix starts with a simple table. List each month, then write the money you expect to come in and go out. Keep a running balance. Any month where it drops below zero is a warning.",
      },
      {
        slideTitle: "Close the gap",
        slideBody: "Pre-orders, deposits, smaller stock orders and faster payment all help.",
        narration:
          "Once you can see a gap, you can close it. Take pre-orders or deposits. Buy stock in smaller batches. Ask customers to pay sooner. Small changes in timing can keep a good venture alive.",
      },
    ],
  },
  {
    id: "li-clear-updates",
    title: "Updates people actually read",
    segments: [
      {
        slideTitle: "Why updates matter",
        slideBody: "A short monthly update keeps supporters close and makes asking for help feel natural.",
        narration:
          "A short monthly update is one of the most useful habits a founder can build. It keeps your mentor and supporters informed, and it makes asking for help feel natural instead of awkward.",
      },
      {
        slideTitle: "Start with a headline",
        slideBody: "One sentence on the most important thing that happened this month.",
        narration:
          "Start with a headline. One sentence on the most important thing that happened this month. If a reader stops there, they should still know how things are going.",
      },
      {
        slideTitle: "Track the same numbers",
        slideBody: "Two to four figures, reported the same way every month, make progress visible.",
        narration:
          "Next, share two to four numbers, and keep them the same each month. Customers, sessions held, money earned, people reached. Consistency lets readers see your progress without extra explanation.",
      },
      {
        slideTitle: "Share wins and lessons",
        slideBody: "Be honest about what worked and what did not. Lessons build trust.",
        narration:
          "Then share wins and lessons. Be honest about what did not work and what you learned from it. Supporters trust founders who tell them the whole story, not just the good parts.",
      },
      {
        slideTitle: "Make specific asks",
        slideBody: "One to three requests someone could act on today: an introduction, a skill, or feedback.",
        narration:
          "Finish with one to three specific asks. Not, let me know if you can help. Instead, do you know a cafe owner near campus who might host our study nights? Specific asks get answers.",
      },
    ],
  },
  {
    id: "li-partnership-ask",
    title: "Making the first ask",
    segments: [
      {
        slideTitle: "Partnerships serve both sides",
        slideBody: "The best partnerships help both organizations reach goals they could not reach alone.",
        narration:
          "A good partnership is not a favor. It works because both sides get something they genuinely need. Your job is to understand what your partner wants, and show how you can help them get it.",
      },
      {
        slideTitle: "Find the right person",
        slideBody: "Look past the general inbox for the role closest to your shared goal.",
        narration:
          "Start by finding the right person. Skip the general inbox if you can. Look for the role closest to your shared goal, such as a youth program lead, a community manager or a shop owner.",
      },
      {
        slideTitle: "Keep the first message short",
        slideBody: "Who you are, why them, what they gain, and one small next step.",
        narration:
          "Keep your first message short. Say who you are, why you are reaching out to them in particular, what they could gain, and suggest one small next step, like a twenty-minute conversation.",
      },
      {
        slideTitle: "Propose a small pilot",
        slideBody: "A time-limited trial lowers the risk and lets both sides learn before committing.",
        narration:
          "When you meet, propose a pilot instead of a long commitment. A four-week trial with a clear goal is far easier to say yes to, and it lets both of you learn before going further.",
      },
      {
        slideTitle: "Follow up within a day",
        slideBody: "Thank them, summarize what you agreed on, and confirm the next step in writing.",
        narration:
          "Finally, follow up within a day. Thank them, summarize what you agreed on, and confirm the next step with a date. A clear follow-up often matters more than the meeting itself.",
      },
    ],
  },
];
