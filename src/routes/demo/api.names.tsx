import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/demo/api/names')({
  component: () => {
    const names = ['Alice', 'Bob', 'Charlie']
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">API Names Demo</h1>
        <ul className="space-y-2">
          {names.map((name) => (
            <li key={name} className="p-2 bg-muted rounded">
              {name}
            </li>
          ))}
        </ul>
      </div>
    )
  },
})
