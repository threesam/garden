<script lang="ts">
	import modulesData from '../../../../data/messages/dianchik/modules-data.json';

	interface ExchangeMsg {
		sender: string;
		text: string;
	}

	interface FirstNightData {
		date: string;
		album: string;
		exchange: ExchangeMsg[];
	}

	const firstNight = (modulesData as Record<string, unknown>).first_night as FirstNightData | null;
</script>

{#if firstNight}
	<div>
		<div class="mb-3 flex items-baseline justify-between">
			<span class="font-mono text-xs tracking-label text-zinc-600">first night</span>
			<span class="font-mono text-[10px] text-zinc-600">{firstNight.album}</span>
		</div>
		<p class="mb-3 font-mono text-[10px] text-zinc-600">{firstNight.date}</p>
		<div class="space-y-1.5">
			{#each firstNight.exchange as msg, i (i)}
				{#if msg.sender === 'ellipsis'}
					<div class="py-1.5 text-center font-mono text-[10px] text-zinc-600">...</div>
				{:else}
					<div class="flex {msg.sender === 'sam' ? 'justify-end' : 'justify-start'}">
						<div
							class="max-w-[85%] rounded-xl px-3 py-1.5 text-sm leading-relaxed {msg.sender === 'sam'
								? 'bg-zinc-100 text-black'
								: 'bg-amber-50 text-black'}"
						>
							<p class="whitespace-pre-line">{msg.text}</p>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}
