import express from "express"
import path from "path"
import bodyparser from "body-parser"
import cors from "cors"

import apiRouter from "@/src/api/router"
import config from "@/src/config"
import { createSession, getSession, overwriteSession } from "@/src/lib/identity/session"

// express app
const app = express()

// cors
app.use(cors({
	origin: config.FRONTEND_URL,
	credentials: true // pass Access-Control-Allow-Credentials header, needed by fetch on the frontend
}))

// body parsers
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: true }))

// attach session for all incoming backend requests
app.use(async (req, res, next) => {
	let session = await getSession(req) // should be valid
	console.log("session?", session)
	if (!session) {
		console.log("Attaching session id")
		session = await createSession()
		await overwriteSession(res, session)
	}

	next()
})

// routers
app.use("/api", apiRouter)

// public folder
app.use("/assets", express.static(path.join(__dirname, "../public")))

// listen
const port = process.env.PORT ?? 3001
const httpServer = app.listen(port, () => {
	console.log("> Listening on port:", port)
})

// socket server - game events
// initialiseSocketServer(httpServer) // must use httpServer created by app.listen