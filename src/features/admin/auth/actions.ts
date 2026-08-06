'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { prisma } from '@/db/prisma'
import { logger } from '@/lib/logger'
import {
  fail,
  formValue,
  ok,
  parseInput,
  unexpected,
  type ActionResult,
} from '@/server/actions/result'
import { getSupabaseUser } from '@/server/auth/dal'
import { checkRateLimit, getClientKey } from '@/server/auth/rate-limit'
import { createServerSupabaseClient } from '@/server/auth/supabase'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  next: z.string().optional(),
})

/**
 * Only same-origin, absolute-path redirects are honoured. Accepting the raw
 * `next` parameter would be an open redirect.
 */
function safeRedirectTarget(next: string | undefined): string {
  if (!next) return '/admin'
  if (!next.startsWith('/') || next.startsWith('//')) return '/admin'
  if (!next.startsWith('/admin')) return '/admin'
  return next
}

export async function login(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(loginSchema, {
    email: formValue(formData, 'email'),
    password: formValue(formData, 'password'),
    next: formValue(formData, 'next') || undefined,
  })

  if (!parsed.ok) return parsed.result

  const key = await getClientKey()
  const { allowed } = await checkRateLimit('login', key)

  if (!allowed) {
    return fail('Too many attempts. Try again in a few minutes.')
  }

  let target: string

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (error || !data.user) {
      // Deliberately identical for unknown email and wrong password: a
      // distinguishable message is an account enumeration oracle.
      logger.warn('Failed admin login attempt')
      return fail('Those credentials were not recognised.')
    }

    // Authenticating with Supabase is not the same as being an administrator.
    const admin = await prisma.adminUser.findUnique({
      where: { supabaseId: data.user.id },
      select: { id: true, isActive: true },
    })

    if (!admin || !admin.isActive) {
      await supabase.auth.signOut()
      logger.warn('Non-admin or deactivated user attempted login', {
        supabaseId: data.user.id,
      })
      return fail('Those credentials were not recognised.')
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    })

    target = safeRedirectTarget(parsed.data.next)
  } catch (error) {
    return unexpected('login', error)
  }

  // redirect() throws a control-flow signal, so it must sit outside the
  // try/catch that would otherwise swallow it.
  redirect(target)
}

export async function logout(): Promise<never> {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})

export async function requestPasswordReset(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(forgotPasswordSchema, {
    email: formValue(formData, 'email'),
  })

  if (!parsed.ok) return parsed.result

  const key = await getClientKey()
  const { allowed } = await checkRateLimit('login', key)

  if (!allowed) {
    return fail('Too many attempts. Try again in a few minutes.')
  }

  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/reset-password`,
    })
  } catch (error) {
    logger.error('Password reset request failed', { error })
  }

  // Always reports success, whether or not the address exists. Anything else
  // tells an attacker which addresses are real.
  return ok()
}

const resetPasswordSchema = z
  .object({
    password: z.string().min(12, 'Use at least 12 characters.'),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export async function resetPassword(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(resetPasswordSchema, {
    password: formValue(formData, 'password'),
    confirmPassword: formValue(formData, 'confirmPassword'),
  })

  if (!parsed.ok) return parsed.result

  // The recovery link establishes a session; without one there is nothing to
  // update, and we must not allow an unauthenticated password change.
  const user = await getSupabaseUser()

  if (!user) {
    return fail('This reset link has expired. Request a new one.')
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

    if (error) {
      return fail('Could not update the password. Request a new reset link.')
    }
  } catch (error) {
    return unexpected('resetPassword', error)
  }

  redirect('/admin')
}
