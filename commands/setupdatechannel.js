const { successEmbed, writeJSON, readJSON } = require("../functions")

module.exports = {
    name: "setupdatechannel",
    file: __filename,
    permission: "SERVER_OWNERS_ADMINS",
    async execute(client, interaction) {
        writeJSON("guilds", interaction.guild.id, interaction.options.getChannel("channel", true).id, `file[path]["updateChannel"] = data`)

        const embed = successEmbed()
            .setDescription(`The update channel is now <#${readJSON("guilds")[interaction.guild.id].updateChannel}>.`)

        await interaction.deferReply()
        await interaction.editReply({ embeds: [embed] })
    }
}