import { Router } from "express"

import auth from "@/src/api/auth/router"
import events from "@/src/api/events/router"

const apiRouter = Router()
apiRouter.use("/auth", auth)
apiRouter.use("/events", events)

export default apiRouter