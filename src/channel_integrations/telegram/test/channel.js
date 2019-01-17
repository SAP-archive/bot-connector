import { assert } from 'chai'
import Telegram from '../channel'
import mockups from './mockups.json'
const telegram = new Telegram()
const fakeFormatMessage = json => telegram.formatOutgoingMessage(
  { channel: { token: '' }, chatId: '' },
  { attachment: json },
  { senderId: '' },
)

describe('Telegram service', () => {
  mockups.forEach(mockup =>
    it('Should create keyboard layout from messages', () => {
      const formattedMessage = fakeFormatMessage(mockup.json)
      assert.deepEqual(JSON.parse(JSON.stringify(formattedMessage)), mockup.expected)
    })
  )
})
