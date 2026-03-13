import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

function findProjectRoot(startDir: string): string {
	let dir = startDir;
	while (dir !== path.dirname(dir)) {
		if (fs.existsSync(path.join(dir, "package.json"))) {
			return dir;
		}
		dir = path.dirname(dir);
	}
	throw new Error("Could not find project root (no package.json found)");
}

function getAllTsFiles(dir: string): string[] {
	const files: string[] = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory() && entry.name !== "node_modules") {
			files.push(...getAllTsFiles(fullPath));
		} else if (entry.isFile() && entry.name.endsWith(".ts")) {
			files.push(fullPath);
		}
	}
	return files;
}

describe("process.env isolation", () => {
	it("no source file outside src/infrastructure/config/ references process.env", () => {
		const projectRoot = findProjectRoot(import.meta.dir);
		const srcDir = path.join(projectRoot, "src");
		const configDir = path.resolve(srcDir, "infrastructure/config");
		const allFiles = getAllTsFiles(srcDir);

		const violations: string[] = [];

		for (const filePath of allFiles) {
			// Skip config directory — that's the one place allowed to use process.env
			const relative = path.relative(configDir, filePath);
			if (!relative.startsWith("..")) {
				continue;
			}

			const content = fs.readFileSync(filePath, "utf-8");
			if (/process\.env/.test(content)) {
				const relativeToSrc = path.relative(srcDir, filePath);
				violations.push(relativeToSrc);
			}
		}

		expect(violations).toEqual([]);
	});
});
