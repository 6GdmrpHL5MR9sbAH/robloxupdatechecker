const { errorEmbed, successEmbed, writeJSON, readJSON } = require("../functions")

module.exports = {
    name: "setupdaterole",
    file: __filename,
    permission: "SERVER_OWNERS_ADMINS",
    async execute(client, interaction) {
        if (interaction.options.getRole("role", true) === interaction.guild.roles.everyone) {
            const embed = errorEmbed()
                .setDescription("Invalid role.")

            await interaction.deferReply({ ephemeral: true })
            await interaction.editReply({ embeds: [embed] })
        } else {
            writeJSON("guilds", interaction.guild.id, interaction.options.getRole("role", true).id, `file[path]["updateRole"] = data`)

            const embed = successEmbed()
                .setDescription(`The update role is now <@&${readJSON("guilds")[interaction.guild.id].updateRole}>.`)

            await interaction.deferReply()
            await interaction.editReply({ embeds: [embed] })
        }
    }
}