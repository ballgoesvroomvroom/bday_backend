import { SignJWT, jwtVerify } from "jose"
import { randomBytes, createHash } from "crypto"

import config from "@/src/config"
import { Request, Response, NextFunction } from "express"

const SECRET_KEY = process.env.SECRET_KEY!
const encodedSecretKey = new TextEncoder().encode(SECRET_KEY)

const SESSION_COOKIE_NAME = config.COOKIE_NAME

type SessionPayload = {
	sid: string, // unique identifier for all visitors to site
	domain?: string,
	authenticated: boolean,

	expiresAt: number, // unix epoch UTC in ms
}

export async function hash(s: string) {
	/**
	 * s: string
	 * 
	 * returns a SHA512 salted hash of the string
	 * uses process.env.HASH_SALT as the salt value
	 * 
	 * returns string
	 */
	return createHash("sha512").update(`${s}${process.env.HASH_SALT}`).digest("hex")
}

export async function encrypt(payload: SessionPayload) {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(encodedSecretKey)
}

export async function decrypt(session: string|undefined = ""): Promise<(SessionPayload|null)> {
	try {
		const verified = await jwtVerify(session, encodedSecretKey, {
			algorithms: ["HS256"]
		})
		const payload = verified.payload as SessionPayload

		return payload
	} catch (err) {
		console.log("Failed to verify session", err)
		return null
	}
}

export async function setCookie(res: Response, session: string, expires: Date) {
	/**
	 * session: string, return value of encrypt() (i.e. JWT's encrypted token)
	 */
	// res.set("Set-Cookie", `${SESSION_COOKIE_NAME}=${session};Path=/;Expires=${expires.toUTCString()}; Domain=${config.DOMAIN_NAME}; HttpOnly; SameSite=Lax`)
	res.removeHeader("Set-Cookie")
	return res.cookie(SESSION_COOKIE_NAME, session, {
		httpOnly: true,
		secure: false,
		expires: expires,
		sameSite: "lax",
		path: "/"
	})
}

export async function createSession(): Promise<SessionPayload> {
	const now = +new Date()
	const expiresAt = new Date(now +6.048e+8) // 7 days

	const sessionData = { sid: `${randomBytes(12).toString("hex")}${+new Date()}`, authenticated: false, expiresAt: +expiresAt } as SessionPayload
	// const session = await encrypt(sessionData)

	// dont set cookie, else will set twice, explicitly call setCookie after this function
	// await setCookie(res, session, expiresAt)

	// extends session data to include bridge
	// sessionData.bridge = createBridge()
	return sessionData
}

function extractCookie(req: Request) {
	/**
	 * returns cookie in the form of { [cookieName: string]: string }
	 */
	const cookie = req.headers.cookie
	if (!cookie) {
		return {} // return empty
	}

	const list = cookie.split(";")
	const cookies: { [cookieName: string]: string } = {} // return payload
	for (let pair of list) {
		const split = pair.split("=")
		if (split.length <= 1) {
			// not a valid pair
			continue
		}

		const name = split.shift()! // first element is name
		const value = split.join("=") // join back, in case value is a base64 encoded string

		cookies[name] = value
	}
	return cookies
}

export function extractSessionCookie(req: Request) {
	/**
	 * returns encrypted cookie value for session
	 * returns undefined if not present
	 */
	const cookies = extractCookie(req)
	if (cookies[SESSION_COOKIE_NAME] == null ) {
		return
	}
	return cookies[SESSION_COOKIE_NAME]
}

export async function getSession(req: Request): Promise<SessionPayload|undefined> {
	/**
	 * returns SessionPayload if present
	 * otherwise returns null
	 */
	const sessionString = extractSessionCookie(req)
	if (!sessionString) {
		return
	}

	try {
		const sessionData = await decrypt(sessionString) as SessionPayload
		if (sessionData == null) {
			return
		}

		return sessionData
	} catch (e: any) {
		// unable to decrypt session payload
		return
	}
}

export async function overwriteSession(res: Response, session: SessionPayload) {
	// const { bridge, ...strippedSession } = session
	const encrypted = await encrypt(session)
	return setCookie(res, encrypted, new Date(session.expiresAt))
}

export async function isAdmin(req: Request) {
	let session = await getSession(req)
	if (session == null) {
		return false
	}

	return session.authenticated === true
}

export async function isAdminMiddleWare(req: Request, res: Response, next: NextFunction) {
	if (await isAdmin(req)) {
		return next()
	}

	// either no authentication or is not an admin
	res.status(401).json({ message: "Unauthorised" }) // return 401 as a 'catch-all' for 403 too
}