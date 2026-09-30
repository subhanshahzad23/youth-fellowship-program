import type { SeedModule } from "./types";
import { bullets, example, heading, para, quote, steps, task, tip, video, warning, worksheet } from "./blocks";

/**
 * Track 1: Founder Foundations.
 * Every name, venture and quote below is fictional.
 */
export const FOUNDER_FOUNDATIONS: SeedModule[] = [
  /* ---------------------------------------------------------------- */
  /* ff-1 Problem Discovery                                            */
  /* ---------------------------------------------------------------- */
  {
    key: "ff-1",
    trackSlug: "founder-foundations",
    order: 1,
    title: "Problem Discovery",
    summary:
      "Learn to spot problems that are frequent, painful and underserved, and to tell the difference between a real problem and an idea you have already fallen for.",
    suggestedMonths: "Months 1–3",
    sessions: [
      {
        key: "ff-1-1",
        kind: "reading",
        title: "Start with problems, not ideas",
        summary:
          "Why the strongest ventures begin with a problem someone already feels, and how to tell a real problem from a clever solution looking for a home.",
        durationMin: 12,
        blocks: [
          para(
            "Most first ideas arrive as solutions: an app, a subscription box, a new kind of club. That is how founders think. The trouble starts when the solution becomes the thing you protect, and you start collecting reasons it will work instead of evidence that anyone needs it.",
            "This fellowship asks you to flip the order. Before you design anything, get specific about **who** is struggling, **when** it happens and **what** they do about it today. A problem you can describe in that much detail is one you can actually build for.",
          ),
          heading("Three tests for a problem worth your time"),
          bullets([
            "**Frequent.** It happens often enough that people remember the last time. A problem someone faces once a year is hard to build a venture around.",
            "**Painful.** It costs time, money, stress or dignity. Mild annoyances rarely change what people do.",
            "**Underserved.** Current options are missing, expensive, awkward or built for someone else. If people already have a good fix, you need a sharper angle.",
          ]),
          example(
            "The broken bike problem",
            "Kwame noticed classmates at his Eastbank high school walking to school instead of riding the bikes they owned. His first idea was a bike-sharing app. When he asked why the bikes sat unused, the answer was almost always the same: a flat tire or a slipped chain, and nobody wanted to pay a shop $30 for a ten-minute fix. The real problem was small repairs, not access to bikes. That led to a student-run Saturday repair stand, not an app.",
          ),
          para(
            "Notice what changed. The problem statement got narrower and more honest, and the solution got cheaper to test. That is the pattern you are looking for throughout this module.",
          ),
          tip(
            "Write it as one sentence",
            "Try this format: *a specific person struggles to do something when a situation happens, because of a reason.* If you cannot fill in every part, you have found your next question, not a gap to guess at.",
          ),
        ],
      },
      {
        key: "ff-1-2",
        kind: "video",
        title: "Finding problems worth solving",
        summary:
          "A short walkthrough of where good problems hide and how to turn a vague frustration into a problem statement you can test.",
        durationMin: 7,
        blocks: [
          para(
            "Good problems rarely announce themselves. They hide in workarounds, in complaints people have stopped bothering to make, and in the places you already spend your time. This short video covers where to look and how to turn what you find into a clear problem statement.",
          ),
          video("ff-problems-worth-solving"),
          heading("After you watch"),
          bullets([
            "List three workarounds you have seen this week: a spreadsheet, a group chat, a sticky note, a favor from a friend. Each one points to a job that existing tools do badly.",
            "Circle the one that affects the most people you could realistically talk to in the next month.",
            "Rewrite it using the one-sentence problem statement from the previous session.",
          ]),
          quote(
            "I kept a note on my phone called “things that annoyed someone today.” After two weeks, the same complaint about booking last-minute hair appointments had shown up four times. That became my venture.",
            "Selin, Summer 2026 fellow (fictional example)",
          ),
          tip(
            "Look where you already are",
            "Your school, your job, your family and your neighborhood are research sites. You have access and context there that outsiders do not, which makes the first round of conversations much easier.",
          ),
        ],
      },
      {
        key: "ff-1-3",
        kind: "task",
        title: "Map a problem you have noticed",
        summary:
          "Use the problem discovery map to turn one observation into a clear, testable problem statement, then share it for feedback.",
        durationMin: 60,
        blocks: [
          para(
            "Time to put the three tests to work. Choose one problem you have seen firsthand, ideally at school, at work, in your neighborhood or in your family, and map it in detail. You are not proposing a solution yet. You are building the clearest possible picture of who struggles, how often and what they do today.",
          ),
          heading("How to approach it"),
          steps([
            "Write down three problems you have noticed in the last month. Keep each to one sentence.",
            "Score each one from 1 to 5 on frequency, pain and how underserved it is. Pick the highest total, unless you have a strong reason not to.",
            "Fill in the problem discovery map for that problem, including at least two current workarounds.",
            "Name one person you could talk to this week who lives with the problem.",
          ]),
          example(
            "After-school homework help",
            "Leila scored “younger kids struggling with homework” highly on frequency and pain. Her map showed that the families most affected in Millbrook were those where parents worked evening shifts, and that the usual workaround was an older cousin on a video call. That detail, evening shifts, shaped everything she tested next.",
          ),
          worksheet(
            "problem-discovery-map.pdf",
            "A one-page map to score your shortlist, describe who struggles and write your problem statement.",
          ),
          task({
            title: "Problem discovery map",
            instructions:
              "Complete the problem discovery map for one problem you have observed firsthand. Include your scored shortlist of three problems, the full map for the problem you chose, and a one-sentence problem statement: a specific person struggles to do something when a situation happens, because of a reason.",
            deliverable: "A photo or PDF of your completed map, plus your one-sentence problem statement.",
            requiresReview: true,
            rubric: [
              "The problem statement names a specific person and situation, not a broad group.",
              "At least two current workarounds are described in concrete terms.",
              "The scoring shows honest trade-offs between the three candidate problems.",
            ],
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* ff-2 Customer Interviews                                          */
  /* ---------------------------------------------------------------- */
  {
    key: "ff-2",
    trackSlug: "founder-foundations",
    order: 2,
    title: "Customer Interviews",
    summary:
      "Hold conversations that reveal what people actually do, not what they think you want to hear, and turn those conversations into decisions.",
    suggestedMonths: "Months 4–6",
    sessions: [
      {
        key: "ff-2-1",
        kind: "reading",
        title: "Interviews that get past politeness",
        summary:
          "People are kind to founders, and kindness makes for misleading data. Learn the question habits that surface real behavior.",
        durationMin: 15,
        blocks: [
          para(
            "Ask a friend whether they would use your idea and they will almost always say yes. Not because they are lying, but because saying no to someone's excitement feels rude. Politeness is the single biggest source of bad data in early ventures.",
            "The fix is not to be cold. It is to ask about the past instead of the future, and about their life instead of your idea. Past behavior is hard to exaggerate. Future intentions are easy.",
          ),
          heading("Swap these questions"),
          bullets([
            "Instead of *“Would you use an app that…?”* ask *“Tell me about the last time you tried to…”*",
            "Instead of *“How much would you pay?”* ask *“What have you spent on this in the past few months?”*",
            "Instead of *“Is this a problem for you?”* ask *“What's the hardest part of…?”* and notice whether they bring it up on their own.",
            "Instead of *“Do you like it?”* ask *“What would you have to stop doing to make room for this?”*",
          ]),
          heading("Listen for signals, not compliments"),
          para(
            "A compliment (“That's such a cool idea!”) tells you almost nothing. A signal does: they describe a specific recent struggle, they have already tried to fix it, they ask when they can try yours, or they introduce you to someone else with the same problem. Write signals down word for word.",
          ),
          example(
            "The refill station",
            "Two fellows planning a neighborhood refill station for dish soap and laundry detergent in Harborside first asked, “Would you bring your own bottles?” Everyone said yes. When they changed the question to “What did you do with your last empty bottle?”, most people admitted it went straight into the recycling bin. That answer did not kill the idea. It told them they would need to supply the first bottle.",
          ),
        ],
      },
      {
        key: "ff-2-2",
        kind: "reading",
        title: "Finding people to talk to",
        summary:
          "Where to find interviewees when you have no network, how to ask, and how to keep every conversation respectful and safe.",
        durationMin: 12,
        blocks: [
          para(
            "The most common reason founders skip interviews is not fear of the conversation. It is not knowing who to ask. Start closer than you think. You need people who experience the problem, not people who are important.",
          ),
          heading("Where to look"),
          bullets([
            "**Where the problem happens.** If it is about laundry, go where students do laundry. If it is about small shops taking bookings, visit the shops during a quiet hour.",
            "**Online groups** where people already complain about the problem: neighborhood forums, school or club group chats, parent groups.",
            "**One introduction at a time.** End every interview by asking, “Who else should I talk to about this?” One good conversation often leads to three more.",
          ]),
          heading("How to ask"),
          para(
            "Keep your request short, specific and easy to decline. Say who you are, why you are asking them in particular, how long it will take, and that you are not selling anything. Twenty minutes is an easy yes. “A quick chat sometime” is not.",
          ),
          example(
            "A first message that works",
            "“Hi, I'm Sam, a student in the Launchpad Fellowship. I'm researching how independent hair salons in Old Quay handle bookings and cancellations. Could I ask you a few questions for 20 minutes this week? I'm not selling anything. I'm trying to understand the problem first.”",
          ),
          warning(
            "Stay safe and respectful",
            "Meet in public places, or talk by phone or video. Tell someone where you will be. Never interview anyone under 16 without a parent or guardian's permission, and do not record a conversation without asking first. If someone says no, thank them and move on.",
          ),
        ],
      },
      {
        key: "ff-2-3",
        kind: "task",
        title: "Run five customer interviews",
        summary:
          "Plan, run and write up five interviews with people who live with your problem, then identify the patterns that should shape your next step.",
        durationMin: 240,
        showcase: true,
        blocks: [
          para(
            "This is where your venture starts to meet the real world. Over the next two weeks you will talk with five people who experience the problem you mapped in Module 1. Five is not a statistically meaningful number, and it does not need to be. Five good conversations are enough to show you whether your problem statement holds up, where it is wrong and what you should ask next.",
            "The goal is not to validate your idea. The goal is to learn something you did not know before. If every interview confirms exactly what you expected, you are probably asking leading questions.",
          ),
          heading("Before you start"),
          para(
            "Revisit your problem statement and write down the three things you most need to learn. These become the backbone of your interview. Then choose your five people deliberately. At least three should be people you do not already know well, because friends are the most likely to be polite rather than honest.",
          ),
          heading("The process"),
          steps([
            "**Write your learning goals.** Three questions you need answered, such as how often the problem happens, what people do today and what their current fix costs them.",
            "**Draft your interview guide** using the worksheet. Start broad (“Tell me about the last time…”), then go deeper with follow-ups (“What happened next?”, “Why was that hard?”).",
            "**Recruit five interviewees** using the approaches from the previous session. Aim for a mix of ages or situations within your target group.",
            "**Run each interview** for 20 to 30 minutes. Talk for less than a third of the time. Take notes on what people did, not just how they felt.",
            "**Write up each interview within 24 hours,** while it is fresh: three key quotes, the workarounds they described and anything that surprised you.",
            "**Look for patterns** across all five. What came up three or more times? What contradicted your assumptions?",
          ]),
          heading("Worked example: the community garden produce box"),
          para(
            "Rahel wanted to sell weekly produce boxes from her Millbrook community garden to neighbors. Her learning goals were: where do neighbors buy vegetables now, what frustrates them about it, and would they commit to something every week.",
            "Across five interviews, a pattern showed up quickly. Four people said they bought vegetables at a supermarket twenty minutes away by bus, and three mentioned throwing out produce because they had bought more than they could use. Nobody complained about price. Two people, both older residents, said the hardest part was carrying heavy bags home.",
            "That changed her plan. Instead of a large weekly box, she tested a smaller box delivered to the door on the same day each week. The interviews did not tell her what to build. They told her which assumption to test next.",
          ),
          quote(
            "I went in convinced price was the problem. Not one person mentioned it. They mentioned carrying bags up the stairs.",
            "Rahel, Summer 2026 fellow (fictional example)",
          ),
          tip(
            "Ask for the story, then stay quiet",
            "When someone starts describing a specific time something went wrong, resist the urge to jump in with your idea. Count to three in your head after they stop talking. People often add the most useful detail in that pause.",
          ),
          warning(
            "Do not pitch during the interview",
            "The moment you describe your solution, the conversation turns into feedback on your idea, and politeness takes over. If you want reactions to a concept, save it for the last five minutes, after you have heard their story in full.",
          ),
          worksheet(
            "customer-interview-guide.pdf",
            "A question bank, interview plan and write-up template for your five conversations.",
          ),
          task({
            title: "Five customer interviews",
            instructions:
              "Run five interviews of 20 to 30 minutes with people who experience your problem. At least three should be people you did not know well before. Use the interview guide to plan, and write up each conversation within a day. Finish with a one-page synthesis: the patterns you heard, the assumptions that were confirmed or broken, and the one question you will investigate next.",
            deliverable: "Your five interview write-ups and a one-page synthesis, uploaded as a single document.",
            requiresReview: true,
            rubric: [
              "Interviews focus on past behavior and real examples rather than opinions about the idea.",
              "Each write-up includes direct quotes and at least one concrete workaround or cost.",
              "The synthesis identifies patterns across interviews and names at least one assumption that changed.",
              "The next question is specific and follows logically from what was heard.",
            ],
          }),
        ],
      },
      {
        key: "ff-2-4",
        kind: "reading",
        title: "Making sense of what you heard",
        summary:
          "Turn a pile of interview notes into clear patterns, and decide what to do when the evidence surprises you.",
        durationMin: 12,
        blocks: [
          para(
            "After five or more interviews, your notes will feel messy. Some people contradicted each other. One person gave a brilliant answer you cannot stop thinking about. That is normal. Synthesis is the step where you stop reacting to individual conversations and start seeing the shape of the problem.",
          ),
          heading("A simple synthesis method"),
          steps([
            "Put every meaningful quote or observation on its own sticky note, or its own line in a document.",
            "Group the notes by theme without deciding the themes in advance. Let the clusters form on their own.",
            "Name each cluster with a short sentence, such as “Parents only find out about homework the night before it's due.”",
            "Count how many different people contributed to each cluster. One vivid story is not a pattern.",
          ]),
          para(
            "Then ask the honest question: does this change my problem statement? Often it sharpens it. Sometimes it moves it to a different person entirely, as the example below shows.",
          ),
          example(
            "The sign-language study club",
            "Ines set out to help hearing students at her community college learn American Sign Language through a weekly study club. Her interviews kept pointing somewhere else. Deaf students said the bigger problem was classmates who wanted to learn but gave up after a few weeks because they had nobody to practice with. She reframed the club around conversation practice pairs instead of lessons: the same idea, pointed at the real problem.",
          ),
          tip(
            "Separate facts from interpretations",
            "Keep two columns: what people said or did, and what you think it means. Mentors and reviewers will trust your conclusions far more when they can see the evidence underneath.",
          ),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* ff-3 Value Propositions                                           */
  /* ---------------------------------------------------------------- */
  {
    key: "ff-3",
    trackSlug: "founder-foundations",
    order: 3,
    title: "Value Propositions",
    summary:
      "Turn what you learned from customers into a clear promise: who you help, what changes for them and why your approach beats their current option.",
    suggestedMonths: "Months 7–9",
    sessions: [
      {
        key: "ff-3-1",
        kind: "reading",
        title: "Jobs, pains and gains",
        summary:
          "Use the jobs-to-be-done lens to describe what customers are really trying to achieve, and what gets in their way.",
        durationMin: 15,
        blocks: [
          para(
            "People do not buy products. They hire them to make progress. A student does not want a tutoring session; they want to walk into a math test without dread. A café owner does not want booking software; they want to stop losing Saturday mornings to phone calls. This is the idea behind *jobs to be done*, and it is the foundation of a strong value proposition.",
          ),
          heading("Three layers to describe"),
          bullets([
            "**Jobs** are what the customer is trying to get done. Include the functional job (finish the homework), the emotional job (feel capable) and the social job (not look behind in front of friends).",
            "**Pains** are what makes the job hard, risky or annoying today: cost, time, confusion, embarrassment, unreliable options.",
            "**Gains** are the outcomes that would delight them: time back, more confidence, something they did not expect to be possible.",
          ]),
          para(
            "Rank the pains by intensity. Your value proposition does not need to address all of them. It needs to address the ones that matter most, better than anything else available.",
          ),
          example(
            "Zero-waste school supplies",
            "Mateo mapped the jobs of parents buying back-to-school supplies. The functional job was obvious: get everything on the list before the first day. But the strongest pain was emotional. Parents who cared about waste felt guilty buying plastic-wrapped packs and had no time to hunt for alternatives. His value proposition became “the complete supply list, waste-free, delivered in one reusable tote,” which addressed the time pain and the guilt in a single sentence.",
          ),
          tip(
            "Use their words, not yours",
            "Pull the language for jobs, pains and gains straight from your interview notes. If a parent said “homework meltdowns,” write that, not “academic stress.” Customers recognize themselves in their own words.",
          ),
        ],
      },
      {
        key: "ff-3-2",
        kind: "video",
        title: "Writing a value proposition people repeat",
        summary:
          "How to turn your jobs, pains and gains into one clear sentence, and how to tell whether it is working.",
        durationMin: 7,
        blocks: [
          para(
            "A value proposition is not a slogan. It is a promise specific enough that the right customer recognizes themselves in it immediately, and the wrong customer knows it is not for them. This video walks through a simple structure and three common mistakes.",
          ),
          video("ff-value-propositions"),
          heading("The structure in brief"),
          para(
            "**For** a specific customer **who** has a specific problem, **our** offer **gives** a concrete outcome, **unlike** the current alternative, **because** of what makes your approach different.",
            "You will rarely say it in exactly that form. But writing it out in full forces you to fill in every part, and the weak spots become obvious fast.",
          ),
          tip(
            "The repeat test",
            "Explain your offer to someone in one or two sentences, then ask them to describe it to a third person. If what they say matches what you meant, your value proposition is clear. If it drifts, simplify.",
          ),
        ],
      },
      {
        key: "ff-3-3",
        kind: "task",
        title: "Draft and test your value proposition",
        summary:
          "Complete a value proposition canvas, write three versions of your promise and test them with real people to see which one lands.",
        durationMin: 90,
        blocks: [
          para(
            "You now have interview evidence and a sharper problem statement. In this task you will turn both into a value proposition and put it in front of people quickly, before you spend any time on a logo, website or name.",
          ),
          steps([
            "Fill in the customer side of the canvas using quotes from your interviews, not guesses.",
            "Fill in the offer side: what you provide, which pains it relieves and which gains it creates.",
            "Write three different one-sentence value propositions, each leading with a different pain or gain.",
            "Show all three to at least five people in your target group. Ask which one feels most like it was written for them, and why.",
          ]),
          example(
            "An accessible tutoring service",
            "Farah tested three versions of her tutoring promise with parents of kids with dyslexia. The version about “certified tutors” got polite nods. The version about “homework time that ends without tears” got parents leaning in and telling stories. She kept the second one and rebuilt her flyer around it.",
          ),
          worksheet(
            "value-proposition-canvas.pdf",
            "Map customer jobs, pains and gains against your offer, with space for three drafts.",
          ),
          task({
            title: "Value proposition test",
            instructions:
              "Complete the value proposition canvas using evidence from your interviews. Write three one-sentence value propositions that each lead with a different pain or gain, and test them with at least five people from your target group. Record which version resonated and the words people used in response.",
            deliverable:
              "Your completed canvas, your three drafts and a short summary of the test results, including the version you chose and why.",
            requiresReview: true,
            rubric: [
              "The customer side of the canvas is grounded in interview quotes or observations.",
              "The three drafts are genuinely different, not rewordings of the same sentence.",
              "The final choice is justified with evidence from the test.",
            ],
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* ff-4 Experiment Design                                            */
  /* ---------------------------------------------------------------- */
  {
    key: "ff-4",
    trackSlug: "founder-foundations",
    order: 4,
    title: "Experiment Design",
    summary:
      "Identify the assumptions your venture depends on, then design small, cheap experiments that show whether they are true.",
    suggestedMonths: "Months 10–12",
    sessions: [
      {
        key: "ff-4-1",
        kind: "reading",
        title: "Test your riskiest assumption first",
        summary:
          "Every venture rests on assumptions. Learn to list them, rank them by risk and focus your energy where being wrong would hurt most.",
        durationMin: 14,
        blocks: [
          para(
            "Your venture is built on a stack of beliefs. People have this problem. They will pay to solve it. You can reach them. You can deliver at a cost that works. Some of these you have already tested through interviews. Others are still guesses dressed up as plans.",
            "An experiment is simply a structured way to check one guess before you bet time and money on it. The skill is choosing which guess to check first.",
          ),
          heading("Rank assumptions on two dimensions"),
          bullets([
            "**Importance:** if this turned out to be false, would the venture still work? If not, it is critical.",
            "**Evidence:** how much real evidence do you have? Opinions and enthusiasm count for very little. Actions such as sign-ups, deposits and repeat visits count for a lot.",
          ]),
          para(
            "Your riskiest assumption is the one that is highly important and has little evidence behind it. That is where your next experiment goes, even if it is not the most fun one to run.",
          ),
          example(
            "The repair café",
            "Oskar planned a monthly repair café in Old Quay where volunteers fix broken lamps, toasters and clothes. He assumed people would bring items, volunteers would show up, and the library would host it for free. His riskiest assumption was not demand; his interviews showed plenty. It was whether skilled volunteers would commit to one Saturday a month. So his first experiment was recruiting volunteers, not advertising the event.",
          ),
          warning(
            "Beware the comfortable test",
            "Founders tend to test what they are good at instead of what is uncertain. If you love design, you will be tempted to test the logo. Ask yourself honestly: is this experiment reducing my biggest risk, or just keeping me busy?",
          ),
        ],
      },
      {
        key: "ff-4-2",
        kind: "reading",
        title: "Cheap tests that give real signals",
        summary:
          "A toolkit of low-cost experiment types, from sign-up pages to doing the service by hand, and when to use each one.",
        durationMin: 15,
        blocks: [
          para(
            "You do not need a finished product to learn whether people want it. Some of the most useful experiments take an afternoon and cost almost nothing. What matters is that they ask people to *do* something, not just say something.",
          ),
          heading("Four experiment types"),
          bullets([
            "**Landing page or sign-up form.** Describe the offer and ask for an email, a pre-order or a waitlist spot. Tests whether the promise is compelling enough to act on.",
            "**Concierge test.** Deliver the service by hand to a few customers, with no technology. Tests whether the outcome is valuable before you automate anything.",
            "**Behind-the-curtain test.** The customer sees a simple front end, but you do the work manually behind it. Tests the full experience without building the system.",
            "**Pre-sale or deposit.** Ask for a small commitment of money before the product exists. The strongest early signal of demand you can get.",
          ]),
          example(
            "A booking tool for barbers",
            "Tomás wanted to build booking software for independent barbers in Greater Larkhaven. Instead of writing code, he offered three barbers a free month in which customers booked through a simple online form and he updated each barber's calendar by hand, texting confirmations himself. Within two weeks he knew which features mattered (reminders and deposits) and which ones nobody used.",
          ),
          tip(
            "Set your success line before you start",
            "Decide in advance what result counts as a pass. “At least 15 of the first 100 visitors join the waitlist” is a clear line. Deciding after you see the numbers makes it far too easy to call anything a success.",
          ),
        ],
      },
      {
        key: "ff-4-3",
        kind: "task",
        title: "Design and run your first experiment",
        summary:
          "Pick your riskiest assumption, design a small experiment with a clear success line, run it for one to two weeks and decide what happens next.",
        durationMin: 180,
        showcase: true,
        blocks: [
          para(
            "This task brings the module together. You will choose the single assumption that matters most right now, design an experiment that could prove it wrong, run it and make a decision based on the result. The experiment should be small enough to finish in two weeks and cheap enough that you can afford to be wrong.",
            "A good experiment is not one that succeeds. It is one that produces a clear answer. A result that tells you to change direction early is worth far more than a vague result that lets you keep believing what you already believed.",
          ),
          heading("The experiment card"),
          para(
            "Every experiment in this fellowship is written on an experiment card before it runs. The card has four parts: the **hypothesis** you are testing, the **test** you will run, the **metric** you will measure and the **success line** that decides pass or fail. Writing it down first protects you from moving the goalposts later.",
          ),
          heading("The process"),
          steps([
            "**List your assumptions.** Write at least eight, covering customers, value, reach, delivery and money.",
            "**Rank them** by importance and evidence. Circle the one that is most important and least proven.",
            "**Write your hypothesis** as a statement that could be proven false: “We believe that [customer] will [action] because [reason].”",
            "**Choose the cheapest test** that could disprove it. Prefer tests that ask people to act.",
            "**Set your metric and success line** before you begin, and note the date the test will end.",
            "**Run the test** and record results daily. Note anything surprising, even if it is outside your metric.",
            "**Decide:** persevere, adjust or change direction. Write down what you will do next and why.",
          ]),
          heading("Worked example: a student-run bike repair stand"),
          para(
            "Remember Kwame's Saturday repair stand from Module 1? After his interviews, his riskiest assumption was that students would pay for small repairs instead of just asking a friend for help. His experiment card read:",
          ),
          bullets([
            "**Hypothesis:** Students with broken bikes will pay a flat $8 for a same-day repair at school.",
            "**Test:** Two Saturday pop-up stands in the school parking lot, advertised on bulletin boards and in two group chats.",
            "**Metric:** Number of paid repairs across both Saturdays.",
            "**Success line:** At least 12 paid repairs. Fewer than 6 means rethink the model.",
          ]),
          para(
            "He completed 9 paid repairs, which landed between his two lines. Instead of calling it a win or a failure, he looked closer. Seven of the nine came on the second Saturday, after a friend posted a before-and-after video. His next experiment tested whether short videos reliably drove bookings, and he kept the stand running while he found out.",
          ),
          tip(
            "Change one thing at a time",
            "If you change the price, the location and the message all at once, you will not know which one made the difference. Where you can, change one variable per experiment.",
          ),
          warning(
            "Taking money as a young founder",
            "If your experiment involves taking money, keep it simple and transparent: tell people exactly what they are paying for, offer a refund if you cannot deliver, and check with a parent, guardian or your mentor before accepting payments online if you are under 18.",
          ),
          worksheet(
            "experiment-card.pdf",
            "A one-page card for your hypothesis, test, metric and success line, plus a daily results log.",
          ),
          task({
            title: "First experiment",
            instructions:
              "Complete an experiment card for your riskiest assumption, run the experiment for one to two weeks and write a short results summary. The summary should state the result against your success line, what surprised you and your decision: persevere, adjust or change direction.",
            deliverable: "Your completed experiment card, your results log and a decision summary of no more than one page.",
            requiresReview: true,
            rubric: [
              "The chosen assumption is clearly important and previously unproven.",
              "The hypothesis can be proven false, and the success line was set before the test ran.",
              "Results are reported honestly, including anything that did not go to plan.",
              "The decision follows logically from the evidence.",
            ],
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* ff-5 Business Models                                              */
  /* ---------------------------------------------------------------- */
  {
    key: "ff-5",
    trackSlug: "founder-foundations",
    order: 5,
    title: "Business Models",
    summary:
      "Understand how your venture creates, delivers and captures value, and compare models before committing to one.",
    suggestedMonths: "Months 13–15",
    sessions: [
      {
        key: "ff-5-1",
        kind: "reading",
        title: "How a venture sustains itself",
        summary:
          "A business model is the logic of how your venture keeps going. Learn its core parts and how they fit together.",
        durationMin: 14,
        blocks: [
          para(
            "A great product with no way to sustain itself is a project, not a venture. That is not a criticism; plenty of valuable work is project-shaped. But if you want what you are building to last beyond your own free time, you need a model: a clear account of who you serve, how you reach them, what it costs to deliver and where the money comes from.",
          ),
          heading("Six core questions"),
          bullets([
            "**Customer:** who pays, and are they the same person who uses it?",
            "**Value:** what outcome do they get that is worth paying for?",
            "**Channel:** how do they find you, and how do you deliver?",
            "**Revenue:** how, when and how often do you get paid?",
            "**Costs:** what do you spend every time you deliver, and what do you spend regardless?",
            "**Key resources:** what do you depend on that is hard to get, such as skills, space, relationships or trust?",
          ]),
          para(
            "Change the answer to any one of these and the whole model shifts. A tutoring service paid for by parents looks very different from the same service paid for by a school district or a local foundation.",
          ),
          example(
            "The tool library",
            "Bea and Idris started a neighborhood tool library in Eastbank so people could borrow drills and ladders instead of buying them. Their first model charged $3 per borrow, which was fiddly to manage and earned little. Switching to a $25 annual membership with unlimited borrowing simplified everything: predictable income, less cash to handle, and members who felt a sense of ownership over the collection.",
          ),
          tip(
            "Sketch before you spreadsheet",
            "Draw your model on one page before building any financial projections. If you cannot explain it in six short answers, a spreadsheet will only hide the confusion.",
          ),
        ],
      },
      {
        key: "ff-5-2",
        kind: "reading",
        title: "Who pays and who uses",
        summary:
          "Many youth-led ventures serve one group and are paid for by another. Learn the common patterns and their trade-offs.",
        durationMin: 12,
        blocks: [
          para(
            "In a simple venture, the person who uses the product pays for it. But many ventures, especially social ones, split those roles. A free homework club might be paid for by a school. A free app for students might be paid for by the cafés it sends customers to. Getting clear on this split is one of the most important decisions you will make.",
          ),
          heading("Common patterns"),
          bullets([
            "**Direct:** users pay you directly, per item or by subscription. Simple and honest, but your users must be able to afford it.",
            "**Third-party payer:** a school, employer, city program or foundation pays so users do not have to. Widens access, but you must satisfy two groups with different needs.",
            "**Cross-subsidy:** some customers pay more so others can pay less or nothing. Common in community ventures, but it needs clear rules to feel fair.",
            "**Marketplace:** you connect two groups and take a fee from one or both sides. Powerful, but you have to build both sides at once.",
          ]),
          example(
            "Tech help for grandparents",
            "Zara ran weekly drop-in sessions at the Harborside senior center, helping older residents with video calls and booking doctor's appointments online. Most attendees were retirees on fixed incomes, but their adult children, who were tired of troubleshooting over the phone, were happy to pay. She kept the drop-ins free and offered a paid family plan with home visits: a cross-subsidy where the families who valued it most covered the cost.",
          ),
          tip(
            "Draw the money flow",
            "Sketch every group involved as a box, then draw arrows for who gives what to whom: money, time, attention, data. If any arrow feels uncomfortable to explain out loud, look at it closely.",
          ),
        ],
      },
      {
        key: "ff-5-3",
        kind: "task",
        title: "Sketch two business models",
        summary:
          "Design two different business models for your venture and compare them honestly on reach, sustainability and fit with your values.",
        durationMin: 75,
        blocks: [
          para(
            "Most founders pick the first business model that comes to mind and never look back. In this task you will deliberately design two, so you can see the trade-offs clearly before you commit to either.",
          ),
          steps([
            "Describe your current model using the six core questions from the first session.",
            "Design a second model that changes who pays or how they pay. It should be a real alternative, not a small tweak.",
            "Compare both on four things: how many people you could reach, how reliable the income would be, what it costs to run and how well it fits the impact you want to have.",
            "Pick one to test next, and name the assumption in that model you are least sure about.",
          ]),
          example(
            "Formal wear for school dances",
            "Camila compared two models for her secondhand formal-wear rental ahead of prom season. Model A charged students $20 per rental. Model B sold a season package to high schools, which offered free rentals to students who needed financial support. Model A was simpler to start; Model B reached students who would never have rented at all. She launched A for one season while pitching B to two schools.",
          ),
          task({
            title: "Two business models",
            instructions:
              "Using the six core questions, describe two genuinely different business models for your venture. Compare them on reach, income reliability, running costs and fit with your intended impact. Choose one to test next and identify its riskiest assumption.",
            deliverable: "A one-page comparison of both models, with your chosen direction and the assumption you will test.",
            requiresReview: true,
            rubric: [
              "Both models are complete and meaningfully different from each other.",
              "The comparison is honest about weaknesses as well as strengths.",
              "The chosen direction is linked to a clear, testable assumption.",
            ],
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* ff-6 Founder Habits                                               */
  /* ---------------------------------------------------------------- */
  {
    key: "ff-6",
    trackSlug: "founder-foundations",
    order: 6,
    title: "Founder Habits",
    summary:
      "Build the routines that keep a venture moving alongside school, work and life: weekly reviews, focused priorities and sustainable energy.",
    suggestedMonths: "Months 16–18",
    sessions: [
      {
        key: "ff-6-1",
        kind: "reading",
        title: "The weekly founder review",
        summary:
          "A 30-minute weekly routine that keeps you honest about progress, priorities and what to stop doing.",
        durationMin: 10,
        blocks: [
          para(
            "Momentum in an early venture rarely comes from big breakthroughs. It comes from small, steady progress that compounds. The founders who make that progress usually have one thing in common: a regular moment where they step back, look at the whole picture and decide what matters next.",
          ),
          heading("Four questions, every week"),
          steps([
            "**What did I learn?** Not what did I do, but what do I know now that I did not know last week?",
            "**What moved forward?** Name the one or two things that genuinely progressed the venture.",
            "**What is stuck?** Be specific about why. Waiting on someone? Avoiding something uncomfortable?",
            "**What are my top three for next week?** If everything is a priority, nothing is.",
          ]),
          para(
            "Keep your answers in one running document so you can look back. After a few months, the review becomes a record of how your thinking has changed, which is useful for mentor conversations, college and scholarship applications, and your own confidence.",
          ),
          tip(
            "Same time, same place",
            "Attach the review to something you already do, like Sunday evening after dinner. Habits stick when they have a trigger, not when they depend on remembering.",
          ),
        ],
      },
      {
        key: "ff-6-2",
        kind: "reading",
        title: "Energy, commitments and saying no",
        summary:
          "Building a venture while studying or working is demanding. Learn to protect your energy and make deliberate trade-offs.",
        durationMin: 12,
        blocks: [
          para(
            "You are probably building your venture alongside classes, a job, family responsibilities or all three. That is not a disadvantage to hide. It is the reality most founders work in, and learning to manage it now is a skill that lasts.",
            "The goal is not to work more hours. It is to spend the hours you have on the things that matter, and to recover properly so you can keep going for eighteen months and beyond.",
          ),
          heading("Practical habits"),
          bullets([
            "**Plan around your real calendar.** Block out finals, big work weeks and family commitments first, then fit venture goals around them instead of pretending they will not happen.",
            "**Protect one deep-work block** each week: two uninterrupted hours for your hardest task, with your phone in another room.",
            "**Say no with a reason.** Every new opportunity takes time from something else. “Not this semester, because I'm focused on my first ten customers” is a complete answer.",
            "**Notice the warning signs,** such as dreading your venture, sleeping badly or dropping things you used to enjoy. They are signals to adjust, not failures.",
          ]),
          quote(
            "I used to feel guilty on weeks I did nothing for the venture. My mentor asked me to plan those weeks in advance instead. Now finals week is a decision, not a failure.",
            "Yusuf, Summer 2026 fellow (fictional example)",
          ),
          warning(
            "Ask for help early",
            "If stress is affecting your health, sleep or studies, talk to your mentor or program staff. Asking for support is part of being a founder, not a sign you are not cut out for it.",
          ),
        ],
      },
      {
        key: "ff-6-3",
        kind: "task",
        title: "Run your first weekly review",
        summary:
          "Complete one weekly founder review and set your top three priorities for next week. A quick reflection, not a graded piece.",
        durationMin: 30,
        blocks: [
          para(
            "This is a short, personal task. Set aside 30 minutes this week, answer the four review questions honestly and share them here. There are no right answers, and this reflection is not graded. It is a starting point for your next mentor conversation.",
          ),
          heading("What to include"),
          bullets([
            "One thing you learned this week about your customers, your venture or yourself.",
            "What moved forward and what is stuck, with a sentence on why.",
            "Your top three priorities for next week, each small enough to finish.",
            "One commitment you are going to protect, and one thing you will say no to.",
          ]),
          example(
            "A review in practice",
            "Hana, who runs a plant-swap stall at the Old Quay farmers market, wrote: “Learned: people come for rare cuttings, not common ones. Moved forward: booked two more market dates. Stuck: haven't emailed the garden center because I'm nervous. Top three: email the garden center, label every cutting with care instructions, post the swap dates.” Short, honest and specific is exactly right.",
          ),
          task({
            title: "Weekly founder review",
            instructions:
              "Answer the four weekly review questions for this week and list your top three priorities for next week. Add one commitment you will protect and one thing you will say no to.",
            deliverable: "Your written review, in a few short paragraphs or bullet points.",
            requiresReview: false,
          }),
        ],
      },
    ],
  },
];
