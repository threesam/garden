
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const NVM_INC: string;
	export const NoDefaultCurrentDirectoryInExePath: string;
	export const CLAUDE_EFFORT: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const TERM_PROGRAM: string;
	export const SSL_CERT_FILE: string;
	export const SIMPLEFIN_ACCESS_URL: string;
	export const NODE: string;
	export const NVM_CD_FLAGS: string;
	export const PYENV_ROOT: string;
	export const INIT_CWD: string;
	export const SHELL: string;
	export const TERM: string;
	export const TMPDIR: string;
	export const CONDA_SHLVL: string;
	export const TERM_PROGRAM_VERSION: string;
	export const CONDA_PROMPT_MODIFIER: string;
	export const npm_config_npm_globalconfig: string;
	export const ZDOTDIR: string;
	export const npm_config_registry: string;
	export const SUPERSET_HOME_DIR: string;
	export const PNPM_HOME: string;
	export const ZSH: string;
	export const GIT_EDITOR: string;
	export const AI_AGENT: string;
	export const USER: string;
	export const NVM_DIR: string;
	export const SUPERSET_WORKSPACE_PATH: string;
	export const CONDA_EXE: string;
	export const npm_config_globalconfig: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const SUPERSET_WORKSPACE_NAME: string;
	export const SSH_AUTH_SOCK: string;
	export const OPENAI_KEY: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_execpath: string;
	export const VERCEL_PLUGIN_BOOTSTRAP_HINTS: string;
	export const PAGER: string;
	export const MKL_INTERFACE_LAYER: string;
	export const LSCOLORS: string;
	export const _CE_CONDA: string;
	export const npm_config_frozen_lockfile: string;
	export const npm_config_verify_deps_before_run: string;
	export const PATH: string;
	export const SUPERSET_PORT: string;
	export const CONDA_MKL_INTERFACE_LAYER_BACKUP: string;
	export const XML_CATALOG_FILES: string;
	export const npm_package_json: string;
	export const CONDA_PREFIX: string;
	export const PWD: string;
	export const npm_command: string;
	export const SUPERSET_WORKSPACE_ID: string;
	export const npm_config__jsr_registry: string;
	export const npm_lifecycle_event: string;
	export const LANG: string;
	export const SUPERSET_PANE_ID: string;
	export const npm_package_name: string;
	export const NODE_PATH: string;
	export const SUPERSET_ENV: string;
	export const RBENV_SHELL: string;
	export const npm_config_node_gyp: string;
	export const _CE_M: string;
	export const npm_package_version: string;
	export const pnpm_config_verify_deps_before_run: string;
	export const SUPERSET_ORIG_ZDOTDIR: string;
	export const HOME: string;
	export const PYENV_SHELL: string;
	export const SUPERSET_TAB_ID: string;
	export const SHLVL: string;
	export const SUPERSET_HOOK_VERSION: string;
	export const CLAUDE_CODE_EXECPATH: string;
	export const npm_config_save_exact: string;
	export const LOGNAME: string;
	export const LESS: string;
	export const CONDA_PYTHON_EXE: string;
	export const SUPERSET_ROOT_PATH: string;
	export const npm_config_only_built_dependencies: string;
	export const npm_lifecycle_script: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const NVM_BIN: string;
	export const BUN_INSTALL: string;
	export const CONDA_DEFAULT_ENV: string;
	export const npm_config_user_agent: string;
	export const CLAUDE_CODE_SESSION_ID: string;
	export const CLAUDECODE: string;
	export const COLORTERM: string;
	export const npm_node_execpath: string;
	export const NODE_ENV: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		NVM_INC: string;
		NoDefaultCurrentDirectoryInExePath: string;
		CLAUDE_EFFORT: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		TERM_PROGRAM: string;
		SSL_CERT_FILE: string;
		SIMPLEFIN_ACCESS_URL: string;
		NODE: string;
		NVM_CD_FLAGS: string;
		PYENV_ROOT: string;
		INIT_CWD: string;
		SHELL: string;
		TERM: string;
		TMPDIR: string;
		CONDA_SHLVL: string;
		TERM_PROGRAM_VERSION: string;
		CONDA_PROMPT_MODIFIER: string;
		npm_config_npm_globalconfig: string;
		ZDOTDIR: string;
		npm_config_registry: string;
		SUPERSET_HOME_DIR: string;
		PNPM_HOME: string;
		ZSH: string;
		GIT_EDITOR: string;
		AI_AGENT: string;
		USER: string;
		NVM_DIR: string;
		SUPERSET_WORKSPACE_PATH: string;
		CONDA_EXE: string;
		npm_config_globalconfig: string;
		PNPM_SCRIPT_SRC_DIR: string;
		SUPERSET_WORKSPACE_NAME: string;
		SSH_AUTH_SOCK: string;
		OPENAI_KEY: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_execpath: string;
		VERCEL_PLUGIN_BOOTSTRAP_HINTS: string;
		PAGER: string;
		MKL_INTERFACE_LAYER: string;
		LSCOLORS: string;
		_CE_CONDA: string;
		npm_config_frozen_lockfile: string;
		npm_config_verify_deps_before_run: string;
		PATH: string;
		SUPERSET_PORT: string;
		CONDA_MKL_INTERFACE_LAYER_BACKUP: string;
		XML_CATALOG_FILES: string;
		npm_package_json: string;
		CONDA_PREFIX: string;
		PWD: string;
		npm_command: string;
		SUPERSET_WORKSPACE_ID: string;
		npm_config__jsr_registry: string;
		npm_lifecycle_event: string;
		LANG: string;
		SUPERSET_PANE_ID: string;
		npm_package_name: string;
		NODE_PATH: string;
		SUPERSET_ENV: string;
		RBENV_SHELL: string;
		npm_config_node_gyp: string;
		_CE_M: string;
		npm_package_version: string;
		pnpm_config_verify_deps_before_run: string;
		SUPERSET_ORIG_ZDOTDIR: string;
		HOME: string;
		PYENV_SHELL: string;
		SUPERSET_TAB_ID: string;
		SHLVL: string;
		SUPERSET_HOOK_VERSION: string;
		CLAUDE_CODE_EXECPATH: string;
		npm_config_save_exact: string;
		LOGNAME: string;
		LESS: string;
		CONDA_PYTHON_EXE: string;
		SUPERSET_ROOT_PATH: string;
		npm_config_only_built_dependencies: string;
		npm_lifecycle_script: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		NVM_BIN: string;
		BUN_INSTALL: string;
		CONDA_DEFAULT_ENV: string;
		npm_config_user_agent: string;
		CLAUDE_CODE_SESSION_ID: string;
		CLAUDECODE: string;
		COLORTERM: string;
		npm_node_execpath: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
