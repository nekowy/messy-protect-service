<script>
	import '../app.css';
</script>

<svelte:head>
	<title>MessyProtect | Badlucky</title>
	<meta name="description" content="Premium Server Protection" />
</svelte:head>

<div class="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background opacity-80 pointer-events-none"></div>

<main class="min-h-screen flex flex-col font-mono tracking-tight">
	<slot />
</main>
