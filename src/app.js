import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
// cookie parser is use to access and set cokkies on browser

const app = express()

// handeling CORS - middleware syntax- app.use()
const allowedOrigins = [
  "http://localhost:5173", // for local dev
  /\.vercel\.app$/          // allow ALL Vercel subdomains!
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow server-to-server

    const isAllowed = allowedOrigins.some((allowed) =>
      typeof allowed === "string"
        ? origin === allowed
        : allowed instanceof RegExp
        ? allowed.test(origin)
        : false
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed: " + origin));
    }
  },
  credentials: true
}));

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
import videoRouter from './routes/video.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import likeRouter from './routes/like.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import commentRouter from './routes/comment.routes.js'
import healthRouter from './routes/healthcheck.routes.js'
import playlistRouter from './routes/playlist.routes.js'

//routes declaration --- we use middleware
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/healthcheck", healthRouter)
app.use("/api/v1/playlists", playlistRouter)


// http://localhost:8000/api/v1/users/route
export {app}