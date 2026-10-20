import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { playQuery, replyMusicSuccess } from '../../services/music/musicActions.js';

export default {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song, direct link, or playlist (YouTube/Spotify/SoundCloud)')
        .addStringOption((opt) =>
            opt
                .setName('query')
                .setDescription('Song name, track URL, or playlist link')
                .setRequired(true),
        )
        .addBooleanOption((opt) =>
            opt
                .setName('shuffle')
                .setDescription('Shuffle tracks if loading a playlist? (Default: false)')
                .setRequired(false),
        ),

    async execute(interaction, config, client) {
        const deferred = await InteractionHelper.safeDefer(interaction, { flags: MessageFlags.Ephemeral });
        if (!deferred) {
            return;
        }

        const query = interaction.options.getString('query');
        const shuffle = interaction.options.getBoolean('shuffle') ?? false;

        const result = await playQuery(client, interaction, query, { shuffle });
        await replyMusicSuccess(interaction, result.embed);
    },
};
