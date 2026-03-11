import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import triageRouter from './routes/triage.js'
import hospitalsRouter from './routes/hospitals.js'
import reportRouter from './routes/report.js'

const app = express()
const port = Number(process.env.PORT || 3001)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/', (_request, response) => {
  response.json({
    name: 'STAZE — Emergency Stabilization AI backend',
    status: 'online',
    frontend: 'http://localhost:5173',
    endpoints: [
      '/api/health',
      '/api/triage',
      '/api/hospitals',
      '/api/report',
    ],
  })
})

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, mode: 'offline-scaffold' })
})

app.use('/api/triage', triageRouter)
app.use('/api/hospitals', hospitalsRouter)
app.use('/api/report', reportRouter)

app.use('/api', (_request, response) => {
  response.status(404).json({
    error: 'Unknown API route',
    available: ['/api/health', '/api/triage', '/api/hospitals', '/api/report'],
  })
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({
    error: 'Something went wrong — call 108 immediately',
  })
})

app.listen(port, () => {
  console.log(`STAZE backend listening on http://localhost:${port}`)
})
