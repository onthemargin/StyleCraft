import type { AuthorTarget } from "./types.ts";

export interface VoiceCard {
  /** One-line descriptor injected into prompts. */
  summary: string;
  /** Sentence-length guidance (words). Coarse on ≤500-char input — a soft target. */
  sentenceLen: { ideal: number; max: number };
  diction: string;
  devices: string[];
  avoid: string[];
}

export interface AuthorDef {
  id: AuthorTarget;
  label: string;
  era: string;
  /** Shown in the UI next to the pick — the transferable virtues. */
  description: string;
  voiceCard: VoiceCard;
  /**
   * Hidden style anchors — never shown in the UI. Used by the Coach (always)
   * and the Writer (iteration ≥ 2, via consolidated instructions) so both aim
   * at one definition of the voice.
   *
   * Public-domain authors: real, characteristic sentences. Hemingway is NOT yet
   * public domain (d. 1961), so its exemplars are ORIGINAL style-true pastiche
   * we authored, not quotations.
   */
  exemplars: string[];
}

export const AUTHORS: Record<AuthorTarget, AuthorDef> = {
  hemingway: {
    id: "hemingway",
    label: "Ernest Hemingway",
    era: "1899–1961",
    description:
      "Concision and concrete nouns. Short declarative sentences, little to no adverbs, feeling carried by understatement rather than adjectives.",
    voiceCard: {
      summary:
        "short declarative sentences, concrete nouns, minimal adverbs, understatement, no ornament",
      sentenceLen: { ideal: 8, max: 15 },
      diction: "plain, concrete, everyday words; nouns and verbs over modifiers",
      devices: ["short declaratives", "understatement", "repetition of plain words", '"and" to join'],
      avoid: ["adverbs", "abstract nouns", "ornate adjectives", "long subordinate clauses"],
    },
    // Original pastiche (Hemingway is not public domain).
    exemplars: [
      "The river was cold and fast. We ate the fish and did not talk about the day.",
      "It was a good room. It was clean and the light was good and it was quiet.",
      "He worked until dark. The work was hard but it was honest and he was not sorry.",
    ],
  },

  twain: {
    id: "twain",
    label: "Mark Twain",
    era: "1835–1910",
    description:
      "Vivid, vernacular clarity with dry wit. Plain speech, concrete images, and a comic turn that never obscures the point.",
    voiceCard: {
      summary:
        "vernacular, plain and vivid, dry humor, concrete images, a wry conversational turn",
      sentenceLen: { ideal: 16, max: 30 },
      diction: "colloquial, direct American English; homely, concrete words",
      devices: ["wry understatement", "vivid concrete images", "conversational aside"],
      avoid: ["stiff formality", "abstraction", "pomposity"],
    },
    exemplars: [
      "You don't know about me without you have read a book by the name of 'The Adventures of Tom Sawyer'; but that ain't no matter.",
      "The report of my death was an exaggeration.",
      "Get your facts first, and then you can distort them as much as you please.",
    ],
  },

  orwell: {
    id: "orwell",
    label: "George Orwell",
    era: "1903–1950",
    description:
      "Plain-English clarity. Short, common words in the active voice; jargon and euphemism cut away so the meaning shows through like light through a windowpane.",
    voiceCard: {
      summary:
        "plain words, active voice, no jargon or euphemism, concrete and direct, unadorned clarity",
      sentenceLen: { ideal: 18, max: 32 },
      diction: "short familiar words over long or foreign ones; never a jargon term where a plain one serves",
      devices: ["active voice", "concrete example", "plain declarative"],
      avoid: ["passive voice", "jargon", "euphemism", "dead metaphors", "abstraction"],
    },
    exemplars: [
      "Good prose is like a windowpane.",
      "Political language is designed to make lies sound truthful and murder respectable, and to give an appearance of solidity to pure wind.",
      "If thought corrupts language, language can also corrupt thought.",
    ],
  },

  austen: {
    id: "austen",
    label: "Jane Austen",
    era: "1775–1817",
    description:
      "Precise, balanced sentences and controlled irony. Elegant economy — every clause measured, wit delivered with a straight face.",
    voiceCard: {
      summary:
        "balanced, precise sentences; polished formality; dry irony delivered deadpan",
      sentenceLen: { ideal: 24, max: 40 },
      diction: "refined, exact, slightly formal; measured and poised",
      devices: ["balanced clauses", "understated irony", "epigrammatic generalization"],
      avoid: ["slang", "clumsy repetition", "gush", "vagueness"],
    },
    exemplars: [
      "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
      "I declare after all there is no enjoyment like reading! How much sooner one tires of anything than of a book!",
      "Vanity and pride are different things, though the words are often used synonymously.",
    ],
  },

  wilde: {
    id: "wilde",
    label: "Oscar Wilde",
    era: "1854–1900",
    description:
      "Wit and economy. Polished, confident lines that turn on a paradox — maximum meaning in the fewest, sharpest words.",
    voiceCard: {
      summary:
        "epigrammatic, paradoxical, confident and polished; economical and quotable",
      sentenceLen: { ideal: 14, max: 26 },
      diction: "elegant, urbane, precise; witty rather than plain",
      devices: ["paradox", "epigram", "antithesis", "reversal of a cliché"],
      avoid: ["earnest plodding", "over-explanation", "sentimentality"],
    },
    exemplars: [
      "I can resist everything except temptation.",
      "We are all in the gutter, but some of us are looking at the stars.",
      "The only way to get rid of a temptation is to yield to it.",
    ],
  },

  franklin: {
    id: "franklin",
    label: "Benjamin Franklin",
    era: "1706–1790",
    description:
      "Practical plainness. Homely, useful sentences and aphoristic good sense — persuasive because it is simple, balanced, and memorable.",
    voiceCard: {
      summary:
        "plain, practical, aphoristic; balanced maxims and homely good sense",
      sentenceLen: { ideal: 14, max: 26 },
      diction: "simple, useful, concrete; proverbial and balanced",
      devices: ["aphorism", "parallel maxim", "practical advice"],
      avoid: ["abstraction", "ornament", "hedging", "vagueness"],
    },
    exemplars: [
      "Early to bed and early to rise, makes a man healthy, wealthy, and wise.",
      "Well done is better than well said.",
      "An investment in knowledge pays the best interest.",
    ],
  },
};

export function getAuthor(id: AuthorTarget): AuthorDef {
  return AUTHORS[id];
}
