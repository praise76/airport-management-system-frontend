const TODOS_STORAGE_KEY = 'mcp-todos'

// Load todos from localStorage or use default
function loadTodos(): Todo[] {
  if (typeof window === 'undefined') {
    return [
      {
        id: 1,
        title: 'Buy groceries',
      },
    ]
  }
  
  const stored = localStorage.getItem(TODOS_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return [
        {
          id: 1,
          title: 'Buy groceries',
        },
      ]
    }
  }
  return [
    {
      id: 1,
      title: 'Buy groceries',
    },
  ]
}

// In-memory todos storage
let todos = loadTodos()

// Save todos to localStorage
function saveTodos() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos))
  }
}

// Subscription callbacks per userID
let subscribers: ((todos: Todo[]) => void)[] = []

export type Todo = {
  id: number
  title: string
}

// Get the todos for a user
export function getTodos(): Todo[] {
  return todos
}

// Add an item to the todos
export function addTodo(title: string) {
  todos.push({ id: todos.length + 1, title })
  saveTodos()
  notifySubscribers()
}

// Subscribe to cart changes for a user
export function subscribeToTodos(callback: (todos: Todo[]) => void) {
  subscribers.push(callback)
  callback(todos)
  return () => {
    subscribers = subscribers.filter((cb) => cb !== callback)
  }
}

// Notify all subscribers of a user's cart
function notifySubscribers() {
  for (const cb of subscribers) {
    try {
      cb(todos)
    } catch {}
  }
}
