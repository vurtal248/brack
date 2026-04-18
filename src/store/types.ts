import { z } from 'zod'

/* ============================================================
   TYPESCRIPT TYPES & ZOD SCHEMAS
   Single source of truth for the entire data model.
   ============================================================ */

// A single game/set score within a match
export interface MatchSet {
  p1: number | ''
  p2: number | ''
}

// A single match node in the bracket
export interface Match {
  p1Id: number | null
  p2Id: number | null
  winnerId: number | null
  sets: MatchSet[]
}

// A participant/competitor
export interface Participant {
  id: number
  name: string
}

export type BracketStatus = 'seeding' | 'active' | 'complete'
export type BracketLayout = 'single' | 'double'

// The top-level bracket document stored in localStorage
export interface Bracket {
  id: string
  name: string
  tag: string
  layout: BracketLayout
  include3rdPlace: boolean
  doubleSeed: boolean
  thirdPlaceMatch: Match | null
  createdAt: string
  status: BracketStatus
  participants: Participant[]
  rounds: Match[][]
}

/* ============================================================
   ZOD SCHEMAS — used for safe localStorage parsing (V1 compat)
   ============================================================ */
const MatchSetSchema = z.object({
  p1: z.union([z.number(), z.literal('')]),
  p2: z.union([z.number(), z.literal('')]),
})

const MatchSchema = z.object({
  p1Id: z.number().nullable(),
  p2Id: z.number().nullable(),
  winnerId: z.number().nullable(),
  sets: z.array(MatchSetSchema).default([]),
})

const ParticipantSchema = z.object({
  id: z.number(),
  name: z.string().default(''),
})

export const BracketSchema = z.object({
  id: z.string(),
  name: z.string(),
  tag: z.string().default(''),
  layout: z.enum(['single', 'double']).default('single'),
  include3rdPlace: z.boolean().default(false),
  doubleSeed: z.boolean().default(false),
  thirdPlaceMatch: MatchSchema.nullable().default(null),
  createdAt: z.string(),
  status: z.enum(['seeding', 'active', 'complete']),
  participants: z.array(ParticipantSchema),
  rounds: z.array(z.array(MatchSchema)).default([]),
})

export const BracketsArraySchema = z.array(BracketSchema)
