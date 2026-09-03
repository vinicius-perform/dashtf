import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { usePathname, navigate } from './lib/router'
import { TermsView } from './components/TermsView'
import { PrivacyView } from './components/PrivacyView'
import './index.css'

function Root() {
  const pathname = usePathname()

  if (pathname === '/termos') {
    return (
      <TermsView
        onBack={() => navigate('/')}
        onOpenPrivacy={() => navigate('/privacidade')}
      />
    )
  }

  if (pathname === '/privacidade') {
    return (
      <PrivacyView
        onBack={() => navigate('/')}
        onOpenTerms={() => navigate('/termos')}
      />
    )
  }

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
