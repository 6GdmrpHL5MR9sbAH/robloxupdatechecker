const { MessageActionRow, MessageButton } = require("discord.js")
const { errorEmbed, noColourEmbed, readJSON } = require("../functions")

module.exports = {
    name: "createrolemenu",
    file: __filename,
    permission: "SERVER_OWNERS_ADMINS",
    async execute(client, interaction) {
        if (!readJSON("guilds")[interaction.guild.id].updateRole) {
            const embed = errorEmbed()
                .setDescription("An update role is required to use this. Use `/setupdaterole`.")

            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({ embeds: [embed] })
        } else {
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId("toggle update role")
                        .setLabel(`Toggle Roblox Update Role`)
                        .setStyle("PRIMARY")
                )

            const embed = noColourEmbed()
                .addField(`Roblox Update Role`, "Notifies you when Roblox updates.")

            await interaction.deferReply()
            await interaction.editReply({ embeds: [embed], components: [row] })
        }
    }
}