import type { WorksheetSpec } from "./types";

/**
 * Downloadable worksheets. A PDF is generated from each spec and served from
 * /samples/worksheets/<fileName>. Sessions reference them with `worksheet()`.
 */
export const WORKSHEETS: WorksheetSpec[] = [
  {
    fileName: "problem-discovery-map.pdf",
    title: "Problem Discovery Map",
    intro:
      "Use this map to turn one problem you have seen firsthand into a clear, testable problem statement. Work in pencil: you will revise it as you learn more.",
    sections: [
      {
        heading: "Your shortlist",
        prompts: [
          "Write down three problems you have noticed in the last month, one sentence each.",
          "Score each problem from 1 to 5 on frequency, pain and how underserved it is.",
          "Which problem scored highest? Which one do you care about most? If they differ, why?",
        ],
      },
      {
        heading: "Who experiences it",
        prompts: [
          "Describe one specific person who lives with this problem. What does their day look like?",
          "When and where does the problem show up for them?",
          "How often does it happen, and when was the most recent time?",
        ],
      },
      {
        heading: "What they do today",
        prompts: [
          "List at least two current workarounds or alternatives.",
          "What does each workaround cost them in time, money or stress?",
          "Why do these options fall short?",
        ],
      },
      {
        heading: "Your problem statement",
        prompts: [
          "Complete the sentence: [person] struggles to [do something] when [situation], because [reason].",
          "What is the biggest thing you are still guessing about?",
          "Name one person you could talk to this week who lives with this problem.",
        ],
      },
    ],
  },
  {
    fileName: "customer-interview-guide.pdf",
    title: "Customer Interview Guide",
    intro:
      "Plan, run and write up conversations that reveal real behavior. Ask about the past, not the future, and about their life, not your idea.",
    sections: [
      {
        heading: "Learning goals",
        prompts: [
          "What are the three things you most need to learn from these interviews?",
          "What do you currently believe about each one? Write it down so you can check it later.",
          "Who exactly do you need to talk to, and where will you find them?",
        ],
      },
      {
        heading: "Opening questions",
        prompts: [
          "Tell me about the last time you [experienced the problem]. What happened?",
          "What is the hardest part about [the job they are trying to get done]?",
          "How do you handle this today?",
        ],
      },
      {
        heading: "Going deeper",
        prompts: [
          "What happened next? Why was that hard?",
          "What have you tried to fix it? What did that cost you?",
          "If you could change one thing about how this works, what would it be?",
          "Who else should I talk to about this?",
        ],
      },
      {
        heading: "Write-up (within 24 hours)",
        prompts: [
          "Three direct quotes that stood out.",
          "Workarounds, costs and current tools they mentioned.",
          "What surprised you or contradicted your assumptions?",
          "Signals of real interest: did they ask to try something, offer an introduction or describe paying for a fix?",
        ],
      },
      {
        heading: "Across all five interviews",
        prompts: [
          "Which themes came up three or more times?",
          "Which of your assumptions changed the most?",
          "What is the one question you will investigate next?",
        ],
      },
    ],
  },
  {
    fileName: "value-proposition-canvas.pdf",
    title: "Value Proposition Canvas",
    intro:
      "Match what your customer needs with what you offer. Fill in the customer side first, using real quotes and observations from your interviews.",
    sections: [
      {
        heading: "Customer jobs",
        prompts: [
          "What functional job is your customer trying to get done?",
          "What emotional job: how do they want to feel?",
          "What social job: how do they want to be seen by others?",
        ],
      },
      {
        heading: "Pains",
        prompts: [
          "What makes the job hard, slow, expensive or risky today?",
          "Which pain is the most intense? Include a quote as evidence.",
          "What are they worried might go wrong?",
        ],
      },
      {
        heading: "Gains",
        prompts: [
          "What outcome would genuinely delight them?",
          "What would make them switch from their current option?",
          "How would they know it had worked?",
        ],
      },
      {
        heading: "Your offer",
        prompts: [
          "What products or services do you provide?",
          "Which specific pains does your offer relieve?",
          "Which specific gains does your offer create?",
        ],
      },
      {
        heading: "Value proposition drafts",
        prompts: [
          "Draft one: lead with the most intense pain.",
          "Draft two: lead with the most wanted gain.",
          "Draft three: lead with what makes you different from the current alternative.",
          "Which draft resonated most in testing, and what words did people use in response?",
        ],
      },
    ],
  },
  {
    fileName: "experiment-card.pdf",
    title: "Experiment Card",
    intro:
      "Plan every experiment before it runs. Setting your success line in advance keeps you from moving the goalposts once results come in.",
    sections: [
      {
        heading: "Assumptions",
        prompts: [
          "List at least eight assumptions your venture depends on.",
          "Rank them by importance and by how much real evidence you have.",
          "Which assumption is most important and least proven?",
        ],
      },
      {
        heading: "Hypothesis and test",
        prompts: [
          "We believe that [customer] will [action] because [reason].",
          "What is the cheapest test that could prove this wrong?",
          "What will you ask people to do, not just say?",
        ],
      },
      {
        heading: "Metric and success line",
        prompts: [
          "What exactly will you measure?",
          "What result counts as a pass? What result means rethink?",
          "When will the test start and end?",
        ],
      },
      {
        heading: "Results log",
        prompts: [
          "Record your results each day of the test.",
          "What surprised you, even if it was outside your metric?",
          "Did anything outside your control affect the result?",
        ],
      },
      {
        heading: "Decision",
        prompts: [
          "Persevere, adjust or change direction? Explain why.",
          "What will you test next?",
        ],
      },
    ],
  },
  {
    fileName: "pricing-experiment-plan.pdf",
    title: "Pricing Experiment Plan",
    intro:
      "Replace a guess with evidence. Build a price range from three lenses, then test real prices with real customers.",
    sections: [
      {
        heading: "Your price range",
        prompts: [
          "Cost floor: what does one unit cost you to deliver, including your time?",
          "Competitor reference: what do customers pay for the current alternative?",
          "Value ceiling: what is the outcome worth to the customer?",
        ],
      },
      {
        heading: "Test design",
        prompts: [
          "Which two or three price points will you test?",
          "Which format will you use: split test, sequential test, tiered offer or pre-order?",
          "How will you make sure each customer sees one clear, fair price?",
        ],
      },
      {
        heading: "Metrics",
        prompts: [
          "What will you measure at each price: sales, revenue, profit per hour?",
          "What is your success line?",
          "How long will the test run, and how many people need to see each price?",
        ],
      },
      {
        heading: "Results and recommendation",
        prompts: [
          "Record sales, revenue and customer comments at each price.",
          "Which price earned the most per customer and per hour of your time?",
          "What price will you use next, and what will you test after that?",
        ],
      },
    ],
  },
  {
    fileName: "unit-economics-sheet.pdf",
    title: "Unit Economics Sheet",
    intro:
      "Walk through one sale from start to finish, then zoom out to three months. Include your time: it is a real cost, even if nobody is paying you yet.",
    sections: [
      {
        heading: "One sale",
        prompts: [
          "Price the customer pays for one unit.",
          "Every variable cost for that unit: materials, packaging, delivery, payment fees and paid time.",
          "Contribution margin: price minus total variable cost.",
        ],
      },
      {
        heading: "Fixed costs",
        prompts: [
          "Costs you pay regardless of sales over the next three months.",
          "Total fixed costs for the period.",
        ],
      },
      {
        heading: "Break-even",
        prompts: [
          "Total fixed costs divided by contribution margin per unit.",
          "How many sales per week does that mean? Is that realistic?",
        ],
      },
      {
        heading: "Three-month cash flow",
        prompts: [
          "For each month, the cash you expect to come in and when it arrives.",
          "For each month, the cash you expect to go out and when it leaves.",
          "The running balance at the end of each month. Where are the gaps?",
        ],
      },
      {
        heading: "Reflection",
        prompts: [
          "What do these numbers tell you about your venture?",
          "Which single change would improve your margin or cash flow the most?",
        ],
      },
    ],
  },
  {
    fileName: "launch-checklist.pdf",
    title: "Launch Checklist",
    intro:
      "A 30-day timeline and readiness checklist for your launch. Work through it with your mentor at least a week before launch day.",
    sections: [
      {
        heading: "Offer and goals",
        prompts: [
          "Exactly what you are launching, at what price, and for whom.",
          "Thirty-day goals for reach, conversion and retention.",
          "The two questions your launch will answer.",
        ],
      },
      {
        heading: "Channels",
        prompts: [
          "Channel one: five concrete actions, each with an owner and a date.",
          "Channel two: five concrete actions, each with an owner and a date.",
          "How you will track which channel each customer came from.",
        ],
      },
      {
        heading: "Timeline",
        prompts: [
          "Week one: preparation and soft launch.",
          "Weeks two and three: main launch.",
          "Week four: review, adjust and plan the next 30 days.",
        ],
      },
      {
        heading: "Readiness",
        prompts: [
          "Stock, materials or capacity for expected demand, plus a limit if demand runs higher.",
          "Written procedures for your core processes.",
          "Payments tested end to end, and a clear refund or returns promise.",
          "A way for customers to reach you with questions or problems.",
        ],
      },
      {
        heading: "Review rhythm",
        prompts: [
          "When you will check results each week, and with whom.",
          "What you will change if a channel underperforms.",
        ],
      },
    ],
  },
  {
    fileName: "team-charter.pdf",
    title: "Team Charter",
    intro:
      "Agree on how your team works together before problems come up. Write it together, and revisit it every few months.",
    sections: [
      {
        heading: "Purpose",
        prompts: [
          "What are we building, and why does it matter to each of us?",
          "What does success look like six months from now?",
        ],
      },
      {
        heading: "Roles and commitments",
        prompts: [
          "For each person: the areas they own.",
          "For each person: realistic hours per week, and known busy periods such as exams or work shifts.",
          "Who is the backup for each area?",
        ],
      },
      {
        heading: "Decisions",
        prompts: [
          "Which decisions can an owner make alone?",
          "Which decisions need the whole team, and how will we make them: consensus, vote or owner decides?",
          "How will we handle a disagreement we cannot resolve on our own?",
        ],
      },
      {
        heading: "Communication",
        prompts: [
          "Which channels do we use, and for what?",
          "What response time do we expect from each other?",
          "How often will we meet, and who runs the meeting?",
        ],
      },
      {
        heading: "When things change",
        prompts: [
          "What happens if someone cannot keep a commitment?",
          "How much notice do we give if we need to step back?",
          "What happens if someone leaves the venture?",
        ],
      },
    ],
  },
  {
    fileName: "stakeholder-map.pdf",
    title: "Stakeholder Map",
    intro:
      "Map everyone your venture affects, decide who to listen to first, and plan how you will measure the change you create.",
    sections: [
      {
        heading: "Stakeholder brainstorm",
        prompts: [
          "List at least ten groups who affect or are affected by your venture.",
          "Include at least one group that might be affected negatively or disagree with you.",
        ],
      },
      {
        heading: "Influence and effect",
        prompts: [
          "Plot each group by how much they influence your venture and how much it affects them.",
          "Which groups are highly affected but have little influence?",
          "Which three groups will you listen to first, and why?",
        ],
      },
      {
        heading: "Listening notes",
        prompts: [
          "What do they hope your venture changes?",
          "What are they worried about?",
          "What surprised you?",
        ],
      },
      {
        heading: "Theory of change",
        prompts: [
          "Because we do [this], [these people] experience [this change].",
          "What has to be true for that change to happen?",
        ],
      },
      {
        heading: "Measures",
        prompts: [
          "Two or three outputs you will count.",
          "One or two outcomes you will observe or ask about.",
          "How and when you will collect each measure.",
        ],
      },
    ],
  },
  {
    fileName: "pitch-outline.pdf",
    title: "Pitch Outline",
    intro:
      "Structure a three-minute pitch in seven parts, rehearse it against the clock, and prepare for the questions that follow.",
    sections: [
      {
        heading: "Audience and ask",
        prompts: [
          "Who are you pitching to, and what do they care about most?",
          "What exactly are you asking them for?",
        ],
      },
      {
        heading: "The seven parts",
        prompts: [
          "Hook (about 20 seconds): a person, a moment or a striking fact.",
          "Problem and solution (about 50 seconds): who struggles, and what you do about it.",
          "Evidence and model (about 60 seconds): what you have learned and how the venture sustains itself.",
          "Impact, vision and ask (about 50 seconds): the change you create and what you need next.",
        ],
      },
      {
        heading: "Rehearsal log",
        prompts: [
          "Time for each section across five rehearsals.",
          "What did listeners say when you asked them to describe your venture in one sentence?",
        ],
      },
      {
        heading: "Question preparation",
        prompts: [
          "The ten questions you most fear, with a short answer to each.",
          "Your key numbers: customers, revenue, costs and impact measures.",
          "One question you cannot answer yet, and how you would find out.",
        ],
      },
    ],
  },
];

export type WorksheetFileName =
  | "problem-discovery-map.pdf"
  | "customer-interview-guide.pdf"
  | "value-proposition-canvas.pdf"
  | "experiment-card.pdf"
  | "pricing-experiment-plan.pdf"
  | "unit-economics-sheet.pdf"
  | "launch-checklist.pdf"
  | "team-charter.pdf"
  | "stakeholder-map.pdf"
  | "pitch-outline.pdf";

/** Approximate rendered size shown on the download card. */
const WORKSHEET_SIZES: Record<WorksheetFileName, string> = {
  "problem-discovery-map.pdf": "3 KB",
  "customer-interview-guide.pdf": "4 KB",
  "value-proposition-canvas.pdf": "4 KB",
  "experiment-card.pdf": "4 KB",
  "pricing-experiment-plan.pdf": "3 KB",
  "unit-economics-sheet.pdf": "3 KB",
  "launch-checklist.pdf": "4 KB",
  "team-charter.pdf": "4 KB",
  "stakeholder-map.pdf": "4 KB",
  "pitch-outline.pdf": "3 KB",
};

export function getWorksheet(fileName: WorksheetFileName): { spec: WorksheetSpec; size: string } {
  const spec = WORKSHEETS.find((w) => w.fileName === fileName);
  const size = WORKSHEET_SIZES[fileName];
  if (!spec || !size) {
    throw new Error(`Unknown worksheet: ${fileName}`);
  }
  return { spec, size };
}
