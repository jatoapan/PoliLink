import { z } from 'zod'

const environmentSchema = z.object({
  VITE_API_URL: z.url().default('http://localhost:8000/api'),
})

const parsedEnvironment = environmentSchema.safeParse({
  VITE_API_URL: import.meta.env['VITE_API_URL'],
})

if (!parsedEnvironment.success) {
  const issues = parsedEnvironment.error.issues
    .map((issue) => issue.message)
    .join('; ')

  throw new Error(`Invalid frontend environment configuration: ${issues}`)
}

const apiUrl = parsedEnvironment.data.VITE_API_URL.replace(/\/+$/, '')

export const apiConfig = {
  apiUrl,
  backendUrl: apiUrl.replace(/\/api$/, ''),
} as const
