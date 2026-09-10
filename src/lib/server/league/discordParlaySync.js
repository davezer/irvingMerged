function oddsLabel(value) {
  if (value == null || value === '') return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return `${number > 0 ? '+' : ''}${number}`;
}

function marketLabel(pick) {
  if (pick.bet_type === 'moneyline') return 'Moneyline';
  if (pick.bet_type === 'anytime_td') return 'Anytime TD';

  const parts = [];
  if (pick.direction) parts.push(String(pick.direction).toUpperCase());
  if (pick.current_line != null) parts.push(String(pick.current_line));
  parts.push(pick.market || String(pick.bet_type || '').replace(/_/g, ' '));
  return parts.filter(Boolean).join(' ');
}

function resultColor(result, status) {
  if (status === 'voided' || status === 'replaced') return 0x777777;
  switch (String(result || '').toUpperCase()) {
    case 'WIN': return 0x21c46b;
    case 'LOSS': return 0xe34b67;
    case 'PUSH': return 0xd2a63c;
    default: return 0x00e7ec;
  }
}

export function buildDiscordPickEmbed(pick) {
  const status = String(pick.status || 'active').toLowerCase();
  const result = String(pick.result || 'PENDING').toUpperCase();

  let title = `🏈 WEEK ${pick.week} PARLAY PICK`;
  if (status === 'voided') title = `🚫 WEEK ${pick.week} PICK · VOIDED`;
  if (status === 'replaced') title = `🔁 WEEK ${pick.week} PICK · REPLACED`;
  if (result === 'WIN') title = `✅ WEEK ${pick.week} PICK · WIN`;
  if (result === 'LOSS') title = `❌ WEEK ${pick.week} PICK · LOSS`;
  if (result === 'PUSH') title = `➖ WEEK ${pick.week} PICK · PUSH`;

  const fields = [
    { name: pick.team_name || pick.manager_name || 'Irving Manager', value: pick.manager_name || '—', inline: false },
    { name: pick.subject || 'Pick', value: marketLabel(pick), inline: false },
    { name: 'Odds', value: oddsLabel(pick.current_odds), inline: true },
    { name: 'Sportsbook', value: pick.sportsbook || 'Hard Rock', inline: true }
  ];

  if (pick.original_line !== pick.current_line || pick.original_odds !== pick.current_odds) {
    fields.push({
      name: 'Original submission',
      value: `${pick.original_line ?? '—'} @ ${oddsLabel(pick.original_odds)}`,
      inline: false
    });
  }

  if (pick.notes) {
    fields.push({ name: 'Notes', value: String(pick.notes).slice(0, 1000), inline: false });
  }

  return {
    title,
    color: resultColor(result, status),
    fields,
    footer: { text: `${pick.season} Irving Parlay · ${result}` }
  };
}

export async function syncDiscordPickMessage(env, pick) {
  const token = String(env?.DISCORD_BOT_TOKEN || '');
  const channelId = String(env?.DISCORD_PARLAY_CHANNEL_ID || '');
  const messageId = String(pick?.discord_message_id || '');

  if (!token || !channelId || !messageId) {
    return { synced: false, reason: !messageId ? 'message_not_linked' : 'discord_env_not_configured' };
  }

  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
    {
      method: 'PATCH',
      headers: {
        authorization: `Bot ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ embeds: [buildDiscordPickEmbed(pick)] })
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Discord message sync failed (${response.status}): ${body.slice(0, 300)}`);
  }

  return { synced: true };
}
