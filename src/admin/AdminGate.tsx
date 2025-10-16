import { onAuthStateChanged, signInWithPopup, signOut, AuthError } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { auth, provider, db } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function AdminGate() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const snap = await getDoc(doc(db, 'roles', u.uid))
        setIsAdmin(snap.exists() && snap.data()?.admin === true)
      } else {
        setIsAdmin(false)
      }
    })
  }, [])

  const handleSignIn = async () => {
    setIsLoading(true)
    setAuthError(null)
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      const authError = error as AuthError
      if (authError.code === 'auth/operation-not-allowed') {
        setAuthError('Your email is not on the invitation list.')
      } else if (authError.code === 'auth/cancelled-popup-request') {
        // User cancelled the sign-in, don't show error
      } else {
        setAuthError(`Sign-in failed: ${authError.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold">Admin Access</h2>
        <p>Sign in with your Google account to access the admin panel.</p>
        {authError && (
          <div className="alert alert-error">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{authError}</span>
            </div>
          </div>
        )}
        <button 
          className={`btn btn-primary ${isLoading ? 'loading' : ''}`} 
          onClick={handleSignIn} 
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="avatar placeholder">
          <div className="bg-neutral text-neutral-content rounded-full w-10">
            <span>{isAdmin ? 'A' : user.email?.[0]?.toUpperCase()}</span>
          </div>
        </div>
        <div className="grow">
          <div className="font-medium">{isAdmin ? 'Admin' : 'Viewer'}</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => signOut(auth)}>Sign out</button>
      </div>

      {!isAdmin ? (
        <div className="alert alert-warning">You're signed in but not an admin.</div>
      ) : (
        <>
          {/* Admin panel organized by categories */}
          <div className="space-y-6">
            {/* Admin Management Section */}
            <div>
              <h2 className="text-xl font-bold mb-3">Admin Management</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {/* Settings card */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title">Settings</h3>
                    <p className="text-sm mb-2">Configure application settings and preferences.</p>
                    <div className="flex gap-2">
                      <Link className="btn btn-primary btn-sm" to="/admin/settings">Settings</Link>
                    </div>
                  </div>
                </div>

                {/* Invitation List card */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title">Invitation List</h3>
                    <p className="text-sm mb-2">Manage which email addresses are allowed to create accounts.</p>
                    <div className="flex gap-2">
                      <Link className="btn btn-primary btn-sm" to="/admin/allowlist">Manage Invitations</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Character Data Section */}
            <div>
              <h2 className="text-xl font-bold mb-3">Character Data</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {/* Characters card */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title capitalize">Characters</h3>
                    <p className="text-sm mb-2">Player Character Sheets for quick reference.</p>
                    <div className="flex gap-2">
                      <Link className="btn btn-primary btn-sm" to="/admin/characters/new">New</Link>
                      <Link className="btn btn-sm" to="/characters">View</Link>
                    </div>
                  </div>
                </div>

                {/* Player Characters card */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title">Player Characters</h3>
                    <p className="text-sm mb-2">Manage player character names that will be automatically bolded in session notes.</p>
                    <div className="flex gap-2">
                      <Link className="btn btn-primary btn-sm" to="/admin/player-characters">Manage Player Characters</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Related Section */}
            <div>
              <h2 className="text-xl font-bold mb-3">Campaign Related</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {/* Locations card */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title capitalize">Locations</h3>
                    <p className="text-sm mb-2">Places visited or heard about in Terraveil.</p>
                    <div className="flex gap-2">
                      <Link className="btn btn-primary btn-sm" to="/admin/locations/new">New</Link>
                      <Link className="btn btn-sm" to="/locations">View</Link>
                    </div>
                  </div>
                </div>

                {/* Monsters card */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title capitalize">Monsters</h3>
                    <p className="text-sm mb-2">Monsters encountered throughout the world.</p>
                    <div className="flex gap-2">
                      <Link className="btn btn-primary btn-sm" to="/admin/monsters/new">New</Link>
                      <Link className="btn btn-sm" to="/monsters">View</Link>
                    </div>
                  </div>
                </div>

                {/* NPCs card */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title capitalize">NPCs</h3>
                    <p className="text-sm mb-2">Characters met throughout the world.</p>
                    <div className="flex gap-2">
                      <Link className="btn btn-primary btn-sm" to="/admin/npcs/new">New</Link>
                      <Link className="btn btn-sm" to="/npcs">View</Link>
                    </div>
                  </div>
                </div>

                {/* Sessions card */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title capitalize">Sessions</h3>
                    <p className="text-sm mb-2">Journal of each session played.</p>
                    <div className="flex gap-2">
                      <Link className="btn btn-primary btn-sm" to="/admin/sessions/new">New</Link>
                      <Link className="btn btn-sm" to="/sessions">View</Link>
                    </div>
                  </div>
                </div>

                {/* Threads card */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title capitalize">Threads</h3>
                    <p className="text-sm mb-2">Story threads and plot lines across sessions.</p>
                    <div className="flex gap-2">
                      <Link className="btn btn-primary btn-sm" to="/admin/threads/new">New</Link>
                      <Link className="btn btn-sm" to="/threads">View</Link>
                    </div>
                  </div>
                </div>

                {/* Session Notes card */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title">Session Notes</h3>
                    <p className="text-sm mb-2">Take notes during sessions to turn into full session journal.</p>
                    <div className="flex gap-2">
                      <Link className="btn btn-primary btn-sm" to="/admin/session-notes">Create Notes</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
