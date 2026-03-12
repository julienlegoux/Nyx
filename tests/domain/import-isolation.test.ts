import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const domainDir = resolve(import.meta.dirname, "../../src/domain");

function getAllTsFiles(dir: string): string[] {
	const files: string[] = [];
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		if (statSync(fullPath).isDirectory()) {
			files.push(...getAllTsFiles(fullPath));
		} else if (entry.endsWith(".ts")) {
			files.push(fullPath);
		}
	}
	return files;
}

describe("Domain layer import isolation (AC6)", () => {
	const forbiddenPatterns = [
		/from\s+["']@nyx\/application/,
		/from\s+["']@nyx\/infrastructure/,
		/from\s+["']@nyx\/entry/,
		/from\s+["']\.\.\/application/,
		/from\s+["']\.\.\/infrastructure/,
		/from\s+["']\.\.\/entry/,
		/from\s+["']\.\.\/\.\.\/application/,
		/from\s+["']\.\.\/\.\.\/infrastructure/,
		/from\s+["']\.\.\/\.\.\/entry/,
	];

	const tsFiles = getAllTsFiles(domainDir);

	for (const file of tsFiles) {
		const relativePath = relative(resolve(domainDir, ".."), file).replaceAll("\\", "/");
		test(`${relativePath} has no forbidden imports`, () => {
			const content = readFileSync(file, "utf-8");
			for (const pattern of forbiddenPatterns) {
				expect(content).not.toMatch(pattern);
			}
		});
	}

	test("domain layer has no external package imports (including node: built-ins)", () => {
		for (const file of tsFiles) {
			const content = readFileSync(file, "utf-8");
			const importMatches = content.matchAll(/from\s+["']([^.@][^"']*)["']/g);
			for (const match of importMatches) {
				const pkg = match[1];
				if (pkg) {
					throw new Error(`Domain file ${file} imports external package: ${pkg}`);
				}
			}
		}
	});
});
