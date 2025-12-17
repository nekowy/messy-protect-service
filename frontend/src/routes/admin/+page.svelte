<script>
    import { fly, fade, scale, slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    let secret = '';
    let authenticated = false;
    let loading = false;
    /**
	 * @type {{ users: any; tasks: any; bannedUsers: any; allUsers: any; } | null}
	 */
    let stats = null;
    let actionLoading = false;
    /**
	 * @type {string | any[] | null | undefined}
	 */
    let logs = []; 

    let target = '';
    let value = '';

    let dialog = {
        isOpen: false,
        type: 'alert',
        title: '',
        message: '',
        inputValue: '',
        placeholder: ''
    };
    /**
	 * @type {((arg0: string | null) => void) | null}
	 */
    let dialogResolve = null;

	/**
	* @param {String} msg - error
	*/
    function addLog(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
        if (logs) logs = [{ time: timestamp, msg, type }, ...logs.slice(0, 50)];
    }

	/**
	* @param {String} type
	* @param {String} title
	* @param {String} message
	*/
    function openDialog(type, title, message, placeholder = '') {
        dialog = { isOpen: true, type, title, message, inputValue: '', placeholder };
        return new Promise((resolve) => {
            dialogResolve = resolve;
        });
    }

    
    /**
	 * @param {string | boolean} result
	 */
    function handleDialogSubmit(result) {
        dialog.isOpen = false;
        if (dialogResolve) {
            if (dialog.type === 'prompt') {
                dialogResolve(result ? dialog.inputValue : null);
            } else {
                dialogResolve(typeof result === 'string' ? result : null);
            }
            dialogResolve = null;
        }
    }

    async function checkAuth() {
        if (!secret) return;
        loading = true;
        try {
            const res = await fetch('/api/admin/check', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ secret })
            });
            const data = await res.json();

            if (data.success) {
                authenticated = true;
                addLog('ROOT ACCESS GRANTED.', 'success');
                loadStats();
            } else {
                addLog('AUTHENTICATION FAILED. INVALID KEY.', 'error');
                secret = '';
                await openDialog('alert', 'SECURITY ALERT', 'ACCESS DENIED: Invalid Credentials.');
            }
        } catch (e) { 
            console.error(e);
            addLog('CONNECTION FAILURE', 'error');
        }
        loading = false;
    }

    async function loadStats() {
        try {
            const res = await fetch('/api/admin/stats', { headers: { 'x-admin-secret': secret } });
            stats = await res.json();
            addLog('Telemetry data synced.', 'info');
        } catch (e) {
            addLog('Failed to fetch telemetry.', 'error');
        }
    }

    /**
	 * @param {string} action
	 */
    async function performAction(action, userTarget = null) {
        const confirmMsg = userTarget 
            ? `EXECUTE [${action.toUpperCase()}] ON [${userTarget}]?` 
            : `EXECUTE GLOBAL [${action.toUpperCase()}]?`;

        const confirmed = await openDialog('confirm', 'CONFIRM ACTION', confirmMsg);
        if (!confirmed) return;
        
        const finalTarget = userTarget || target;
        let finalValue = value;
        
        if (action === 'set_whitelist') {
            const promptMsg = userTarget 
                ? `ENTER NEW NICKNAME FOR [${userTarget}]:`
                : "ENTER NEW NICKNAME:";
                
            finalValue = await openDialog('prompt', 'INPUT REQUIRED', promptMsg, 'New Whitelist ID...');
            if (!finalValue) {
                addLog('Action cancelled by user.', 'error');
                return;
            }
        }

        actionLoading = true;
        try {
            const res = await fetch('/api/admin/action', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    secret,
                    action,
                    target: finalTarget,
                    value: finalValue
                })
            });
            const data = await res.json();
            
            if (res.ok) {
                addLog(`COMMAND [${action}] EXECUTED SUCCESSFULLY.`, 'success');
                loadStats();
            } else {
                addLog(`EXECUTION ERROR [${action}]: ${data.error}`, 'error');
            }
        } catch(e) { 
            if (e instanceof Error) addLog(`FATAL ERROR: ${e.message}`, 'error');
        }
        actionLoading = false;
    }
</script>

<div class="h-screen w-full bg-black text-red-500 font-mono selection:bg-red-600 selection:text-black overflow-hidden relative flex flex-col">
    
    <div class="fixed inset-0 pointer-events-none z-50 opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
    <div class="fixed inset-0 pointer-events-none z-0" style="background-image: radial-gradient(circle at center, #110505 0%, #000000 100%);"></div>

    {#if dialog.isOpen}
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4" in:fade={{duration: 100}}>
            <div class="w-full max-w-md border border-red-600 bg-black shadow-[0_0_50px_rgba(220,38,38,0.2)]" in:scale={{start: 0.98, duration: 150, easing: quintOut}}>
                <div class="bg-red-900/20 text-red-500 font-bold px-4 py-2 uppercase flex justify-between items-center border-b border-red-800">
                    <span class="tracking-widest text-xs">{dialog.title}</span>
                    <span class="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
                </div>
                
                <div class="p-6 space-y-6">
                    <p class="text-md text-white font-bold tracking-wide leading-relaxed">{dialog.message}</p>
                    
                    {#if dialog.type === 'prompt'}
                        <input 
                            type="text" 
                            bind:value={dialog.inputValue} 
                            placeholder={dialog.placeholder}
                            autoFocus
                            class="w-full bg-black border border-red-800 p-3 text-white focus:outline-none focus:border-red-500 focus:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all uppercase placeholder-red-900"
                        />
                    {/if}

                    <div class="flex gap-3 justify-end pt-2">
                        {#if dialog.type !== 'alert'}
                            <button 
                                on:click={() => handleDialogSubmit(false)} 
                                class="px-6 py-2 border border-red-900 text-red-700 hover:text-red-500 hover:border-red-600 transition-colors uppercase text-xs font-bold tracking-wider"
                            >
                                Abort
                            </button>
                        {/if}
                        <button 
                            on:click={() => handleDialogSubmit(true)} 
                            class="px-6 py-2 bg-red-600 text-black hover:bg-red-500 font-bold uppercase text-xs tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                        >
                            {dialog.type === 'alert' ? 'ACKNOWLEDGE' : 'EXECUTE'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    {#if !authenticated}
        <div class="flex-1 flex items-center justify-center relative z-10 p-4 overflow-y-auto">
            <div in:fly={{ y: 20, duration: 800 }} class="w-full max-w-sm relative">
                
                <div class="border border-red-600 bg-black p-1 relative shadow-[0_0_60px_rgba(220,38,38,0.1)]">
                    <div class="absolute -top-px -left-px w-2 h-2 bg-red-600"></div>
                    <div class="absolute -bottom-px -right-px w-2 h-2 bg-red-600"></div>
                    <div class="absolute -top-px -right-px w-2 h-2 border-t border-r border-red-600"></div>
                    <div class="absolute -bottom-px -left-px w-2 h-2 border-b border-l border-red-600"></div>

                    <div class="border border-red-900/30 p-8 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                        <div class="text-center space-y-1">
                            <div class="inline-flex items-center gap-2 text-red-500 border-x border-red-900/50 px-4 py-1 text-[9px] uppercase tracking-[0.3em] bg-red-950/10">
                                <span class="w-1.5 h-1.5 bg-red-500 animate-pulse rounded-full"></span>
                                Powered by MessyProtector v2.3
                            </div>
                            <h1 class="text-4xl font-black text-white tracking-tighter mt-4">HIGH<span class="text-red-600">.ADMIN</span></h1>
                        </div>

                        <div class="space-y-6">
                            <div class="space-y-2 group">
                                <label class="text-[9px] text-red-700 font-bold uppercase tracking-widest group-focus-within:text-red-500 transition-colors">Decryption Key</label>
                                <div class="relative">
                                    <input 
                                        type="password" 
                                        bind:value={secret} 
                                        placeholder="••••••••" 
                                        on:keydown={(e) => e.key === 'Enter' && checkAuth()}
                                        class="w-full bg-black border border-red-900 p-4 text-center text-white placeholder-red-900/30 focus:outline-none focus:border-red-500 focus:bg-red-950/10 transition-all font-bold tracking-[0.5em] text-lg" 
                                    />
                                </div>
                            </div>
                            
                            <button 
                                on:click={checkAuth} 
                                disabled={loading}
                                class="w-full bg-red-700 hover:bg-red-600 text-black font-black p-4 uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] disabled:opacity-50 disabled:cursor-not-allowed clip-btn text-sm"
                            >
                                {loading ? 'Validating...' : 'Authenticate'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {:else}
        <header class="flex-none flex justify-between items-end border-b border-red-900/30 px-6 py-4 bg-black/80 backdrop-blur-md z-40">
            <div class="space-y-1">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 bg-red-600 shadow-[0_0_10px_#dc2626] animate-pulse"></div>
                    <h1 class="text-xl font-black tracking-tight text-white uppercase italic">Command<span class="text-red-600">///</span>Center</h1>
                </div>
                <p class="text-[9px] text-red-800 uppercase tracking-[0.3em] font-bold">Admin Clearance Verified</p>
            </div>
            <div class="flex items-center gap-4">
                <div class="hidden md:flex flex-col text-right border-r border-red-900/50 pr-4">
                    <span class="text-[9px] text-red-800 uppercase">Status</span>
                    <span class="text-xs font-mono text-green-500">ONLINE</span>
                </div>
                <button on:click={loadStats} class="bg-black hover:bg-red-950 border border-red-800 text-red-500 text-[10px] px-4 py-2 uppercase font-bold transition-all hover:border-red-500 tracking-wider">
                    Refresh Data
                </button>
            </div>
        </header>

        <main class="flex-1 overflow-hidden p-4 md:p-6 max-w-[1800px] w-full mx-auto flex flex-col gap-4 relative z-10">
            {#if stats}
                <div class="flex-none grid grid-cols-1 md:grid-cols-3 gap-4">
                    {#each [
                        { label: 'Active Users', val: stats.users, color: 'text-white' },
                        { label: 'System Tasks', val: stats.tasks, color: 'text-blue-400' },
                        { label: 'Banned IDs', val: stats.bannedUsers, color: 'text-red-600' }
                    ] as stat}
                    <div class="bg-black/50 border border-red-900/30 p-4 relative overflow-hidden group hover:border-red-600/50 transition-colors">
                        <p class="text-[9px] text-red-700 uppercase font-bold tracking-widest mb-1">{stat.label}</p>
                        <p class="text-3xl font-black {stat.color} font-mono">{stat.val}</p>
                        <div class="absolute bottom-0 left-0 h-0.5 w-full bg-red-950">
                            <div class="h-full bg-red-600 w-1/3 group-hover:w-full transition-all duration-700 ease-out"></div>
                        </div>
                    </div>
                    {/each}
                </div>

                <div class="flex-1 min-h-0 grid lg:grid-cols-4 gap-4">
                    <div class="lg:col-span-3 flex flex-col border border-red-900/30 bg-black/40 overflow-hidden relative">
                        <div class="flex-none flex items-center justify-between p-3 border-b border-red-900/30 bg-red-950/10 backdrop-blur-sm">
                            <h2 class="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <span class="text-red-600">::</span> User_Database
                            </h2>
                            <span class="text-[9px] text-red-500/70 border border-red-900/30 px-2 py-0.5">READ-WRITE</span>
                        </div>
                        
                        <div class="flex-1 overflow-auto custom-scrollbar">
                            <table class="w-full text-left text-xs font-mono">
                                <thead class="bg-black text-red-700 uppercase tracking-wider sticky top-0 z-10 shadow-lg shadow-black">
                                    <tr>
                                        <th class="p-3 bg-black border-b border-red-900/50">Identifier</th>
                                        <th class="p-3 bg-black border-b border-red-900/50">Whitelist_Nick</th>
                                        <th class="p-3 bg-black border-b border-red-900/50">Status</th>
                                        <th class="p-3 bg-black border-b border-red-900/50 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-red-900/10">
                                    {#each stats.allUsers as u}
                                        <tr class="hover:bg-red-900/10 transition-colors group">
                                            <td class="p-3 font-bold text-white tracking-wide">{u.username}</td>
                                            <td class="p-3 text-red-400/80">
                                                {#if u.whitelistedNick}
                                                    <span class="border border-red-900/30 px-2 py-0.5 bg-black/50 text-[10px]">{u.whitelistedNick}</span>
                                                {:else}
                                                    <span class="opacity-20 text-[10px]">-- NULL --</span>
                                                {/if}
                                            </td>
                                            <td class="p-3">
                                                {#if u.isBanned}
                                                    <span class="bg-red-600/20 text-red-500 border border-red-600/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">BANNED</span>
                                                {:else}
                                                     <span class="text-green-500/80 px-2 py-0.5 text-[9px] font-bold uppercase border border-green-900/30">Active</span>
                                                {/if}
                                            </td>
                                            <td class="p-3 flex gap-1 justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                                                {#if u.isBanned}
                                                     <button on:click={() => performAction('unban', u.username)} class="p-1.5 hover:bg-green-900/20 text-green-600 border border-transparent hover:border-green-800 transition-colors rounded-sm">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                                                     </button>
                                                {:else}
                                                     <button on:click={() => performAction('ban', u.username)} class="p-1.5 hover:bg-red-600 hover:text-black text-red-500 border border-transparent hover:border-red-600 transition-colors rounded-sm">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                                     </button>
                                                {/if}
                                                <button on:click={() => performAction('set_whitelist', u.username)} class="p-1.5 hover:bg-white hover:text-black text-white border border-transparent hover:border-white transition-colors rounded-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button on:click={() => performAction('clear_whitelist', u.username)} class="p-1.5 hover:bg-zinc-800 hover:text-white text-zinc-500 border border-transparent hover:border-zinc-700 transition-colors rounded-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="flex flex-col gap-4 overflow-hidden h-full">
                        <div class="flex-none bg-black border border-red-900/30 p-4 space-y-4 shadow-[0_0_20px_rgba(220,38,38,0.05)]">
                            <h2 class="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 border-b border-red-900/30 pb-2">
                                <span class="w-1.5 h-1.5 bg-red-500"></span> Manual Control
                            </h2>
                            
                            <div class="space-y-3">
                                <div class="space-y-1">
                                    <label class="text-[9px] font-bold uppercase text-red-800">Target User_ID</label>
                                    <input bind:value={target} class="w-full bg-red-950/5 border border-red-900/50 p-2 text-xs text-white focus:border-red-500 focus:outline-none focus:bg-red-900/20 font-bold placeholder-red-900/30" placeholder="Required..." />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[9px] font-bold uppercase text-red-800">Parameter Value</label>
                                    <input bind:value={value} class="w-full bg-red-950/5 border border-red-900/50 p-2 text-xs text-white focus:border-red-500 focus:outline-none focus:bg-red-900/20 font-bold placeholder-red-900/30" placeholder="Optional..." />
                                </div>
                                
                                <div class="grid grid-cols-2 gap-2 pt-1">
                                    <button on:click={() => performAction('ban')} class="bg-red-950/20 hover:bg-red-600 hover:text-black border border-red-900/50 text-red-500 p-2 text-[10px] font-bold uppercase transition-all">
                                        Ban
                                    </button>
                                    <button on:click={() => performAction('unban')} class="bg-green-950/10 hover:bg-green-600 hover:text-black border border-green-900/30 text-green-600 p-2 text-[10px] font-bold uppercase transition-all">
                                        Unban
                                    </button>
                                    <button on:click={() => performAction('set_whitelist')} class="col-span-2 bg-white/5 hover:bg-white hover:text-black border border-white/10 text-white p-2 text-[10px] font-bold uppercase transition-all">
                                        Force Nickname
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="flex-1 bg-black border border-red-900/30 p-0 flex flex-col relative overflow-hidden min-h-[200px]">
                            <div class="flex-none p-2 bg-red-950/10 border-b border-red-900/30 flex justify-between items-center">
                                <span class="text-[9px] text-red-500 uppercase tracking-wider">System_Log.txt</span>
                                <span class="w-1.5 h-1.5 bg-red-500 animate-ping rounded-full opacity-50"></span>
                            </div>
                            <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 font-mono text-[10px]">
                                {#each logs as log, i (i)}
                                    <div in:slide|local class="flex gap-2 break-all">
                                        <span class="text-red-800 shrink-0">[{log.time}]</span>
                                        <span class="{log.type === 'error' ? 'text-red-500 font-bold' : log.type === 'success' ? 'text-green-500' : 'text-zinc-400'}">
                                            > {log.msg}
                                        </span>
                                    </div>
                                {/each}
                                {#if logs && logs.length === 0}
                                    <span class="text-red-900/50 italic animate-pulse">> Waiting for input...</span>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </main>
    {/if}
</div>

<style>
    .clip-btn {
        clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #000;
        border-left: 1px solid #1a0505;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #330a0a;
        border-radius: 0px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #7f1d1d;
    }
</style>