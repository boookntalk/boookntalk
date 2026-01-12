'use client'

import { useState } from 'react'
import VisibilityStep from '@/components/record/VisibilityStep'

export default function VisibilityPlayground() {
  const [visibility, setVisibility] = useState<
    'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'
  >('PUBLIC')

  return (
    <div className="mx-auto max-w-md p-6">
      <VisibilityStep
        value={visibility}
        onChange={setVisibility}
      />
    </div>
  )
}
