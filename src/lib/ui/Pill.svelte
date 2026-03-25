<script>
  export let tone = 'default'; // 'default' | 'gold' | 'green' | 'red'
</script>

<span class={`pill ${tone === 'gold' ? 'pill--gold' : ''} ${tone === 'green' ? 'pill--green' : ''} ${tone === 'red' ? 'pill--red' : ''}`}>
  <slot />
</span>
