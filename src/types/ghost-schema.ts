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

// Definindo categorias simplificadas de velocidade
export const SpeedCategorySchema = z.enum(["slow", "normal", "fast"]);
// Esquema de range de velocidade em m/s
export const SpeedRangeSchema = z.object({
  min: z.number().describe("Velocidade mínima em m/s"),
  max: z.number().describe("Velocidade máxima em m/s"),
});

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
  speedRange: SpeedRangeSchema,
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
  // Filtro de velocidade em m/s (min e max)
  speedFilter: z.object({
    min: z.number().nullable().describe("Velocidade mínima em m/s"),
    max: z.number().nullable().describe("Velocidade máxima em m/s"),
  }),
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
export type SpeedCategory = z.infer<typeof SpeedCategorySchema>;
export type SpeedDetails = z.infer<typeof SpeedDetailsSchema>;
export type GhostBehavior = z.infer<typeof GhostBehaviorSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type Ghost = z.infer<typeof GhostSchema>;
export type GhostData = z.infer<typeof GhostDataSchema>;
export type FilterOptions = z.infer<typeof FilterOptionsSchema>;
