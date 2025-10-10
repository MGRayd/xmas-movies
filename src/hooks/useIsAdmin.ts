import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (!u) return setIsAdmin(false)
      const snap = await getDoc(doc(db, 'roles', u.uid))
      setIsAdmin(snap.exists() && snap.data()?.admin === true)
    })
  }, [])

  return { isAdmin, user }
}
