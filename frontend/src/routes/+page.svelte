<script>
	import { onMount } from 'svelte';
	import { fade, fly, scale, slide } from 'svelte/transition';
	import { cubicOut, quintOut } from 'svelte/easing';
	import { user } from '$lib/stores';
	import { goto } from '$app/navigation';

	let nick = '';
	let status = { type: '', msg: '' };
	let processing = false;
	let isBedrock = false;
	let password = '';
	let loggedIn = false;
	/**
	 * @type {string | null}
	 */
	let currentWhitelist = null;
	let mounted = false;
	let shake = false;

	onMount(async () => {
		mounted = true;
		const u = typeof localStorage !== 'undefined' ? localStorage.getItem('mp_user') : null;
		const p = typeof localStorage !== 'undefined' ? localStorage.getItem('mp_pass') : null;

		if (u && p) {
			user.set(u);
			password = p;
			loggedIn = true;

			try {
				const res = await fetch('/api/auth/login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ username: u, password: p })
				});

				if (!res.ok) throw new Error('Session expired');

				const data = await res.json();
				if (data.whitelistedNick) currentWhitelist = data.whitelistedNick;
			} catch (err) {
				logout();
			}
		} else {
			if ($user) {
				loggedIn = true;
			}
		}

        try {
            const configRes = await fetch('/config.json');
            if (configRes.ok) {
                const config = await configRes.json();
                logo1 = config.logo1 || logo1;
                logo2 = config.logo2 || logo2;
                logo3 = config.logo3 || logo3;
            }
        } catch (e) {
            console.error("Failed to load config", e);
        }
	});

    let logo1 = '(LOGO1)';
    let logo2 = '(LOGO2)';
    let logo3 = 'UNLUCKY MC';

	async function updateWhitelist() {
		if (!nick || nick.length < 3) {
			shakeError('Nickname muito curto ou inválido.');
			return;
		}

		processing = true;
		status = { type: '', msg: '' };

		try {
			const res = await fetch('/api/user/whitelist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: $user,
					password: password,
					nick: (isBedrock ? '.' : '') + nick
				})
			});
			const data = await res.json();

			if (res.ok) {
				status = { type: 'success', msg: 'Acesso liberado com sucesso!' };
				currentWhitelist = nick;
				nick = '';
			} else {
				throw new Error(data.error || 'Falha ao processar solicitação.');
			}
		} catch (e) {
			if (e instanceof Error) {
				shakeError(e.message);
			} else {
				shakeError('Ocorreu um erro desconhecido.');
			}
		} finally {
			processing = false;
		}
	}

	function logout() {
		user.set(null);
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('mp_pass');
		}
		loggedIn = false;
		status = { type: '', msg: '' };
		goto('/auth');
	}

	/**
	* @param {String} msg - error
	*/
	function shakeError(msg) {
		status = { type: 'error', msg };
		shake = true;
		setTimeout(() => (shake = false), 400);
	}
</script>

<div
	class="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#050505] font-sans text-white selection:bg-cyan-500/30 selection:text-cyan-200"
>
	<div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
		<div
			class="absolute inset-0 opacity-[0.03]"
			style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"
		></div>
		<div
			class="absolute top-[-20%] left-[-10%] h-[60vw] w-[60vw] animate-pulse rounded-full bg-blue-600/10 blur-[100px] duration-[5s]"
		></div>
		<div
			class="absolute right-[-10%] bottom-[-20%] h-[60vw] w-[60vw] rounded-full bg-cyan-600/10 blur-[120px]"
		></div>
	</div>

	<div class="relative z-10 flex w-full max-w-[460px] flex-col items-center p-4">
		<div class="mb-8 space-y-2 text-center">
			{#if mounted}
				<div in:fly={{ y: -20, duration: 800, easing: cubicOut }} class="relative inline-block">
					<h1
						class="bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-5xl font-black tracking-tighter text-transparent drop-shadow-sm"
					>
						{logo1} <span class="text-cyan-500">{logo3}{logo2}</span>
					</h1>
				</div>
				<div
					in:fly={{ y: 10, duration: 800, delay: 150, easing: cubicOut }}
					class="flex items-center justify-center gap-3"
				>
					<div class="h-[1px] w-8 bg-gradient-to-r from-transparent to-cyan-500/50"></div>
					<p class="font-mono text-[10px] font-bold tracking-[0.3em] text-cyan-500/80 uppercase">
						Espaço do Usuário
					</p>
					<div class="h-[1px] w-8 bg-gradient-to-l from-transparent to-cyan-500/50"></div>
				</div>
			{/if}
		</div>

		{#if loggedIn}
			<div
				in:scale={{ start: 0.95, duration: 500, easing: quintOut }}
				class="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 shadow-2xl ring-1 shadow-black ring-white/5 backdrop-blur-xl"
			>
				<div
					class="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 opacity-70"
				></div>

				<div class="space-y-6 p-6 sm:p-8">
					<div class="flex items-center justify-between border-b border-white/5 pb-6">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-zinc-800 to-black text-sm font-bold text-zinc-400 shadow-inner"
							>
								{$user ? $user.charAt(0).toUpperCase() : '?'}
							</div>
							<div class="space-y-0.5">
								<span class="block text-[10px] font-bold tracking-wider text-zinc-500 uppercase"
									>Logado como</span
								>
								<p class="text-sm font-bold tracking-wide text-white">{$user}</p>
							</div>
						</div>
						<button
							on:click={logout}
							class="group/logout flex items-center gap-2 rounded-lg border border-white/5 bg-zinc-800/50 px-3 py-1.5 text-xs font-bold tracking-wide text-zinc-400 uppercase transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
						>
							Sair
							<svg
								class="h-3 w-3 transition-transform group-hover/logout:translate-x-0.5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline
									points="16 17 21 12 16 7"
								/><line x1="21" x2="9" y1="12" y2="12" /></svg
							>
						</button>
					</div>

					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<label
								class="flex items-center gap-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
							>
								Status da Whitelist
							</label>
							{#if currentWhitelist}
								<span
									class="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[9px] font-bold text-green-400 shadow-[0_0_10px_-3px_rgba(74,222,128,0.3)]"
								>
									<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"></span> ATIVO
								</span>
							{:else}
								<span
									class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[9px] font-bold text-amber-400"
								>
									<span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span> PENDENTE
								</span>
							{/if}
						</div>

						{#if currentWhitelist}
							<div
								in:slide={{ duration: 400 }}
								class="group/card relative overflow-hidden rounded-xl border border-zinc-800 bg-black/40 p-6 text-center"
							>
								<div
									class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-50"
								></div>

								<div class="relative z-10 space-y-1">
									<p class="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
										ID Verificado
									</p>
									<div
										class="flex items-center justify-center gap-2 font-mono text-2xl font-bold tracking-wider text-white drop-shadow-lg"
									>
										{currentWhitelist}
										<svg
											class="h-5 w-5 text-green-400"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline
												points="22 4 12 14.01 9 11.01"
											/></svg
										>
									</div>
								</div>
							</div>
							<p class="text-center font-mono text-[10px] text-zinc-600">
								Para alterar seu nickname, entre em contato com o Administrador (Kowie) no Discord.
							</p>
						{:else}
							<div in:slide={{ duration: 400 }} class="space-y-4">
								<div class="group/input relative">
									<input
										type="text"
										bind:value={nick}
										disabled={processing}
										placeholder="Digite seu Nickname exato"
										class="w-full rounded-xl border border-zinc-700/50 bg-black/20 p-3.5 pl-11 font-mono text-sm text-white placeholder-zinc-600 transition-all outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
									/>
									<div
										class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within/input:text-cyan-500"
									>
										<svg
											class="h-4 w-4"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle
												cx="12"
												cy="7"
												r="4"
											/></svg
										>
									</div>
								</div>

								<div class="my-5 flex w-full items-center justify-between">
									<label
										for="bedrock"
										class="cursor-pointer text-[10px] font-bold tracking-widest text-zinc-500 uppercase transition-colors select-none peer-disabled:opacity-50 hover:text-cyan-400"
									>
										Minecraft Bedrock
									</label>
									<div class="relative flex items-center">
										<input
											id="bedrock"
											type="checkbox"
											bind:checked={isBedrock}
											disabled={processing}
											class="peer h-4 w-4 cursor-pointer appearance-none rounded border border-zinc-700 bg-black/40 transition-all checked:border-cyan-500 checked:bg-cyan-500 focus:ring-1 focus:ring-cyan-500/30 focus:ring-offset-0 disabled:opacity-50"
										/>
										<svg
											class="pointer-events-none absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-black opacity-0 transition-opacity peer-checked:opacity-100"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="4"
											stroke-linecap="round"
											stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg
										>
									</div>
								</div>

								<button
									on:click={updateWhitelist}
									disabled={processing}
									class="group/btn relative w-full overflow-hidden rounded-xl bg-white p-3.5 font-bold text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:bg-zinc-200 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
								>
									{#if processing}
										<div class="flex items-center justify-center gap-2">
											<span
												class="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
											></span>
											<span class="text-xs tracking-widest uppercase">Processando</span>
										</div>
									{:else}
										<span class="text-xs tracking-widest uppercase">Autorizar Acesso</span>
										<div
											class="group-hover/btn:animate-shimmer absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent"
										></div>
									{/if}
								</button>
							</div>
						{/if}
					</div>

					<div class="relative max-h-[2rem]">
						{#if status.msg}
							<div
								in:fly={{ y: -10, duration: 300 }}
								out:fade
								class="absolute inset-0 flex items-center justify-center {shake
									? 'animate-shake'
									: ''}"
							>
								<div
									class="flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold shadow-sm
                                {status.type === 'success'
										? 'border-green-500/20 bg-green-500/10 text-green-400'
										: 'border-red-500/20 bg-red-500/10 text-red-400'}"
								>
									{#if status.type === 'success'}
										<svg
											class="h-3.5 w-3.5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="3"
											stroke-linecap="round"
											stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg
										>
									{:else}
										<svg
											class="h-3.5 w-3.5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="3"
											stroke-linecap="round"
											stroke-linejoin="round"
											><line x1="18" y1="6" x2="6" y2="18"></line><line
												x1="6"
												y1="6"
												x2="18"
												y2="18"
											></line></svg
										>
									{/if}
									{status.msg}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<div
				in:fly={{ y: 20, duration: 600, delay: 100 }}
				class="relative w-full space-y-6 overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-8 text-center backdrop-blur-sm"
			>
				<div
					class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20"
				></div>

				<div
					class="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-zinc-800/50 text-zinc-500"
				>
					<svg
						class="h-8 w-8"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path
							d="M7 11V7a5 5 0 0 1 10 0v4"
						></path></svg
					>
				</div>

				<div class="relative z-10 space-y-2">
					<h3 class="text-xl font-bold text-white">Acesso Restrito</h3>
					<p class="mx-auto max-w-[200px] text-xs leading-relaxed text-zinc-500">
						Faça login para gerenciar sua whitelist e acessar o servidor.
					</p>
				</div>

				<button
					on:click={() => goto('/auth')}
					class="relative z-10 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 p-3.5 text-xs font-bold tracking-widest text-white uppercase shadow-lg shadow-cyan-900/20 transition-all hover:from-blue-500 hover:to-cyan-500 active:scale-[0.98]"
				>
					Fazer Login
				</button>
			</div>
		{/if}

		<div class="mt-8 flex justify-center gap-6 opacity-70">
			{#each [{ name: 'Discord', href: 'https://discord.gg/MxxG8dSFVU' }, { name: 'Kick', href: 'https://kick.com/b4dlucky' }, { name: 'Youtube', href: 'https://www.youtube.com/@B4DLUCKY' }] as link}
				<a
					href={link.href}
					target="_blank"
					class="transform text-[10px] font-bold tracking-widest text-zinc-600 uppercase transition-colors hover:scale-105 hover:text-cyan-400"
				>
					{link.name}
				</a>
			{/each}
		</div>
	</div>
</div>

<style>
	@keyframes shimmer {
		0% {
			transform: translateX(-150%) skewX(-12deg);
		}
		100% {
			transform: translateX(150%) skewX(-12deg);
		}
	}
	:global(.animate-shimmer) {
		animation: shimmer 2s infinite;
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-4px);
		}
		75% {
			transform: translateX(4px);
		}
	}
	.animate-shake {
		animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
	}
</style>
