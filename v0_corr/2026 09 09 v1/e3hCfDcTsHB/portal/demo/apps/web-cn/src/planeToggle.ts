import { readPlaneEnabled, subscribePlaneEnabled, writePlaneEnabled } from '@demo/domain'
import { useEffect, useState } from 'react'

export function usePlaneEnabled(): [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState(readPlaneEnabled)

  useEffect(() => subscribePlaneEnabled(() => setEnabled(readPlaneEnabled())), [])

  return [enabled, writePlaneEnabled]
}
