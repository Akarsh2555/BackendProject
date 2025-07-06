import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
// cookie parser is use to access and set cokkies on browser

const app = express()

// handeling CORS - middleware syntax- app.use()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// config from incomming json data
app.use(express.json({
    limit: "16kb"
}))

//cofig for incomming url data
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

//config for static
app.use(express.static("public"))

app.use(cookieParser())

//routes
import userRouter from './routes/user.routes.js'

//routes declaration --- we use middleware
app.use("/api/v1/users", userRouter)

// http://localhost:8000/api/v1/users/route
export {app}