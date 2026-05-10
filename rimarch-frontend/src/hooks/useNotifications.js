import { useState, useEffect, useCallback } from 'react'
import { getNotifications, markRead, markAllRead } from '../api/notifications'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread]               = useState(0)

  const fetch = useCallback(async () => {
    try {
      const { data } = await getNotifications()
      setNotifications(data.notifications)
      setUnread(data.unread)
    } catch {}
  }, [])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [fetch])

  const handleMarkRead = async (id) => {
    await markRead(id).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const handleMarkAllRead = async () => {
    await markAllRead().catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  return { notifications, unread, refetch: fetch, markRead: handleMarkRead, markAllRead: handleMarkAllRead }
}
