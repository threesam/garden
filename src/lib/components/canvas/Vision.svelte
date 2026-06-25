<script lang="ts">
  import Video from '$lib/components/Video.svelte';

  interface Props {
    src: string;
    poster?: string | undefined;
  }

  let { src, poster }: Props = $props();
</script>

<!--
  Something the author filmed. A place they went. A moment they kept.
  It plays. That's all it needs to do.
-->
<section class="w-full">
  <Video
    class="h-auto w-full"
    {src}
    {poster}
    controls={false}
    autoplay
    muted
    loop
    playsinline
  />
</section>
