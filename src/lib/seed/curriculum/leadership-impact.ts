import type { SeedModule } from "./types";
import { bullets, example, heading, para, quote, steps, task, tip, video, warning, worksheet } from "./blocks";

/**
 * Track 3: Leadership & Impact.
 * Every name, venture and quote below is fictional.
 */
export const LEADERSHIP_IMPACT: SeedModule[] = [
  /* ---------------------------------------------------------------- */
  /* li-1 Teamwork                                                     */
  /* ---------------------------------------------------------------- */
  {
    key: "li-1",
    trackSlug: "leadership-impact",
    order: 1,
    title: "Teamwork",
    summary:
      "Build teams that work: clear roles, shared agreements and the habits that help people disagree productively and stay committed.",
    suggestedMonths: "Months 1–3",
    sessions: [
      {
        key: "li-1-1",
        kind: "reading",
        title: "Roles, not titles",
        summary:
          "Early teams need clear responsibilities more than impressive titles. Learn to divide the work so everyone knows what they own.",
        durationMin: 12,
        blocks: [
          para(
            "When friends start a venture together, it is tempting to hand out titles right away: CEO, head of marketing, creative director. Titles feel motivating, but they rarely answer the question that matters day to day: *who is responsible for this, and who decides?*",
            "Strong early teams focus on ownership instead. Each important area of work has one clear owner, even when several people contribute. Everyone knows who to go to, and nothing falls through the cracks.",
          ),
          heading("Defining ownership"),
          bullets([
            "**List the recurring work** your venture needs: customer conversations, social media, money, operations, partnerships.",
            "**Assign one owner** per area. Owners do not have to do all the work, but they make sure it happens.",
            "**Clarify decisions:** which decisions can an owner make alone, and which need the whole team?",
            "**Revisit every month.** Roles should change as the venture and people's availability change.",
          ]),
          example(
            "A back-to-school clothing swap",
            "Four friends ran a clothing swap at the start of each semester at their Millbrook high school. For the first two swaps, everyone did everything, and it was chaos: two people ordered the same clothing racks and nobody reserved the gym. For the third, they split ownership four ways: donations, venue, promotion and day-of volunteers. It was the first swap that started on time.",
          ),
          quote(
            "We didn't need titles. We needed to stop assuming someone else had sent the email.",
            "Jun, Summer 2026 fellow (fictional example)",
          ),
        ],
      },
      {
        key: "li-1-2",
        kind: "reading",
        title: "Disagreeing well",
        summary:
          "Conflict in teams is normal and useful when handled well. Learn practical ways to disagree about ideas without damaging relationships.",
        durationMin: 14,
        blocks: [
          para(
            "If your team never disagrees, someone is probably staying quiet. Healthy teams argue about ideas regularly: which customers to focus on, how to spend a small budget, whether to take on a new opportunity. The goal is not to avoid conflict. It is to keep it about the work, not about the people.",
          ),
          heading("Habits that help"),
          bullets([
            "**Separate the idea from the person.** Say “I'm worried this price is too low,” not “Your pricing is wrong.”",
            "**Ask before arguing.** “What makes you confident about this?” often surfaces information you did not have.",
            "**Agree on how you will decide** before you debate: consensus, the owner decides, or a majority vote.",
            "**Disagree and commit.** Once a decision is made, support it fully, and set a date to review it.",
            "**Raise tension early.** Small frustrations left unspoken turn into big ones.",
          ]),
          example(
            "The dog-walking collective",
            "Two members of Ren's collective disagreed about taking on a client who wanted six walks a day. One saw a big opportunity; the other saw burnout. Instead of arguing in the group chat, they met in person, listed the risks and benefits together and agreed to a four-week trial with a set review date. The trial showed the schedule was too much, and they turned down the renewal without any resentment.",
          ),
          tip(
            "Move heated threads offline",
            "Text strips out tone and invites misunderstanding. If a group chat thread starts to feel heated, suggest a call or a quick meeting. Most disagreements are easier to resolve face to face.",
          ),
        ],
      },
      {
        key: "li-1-3",
        kind: "task",
        title: "Write your team charter",
        summary:
          "Agree on and write down how your team works together: purpose, roles, decisions, communication and what happens when things go wrong.",
        durationMin: 90,
        blocks: [
          para(
            "A team charter is a short agreement, written together, about how you will work. It is most useful before problems come up, while everyone is still enthusiastic and thinking clearly. If you are a solo founder, write a charter for how you will work with your mentor, advisers and any volunteers.",
          ),
          steps([
            "Agree on your shared purpose in one or two sentences.",
            "List each person's role and areas of ownership, and how much time each person can realistically commit.",
            "Decide how different kinds of decisions will be made.",
            "Agree on communication norms: which channels for what, and expected response times.",
            "Write down what happens if someone cannot keep their commitments, or wants to leave.",
          ]),
          example(
            "The ASL conversation club",
            "Ines's team of three agreed that practice sessions would never be canceled with less than 48 hours' notice, that the group chat was for logistics only, and that anyone could step back during finals as long as they said so a month ahead. When one member did need that time, the handoff was smooth, because the rule already existed.",
          ),
          worksheet(
            "team-charter.pdf",
            "A fill-in charter covering purpose, roles, decisions, communication and what happens when things change.",
          ),
          task({
            title: "Team charter",
            instructions:
              "Write a team charter together with everyone involved in your venture, or with your mentor and advisers if you work alone. Cover purpose, roles, time commitments, decision-making, communication norms and what happens when commitments change. Everyone involved should review and agree to the final version.",
            deliverable: "Your agreed team charter, one to two pages long.",
            requiresReview: true,
            rubric: [
              "Roles and ownership are specific and realistic given each person's availability.",
              "Decision-making and communication norms are clear enough to apply in practice.",
              "The charter addresses what happens when commitments change or someone leaves.",
            ],
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* li-2 Communication                                                */
  /* ---------------------------------------------------------------- */
  {
    key: "li-2",
    trackSlug: "leadership-impact",
    order: 2,
    title: "Communication",
    summary:
      "Communicate clearly and confidently with customers, partners, mentors and your team, in writing, in conversation and in front of a group.",
    suggestedMonths: "Months 4–6",
    sessions: [
      {
        key: "li-2-1",
        kind: "reading",
        title: "Say the point first",
        summary:
          "Busy people decide in seconds whether to keep reading. Learn to lead with your point and make every message easy to act on.",
        durationMin: 12,
        blocks: [
          para(
            "Mentors, partners and potential funders get a lot of messages. The ones that get quick, helpful replies share one habit: they put the most important thing first. What do you need? By when? Why does it matter?",
            "This is sometimes called *bottom line up front*. It can feel abrupt at first, especially if you were taught to build up to your point. But clarity is a form of respect for the other person's time.",
          ),
          heading("A simple structure for any message"),
          steps([
            "**The point or request,** in one sentence.",
            "**The context** they need to understand it, in two or three sentences.",
            "**The details,** only what is necessary, with anything optional clearly marked.",
            "**The next step,** including a date if one matters.",
          ]),
          heading("Before and after"),
          para(
            "*Before:* “Hi! Hope you're doing well. So we've been doing the tutoring for a while now and it's going pretty well, and we were thinking about maybe expanding at some point, and I wondered if you might have time to chat about some ideas sometime…”",
            "*After:* “Could we have a 20-minute call next week about expanding our tutoring program to a second school? We now have 18 regular students and a waitlist of 9. I'd value your view on whether to recruit another tutor first or find a second location.”",
          ),
          tip(
            "Write the subject line last",
            "Once your message is written, make the subject line or first line describe the request itself, such as “Request: 20-minute call about a second school.” People can prioritize before they even open it.",
          ),
        ],
      },
      {
        key: "li-2-2",
        kind: "video",
        title: "Updates people actually read",
        summary:
          "Regular updates keep mentors, partners and supporters engaged. This video shows a simple monthly update format and what to include.",
        durationMin: 6,
        blocks: [
          para(
            "A short monthly update is one of the most underrated habits a founder can build. It keeps your supporters informed, makes asking for help feel natural and creates a record of your progress. This video walks through a format that takes less than an hour to write.",
          ),
          video("li-clear-updates"),
          heading("The format"),
          bullets([
            "**Headline:** one sentence on the most important thing that happened.",
            "**Numbers:** two to four figures that show progress, the same ones every month.",
            "**Wins and lessons:** what went well, and what you learned from what did not.",
            "**Asks:** one to three specific requests where the reader could help.",
          ]),
          quote(
            "The first month I sent an update, two people replied offering introductions I didn't know I needed. Now I never skip it.",
            "Theo, Summer 2026 fellow (fictional example)",
          ),
        ],
      },
      {
        key: "li-2-3",
        kind: "task",
        title: "Send your first monthly update",
        summary:
          "Write and send a monthly update to your mentor and at least two other supporters, using the four-part format.",
        durationMin: 60,
        blocks: [
          para(
            "Now write your own. Your first update does not need impressive numbers. It needs to be clear, honest and specific about how people can help. Send it to your mentor and at least two other people who care about your progress, such as a teacher, a family member, an early customer or a community partner.",
          ),
          steps([
            "Choose the two to four numbers you will track every month.",
            "Draft your update using the four-part format, keeping it under 300 words.",
            "Make your asks specific: a name, a skill, an introduction or feedback on something concrete.",
            "Read it aloud before sending. Cut anything you would not say in conversation.",
            "Send it, and note who replies and how.",
          ]),
          example(
            "From a vague ask to a specific one",
            "A vague ask: “Let me know if you know anyone who could help.” A specific ask: “Do you know anyone who runs a café near Larkhaven State who might host our study nights on a weeknight?” The second one gives people something they can actually act on.",
          ),
          task({
            title: "First monthly update",
            instructions:
              "Write a monthly update of under 300 words using the headline, numbers, wins and lessons, and asks format. Send it to your mentor and at least two other supporters. After a week, note any replies and what came of your asks.",
            deliverable: "A copy of your update, plus a short note on who you sent it to and the responses you received.",
            requiresReview: true,
            rubric: [
              "The update leads with a clear headline and uses consistent, meaningful numbers.",
              "Wins and lessons are honest and specific.",
              "Asks are concrete enough for a reader to act on.",
            ],
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* li-3 Ethical Decisions                                            */
  /* ---------------------------------------------------------------- */
  {
    key: "li-3",
    trackSlug: "leadership-impact",
    order: 3,
    title: "Ethical Decisions",
    summary:
      "Recognize the ethical choices hidden in everyday venture decisions, and build a clear, repeatable way to make them well.",
    suggestedMonths: "Months 7–9",
    sessions: [
      {
        key: "li-3-1",
        kind: "reading",
        title: "Ethics shows up in small decisions",
        summary:
          "Most ethical challenges in a venture are not dramatic dilemmas. They are small, everyday choices. Learn to notice them and think them through.",
        durationMin: 14,
        blocks: [
          para(
            "When people think of business ethics, they often picture headline scandals. In a young venture, ethical questions are usually quieter. Do you round up your customer count in a pitch? Do you call a product handmade when some parts are bought in? Do you keep a customer's photo on social media after they ask you to take it down?",
            "These choices feel small in the moment. But they shape your reputation, your team's culture and the kind of founder you become.",
          ),
          heading("Four questions for a hard choice"),
          steps([
            "**Who is affected,** including people who are not in the room?",
            "**What would I be comfortable explaining** to them directly, face to face?",
            "**Would I be happy for this to be the standard,** if everyone in my position did the same?",
            "**What does it cost to do the right thing,** and am I willing to pay it?",
          ]),
          example(
            "The honest number",
            "Before a local grant panel, Marcus was tempted to say his e-waste pickup service had “over 100 customers.” The real figure was 72 households that had used it, plus 30 people who had signed up but not yet booked. He presented both numbers separately. A panelist later told him that was the reason they trusted the rest of his application.",
          ),
          tip(
            "Decide your lines in advance",
            "It is much easier to hold a line you have already drawn. Write down two or three things your venture will never do, such as exaggerate impact, share customer data without consent or pay suppliers late, and revisit them when pressure arrives.",
          ),
        ],
      },
      {
        key: "li-3-2",
        kind: "reading",
        title: "Data, privacy and the people you serve",
        summary:
          "Even small ventures collect personal information. Learn the basics of handling it responsibly, especially when you work with young people.",
        durationMin: 14,
        blocks: [
          para(
            "Sign-up forms, customer lists, event photos, group chat messages: almost every venture handles personal information about the people it serves. Handling it well is an ethical responsibility and, in many cases, a legal one. It matters even more when your customers or participants are young people.",
          ),
          heading("Practical principles"),
          bullets([
            "**Collect only what you need.** If you do not need a date of birth or home address, do not ask for it.",
            "**Say why you are collecting it** and how it will be used, in plain language.",
            "**Ask before you share,** including photos and quotes on social media.",
            "**Store it securely,** with access limited to the people who need it.",
            "**Delete it when you no longer need it,** and let people ask you to remove their information.",
          ]),
          example(
            "The study-space finder",
            "When Ayo's study-space app asked users to share their location, he realized it was also quietly storing where each student studied every evening. Nobody had asked for that history, and he had no use for it. He changed the app so location was used once to show nearby spaces and then discarded, and added a plain-language note explaining exactly that.",
          ),
          warning(
            "Photos of young people",
            "Never post photos or names of participants under 18 without clear permission from them and from a parent or guardian. When in doubt, leave it out, or use images where no one can be identified.",
          ),
        ],
      },
      {
        key: "li-3-3",
        kind: "task",
        title: "Work through an ethics case",
        summary:
          "Apply the four-question framework to a realistic dilemma and write down your reasoning. A reflection to bring to your next mentor conversation.",
        durationMin: 45,
        blocks: [
          para(
            "Read the case below and work through it using the four questions from the first session. There is no single right answer. What matters is that your reasoning is clear and that you consider everyone affected.",
          ),
          heading("The case"),
          para(
            "You run a small tutoring program that pairs college students with middle schoolers in Eastbank. A parent offers to pay double your usual rate if you guarantee their child will always work with your highest-rated tutor. That tutor currently works with two students whose families pay a reduced rate through your scholarship fund. Saying yes would mean moving those two students to a newer tutor. The extra income would fund three more scholarship spots next semester.",
          ),
          heading("Think it through"),
          bullets([
            "Who is affected by each possible decision, including people who are not part of the conversation?",
            "What would you be comfortable explaining to the two scholarship families face to face?",
            "Is there an option that is not simply yes or no?",
            "What principle would you want to apply to similar requests in the future?",
          ]),
          task({
            title: "Ethics case reflection",
            instructions:
              "Work through the tutoring case using the four-question framework. Describe the options you considered, the one you would choose, and the principle you would apply to similar situations in the future.",
            deliverable: "A written reflection of 300 to 500 words.",
            requiresReview: false,
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* li-4 Community Impact                                             */
  /* ---------------------------------------------------------------- */
  {
    key: "li-4",
    trackSlug: "leadership-impact",
    order: 4,
    title: "Community Impact",
    summary:
      "Understand the change your venture creates in its community, involve the people affected and measure what actually matters.",
    suggestedMonths: "Months 10–12",
    sessions: [
      {
        key: "li-4-1",
        kind: "reading",
        title: "Impact starts with listening",
        summary:
          "Ventures that aim to help a community work best when that community shapes them. Learn to design with people, not for them.",
        durationMin: 13,
        blocks: [
          para(
            "Many well-meaning ventures struggle because they are designed *for* a community instead of *with* it. The founders assume they know what people need, build something and are surprised when it goes unused. The fix is the same one you learned in customer interviews, applied more broadly: listen first, and keep listening.",
            "When your venture aims for social or environmental impact, the people affected are not just customers. They are partners in deciding what good looks like.",
          ),
          heading("Ways to involve the community"),
          bullets([
            "**Listening sessions:** informal gatherings where people share experiences and ideas while you mostly listen.",
            "**Advisory voices:** a small group of community members who give regular feedback on decisions.",
            "**Co-design workshops:** sessions where community members sketch solutions alongside you.",
            "**Paid roles:** hiring people from the community, so they share in the value you create.",
          ]),
          example(
            "An accessible venue guide",
            "Grace set out to create a guide to wheelchair-accessible cafés and venues in Greater Larkhaven. Her first draft rated venues on ramps and door widths. When she invited five wheelchair users to review it, they pointed out what she had missed: accessible restrooms, table heights and whether staff were welcoming. The final guide used their criteria, and three of them joined as regular reviewers.",
          ),
          quote(
            "The moment I stopped presenting my plan and started asking people what they'd change, the plan got better and people started showing up.",
            "Grace, Summer 2026 fellow (fictional example)",
          ),
        ],
      },
      {
        key: "li-4-2",
        kind: "reading",
        title: "Measuring what matters",
        summary:
          "Activity is not impact. Learn the difference between outputs and outcomes, and choose a few measures that show real change.",
        durationMin: 15,
        blocks: [
          para(
            "It is easy to count activity: sessions held, boxes delivered, people reached. These are *outputs*, and they matter, because they show your venture is working. But they do not tell you whether anyone's life actually changed. That is the job of *outcomes*.",
          ),
          heading("From activity to change"),
          bullets([
            "**Inputs:** what you put in, such as time, money, volunteers and materials.",
            "**Outputs:** what you do or produce, such as 40 tutoring sessions or 200 repaired items.",
            "**Outcomes:** the change for people, such as students who feel more confident in math, or households spending less on replacing broken things.",
            "**Impact:** the longer-term, wider change you contribute to, such as better grades across a school, or less waste going to landfill.",
          ]),
          para(
            "For a young venture, focus on outputs you can count reliably and one or two outcomes you can observe or ask about. Claiming long-term impact without evidence damages trust quickly.",
          ),
          example(
            "The repair café's measures",
            "Oskar tracked items brought in and items successfully repaired as his outputs. For outcomes, he asked every visitor two short questions on the way out: did you learn a repair skill today, and would you have thrown this item away otherwise? Within a few months he could say, with evidence, how many items had been kept out of the trash and how many visitors had learned something new.",
          ),
          tip(
            "Ask simple, consistent questions",
            "One or two short questions asked the same way every time are more useful than a long survey nobody finishes. Consistency lets you compare results over time.",
          ),
        ],
      },
      {
        key: "li-4-3",
        kind: "task",
        title: "Map your stakeholders and impact measures",
        summary:
          "Identify everyone your venture affects, hold listening conversations with at least three stakeholder groups and define a small set of measures that show real change.",
        durationMin: 180,
        showcase: true,
        blocks: [
          para(
            "This task asks you to step back and see your venture as part of a wider community. You will map everyone it affects, listen to several of those groups directly and use what you hear to choose a handful of measures that show whether your venture is creating the change you intend.",
            "By the end, you will have a clear, evidence-based answer to a question every partner, funder and community member will eventually ask you: *how do you know it is working?*",
          ),
          heading("Who counts as a stakeholder?"),
          para(
            "A stakeholder is anyone who affects or is affected by your venture. That includes obvious groups like customers and teammates, but also less obvious ones: neighbors, parents, local businesses, schools, suppliers and people who could be affected negatively. A good map includes the people who might disagree with you.",
          ),
          heading("The process"),
          steps([
            "**Brainstorm every stakeholder group** you can think of. Aim for at least ten.",
            "**Plot them on the map** by how much they influence your venture and how much it affects them.",
            "**Choose three groups to listen to,** including at least one that is highly affected but has little influence.",
            "**Hold short listening conversations** with at least two people from each group. Ask what they hope your venture changes, and what worries them.",
            "**Write your theory of change** in one sentence: because we do this, these people experience this change.",
            "**Choose your measures:** two or three outputs and one or two outcomes, with how and when you will collect each one.",
          ]),
          heading("Worked example: the community garden produce box"),
          para(
            "By month ten, Rahel's produce box was delivering to 35 households in Millbrook. Her stakeholder map included customers, growers, garden volunteers, neighbors of the garden, the local food pantry and the neighborhood association. She was surprised to realize that the food pantry, which she had never spoken to, was highly affected: some of her customers had previously relied on it for fresh vegetables.",
            "Listening conversations with the food pantry, older customers and garden volunteers reshaped her measures. Her outputs became boxes delivered and volunteer hours. Her outcomes became households reporting that they ate more fresh vegetables, and older customers reporting that they felt less isolated, because the weekly delivery had turned into a regular conversation. That second outcome was not in her original plan at all. It came entirely from listening.",
          ),
          tip(
            "Include the quiet voices",
            "The people most affected by a venture are often the least likely to be asked. Make a deliberate effort to reach them, and make it easy to take part: go to them, keep it short and thank them for their time.",
          ),
          warning(
            "Do not overclaim",
            "Report only what you can back up. “Twelve of fifteen customers said they now eat more fresh vegetables” is strong. “We are ending food insecurity in our neighborhood” will make partners and funders trust everything else you say a little less.",
          ),
          worksheet(
            "stakeholder-map.pdf",
            "A two-page template for mapping stakeholders by influence and effect, with a theory-of-change and measures planner.",
          ),
          task({
            title: "Stakeholder map and impact measures",
            instructions:
              "Map at least ten stakeholder groups by influence and effect. Hold listening conversations with at least two people from each of three groups, including one highly affected group with little influence. Use what you hear to write a one-sentence theory of change, then choose two or three outputs and one or two outcomes, with a plan for how and when you will collect each.",
            deliverable:
              "Your completed stakeholder map, notes from your listening conversations, your theory of change and your measurement plan.",
            requiresReview: true,
            rubric: [
              "The map is broad and includes groups that could be affected negatively.",
              "Listening conversations include at least one group with little influence.",
              "The theory of change is specific and connects your activity to change for people.",
              "Measures distinguish outputs from outcomes and are realistic to collect.",
            ],
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* li-5 Partnerships                                                 */
  /* ---------------------------------------------------------------- */
  {
    key: "li-5",
    trackSlug: "leadership-impact",
    order: 5,
    title: "Partnerships",
    summary:
      "Build partnerships with schools, organizations and local businesses that create value for both sides, and learn to make and manage the ask.",
    suggestedMonths: "Months 13–15",
    sessions: [
      {
        key: "li-5-1",
        kind: "reading",
        title: "What makes a good partner",
        summary:
          "The best partnerships serve both sides. Learn to find partners whose goals overlap with yours and to understand what they need.",
        durationMin: 12,
        blocks: [
          para(
            "A partnership is not a favor. The strongest partnerships happen when both sides get something they genuinely need. A youth center gets a free weekly activity; your venture gets space and trusted access to young people. A café fills a quiet weeknight; your study club gets a venue.",
            "Before you approach any potential partner, get clear on what they are trying to achieve. The more your venture helps them reach their own goals, the easier the conversation becomes.",
          ),
          heading("Signs of a strong potential partner"),
          bullets([
            "**Shared audience:** they already serve the people you want to reach.",
            "**Overlapping goals:** your success helps them succeed, and the other way around.",
            "**Complementary strengths:** they have what you lack, such as space, credibility, funding or reach, and you bring something they cannot easily do themselves.",
            "**Values fit:** you would be comfortable having your names side by side in public.",
          ]),
          example(
            "Zero-waste supplies and the PTA",
            "Mateo approached the parent-teacher association at his old elementary school about his zero-waste school supply totes. The PTA wanted to reduce waste and raise money; he wanted access to parents. They agreed the PTA would promote his pre-orders and keep $3 from every tote sold for its fundraising. Each side reached a goal it could not have reached alone.",
          ),
          warning(
            "Check what you are agreeing to",
            "Partnerships can involve commitments about money, data, branding or exclusivity. Before you agree to anything in writing, read it carefully and review it with your mentor or another trusted adult.",
          ),
        ],
      },
      {
        key: "li-5-2",
        kind: "video",
        title: "Making the first ask",
        summary:
          "How to research a potential partner, make a clear first approach and run a first meeting that leads somewhere.",
        durationMin: 7,
        blocks: [
          para(
            "Approaching an established organization can feel intimidating, especially when you are young and the people you are contacting are not. This video breaks the process into steps you can prepare for, from the first message to the follow-up after your meeting.",
          ),
          video("li-partnership-ask"),
          heading("Prepare before you reach out"),
          bullets([
            "Find the right person, not just the general inbox. Look for the role closest to your shared goal.",
            "Know one or two specific things about their recent work, and mention them.",
            "Be ready to explain what they gain in a single sentence.",
            "Suggest a small first step, such as a one-time pilot, instead of a long-term commitment.",
          ]),
          tip(
            "Follow up once, kindly",
            "If you hear nothing after a week, send one short, friendly follow-up. People are busy, and silence usually means your message got buried, not that the answer is no.",
          ),
        ],
      },
      {
        key: "li-5-3",
        kind: "task",
        title: "Draft a partnership proposal",
        summary:
          "Choose one potential partner, research what they need and write a one-page proposal for a small pilot partnership.",
        durationMin: 90,
        blocks: [
          para(
            "Choose one organization or business that could meaningfully help your venture grow. Your task is to write a short, specific proposal for a pilot: a small, time-limited trial that lets both sides test the relationship before committing to more.",
          ),
          steps([
            "Research the organization: its goals, audience and recent activities.",
            "Write down what they need and how your venture could help them get it.",
            "Define the pilot: what happens, for how long, who does what and what each side gets.",
            "Describe how you will both know whether the pilot worked.",
            "Share your draft with your mentor for feedback, and send it once you both agree it is ready.",
          ]),
          example(
            "Live music on a quiet night",
            "Kai built a simple booking page that connects young local musicians with cafés that want live music. His proposal to a café owner in Old Quay offered a four-week pilot: two free acoustic evenings a week, promoted to Kai's network of around 200 young musicians and fans, with the café comparing weeknight sales against the previous month. The owner said yes because the risk was low and the measure was clear.",
          ),
          worksheet(
            "stakeholder-map.pdf",
            "Use the stakeholder map to spot partners whose influence and interests overlap with yours.",
          ),
          task({
            title: "Pilot partnership proposal",
            instructions:
              "Write a one-page proposal for a pilot partnership with a specific organization or business. Explain what they need, how your venture helps, the details of the pilot and how both sides will measure success. Get feedback from your mentor before sending it.",
            deliverable: "Your one-page proposal, plus a short note on the feedback you received and the changes you made.",
            requiresReview: true,
            rubric: [
              "The proposal shows a clear understanding of the partner's goals.",
              "The pilot is specific, time-limited and low-risk for both sides.",
              "Success measures make sense from both perspectives.",
            ],
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* li-6 Pitching                                                     */
  /* ---------------------------------------------------------------- */
  {
    key: "li-6",
    trackSlug: "leadership-impact",
    order: 6,
    title: "Pitching",
    summary:
      "Tell the story of your venture clearly and persuasively in three minutes, to any audience, and handle the questions that follow.",
    suggestedMonths: "Months 16–18",
    sessions: [
      {
        key: "li-6-1",
        kind: "reading",
        title: "The shape of a three-minute pitch",
        summary:
          "A strong short pitch follows a clear structure. Learn the seven parts and how to fit them into three minutes.",
        durationMin: 14,
        blocks: [
          para(
            "Three minutes is enough time to make someone care about your venture, understand what it does and want to know more. It is not enough time to tell them everything. The hardest part of a short pitch is deciding what to leave out.",
            "Most strong pitches follow a similar shape. It is not a rigid formula, but it gives the audience what they need, in the order they need it.",
          ),
          heading("The seven parts"),
          steps([
            "**Hook:** a person, a moment or a striking fact that makes the problem real. About 20 seconds.",
            "**Problem:** who struggles, how often and why current options fall short.",
            "**Solution:** what you do, explained simply enough for anyone to repeat.",
            "**Evidence:** what you have learned or achieved: interviews, experiments, customers, results.",
            "**Model:** how the venture sustains itself.",
            "**Impact and vision:** the change you create now, and where it could go.",
            "**Ask:** exactly what you want from this audience.",
          ]),
          example(
            "A hook that works",
            "“Last winter, my neighbor Mr. Okafor went three weeks without video calling his grandkids because nobody could help him set up his new phone. There are people like him in every apartment building in Harborside.” In two sentences, Zara made her tech-help venture feel real and urgent.",
          ),
          tip(
            "Time every section",
            "Rehearse with a timer and write down how long each section takes. Most first drafts spend far too long on the problem and rush the evidence and the ask.",
          ),
        ],
      },
      {
        key: "li-6-2",
        kind: "reading",
        title: "Handling questions with confidence",
        summary:
          "Questions after a pitch are a chance to show how you think. Learn to prepare for them and answer clearly, even when you do not know.",
        durationMin: 12,
        blocks: [
          para(
            "For many audiences, the questions matter more than the pitch. They show how well you know your customers, your numbers and your weak spots. The good news is that most questions are predictable, which means you can prepare for them.",
          ),
          heading("Preparing"),
          bullets([
            "**List the twenty questions you most dread,** and write a short answer to each. The fear is usually worse than the question.",
            "**Know your key numbers** without looking: customers, revenue, costs, conversion and how you measure impact.",
            "**Practice with people who will push you,** such as your mentor or fellows from a different track.",
          ]),
          heading("Answering"),
          bullets([
            "**Pause before you answer.** A second to think looks confident, not unprepared.",
            "**Answer the question you were asked,** briefly, then stop. You can offer more detail if they want it.",
            "**Say when you do not know.** “I don't know yet, but here's how I'd find out” is a strong answer.",
            "**Treat hard questions as a good sign.** A tough question usually means the listener is taking you seriously.",
          ]),
          quote(
            "A judge asked what would happen if a bigger business copied us. I'd practiced that answer ten times. It turned into the best minute of my pitch.",
            "Dev, Summer 2026 fellow (fictional example)",
          ),
        ],
      },
      {
        key: "li-6-3",
        kind: "task",
        title: "Deliver a 3-minute pitch",
        summary:
          "Write, rehearse and record a three-minute pitch for your venture, then refine it using structured feedback from peers and your mentor.",
        durationMin: 240,
        showcase: true,
        blocks: [
          para(
            "This is the final showcase task of the Leadership & Impact track, and for many fellows it is the moment everything comes together. You will write a three-minute pitch for your venture, rehearse it until it feels natural, record it and improve it using feedback.",
            "Your pitch should reflect eighteen months of real work: the problem you discovered, the customers you listened to, the experiments you ran, the numbers you know and the community you serve. You are not pretending to be further along than you are. You are showing clearly where you are and why it matters.",
          ),
          heading("Know your audience and your ask"),
          para(
            "Before you write a word, decide who you are pitching to. A panel awarding small grants, a potential partner, a room of fellow founders and a local business network all want different things. Your ask should match: funding, a pilot, an introduction, volunteers or feedback. A pitch without a clear ask leaves the audience impressed but unsure what to do next.",
          ),
          heading("The process"),
          steps([
            "**Outline your pitch** using the seven-part structure and the pitch outline worksheet.",
            "**Write a full script,** then cut it until it fits three minutes read aloud at a natural pace, usually around 400 words.",
            "**Rehearse out loud** at least five times, timing each section. Stop reading from the script by your third rehearsal.",
            "**Deliver it live** to at least two people, and ask them to describe your venture back to you in one sentence.",
            "**Record your pitch** on video in a single take, standing up, with any slides you plan to use.",
            "**Collect feedback** against the rubric below, and make at least two specific improvements.",
          ]),
          heading("Worked example: the ASL conversation club"),
          para(
            "Ines pitched to a panel awarding small community grants. Her first draft opened with statistics about hearing loss and spent a full minute on background. Feedback from two fellows was consistent: they could not tell what the club actually did until halfway through.",
            "Her revised pitch opened with a single moment: a Deaf classmate who had stopped coming to a lunchtime study group because nobody could keep a conversation going with her. Ines explained the solution in one sentence (weekly practice pairs that match learners with fluent signers) and moved quickly to evidence: three semesters running, 28 regular participants, and a short survey in which most learners said they could now hold a basic conversation. Her ask was specific: funding for a Deaf ASL instructor to lead one session a month. The panel's first question was about expanding to a second campus.",
          ),
          tip(
            "End on your ask, then stop",
            "Close with your ask and one sentence about why it matters, then say thank you and stop talking. Adding “so, yeah, that's it” undoes much of what came before. Silence after a strong finish is fine.",
          ),
          warning(
            "Keep your claims honest",
            "Pitches reward confidence, which makes exaggeration tempting. Use your real numbers, and be clear about what is a plan and what has already happened. Panels are good at spotting inflated claims, and a single one can undermine an otherwise strong pitch.",
          ),
          worksheet(
            "pitch-outline.pdf",
            "A one-page outline for the seven parts of your pitch, with timing guides and a question-prep list.",
          ),
          task({
            title: "Three-minute pitch",
            instructions:
              "Write and rehearse a three-minute pitch for your venture, aimed at a specific audience with a clear ask. Deliver it live to at least two people, then record a single-take video. Collect feedback, make at least two improvements and submit your final recording with a short note on what you changed and why.",
            deliverable:
              "A video of your pitch (three minutes or less), your outline and a short note on the changes you made after feedback.",
            requiresReview: true,
            rubric: [
              "The pitch covers hook, problem, solution, evidence, model, impact and ask within three minutes.",
              "Evidence is specific, honest and drawn from your own work in the fellowship.",
              "Delivery is confident and natural, without reading from a script.",
              "The ask is specific and matched to the intended audience.",
            ],
          }),
        ],
      },
    ],
  },
];
