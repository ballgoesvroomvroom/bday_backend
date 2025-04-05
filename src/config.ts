const DEVELOPMENT = {
	COOKIE_NAME: "monster",

	FRONTEND_URL: ["http://localhost:3000", "http://dash.localhost:3000"],

	SUPABASE_URL: "https://nqjuvsmsfaqnfzilhtyd.supabase.co",
	SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xanV2c21zZmFxbmZ6aWxodHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MzI2ODQsImV4cCI6MjA1OTQwODY4NH0.GlUQ-BPZHBxHHRrTHdpAe8djTAr7HmCBK2IijDlA1KY",
}

const PRODUCTION = {
	COOKIE_NAME: "monster",

	FRONTEND_URL: ["https://blowmycandles.com", "https://dash.blowmycandles.com"],

	SUPABASE_URL: "https://nqjuvsmsfaqnfzilhtyd.supabase.co",
	SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xanV2c21zZmFxbmZ6aWxodHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MzI2ODQsImV4cCI6MjA1OTQwODY4NH0.GlUQ-BPZHBxHHRrTHdpAe8djTAr7HmCBK2IijDlA1KY",
}

export default (process.env.NODE_ENV === "production" ? PRODUCTION : DEVELOPMENT)
