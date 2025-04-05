import { getDomainData } from "@/src/lib/database/interface"
import { LoginFormSchema } from "@/src/lib/definitions"
import { createSession, getSession, hash, isAdmin, overwriteSession } from "@/src/lib/identity/session"
import { Request, Response, Router } from "express"

const router = Router()
router.get("/privilege", async (req: Request, res: Response) => {
	/**
	 * determines privileges based on supplied cookie
	 * 
	 * returns true if privileged, otherwise false
	 */
	console.log("/api/auth/privilege", req.headers.cookie, await isAdmin(req))
	res.json({ privileged: await isAdmin(req) })
	console.log("FINISHED /api/auth/privileged")
	return
})

router.get("/secret", async (req: Request, res: Response) => {
	/**
	 * returns socket privileged connection token (secret) to privileged caller
	 * connection token used to establish authenticated connection to privileged namespace of game socket server
	 */
	if (await isAdmin(req)) {
		// is a privileged actor
		res.json({ secret: process.env.SOCKET_CONNECTION_TOKEN })
		return
	}

	res.status(403).end() // not authorised
	return
})
router.post("/login", async (req: Request, res: Response) => {
	/**
	 * req.body: {
	 * 	domain: string,
	 * 	password: string
	 * }
	 * 
	 * if authenticated, will upgrade session privileges
	 */
	const validatedFields = LoginFormSchema.safeParse({
		domain: req.body["domain"] ?? "",
		password: req.body["password"] ?? "",
	})
	console.log("REQ BODY", req.body, req.headers["content-type"])
	if (!validatedFields.success) {
		res.status(400).json({
			errors: validatedFields.error.flatten().fieldErrors,
		})
		return
	}

	const fieldData = validatedFields.data
	let session = await getSession(req)
	if (session == null) {
		session = await createSession() // dont call set-cookie after else double writes when overwriting upon successful auth
	}

	const domainId = fieldData.domain.toLowerCase()
	const hashedPassword = await hash(fieldData.password +process.env.PW_SALT)

	// fetch admin data
	try {
		const domainData = await getDomainData(domainId)
		console.log("hashing", fieldData.password +process.env.PW_SALT)
		console.log("supplied hash", hashedPassword)
		console.log("retrieved hash", domainData.password)
		if (hashedPassword === domainData.password) {
			// matches
			session.authenticated = true
			session.domain = domainId

			await overwriteSession(res, session) // set-cookie
		} else {
			res.status(400).json({
				message: "Incorrect password, please press the forget password button."
			})
			return
		}
	} catch (err: any) {
		res.status(500).json({
			message: err.message ?? "Failed to fetch from database"
		})
		return
	}

	res.json({ domainId: domainId })
	return
})

export default router