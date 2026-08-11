import 'server-only'

import { prisma } from '@/db/prisma'
import type { SubmissionStatus } from '@/generated/prisma/enums'
import { requireAdmin } from '@/server/auth/dal'

/** Admin submission reads. Uncached — these read cookies via requireAdmin(). */

export type SubmissionSummary = {
  id: string
  name: string
  email: string
  company: string | null
  monthlyRevenue: string | null
  status: SubmissionStatus
  notifiedAt: string | null
  createdAt: string
  /** First line of the message, for the list row. */
  excerpt: string
}

export type SubmissionDetail = SubmissionSummary & {
  websiteUrl: string | null
  message: string
  source: string | null
  adminNotes: string | null
  userAgent: string | null
}

const EXCERPT_LENGTH = 120

function excerptOf(message: string): string {
  const collapsed = message.replace(/\s+/g, ' ').trim()
  return collapsed.length > EXCERPT_LENGTH
    ? `${collapsed.slice(0, EXCERPT_LENGTH)}…`
    : collapsed
}

export type SubmissionFilter = {
  status?: SubmissionStatus | undefined
  search?: string | undefined
  take?: number
  skip?: number
}

export async function listSubmissions(filter?: SubmissionFilter): Promise<{
  items: SubmissionSummary[]
  total: number
  counts: Record<SubmissionStatus, number>
}> {
  await requireAdmin()

  const take = Math.min(filter?.take ?? 50, 200)
  const skip = filter?.skip ?? 0
  const search = filter?.search?.trim()

  const where = {
    ...(filter?.status ? { status: filter.status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { company: { contains: search, mode: 'insensitive' as const } },
            { message: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [rows, total, grouped] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        monthlyRevenue: true,
        status: true,
        notifiedAt: true,
        createdAt: true,
        message: true,
      },
    }),
    prisma.contactSubmission.count({ where }),
    prisma.contactSubmission.groupBy({ by: ['status'], _count: { _all: true } }),
  ])

  const counts = {
    NEW: 0,
    READ: 0,
    REPLIED: 0,
    BOOKED: 0,
    ARCHIVED: 0,
    SPAM: 0,
  } as Record<SubmissionStatus, number>

  for (const row of grouped) {
    counts[row.status] = row._count._all
  }

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      company: row.company,
      monthlyRevenue: row.monthlyRevenue,
      status: row.status,
      notifiedAt: row.notifiedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      excerpt: excerptOf(row.message),
    })),
    total,
    counts,
  }
}

export async function getSubmission(id: string): Promise<SubmissionDetail | null> {
  await requireAdmin()

  const row = await prisma.contactSubmission.findUnique({ where: { id } })
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    websiteUrl: row.websiteUrl,
    monthlyRevenue: row.monthlyRevenue,
    status: row.status,
    notifiedAt: row.notifiedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    message: row.message,
    excerpt: excerptOf(row.message),
    source: row.source,
    adminNotes: row.adminNotes,
    userAgent: row.userAgent,
  }
}
