
import { decode } from 'jsonwebtoken'

const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZ2JtYm90Ym16ZmlienVwZGhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODYyNTMxNSwiZXhwIjoyMDg0MjAxMzE1fQ.JMggYZASCwZIQY-HGYbZY33eDAm4ZcfJI8LChUuJ7gg"
const decoded = decode(key) as any

console.log('Key Project Ref:', decoded?.ref)
console.log('Configured Project:', 'aliwifcjhtvpazuugzpk')
console.log('Match:', decoded?.ref === 'aliwifcjhtvpazuugzpk')
