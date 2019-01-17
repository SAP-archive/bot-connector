import chai from 'chai'
import defaultMessageQueue from '../../src/utils/message_queue'
import { MessageQueue } from '../../src/utils/message_queue'

const should = chai.should()
const expect = chai.expect

describe('Message Queue', () => {

  let queue
  beforeEach(() => {
    queue = new MessageQueue()
  })

  const watcher = () => true
  const watcher2 = () => false
  const conversationId = 'abc'

  it('should initialize all necessary fields', () => {
    should.exist(queue.queue)
    expect(queue.pollWatchers).to.eql({})
  })

  describe('setWatcher', () => {
    it('should add a new watcher if none exists', () => {
      const watcherId = '123'
      queue.setWatcher(conversationId, watcherId, watcher)
      expect(queue.pollWatchers).to.have.property(conversationId)
      expect(queue.pollWatchers[conversationId]).to.have.property(watcherId)
      expect(queue.pollWatchers[conversationId][watcherId].handler).to.equal(watcher)
    })

    it('should add a second watcher if one already exists', () => {
      const firstWatcherId = '123'
      const secondWatcherId = '456'
      queue.setWatcher(conversationId, firstWatcherId, watcher)
      queue.setWatcher(conversationId, secondWatcherId, watcher2)
      expect(queue.pollWatchers[conversationId]).to.have.property(firstWatcherId)
      expect(queue.pollWatchers[conversationId]).to.have.property(secondWatcherId)
    })

    it('should replace an existing watcher if IDs match', () => {
      const watcherId = '123'
      const secondWatcher = () => 'something else'
      queue.setWatcher(conversationId, watcherId, watcher)
      queue.setWatcher(conversationId, watcherId, secondWatcher)
      expect(queue.pollWatchers[conversationId][watcherId].handler).to.equal(secondWatcher)
    })
  })

  describe('removeWatcher', () => {
    it('should remove an existing watcher', () => {
      const watcherId = '123'
      queue.setWatcher(conversationId, watcherId, watcher)
      queue.removeWatcher(conversationId, watcherId)
      expect(queue.pollWatchers).not.to.have.property(conversationId)
    })

    it('should remove keep an existing watcher with same conversationId', () => {
      const firstWatcherId = '123'
      const secondWatcherId = '456'
      queue.setWatcher(conversationId, firstWatcherId, watcher)
      queue.setWatcher(conversationId, secondWatcherId, watcher2)
      queue.removeWatcher(conversationId, firstWatcherId, watcher2)
      expect(queue.pollWatchers).to.have.property(conversationId)
      expect(queue.pollWatchers[conversationId]).not.to.have.property(firstWatcherId)
      expect(queue.pollWatchers[conversationId]).to.have.property(secondWatcherId)
    })

    it('should not have any side effects for unknown IDs', () => {
      const watcherId = '123'
      queue.setWatcher(conversationId, watcherId, watcher)
      queue.removeWatcher(conversationId, 'unknown')
      queue.removeWatcher('unknown', 'unknown')
      queue.removeWatcher('unknown', watcherId)
      expect(queue.pollWatchers).to.have.property(conversationId)
      expect(queue.pollWatchers[conversationId]).to.have.property(watcherId)
      expect(queue.pollWatchers[conversationId][watcherId].handler).to.equal(watcher)
    })

  })

  describe('default export', () => {
    it('should ba an instance of MessageQueue', () => {
      expect(defaultMessageQueue).to.be.an.instanceof(MessageQueue)
    })

    it('should be subscribed to all necessary events', () => {
      expect(defaultMessageQueue).to.be.an.instanceof(MessageQueue)
      expect(defaultMessageQueue.getQueue()._events).to.have.property('error')
      expect(defaultMessageQueue.getQueue()._events).to.have.property('job enqueue')
    })

  })

})
