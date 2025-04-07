import { createClient } from "@supabase/supabase-js"
import { Database } from "@/src/lib/database.types"
import crypto from "node:crypto"
import config from "@/src/config"

const supabase = createClient<Database>(config.SUPABASE_URL, process.env.SUPABSE_SERVICE_KEY!, {
	db: { schema: "candles" }
})

export class SQLError extends Error {
	constructor(msg: string) {
		super(msg);

		// set the prototype explicitly
		// https://github.com/microsoft/TypeScript-wiki/blob/81fe7b91664de43c02ea209492ec1cea7f3661d0/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
		Object.setPrototypeOf(this, SQLError.prototype);
	}
}

export async function getDomainData(domainId: string) {
	/**
	 * domainId: PK for domain table (e.g. "jayden")
	 * for authentication
	 */
	console.log("getting domain", domainId)
	let { data, error } = await supabase.from("domain").select().eq("id", domainId)
	if (error || data == null) {
		throw new SQLError(`Failed to retrieve domain data from domain_id: ${error?.message}`)
	}

	return data[0] // first record
}

export async function getInviteData(inviteId: string) {
	/**
	 * for dashboard
	 */
	console.log("getting invite", inviteId)
	let { data, error } = await supabase.from("invite").select().eq("id", inviteId)
	if (error || data == null) {
		throw new SQLError(`Failed to retrieve invite data from invite_id: ${error?.message}`)
	}

	return data[0] // first record
}

export async function getEventData(inviteId: string) {
	/**
	 * get event data from inviteId, for guests to retrieve details
	 * returns [inviteData, eventData]
	 */

	// fetch event_id from "invite" table first
	let { data: inviteData, error: inviteError } = await supabase.from("invite").select().eq("id", inviteId)
	if (inviteError || inviteData == null) {
		throw new SQLError(`Failed to retrieve invite data from invite_id: ${inviteError?.message}`)
	}

	// fetch event data with eventId
	console.log("getting event data from inviteId: ", inviteId)
	let { data: eventData, error } = await supabase.from("event").select().eq("id", inviteData[0]["event_id"])
	if (error || eventData == null) {
		throw new SQLError(`Failed to retrieve event data from event_id: ${error?.message}`)
	}

	return [inviteData[0], eventData[0]] // first record
}

export async function getInvitesData(eventId: string) {
	/**
	 * for dashboard
	 */
	console.log("getting invites for eventId:", eventId)
	let prompt = supabase.from("invite").select().eq("event_id", eventId)
	let { data, error } = await prompt.order("created_on", { ascending: false })
	if (error || data == null) {
		throw new SQLError(`Failed to retrieve invites data from event_id: ${error?.message}`)
	}

	console.log("RETURNING DATA", data)
	return data
}

export async function createInviteData(eventId: string) {
	/**
	 * generate unique 6 character hexadecimal key
	 * for dashboard
	 */

	// ensure key generated is unique
	let key; // 6 char key
	for (let i = 0; i < 100; i++) {
		key = crypto.randomBytes(3).toString("hex")
		console.log("checking collision key:", key)
		const { data, error } = await supabase.from("invite").select().eq("id", key)
		console.log("data", data)
		if (error) {
			throw new SQLError(`Failed to check collision for key generation when creating invite code: ${error?.message}`)
		} else if ((data == null || data.length === 0) && key != null) {
			// key does not exist
			break
		} else if (i === 99) {
			// max limit
			throw new SQLError(`Failed to check collision for key generation when creating invite code: max iterations 99th reached`)
		}
	}

	// create entry in table
	await supabase.from("invite").insert({
		"id": key!, event_id: eventId
	})
	console.log("created invite data", key!)

	return key
}

export async function updateInviteData(inviteId: string, name: string, allergies: string|undefined, remarks: string|undefined) {
	/**
	 * rsvp
	 */
	console.log("updating invite", inviteId, name, allergies, remarks)
	// populate name in record, add in timestamp in UTC timezone (milliseconds), and update status to 1
	const allergy = allergies != null
	const { error } = await supabase.from("invite").update({ name, allergy, allergies, remarks, accepted_tz: +new Date(), status: 1 }).eq("id", inviteId)
	if (error) {
		throw new SQLError(`Failed to update invite data: ${error?.message}`)
	}
	console.log("update done", error)

	return
}