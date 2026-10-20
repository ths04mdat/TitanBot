import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { playQuery, replyMusicSuccess, getPlayer } from '../../services/music/musicActions.js';
import { createEmbed } from '../../utils/embeds.js';
import { formatDuration } from '../../services/music/musicEmbeds.js';

export default {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Play and manage music playlists')
        .addSubcommand((sub) =>
            sub
                .setName('play')
                .setDescription('Load and play a playlist from a link')
                .addStringOption((opt) =>
                    opt
                        .setName('url')
                        .setDescription('Playlist link (Spotify, YouTube, SoundCloud, Apple Music)')
                        .setRequired(true),
                )
                .addBooleanOption((opt) =>
                    opt
                        .setName('shuffle')
                        .setDescription('Shuffle the playlist tracks upon loading? (Default: false)')
                        .setRequired(false),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName('info')
                .setDescription('View information about the currently playing playlist and queue'),
        ),

    async execute(interaction, config, client) {
        const deferred = await InteractionHelper.safeDefer(interaction, { flags: MessageFlags.Ephemeral });
        if (!deferred) {
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'play') {
            const url = interaction.options.getString('url');
            const shuffle = interaction.options.getBoolean('shuffle') ?? false;

            const result = await playQuery(client, interaction, url, { shuffle });
            await replyMusicSuccess(interaction, result.embed);
            return;
        }

        if (subcommand === 'info') {
            const player = getPlayer(client, interaction.guild.id);
            if (!player || (!player.current && player.queue.length === 0)) {
                const emptyEmbed = createEmbed({
                    title: '📋 Playlist / Queue Info',
                    description: 'No playlist or music is currently playing in this server.',
                    color: 'secondary',
                });
                return replyMusicSuccess(interaction, emptyEmbed);
            }

            const current = player.current;
            const queue = player.queue;
            const totalDurationMs = (current?.info?.length || 0) + queue.reduce((acc, t) => acc + (t.info?.length || 0), 0);

            const infoEmbed = createEmbed({
                title: '📋 Current Music Session Info',
                description: current
                    ? `**Now Playing:** [${current.info.title}](${current.info.uri || ''})\n**Artist:** ${current.info.author}`
                    : 'No track currently playing.',
                color: 'primary',
                fields: [
                    { name: 'Total Tracks', value: `${queue.length + (current ? 1 : 0)}`, inline: true },
                    { name: 'Total Duration', value: formatDuration(totalDurationMs), inline: true },
                    { name: 'Loop Mode', value: player.loop ? player.loop.toUpperCase() : 'OFF', inline: true },
                    { name: 'Queue Items', value: queue.length > 0 ? `${queue.length} track(s) waiting` : 'Queue is empty', inline: true },
                ],
                thumbnail: current?.info?.thumbnail || current?.info?.artworkUrl || null,
            });

            return replyMusicSuccess(interaction, infoEmbed);
        }
    },
};
