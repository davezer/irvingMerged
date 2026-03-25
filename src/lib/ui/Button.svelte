<script>
  export let variant = 'primary'; // 'primary' | 'ghost' | 'danger'
  export let type = 'button';
  export let disabled = false;
</script>

<button
  class={`btn ${variant === 'ghost' ? 'btn--ghost' : ''} ${variant === 'danger' ? 'btn--danger' : ''}`}
  {type}
  {disabled}
>
  <slot />
</button>
