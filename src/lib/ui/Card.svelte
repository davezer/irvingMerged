<script>
  export let variant = 'default'; // 'default' | 'tight' | 'glow'
  export let className = '';
</script>

<div class={`card ${variant === 'tight' ? 'card--tight' : ''} ${variant === 'glow' ? 'card--glow' : ''} ${className}`}>
  <slot />
</div>
