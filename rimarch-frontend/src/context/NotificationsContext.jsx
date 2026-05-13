import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getNotifications, markRead, markAllRead, deleteNotification } from '../api/notifications'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread]               = useState(0)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const visibleRef = useRef(!document.hidden)

  const loadNotifications = useCallback(async () => {
    if (!visibleRef.current) return
    try {
      const { data } = await getNotifications()
      setNotifications(data.notifications)
      setUnread(data.unread)
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)

    const onVisibility = () => {
      visibleRef.current = !document.hidden
      if (!document.hidden) loadNotifications()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [loadNotifications])

  const handleMarkRead = async (id) => {
    const target = notifications.find(n => n.id === id)
    if (!target || target.read) return
    const snapshot = { notifications, unread }
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
    setUnread(u => Math.max(0, u - 1))
    try {
      await markRead(id)
    } catch {
      setNotifications(snapshot.notifications)
      setUnread(snapshot.unread)
    }
  }

  const handleMarkAllRead = async () => {
    const snapshot = { notifications, unread }
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
    setUnread(0)
    try {
      await markAllRead()
    } catch {
      setNotifications(snapshot.notifications)
      setUnread(snapshot.unread)
    }
  }

  const handleDelete = async (id) => {
    const target = notifications.find(n => n.id === id)
    const snapshot = { notifications, unread }
    setNotifications(ns => ns.filter(n => n.id !== id))
    if (target && !target.read) setUnread(u => Math.max(0, u - 1))
    try {
      await deleteNotification(id)
    } catch {
      setNotifications(snapshot.notifications)
      setUnread(snapshot.unread)
    }
  }

  return (
    <NotificationsContext.Provider value={{
      notifications, unread, loading, error,
      refetch: loadNotifications,
      markRead: handleMarkRead,
      markAllRead: handleMarkAllRead,
      deleteNotification: handleDelete,
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
