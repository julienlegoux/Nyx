import type { Container } from "./container.ts";

export async function shutdown(container: Container): Promise<void> {
	container.logger.info("Nyx shutting down");
	// Grace period for pino transport worker threads to flush
	await new Promise((resolve) => setTimeout(resolve, 500));
	process.exit(0);
}
