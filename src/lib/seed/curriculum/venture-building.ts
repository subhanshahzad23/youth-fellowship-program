import type { SeedModule } from "./types";
import { bullets, example, heading, para, quote, steps, task, tip, video, warning, worksheet } from "./blocks";

/**
 * Track 2: Venture Building.
 * Every name, venture and quote below is fictional.
 */
export const VENTURE_BUILDING: SeedModule[] = [
  /* ---------------------------------------------------------------- */
  /* vb-1 Prototyping                                                  */
  /* ---------------------------------------------------------------- */
  {
    key: "vb-1",
    trackSlug: "venture-building",
    order: 1,
    title: "Prototyping",
    summary:
      "Make your idea tangible fast. Build rough prototypes that answer specific questions, and get them in front of people before they feel ready.",
    suggestedMonths: "Months 1–3",
    sessions: [
      {
        key: "vb-1-1",
        kind: "reading",
        title: "Prototypes answer questions",
        summary:
          "A prototype is not an early version of your product. It is a tool for learning one thing quickly. Learn to choose the right level of detail for the question.",
        durationMin: 12,
        blocks: [
          para(
            "Founders often wait to show their work until it looks finished. By then they have spent weeks building things nobody asked for. A prototype flips that: you build the smallest thing that lets someone react, specifically so you can find out what to change.",
            "Every prototype should start with a question. *Can people figure out how to book without help? Will parents trust a tutor they found online? Does the box fit in a bike basket?* The question decides what you build.",
          ),
          heading("Match the fidelity to the question"),
          bullets([
            "**Paper and sketches** for flow and layout: what happens first, what comes next, where do people get lost?",
            "**Clickable mock-ups** for digital products, made with a free design tool, to test navigation and wording.",
            "**Physical mock-ups** from cardboard, tape and things you already own, to test size, feel and use.",
            "**Service walk-throughs** for services: act out the customer's experience from first contact to finish, with a friend playing the customer.",
          ]),
          example(
            "The community fridge",
            "A group of fellows wanted to put a community fridge outside a youth center in Harborside. Before buying anything, they taped out the fridge's footprint on the sidewalk and stood next to it for an afternoon with a clipboard. They learned it blocked a wheelchair route, and that most people walking by did not understand what it was for. Both problems were solved for the cost of a roll of tape.",
          ),
          tip(
            "Make it slightly embarrassing",
            "If you are proud of how polished your first prototype looks, you probably spent too long on it. Rough prototypes invite honest feedback, because people do not worry about hurting your feelings.",
          ),
        ],
      },
      {
        key: "vb-1-2",
        kind: "video",
        title: "From sketch to clickable prototype",
        summary:
          "Follow one idea from a paper sketch to a simple clickable prototype, and see how to run a quick test with five people.",
        durationMin: 7,
        blocks: [
          para(
            "In this video, a study-space finder for college students goes from a paper sketch to a clickable prototype in an afternoon, and then into the hands of five testers. Watch for the moments where the plan changes because of what the testers actually do.",
          ),
          video("vb-prototyping-basics"),
          heading("Key takeaways"),
          bullets([
            "Sketch at least three different versions before choosing one to develop. The first idea is rarely the best one.",
            "Give testers a task, not a tour: “Find a quiet place to study near you that's open after 9 p.m.”",
            "Watch what they do. Where they hesitate matters more than what they say afterward.",
            "Fix the biggest problem, then test again. Two quick rounds beat one perfect one.",
          ]),
          tip(
            "Say this before every test",
            "“You can't do anything wrong here. If something is confusing, that's a problem with my design, not with you.” People relax, and you get far more honest behavior.",
          ),
        ],
      },
      {
        key: "vb-1-3",
        kind: "task",
        title: "Build and test a rough prototype",
        summary:
          "Build a low-cost prototype that answers one specific question about your venture, test it with five people and document what you learned.",
        durationMin: 120,
        blocks: [
          para(
            "This task is about speed and learning. You have one week to build something rough enough to make quickly and real enough for people to react to. Choose the format that fits your question: paper, clickable, physical or a service walk-through.",
          ),
          steps([
            "Write down the one question your prototype needs to answer.",
            "Pick the simplest format that can answer it, and build it in no more than a few hours.",
            "Test with five people from your target group. Give each one a realistic task and observe without helping.",
            "Note where each person hesitated, got confused or did something you did not expect.",
            "Make one round of changes, and describe what you would test next.",
          ]),
          example(
            "E-waste pickup",
            "Marcus prototyped a door-to-door e-waste pickup service in Millbrook with nothing more than a printed flyer and an online booking form. His question was whether people understood what counted as e-waste. Three of his five testers asked whether they could include old batteries and light bulbs, so his next version listed exactly what he could and could not collect.",
          ),
          task({
            title: "Rough prototype test",
            instructions:
              "Build a low-fidelity prototype that answers one clearly stated question about your venture. Test it with five people from your target group, observing what they do as they attempt a realistic task. Document your observations and the changes you made as a result.",
            deliverable:
              "Photos, screenshots or a short video of your prototype, plus a one-page summary of your question, observations and changes.",
            requiresReview: true,
            rubric: [
              "The prototype is focused on a single, clearly stated question.",
              "Testing involved observing real behavior, not only asking for opinions.",
              "Changes are directly linked to what testers did.",
            ],
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* vb-2 Market Sizing                                                */
  /* ---------------------------------------------------------------- */
  {
    key: "vb-2",
    trackSlug: "venture-building",
    order: 2,
    title: "Market Sizing",
    summary:
      "Estimate how many people could realistically become your customers, starting from the ground up, and choose the first group to focus on.",
    suggestedMonths: "Months 4–6",
    sessions: [
      {
        key: "vb-2-1",
        kind: "reading",
        title: "Bottom-up market sizing",
        summary:
          "Huge numbers from industry reports say little about your venture. Learn to size your market from real, countable units you can check.",
        durationMin: 15,
        blocks: [
          para(
            "You may have seen pitches that claim a market worth billions of dollars. Those numbers are usually true and almost always useless for an early venture. What you need to know is how many real customers you could reach in the next year or two, and what they would be worth to you.",
            "That is why this program uses bottom-up sizing. You start with things you can count, such as schools, streets, shops or students, and multiply up using assumptions you can check.",
          ),
          heading("The basic calculation"),
          steps([
            "**Count the units.** How many potential customers exist in the area you can realistically reach? Use public data, maps, directories or your own counting.",
            "**Estimate the share who have the problem.** Use your interview evidence where possible, and be conservative.",
            "**Estimate how many you could reach and convert.** Consider your channels, time and budget.",
            "**Multiply by value per customer.** Price multiplied by how often they buy in a year.",
          ]),
          example(
            "Sneaker cleaning on campus",
            "Theo wanted to offer sneaker cleaning at Larkhaven Community College, which has about 3,000 students. His interviews and a quick poll suggested roughly one in five cared enough about their sneakers to pay for cleaning. He estimated he could reach half of those through two student clubs and social media, and that a third of them would try it. That gave him about 100 customers. At four cleans a year for $12 each, his realistic first-year estimate was around $4,800: modest, but built entirely on numbers he could check.",
          ),
          tip(
            "Show your work",
            "Put each assumption on its own line with its source. Reviewers will trust a modest, well-sourced estimate far more than a big number with no working behind it.",
          ),
        ],
      },
      {
        key: "vb-2-2",
        kind: "reading",
        title: "Choosing your beachhead",
        summary:
          "You cannot serve everyone at once. Learn to choose a first, narrow group where you can win decisively.",
        durationMin: 12,
        blocks: [
          para(
            "A beachhead is the first small group of customers you focus on completely. The term comes from the idea of landing somewhere specific before expanding. For a young venture with limited time and money, choosing a narrow beachhead is not thinking small. It is how you build enough strength to grow.",
          ),
          heading("What makes a good beachhead"),
          bullets([
            "**Reachable.** You can get in front of them cheaply and repeatedly, through channels you already have.",
            "**Feels the problem intensely.** Your interviews show this group cares the most.",
            "**Talks to each other.** Word of mouth works because they share spaces, groups or events.",
            "**Leads somewhere.** Success here makes it easier to reach the next group.",
          ]),
          example(
            "Interpreters at parent-teacher conferences",
            "Lucia's venture provides student interpreters at parent-teacher conferences for families who are not confident in English. She could have tried to serve every school in Greater Larkhaven. Instead she started with one Eastbank middle school where she knew the family liaison and where many families spoke Spanish. After one semester there, she had a case study, a reference and trained interpreters ready for the next school.",
          ),
          warning(
            "Narrow is not the same as tiny",
            "A beachhead still needs enough customers to learn from and to sustain your early operations. If your group is so small that you run out of people in a month, widen it slightly.",
          ),
        ],
      },
      {
        key: "vb-2-3",
        kind: "task",
        title: "Size your first market",
        summary:
          "Produce a bottom-up estimate for your venture's first market and justify your choice of beachhead.",
        durationMin: 90,
        blocks: [
          para(
            "Now apply both ideas to your own venture. You will build a simple bottom-up estimate and use it to choose a beachhead. Keep it to numbers you can explain, and be honest about where you are guessing.",
          ),
          steps([
            "Define your geographic or community boundary for the next 12 months.",
            "Count or estimate the total number of potential customers within it, and note your source.",
            "Apply your conversion assumptions step by step, citing interview evidence wherever you have it.",
            "Calculate a first-year revenue or reach estimate.",
            "Name your beachhead and explain why you chose it over at least one alternative.",
          ]),
          example(
            "Free period products in youth centers",
            "Nia's project aimed to install free period-product dispensers in youth centers, funded by a local sponsor. She counted 14 youth centers across Greater Larkhaven, estimated weekly visitors from the two she had visited, and used her survey of 40 young people to estimate need. Her beachhead was the three centers that already ran girls' groups, because staff there had asked for dispensers directly.",
          ),
          task({
            title: "First market estimate",
            instructions:
              "Create a bottom-up market estimate for your venture's first 12 months, showing each step and its source. Then name your beachhead segment and explain why you chose it over at least one alternative.",
            deliverable:
              "A one-page estimate with your calculation, sources and beachhead rationale. A simple spreadsheet is welcome as an attachment.",
            requiresReview: true,
            rubric: [
              "The calculation starts from countable units, and each assumption is sourced.",
              "Conversion assumptions are realistic and linked to evidence where possible.",
              "The beachhead choice is clearly argued against an alternative.",
            ],
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* vb-3 Pricing                                                      */
  /* ---------------------------------------------------------------- */
  {
    key: "vb-3",
    trackSlug: "venture-building",
    order: 3,
    title: "Pricing",
    summary:
      "Set a price that reflects the value you create, covers your costs and feels fair to customers, then test it instead of guessing.",
    suggestedMonths: "Months 7–9",
    sessions: [
      {
        key: "vb-3-1",
        kind: "reading",
        title: "Three ways to set a price",
        summary:
          "Cost-based, competitor-based and value-based pricing each tell you something different. Use all three to find a sensible range.",
        durationMin: 14,
        blocks: [
          para(
            "Young founders tend to underprice. It feels safer, kinder and more likely to win customers. But a price that is too low can make your venture unsustainable, make customers doubt your quality and leave you no room to improve. Pricing is not about charging as much as possible. It is about finding a price that is fair to both sides and keeps the venture alive.",
          ),
          heading("Three lenses"),
          bullets([
            "**Cost-based:** add up what it costs you to deliver one unit, including your time, then add a margin. This sets your floor: the price below which you lose money.",
            "**Competitor-based:** look at what customers pay for the current alternative, even if it is a different kind of solution. This shows you what feels normal to them.",
            "**Value-based:** estimate what the outcome is worth to the customer in time, money or stress saved. This sets your ceiling.",
          ]),
          para(
            "Your price belongs somewhere between the floor and the ceiling. Where exactly depends on how different you are from the alternatives, and how much evidence you have that customers value that difference.",
          ),
          example(
            "A dog-walking collective",
            "Ren and three friends set up a dog-walking collective in Millbrook. Their cost per walk was low, so cost-based pricing suggested about $8. Local professional walkers charged $25, and owners they interviewed said reliability mattered more than price. They settled on $18 and promised every dog a named, regular walker, a difference owners clearly valued.",
          ),
          tip(
            "Count your time",
            "Your hours are a real cost, even if nobody is paying you yet. If you leave them out, you cannot tell whether the venture could ever pay someone to do the work.",
          ),
        ],
      },
      {
        key: "vb-3-2",
        kind: "reading",
        title: "Talking about money with customers",
        summary:
          "Discussing price can feel awkward. Learn to ask questions that reveal what customers value and spend, without leading them.",
        durationMin: 12,
        blocks: [
          para(
            "Asking “How much would you pay?” rarely gives useful answers. People guess low to seem sensible, or high to be kind. Instead, anchor the conversation in what they already spend and what the problem already costs them.",
          ),
          heading("Questions that work"),
          bullets([
            "“What do you currently spend on this, including things like travel or time off work?”",
            "“What did you pay the last time you solved this problem?”",
            "“If this saved you [a specific outcome], what would that be worth to you?”",
            "“At what price would this feel too expensive to consider? At what price would you start to doubt the quality?”",
          ]),
          para(
            "The last pair of questions comes from a simple price-sensitivity technique. Ask for both the “too expensive” and “too cheap” thresholds across several conversations, and you will see a range where most people feel comfortable.",
          ),
          example(
            "Allergy-friendly birthday cakes",
            "Sofia sold allergy-friendly birthday cakes from a licensed shared kitchen. When she asked parents what they currently spent, she learned many bought two cakes: one for the child with allergies and one for everyone else. Framing hers as “the one cake everyone can eat” let her charge more than a standard cake while still saving parents money overall.",
          ),
          warning(
            "Careful with friends-and-family discounts",
            "Early discounts for people you know feel generous, but they can give you a misleading picture of demand. If you offer them, track those sales separately so they do not distort what real customers will pay.",
          ),
        ],
      },
      {
        key: "vb-3-3",
        kind: "task",
        title: "Design a pricing experiment",
        summary:
          "Set a price range using three lenses, then design and run a small experiment that shows how real customers respond to different prices.",
        durationMin: 180,
        showcase: true,
        blocks: [
          para(
            "Pricing is one of the most powerful levers you have, and one of the easiest to get wrong by guessing. In this task you will stop guessing. You will set a sensible price range from evidence, then run a small experiment that shows how people actually respond when asked to pay.",
            "The aim is not to find the perfect price in one go. It is to replace a number you picked because it felt comfortable with a number you can defend.",
          ),
          heading("Start with your range"),
          para(
            "Use the three lenses from the first session of this module. Calculate your cost floor per unit, including a realistic value for your time. Research the price of the current alternative. Estimate the value ceiling from your interviews. Write all three numbers down before you design anything, because they define the boundaries your experiment should explore.",
          ),
          heading("Choose an experiment format"),
          bullets([
            "**Split test:** show different prices to different groups at the same time, such as two versions of a sign-up page.",
            "**Sequential test:** change the price from one week to the next and compare. Simpler, but other things may change too, like the weather or the week of the month.",
            "**Tiered offer:** present a basic, standard and premium option side by side, and see which one people choose.",
            "**Pre-order at a set price:** ask for commitment at your target price and measure how many people follow through.",
          ]),
          heading("The process"),
          steps([
            "**Set your range** using the cost, competitor and value lenses.",
            "**Pick two or three price points** within that range. Make them different enough to matter.",
            "**Choose a format,** and decide how you will show each price to customers clearly and fairly.",
            "**Define your metric and success line,** such as sales at each price, or revenue per 50 people who see the offer.",
            "**Run the experiment** for at least one week, or until each price has been seen by enough people to compare.",
            "**Analyze and decide.** Compare results on both volume and revenue, then choose your next price.",
          ]),
          heading("Worked example: a phone accessory stall"),
          para(
            "Dev runs a weekend stall at the Old Quay market, fitting screen protectors and swapping cracked phone cases. His cost floor for one fitting, including materials and fifteen minutes of his time, came to about $4. A phone shop across town charged $15 for the same fitting. Customers told him the real value was not having to leave a phone at a shop for the afternoon.",
            "He tested $6 and $12 on alternating Saturdays over four weeks. The $6 price sold a few more fittings, but $12 earned far more per hour, and only two customers commented on the price. He also added a $20 option that combined a fitting with a same-day case swap, and about a quarter of customers chose it. His decision: keep $12 as the standard price, keep the premium option, and test a loyalty offer for repeat customers next.",
          ),
          tip(
            "Report revenue, not just sales",
            "A lower price almost always sells more units. What matters is whether it earns enough to sustain the venture. Compare revenue and profit per customer and per hour, not only the number of sales.",
          ),
          warning(
            "Keep it fair and transparent",
            "Everyone who pays should know exactly what they are getting for the price they see. Do not charge two customers different amounts for the same thing without a reason they can see, such as a published early-bird rate. If a test would feel unfair to explain out loud, redesign it.",
          ),
          worksheet(
            "pricing-experiment-plan.pdf",
            "Plan your price range, test design, metrics and results in one place.",
          ),
          task({
            title: "Pricing experiment",
            instructions:
              "Calculate your cost floor, competitor reference and value ceiling. Choose two or three price points within that range and design an experiment to test them with real customers for at least one week. Record results for each price and recommend the price you will use next, with your reasoning.",
            deliverable: "Your completed pricing experiment plan, a results table and a half-page recommendation.",
            requiresReview: true,
            rubric: [
              "The price range is built from all three lenses, with the working shown.",
              "The experiment is fair, transparent and tests meaningfully different prices.",
              "Results compare revenue as well as the number of sales.",
              "The recommendation follows clearly from the evidence.",
            ],
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* vb-4 Financial Basics                                             */
  /* ---------------------------------------------------------------- */
  {
    key: "vb-4",
    trackSlug: "venture-building",
    order: 4,
    title: "Financial Basics",
    summary:
      "Understand the numbers that decide whether your venture can last: unit economics, cash flow and a simple budget.",
    suggestedMonths: "Months 10–12",
    sessions: [
      {
        key: "vb-4-1",
        kind: "reading",
        title: "Unit economics in plain language",
        summary:
          "Before you look at the whole venture, look at one sale. Learn to calculate what each customer really earns you.",
        durationMin: 15,
        blocks: [
          para(
            "Unit economics answers a deceptively simple question: when you make one sale, do you make or lose money? If every sale loses money, growing faster just loses money faster. If every sale makes a healthy margin, you have a foundation to build on.",
          ),
          heading("The key terms"),
          bullets([
            "**Price:** what the customer pays for one unit.",
            "**Variable cost:** what it costs you to deliver that one unit, including materials, packaging, delivery, payment fees and paid time.",
            "**Contribution margin:** price minus variable cost. This is what each sale contributes toward everything else.",
            "**Fixed costs:** costs you pay regardless of sales, such as a website, insurance, storage or equipment.",
            "**Break-even:** the number of units you need to sell for total contribution to cover your fixed costs.",
          ]),
          example(
            "Upcycled tote bags",
            "Aisha sewed tote bags from donated fabric scraps and sold them for $28. Thread, labels and packaging came to about $5, and the payment app took roughly $1. A $22 margin looked healthy until she added the two hours of sewing each bag took. At $15 an hour, she was losing $8 on every bag. Her fix was to simplify the design, cutting sewing time to under an hour, and to offer a smaller range.",
          ),
          tip(
            "Include every cost per sale",
            "Payment fees, delivery, packaging and returns are easy to forget. Walk through one real sale from start to finish and write down everything that cost money or time.",
          ),
        ],
      },
      {
        key: "vb-4-2",
        kind: "video",
        title: "Reading your first cash flow",
        summary:
          "Profit and cash are not the same thing. This video explains cash flow with a simple example and shows how to avoid running out of money.",
        durationMin: 7,
        blocks: [
          para(
            "Plenty of ventures that are profitable on paper still get into trouble because money comes in later than it goes out. This short video explains the difference between profit and cash, using a school-supplies venture as the example.",
          ),
          video("vb-cash-flow-basics"),
          heading("Remember"),
          bullets([
            "Cash flow tracks when money actually arrives and leaves, not when a sale is agreed.",
            "Buying stock in advance, waiting for invoices to be paid and seasonal demand all create gaps.",
            "A simple month-by-month table of money in and money out is enough to spot trouble early.",
          ]),
          tip(
            "Keep venture money separate",
            "If you can, keep your venture's money in a separate account or a clearly tracked pot, with a parent or guardian involved if you are under 18. Mixing personal and venture money makes it very hard to know how the venture is really doing.",
          ),
        ],
      },
      {
        key: "vb-4-3",
        kind: "task",
        title: "Complete your unit economics sheet",
        summary:
          "Calculate price, variable cost, contribution margin and break-even for your venture, then build a three-month cash flow outlook.",
        durationMin: 90,
        blocks: [
          para(
            "Time to put real numbers on your venture. Use your current or planned price and walk through a single sale carefully. Then zoom out to three months and see when money comes in and when it goes out.",
          ),
          steps([
            "List every variable cost involved in one sale, including your time at a fair hourly rate.",
            "Calculate your contribution margin per unit.",
            "List your fixed costs for the next three months.",
            "Calculate how many units you need to sell to break even.",
            "Build a simple month-by-month table of expected cash in and cash out.",
          ]),
          example(
            "Laundry pickup in the dorms",
            "Jonah charged $18 per bag for wash-and-fold pickup in the dorms at Larkhaven State. When he completed the sheet, he found his biggest variable cost was not detergent but the laundromat machines themselves, at almost $7 a bag. Negotiating a weekday bulk rate with the laundromat owner improved his margin more than any price change could have.",
          ),
          worksheet(
            "unit-economics-sheet.pdf",
            "Walk through one sale, your fixed costs, break-even and a three-month cash flow table.",
          ),
          task({
            title: "Unit economics and cash flow",
            instructions:
              "Complete the unit economics sheet for your main product or service, including your time as a cost. Calculate contribution margin and break-even, then build a three-month cash flow outlook. Finish with two sentences on what the numbers tell you and one change you will consider.",
            deliverable: "Your completed unit economics sheet, the three-month cash flow table and a short reflection.",
            requiresReview: true,
            rubric: [
              "All variable costs are included, including time.",
              "Contribution margin and break-even are calculated correctly.",
              "The cash flow table shows when money moves, not just totals.",
              "The reflection draws a practical conclusion from the numbers.",
            ],
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* vb-5 Operations                                                   */
  /* ---------------------------------------------------------------- */
  {
    key: "vb-5",
    trackSlug: "venture-building",
    order: 5,
    title: "Operations",
    summary:
      "Design the processes behind your product or service so it runs reliably and safely, without everything depending on you.",
    suggestedMonths: "Months 13–15",
    sessions: [
      {
        key: "vb-5-1",
        kind: "reading",
        title: "Write down how the work gets done",
        summary:
          "Simple written processes make your venture reliable and let others help. Learn to document the steps that matter most.",
        durationMin: 12,
        blocks: [
          para(
            "In the early days, everything lives in your head. That works until you get sick, have finals or need someone else to help. Then small things start going wrong: an order is missed, a customer gets a different experience, a new volunteer does not know what to do.",
            "A standard operating procedure, which is simply a short written checklist of how a task is done, is one of the least glamorous and most useful tools a young venture can have.",
          ),
          heading("What to document first"),
          bullets([
            "**Anything a customer experiences directly,** such as how orders are confirmed, delivered and followed up.",
            "**Anything that could cause harm if done wrong,** such as food handling, electrical repairs or working with kids.",
            "**Anything you do more than once a week,** because small inefficiencies add up fast.",
            "**Anything you want someone else to take over** in the next few months.",
          ]),
          example(
            "The repair café, six months in",
            "Oskar's repair café grew to a dozen volunteers. Every month the same questions came up: who checks items for safety, how are repairs logged, what happens to things that cannot be fixed? He wrote a one-page procedure for each and taped them to the wall. Setup time dropped by half, and new volunteers could contribute from their very first session.",
          ),
          tip(
            "Write it while you do it",
            "The easiest way to create a procedure is to write down each step the next time you do the task, then ask someone else to follow your notes while you watch. Wherever they get stuck, your notes need more detail.",
          ),
        ],
      },
      {
        key: "vb-5-2",
        kind: "reading",
        title: "Suppliers, safety and the boring essentials",
        summary:
          "Reliable suppliers, basic safety and the right permissions keep your venture running and protect the people you serve.",
        durationMin: 14,
        blocks: [
          para(
            "Operations is not only about process. It also covers what your venture depends on around you: suppliers, spaces, permissions and safety. None of it is exciting, but getting it wrong can end a venture overnight.",
          ),
          heading("A checklist to work through with your mentor"),
          bullets([
            "**Suppliers:** do you have at least one backup for anything critical? What happens if your main supplier runs out?",
            "**Space:** do you have written permission to use the venues, tables or market stalls you rely on?",
            "**Safety:** have you identified the main risks to customers and volunteers, and how you reduce them?",
            "**Working with young people:** if you work with kids or vulnerable adults, do you have a clear safety policy and the right background checks?",
            "**Permits and insurance:** do you need a business license, a food handler's permit or liability insurance? Rules vary by city and state, so check with your mentor or program staff.",
          ]),
          example(
            "The produce box, scaling up",
            "When Rahel's produce box outgrew what her community garden could supply, she added two local growers as suppliers. She agreed on a simple written arrangement with each one covering quantities, quality and what would happen if they could not deliver. When one grower lost a crop to a late frost, the other filled the gap within a day, and no customer noticed.",
          ),
          warning(
            "Do not guess on legal requirements",
            "Food, childcare, electrical work and some kinds of selling come with legal requirements. If you are not sure whether something applies to you, ask your mentor or program staff before you start, not after.",
          ),
        ],
      },
      {
        key: "vb-5-3",
        kind: "task",
        title: "Document one core process",
        summary:
          "Write a clear, testable procedure for one core task in your venture, and have someone else follow it.",
        durationMin: 75,
        blocks: [
          para(
            "Pick the single process in your venture that would cause the most trouble if it went wrong or depended entirely on you. Document it clearly enough that a new team member could follow it without asking you a single question.",
          ),
          steps([
            "Choose the process, and explain in one sentence why you picked it.",
            "Write each step in order, starting with a verb: check, prepare, send, record.",
            "Mark any step with a safety or quality risk, and note how that risk is controlled.",
            "Ask someone else to follow your procedure while you watch without helping.",
            "Revise the document wherever they hesitated or made a mistake.",
          ]),
          example(
            "A skate park cleanup crew",
            "A youth-run crew that cleans the Harborside skate park before weekend sessions documented their setup routine. When a new member followed it, he skipped checking the ramps for broken glass because the step only said “check area.” The revised version read “Walk every ramp and bowl edge; pick up any glass with gloves and the grabber.” A small change in wording, a big difference in safety.",
          ),
          task({
            title: "Core process procedure",
            instructions:
              "Write a step-by-step procedure for one core process in your venture, highlighting any safety or quality risks. Have someone else follow it while you observe, then revise it based on what happened.",
            deliverable:
              "Your original and revised procedure, plus three to five sentences on what the test revealed.",
            requiresReview: true,
            rubric: [
              "The chosen process is genuinely important to the venture.",
              "Steps are clear, in order and action-based.",
              "Risks are identified, each with a practical control.",
              "Revisions respond directly to what happened in the test.",
            ],
          }),
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* vb-6 Launch Planning                                              */
  /* ---------------------------------------------------------------- */
  {
    key: "vb-6",
    trackSlug: "venture-building",
    order: 6,
    title: "Launch Planning",
    summary:
      "Plan a focused launch that brings in your first wave of customers, sets clear goals and teaches you as much as it sells.",
    suggestedMonths: "Months 16–18",
    sessions: [
      {
        key: "vb-6-1",
        kind: "reading",
        title: "What a launch is really for",
        summary:
          "A launch is not a single big moment. It is a planned push to reach a defined group, with goals you can measure and learn from.",
        durationMin: 12,
        blocks: [
          para(
            "Many founders picture a launch as one big announcement that changes everything. In practice, most successful launches are quieter and more deliberate: a focused effort to reach a specific group, with clear goals, a short timeline and a plan for what happens afterward.",
            "A good launch does three things. It gets your offer in front of the right people. It turns some of them into customers. And it produces evidence about what works, so the next push is stronger.",
          ),
          heading("Set launch goals that matter"),
          bullets([
            "**Reach:** how many of the right people will hear about you?",
            "**Conversion:** how many will take the first step and sign up, book or buy?",
            "**Retention:** how many will come back or continue after the first time?",
            "**Learning:** which specific questions will the launch answer?",
          ]),
          example(
            "An esports coaching club",
            "Arjun's venture coaches younger teens in team-based games, with a focus on communication and sportsmanship. Instead of announcing it everywhere, he launched with two youth clubs in Eastbank, aiming for 20 sign-ups and 12 players still attending after four weeks. The retention goal turned out to be the most useful one: it showed that parents valued the teamwork focus more than the gaming skills.",
          ),
          tip(
            "Launch small, then launch again",
            "A soft launch to a small group lets you fix problems before more people see them. Plan for at least two waves: a smaller first launch to learn, and a larger second one once you have fixed what broke.",
          ),
        ],
      },
      {
        key: "vb-6-2",
        kind: "reading",
        title: "Channels for your first hundred customers",
        summary:
          "Compare the channels that work for early ventures (direct outreach, partners, community and content) and choose two to focus on.",
        durationMin: 14,
        blocks: [
          para(
            "Where will your first hundred customers come from? For most young ventures, the honest answer is not advertising. It is people you can reach directly, organizations that already serve your customers, and communities where word travels fast.",
          ),
          heading("Channels to consider"),
          bullets([
            "**Direct outreach:** personal messages and conversations at events. Slow to scale, but the highest conversion early on.",
            "**Partner channels:** schools, youth centers, local shops or community groups that already have your customers' trust.",
            "**Community and word of mouth:** your first happy customers telling others, helped along by referral offers or moments worth sharing.",
            "**Content and social media:** useful posts, short videos and stories. Slower to build, but it compounds over time.",
          ]),
          para(
            "Pick two channels for your launch, based on where your beachhead customers already spend their time. Doing two well beats doing six badly.",
          ),
          example(
            "A neighborhood newsletter",
            "Nadia started a printed newsletter for four streets in Old Quay, funded by local business listings. Readers came from door-to-door delivery. Advertisers came through a single channel: the owner of a popular bakery, who introduced her to six other shop owners in one week. One trusted partner was worth more than months of cold emails.",
          ),
          warning(
            "Respect consent",
            "Only message people who have agreed to hear from you, and make it easy to opt out. Buying contact lists, adding people to group chats without asking or sending repeated unsolicited messages damages trust and may break the law.",
          ),
        ],
      },
      {
        key: "vb-6-3",
        kind: "task",
        title: "Build your 30-day launch plan",
        summary:
          "Create a detailed 30-day plan for launching to your beachhead, with goals, channels, a timeline, a budget and a way to measure what works.",
        durationMin: 180,
        showcase: true,
        blocks: [
          para(
            "This is the capstone of the Venture Building track. You will pull together everything from the last five modules (your prototype, market, pricing, numbers and operations) into a concrete plan for the next 30 days. By the end, you should be able to hand this plan to your mentor and have them understand exactly what you will do, why, and how you will know whether it worked.",
            "A launch plan is a living document. It will change as soon as real customers respond, and that is the point. A written plan gives you something to change deliberately, instead of reacting to whatever happens next.",
          ),
          heading("What a strong plan includes"),
          bullets([
            "**A clear offer:** what you are launching, at what price, for whom.",
            "**Goals:** reach, conversion, retention and learning targets for 30 days.",
            "**Two focus channels,** with specific actions for each.",
            "**A week-by-week timeline,** with owners and deadlines.",
            "**A simple budget** covering both money and time.",
            "**Readiness checks,** so operations hold up under new demand.",
            "**A review rhythm** for looking at results and adjusting.",
          ]),
          heading("The process"),
          steps([
            "**Confirm your offer.** Write one paragraph describing exactly what customers get and what it costs.",
            "**Set your goals** for reach, conversion, retention and learning, using your market sizing to keep them realistic.",
            "**Choose two channels,** and list at least five concrete actions for each.",
            "**Build a week-by-week timeline** covering preparation, soft launch, main launch and review.",
            "**Check operations** with the launch checklist: stock, processes, payments and customer support.",
            "**Plan your reviews.** Schedule a short weekly check against your goals, and decide in advance what you will change if a channel underperforms.",
          ]),
          heading("Worked example: the neighborhood refill station"),
          para(
            "Remember the Harborside refill station from Founder Foundations? Six months later, its two founders were ready to open a weekly refill table at their community center. Their plan looked like this:",
          ),
          bullets([
            "**Offer:** refills of dish soap, laundry detergent and hand soap by weight, with a free starter bottle for first-time customers.",
            "**Goals:** 150 people reached, 40 first-time customers, 20 returning within 30 days, and a clear answer to which product sells best.",
            "**Channels:** the community center's email newsletter and a sign-up table at the Saturday farmers market.",
            "**Timeline:** week one for preparation and a soft launch to ten neighbors; weeks two and three for the main launch; week four to review and adjust.",
            "**Readiness:** stock for 60 refills, a written refill procedure, a card reader tested in advance and a clear refund promise.",
          ]),
          para(
            "After two weeks, the market table was bringing in far more first-time customers than the newsletter. They shifted their time accordingly and hit their first-time customer goal a week early. Returning customers were lower than hoped, so they added a punch card, a change they could make quickly because they were checking results every week.",
          ),
          tip(
            "Plan for the day after",
            "Most launch plans end on launch day. Yours should cover the full 30 days, with as much attention to keeping customers as to finding them.",
          ),
          warning(
            "Do not overpromise",
            "If demand outruns what you can deliver, customers remember the disappointment more than the launch. Set a limit on orders or spots if you need to, and say so clearly. A waitlist is better than a broken promise.",
          ),
          worksheet(
            "launch-checklist.pdf",
            "A 30-day timeline template and readiness checklist covering your offer, channels, operations and reviews.",
          ),
          task({
            title: "30-day launch plan",
            instructions:
              "Create a 30-day launch plan for your beachhead customers. Include your offer; measurable goals for reach, conversion, retention and learning; two focus channels with concrete actions; a week-by-week timeline; a simple budget of money and time; a completed readiness checklist; and your weekly review plan.",
            deliverable: "Your launch plan (no more than four pages) with the completed launch checklist attached.",
            requiresReview: true,
            rubric: [
              "Goals are specific, measurable and realistic given your market sizing.",
              "Channels fit where your beachhead customers already are, with concrete actions for each.",
              "The timeline and budget are credible and account for your other commitments.",
              "Operations readiness and a weekly review rhythm are clearly planned.",
            ],
          }),
        ],
      },
      {
        key: "vb-6-4",
        kind: "task",
        title: "Run a launch retrospective",
        summary:
          "Look back at your launch with your team or mentor: what worked, what did not and what you will do differently next time.",
        durationMin: 45,
        blocks: [
          para(
            "After 30 days, pause before planning your next move. A retrospective is a short, honest review of what happened. It is not about assigning blame; it is about making the next push smarter. Run it with your team if you have one, or with your mentor if you are working solo.",
          ),
          heading("Four questions"),
          bullets([
            "**What did we plan, and what actually happened?** Compare each goal with the real result.",
            "**What worked better than expected?** Name it, so you can do more of it.",
            "**What did not work, and why?** Look for causes, not culprits.",
            "**What will we change in the next 30 days?** Pick no more than three changes.",
          ]),
          quote(
            "Our retrospective was the first time we admitted the flyers were a waste of time. We had all noticed it, but nobody had said it out loud.",
            "Camila, Summer 2026 fellow (fictional example)",
          ),
          task({
            title: "Launch retrospective",
            instructions:
              "Hold a 30 to 45 minute retrospective on your launch using the four questions. Record honest answers, and list the three changes you will make in the next 30 days.",
            deliverable: "Brief notes from your retrospective and your three planned changes.",
            requiresReview: false,
          }),
        ],
      },
    ],
  },
];
