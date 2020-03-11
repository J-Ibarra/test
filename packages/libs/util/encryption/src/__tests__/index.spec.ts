import { decryptValue } from '..'

describe('foo', () => {
  it('bar', async () => {
    const val = await decryptValue(
      'AQICAHivZ9x2cppL8N+VJsjsueplL6JwuiJ67KHVEv1BufFQiQG0IWO/rh/gLCBFyXH3bl8OAAAAmjCBlwYJKoZIhvcNAQcGoIGJMIGGAgEAMIGABgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDKsK+uXmRKfUj7xodQIBEIBT1ENQv3M2jfzXM/Fi25fPSArWIllvWeEXULaiwsOS+eTWUtNFopRRka88pXuHboTOb4aS+4e1D/Qva0781274kqV72MBYZUKUeCupaO13SAOokK4=',
    )
    console.log(val)
  })
})
