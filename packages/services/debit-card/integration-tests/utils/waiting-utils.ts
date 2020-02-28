export async function dbChangeRecorded(
  dbChangeCheck: () => Promise<boolean>,
  attempt = 30,
) {
  const changeHappened = await dbChangeCheck()

  if (changeHappened) {
    return true
  } else if (attempt === 5) {
    return false
  }

  await new Promise(res => setTimeout(res, 2_000))
  return dbChangeRecorded(dbChangeCheck, attempt + 1)
}
