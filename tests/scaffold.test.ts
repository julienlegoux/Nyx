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

	test("tsconfig.json has strict settings, path aliases, baseUrl, and include", async () => {
		const tsconfig = await Bun.file(resolve(root, "tsconfig.json")).json();
		expect(tsconfig.compilerOptions.strict).toBe(true);
		expect(tsconfig.compilerOptions.noUncheckedIndexedAccess).toBe(true);
		expect(tsconfig.compilerOptions.exactOptionalPropertyTypes).toBe(true);
		expect(tsconfig.compilerOptions.moduleResolution).toBe("bundler");
		expect(tsconfig.compilerOptions.module).toBe("ESNext");
		expect(tsconfig.compilerOptions.target).toBe("ESNext");
		expect(tsconfig.compilerOptions.paths["@nyx/*"]).toEqual(["./src/*"]);
		expect(tsconfig.compilerOptions.baseUrl).toBe(".");
		expect(tsconfig.compilerOptions.skipLibCheck).toBe(true);
		expect(tsconfig.compilerOptions.noEmit).toBe(true);
		expect(tsconfig.compilerOptions.esModuleInterop).toBe(true);
		expect(tsconfig.compilerOptions.forceConsistentCasingInFileNames).toBe(true);
		expect(tsconfig.compilerOptions.isolatedModules).toBe(true);
		expect(tsconfig.compilerOptions.verbatimModuleSyntax).toBe(true);
		expect(tsconfig.include).toEqual(["src/**/*.ts", "tests/**/*.ts"]);
	});

	test("biome.json exists and is fully configured", async () => {
		const biome = await Bun.file(resolve(root, "biome.json")).json();
		expect(biome.formatter.enabled).toBe(true);
		expect(biome.formatter.indentStyle).toBe("tab");
		expect(biome.formatter.lineWidth).toBe(100);
		expect(biome.linter.enabled).toBe(true);
		expect(biome.linter.rules.recommended).toBe(true);
		expect(biome.organizeImports.enabled).toBe(true);
	});

	test("bunfig.toml exists", () => {
		expect(exists("bunfig.toml")).toBe(true);
	});

	test(".gitignore excludes required paths", async () => {
		const content = await Bun.file(resolve(root, ".gitignore")).text();
		expect(content).toContain("node_modules/");
		expect(content).toContain("dist/");
		expect(content).toContain("home/");
		expect(content).toContain("logs/");
	});

	test(".gitignore uses .env* glob with !.env.example exception", async () => {
		const content = await Bun.file(resolve(root, ".gitignore")).text();
		expect(content).toContain(".env*");
		expect(content).toContain("!.env.example");
	});

	test("package.json has all tooling scripts", async () => {
		const pkg = await Bun.file(resolve(root, "package.json")).json();
		expect(pkg.scripts.test).toBe("bun test");
		expect(pkg.scripts.check).toBe("biome check .");
		expect(pkg.scripts.format).toBe("biome format . --write");
		expect(pkg.scripts.lint).toBe("biome lint .");
		expect(pkg.scripts.typecheck).toBe("tsc --noEmit");
	});

	test("package.json has required devDependencies", async () => {
		const pkg = await Bun.file(resolve(root, "package.json")).json();
		expect(pkg.devDependencies).toHaveProperty("typescript");
		expect(pkg.devDependencies).toHaveProperty("@biomejs/biome");
		expect(pkg.devDependencies).toHaveProperty("@types/bun");
	});

	test(".env.example exists with all placeholder vars and default values", async () => {
		const content = await Bun.file(resolve(root, ".env.example")).text();
		expect(content).toContain("ANTHROPIC_API_KEY=your-key-here");
		expect(content).toContain("POSTGRES_HOST=postgres");
		expect(content).toContain("POSTGRES_PORT=5432");
		expect(content).toContain("POSTGRES_DB=nyx");
		expect(content).toContain("POSTGRES_USER=nyx");
		expect(content).toContain("POSTGRES_PASSWORD=change-me");
		expect(content).toContain("TELEGRAM_BOT_TOKEN=your-token-here");
		expect(content).toContain("TELEGRAM_ALLOWED_CHAT_ID=your-chat-id");
		expect(content).toContain("WEBAPP_PORT=3000");
		expect(content).toContain("LOG_LEVEL=info");
		expect(content).toContain("HOME_DIR=/home/nyx");
		expect(content).toContain("SIGNALS_DIR=/app/signals");
		expect(content).toContain("LOGS_DIR=/app/logs");
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

	test("database/migrations/ has no barrel index.ts (drizzle-kit generates files here)", () => {
		expect(exists("src/infrastructure/database/migrations/index.ts")).toBe(false);
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

	test("entry/ has index.ts barrel", () => {
		expect(exists("src/entry/index.ts")).toBe(true);
	});

	test("entry stubs (init.ts, shutdown.ts, container.ts) are empty per spec", async () => {
		for (const stub of ["init.ts", "shutdown.ts", "container.ts"]) {
			const file = Bun.file(resolve(root, `src/entry/${stub}`));
			const size = file.size;
			expect(size).toBe(0);
		}
	});
});

describe("AC2: Barrel file content validation", () => {
	const barrelDirs = [
		"src/domain",
		"src/domain/entities",
		"src/domain/value-objects",
		"src/domain/ports",
		"src/domain/types",
		"src/domain/errors",
		"src/application",
		"src/application/heartbeat",
		"src/application/daemons",
		"src/application/consciousness",
		"src/application/memory",
		"src/infrastructure",
		"src/infrastructure/database",
		"src/infrastructure/database/schema",
		"src/infrastructure/filesystem",
		"src/infrastructure/agent-sdk",
		"src/infrastructure/telegram",
		"src/infrastructure/embedding",
		"src/infrastructure/webapp",
		"src/infrastructure/logging",
		"src/infrastructure/config",
		"src/entry",
	];

	for (const dir of barrelDirs) {
		test(`${dir}/index.ts is a valid barrel file`, async () => {
			const file = Bun.file(resolve(root, `${dir}/index.ts`));
			const content = await file.text();
			expect(content.length).toBeGreaterThan(0);
		});
	}
});

describe("Review additions", () => {
	test(".editorconfig exists with correct settings", async () => {
		expect(exists(".editorconfig")).toBe(true);
		const content = await Bun.file(resolve(root, ".editorconfig")).text();
		expect(content).toContain("root = true");
		expect(content).toContain("end_of_line = lf");
		expect(content).toContain("trim_trailing_whitespace = true");
		expect(content).toContain("indent_style = tab");
		expect(content).toContain("charset = utf-8");
		// Markdown/YAML override section (biome doesn't handle these formats)
		expect(content).toContain("[*.{md,yaml,yml}]");
		expect(content).toContain("indent_style = space");
		expect(content).toContain("indent_size = 2");
	});

	test("bunfig.toml is parseable and has expected settings", async () => {
		const content = await Bun.file(resolve(root, "bunfig.toml")).text();
		expect(content.length).toBeGreaterThan(0);
		expect(content).toContain("peer = false");
	});

	test("tests/factories/index.ts barrel has content", async () => {
		const file = Bun.file(resolve(root, "tests/factories/index.ts"));
		const content = await file.text();
		expect(content.length).toBeGreaterThan(0);
	});

	test(".gitattributes enforces LF line endings", async () => {
		expect(exists(".gitattributes")).toBe(true);
		const content = await Bun.file(resolve(root, ".gitattributes")).text();
		expect(content).toContain("* text=auto eol=lf");
	});
});

describe("AC2: Test directory structure", () => {
	test("required test subdirectories exist", () => {
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
	test("heartbeat.ts outputs expected message and exits cleanly", async () => {
		const proc = Bun.spawn(["bun", "run", "src/entry/heartbeat.ts"], {
			cwd: root,
			stdout: "pipe",
		});
		const output = await new Response(proc.stdout).text();
		const exitCode = await proc.exited;
		expect(output.trim()).toBe("Nyx heartbeat: scaffold operational");
		expect(exitCode).toBe(0);
	});

	test("bun.lock exists (bun install succeeded)", () => {
		expect(exists("bun.lock")).toBe(true);
	});

	test("start script points to heartbeat entry point", async () => {
		const pkg = await Bun.file(resolve(root, "package.json")).json();
		expect(pkg.scripts.start).toBe("bun run src/entry/heartbeat.ts");
	});
});
