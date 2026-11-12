import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import HallsPage from './pages/HallsPage.tsx'
import HallDetailPage from './pages/HallDetailPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import RequestsPage from './pages/RequestsPage.tsx'
import UsersPage from './pages/UsersPage.tsx'

const path = window.location.pathname.replace(/\/+$/, '') || '/'
const hallMatch = path.match(/^\/halls\/([^/]+)$/)

const page =
  path === '/login' ? <LoginPage /> :
  path === '/register' ? <RegisterPage /> :
  path === '/profile' ? <ProfilePage /> :
  path === '/admin/requests' ? <RequestsPage /> :
  path === '/admin/users' ? <UsersPage /> :
  hallMatch ? <HallDetailPage hallId={decodeURIComponent(hallMatch[1])} /> :
  <HallsPage />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {page}
  </StrictMode>,
)
