import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function exists(path: string): boolean {
	return existsSync(resolve(root, path));
}

describe("AC1: Root config files", () => {
	test("package.json exists with correct metadata", async () => {
		const pkg = await Bun.file(resolve(root, "package.json")).json();
		expect(pkg.name).toBe("nyx");
		expect(pkg.type).toBe("module");
		expect(pkg.private).toBe(true);
	});

	test("tsconfig.json has strict settings and path aliases", async () => {
		const tsconfig = await Bun.file(resolve(root, "tsconfig.json")).json();
		expect(tsconfig.compilerOptions.strict).toBe(true);
		expect(tsconfig.compilerOptions.noUncheckedIndexedAccess).toBe(true);
		expect(tsconfig.compilerOptions.exactOptionalPropertyTypes).toBe(true);
		expect(tsconfig.compilerOptions.moduleResolution).toBe("bundler");
		expect(tsconfig.compilerOptions.paths["@nyx/*"]).toEqual(["./src/*"]);
	});

	test("biome.json exists and is configured", async () => {
		const biome = await Bun.file(resolve(root, "biome.json")).json();
		expect(biome.formatter.enabled).toBe(true);
		expect(biome.linter.enabled).toBe(true);
	});

	test("bunfig.toml exists", () => {
		expect(exists("bunfig.toml")).toBe(true);
	});

	test(".gitignore excludes required paths", async () => {
		const content = await Bun.file(resolve(root, ".gitignore")).text();
		expect(content).toContain("node_modules/");
		expect(content).toContain(".env");
		expect(content).toContain("dist/");
		expect(content).toContain("home/");
		expect(content).toContain("logs/");
	});

	test(".env.example exists with placeholder vars", async () => {
		const content = await Bun.file(resolve(root, ".env.example")).text();
		expect(content).toContain("ANTHROPIC_API_KEY");
		expect(content).toContain("POSTGRES_HOST");
		expect(content).toContain("TELEGRAM_BOT_TOKEN");
	});
});

describe("AC2: Clean Architecture directory layout", () => {
	const domainDirs = ["entities", "value-objects", "ports", "types", "errors"];
	const appDirs = ["heartbeat", "daemons", "consciousness", "memory"];
	const infraDirs = [
		"database",
		"filesystem",
		"agent-sdk",
		"telegram",
		"embedding",
		"webapp",
		"logging",
		"config",
	];

	test("four layer directories exist under src/", () => {
		expect(exists("src/domain")).toBe(true);
		expect(exists("src/application")).toBe(true);
		expect(exists("src/infrastructure")).toBe(true);
		expect(exists("src/entry")).toBe(true);
	});

	for (const dir of domainDirs) {
		test(`domain/${dir}/ has index.ts barrel`, () => {
			expect(exists(`src/domain/${dir}/index.ts`)).toBe(true);
		});
	}

	test("domain/ has index.ts barrel", () => {
		expect(exists("src/domain/index.ts")).toBe(true);
	});

	for (const dir of appDirs) {
		test(`application/${dir}/ has index.ts barrel`, () => {
			expect(exists(`src/application/${dir}/index.ts`)).toBe(true);
		});
	}

	test("application/ has index.ts barrel", () => {
		expect(exists("src/application/index.ts")).toBe(true);
	});

	for (const dir of infraDirs) {
		test(`infrastructure/${dir}/ has index.ts barrel`, () => {
			expect(exists(`src/infrastructure/${dir}/index.ts`)).toBe(true);
		});
	}

	test("infrastructure/ has index.ts barrel", () => {
		expect(exists("src/infrastructure/index.ts")).toBe(true);
	});

	test("database has schema/ and migrations/ subdirectories", () => {
		expect(exists("src/infrastructure/database/schema/index.ts")).toBe(true);
		expect(exists("src/infrastructure/database/migrations")).toBe(true);
	});
});

describe("AC2: Entry layer files", () => {
	test("heartbeat.ts exists", () => {
		expect(exists("src/entry/heartbeat.ts")).toBe(true);
	});

	test("init.ts exists", () => {
		expect(exists("src/entry/init.ts")).toBe(true);
	});

	test("shutdown.ts exists", () => {
		expect(exists("src/entry/shutdown.ts")).toBe(true);
	});

	test("container.ts exists", () => {
		expect(exists("src/entry/container.ts")).toBe(true);
	});
});

describe("AC2: Test directory structure", () => {
	test("tests/factories/index.ts exists", () => {
		expect(exists("tests/factories/index.ts")).toBe(true);
	});

	test("test subdirectories mirror src structure", () => {
		expect(exists("tests/domain/entities")).toBe(true);
		expect(exists("tests/domain/value-objects")).toBe(true);
		expect(exists("tests/application/heartbeat")).toBe(true);
		expect(exists("tests/application/daemons")).toBe(true);
		expect(exists("tests/application/consciousness")).toBe(true);
		expect(exists("tests/application/memory")).toBe(true);
		expect(exists("tests/infrastructure/database")).toBe(true);
		expect(exists("tests/infrastructure/filesystem")).toBe(true);
		expect(exists("tests/infrastructure/telegram")).toBe(true);
		expect(exists("tests/integration")).toBe(true);
	});
});

describe("AC3: Execution validation", () => {
	test("heartbeat.ts outputs expected message", async () => {
		const proc = Bun.spawn(["bun", "run", "src/entry/heartbeat.ts"], {
			cwd: root,
			stdout: "pipe",
		});
		const output = await new Response(proc.stdout).text();
		expect(output.trim()).toBe("Nyx heartbeat: scaffold operational");
	});
});
