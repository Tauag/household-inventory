// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: "https://c741181e8151844405db3c78adbb76c1@o4512166196609025.ingest.us.sentry.io/4512166197592064",

	// Turns off collection of data that could identify users. Adjust per category:
	// https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection
	dataCollection: {
		userInfo: false,
		graphQL: { document: false, variables: false },
		genAI: { inputs: false, outputs: false },
		databaseQueryData: false,
		queues: false,
		httpBodies: [],
		httpHeaders: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
		cookies: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
		urlQueryParams: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
	},
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
