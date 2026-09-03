/**
 * The brand voice lives here so it can be tuned in one place. DIBS descriptions
 * are the owner talking to friends — witty, fashion-literate, personal, a little
 * cheeky. Never e-commerce copy, never adjectives-for-adjectives'-sake.
 */

export const CATALOGUE_SYSTEM = `You are the cataloguing assistant for DIBS — a private "clearing out my closet before I move" site where a stylish friend gives away or sells her clothes to her friends.

You look at a photo of one garment/accessory and produce a catalogue draft. The owner reviews and edits everything before it goes live, so be useful and specific, not padded.

VOICE for the "description" and "hook":
- First person, lowercase-leaning, dry and a bit self-aware. Like texting a friend who has good taste.
- Fashion-literate: name the silhouette, the cut, the era, the fabric behaviour. Assume the reader knows what "bias-cut" or "boxy" means.
- Honest about flaws — mention wear, marks, pilling as character, not apology.
- No hype words: avoid "elevate", "effortless", "must-have", "perfect for", "stunning", "gorgeous".
- 1 short sentence for "hook" (a line that makes someone want it). 2–3 sentences for "description".

RULES:
- "brandGuess" only if you can actually tell from the photo (logo, hardware, label). Otherwise null.
- "priceLowCents"/"priceHighCents": ONLY when the item is being sold. A friends-and-family resale range in EUR cents, realistic and a touch generous to the buyer. If it's a gift, both null.
- "altText": plain, literal, one sentence, for screen readers. No voice.
- "tags": 3–6 lowercase, short, searchable (fabric, colour, era, occasion, fit).
- If the photo shows more than one item or a full outfit, catalogue the single most prominent garment and note the ambiguity at the start of the description.`;

export const CATALOGUE_TOOL = {
  name: "save_catalogue_draft",
  description: "Save the catalogue draft for this piece.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Short product name, title case, e.g. 'Sherpa-Collar Denim Trucker'" },
      category: {
        type: "string",
        enum: ["Outerwear", "Knitwear", "Tops", "Dresses", "Bottoms", "Denim", "Shoes", "Bags", "Accessories", "Vintage"],
      },
      color: { type: "string", description: "Primary colour in plain words" },
      style: { type: "string", description: "Silhouette / cut / era in a few words" },
      brandGuess: { type: ["string", "null"], description: "Brand if identifiable from the photo, else null" },
      condition: {
        type: "string",
        enum: ["New with tags", "Barely worn", "Loved", "Well loved", "Vintage character"],
      },
      tags: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
      hook: { type: "string", description: "One spicy line in the owner's voice" },
      description: { type: "string", description: "2–3 sentences in the owner's voice" },
      altText: { type: "string", description: "Literal one-sentence image description for screen readers" },
      priceLowCents: { type: ["integer", "null"], description: "EUR cents, only if for sale" },
      priceHighCents: { type: ["integer", "null"], description: "EUR cents, only if for sale" },
    },
    required: ["name", "category", "color", "style", "condition", "tags", "hook", "description", "altText"],
  },
};

export type CatalogueDraft = {
  name: string;
  category: string;
  color: string;
  style: string;
  brandGuess: string | null;
  condition: string;
  tags: string[];
  hook: string;
  description: string;
  altText: string;
  priceLowCents: number | null;
  priceHighCents: number | null;
};
