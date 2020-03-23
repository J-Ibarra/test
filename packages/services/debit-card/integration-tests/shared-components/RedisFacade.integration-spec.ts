import { INestApplication } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'

import { setUp, tearDown } from '../utils/before-each.util'
import {
  RedisFacade,
  ASYNCHRONOUS_REDIS_CLIENT,
} from '../../src/shared-components/providers'

const testKey = 'key'

interface DummyInterface {
  foo: string
  id: string
}

const testObj = {
  foo: 'nice',
  id: 'notBad',
}

const testObj2 = {
  foo: 'nice',
  id: 'veryBad',
}

describe('integration:RedisFacade', () => {
  let redisFacade: RedisFacade
  let vanillaRedisCient
  let app: INestApplication
  let fixture: TestingModule

  beforeAll(async () => {
    const { app: nestApp, moduleFixture } = await setUp()
    app = nestApp
    fixture = moduleFixture
    redisFacade = moduleFixture.get<RedisFacade>(RedisFacade)
    vanillaRedisCient = moduleFixture.get(ASYNCHRONOUS_REDIS_CLIENT)
  })

  beforeEach(async () => {
    await redisFacade.flush()
  })

  it('lock should lock the key and only allow concurrent access when unlocked', async () => {
    const unlock = await redisFacade.lock(testKey)

    try {
      await redisFacade.lock(testKey, 1)
    } catch (e) {
      expect(e.message).toEqual(`Unable to obtain lock for ${testKey}`)
    }

    unlock()
    await new Promise(resolve => setTimeout(resolve, 2000))

    const unlockForSecondLock = await redisFacade.lock(testKey)
    expect(unlockForSecondLock).toBeTruthy()
    unlockForSecondLock()
  })

  it('should add value to hash stored at given key when calling addValueToHash', async () => {
    await redisFacade.addValueToHash<DummyInterface>(
      testKey,
      testObj.foo,
      testObj,
    )
    const values = await vanillaRedisCient.hgetallAsync(testKey)

    expect(Object.keys(values).length).toEqual(1)
  })

  it('getHashValues should return empty list if no list entries present at key', async () => {
    const result = await redisFacade.getHashValues<DummyInterface>(testKey)
    expect(result).toEqual([])
  })

  it('getHashValues should return list with one entry if only one entry present at hash', async () => {
    await vanillaRedisCient.hsetAsync(
      testKey,
      testObj.id,
      JSON.stringify(testObj),
    )

    const result = await redisFacade.getHashValues<DummyInterface>(testKey)
    expect(result).toEqual([testObj])
  })

  it('getHashValues should return the full list of fields stored in the hash', async () => {
    await vanillaRedisCient.hsetAsync(
      testKey,
      testObj.id,
      JSON.stringify(testObj),
    )
    await vanillaRedisCient.hsetAsync(
      testKey,
      testObj2.id,
      JSON.stringify(testObj2),
    )

    const result = await redisFacade.getHashValues<DummyInterface>(testKey)
    expect(result).toEqual([testObj, testObj2])
  })

  it('getHashValues should return the full list of fields stored in the hash', async () => {
    await vanillaRedisCient.hsetAsync(
      testKey,
      testObj.id,
      JSON.stringify(testObj),
    )
    await vanillaRedisCient.hsetAsync(
      testKey,
      testObj2.id,
      JSON.stringify(testObj2),
    )

    const result = await redisFacade.getHashValues<DummyInterface>(testKey)
    expect(result).toEqual([testObj, testObj2])
  })

  it('removeValuesFromHash should remove single hash values', async () => {
    await vanillaRedisCient.hsetAsync(
      testKey,
      testObj.id,
      JSON.stringify(testObj),
    )

    await redisFacade.removeValuesFromHash(testKey, [testObj.id])
    const remaining = await vanillaRedisCient.hgetallAsync(testKey)
    expect(remaining).toEqual(null)
  })

  it('removeValuesFromHash should remove multiple hash values', async () => {
    await vanillaRedisCient.hsetAsync(
      testKey,
      testObj.id,
      JSON.stringify(testObj),
    )
    await vanillaRedisCient.hsetAsync(
      testKey,
      testObj2.id,
      JSON.stringify(testObj2),
    )

    await redisFacade.removeValuesFromHash(testKey, [testObj.id, testObj2.id])
    const remaining = await vanillaRedisCient.hgetallAsync(testKey)
    expect(remaining).toEqual(null)
  })

  it('addValuesToHash should add multiple values to hash stored at key', async () => {
    await redisFacade.addValuesToHash(
      testKey,
      new Map([[testObj.id, testObj], [testObj2.id, testObj2]]),
    )
    const currentHashes = await vanillaRedisCient.hgetallAsync(testKey)
    expect(Object.keys(currentHashes).length).toEqual(2)
  })

  afterAll(async () => await tearDown(app, fixture))
})
