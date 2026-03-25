<script>
  // Supports either:
  //  A) a single `row` prop
  //  B) separate props: `breakdown`, `totals`, `points`

  export let row = null;
  export let breakdown = null;
  export let totals = null;
  export let points = null;

  // Normalize to one object
  $: b = (row?.breakdown ?? breakdown) || {};
  $: t = (b?.totals ?? row?.totals ?? totals) || {};

  // Prefer the DB score_total if present; otherwise breakdown totals
  $: total = Number(points ?? row?.points ?? t?.total ?? 0);

  $: pickedId = b?.pickedId != null ? `${b.pickedId}` : '';
  $: winnerId = b?.winnerHorseId != null ? `${b.winnerHorseId}` : '';
  $: wager = Number(b?.wager ?? 0);
  $: payout = Number(b?.payout ?? 0);
  $: hit = Boolean(b?.hit);
  $: delta = Number(b?.delta ?? 0);
  $: profit = hit ? (delta - wager) : delta; // lose stays -wager; win becomes wager*(payout-1)
 $: profitLabel = profit >= 0 ? `+${fmtInt(profit)}` : `${fmtInt(profit)}`;

  // Names (new schema uses winnerHorseName)
  $: pickedName = b?.pickedName ? String(b.pickedName) : '';

  // support both keys so we don't break old rows
  $: winnerHorseName =
    b?.winnerHorseName ? String(b.winnerHorseName)
    : b?.winnerName ? String(b.winnerName)
    : '';

  function fmtInt(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return '0';
    return String(Math.floor(x));
  }

  function fmtPayout(x) {
    const n = Number(x);
    if (!Number.isFinite(n) || n <= 0) return null;
    const shown = Number.isInteger(n) ? String(n) : String(n);
    return `${shown}x`;
  }

  $: pickedLabel =
    pickedName || (pickedId ? `Horse ${pickedId.replace(/^h_/, '')}` : '—');

  $: winnerLabel =
    winnerHorseName || (winnerId ? `Horse ${winnerId.replace(/^h_/, '')}` : '—');

  $: netLabel = delta >= 0 ? `+${fmtInt(delta)}` : `${fmtInt(delta)}`;
  $: payoutLabel = fmtPayout(payout);
</script>

<div class="chips">
  <span class="chip">Pick <strong>{pickedLabel}</strong></span>

  <span class="chip">Wager <strong>{fmtInt(wager)}</strong></span>


  <span class="chip chip--result">
    {#if hit}Hit ✅{:else}Miss ❌{/if}
  </span>

  {#if hit && payoutLabel}
  <span class="chip">Payout <strong>{payoutLabel}</strong></span>
{/if}

  <span class="chip">Profit <strong>{profitLabel}</strong></span>

  <span class="chip chip--total">Total <strong>{fmtInt(total)}</strong></span>
</div>


<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.25);
    font-size: 0.95rem;
    line-height: 1;
    white-space: nowrap;
  }

  .chip strong { font-weight: 700; }

  .chip--total {
    border-color: rgba(216, 180, 80, 0.35);
    background: rgba(216, 180, 80, 0.12);
  }

  .chip--result {
    border-color: rgba(80, 216, 150, 0.25);
    background: rgba(80, 216, 150, 0.10);
  }
</style>
