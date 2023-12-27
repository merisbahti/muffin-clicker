<script lang="ts">
	import * as markdown from 'marked';

	markdown.setOptions({});

	const sanitizeHtml = (html: string) => {
		const entities = {
			'<': '&lt;',
			'>': '&gt;',
			'&': '&amp;',
			'"': '&quot;',
			"'": '&#39;'
		} as { [key: string]: string };

		return html.replace(/[<>&"']/g, (entity) => entities[entity]);
	};

	let content = $state(`# Heading1

<b>hello</b>
	`);

	let markdowned = $derived(markdown.parse(sanitizeHtml(content), {}));
</script>

<svelte:head>
	<title>Markdown editor</title>
</svelte:head>

<div>
	<h1>Markdown editor</h1>
	<div class="flex flex-row space-between">
		<div style="width: 100%">
			<textarea class="w-full" rows={10} bind:value={content} />
		</div>
		<div class="bg-gray-400 max-h-fit" style="width: 100%">
			{@html markdowned}
		</div>
	</div>
</div>

<style>
</style>
