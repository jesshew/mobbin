import Link from "next/link"

export default function DemoHomePage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Form Mobbin Demos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/demo/components"
          className="border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Component Hierarchy</h2>
          <p className="text-muted-foreground">
            Explore the new component-element hierarchy structure with nested elements and rich metadata.
          </p>
        </Link>
        
        <Link 
          href="/demo/batch-viewer"
          className="border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Batch Component Viewer</h2>
          <p className="text-muted-foreground">
            Load and explore components by batch ID with a wider panel layout and detailed view.
          </p>
        </Link>
      </div>
    </div>
  )
} 