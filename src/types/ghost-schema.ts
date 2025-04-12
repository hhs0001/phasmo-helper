import { z } from "zod";

// Definições de enums com Zod
export const GameModeSchema = z.enum([
  "Amateur",
  "Intermediate",
  "Professional",
  "Nightmare",
  "Insanity",
]);

export const EvidenceSchema = z.enum([
  "EMF",
  "SpiritBox",
  "Fingerprints",
  "GhostOrb",
  "GhostWriting",
  "FreezingTemps",
  "DotsProjector",
]);

export const InclusionStateSchema = z.enum(["include", "exclude", "neutral"]);

export const GhostSpeedSchema = z.enum([
  "verySlow",
  "slow",
  "normal",
  "fast",
  "veryFast",
  "variableSpeed",
]);

// Esquemas para tipos mais complexos
export const SpeedDetailsSchema = z.object({
  baseSpeed: z.number().describe("Velocidade base em m/s"),
  losMultiplier: z
    .number()
    .optional()
    .describe("Multiplicador quando tem linha de visão"),
  description: z.string(),
  variableSpeed: z
    .boolean()
    .optional()
    .describe("Se a velocidade varia (como no caso do Deogen)"),
});

export const GhostBehaviorSchema = z.object({
  description: z.string(),
  gameMode: GameModeSchema.optional().describe(
    "Comportamento específico para um modo de jogo"
  ),
});

export const MediaSchema = z.object({
  type: z.enum(["image", "video", "gif", "audio"]),
  url: z.string().url(),
  description: z.string(),
});

export const GhostSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  evidences: z.array(EvidenceSchema),
  guaranteedEvidences: z.array(EvidenceSchema).optional(),
  strengths: z.string(),
  weaknesses: z.string(),
  behaviors: z.array(GhostBehaviorSchema),
  huntThreshold: z.number().describe("% de sanidade para começar a caçar"),
  speed: GhostSpeedSchema,
  hasLOS: z
    .boolean()
    .describe("Se o fantasma acelera quando tem linha de visão com o jogador"),
  speedDetails: SpeedDetailsSchema,
  media: z.array(MediaSchema).optional(),
});

export const GhostDataSchema = z.object({
  ghosts: z.record(z.string(), GhostSchema),
  lastUpdate: z.string().nullable(),
});

export const FilterOptionsSchema = z.object({
  evidenceInclusion: z.record(EvidenceSchema, InclusionStateSchema),
  speed: z.record(GhostSpeedSchema, z.boolean()),
  hasLOS: InclusionStateSchema,
  huntThreshold: z.object({
    min: z.number().nullable(),
    max: z.number().nullable(),
  }),
});

// Tipos inferidos do Zod
export type GameMode = z.infer<typeof GameModeSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type InclusionState = z.infer<typeof InclusionStateSchema>;
export type GhostSpeed = z.infer<typeof GhostSpeedSchema>;
export type SpeedDetails = z.infer<typeof SpeedDetailsSchema>;
export type GhostBehavior = z.infer<typeof GhostBehaviorSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type Ghost = z.infer<typeof GhostSchema>;
export type GhostData = z.infer<typeof GhostDataSchema>;
export type FilterOptions = z.infer<typeof FilterOptionsSchema>;
