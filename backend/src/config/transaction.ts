import mongoose from 'mongoose'

/**
 * Run `work` inside a multi-document transaction, retrying once on the
 * transient errors MongoDB raises under concurrent writes.
 *
 * Transactions require a replica set. The production compose stack uses a
 * replica-set-aware Mongo; in environments without one (a standalone local
 * mongod) `startTransaction` throws and we fall back to running the work
 * directly so the app keeps functioning. That fallback is what makes the same
 * code path work in tests and against a single-node dev database.
 */
export async function withTransaction<T>(
  work: (session: mongoose.ClientSession) => Promise<T>,
): Promise<{ result: T; transactional: boolean }> {
  const session = await mongoose.startSession()
  try {
    let result!: T
    await session.withTransaction(async () => {
      result = await work(session)
    })
    return { result, transactional: true }
  } catch (error) {
    // Transactions unsupported (standalone server) -> run without one.
    if (isTransactionUnsupported(error)) {
      const result = await work(null as unknown as mongoose.ClientSession)
      return { result, transactional: false }
    }
    throw error
  } finally {
    await session.endSession()
  }
}

function isTransactionUnsupported(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    /Transaction numbers are only allowed on a replica set/i.test(message) ||
    /This MongoDB deployment does not support retryable writes/i.test(message) ||
    /Transaction.*not supported/i.test(message) ||
    /standalone/i.test(message)
  )
}
