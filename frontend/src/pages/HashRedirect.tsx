import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/** Redirect old routes to a home-page section anchor. */
export function HashRedirect({ hash }: { hash: string }) {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(`/${hash}`, { replace: true })
  }, [hash, navigate])
  return null
}
