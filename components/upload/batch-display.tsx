// TODO: This component is not used anymore, but it's kept here for reference
// TODO: Remove this file once the new upload interface is fully implementeds

import useSWR from 'swr'
import Image from 'next/image'
import type { Batch } from '@/types/batch'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function BatchDisplay() {
  const { data: batches, error, isLoading } = useSWR<Batch[]>('/api/batches', fetcher)

  // if (isLoading) return <div>Loading batches...</div>
  if (error) return <div>Error loading batches</div>
  if (!batches) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {batches.map((batch: Batch) => (
        <div key={batch.id} className="border rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold mb-2">{batch.name}</h3>
          <p className="text-sm text-gray-600 mb-2">
            {new Date(batch.timestamp).toLocaleDateString()}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {batch.images.map((image) => (
              <div key={image.id} className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  className="object-cover rounded"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
} 