import Link from "next/link"

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen">
      <header className="border-b px-4 py-2 flex items-center">
        <h1 className="text-lg font-bold">Form Mobbin Demos</h1>
        <nav className="ml-8">
          <ul className="flex gap-4">
            <li>
              <Link 
                href="/demo/components" 
                className="text-sm hover:text-primary transition-colors"
              >
                Component Hierarchy
              </Link>
            </li>
            <li>
              <Link 
                href="/demo/batch-viewer" 
                className="text-sm hover:text-primary transition-colors"
              >
                Batch Component Viewer
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
} 