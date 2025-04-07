/**
 * feed controller
 */
import { createInviteData, getEventData, getInvitesData, updateInviteData } from "@/src/lib/database/interface";
import { getSession, isAdminMiddleWare, overwriteSession } from "@/src/lib/identity/session";
import { Request, Response, Router } from "express";

const router = Router()

router.get("/master/:eventId/codes", isAdminMiddleWare, async (req: Request, res: Response) => {
	// returns created invite codes
	// only for domain admin
	const payload = await getInvitesData(req.params.eventId)

	// return payload
	res.json(payload)
	return
})

router.get("/master/:eventId/code/create", isAdminMiddleWare, async (req: Request, res: Response) => {
	// create invite code
	// only for domain admin
	const inviteId = await createInviteData(req.params.eventId)

	// return invite code
	res.json({ code: inviteId })
	return
})

router.post("/:inviteId", async (req: Request, res: Response) => {
	// TODO: rate limit this call else can be exploited
	// req.body.name: string, name of person who rsvp'ed
	// update invite status (rsvp)
	let ic = req.params.inviteId
	if (ic == null || ic.length === 0 || ic.length >= 7 || (/^[0-9a-f]$/).test(ic)) {
		// failed sanity check for invite code format (6 chars hexadecimal)
		res.status(400).json({
			message: "Please provide a valid invite code"
		})
		return
	}
	console.log("NAME", req.body)
	if (req.body.name == null || req.body.name.length === 0 || req.body.name.length >= 256) {
		// failed sanity check, db only allows 255 chars because type for name column is VARCHAR(255)
		res.status(400).json({
			message: "Please provide a valid name"
		})
		return
	} else if (req.body.allergies != null && (req.body.allergies.length === 0 || req.body.allergies.length >= 2049)) {
		// failed sanity check, allergies indicated yet empty string or exceed char limit
		res.status(400).json({
			message: "Please indicate your allergies in under 2048 characters"
		})
		return
	} else if (req.body.remarks != null && (req.body.remarks.length === 0 || req.body.remarks.length >= 2049)) {
		// failed sanity check, remarks included yet empty string or exceed char limit
		res.status(400).json({
			message: "Please indicate your remarks in under 2048 characters"
		})
		return
	}

	try {
		await updateInviteData(req.params.inviteId, req.body.name, req.body.allergies, req.body.remarks)

		res.json({
			success: true
		})
	} catch (err: any) {
		// invalid invite code?
		console.warn("FAILED TO UPDATE INVITE STATUS", err.message)
		res.status(500).json({
			message: "The server is unable to process your request at the moment"
		})
		return
	}
})

router.get("/:inviteId", async (req: Request, res: Response) => {
	// TODO: rate limit this call else can be exploited
	// get data (both invite and event) for invite code
	let ic = req.params.inviteId
	if (ic == null || ic.length === 0 || ic.length >= 7 || (/^[0-9a-f]$/).test(ic)) {
		// failed sanity check for invite code format (6 chars hexadecimal)
		res.status(400).json({
			message: "Please provide a valid invite code"
		})
		return
	}

	try {
		const [inviteData, eventData] = await getEventData(req.params.inviteId)

		res.json({
			"invite": inviteData,
			"event": eventData
		})
	} catch (err: any) {
		// invalid invite code?
		console.warn("FAILED TO FETCH INVITE AND EVENT DATA", err.message)
		res.status(500).json({
			message: "The server is unable to process your request at the moment"
		})
		return
	}
})

export default router