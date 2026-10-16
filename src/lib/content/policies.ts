/**
 * Legal policies, carried over from goodcase.io (docs/source/goodcase-live/
 * ai-use-policy.txt and privacy-policy.txt).
 *
 * The wording is Goodcase's own. Cleaning was limited to structure and
 * mechanical fixes from the scrape: spacing between run-together words,
 * hyphen-dashes set as em dashes, recipient lists split into items, one
 * duplicated table row with no legal basis removed, and two empty list
 * slots removed. Anything that needs Goodcase's confirmation is flagged in a
 * `note`, which the page shows as a visible editorial tag.
 */

export type PolicyTerm = { term: string; text: string };

export type PolicyLink = { label: string; href: string };

export type ProcessingRow = {
  purpose: string;
  basis: string;
  recipients: string[];
  duration: string;
};

/** Ordered content that does not fit the simple paragraphs-then-bullets shape. */
export type PolicyBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "terms"; items: PolicyTerm[] }
  | { kind: "links"; items: PolicyLink[] }
  | { kind: "processing"; rows: ProcessingRow[] };

export type PolicySubsection = {
  id: string;
  heading: string;
  /** Rendered first. */
  paragraphs: string[];
  /** Rendered after the paragraphs. */
  bullets?: string[];
  /** Rendered after paragraphs and bullets, in order. */
  blocks?: PolicyBlock[];
};

export type PolicySection = PolicySubsection & {
  /** Rendered last, as h3 headings inside the section. */
  subsections?: PolicySubsection[];
  /** Editorial note for Goodcase (shown with a visible tag), never policy text. */
  note?: string;
};

export type Policy = {
  slug: "ai-use-policy" | "privacy-policy";
  title: string;
  /** Hero lede. */
  summary: string;
  /** The date exactly as the live policy states it, if it states one. */
  lastUpdated?: string;
  /** Opening paragraphs shown before the first section, without a heading. */
  intro?: string[];
  sections: PolicySection[];
  sourceUrl: string;
};

/* ------------------------------------------------------------------ */
/* AI Use Policy                                                       */
/* ------------------------------------------------------------------ */

export const AI_USE_POLICY: Policy = {
  slug: "ai-use-policy",
  title: "AI Use Policy",
  summary: "How we use — and don’t use — artificial intelligence in paralegal support.",
  sourceUrl: "https://goodcase.io/ai-use-policy",
  intro: [
    "Goodcase.io Sp. z o. o. is committed to the highest standard of immigration paralegal support. As artificial intelligence (AI) tools have entered the mainstream of legal services, we believe our clients deserve a frank, written explanation of how we use these technologies — and how we do not. Every principle below applies to every matter we handle, from initial intake through final delivery of your prepared materials.",
  ],
  sections: [
    {
      id: "core-principles",
      heading: "Our Core Principles",
      paragraphs: [],
      blocks: [
        {
          kind: "terms",
          items: [
            {
              term: "Your matter is handled by experienced human paralegals.",
              text: "Every petition, cover letter, supporting statement, and declaration is prepared, reviewed, and approved by a qualified paralegal. AI does not prepare your documents. Our team does, drawing on specialized knowledge of immigration procedures and the precision required in case preparation.",
            },
            {
              term: "Your personal information is never entered into AI tools.",
              text: "We do not input your name, date of birth, passport or travel document numbers, Alien Registration Number (A-Number), address, biographic details, family information, employer data, financial records, or any other personally identifiable information into any AI system or large language model (LLM).",
            },
            {
              term: "Your documents remain inside our secure systems.",
              text: "We do not attach or upload your client file, identity documents, employment records, financial materials, or case evidence to any AI platform. Your file is maintained exclusively in our secure case-management system and is accessible only to your designated support team.",
            },
            {
              term: "AI is applied only to public, non-confidential information.",
              text: "When we use AI, we use it to organize and condense publicly available material — federal statutes, USCIS regulations and policy manuals, AAO decisions, State Department guidance, and country-conditions reports. Nothing private about you enters that workflow.",
            },
            {
              term: "AI is a research and organizational tool, not a document author.",
              text: "Our team may use AI to synthesize lengthy public-record sources, build research outlines, or flag potential grammar and clarity issues in paralegal-drafted language. We do not use AI to generate case-specific narratives, produce client-specific content, or fabricate citations.",
            },
            {
              term: "Every AI-assisted output is verified by a qualified team member.",
              text: "Any material produced with AI assistance is treated as a preliminary suggestion, not a finished work product. Every citation and factual reference in every prepared document is confirmed by a human team member against the original authoritative source, without exception.",
            },
          ],
        },
      ],
    },
    {
      id: "staff-accountability",
      heading: "Staff Accountability and Quality Responsibility",
      paragraphs: [
        "Our team bears full responsibility for every aspect of the support services we provide. AI does not replace professional judgment, and it does not relieve any staff member of the duties owed to our clients and the supervising attorneys they work with. Specifically, our team remains solely responsible for:",
      ],
      bullets: [
        "All case analysis and organizational decisions, including assessment of documentation requirements, identification of relevant supporting materials, and selection of the appropriate preparation approach.",
        "All drafting, including petition preparation, cover letters, supporting statements, declarations, and any other written materials prepared on behalf of our clients.",
        "All factual verification, including review of client-provided information, corroborating evidence, and any research derived from public sources.",
        "The final work product delivered to clients and their supervising attorneys prior to submission. Our staff reviews every work product under the professional standards applicable to paralegal practice.",
      ],
      blocks: [
        {
          kind: "p",
          text: "We adhere strictly to all applicable standards governing the use of AI in paralegal and immigration support services. When AI is used in any capacity, staff oversight is continuous, not periodic. All work produced with AI assistance is reviewed, verified, and approved by a qualified team member before delivery.",
        },
      ],
    },
    {
      id: "internal-security",
      heading: "Internal Security and Controlled AI Usage",
      paragraphs: [
        "The limited use of AI tools within our practice is governed by company-level security protocols and confidentiality standards consistent with our obligations under applicable data protection requirements. Specifically:",
      ],
      blocks: [
        {
          kind: "terms",
          items: [
            { term: "Access controls:", text: "Any internally approved AI-assisted tool is available only to authorized members of your support team. Access is role-based and logged." },
            { term: "Data isolation:", text: "Client information is never commingled with AI workflows. Our case-management and document systems maintain strict separation from any AI platform." },
            { term: "Vendor standards:", text: "Where any third-party software incorporates AI functionality, we evaluate and confirm that such tools meet our confidentiality and data-handling requirements before adoption." },
            { term: "Ongoing compliance:", text: "Our internal AI practices are reviewed regularly against evolving industry guidance, company policy, and security standards." },
          ],
        },
        {
          kind: "p",
          text: "The integrity of your confidential information is not a feature we balance against efficiency. It is a baseline obligation we treat as non-negotiable.",
        },
      ],
    },
    {
      id: "policy-updates",
      heading: "A Policy That Grows With the Field",
      paragraphs: [
        "AI technology and the standards governing its use in legal support services are both evolving. We intend to evolve with them, thoughtfully and on behalf of our clients.",
        "This policy will be updated as needed to reflect changes in industry guidance and professional standards, developments in AI technology that affect how we work, and shifts in the regulatory and adjudicatory environment for immigration practice.",
        "When we update this policy, we will communicate those changes clearly. Our commitment throughout will remain constant: AI is a tool our team uses in your service, under their full supervision and professional accountability. That principle will not change regardless of how the technology develops.",
      ],
    },
    {
      id: "client-questions",
      heading: "Common Client Questions",
      paragraphs: [],
      subsections: [
        {
          id: "q-training-data",
          heading: "“Will my information end up in a public AI database or training set?”",
          paragraphs: [
            "No. Because we do not enter client information into AI tools, there is nothing for any AI provider to receive, retain, log, or use for model training. Your data lives exclusively inside our protected systems.",
          ],
        },
        {
          id: "q-errors",
          heading: "“Could AI introduce errors or ‘hallucinations’ into my prepared documents?”",
          paragraphs: [
            "The accuracy of your prepared documents rests with the qualified paralegal who reviews and approves them. AI-generated language is never copied directly into your materials. Every citation and factual assertion is verified by a human team member against the primary source. Our staff, not an algorithm, are accountable for the quality and integrity of your case preparation.",
          ],
        },
        {
          id: "q-time",
          heading: "“Are you using AI to reduce time spent on my matter?”",
          paragraphs: [
            "Selectively, yes, and only in ways that benefit you. We use AI to reduce the time our team spends on mechanical tasks, such as reading through hundreds of pages of publicly available regulatory guidance. That time is redirected to the parts of your matter that require genuine expertise: organizing your documentation, developing your supporting evidence, and preparing accurate, thorough submissions. We use AI to give your matter more professional attention, not less.",
          ],
        },
        {
          id: "q-confidentiality",
          heading: "“Does your use of AI affect the confidentiality of my information?”",
          paragraphs: [
            "No. Because we never share your confidential information with any AI platform, your privacy is fully protected. Our internal AI practices are designed from the ground up around this principle. We have not carved out exceptions, and we do not intend to.",
          ],
        },
        {
          id: "q-disclosure",
          heading: "“Does USCIS or the supervising attorney know you use AI?”",
          paragraphs: [
            "Every document we deliver is the work product of our paralegal team, prepared under applicable professional standards. We comply with all applicable disclosure obligations and operate transparently with the supervising attorneys our clients work with. We are always prepared to describe our AI practices in full upon request.",
          ],
        },
      ],
    },
    {
      id: "more-questions",
      heading: "More Questions? We’re Here.",
      paragraphs: [
        "If you have questions about how we use AI in your matter, please contact your case coordinator directly. We are pleased to walk through this policy with you in plain language and to address any concern specific to your case.",
        "Your trust is the foundation of our work. We want you to feel fully and accurately informed about every tool, process, and professional that touches your matter.",
        "The integrity of your confidential information is not a feature we balance against efficiency. It is a baseline obligation we treat as non-negotiable.",
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Privacy Policy                                                      */
/* ------------------------------------------------------------------ */

const BASE_RECIPIENTS = ["IT service providers", "Internet providers", "hosting providers"];

const RECRUITMENT_DURATION =
  "3 months from the date of completion of the recruitment process or until the consent is withdrawn, based on the candidate expressing his or her wish to participate in future recruitments";

const CONTRACT_DURATION = "For the duration of the contract, its termination and until the expiry of the time limit for pursuing potential claims";

const NECESSARY_DESPITE = [
  "for exercising the right of freedom of expression and information;",
  "for compliance with a legal obligation which requires processing under the EU or Member State law to which the controller is subject or for the performance of a task carried out in the public interest or in the exercise of official authority vested in the controller;",
  "for reasons of public interest in the field of public health;",
  "for archiving purposes in the public interest, scientific or historical research purposes or statistical purposes in accordance with Article 89 (1) of the GDPR, insofar as the right to erasure is likely to render impossible or seriously impair the achievement of the objectives of that processing; or",
  "for the establishment, exercise or defence of legal claims.",
];

export const PRIVACY_POLICY: Policy = {
  slug: "privacy-policy",
  title: "Privacy Policy",
  summary: "How Goodcase.io Sp. z o.o. processes your personal data when you visit our website and communicate with us, and the rights you have under the GDPR.",
  lastUpdated: "10/04/2024",
  sourceUrl: "https://goodcase.io/privacy-policy",
  sections: [
    {
      id: "background",
      heading: "Background",
      paragraphs: [
        "With a view to ensuring the highest standards of security of personal data processing, Goodcase.io Sp. z o. o. would like to inform you that this privacy policy meets the requirements of the Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, as well as the standards set in national regulations.",
        "This Privacy Policy contains detailed information on the rules of processing of your personal data by Goodcase.io Sp. z o. o. in your communications with us.",
      ],
    },
    {
      id: "key-definitions",
      heading: "Key definitions",
      paragraphs: [],
      blocks: [
        {
          kind: "terms",
          items: [
            { term: "Controller", text: "controller of personal data, the entity deciding on the purpose and means of processing of personal data. The controller of your personal data is Goodcase.io Sp. z o. o." },
            { term: "Personal data", text: "means any information about an identified or identifiable natural person (‘data subject’); an identifiable natural person is one whose identity may be determined, directly or indirectly, based on the data." },
            { term: "EEA", text: "European Economic Area, free trade area and common market, comprising the countries of the European Union and the European Free Trade Association (EFTA), with the exception of Switzerland. This is the area in which the free movement of personal data takes place." },
            { term: "Data Recipient", text: "means a natural or legal person, an organizational unit without legal personality (the so-called legal person with limited legal capacity), a public authority, a body or other entity to which personal data are disclosed, regardless of whether it is a “third party”." },
            { term: "Third countries", text: "non-EEA countries." },
            { term: "Cookies", text: "small pieces of information sent by a website that we visit and saved on the end device (computer, laptop, smartphone) that we use when browsing websites." },
            { term: "President of the Office", text: "President of the Personal Data Protection Office, a supervisory authority within the meaning of the GDPR that supervises compliance with the provisions of law on the protection of personal data in Poland." },
            { term: "Profiling", text: "means any form of automated processing of personal data consisting of the use of personal data to evaluate the personal aspects relating to a natural person, in particular to analyse or predict aspects concerning that natural person’s performance at work, economic situation, health, personal preferences, interests, reliability, behaviour, location or movements, where such action produces legal effects concerning that person or similarly significantly affects him or her." },
            { term: "SSL", text: "is a network protocol used for secure Internet connections, adopted as an encryption standard on websites. An SSL certificate ensures the confidentiality of data transmitted over the Internet." },
            { term: "Processing of personal data", text: "means an operation or set of operations which is performed on personal data or on sets of personal data, whether or not by automated means, such as collection, recording, organisation, structuring, storage, adaptation or alteration, retrieval, consultation, use, disclosure by transmission, dissemination or otherwise making available, alignment or combination, restriction, erasure or destruction." },
            { term: "Policy", text: "privacy policy of Goodcase.io Sp. z o. o." },
            { term: "GDPR", text: "Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC" },
            { term: "APES", text: "Act on the provision of electronic services of 18 July 2002 (Journal of Laws No. 144, item 1204, as amended)." },
            { term: "Telecom Law", text: "Act on Telecommunications Law of 16 July 2004 (Journal of Laws No. 171, item 1800, as amended)" },
            { term: "User", text: "means a person using the website and social media profiles of the Controller." },
          ],
        },
      ],
    },
    {
      id: "controller",
      heading: "Information about the Controller",
      paragraphs: [
        "The controller of your personal data is Goodcase.io Sp. z o. o. with its registered office in Warsaw at ul. Al. Jana Pawla II 27, 00-867 Warsaw (hereinafter referred to as the “Controller”).",
        "The Controller can be contacted by e-mail: piotr@Goodcase.com or through the contact form on the website.",
      ],
      note: "The live policy lists piotr@Goodcase.com, while the rest of goodcase.io uses info@goodcase.io. Goodcase to confirm which address belongs here.",
    },
    {
      id: "joint-controllers",
      heading: "Joint controllers",
      paragraphs: [
        "With regard to personal data processed in connection with maintaining the Goodcase.io Sp. z o.o. profile on Facebook, please be advised that the controller of your personal data processed by that website is both Goodcase.io Sp. z o. o. and Meta Platforms Ltd. acting as joint controllers. All information on the processing of personal data by Goodcase.io Sp. and the rights that you have in relation to Goodcase.io Sp. can be found in this privacy policy. In any matters related to maintaining your own profile on Facebook, tracking your behaviour by Facebook and exercising your rights in this regard, please address Meta Platforms Ltd. directly. We would like to inform you that by liking our post, i.e. by clicking the “Like” button, you consent to the processing of your personal data. More information on the joint control and processing of personal data by Facebook can be found in the regulations and policies on the Facebook website.",
      ],
    },
    {
      id: "legal-basis",
      heading: "Legal basis for the processing",
      paragraphs: [],
      blocks: [
        {
          kind: "processing",
          rows: [
            {
              purpose: "Responding to a message sent by email, via LinkedIn, X portal or Facebook profile.",
              basis: "Article 6 (1) (f), i.e. the legitimate interest of the Controller in handling correspondence and phone calls",
              recipients: [...BASE_RECIPIENTS, "Microsoft Ltd.", "X Corp.", "Meta Platforms Ltd.", "LH.pl sp. z o.o."],
              duration: "For the period necessary to consider the matter to which the message relates.",
            },
            {
              purpose: "Presenting an offer (in the case of individuals addressing an inquiry on their own behalf, i.e. B2C)",
              basis: "Article 6 (1) (b) of the GDPR, i.e. processing is necessary to take steps prior to entering into a contract.",
              recipients: [...BASE_RECIPIENTS, "Microsoft Ltd."],
              duration: "Until you object to the processing.",
            },
            {
              purpose: "Presenting an offer (in the case of individuals addressing an inquiry on behalf of the bodies for which they provide services, i.e. B2B)",
              basis: "Article 6 (1) (f) of the GDPR, i.e. the legitimate interest of the Controller in proposing and establishing business cooperation.",
              recipients: [...BASE_RECIPIENTS, "Microsoft Ltd."],
              duration: "Until you object to the processing.",
            },
            {
              purpose: "Marketing – the main website",
              basis: "Article 6 (1) (f), i.e. the legitimate interest of the Controller in acquiring and retaining a client",
              recipients: [...BASE_RECIPIENTS, "LH.pl sp. z o.o.", "Google Ltd."],
              duration: "Until you object to the processing.",
            },
            {
              purpose: "Marketing – promotional mailing, including sending of newsletters",
              basis: "Article 6 (1) (f) of the GDPR, i.e. a legitimate interest consisting in carrying out marketing activities based on your consent obtained in accordance with the Telecom Law and APES.",
              recipients: [...BASE_RECIPIENTS],
              duration: "Until you object or withdraw your consent expressed in accordance with the Telecom Law and APES.",
            },
            {
              purpose: "Marketing – maintaining company profiles on social media platforms (Facebook, LinkedIn, X portal)",
              basis: "Article 6 (1) (f), i.e. the legitimate interest of the Controller in acquiring and retaining a client by publishing promotional posts",
              recipients: [...BASE_RECIPIENTS, "Meta Platforms Ltd.", "Microsoft Ltd.", "X Corp."],
              duration: "Until you object to the processing.",
            },
            {
              purpose: "Entering into and performing a contract with a client (processing an order)",
              basis: "Article 6 (1) (a) of the GDPR and, in selected cases, Article 9 (2) (a) and (f) of the GDPR in connection with the client’s consent to processing for the following purposes: to the extent necessary for providing services; to perform a contract; to pursue or defend any claims in connection with performing a contract.",
              recipients: [...BASE_RECIPIENTS, "Payment services providers", "Law firms and legal advisors"],
              duration: "Before a service is completed, until you withdraw your consent; after the service has been completed, until the expiry of the period for pursuing or defending against any claims.",
            },
            {
              purpose: "Complaints (defending against or pursuing any claims)",
              basis: "Article 6 (1) (f) of the GDPR, legitimate interest in establishing, pursuing or defending claims.",
              recipients: [...BASE_RECIPIENTS, "Payment services providers"],
              duration: "Until any claims arising under the provisions of civil law become time-barred.",
            },
            {
              purpose: "Taking steps prior to entering into and performing a contract (contractors)",
              basis: "Article 6 (1) (b) of the GDPR — taking the necessary steps to enter into a contract with a client.",
              recipients: [...BASE_RECIPIENTS, "Law firms and legal advisors"],
              duration: CONTRACT_DURATION,
            },
            {
              purpose: "Performing a contract (contractor’s employees).",
              basis: "Article 6 (1) (f) of the GDPR — the Controller’s legitimate interest in coordinating activities with the contractor.",
              recipients: [...BASE_RECIPIENTS, "Law firms and legal advisors"],
              duration: CONTRACT_DURATION,
            },
            {
              purpose: "Running a recruitment process (employees)",
              basis: "Article 6 (1) (a) and (c) of the GDPR, i.e. to the extent defined in the provisions of the Polish labour law, the Controller is obligated to process a specific set of data of candidates for work; as regards the data going beyond the set defined in the labour law, the legal basis for the processing of personal data is the candidate’s consent (Article 6 (1) (a) of the GDPR)",
              recipients: [...BASE_RECIPIENTS],
              duration: RECRUITMENT_DURATION,
            },
            {
              purpose: "Recruitment (contractors and collaborators)",
              basis: "Article 6 (1) (b) of the GDPR, i.e. the legal basis is taking steps prior to entering into a contract with persons engaged in their own business.",
              recipients: [...BASE_RECIPIENTS],
              duration: "3 months from the date of completion of the recruitment process.",
            },
            {
              purpose: "Organization of projects and events (conferences, trainings, webinars)",
              basis: "Article 6 (1) (f) of the GDPR, i.e. a legitimate interest consisting in carrying out marketing activities.",
              recipients: [...BASE_RECIPIENTS, "Bodies cooperating in the organization of events"],
              duration: "Until any claims become time-barred.",
            },
            {
              purpose: "Recording and publishing recordings of organized events (conferences, trainings, webinars)",
              basis: "Article 6 (1) (f) of the GDPR, i.e. the Controller’s legitimate interest consisting in carrying out marketing activities based on your consent within the meaning of the Polish Copyright Act.",
              recipients: [...BASE_RECIPIENTS, "Bodies cooperating in the organization of events"],
              duration: "Until you object or withdraw your consent within the meaning of the Polish Copyright Act.",
            },
            {
              purpose: "Acceptance and processing of a request under GDPR",
              basis: "Article 6 (1) (c), i.e. the obligation under the GDPR to provide the data subject with information about the actions taken in connection with his or her request",
              recipients: [...BASE_RECIPIENTS, "Law firms and legal advisors"],
              duration: "Until any claims become time-barred.",
            },
            {
              purpose: "Statistics and profiling",
              basis: "Article 6 (1) (f), i.e. the legitimate interest of the Controller in collecting and using statistics in order to improve the range and quality of services offered and communicating customised marketing content in relation to the use of Google Analytics based on your consent obtained in accordance with the Telecom Law",
              recipients: [...BASE_RECIPIENTS, "Google Ltd.", "LH.pl sp. z o.o."],
              duration: "Until you object to the processing.",
            },
          ],
        },
      ],
    },
    {
      id: "your-rights",
      heading: "Rights of data subjects",
      paragraphs: ["Each person whose data is processed has specific rights under the GDPR."],
      subsections: [
        {
          id: "right-of-access",
          heading: "Right to demand access to your personal data",
          paragraphs: [
            "Each person has the right to obtain from the controller confirmation as to whether or not personal data concerning him or her are being processed, and where that is the case, he or she has the right to access them and to obtain some specific information.",
            "The first copy of personal data undergoing processing will be provided to the person at his or her request free of charge. We may charge a reasonable fee for any further copies requested by the data subject due to administrative costs. If you make the request by electronic means, and unless otherwise requested by you, we will provide the information in a commonly used electronic form.",
          ],
        },
        {
          id: "right-to-rectify",
          heading: "Right to rectify",
          paragraphs: [
            "You have the right to request from us the rectification without delay of your personal data which is inaccurate. You also have the right to request to have incomplete personal data completed, including by means of providing an additional statement.",
          ],
        },
        {
          id: "right-to-erasure",
          heading: "Right to demand the erasure of personal data",
          paragraphs: [
            "You have the right to request from us to delete your data without delay, and we are obligated to delete it without undue delay where one of the following grounds applies:",
          ],
          bullets: [
            "your personal data are no longer necessary in relation to the purposes for which they were collected or otherwise processed;",
            "you have withdrawn the consent on which the processing is based and there is no other legal basis for further processing;",
            "you have objected to the processing and there are no overriding legitimate grounds for the processing;",
            "your personal data have been processed unlawfully;",
            "your personal data have to be erased in order to comply with a legal obligation under the European Union law or under the law of the Member State to which the controller is subject;",
            "your personal data have been collected in connection with the provision of information society services.",
          ],
          blocks: [
            { kind: "p", text: "In accordance with the GDPR, your data, regardless of your request and the fact that the above conditions are fulfilled, may not be deleted if their processing is necessary:" },
            { kind: "ul", items: NECESSARY_DESPITE },
          ],
        },
        {
          id: "right-to-restriction",
          heading: "Right to demand restriction of processing",
          paragraphs: ["You have the right to request from the controller to restrict processing in the following cases:"],
          bullets: [
            "you contest the accuracy of your personal data, for a period enabling the controller to verify the accuracy of the data;",
            "the processing is unlawful but you oppose the erasure of your personal data and request the restriction of their use instead;",
            "the controller no longer needs the personal data for the purposes of the processing, but you need the data for the establishment, exercise or defence of legal claims;",
            "you object to the processing pending the verification whether the legitimate grounds on the part of the controller override your reasons for the objection.",
          ],
        },
        {
          id: "right-to-object",
          heading: "Right to object",
          paragraphs: [
            "You have the right to object, on grounds relating to your particular situation, at any time to processing of your data based on the controller’s legitimate interest, or to the processing necessary for the performance of a task carried out for reasons of public interest or in the exercise of official authority vested in the controller, including profiling based on those legal provisions.",
            "If you object, we will no longer process your personal data unless we can demonstrate compelling legitimate grounds for the processing which override your interests, rights and freedoms or the grounds for the establishment, exercise or defence of legal claims.",
          ],
        },
        {
          id: "right-to-portability",
          heading: "Right of data portability",
          paragraphs: [
            "You have the right to receive the personal data you have provided to us in a structured, commonly used and machine-readable format and you have the right to transmit those data to another controller without hindrance from us, where:",
          ],
          bullets: ["the processing is based on your consent or on a contract, and", "the processing is carried out by automated means."],
          blocks: [
            { kind: "p", text: "The possibility of exercising the right of data portability and having it transmitted by the controller directly to another controller will be realized as far as technically feasible." },
            { kind: "p", text: "According to the GDPR, the exercise of your rights must not adversely affect the rights and freedoms of others." },
          ],
        },
        {
          id: "right-to-withdraw-consent",
          heading: "Right of withdrawal of your consent",
          paragraphs: [
            "If your data is processed on the basis of your consent, you have the right to withdraw such consent at any time. The withdrawal of your consent will not affect the lawfulness of data processing carried out on the basis of your consent before its withdrawal.",
            "If you withdraw your consent, we have the right to further process your data if it is necessary:",
          ],
          bullets: NECESSARY_DESPITE,
        },
        {
          id: "right-to-complain",
          heading: "Right to lodge a complaint",
          paragraphs: [
            "You have the right to submit a complaint to the President of the Office for Personal Data Protection. As indicated by the President of the Office, because the President of the Office is the body controlling the correct application of the law on the protection of personal data by the controller of your data, the person submitting the complaint should first contact the controller in order to exercise his/her rights.",
            "Direct link to the website of the Office for Personal Data Protection to lodge a complaint:",
          ],
          blocks: [{ kind: "links", items: [{ label: "uodo.gov.pl/pl/p/skargi", href: "https://uodo.gov.pl/pl/p/skargi" }] }],
        },
      ],
    },
    {
      id: "outside-eea",
      heading: "Information on data processing outside the EEA",
      paragraphs: [
        "In certain cases, your personal data may be processed outside the EEA. In the case of Goodcase.io Sp. z o. o., your data may be transferred to the USA in connection with your activity on our Facebook and YouTube social media profiles, as we have indicated in Section 5 of this Policy. In addition, in connection with the use of Microsoft 365 services for electronic communications, your data may also be transferred to the provider’s servers in the USA.",
        "In each such case, the legal basis for the data transfer is the Data Privacy Framework document or Standard Contractual Clauses document. Each provider will ensure an adequate level of security of such transfer. More information is provided below:",
      ],
      blocks: [
        {
          kind: "links",
          items: [
            { label: "Google Ltd. — support.google.com/adspolicy/answer/10042247", href: "https://support.google.com/adspolicy/answer/10042247?hl=pl" },
            { label: "Microsoft Ltd. — microsoft.com/pl-pl/trust-center/privacy/gdpr-faqs", href: "https://www.microsoft.com/pl-pl/trust-center/privacy/gdpr-faqs" },
          ],
        },
      ],
    },
    {
      id: "website-security",
      heading: "Security of use of our website",
      paragraphs: [
        "Please be advised that Goodcase.io Sp. z o. o. applies adequate technical and organizational measures aimed at ensuring the maximum level of protection for people using our company’s website and providing their personal data using the contact form.",
        "In order to guarantee the highest level of security, the website is secured with SSL code.",
        "The website may contain links to other websites, in particular to make payments for our services, or may redirect you to other channels of communication (radio, television, press, spatial advertising, etc.). In connection with the above, apart from the websites administered by the Controller, the Controller will not be responsible for the privacy settings that apply on these websites or in such communication media, neither will the Controller be responsible for the availability of any services or goods shared through those websites or other communication media to which links may be provided on our website.",
        "The Controller will also not be responsible for any damage resulting from or that may result in connection with the use of such websites or media.",
      ],
    },
    {
      id: "cookies",
      heading: "Cookies and profiling",
      paragraphs: [
        "On our website, data from cookies are processed.",
        "In connection with the use of Google Analytics in our systems (including Google Signals and User ID), we use cookies for the following purposes:",
      ],
      bullets: [
        "maintaining and improving the operation of the website services;",
        "analysing the user’s network traffic during the use of the Administrator’s website;",
        "personalizing marketing content shared on the Controller’s website;",
        "keeping statistics of users visiting the website",
      ],
      blocks: [
        {
          kind: "p",
          text: "The data collected through cookies by Google Analytics (user ID and IP address) are transmitted to and stored by Google on servers in the United States. If the websites anonymise IP addresses, the IP address of the User will be truncated by Google within the territory of a Member State of the European Union or in another state of the European Economic Area before it is transmitted to the United States. Only in exceptional cases will the full IP address be transmitted to a Google server in the United States and truncated there. Google will use this information to evaluate the manner of use of the Website by the User, to compile reports on website traffic for website operators and to provide other services related to website traffic and Internet use. Google will not associate the User’s IP address with any other data held by Google.",
        },
        {
          kind: "p",
          text: "Like many other services, Google Analytics and Facebook use their own cookies to analyze the activities of users. These files are used to store information, such as the time of commencement of the current visit and whether the User has ever been to our website, from which website he or she arrived to our site, screen resolution of his or her device, what information was interesting to him or her on our site, etc. By using the website, you consent to the processing of your data by Google in the manner and for the purposes set out above.",
        },
        { kind: "p", text: "Our website uses:" },
        { kind: "ul", items: ["Google Tag Manager", "Google Ads", "Google Analytics", "Hotjar", "LinkedIn Insight", "Calendly", "WP Full Picture"] },
        { kind: "p", text: "Our website also uses WP Full Picture (WP FP) to:" },
        {
          kind: "ul",
          items: [
            "manage tracking tools,",
            "handle user consents,",
            "record consents,",
            "control which tracking tools are loaded based on those consents,",
            "ensure that tracking tools work correctly,",
            "ensure that tracking cookies are set only after required permissions.",
          ],
        },
        { kind: "p", text: "To make it possible, WP Full Picture may use cookies and browser storage to:" },
        {
          kind: "ul",
          items: [
            "Remember your consent choices and privacy settings (necessary for the site to function correctly),",
            "Collect anonymous statistics about website usage (only if you consent), and",
            "Ensure that analytical and marketing tracking tools operate in line with your preferences.",
          ],
        },
        { kind: "p", text: "For a detailed list of cookies that WP FP sets, their duration, and purpose, please visit this page. You can change your cookie preferences at any time." },
      ],
      note: "On goodcase.io, “this page” links to the WP Full Picture cookie list, and the browser names in section 10 link to configuration instructions. Those link targets were not in the captured text and will be carried over from the live policy.",
    },
    {
      id: "profiling",
      heading: "Information on profiling",
      paragraphs: [
        "As part of data processing the Controller performs profiling of your personal data i.e. processes your personal data in an automated manner to analyse information about a person based on certain factors. Profiling is designed to enable us to provide you with tailored marketing content so that you receive information that may actually be of interest to you and match your profile and needs. The purpose of profiling is to better match content, in particular marketing content, so that you receive relevant marketing information.",
        "Please beware that implementing restrictions on the use of technologies described above may adversely affect the functioning of the website. For detailed information about the Google Analytics solution used, please click on the following link:",
      ],
      blocks: [
        { kind: "links", items: [{ label: "support.google.com/analytics/answer/6004245", href: "https://support.google.com/analytics/answer/6004245" }] },
        {
          kind: "p",
          text: "If you wish to limit the use of personalization of marketing content, you can, in addition to reconfiguring cookies on our website, also follow the steps indicated in the link below.",
        },
        {
          kind: "links",
          items: [
            {
              label: "support.google.com/My-Ad-Center-Help/answer/12155451",
              href: "https://support.google.com/My-Ad-Center-Help/answer/12155451?visit_id=638115296972925841-2900554943&rd=1",
            },
          ],
        },
        { kind: "p", text: "The legal basis for the transfer of data outside the EEA is Data Privacy Framework and Standard Contractual Clauses." },
        {
          kind: "p",
          text: "You can configure your browser to receive information about the use of cookies in order to decide whether to accept or reject them in specific cases or completely. If you do not accept the use of certain cookies, some features of our website may not be displayed correctly.",
        },
        { kind: "p", text: "Below are the configuration instructions for each browser." },
        { kind: "ul", items: ["Internet Explorer", "Microsoft Edge", "Mozilla Firefox", "Chrome", "Opera", "Safari"] },
      ],
    },
    {
      id: "final-provisions",
      heading: "Final provisions",
      paragraphs: [
        "Using the Controller’s website and providing your personal data in the forms is completely voluntary. In some cases, providing your personal data may be necessary to achieve a specific purpose.",
        "Goodcase.io Sp. z o. o. reserves the right to amend this Policy at any time due to changes in services offered or to adapt to changes in the law. Whenever possible, we will endeavour to inform you of any updates to the Policy prior to their implementation.",
      ],
    },
  ],
};
