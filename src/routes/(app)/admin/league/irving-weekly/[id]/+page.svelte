<script>
  import WeeklyPostEditor
    from '$lib/components/league/WeeklyPostEditor.svelte';

  export let data;
  export let form;

  $: post =
    form?.post ||
    data.post;
</script>

<WeeklyPostEditor
  {post}
  user={data.user}
  message={form?.message || form?.error}
/>