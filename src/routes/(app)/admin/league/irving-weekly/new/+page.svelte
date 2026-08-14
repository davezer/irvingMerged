<script>
  import WeeklyPostEditor
    from '$lib/components/league/WeeklyPostEditor.svelte';

  export let data;
  export let form;
</script>

<WeeklyPostEditor
  isNew={true}
  user={data.user}
  message={form?.error}
/>