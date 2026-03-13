import { init } from "./init.ts";
import { shutdown } from "./shutdown.ts";

const container = await init();

let cycle = 0;
let shuttingDown = false;

process.on("SIGTERM", onSignal);
process.on("SIGINT", onSignal);

container.logger.info("Nyx heartbeat started");

const heartbeatInterval = setInterval(() => {
	cycle++;
	container.logger.info("heartbeat tick", { cycle });
}, 300_000);

async function onSignal() {
	if (shuttingDown) return;
	shuttingDown = true;
	clearInterval(heartbeatInterval);
	try {
		await shutdown(container);
	} catch {
		process.exit(1);
	}
}
