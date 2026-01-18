import React, { useEffect, useMemo, useState } from 'react'

function api(path, opts = {}) {
  return fetch(`/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  })
}

function authedApi(token, path, opts = {}) {
  return api(path, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: `Bearer ${token}`
    }
  })
}

export default function App() {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(localStorage.getItem('jwt') || '')

  const [emails, setEmails] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const [toUser, setToUser] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  // Derive selected email from ID
  const selected = useMemo(() =>
    selectedId ? emails.find(e => e.id === selectedId) : null,
    [selectedId, emails]
  )

  const authed = useMemo(() => ({
    token,
    refreshEmails: async () => {
      const res = await authedApi(token, '/emails/')
      if (res.ok) {
        setEmails(await res.json())
      }
    }
  }), [token])

  useEffect(() => {
    if (!token) return
    authed.refreshEmails()

    const es = new EventSource(`/api/events/stream/?token=${encodeURIComponent(token)}`)
    es.addEventListener('connected', () => {
      // no-op
    })
    es.onmessage = () => {
      authed.refreshEmails()
    }
    es.addEventListener('email.spam_classified', () => authed.refreshEmails())
    es.addEventListener('email.priority_assigned', () => authed.refreshEmails())
    es.addEventListener('email.summary', () => authed.refreshEmails())
    es.addEventListener('email.action_items', () => authed.refreshEmails())
    es.addEventListener('email.tone_analyzed', () => authed.refreshEmails())
    es.addEventListener('email.url_scanned', () => authed.refreshEmails())

    return () => es.close()
  }, [token])

  async function doAuth() {
    if (mode === 'register') {
      const r = await api('/auth/register/', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })
      if (!r.ok) {
        alert('Register failed')
        return
      }
    }

    const res = await api('/auth/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    if (!res.ok) {
      alert('Login failed')
      return
    }
    const data = await res.json()
    localStorage.setItem('jwt', data.access)
    setToken(data.access)
  }

  async function sendEmail() {
    const res = await authedApi(token, '/emails/', {
      method: 'POST',
      body: JSON.stringify({ recipient_username: toUser, subject, body })
    })
    if (!res.ok) {
      alert('Send failed')
      return
    }
    setToUser('')
    setSubject('')
    setBody('')
    alert('Sent')
  }

  const [isComposeOpen, setIsComposeOpen] = useState(false)

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="sidebar-logo" style={{ margin: '0 auto 1.5rem auto' }}>✉</div>
          <h1 className="auth-title">AI Inbox</h1>
          <p className="auth-subtitle">Next-gen firewall powered by Solace Agent Mesh</p>

          <div className="auth-tabs">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              Log In
            </button>
            <button
              className={mode === 'register' ? 'active' : ''}
              onClick={() => setMode('register')}
            >
              Sign Up
            </button>
          </div>

          <div className="auth-form">
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={doAuth}>
              {mode === 'register' ? 'Create Account' : 'Access Inbox'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">✉</div>
          <div>
            <div className="sidebar-title">Inbox</div>
            <div className="sidebar-subtitle">Firewall MVP</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">📥 Inbox</button>
          <button className="nav-item">⭐ Starred</button>
          <button className="nav-item">📤 Sent</button>
          <button className="nav-item">🚫 Spam</button>
        </nav>

        <button
          className="nav-item"
          style={{ marginTop: 'auto', color: '#ef4444' }}
          onClick={() => {
            localStorage.removeItem('jwt')
            setToken('')
          }}
        >
          ↪ Logout
        </button>

        <div className="sidebar-footer">
          Powered by Solace Agent Mesh
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="inbox-header">
          <div>
            <h2 className="inbox-title">Inbox</h2>
            <p className="inbox-subtitle">Realtime email stream with AI priority classification</p>
          </div>
          <button onClick={() => setIsComposeOpen(!isComposeOpen)}>
            + New Message
          </button>
        </header>

        <div className="inbox-container">
          {/* Email List */}
          <div className="email-list-pane">
            {emails.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No emails found.
              </div>
            ) : (
              emails.map((e) => (
                <div
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className={`email-row ${selected?.id === e.id ? 'selected' : ''}`}
                >
                  <div className={`email-dot priority-${(e.priority || 'Medium').toLowerCase()}`}></div>
                  <div className="email-meta">
                    <div className="email-sender">{e.sender_username || 'unknown'}</div>
                    <div className="email-subject">{e.subject}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span className={`email-badge spam-${e.spam_label}`}>
                        {e.spam_label || 'SCANNING'}
                      </span>
                      {e.priority && (
                        <span className="email-badge">
                          {e.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Email Detail / Reading Pane */}
          <div className="email-detail-pane">
            {!selected ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <p>Select an email to view details</p>
              </div>
            ) : (
              <div>
                <div className="detail-header">
                  <h2 className="detail-subject">{selected.subject}</h2>
                  <div className="detail-meta">
                    From: <span style={{ color: 'var(--text-primary)' }}>{selected.sender_username}</span>
                  </div>
                </div>

                <div className="detail-body">
                  {selected.body}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>AI Analysis</h3>

                  <div className="ai-cards-grid">
                    <div className="ai-card">
                      <span className="ai-label">Summary</span>
                      <div className="ai-value" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                        {selected.summary || 'Processing...'}
                      </div>
                    </div>

                    <div className="ai-card">
                      <span className="ai-label">Action Items</span>
                      <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0', fontSize: '0.9rem' }}>
                        {selected.action_items && Array.isArray(selected.action_items)
                          ? selected.action_items.map((item, i) => (
                            <li key={i}>
                              {typeof item === 'object' ? JSON.stringify(item) : item}
                            </li>
                          ))
                          : <li>{JSON.stringify(selected.action_items || 'None')}</li>
                        }
                      </ul>
                    </div>

                    <div className="ai-card">
                      <span className="ai-label">Classification</span>
                      <div>
                        Spam: <b style={{ color: selected.spam_label === 'spam' ? '#fca5a5' : '#86efac' }}>{selected.spam_label || 'Processing...'}</b>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <b>Priority: {selected.priority || 'Processing...'}</b>
                        {selected.priority_reason && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            {selected.priority_reason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ai-card">
                      <span className="ai-label">Tone Analysis</span>
                      {selected.tone_emotion ? (
                        <>
                          <div style={{ marginTop: 4 }}>
                            Emotion: <b style={{ color: '#a5b4fc' }}>{selected.tone_emotion}</b>
                            {selected.tone_confidence && (
                              <span style={{ marginLeft: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                ({selected.tone_confidence} confidence)
                              </span>
                            )}
                          </div>
                          {selected.tone_explanation && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                              {selected.tone_explanation}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ color: 'var(--text-secondary)' }}>Processing...</div>
                      )}
                    </div>

                    <div className="ai-card">
                      <span className="ai-label">URL Security Scan</span>
                      {selected.url_scan_verdict ? (
                        <>
                          <div style={{ marginTop: 4 }}>
                            Verdict: <b style={{
                              color: selected.url_scan_verdict === 'SAFE' ? '#86efac' :
                                     selected.url_scan_verdict === 'SUSPICIOUS' ? '#fcd34d' : '#fca5a5'
                            }}>{selected.url_scan_verdict}</b>
                            {selected.url_scan_threat_level && (
                              <span style={{ marginLeft: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                (Threat: {selected.url_scan_threat_level})
                              </span>
                            )}
                          </div>
                          {(selected.url_scan_malicious_count > 0 || selected.url_scan_suspicious_count > 0) && (
                            <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
                              <span style={{ color: '#fca5a5' }}>{selected.url_scan_malicious_count || 0} malicious</span>
                              {' | '}
                              <span style={{ color: '#fcd34d' }}>{selected.url_scan_suspicious_count || 0} suspicious</span>
                            </div>
                          )}
                          {selected.url_scan_summary && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                              {selected.url_scan_summary}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ color: 'var(--text-secondary)' }}>No URLs detected or processing...</div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem' }}>
                    <button className="secondary" onClick={authed.refreshEmails} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                      Refresh Analysis
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Compose Modal */}
      {isComposeOpen && (
        <div className="compose-modal">
          <div className="compose-header">
            <span>New Message</span>
            <button
              onClick={() => setIsComposeOpen(false)}
              style={{ background: 'transparent', padding: 0, width: 24 }}
            >
              ✕
            </button>
          </div>
          <div className="compose-body">
            <input
              placeholder="To: username"
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
            />
            <input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ minHeight: 150 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { sendEmail(); setIsComposeOpen(false); }}>
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
