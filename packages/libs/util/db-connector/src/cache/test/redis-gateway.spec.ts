import { expect } from 'chai'
import environmentConfig from '../../env-config'
import { RedisGateway } from '../redis-gateway'

interface DummyInterface {
  index: number
  message: string
}
const testKey = 'test-key-1'
const testKey2 = 'test-key-2'

const testObject1: DummyInterface = {
  index: 1,
  message: 'Some message 1',
}

const testObject2: DummyInterface = {
  index: 2,
  message: 'Some message 2',
}

const hashKey = 'hkey'
const hashKey2 = 'hkey2'

describe('RedisGateway', () => {
  const redisDbConfig = environmentConfig.redisDb
  const redisGateway = new RedisGateway(redisDbConfig)
  const vanillaClient = redisGateway.redisClient

  beforeEach(async () => {
    await redisGateway.flush()
  })

  it('get should handle primitive values', async () => {
    await redisGateway.set<string>(testKey, 'test')

    const result = await redisGateway.get<string>(testKey)
    expect(result).to.eql('test')
  })

  it('getAll should get objects for all keys', async () => {
    vanillaClient.set(testKey, JSON.stringify(testObject1))
    vanillaClient.set(testKey2, JSON.stringify(testObject2))

    const result = await redisGateway.getAll<DummyInterface>([testKey, testKey2])
    expect(result.length).to.eql(2)
    expect(result[0]).to.eql(testObject1)
    expect(result[1]).to.eql(testObject2)
  })

  it('getList should return empty list if no list entries present at key', async () => {
    const result = await redisGateway.getList<DummyInterface>(testKey)
    expect(result).to.eql([])
  })

  it('getList should return list with one entry if only one entry present at key', async () => {
    await vanillaClient.lpushAsync(testKey, JSON.stringify(testObject1))

    const result = await redisGateway.getList<DummyInterface>(testKey)
    expect(result).to.eql([testObject1])
  })

  it('getList should return the full list stored at key', async () => {
    await vanillaClient.lpushAsync(testKey, JSON.stringify(testObject1))
    await vanillaClient.lpushAsync(testKey, JSON.stringify(testObject2))

    const result = await redisGateway.getList<DummyInterface>(testKey)
    expect(result).to.eql([testObject2, testObject1])
  })

  it('addValueToHeadOfList should handle single value', async () => {
    await redisGateway.addValueToHeadOfList<DummyInterface>(testKey, testObject1)
    const values = await vanillaClient.lrangeAsync(testKey, 0, -1)

    expect(values).to.eql([JSON.stringify(testObject1)])
  })

  it('addValuesToHeadOfList should handle multiple values', async () => {
    await redisGateway.addValuesToHeadOfList<DummyInterface>(testKey, [testObject1, testObject2])
    const values = await vanillaClient.lrangeAsync(testKey, 0, -1)

    expect(values).to.eql([JSON.stringify(testObject1), JSON.stringify(testObject2)])
  })

  it('addValueToTailOfList should handle single value', async () => {
    await redisGateway.addValueToTailOfList<DummyInterface>(testKey, testObject1)
    const values = await vanillaClient.lrangeAsync(testKey, 0, -1)

    expect(values).to.eql([JSON.stringify(testObject1)])
  })

  it('addValueToTailOfList should handle multiple values', async () => {
    await redisGateway.addValueToTailOfList<DummyInterface>(testKey, testObject1, testObject2)
    const values = await vanillaClient.lrangeAsync(testKey, 0, -1)

    expect(values).to.eql([JSON.stringify(testObject1), JSON.stringify(testObject2)])
  })

  it('getListLength should get list length', async () => {
    await vanillaClient.lpushAsync(testKey, JSON.stringify(testObject1), JSON.stringify(testObject2))

    const length = await redisGateway.getListLength(testKey)

    expect(length).to.eql(2)
  })

  it('popLastElement should remove and return the right most list entry', async () => {
    await vanillaClient.lpushAsync(testKey, JSON.stringify(testObject2), JSON.stringify(testObject1))

    const result = await redisGateway.popLastElement<DummyInterface>(testKey)

    expect(result).to.eql(testObject2)
  })

  it('incrementHashField should increment counter stored at specific hash field', async () => {
    await vanillaClient.hsetAsync(testKey, hashKey, 0)

    await redisGateway.incrementHashField(testKey, hashKey, 1)

    const incrementedHashKey = await vanillaClient.hgetAsync(testKey, hashKey)

    expect(+incrementedHashKey).to.eql(1)
  })

  it('getAllHashValues should get all hash values', async () => {
    await vanillaClient.hsetAsync(testKey, hashKey, 0)
    await vanillaClient.hsetAsync(testKey, hashKey2, 1)

    const values = await redisGateway.getAllHashValues(testKey)

    expect(values).to.eql({ [hashKey]: '0', [hashKey2]: '1' })
  })

  it('setHashValue should set hash value', async () => {
    const valueToSet = 'foo-bar'
    await redisGateway.setHashValue(testKey, hashKey, valueToSet)
    const valueSet = await vanillaClient.hgetAsync(testKey, hashKey)

    expect(valueSet).to.eql(valueToSet)
  })
  it('addValuesToHeadOfList and getList - check the order of data returned', async () => {
    await redisGateway.addValuesToHeadOfList<DummyInterface>(testKey, [testObject1, testObject2])
    await redisGateway.addValuesToHeadOfList<DummyInterface>(testKey, [
      { ...testObject2, index: 3 },
      { ...testObject2, index: 4 },
    ])
    const cachedMidPricesForSymbol = await redisGateway.getList<DummyInterface>(testKey)
    expect(cachedMidPricesForSymbol).to.eql([{ ...testObject2, index: 3 }, { ...testObject2, index: 4 }, testObject1, testObject2])
  })
  it('getList - ensure negative offsets work (grabbing data from the tail first)', async () => {
    const testObject3 = { ...testObject2, index: 3 }
    await redisGateway.addValueToTailOfList<DummyInterface>(testKey, ...[testObject1, testObject2, testObject3])

    // starting from head
    const returnFirst = await redisGateway.getList<DummyInterface>(testKey, 1)
    expect(returnFirst).to.eql([testObject1])

    const returnFirstSecond = await redisGateway.getList<DummyInterface>(testKey, 2)
    expect(returnFirstSecond).to.eql([testObject1, testObject2])

    const returnFirstSecondThird = await redisGateway.getList<DummyInterface>(testKey, 3)
    expect(returnFirstSecondThird).to.eql([testObject1, testObject2, testObject3])
    const returnFirstSecondThirdNoLimit = await redisGateway.getList<DummyInterface>(testKey)
    expect(returnFirstSecondThirdNoLimit).to.eql([testObject1, testObject2, testObject3])

    // starting from tail
    const returnThird = await redisGateway.getList<DummyInterface>(testKey, 0, -1)
    expect(returnThird).to.eql([testObject3])

    const returnThirdSecond = await redisGateway.getList<DummyInterface>(testKey, 0, -2)
    expect(returnThirdSecond).to.eql([testObject2, testObject3])

    const returnThirdSecondFirst = await redisGateway.getList<DummyInterface>(testKey, 0, -3)
    expect(returnThirdSecondFirst).to.eql([testObject1, testObject2, testObject3])
  })
})
