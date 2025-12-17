<script>
    import { user } from '$lib/stores';
    import { goto } from '$app/navigation';
    import { fade, fly, scale } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';

    let tab = 'login';
    let username = '';
    let password = ''; 
    let generatedKey = ''; 
    let loading = false;
    let error = '';
    let copied = false;
    let showPassword = false;
    let shake = false;

    async function register() {
        if(!username || username.length < 3) { 
            shakeError("Username deve ter no mínimo 3 caracteres"); 
            return; 
        }
        
        loading = true; 
        error = '';
        
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao registrar');
            
            generatedKey = data.password;
        } catch(e) { 
			if (e instanceof Error) {
				shakeError(e.message);
			} else {
				shakeError('Ocorreu um erro desconhecido.');
			}
        } finally {
            loading = false;
        }
    }

    async function login() {
        if(!username || !password) { 
            shakeError("Preencha todos os campos"); 
            return; 
        }
        
        loading = true; 
        error = '';
        
        try {
             const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
             if (!res.ok) throw new Error(data.error || 'Credenciais inválidas');
             
             user.set(username);
             if (typeof localStorage !== 'undefined') {
                 localStorage.setItem('mp_pass', password);
             }
             goto('/');
        } catch(e) { 
            
			if (e instanceof Error) {
				shakeError(e.message);
			} else {
				shakeError('Ocorreu um erro desconhecido.');
			}
        } finally {
            loading = false;
        }
    }

    function copyToClipboard() {
        if(!generatedKey) return;
        navigator.clipboard.writeText(generatedKey);
        copied = true;
        setTimeout(() => copied = false, 2000);
    }


	/**
	* @param {String} t - error
	*/
    function switchTab(t) {
        if (tab === t) return;
        tab = t;
        error = '';
        if(t === 'register') generatedKey = '';
    }

	/**
	* @param {String} msg - error
	*/
    function shakeError(msg) {
        error = msg;
        shake = true;
        setTimeout(() => shake = false, 400);
    }
</script>

<div class="min-h-screen w-full relative flex items-center justify-center bg-[#050505] overflow-hidden font-sans text-white selection:bg-cyan-500/30 selection:text-cyan-200">
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
        <div class="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[100px] animate-pulse duration-[4s]"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-600/10 rounded-full blur-[120px]"></div>
    </div>

    <div in:fly={{ y: 30, duration: 1000, easing: cubicOut }} class="relative z-10 w-full max-w-[420px] p-4 sm:p-0">
        <div class="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black ring-1 ring-white/5 relative group">
            <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="p-8 pt-10">
                <div class="text-center mb-8 space-y-1 relative">
                    <h2 class="text-3xl font-black tracking-tight text-white drop-shadow-md">
                        (LOGO 3) <span class="text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600">Whitelist</span>
                    </h2>
                    <p class="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] hover:text-cyan-400 transition-colors cursor-default">
                        Acesso Restrito
                    </p>
                </div>

                <div class="relative grid grid-cols-2 bg-black/40 p-1 rounded-xl">
                    <button 
                        on:click={() => switchTab('login')} 
                        class="relative z-10 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors duration-200 bg-transparent {tab === 'login' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}"
                    >
                        Login
                    </button>
                    <button 
                        on:click={() => switchTab('register')} 
                        class="relative z-10 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors duration-200 {tab === 'register' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}"
                    >
                        Registro
                    </button>
                </div>

                <div class="relative h-10 mb-2">
                    {#if error}
                        <div 
                            in:fly={{ y: -10, duration: 200 }} 
                            out:fade={{ duration: 150 }}
                            class="absolute inset-0 flex items-center justify-center {shake ? 'animate-shake' : ''}"
                        >
                            <div class="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2 shadow-sm">
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                                <span>{error}</span>
                            </div>
                        </div>
                    {/if}
                </div>

                <div class="relative grid grid-cols-1 grid-rows-1 min-h-[220px]">
                    {#if tab === 'register' && generatedKey}
                        <div 
                            class="col-start-1 row-start-1 flex flex-col justify-between"
                            in:scale={{ start: 0.95, duration: 300, easing: cubicOut }}
                        >
                            <div class="text-center space-y-4">
                                <div class="w-14 h-14 bg-gradient-to-br from-green-500/20 to-emerald-900/20 rounded-full flex items-center justify-center mx-auto text-green-400 border border-green-500/30 shadow-[0_0_30px_-10px_rgba(74,222,128,0.3)]">
                                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                                <div>
                                    <h3 class="text-white font-bold text-lg">Sucesso!</h3>
                                    <p class="text-xs text-zinc-400 mt-1">Copie sua chave de acesso abaixo.</p>
                                </div>
                            </div>

                            <div class="relative group mt-4 mb-2">
                                <button 
                                    on:click={copyToClipboard}
                                    class="w-full bg-black/40 border border-dashed border-zinc-700 hover:border-cyan-500/50 hover:bg-black/60 rounded-xl p-4 font-mono text-cyan-400 text-sm text-center tracking-wide transition-all group-active:scale-[0.98]"
                                >
                                    {generatedKey}
                                    <div class="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {#if copied}
                                            <span class="text-green-400 text-[10px] font-bold uppercase">Copiado</span>
                                        {:else}
                                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                        {/if}
                                    </div>
                                </button>
                            </div>

                            <button on:click={() => {switchTab('login'); password=generatedKey;}} class="mt-auto w-full bg-zinc-100 hover:bg-white text-black font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all transform active:scale-[0.98] shadow-lg hover:shadow-white/10">
                                Ir para Login
                            </button>
                        </div>

                    {:else if tab === 'register'}
                        <form 
                            class="col-start-1 row-start-1 flex flex-col"
                            in:fly={{ x: 20, duration: 400, opacity: 0, easing: cubicOut }}
                            out:fly={{ x: -20, duration: 300, opacity: 0, easing: cubicOut }}
                            on:submit|preventDefault={register}
                        >
                            <div class="space-y-0">
                                <div class="space-y-1.5">
                                    <label for="reg-user" class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Username Desejado</label>
                                    <div class="relative group">
                                        <input 
                                            id="reg-user"
                                            type="text" 
                                            bind:value={username} 
                                            class="w-full bg-black/20 border border-zinc-700/50 focus:border-cyan-500/50 rounded-xl p-3.5 pl-10 text-white placeholder-zinc-600 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all font-mono text-sm" 
                                            placeholder="Seu Nickname"
                                            autocomplete="off"
                                        />
                                        <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-500 transition-colors pointer-events-none">
                                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        </div>
                                    </div>
                                    <p class="text-[10px] text-zinc-600 ml-1">Sua chave de acesso será gerada automaticamente.</p>
                                </div>
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={loading} 
                                class="mt-4 w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs transition-all active:scale-[0.98] shadow-lg shadow-cyan-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                            >
                                {#if loading}
                                    <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                {:else}
                                    Gerar Identidade <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                {/if}
                            </button>
                        </form>

                    {:else}
                        <form 
                            class="col-start-1 row-start-1 flex flex-col justify-between"
                            in:fly={{ x: -20, duration: 400, opacity: 0, easing: cubicOut }}
                            out:fly={{ x: 20, duration: 300, opacity: 0, easing: cubicOut }}
                            on:submit|preventDefault={login}
                        >
                            <div class="space-y-4">
                                <div class="space-y-1.5">
                                    <label for="login-user" class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Username</label>
                                    <div class="relative group">
                                        <input 
                                            id="login-user"
                                            type="text" 
                                            bind:value={username} 
                                            class="w-full bg-black/20 border border-zinc-700/50 focus:border-cyan-500/50 rounded-xl p-3.5 pl-10 text-white placeholder-zinc-600 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all font-mono text-sm" 
                                            placeholder="Seu username" 
                                        />
                                        <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-500 transition-colors pointer-events-none">
                                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        </div>
                                    </div>
                                </div>

                                <div class="space-y-1.5">
                                    <div class="flex justify-between items-center px-1">
                                        <label for="login-pass" class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Chave de Acesso</label>
                                    </div>
                                    <div class="relative group">
                                        <input 
                                            id="login-pass"
                                            type={showPassword ? 'text' : 'password'}
                                            bind:value={password} 
                                            class="w-full bg-black/20 border border-zinc-700/50 focus:border-cyan-500/50 rounded-xl p-3.5 pl-10 pr-10 text-white placeholder-zinc-600 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all font-mono text-sm" 
                                            placeholder="••••••••" 
                                        />
                                        <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-500 transition-colors pointer-events-none">
                                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                        </div>
                                        <button 
                                            type="button"
                                            on:click={() => showPassword = !showPassword}
                                            class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors cursor-pointer"
                                            tabindex="-1"
                                        >
                                            {#if showPassword}
                                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                                            {:else}
                                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                            {/if}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading} 
                                class="mt-8 w-full bg-white hover:bg-zinc-200 text-black font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                            >
                                {#if loading}
                                    <span class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                {:else}
                                    Acessar Sistema
                                {/if}
                            </button>
                        </form>
                    {/if}
                </div>
            </div>
            
            <div class="bg-black/20 p-4 text-center border-t border-white/5">
                <p class="text-[10px] text-zinc-600 font-mono">
                    Precisa de ajuda? <a href="https://discord.gg/MxxG8dSFVU" target="_blank" class="text-zinc-400 hover:text-cyan-400 underline decoration-zinc-700 hover:decoration-cyan-500 transition-all">Entre no Discord</a>
                </p>
            </div>
        </div>
    </div>
</div>

<style>
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
    }
    .animate-shake {
        animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
    }
</style>