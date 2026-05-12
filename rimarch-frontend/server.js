import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000
const distPath = join(__dirname, 'dist')
const indexPath = join(distPath, 'index.html')

console.log(`dist exists: ${existsSync(distPath)}`)
console.log(`index.html exists: ${existsSync(indexPath)}`)

app.use(express.static(distPath))

app.get('*', (req, res) => {
  if (!existsSync(indexPath)) {
    return res.status(500).send('Build output not found. dist/index.html is missing.')
  }
  res.sendFile(indexPath)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})
