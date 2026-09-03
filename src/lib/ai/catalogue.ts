import Anthropic from "@anthropic-ai/sdk";
import { CATALOGUE_SYSTEM, CATALOGUE_TOOL, type CatalogueDraft } from "./prompt";

const catalogueTool = CATALOGUE_TOOL as unknown as Anthropic.Tool;

export type CatalogueOutcome =
  | { ok: true; draft: CatalogueDraft; model: string }
  | { ok: false; reason: "not-configured" | "bad-image" | "api-error"; message: string };

const MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Real Anthropic call — vision in, structured catalogue draft out. There is no
 * canned fallback: without a key this returns `not-configured` and the UI says
 * so plainly.
 */
export async function catalogueFromImage(input: {
  base64: string;
  mediaType: string;
  intent: "GIFT" | "SELL";
  notes?: string;
}): Promise<CatalogueOutcome> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      reason: "not-configured",
      message: "AI cataloguing is off. Add ANTHROPIC_API_KEY to .env.local to switch it on.",
    };
  }
  if (!MEDIA_TYPES.has(input.mediaType)) {
    return { ok: false, reason: "bad-image", message: "Use a JPEG, PNG or WebP photo." };
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.DIBS_AI_MODEL || "claude-sonnet-5";

  try {
    const res = await client.messages.create({
      model,
      max_tokens: 1024,
      system: CATALOGUE_SYSTEM,
      tools: [catalogueTool],
      tool_choice: { type: "tool", name: catalogueTool.name },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: input.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: input.base64,
              },
            },
            {
              type: "text",
              text:
                `This piece is being ${input.intent === "SELL" ? "SOLD" : "given away as a GIFT"}.` +
                (input.notes ? `\n\nOwner's notes: ${input.notes}` : "") +
                `\n\nCatalogue it. Call save_catalogue_draft.`,
            },
          ],
        },
      ],
    });

    const block = res.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") {
      return { ok: false, reason: "api-error", message: "The model didn't return a draft. Try again." };
    }
    const draft = block.input as CatalogueDraft;
    if (input.intent === "GIFT") {
      draft.priceLowCents = null;
      draft.priceHighCents = null;
    }
    return { ok: true, draft, model };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown API error.";
    return { ok: false, reason: "api-error", message };
  }
}
